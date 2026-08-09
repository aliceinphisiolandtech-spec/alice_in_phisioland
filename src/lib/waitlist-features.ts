/**
 * Zakres listy oczekujących udostępniony w panelu.
 *
 * Projekt był rozliczany etapami i panel odzwierciedla to wprost:
 *
 *   Etap 1 — strona zapisów + integracja z MailerLite. W panelu zostaje sam
 *            wyłącznik i licznik: tyle, ile trzeba, żeby klientka mogła
 *            zatrzymać zbieranie bez dzwonienia do nas.
 *   Etap 2 — kreator stron (tworzenie, edycja, układy, motywy, statystyki,
 *            eksport). Kod jest gotowy i przetestowany, ale pozostaje ukryty,
 *            dopóki etap nie zostanie zamówiony.
 *
 * Świadomie flaga, a nie usunięcie kodu: odblokowanie ma być zmianą jednej
 * zmiennej środowiskowej, a nie przywracaniem plików z historii gita — bo
 * wtedy trzeba by je jeszcze raz przetestować.
 *
 * Domyślnie WYŁĄCZONE. Włączenie wymaga jawnego `"true"`, więc żadna literówka
 * ani brak wpisu nie odsłoni kreatora przypadkiem.
 */
export function isWaitlistBuilderEnabled(): boolean {
  return process.env.WAITLIST_BUILDER_ENABLED === "true";
}
