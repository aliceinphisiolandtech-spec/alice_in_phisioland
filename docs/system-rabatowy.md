# System rabatowy — brief techniczny

Dokument dla osoby (lub agenta) wchodzącej w ten kod po raz pierwszy.
Opisuje **jak to działa i dlaczego tak**, ze szczególnym naciskiem na reguły,
których nie widać z samego czytania plików.

---

## 1. Zasada nadrzędna

**Kwota do zapłaty powstaje wyłącznie po stronie serwera.**

Przeglądarka nigdy nie liczy ceny — dostaje gotowy wynik i go wyświetla.
Kod rabatowy przysłany z frontu to *sugestia*, nie decyzja: serwer waliduje go
po raz drugi przy tworzeniu płatności i przelicza wszystko od nowa.

Jeśli dodajesz nowe źródło obniżki, musi ono przejść przez silnik cenowy.
Nie licz cen w komponentach.

---

## 2. Trzy źródła obniżki

| Typ | Model | Jak działa | Wymaga akcji klientki |
|---|---|---|---|
| **Kod rabatowy** | `DiscountCode` | wpisywany w koszyku | tak |
| **Przecena** | `Sale` | globalna, dla wszystkich | nie |
| **Zniżka dla puli osób** | `EmailDiscount` + `EmailDiscountMember` | po adresie e-mail zalogowanej osoby | nie |

Każdy z nich ma: typ wartości (procent / kwota), włącznik `isActive`,
opcjonalne okno czasowe (`validFrom` / `validUntil`), opcjonalny limit użyć
(`usageLimit` / `usedCount`) i flagę `isSandbox`.

Okno czasowe ustawia się **kalendarzem** (`components/ui/DatePicker`), zawsze
w pełnych dobach: `validFrom` to północ wybranego dnia, `validUntil` — jego
23:59:59.999. Godziny nie ma w panelu celowo — pozwalałaby wyłączyć promocję
w środku dnia sprzedaży przez pomyłkę w polu. Konwersje: `lib/date-input.ts`.

`Sale` zamiast kwotowego rabatu ma wariant **ceny docelowej** (`fixed_price`) —
„ma kosztować 89 zł" zamiast „−20 zł".

---

## 3. Reguły nakładania (najważniejsze)

Zaimplementowane w [`src/lib/pricing-engine.ts`](../src/lib/pricing-engine.ts),
funkcja `calculatePrice`.

1. **Obniżki automatyczne nie sumują się ze sobą.**
   Przecena i zniżka mailowa konkurują — wygrywa ta, która daje klientce niższą
   cenę. Bez tej zasady wystarczyłoby trafić na listę mailową w czasie promocji
   i cena spadałaby dwa razy bez niczyjej świadomej decyzji.

2. **Kod nakłada się na wynik punktu 1 tylko przy `stackableWithSale = true`.**
   Liczy się wtedy **sekwencyjnie** — od kwoty już obniżonej, nie od bazowej.

3. **Kod bez zgody na łączenie nie przepada.**
   Porównujemy go z wariantem automatycznym i naliczamy korzystniejszy.
   Gdy przegra, wynik ma `couponOutranked = true`, a koszyk mówi o tym wprost
   zamiast po cichu ignorować wpisany kod.

Przykład:

```
cena bazowa 109,00 zł, przecena −20%

kod −10%, stackable = false  →  87,20 zł  (wygrywa przecena, couponOutranked)
kod −30%, stackable = false  →  76,30 zł  (wygrywa kod)
kod −10%, stackable = true   →  78,48 zł  (sekwencyjnie: 87,20 − 10%)
```

**Niezmienniki**, które musi spełniać każdy wynik `calculatePrice`:

- suma `lines[].amount` === `totalDiscount`
- `baseAmount − totalDiscount` === `finalAmount`
- `finalAmount` >= `MIN_CHARGE_GROSZE` (200 gr — próg Stripe)

Ostatni punkt oznacza, że przy zbyt dużym rabacie kwota jest przycinana,
a rabat **przeliczany wstecz**, żeby liczby nadal się zgadzały.

---

## 4. Przepływ ceny

