# Lista oczekujących — brief techniczny

Dokument dla osoby (lub agenta) wchodzącej w ten kod po raz pierwszy.
Opisuje **jak to działa i dlaczego tak**, ze szczególnym naciskiem na decyzje,
których nie widać z samego czytania plików.

Zakres: kompletny system — publiczne strony zapisów z integracją MailerLite
(Etap 1) oraz kreator tych stron w panelu admina (Etap 2).

---

## 1. Zasada nadrzędna

**Najpierw nasza baza, potem MailerLite.**

Zapis do `WaitlistSubscriber` decyduje o tym, czy użytkownik zobaczy sukces.
Wysyłka do MailerLite jest krokiem drugim i jej niepowodzenie **nie może
kosztować nas kontaktu** — rekord zostaje wtedy w stanie „do dosłania"
i wraca w dobowym cronie.

Konsekwencja projektowa: żadna funkcja w `src/lib/mailerlite.ts` nie rzuca
wyjątkiem. Każda zwraca wynik z rozróżnialnym powodem, bo wywołujący musi umieć
odróżnić „nie udało się, spróbujemy później" od „nie uda się nigdy".

---

## 2. Mapa plików

**Domena (czyste moduły — testowalne bez bazy):**

| Plik | Rola |
|---|---|
| `src/lib/waitlist-status.ts` | reguła okna zapisów + opis statusu na plakietkę |
| `src/lib/waitlist-text.ts` | podświetlanie fragmentu nagłówka |
| `src/lib/waitlist-appearance.ts` | układy, motywy, klasy CSS — wspólne dla panelu i strony |
| `src/lib/validators/waitlist.ts` | schematy zod (zapis kontaktu i zapis kampanii) + slugify |
| `src/lib/csv.ts` | budowanie plików CSV |

**Warstwa serwerowa:**

| Plik | Rola |
|---|---|
| `prisma/schema.prisma` | modele `WaitlistPage` i `WaitlistSubscriber` |
| `src/lib/waitlist.ts` | zapis kontaktu, synchronizacja, zadanie crona |
| `src/lib/mailerlite.ts` | klient API v2 — jedyne miejsce, które gada z MailerLite |
| `src/app/actions/waitlist.ts` | akcje kreatora (CRUD, kopia, włącznik) |
| `src/app/api/waitlist/route.ts` | publiczny endpoint zapisu |
| `src/app/api/admin/mailerlite/groups/route.ts` | lista grup do kreatora (cache 60 s) |
| `src/app/api/admin/waitlist/[id]/export/route.ts` | pobranie zapisów jako CSV |

**Strona publiczna:**

| Plik | Rola |
|---|---|
| `src/app/zapisy/[slug]/page.tsx` | strona kampanii — 3 układy, tło, logo, stopka |
| `src/app/zapisy/layout.tsx` | bezbarwny szkielet (nie zna motywu — patrz §8) |
| `src/components/site/waitlist/WaitlistForm.tsx` | formularz zapisu |

**Panel (`/admin/zapisy`):**

| Plik | Rola |
|---|---|
| `data.ts` | pobranie kampanii i serii dziennych |
| `page.tsx` | sam widok |
| `WaitlistManager.tsx` | spina listę z formularzem |
| `WaitlistPageForm.tsx` | kreator |
| `FormPreview.tsx` | podgląd treści na żywo |
| `CampaignCard.tsx` | kampania na liście: link, statystyki, akcje |
| `SignupsChart.tsx` | wykres zapisów |
| `src/components/admin/ui/primitives.tsx` | klocki panelu wspólne z rabatami |

**Skrypty (alternatywa dla kreatora, przydatne przy pierwszym uruchomieniu):**

| Plik | Rola |
|---|---|
| `prisma/seedWaitlist.js` | zakłada/aktualizuje kampanię z pliku |
| `scripts/mailerlite-groups.js` | wypisuje ID grup z konta MailerLite |

---

## 3. Skąd bierze się treść i wygląd strony

