# Checklista wdrożenia — lista oczekujących

Dokument przekazania dla osoby (lub sesji AI), która przejmuje temat.
Zawiera stan faktyczny na **9 sierpnia 2026** oraz wszystko, co zostało do zrobienia.

Szczegóły techniczne rozwiązania: [`docs/lista-oczekujacych.md`](./lista-oczekujacych.md).

---

## 0. Kontekst w trzech zdaniach

Klientka (Alicja Wójcik, fizjoterapeutka) planuje letnią promocję e-booka i chce
najpierw zebrać listę oczekujących. Powstała podstrona zbierająca adresy e-mail,
która wysyła je do MailerLite, oraz — poza zamówionym zakresem — wizualny kreator
kolejnych takich stron, na razie ukryty za flagą.

Post promujący listę miał iść w poniedziałek, został przesunięty na **wtorek**.

---

## 1. Dane projektu

| | |
|---|---|
| Domena produkcyjna | `https://aliceinphysioland.pl` |
| Stack | Next.js 16 (App Router), Prisma 5.22, PostgreSQL (Neon), NextAuth, Tailwind v4 |
| Baza | Neon, region `eu-central-1` (Frankfurt) |
| Administrator danych | Alicja Wójcik, ul. Herbu Janina 9/23, 02-972 Warszawa, NIP 9512526595 |
| Adres kampanii | `https://aliceinphysioland.pl/zapisy/lato` |
| Panel | `/admin/zapisy` |

### Stan kampanii w bazie

```
slug:              lato
nazwa:             Promocja letnia 2026 — lista oczekujących
aktywna:           tak
grupa MailerLite:  195340041351857622  ("waiting list")
limit miejsc:      brak
zebranych adresów: 0
```

### Konto MailerLite

| | |
|---|---|
| Plan | **Free — limit 250 subskrybentów** |
| Kontaktów na koncie | **467** (463 aktywne, 4 wypisane) |
| Trial zakończony | 10.04.2026 |
| Skutek | **konto odrzuca nowe kontakty błędem HTTP 413** |

Grupy: `pierwsza_czesc` (344), `druga_czesc` (118), `istniejący_kupujący` (0),
`waiting list` (0, założona pod tę kampanię).

---

## 2. ⛔ Ostrzeżenia — przeczytaj przed działaniem

**NIE KASOWAĆ kontaktów w MailerLite, żeby zrobić miejsce.**
Te 467 osób to klientki, które kupiły e-booka (w bazie 227 zakupów). Przy limicie
250 trzeba by usunąć ponad 300 z nich, żeby zmieściła się choćby setka nowych
zapisów. Właściwe rozwiązanie to płatny plan.

**Kampania NIE jest zablokowana przez MailerLite.** Adresy zapisują się do naszej
bazy niezależnie i czekają ze statusem `pending`. Po wykupieniu planu cron dosyła
je automatycznie. Warunek: cron musi mieć harmonogram (punkt 4).

**Nie „naprawiać" świadomych decyzji projektowych** — są opisane w punkcie 8.

---

## 3. Co jest już zrobione (nie powtarzać)

- [x] Model danych + **5 migracji zaaplikowanych** na bazie wskazanej w `.env`:
      `20260807120000_waitlist_pages`, `20260807170000_waitlist_appearance`,
      `20260807230000_waitlist_card_background`, `20260808090000_waitlist_max_signups`
      (oraz cudza `20260807140000_purchase_sandbox_flag` — **nadal niezaaplikowana**)
- [x] Integracja z MailerLite, z kopią zapasową w naszej bazie i ponawianiem
- [x] Publiczna strona `/zapisy/[slug]` — formularz, RODO, honeypot, limit zapytań
- [x] Twardy limit miejsc + komunikat o komplecie
- [x] Licznik „zostało X z Y miejsc"
- [x] Navbar serwisu na stronie zapisów
- [x] Panel Etapu 1: link, licznik, wyłącznik (`SimpleWaitlistControl`)
- [x] Kreator wizualny (Etap 2) — **ukryty za flagą**, patrz punkt 7
- [x] Widget RODO na dashboardzie: odliczanie do usunięcia danych + kasowanie
- [x] Polityka prywatności §5a i przepisany §5 (lista podprocesorów)
- [x] Grupa `waiting list` założona w MailerLite
- [x] Endpointy cron: `/api/cron/daily` i `/api/cron/waitlist`
- [x] 135 testów jednostkowych, `tsc` i `eslint` czyste, build przechodzi