```
PricingSettings.basePriceGrosze
        │
        ├─ (tydzień testowy + tester) → TESTER_PRICE_GROSZE
        ├─ (piaskownica + admin)      → sandboxBasePriceGrosze
        ▼
   baseAmount
        │
        ▼
  calculatePrice(sales, emailDiscounts, coupon)
        │
        ▼
   PriceResult { baseAmount, lines[], totalDiscount, finalAmount }
        │
        ├──► /zakup (widok)
        ├──► /api/checkout/validate-coupon (podgląd kodu)
        └──► /api/checkout/intent → kwota do Stripe + snapshot w Order
```

Wszystkie trzy ścieżki wołają **ten sam** resolver:
[`resolveCheckoutPricing`](../src/lib/checkout-pricing.ts).
Dzięki temu podgląd i realne obciążenie nie mogą się rozjechać.

---

## 5. Piaskownica (tryb testowy)

Włącznik: `PricingSettings.sandboxEnabled`, przełączany z kafelka
„Klientka płaci teraz" w panelu.

**Semantyka:** piaskownica *nie wyłącza* trwających promocji. Izoluje to, co
w niej powstanie lub zostanie zmienione.

- każde utworzenie/edycja przy włączonym trybie ustawia `isSandbox = true`
- **przełącznik aktywności też liczy się jako edycja** — bez tego włączenie
  kodu w trybie testowym udostępniłoby go klientkom
- rabaty z `isSandbox` są filtrowane **w zapytaniu do bazy**, nie w widoku
- kod z piaskownicy zwraca klientce `not_found`, żeby testowa nazwa nie wyciekła
- cena zmieniona w piaskownicy trafia do `sandboxBasePriceGrosze`, nie do cennika

**Dwa wyjścia z trybu** (okno potwierdzenia, `toggleSandboxAction`):

| Przycisk | Co robi |
|---|---|
| „Opublikuj i wyłącz" | jedna transakcja: zdejmuje `isSandbox` ze wszystkich rabatów i przepisuje cenę testową na cennik |
| „Wyłącz bez publikacji" | gasi sam włącznik; flagi i cena testowa zostają, rabaty czekają jako wersje robocze |

Publikacja jest transakcyjna celowo — inaczej dałoby się skończyć z wyłączoną
piaskownicą i rabatami nadal ukrytymi przed klientkami. Wariant bez publikacji
robi to *świadomie* i mówi o tym wprost: kafel przy wyłączonym trybie pokazuje,
ile niepublikowanych zmian czeka w środku.

**Kto wchodzi w tryb:** admini oraz — wyłącznie poza produkcją — konta dev
z domeny `@local.dev`. Logika: `isSandboxActiveFor` w
[`pricing-settings.ts`](../src/lib/pricing-settings.ts). Na produkcji `IS_DEV`
jest `false`, więc jedynym wejściem zostaje rola admina.

**Zamówienia testowe** (`Order.isSandbox`):

- nie liczą się do żadnej statystyki (przychód, klienci, wykres, tabela zamówień,
  sumy rabatów)
- nie wywołują powiadomień o porzuconym koszyku
- **nie generują faktury** — niezależnie od środowiska
- nie konsumują limitu użyć prawdziwej promocji

---

## 6. Limity użyć

`usedCount` rośnie **dopiero po potwierdzonej płatności** (webhook), nigdy przy
wejściu do checkoutu. Inaczej porzucone koszyki zjadałyby pulę.

Wspólna implementacja dla trzech typów:
[`registerDiscountUsage`](../src/lib/discount-usage.ts).

Powiadomienie o wyczerpaniu wysyłane jest **dokładnie raz** — prawo do wysyłki
rezerwuje atomowy `updateMany` po `exhaustedNotifiedAt: null`, więc dwa
równoległe webhooki nie zdublują pusha.

**Limit jest miękki.** Przy stanie 19/20 dwie osoby jednocześnie w trakcie
płatności obie zapłacą i licznik dobije 21. Twardy limit wymagałby rezerwacji
miejsca na czas checkoutu — wtedy porzucony koszyk blokowałby pulę na
kilkanaście minut. Uznano, że przekroczenie o jedno-dwa jest tańsze.

Podniesienie limitu ponad dotychczasowe zużycie kasuje `exhaustedNotifiedAt`,
żeby przy kolejnym wyczerpaniu push poszedł ponownie.