**Z bazy, nie z kodu.** Strona `/zapisy/<slug>` renderuje rekord `WaitlistPage`
— łącznie z układem, motywem i grafiką. Nowa kampania to nowy wiersz zakładany
z panelu, nigdy nowy plik.

Rekord da się też założyć skryptem (`npm run waitlist:seed`) — strona nie wie,
skąd pochodzi. To był świadomy fundament Etapu 1: dzięki niemu kreator z Etapu 2
okazał się formularzem CRUD nad istniejącą tabelą, bez migracji danych ani
przepisywania pierwszej kampanii.

Nagłówek ma opcjonalne pole `highlight` — fragment do podkreślenia akcentem.
Podświetlenie działa przez dopasowanie tekstu w `headline` (bez rozróżniania
wielkości liter), żeby w kreatorze wpisywać normalne zdanie zamiast rozbijać
je na „przed/po". Gdy fragment nie występuje, nagłówek renderuje się w całości —
patrz `lib/waitlist-text.ts`.

### Układy i motywy

W kolumnach `layoutVariant` i `theme` siedzi **klucz**, nigdy klasy CSS. Gdyby
w bazie były klasy Tailwinda, każda zmiana designu wymagałaby migracji danych,
a kampanie sprzed zmiany wyglądałyby inaczej niż nowe. Mapowanie klucz → klasy
jest w `lib/waitlist-appearance.ts`; nieznana wartość spada na wariant domyślny,
więc ręczna edycja w bazie nie wywali strony.

Klasy są wypisane w całości, bez sklejania (`bg-${color}`) — Tailwind skanuje
kod statycznie i klasa zbudowana z fragmentów nie trafiłaby do builda. Stąd
powtórzenia w `THEME_TOKENS`; to nie jest niedopatrzenie.

Grafika nagłówka renderuje się zwykłym `<img>`, nie `next/image`. Powód: adres
wpisuje klientka w kreatorze, a `next/image` przepuszcza wyłącznie hosty
wypisane w `next.config.ts`. Wymaganie wpisu w konfiguracji przy każdej nowej
kampanii przekreślałoby sens kreatora, a otwarcie listy na „dowolny host"
zamieniłoby nasz serwer w darmowy optymalizator cudzych obrazków.

### Dwa różne zdjęcia

| Pole | Gdzie się pojawia |
|---|---|
| `heroImageUrl` | osobny blok: góra karty w „hero", lewa kolumna w „split" |
| `backgroundImageUrl` | wypełnia całą kartę, pod nakładką w kolorze marki |

Warstwy karty ze zdjęciem, w tej kolejności (patrz `SurfaceCard`):

1. kolor tła karty,
2. zdjęcie,
3. nakładka o kryciu z `overlayOpacity` (0–100, domyślnie 50),
4. treść.

Warstwa 1 to zabezpieczenie: przy zdjęciu w tle karta dostaje jako tło **kolor
nakładki**, więc gdy zdjęcie się nie wczyta (zły adres, host offline), karta
zostaje ciemna i jasny tekst nadal da się przeczytać. Awaria degraduje wygląd,
nie treść.

Krycie idzie atrybutem `style`, nie klasą — Tailwind skanuje kod statycznie
i `opacity-[${x}]` sklejone z liczby nigdy nie trafiłoby do builda.

**Treść na zdjęciu przełącza się na jasną automatycznie.** Robi to
`resolveSurfaceTokens()` w `lib/waitlist-appearance.ts`: nakładka jest zawsze
ciemna, więc niezależnie od motywu nagłówek, opis, pola i przycisk dostają
wariant „na ciemnym". Bez tego motyw „Zielony" miałby ciemnozielony napis
na ciemnozielonej nakładce.

Dlatego `CampaignSurface` przyjmuje nagłówek, opis i formularz jako **funkcje
tokenów**, a nie gotowe węzły — tylko powłoka wie, co leży w karcie (tokeny
„na zdjęciu"), a co obok niej (tokeny motywu, przypadek układu „dwie kolumny").