**Stan gita:** wszystko **zastage'owane, ale NIEZACOMMITOWANE**.
Ostatni commit to `8987eb1 Add rabat stuff`. Branch `main`, zero commitów przed remote.

---

## 4. Wdrożenie na produkcję

### 4.1 Commit i push

- [ ] Sprawdzić `git status` — zmiany są zastage'owane, ale zweryfikować, czy nie
      weszło nic przypadkiem (np. `.env`)
- [ ] Commit i push na `main`

### 4.2 Zmienne środowiskowe na Vercelu

- [ ] `MAILERLITE_API_KEY` — **uwaga:** lokalnie klucz był pod nazwą `ML_API`.
      Na produkcji musi nazywać się `MAILERLITE_API_KEY`, inaczej integracja nie
      wystartuje. Wartość skopiować z lokalnego `.env`.
- [ ] `MAILERLITE_DOUBLE_OPT_IN` = `"false"`
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://aliceinphysioland.pl`
      **Tej zmiennej nie ma nigdzie.** Bez niej linki w panelu i `og:image`
      pokażą `localhost` — klientka skopiuje niedziałający link do posta.
- [ ] `CRON_SECRET` — musi być **identyczny** z wpisanym w cron-job.org.
      Bez niego endpointy cron zwracają `500 Not configured` (celowo).
- [ ] `WAITLIST_BUILDER_ENABLED` — **NIE USTAWIAĆ.** Brak = kreator ukryty.
      To decyzja handlowa: Etap 2 nie został opłacony.

### 4.3 Baza danych

- [ ] Ustalić, czy produkcja używa **tej samej** bazy Neon co lokalny `.env`
      (host `ep-spring-bonus-ag5osrp9-pooler.c-2.eu-central-1.aws.neon.tech`)
- [ ] Jeśli tak — migracje są już zaaplikowane, nic nie robić
- [ ] Jeśli nie — `npx prisma migrate deploy`
- [ ] Zdecydować o cudzej migracji `20260807140000_purchase_sandbox_flag`
      (modyfikuje istniejące wiersze `Purchase` — nie jest z tego zakresu prac,
      dlatego świadomie jej nie aplikowano)

### 4.4 Utworzenie kampanii na produkcji

Jeśli produkcja ma inną bazę, kampanii tam nie ma:

- [ ] `npm run waitlist:seed` (treści i ID grupy są już w `prisma/seedWaitlist.js`)
- [ ] Sprawdzić w panelu `/admin/zapisy`, że kampania jest widoczna i włączona

---

## 5. Harmonogram cron (cron-job.org)

Bez tego zaległe zapisy **nigdy** nie trafią do MailerLite.

### Zadanie 1 — dosyłka zapisów (priorytet)

| Pole | Wartość |
|---|---|
| Title | `Alice — dosyłka zapisów do MailerLite` |
| URL | `https://aliceinphysioland.pl/api/cron/waitlist` |
| Method | `GET` |
| Schedule | co godzinę, minuta `15` |
| Timezone | `Europe/Warsaw` |
| Header | `Authorization: Bearer <CRON_SECRET>` |
| Timeout | 60 s |
| Notifications on failure | włączone |

Nagłówek dodaje się w **Advanced → Headers**. Słowo `Bearer` i spacja są wymagane.

### Zadanie 2 — zadania dobowe

| Pole | Wartość |
|---|---|
| Title | `Alice — zadania dobowe` |
| URL | `https://aliceinphysioland.pl/api/cron/daily` |
| Method | `GET` |
| Schedule | codziennie `23:30` |
| Timezone | `Europe/Warsaw` |
| Header | `Authorization: Bearer <CRON_SECRET>` |
| Timeout | 60 s |

Obejmuje kody rabatowe, porzucone koszyki **oraz** dosyłkę zapisów (zapas na
wypadek awarii zadania godzinowego).

- [ ] Zadanie 1 utworzone i przetestowane
- [ ] Zadanie 2 utworzone i przetestowane
- [ ] Ręczny test: odpowiedź to `{"ok":true,"checked":0,"synced":0,...}`

---

## 6. MailerLite — do zrobienia po stronie klientki

- [ ] **Wykupić płatny plan.** Przy ~500 kontaktach rząd 50–70 zł miesięcznie.
      Bez tego żaden nowy adres nie trafi na listę.
- [ ] Po wykupieniu: odpalić ręcznie `/api/cron/waitlist` i sprawdzić, czy
      `synced` odpowiada liczbie zebranych adresów
