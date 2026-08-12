/**
 * Czyszczenie zgłoszeń błędów z danych osobowych, zanim trafią do Sentry.
 *
 * `sendDefaultPii` jest wyłączone, więc Sentry samo nie dokłada już adresu IP,
 * ciasteczek ani kontekstu zalogowanej osoby. To jednak nie wystarcza: treść
 * żądania potrafi dojechać razem ze zgłoszeniem, a przez checkout przechodzą
 * dane do faktury — imię, nazwisko, adres i NIP. Awaria w tym miejscu jest
 * właśnie tym momentem, w którym najbardziej chcemy zobaczyć błąd, i tym,
 * w którym najmniej chcemy wysłać komplet danych klientki do dostawcy.
 *
 * Dlatego usuwamy hurtem, a nie po nazwach pól: lista pól rośnie razem
 * z formularzami, a każde przeoczone pole to wyciek. Do diagnozy błędu i tak
 * potrzebny jest ślad stosu i adres trasy, nie treść formularza.
 *
 * Moduł jest czysty (bez importów), bo ładują go pliki instrumentacji,
 * uruchamiane zanim wystartuje reszta aplikacji.
 */

/**
 * Kształt, którego potrzebujemy — bez wiązania się z typami SDK.
 *
 * Zdarzenia Sentry mają kilka odmian (`ErrorEvent`, `TransactionEvent`…),
 * różniących się polami, których nie dotykamy. Dlatego funkcja niżej jest
 * generyczna i ODDAJE ten sam typ, który dostała: gdyby zwracała ten interfejs,
 * `beforeSend` przestałoby się zgadzać z sygnaturą SDK przy każdej odmianie.
 */
interface ScrubbableEvent {
  request?: {
    data?: unknown;
    cookies?: unknown;
    headers?: Record<string, string>;
    query_string?: unknown;
  };
  user?: unknown;
}

/**
 * Nagłówki, które zostają. Reszta leci, bo `authorization`, `cookie`
 * i nagłówki proxy z adresem IP nie mają czego szukać w zgłoszeniu błędu.
 */
const KEPT_HEADERS = ["content-type", "user-agent", "referer"];

export function scrubEvent<T>(event: T): T {
  // Czyścimy przez widok na te pola, które nas interesują, i oddajemy oryginał —
  // wołający dostaje z powrotem dokładnie ten typ zdarzenia, który przysłał.
  const target = event as ScrubbableEvent;

  if (target.request) {
    delete target.request.data;
    delete target.request.cookies;
    delete target.request.query_string;

    if (target.request.headers) {
      const kept: Record<string, string> = {};

      for (const name of KEPT_HEADERS) {
        const value = target.request.headers[name];
        if (value) kept[name] = value;
      }

      target.request.headers = kept;
    }
  }

  // Tożsamość zgłaszającego nie jest nam potrzebna do naprawienia błędu.
  delete target.user;

  return event;
}