---

## 4. Okno zapisów

`resolveWaitlistPageStatus()` zwraca `open` | `not_started` | `closed`.

Kolejność sprawdzeń jest istotna:

1. `isActive` (ręczny włącznik) **ma pierwszeństwo przed datami** — wyłączenie
   kampanii musi działać natychmiast, także w środku okna czasowego.
2. Start przed końcem — przy sprzecznych datach strona pokazuje „jeszcze nie",
   a nie „już po".

Granice są **domknięte**: dokładnie w sekundzie `opensAt` zapisy są już otwarte,
w sekundzie `closesAt` — jeszcze otwarte.

Reguła jest sprawdzana **dwa razy**: przy renderowaniu strony i ponownie
w endpoincie. Między wyświetleniem formularza a kliknięciem „Zapisz się"
kampania mogła zostać zamknięta.

Moduł jest celowo wolny od importów serwerowych, więc testuje się bez bazy —
`src/lib/waitlist-status.test.ts`, uruchamiane przez `npm test`.

---

## 5. Stany synchronizacji z MailerLite

Kolumna `WaitlistSubscriber.syncStatus`:

| Stan | Znaczenie | Czy cron ponawia |
|---|---|---|
| `synced` | kontakt jest na liście w MailerLite | nie |
| `pending` | błąd chwilowy (sieć, 5xx, limit zapytań) | **tak** |
| `failed` | błąd trwały (zły klucz, adres odrzucony) | nie — wymaga decyzji człowieka |
| `skipped` | zebrany, zanim konto MailerLite było podpięte | **tak**, gdy klucz już jest |

Rozróżnienie `pending` / `failed` robi `isRetryable()` w `src/lib/mailerlite.ts`.
Bez niego cron albo zapętlałby się na trwale zepsutym kluczu, albo porzucał
kontakty przy jednej chwilowej awarii.

`skipped` wraca do kolejki, bo cron w ogóle nie dochodzi do zapytania bez klucza
API — samo znalezienie rekordu w tym zapytaniu oznacza, że powód pominięcia
właśnie zniknął. Dzięki temu kontakty zebrane przed konfiguracją konta dosyłają
się same, bez ręcznego przestawiania w bazie.

Cron bierze `pending` i `skipped` z `syncAttempts < 5`, paczkami po 100.
Wpięty w `/api/cron/daily` jako ostatnie zadanie — jest sieciowe, więc
najbardziej podatne na timeout, i nie ma blokować dwóch pozostałych.

**Duplikaty nie są problemem.** `POST /subscribers` w MailerLite działa jak
upsert: istniejący kontakt zostaje zaktualizowany i dopisany do grupy (200
zamiast 201). Nie sprawdzamy więc wcześniej, czy adres istnieje, i nie ma
wyścigu przy dwóch równoczesnych zapisach.

---

## 6. Licznik miejsc — stan prawny (przeczytaj przed zmianami)

`lib/waitlist-scarcity.ts` ma dwa tryby i wybiera je **na podstawie danych**,
nie flagi w kodzie:

| Kampania | Co widzi odwiedzający | Ocena |
|---|---|---|
| ma ustawiony `maxSignups` | prawdziwe „zostało X z Y" | w porządku |
| nie ma limitu | pula wyliczana, rośnie sama, nigdy nie schodzi do zera | **praktyka z czarnej listy** |

Wariant bez limitu pokazuje liczby, które nie odpowiadają rzeczywistości, w celu
wywołania presji. To wpisuje się w praktyki wprowadzające w błąd z ustawy
z 23 sierpnia 2007 r. o przeciwdziałaniu nieuczciwym praktykom rynkowym
(art. 5, a w wariancie „ograniczona dostępność" — art. 7, czyli lista praktyk
nieuczciwych **w każdych okolicznościach**, bez badania skutków). Podstawa
unijna: załącznik I do dyrektywy 2005/29/WE. Po wdrożeniu dyrektywy Omnibus
kary UOKiK sięgają 10% obrotu.