- [ ] Zaakceptować DPA (umowę powierzenia) w panelu MailerLite
- [ ] Rozważyć przeniesienie **6 zapisów z formularza w stopce serwisu**
      (tabela `NewsletterSubscriber`, kwiecień–lipiec 2026) — nigdy nie trafiły
      do MailerLite, bo tamten endpoint zapisuje wyłącznie lokalnie

---

## 7. Zakres prawny

### Zrobione

- [x] Polityka prywatności §5a — cel, dwie podstawy prawne, zakres danych, IP,
      okres przechowywania, MailerLite jako podmiot przetwarzający
- [x] §5 przepisany na konkretną listę podprocesorów
- [x] Dowód zgody przy każdym zapisie: treść, data, IP, przeglądarka
- [x] Zweryfikowana zgodność nazwy administratora z rejestrem
- [x] Mechanizm usuwania danych po okresie przechowywania (dashboard)

### Do zrobienia

- [ ] **Umowa powierzenia przetwarzania (art. 28 RODO) między Alicją a wykonawcą.**
      Wykonawca trzyma dane jej subskrybentów na swojej infrastrukturze.
      Wymagane elementy i lista podprocesorów: patrz punkt 7.1 poniżej.
- [ ] **DPA z MailerLite** — klientka akceptuje w panelu
- [ ] **Potwierdzenie okresu przechowywania.** Obecnie 3 lata, wpisane w dwóch
      miejscach, które muszą się zgadzać: `src/lib/waitlist-retention.ts`
      (stała `RETENTION_YEARS`) i §5a polityki prywatności
- [ ] **Baner zgód na cookies — BRAK W CAŁYM SERWISIE.** Używane są Vercel
      Analytics, Sentry (z `sendDefaultPii: true`, czyli z adresami IP)
      i OneSignal. Zapis i odczyt informacji na urządzeniu wymaga zgody;
      analityka i push nie są usługami niezbędnymi. Luka niezależna od tej
      kampanii, ale realna.
- [ ] **Regulamin nie obejmuje newslettera ani list zapisów.** Ustawa
      o świadczeniu usług drogą elektroniczną wymaga regulaminu dla usług
      świadczonych elektronicznie — zapis na listę jest taką usługą, choć
      nieodpłatną. Obecny regulamin dotyczy wyłącznie zakupów.

### 7.1 Umowa powierzenia — co musi zawierać

Sześć elementów obowiązkowych z art. 28 ust. 3 RODO:

1. **Przedmiot** — utrzymanie i rozwój aplikacji wraz z bazą danych, panelem
   i systemem list oczekujących
2. **Czas trwania** — na czas świadczenia usług
3. **Charakter i cel** — przechowywanie w bazie, udostępnianie w aplikacji,
   przekazywanie do systemów zewnętrznych na polecenie, kopie zapasowe, diagnostyka
4. **Rodzaj danych** — imię i nazwisko, e-mail, dane konta Google, dane do faktur,
   NIP, historia zakupów, postęp w kursie, treść i data zgód, adres IP, dane urządzenia
5. **Kategorie osób** — klientki, użytkownicy kont, zapisani na newsletter
   i listy oczekujących, pacjentki wystawiające opinie
6. **Obowiązki i prawa administratora** — polecenia na piśmie lub e-mailem,
   prawo kontroli, odpowiedzialność za legalność zebranych danych

Osiem obowiązków podmiotu przetwarzającego (lit. a–h) — **wszystkie wymagane**:

1. przetwarzanie wyłącznie na udokumentowane polecenie
2. zobowiązanie do poufności osób mających dostęp
3. środki bezpieczeństwa z art. 32 (wymienić realne: TLS, skróty haseł, dostęp
   po roli administratora, kopie zapasowe, ograniczony dostęp do zmiennych)
4. zasady korzystania z podprocesorów — zgoda ogólna + informowanie o zmianach
   z terminem sprzeciwu (zwykle 14 dni)
5. pomoc w realizacji praw osób
6. pomoc przy naruszeniach i ocenie skutków — zgłoszenie naruszenia
   administratorowi **w ciągu 24 godzin** (ona ma 72 h na zgłoszenie do UODO)
7. usunięcie albo zwrot danych po zakończeniu współpracy, do jej wyboru
8. udostępnienie informacji i umożliwienie audytu

**Załącznik — lista podprocesorów** (stan z kodu):

