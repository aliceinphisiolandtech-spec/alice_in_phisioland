/**
 * Licznik „pozostałych miejsc" na stronie zapisów.
 *
 * ⚠️ UWAGA — TO NIE SĄ PRAWDZIWE LICZBY.
 *
 * Pula jest wyliczana z liczby zapisanych osób tak, żeby zawsze pokazywała
 * kilka wolnych miejsc i nigdy nie schodziła do zera: gdy licznik dobija do
 * końca, pojemność skacze o kolejny próg. To narzędzie presji zakupowej,
 * zamówione świadomie przez klientkę.
 *
 * Ryzyko, które przy tym przyjęto (opisane w docs/lista-oczekujacych.md):
 * fałszywe informowanie o ograniczonej dostępności w celu skłonienia do
 * natychmiastowej decyzji jest wymienione w załączniku I do dyrektywy
 * 2005/29/WE (pkt 7) i w polskiej ustawie o przeciwdziałaniu nieuczciwym
 * praktykom rynkowym — na tzw. czarnej liście, czyli bez badania okoliczności.
 * Odpowiada przedsiębiorca prowadzący sprzedaż.
 *
 * Nic z tego NIE jest zapisywane w bazie. Jedyne wejście to prawdziwa liczba
 * zapisanych osób; reszta to arytmetyka przy renderowaniu. Dzięki temu nie ma
 * czego rozjechać między bazą a ekranem i wyłączenie licznika nie zostawia
 * po sobie żadnych danych do posprzątania.
 */

/** Ile miejsc jest „zajętych", zanim zapisze się ktokolwiek. */
const HEADSTART = 4;

/** O tyle rośnie pula, gdy miejsca się kończą. */
const STEP = 10;

/** Licznik nigdy nie pokazuje zera — zawsze zostaje choć jedno miejsce. */
const MIN_LEFT = 1;

export interface ScarcityDisplay {
  /** Pokazywana pojemność puli. */
  total: number;
  /** Pokazywana liczba wolnych miejsc. Zawsze >= MIN_LEFT. */
  left: number;
  /** Zapełnienie paska w procentach (0–100). */
  filledPercent: number;
}

/**
 * Liczba zapisanych -> to, co widzi odwiedzający.
 *
 * Pojemność to najbliższy wielokrotny próg powyżej liczby „zajętych", z zapasem
 * `MIN_LEFT`. Efekt: wolne miejsca spadają do 1, po czym pula przeskakuje
 * o `STEP` w górę i odliczanie zaczyna się od nowa.
 *
 *   0 zapisów  ->  zostało 6 z 10
 *   5 zapisów  ->  zostało 1 z 10
 *   6 zapisów  ->  zostało 10 z 20
 *  16 zapisów  ->  zostało 10 z 30
 */
export function resolveScarcity(signupCount: number): ScarcityDisplay {
  // Ujemna albo nieliczbowa wartość mogłaby wyjść z ręcznej edycji w bazie
  // albo z błędu zliczania — licznik ma się wtedy wyświetlić, a nie wywalić.
  const signups = Number.isFinite(signupCount) ? Math.max(0, signupCount) : 0;

  const taken = signups + HEADSTART;
  const total = Math.ceil((taken + MIN_LEFT) / STEP) * STEP;
  const left = Math.max(MIN_LEFT, total - taken);

  return {
    total,
    left,
    filledPercent: Math.min(100, Math.round(((total - left) / total) * 100)),
  };
}

/**
 * Wersja dla kampanii z PRAWDZIWYM limitem miejsc (`maxSignups`).
 *
 * Gdy limit jest ustawiony, pokazujemy liczby prawdziwe — i nie jest to
 * ustępstwo, tylko jedyny spójny wariant. Sztuczny licznik przy realnym limicie
 * zaprzeczałby sam sobie: strona mówiłaby „zostało 10 z 20", a formularz
 * odmawiałby zapisu przy setnej osobie (albo odwrotnie — obiecywałby wolne
 * miejsce, gdy zapisy są już zamknięte). Sprzeczność widoczną gołym okiem
 * zauważa się szybciej niż zawyżoną pulę.
 */
export function resolveSeats(
  signupCount: number,
  maxSignups: number | null,
): ScarcityDisplay {
  if (maxSignups === null || maxSignups <= 0) {
    return resolveScarcity(signupCount);
  }

  const left = Math.max(0, maxSignups - Math.max(0, signupCount));

  return {
    total: maxSignups,
    left,
    filledPercent: Math.min(
      100,
      Math.round(((maxSignups - left) / maxSignups) * 100),
    ),
  };
}