Odpowiada przedsiębiorca prowadzący sprzedaż, nie wykonawca oprogramowania.
Funkcja została zamówiona świadomie, po przedstawieniu tego ryzyka.

**Wyłączenie nie wymaga zmiany kodu** — wystarczy ustawić kampanii prawdziwy
limit miejsc. Licznik automatycznie przechodzi na liczby prawdziwe, bo decyduje
o tym `resolveSeats()`. Nic nie zostaje do posprzątania, bo wyliczana pula nigdy
nie trafia do bazy.

---

## 7. RODO

Przy **każdym** kontakcie zapisujemy kopię treści zgody (`consentText`),
znacznik czasu, IP i user agenta.

Kopia, a nie relacja do strony — bo treść zgody na stronie może się później
zmienić, a wykazać trzeba tę, którą dana osoba faktycznie widziała w chwili
zapisu. Zmiana tekstu w kreatorze **nie zmienia zgód już zebranych** i o to chodzi.

Treść zgody przychodzi ze strony (z bazy), nigdy z żądania — przeglądarka
mogłaby przysłać dowolny tekst.

Administratorem danych jest klientka, nie my.

---

## 7. Zabezpieczenia publicznego endpointu

Endpoint jest otwarty i linkowany wprost z posta w social mediach.

- **Honeypot** — ukryte pole `website`. Wypełnione = bot. Odpowiadamy wtedy
  **sukcesem** i nic nie zapisujemy: bot nie dostaje sygnału, że pułapka
  zadziałała, więc nie ma czego obchodzić.
- **Limit zapytań** — 30 prób / 10 minut na IP. Świadomie luźny: ruch idzie
  z telefonów, a operatorzy komórkowi trzymają setki klientów za jednym adresem
  (CGNAT). Ciasny limit odciąłby realne zapisy w szczycie kampanii, a przed
  zmasowanym botem i tak nie chroni — ten zmienia IP.
- **Walidacja zod** przed dotknięciem bazy.

Limiter (`src/lib/rate-limit.ts`) żyje w pamięci procesu, więc na serverless
liczy per instancja. To zabezpieczenie „best effort" — świadome ograniczenie
opisane w samym pliku.

---

## 8. Dlaczego strona jest poza grupą `(site)`

Strona kampanijna ma jedno zadanie: zebrać adres. Pełna nawigacja dawałaby
kilkanaście wyjść z tej strony, więc `src/app/zapisy/layout.tsx` zostawia samo
logo i minimalną stopkę z linkami wymaganymi prawnie.

Strony są też **poza indeksem** (`noIndex` + wpis w `robots.ts`): są tymczasowe,
a zaindeksowana zamknięta promocja to martwy wynik w Google konkurujący ze
stroną główną. Na działanie linku z posta nie ma to żadnego wpływu.

---

## 9. Uruchomienie kampanii — kolejność kroków

**Normalna droga (z panelu):**

1. `/admin/zapisy` → „Nowa strona"
2. wypełnij treść, wybierz grupę MailerLite, układ i motyw
3. zapisz — strona powstaje **wyłączona**
4. sprawdź przyciskiem „Podgląd", włącz suwakiem, skopiuj link do posta

**Droga awaryjna (z pliku), gdy panel jest niedostępny:**

```bash
# 1. Migracja bazy (raz, na każdym środowisku)
npx prisma migrate deploy

# 2. Odczytaj ID grupy z MailerLite
npm run waitlist:groups

# 3. Wpisz to ID (i treści) w prisma/seedWaitlist.js, potem:
npm run waitlist:seed
```

Wymagane zmienne w `.env` (szablon: `.env.example`):

```
MAILERLITE_API_KEY="..."          # MailerLite → Integrations → API
MAILERLITE_DOUBLE_OPT_IN="false"  # "true" = zapis potwierdzany mailem
```