---

## 7. Snapshot przy zamówieniu

`Order` zapisuje **stan z momentu zakupu**, nie referencję do konfiguracji:

| kolumna | znaczenie |
|---|---|
| `originalAmount` | cena przed wszystkimi obniżkami |
| `totalDiscountAmount` | suma obniżek |
| `discountCode` / `discountAmount` | nazwa i kwota z samego kodu |
| `saleName` / `saleAmount` | to samo dla przeceny |
| `emailDiscountName` / `emailDiscountAmount` | to samo dla zniżki mailowej |
| `discountCodeId` / `saleId` / `emailDiscountId` | ID — po nich webhook nalicza zużycie |

Nazwa **i** ID są zapisywane celowo: nazwa jest edytowalna, więc po zmianie
historia sprzedaży ma pokazywać to, co realnie obowiązywało; ID służy do
naliczenia zużycia właściwej promocji mimo zmiany nazwy.

Kolumny nie mają kluczy obcych — usunięcie promocji nie może naruszyć historii.

---

## 8. Cron

W schedulerze stoi **jeden** wpis: `GET|POST /api/cron/daily`, nagłówek
`Authorization: Bearer <CRON_SECRET>`, harmonogram `30 23 * * *`
(strefa Europe/Warsaw).

Zbiorcze zadanie odpala po kolei porządkowanie kodów rabatowych i wykrywanie
porzuconych koszyków. Zadania są niezależne — błąd jednego nie blokuje drugiego,
ale przebieg zwraca wtedy 500, żeby scheduler wysłał powiadomienie.

Porządkowanie kodów wyłącza te po terminie i powiadamia admina. **To wyłącznie
porządkowanie panelu** — egzekwowanie dat dzieje się przy każdej próbie użycia
(`evaluateDiscount`). Gdyby polegać tylko na cronie, kod działałby jeszcze
przez całą dobę po wygaśnięciu.

Logika obu zadań siedzi w [`lib/cron-tasks.ts`](../src/lib/cron-tasks.ts).
Endpointy `/api/cron/discount-codes` i `/api/cron/abandoned-carts` zostają jako
cienkie wrappery — do ręcznego odpalenia jednego zadania i na wypadek powrotu
porzuconych koszyków na częstszy cykl (przy dobowym przebiegu powiadomienie
dociera nawet ~24 h po porzuceniu, więc jest raportem, nie reakcją).

---

## 9. Bezpieczniki dev

| Co | Gdzie | Furtka |
|---|---|---|
| Faktury Fakturownia nie są wystawiane | [`actions/fakturownia.ts`](../src/app/actions/fakturownia.ts) | `FAKTUROWNIA_FORCE=true` |
| Faktura nigdy dla zamówienia z piaskownicy | webhook | — (działa też na produkcji) |
| Sentry nie startuje | `instrumentation-client.ts`, `sentry.*.config.ts` | — |
| OneSignal nie startuje | [`OneSignalInit.tsx`](../src/components/panel-kursanta/OneSignalInit.tsx) | `NEXT_PUBLIC_ONESIGNAL_DEV=true` |
| Dev login (5 klientów + admin) | [`lib/auth.ts`](../src/lib/auth.ts) | tylko poza produkcją |
| Przycisk losowych danych do faktury | `BillingForm.tsx` | tylko poza produkcją |
| Przesunięcie dzisiejszej daty | [`lib/dev-clock.ts`](../src/lib/dev-clock.ts) | `NEXT_PUBLIC_DEV_TODAY=RRRR-MM-DD` |

**Zegar aplikacji.** Cała domena rabatów pyta o „teraz" przez `now()`
z `lib/dev-clock.ts`, nigdy przez `new Date()` — dotyczy to `evaluateDiscount`,
`getDiscountStatus`, kalendarza i crona terminów. Poza produkcją
`NEXT_PUBLIC_DEV_TODAY` przestawia **samą datę** (godzina biegnie normalnie),
żeby nagrane szkolenie pokazywało te statusy, o których mówi lektor, a nie te
z dnia odtwarzania. Zmienna jest `NEXT_PUBLIC_`, bo tę samą datę musi widzieć
serwer i przeglądarka; na produkcji wartość nie powstaje w ogóle. Po zmianie
w `.env` trzeba **zrestartować dev serwer** — Next wstrzykuje ją przy starcie.