| Podmiot | Do czego | Gdzie |
|---|---|---|
| Neon | baza danych | AWS Frankfurt, UE |
| Vercel | hosting | region do sprawdzenia |
| MailerLite | wysyłka maili | Litwa/Irlandia, UE |
| Sentry | monitoring błędów | region UE (`ingest.de.sentry.io`) |
| Stripe | płatności | Irlandia, UE |
| Fakturownia | faktury | Polska |
| OneSignal | powiadomienia push | **USA** — jedyny transfer poza EOG |
| Google | logowanie OAuth | USA (Data Privacy Framework) |

**Data obowiązywania** — nie antydatować dokumentu. Poprawna formuła:

> „Umowa wchodzi w życie z dniem podpisania i obejmuje również przetwarzanie
> danych osobowych realizowane przez Podmiot przetwarzający na rzecz
> Administratora od dnia [data faktycznego rozpoczęcia]."

---

## 8. Świadome decyzje — nie zmieniać bez rozmowy

Rzeczy, które wyglądają na błędy, a nie są:

- **Kreator (Etap 2) jest ukryty, choć kod jest kompletny.** Powód handlowy:
  etap nie został opłacony. Odblokowanie = `WAITLIST_BUILDER_ENABLED="true"`.
- **Eksport CSV nie jest blokowany flagą**, w odróżnieniu od reszty Etapu 2.
  Powód prawny: to jedyna droga do wykazania zgód przy żądaniu z RODO.
- **Licznik miejsc bez ustawionego limitu pokazuje liczby nieprawdziwe.**
  Zamówione świadomie, po przedstawieniu ryzyka prawnego (praktyka z czarnej
  listy — załącznik I do dyrektywy 2005/29/WE, pkt 7). Wyłączenie: ustawić
  kampanii prawdziwy limit miejsc, licznik sam przejdzie na liczby prawdziwe.
  Szczegóły w `docs/lista-oczekujacych.md` §6.
- **Dane po okresie przechowywania kasuje człowiek, nie cron.** Operacja jest
  nieodwracalna i sięga poza aplikację (MailerLite).
- **Limit miejsc może zostać przekroczony o 1–2 przy równoczesnych zapisach.**
  Świadome ograniczenie, uzasadnienie w `src/lib/waitlist.ts`.
- **Podgląd mobilny w kreatorze nie istnieje.** Układy używają klas zależnych
  od szerokości okna, więc zwężona kanwa pokazywałaby nieprawdę.

---

## 9. Weryfikacja po wdrożeniu

- [ ] `https://aliceinphysioland.pl/zapisy/lato` otwiera się i pokazuje formularz
- [ ] Navbar serwisu jest widoczny na stronie zapisów
- [ ] Zapis prawdziwym adresem kończy się ekranem „Jesteś na liście!"
- [ ] Adres pojawia się w panelu `/admin/zapisy` (licznik rośnie)
- [ ] Panel pokazuje ostrzeżenie „X adresów czeka na przekazanie do MailerLite"
      (spodziewane, dopóki konto ML jest zablokowane)
- [ ] Wyłącznik w panelu zatrzymuje zapisy — strona pokazuje komunikat
- [ ] Ponowne włączenie przywraca formularz
- [ ] Link skopiowany z panelu zawiera prawdziwą domenę, nie `localhost`
- [ ] Po wykupieniu planu ML: ręczne odpalenie `/api/cron/waitlist` przenosi
      zebrane adresy do grupy `waiting list`
- [ ] Usunąć adresy testowe użyte przy weryfikacji

---

## 10. Treści do zatwierdzenia przez klientkę

Teksty na stronie są robocze, napisane przez wykonawcę jako punkt wyjścia.
Do zmiany w `prisma/seedWaitlist.js` (blok `CAMPAIGN`), potem `npm run waitlist:seed`:

- [ ] nagłówek i wyróżniony fragment
- [ ] opis kampanii
- [ ] napis na przycisku
- [ ] treść po zapisaniu
- [ ] treść zgody marketingowej
- [ ] komunikat po zamknięciu zapisów
- [ ] decyzja o limicie miejsc (obecnie brak — patrz punkt 8, licznik)
- [ ] decyzja o dacie zamknięcia zapisów

---

## 11. Do ustalenia biznesowo

- [ ] Szkolenie z MailerLite i projekt szablonu wiadomości — z ustaleń nie wynika
      jednoznacznie, czy należą do Etapu 1, czy 2
- [ ] Termin publikacji posta (pierwotnie poniedziałek, przesunięty na wtorek)