`seedWaitlist.js` jest **idempotentny** (upsert po slugu) — można go puszczać
po każdej zmianie treści, zebrane adresy zostają nietknięte.

**Bez `MAILERLITE_API_KEY` strona nadal działa** i zbiera adresy do naszej bazy
ze statusem `skipped`. Po uzupełnieniu klucza pierwszy przebieg crona dosyła je
sam — nie trzeba niczego przestawiać ręcznie. Kampanię można więc wypuścić,
zanim konto MailerLite będzie gotowe.

### Double opt-in

`MAILERLITE_DOUBLE_OPT_IN="true"` wysyła kontakt ze statusem `unconfirmed`,
co uruchamia po stronie MailerLite maila z linkiem potwierdzającym. Poprawia
dostarczalność kosztem części zapisów (nie każdy kliknie).

Zgodę marketingową i tak zbieramy na naszym formularzu i zapisujemy w bazie,
więc double opt-in jest tu **dodatkową warstwą, nie warunkiem legalności**.
To decyzja biznesowa klientki.

---

## 10. Zakres widoczny w panelu (ważne)

Projekt był rozliczany etapami i panel odzwierciedla to wprost. Decyduje
zmienna środowiskowa:

```
WAITLIST_BUILDER_ENABLED="false"   # domyślnie — widok Etapu 1
WAITLIST_BUILDER_ENABLED="true"    # pełny kreator (Etap 2)
```

| Wyłączone (domyślnie) | Włączone |
|---|---|
| `/admin/zapisy` → `SimpleWaitlistControl`: link, licznik, wyłącznik | `WaitlistManager`: pełna lista z operacjami |
| `/admin/zapisy/nowa` → 404 | kreator nowej kampanii |
| `/admin/zapisy/<id>` → 404 | kreator edycji |

Blokada siedzi **na trasach**, nie tylko na przyciskach — adresy są łatwe do
odgadnięcia. `notFound()` zamiast komunikatu „wykupione?": funkcja, której nie
udostępniono, ma po prostu nie istnieć.

Flaga zamiast usunięcia kodu jest świadoma: odblokowanie ma być zmianą jednej
zmiennej, a nie przywracaniem plików z historii gita — bo wtedy trzeba by je
jeszcze raz przetestować.

**Wyjątek: eksport CSV** (`/api/admin/waitlist/<id>/export`) **nie jest
blokowany.** Powód jest prawny, nie handlowy: to jedyna droga do wykazania
zgód przy żądaniu z RODO, a termin na odpowiedź biegnie niezależnie od tego,
który etap jest opłacony. Trasa wymaga roli administratora i nie jest nigdzie
linkowana w widoku Etapu 1.

Widok Etapu 1 celowo **nie pozwala** zmieniać treści, limitu ani terminu —
te ustawiamy my. Klientka ma móc wyłącznie zatrzymać i wznowić zbieranie.

---

## 11. Wizualny kreator

Trzy trasy:

| Trasa | Rola |
|---|---|
| `/admin/zapisy` | lista kampanii, operacje jednym kliknięciem |
| `/admin/zapisy/nowa` | kreator nowej kampanii |
| `/admin/zapisy/<id>` | kreator istniejącej kampanii |

`nowa` jest segmentem stałym obok dynamicznego `[id]` — Next dopasowuje trasy
stałe wcześniej, więc nie ma kolizji. Dodatkowo `nowa` jest na liście slugów
zarezerwowanych, żeby żadna kampania nie mogła zająć tego adresu.

### Kanwa to prawdziwa strona

Kreator **nie ma podglądu** w sensie miniatury obok formularza. Po lewej jest
sama strona kampanii, renderowana przez `CampaignSurface` — dokładnie ten sam
komponent, którego używa `/zapisy/[slug]`. Teksty edytuje się klikając w nie
(`components/admin/waitlist/InlineEdit.tsx`), a po prawej zostaje wyłącznie to,
czego na stronie nie widać: adres, grupa w MailerLite, terminy i przełączniki
wyglądu.

