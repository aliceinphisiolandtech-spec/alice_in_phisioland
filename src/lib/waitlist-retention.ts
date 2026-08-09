/**
 * Okres przechowywania adresów z list oczekujących.
 *
 * Polityka prywatności (§5a) deklaruje: „do momentu wycofania zgody, a jeżeli
 * zgoda nie zostanie wycofana — nie dłużej niż 3 lata". Deklaracja bez pokrycia
 * w działaniu jest gorsza niż jej brak, bo przy kontroli pokazuje się jako
 * świadome przetwarzanie ponad zadeklarowany czas.
 *
 * Dane kasuje CZŁOWIEK, nie system. Świadoma decyzja: usunięcie adresu jest
 * nieodwracalne i pociąga za sobą krok poza naszą aplikacją (MailerLite),
 * więc automat zrobiłby połowę roboty i zostawił złudzenie, że sprawa
 * załatwiona. Panel ma przypominać i policzyć, kto i kiedy — nacisnąć musi
 * administratorka.
 *
 * Moduł jest czysty (bez Prismy), więc reguła daje się przetestować bez bazy.
 */

/** Ile trzymamy adres od zapisu. Musi zgadzać się z polityką prywatności. */
export const RETENTION_YEARS = 3;

/** Ile dni wcześniej zaczynamy przypominać. */
export const WARNING_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type RetentionStatus =
  /** Termin minął — dane powinny zniknąć. */
  | "due"
  /** Termin blisko — warto przygotować się na usunięcie. */
  | "soon"
  /** Jeszcze długo. */
  | "ok";

export interface RetentionVerdict {
  status: RetentionStatus;
  /** Kiedy adres powinien zostać usunięty. */
  deleteAt: Date;
  /**
   * Ile dni zostało. Wartość ujemna = o tyle dni termin już minął.
   * Liczymy w pełnych dobach, bo o tym mówi polityka — nie o godzinach.
   */
  daysLeft: number;
}

/**
 * Data zapisu -> termin usunięcia i stan.
 *
 * Punktem odniesienia jest moment zapisu, bo tylko taki „kontakt" realnie
 * rejestrujemy. Gdybyśmy kiedyś zbierali otwarcia maili, punkt odniesienia
 * trzeba będzie zmienić na ostatnią aktywność — i zmienić też politykę.
 */
export function resolveRetention(
  signedUpAt: Date,
  now: Date = new Date(),
): RetentionVerdict {
  const deleteAt = new Date(signedUpAt);
  deleteAt.setFullYear(deleteAt.getFullYear() + RETENTION_YEARS);

  // Zaokrąglamy w górę: dopóki trwa ostatnia doba, „został 1 dzień",
  // a nie „zostało 0" — zero sugerowałoby, że termin już minął.
  const daysLeft = Math.ceil((deleteAt.getTime() - now.getTime()) / DAY_MS);

  return {
    deleteAt,
    daysLeft,
    status: daysLeft <= 0 ? "due" : daysLeft <= WARNING_DAYS ? "soon" : "ok",
  };
}

/** Najwcześniejsza data zapisu, która jeszcze mieści się w okresie przechowywania. */
export function retentionCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
  return cutoff;
}

/**
 * Granica „zbliża się termin" — zapisy starsze niż ta data wymagają uwagi.
 * Używana w zapytaniu do bazy, żeby nie wciągać do panelu wszystkich adresów.
 */
export function retentionWarningCutoff(now: Date = new Date()): Date {
  const cutoff = retentionCutoff(now);
  cutoff.setDate(cutoff.getDate() + WARNING_DAYS);
  return cutoff;
}

/** „za 12 dni" / „14 dni po terminie" — gotowy tekst na kartę w panelu. */
export function describeRetention(verdict: RetentionVerdict): string {
  const { daysLeft } = verdict;

  if (daysLeft <= 0) {
    const overdue = Math.abs(daysLeft);
    if (overdue === 0) return "termin minął dzisiaj";
    return `${overdue} ${dayWord(overdue)} po terminie`;
  }

  if (daysLeft === 1) return "zostaje 1 dzień";
  return `zostaje ${daysLeft} ${dayWord(daysLeft)}`;
}

function dayWord(count: number): string {
  return count === 1 ? "dzień" : "dni";
}