Bloki dev-only są gate'owane `process.env.NODE_ENV !== "production"` **w miejscu
tworzenia wartości**, nie tylko w renderze. Inaczej martwy kod (np. wywołanie
`signIn("dev-login")`) ląduje w produkcyjnym bundle.

---

## 10. Pułapki

- **Nie licz ceny w komponencie.** Zawsze `resolveCheckoutPricing`.
- **PaymentIntent powstaje przy zapisie danych do faktury**, nie przy kliknięciu
  „Zapłać". Jego kwoty nie da się zmienić, więc każda zmiana kodu unieważnia
  utworzoną płatność i wymusza ponowne potwierdzenie danych.
- **Cena regularna** (`regularPriceGrosze`) została w bazie, ale nie jest nigdzie
  pokazywana. Przekreślenie w koszyku pojawia się **tylko przy realnej obniżce**
  i przekreśla cenę sprzed niej.
- **`prisma generate` nie dokończy się przy działającym dev serwerze** (Windows
  blokuje `query_engine-windows.dll.node`). Po migracji: zatrzymaj serwer →
  `npx prisma generate` → uruchom ponownie. Sam restart jest konieczny również
  dlatego, że `src/lib/prisma.ts` trzyma instancję klienta na `globalThis`, więc
  stary klient przeżywa HMR i zwraca `Unknown argument`.
- **Migracje stosowane są ręcznie**, bo `prisma migrate dev` wywraca się na BOM
  w `0_init`. Procedura: `prisma db execute --file <migracja>` →
  `prisma migrate resolve --applied <nazwa>`.

---

## 11. Mapa plików

**Logika (czysta, testowalna):**
- `src/lib/pricing.ts` — stałe, `formatPln`, cena bazowa
- `src/lib/discounts.ts` — `computeDiscount`, `evaluateDiscount`, statusy
- `src/lib/pricing-engine.ts` — `calculatePrice`, reguły nakładania
- `src/lib/dev-clock.ts` — `now()` / `today()`, przesunięcie daty w dev
- `src/lib/date-input.ts` — ISO ↔ wartość pola formularza

**Serwer:**
- `src/lib/checkout-pricing.ts` — resolver wyceny (jedyne wejście)
- `src/lib/pricing-settings.ts` — ustawienia + reguły piaskownicy
- `src/lib/coupons.ts` — walidacja kodu
- `src/lib/discount-usage.ts` — naliczanie limitów

**API:**
- `src/app/api/checkout/intent` — tworzy płatność i zamówienie
- `src/app/api/checkout/validate-coupon` — podgląd kodu (rate limit 10/min)
- `src/app/api/checkout/webhook` — nadaje dostęp, nalicza zużycie, faktura
- `src/app/api/cron/daily` — jedyny wpis w schedulerze, odpala oba zadania
- `src/app/api/cron/discount-codes` — porządkowanie terminów (ręcznie)
- `src/lib/cron-tasks.ts` — logika zadań + wspólna autoryzacja `CRON_SECRET`

**Panel:** `src/app/admin/rabaty/` — zakładki, formularze, wspólne klocki
w `_shared.tsx`

**Akcje:** `src/app/actions/{discounts,sales,email-discounts,pricing-settings}.ts`

---

## 12. Stan otwarty

- `CRON_SECRET` **nie jest ustawiony** w `.env` — wszystkie endpointy `/api/cron`
  zwracają 500 („Not configured"), łącznie ze zbiorczym `/api/cron/daily`.
- `ONESIGNAL_REST_API_KEY` w `.env` vs `ONESIGNAL_API_KEY` czytane
  w `src/lib/notifications.ts` — push z cronów nie wychodzi, zostaje sam wpis
  `AdminNotification` w bazie.
- Licznik „Sprzedane E-booki" na dashboardzie liczy wiersze `Purchase`, a ta
  tabela nie ma flagi piaskownicy — zakup testowy podbija go o 1.
- Pełna ścieżka zakupu (Stripe → webhook → dostęp) nie została zweryfikowana
  end-to-end; sprawdzono logikę, typy, build i zapytania do bazy.