To jest cała przesłanka takiego podziału plików. Osobna makieta podglądu
rozjechałaby się ze stroną przy pierwszej zmianie stylów i pokazywałaby coś,
czego odbiorca nigdy nie zobaczy — a to jedyne, do czego podgląd służy.
Przy jednym zestawie komponentów **nie da się doprowadzić do rozjazdu**.

Stąd trzy pliki, które wyglądają na nadmiarowe, a nie są:

- `CampaignSurface` — tło, logo, układ, stopka (prop `embedded` dla kanwy),
- `WaitlistFormShell` — wygląd formularza bez logiki wysyłki,
- `CampaignText` — nagłówek z podświetleniem i opis.

`WaitlistForm` to już tylko stan i żądanie do API; cały jego wygląd jest
w `WaitlistFormShell`, którego kreator używa z `preview`.

### InlineEdit: dlaczego podmiana, a nie stale widoczne pole

Dopóki nie edytujesz, widzisz dokładnie to, co odbiorca — łącznie
z podświetleniem fragmentu nagłówka. Pole tekstowe nie potrafi wyrenderować
podkreślenia akcentem; gdyby nagłówek był na kanwie zawsze polem, kreator
pokazywałby stronę bez połowy jej wyglądu, czyli przestałby być wizualny.

Nie `contentEditable`: wpuszczałby do stanu HTML wklejony ze schowka
(formatowanie, obce znaczniki), a do bazy zapisujemy czysty tekst.

Kanwa ma przełącznik ekranu: **Formularz / Po zapisie / Zamknięte** — inaczej
treści potwierdzenia i komunikatu o zamknięciu nie dałoby się obejrzeć bez
czekania na datę albo bez zapisywania się na własną listę.

### Panel ustawień zwija się do kolumny ikon

Przycisk w nagłówku panelu zwija go do paska ~64 px z ikonami sekcji; kliknięcie
ikony rozwija panel i przewija do właściwej sekcji. Oddaje to kanwie ~300 px —
przy układzie „dwie kolumny" to różnica między oglądaniem strony a oglądaniem
jej ściśniętej wersji.

Ikony pochodzą z `SETTINGS_SECTIONS`, tej samej listy co sekcje panelu, więc
dodanie sekcji nie wymaga pamiętania o drugim miejscu.

Zwijanie jest sterowane **klasami**, a nie warunkowym renderowaniem: poniżej
1200 px panel ląduje pod kanwą na całej szerokości i wtedy zwijanie nic nie daje,
więc klasy `max-[1200px]:` przywracają tam pełny panel niezależnie od stanu.
Dzięki temu nie zgadujemy szerokości okna w JavaScripcie.

### Nawigacja serwisu

Strona kampanii ma zwykły `Navbar` serwisu — ten sam co pozostałe podstrony.
Na kanwie kreatora stoi zamiast niego atrapa (`NavbarPreview`) i jest to
**jedyne miejsce w kreatorze, które nie jest prawdziwym komponentem strony**.
Powód jest konkretny: prawdziwy `Navbar` po przewinięciu przechodzi w
`position: fixed`, a jego menu mobilne blokuje przewijanie całego dokumentu —
w ramce podglądu oznaczałoby to pasek wyjeżdżający na panel administracyjny
i zablokowany scroll po jednym kliknięciu. Listę linków atrapa bierze
z prawdziwego navbara (`export const navLinks`), więc nie może się rozjechać.

### Pozostałe decyzje, które wyglądają na drobiazgi, a nie są:

- **Nowa kampania startuje wyłączona.** Publikacja to osobny klik, tak samo jak
  przy nowym kodzie rabatowym. Zapisanie formularza nie może przypadkiem
  udostępnić niedokończonej strony.
- **„Zrób kopię" jest osobną akcją.** To jest sedno kreatora: kolejna akcja
  marketingowa różni się nagłówkiem i terminem, nie całą treścią. Kopia nie
  dziedziczy dat ani zebranych kontaktów — te należą do konkretnej kampanii
  i do zgody, którą tamte osoby zaznaczyły.
- **Usunięcie wymaga zgodności licznika zapisów** z tym, co widać na liście.
  Jeśli ktoś zapisał się w międzyczasie, operacja jest odrzucana. Bez tego
  łatwo skasować kampanię wyglądającą na pustą, bo widok jest sprzed kwadransa.
- **Awaria MailerLite nie blokuje zapisania kampanii.** Gdy lista grup się nie
  pobierze, pole degraduje się do ręcznego ID zamiast wyłączyć sekcję. Cudze
  API nie może zatrzymać pracy klientki.
- **Slug podpowiada się z nazwy roboczej**, ale po pierwszej ręcznej zmianie
  przestajemy go nadpisywać. Przy edycji istniejącej kampanii formularz
  ostrzega, że zmiana adresu unieważnia linki już opublikowane w postach.

### Eksport CSV

W pliku jest komplet danych wymaganych przy RODO (treść zgody, moment, IP),
a nie same adresy — klientka jako administrator danych musi umieć wykazać,
na co zgodziła się każda osoba.

Trzy rzeczy w `lib/csv.ts`, które nie są oczywiste: **średnik** zamiast
przecinka (polski Excel wrzuciłby plik z przecinkami do jednej kolumny), **BOM**
na początku (bez niego polskie znaki zamieniają się w krzaki) i **neutralizacja
formuł** — komórka zaczynająca się od `=`, `+`, `-` lub `@` jest dla Excela
formułą, a wartości pochodzą od anonimowych osób z internetu (CSV injection).

---

## 11. Czego tu nadal nie ma

- **Wgrywania plików** — grafiki podaje się adresem URL. W projekcie nie ma
  magazynu plików, a dokładanie go pod jedno pole byłoby nieproporcjonalne.
- **Ręcznego przycisku „doślij zaległości"** — dziś robi to wyłącznie dobowy
  cron. Panel pokazuje licznik oczekujących, więc problem jest widoczny.
- **Podglądu mobilnego w kreatorze** — kanwa renderuje układ według szerokości
  OKNA, nie swojego kontenera (klasy `sm:` i `lg:` w Tailwindzie odnoszą się do
  viewportu). Zwężenie kanwy pokazałoby więc układ desktopowy w wąskiej ramce,
  czyli podgląd, który kłamie. Do sprawdzenia telefonu służy przycisk „Otwórz
  stronę", który otwiera prawdziwy adres. Zrobienie tego uczciwie wymagałoby
  przepisania układów na zapytania kontenerowe (`@container`).
- **Testów widoków** — testami pokryta jest wyłącznie czysta domena (okno
  zapisów, slugi, CSV, podświetlenie nagłówka), zgodnie z zasadą opisaną
  w `vitest.config.ts`.

### Znane ograniczenie: status 200 przy nieistniejącej kampanii

Wejście na `/zapisy/<nieistniejący-slug>` pokazuje właściwy ekran „nie ma tu
zapisów" (`src/app/zapisy/not-found.tsx`), ale odpowiedź ma **status 200,
nie 404**.

Przyczyna leży poza tym modułem: `src/app/loading.tsx` w korzeniu aplikacji
tworzy granicę Suspense, więc Next wysyła nagłówki odpowiedzi zanim komponent
strony zdąży wywołać `notFound()`. Dotyczy to **całej aplikacji** — tak samo
zachowuje się `admin/news/[newsId]` i czytnik e-booka. Sprawdzone również
na buildzie produkcyjnym.

Dla stron zapisów jest to bez praktycznych skutków: mają `noindex` i są
wykluczone w `robots.ts`, więc żadna wyszukiwarka ich nie indeksuje.
Naprawa wymagałaby ruszenia globalnego `loading.tsx`, co zmieniłoby zachowanie
ładowania na wszystkich stronach serwisu — świadomie poza zakresem.
