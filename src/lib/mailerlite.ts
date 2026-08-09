/**
 * Klient MailerLite (API v2 — connect.mailerlite.com).
 *
 * Świadoma decyzja projektowa: **żadna funkcja stąd nie rzuca wyjątkiem**.
 * Każda zwraca wynik z rozróżnialnym powodem niepowodzenia, bo wywołujący
 * (endpoint zapisu) musi umieć odróżnić „nie udało się, spróbujemy później"
 * od „nie uda się nigdy, nie ma sensu ponawiać". Zapis do naszej bazy jest
 * źródłem prawdy i dzieje się przed wysyłką tutaj — użytkownik nie może
 * zobaczyć błędu tylko dlatego, że MailerLite miał chwilową awarię.
 *
 * Konfiguracja (zmienne środowiskowe):
 *   MAILERLITE_API_KEY       — token z panelu MailerLite (Integrations → API).
 *   MAILERLITE_DOUBLE_OPT_IN — "true", jeśli zapis ma być potwierdzany mailem.
 *                              Domyślnie false (kontakt trafia na listę od razu).
 */

const API_BASE = "https://connect.mailerlite.com/api";

/** MailerLite bywa wolny; nie blokujemy odpowiedzi dla użytkownika w nieskończoność. */
const REQUEST_TIMEOUT_MS = 8_000;

/* -------------------------------------------------------------------------- */
/* Typy wyniku                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Powód niepowodzenia. Kluczowe rozróżnienie to `retryable`:
 *  - true  → problem chwilowy (sieć, 5xx, limit zapytań). Cron spróbuje ponownie.
 *  - false → problem trwały (zły klucz, odrzucony adres). Ponawianie nic nie da.
 */
export type MailerliteFailureReason =
  | "not_configured" // brak MAILERLITE_API_KEY
  | "unauthorized" // zły lub cofnięty klucz API
  | "rejected" // MailerLite odrzucił dane (np. adres uznany za nieprawidłowy)
  | "quota_exceeded" // konto nie przyjmuje nowych kontaktów (limit planu / konto w weryfikacji)
  | "rate_limited" // przekroczony limit zapytań
  | "server_error" // 5xx po stronie MailerLite
  | "network_error"; // timeout, brak połączenia

const RETRYABLE: ReadonlySet<MailerliteFailureReason> = new Set([
  "rate_limited",
  "server_error",
  "network_error",
  // Konto zablokowane dla nowych kontaktów to stan PRZEJŚCIOWY: minie po
  // zmianie planu albo zatwierdzeniu konta przez MailerLite. Gdyby liczyć to
  // za błąd trwały, kontakty zebrane w tym czasie nie dosłałyby się nigdy —
  // czyli dokładnie wtedy, gdy najbardziej na tym zależy, w trakcie kampanii.
  "quota_exceeded",
]);

/**
 * Czy powód dotyczy CAŁEGO konta, a nie konkretnego kontaktu.
 *
 * Takie niepowodzenia nie zużywają puli prób danego kontaktu — nie jest niczyją
 * winą, że konto akurat nie przyjmuje zapisów, a po pięciu dobach blokady
 * wszystkie zebrane adresy zostałyby trwale porzucone.
 */
export function isAccountLevelFailure(
  reason: MailerliteFailureReason,
): boolean {
  return reason === "quota_exceeded" || reason === "rate_limited";
}

export function isRetryable(reason: MailerliteFailureReason): boolean {
  return RETRYABLE.has(reason);
}

export type MailerliteResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MailerliteFailureReason; message: string };

function fail<T>(
  reason: MailerliteFailureReason,
  message: string,
): MailerliteResult<T> {
  return { ok: false, reason, message };
}

/* -------------------------------------------------------------------------- */
/* Warstwa transportowa                                                        */
/* -------------------------------------------------------------------------- */

export function isMailerliteConfigured(): boolean {
  return Boolean(process.env.MAILERLITE_API_KEY?.trim());
}

/** Czy zapis ma czekać na potwierdzenie klikiem w mailu (double opt-in). */
function usesDoubleOptIn(): boolean {
  return process.env.MAILERLITE_DOUBLE_OPT_IN === "true";
}

interface RequestOptions {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
}

async function request<T>({
  method,
  path,
  body,
}: RequestOptions): Promise<MailerliteResult<T>> {
  const apiKey = process.env.MAILERLITE_API_KEY?.trim();

  if (!apiKey) {
    return fail("not_configured", "Brak MAILERLITE_API_KEY w konfiguracji.");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // Integracja zewnętrzna — nigdy z cache'u Next.js.
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail("network_error", `Brak połączenia z MailerLite: ${message}`);
  }

  if (response.ok) {
    // 204 i puste ciało zdarzają się przy części operacji — nie wywracamy się na JSON.parse.
    const text = await response.text();
    if (!text) return { ok: true, data: undefined as T };

    try {
      return { ok: true, data: JSON.parse(text) as T };
    } catch {
      return fail("server_error", "MailerLite zwrócił odpowiedź nie-JSON.");
    }
  }

  const detail = await readErrorDetail(response);

  switch (response.status) {
    case 401:
    case 403:
      return fail(
        "unauthorized",
        `Klucz API odrzucony przez MailerLite (${response.status}). ${detail}`,
      );
    case 413:
      // Mylący kod (413 to normalnie „za duże żądanie"), ale MailerLite zwraca
      // nim brak miejsca na nowe kontakty: wyczerpany limit planu albo konto
      // czekające na zatwierdzenie. Rozmiar naszego żądania nie ma z tym nic
      // wspólnego, więc nie ma czego zmniejszać — trzeba tknąć konto.
      return fail(
        "quota_exceeded",
        "Konto MailerLite nie przyjmuje nowych kontaktów — sprawdź limit planu " +
          `i status weryfikacji konta. ${detail}`,
      );
    case 422:
      return fail("rejected", `MailerLite odrzucił dane: ${detail}`);
    case 429:
      return fail("rate_limited", `Przekroczony limit zapytań. ${detail}`);
    default:
      if (response.status >= 500) {
        return fail(
          "server_error",
          `Błąd po stronie MailerLite (${response.status}). ${detail}`,
        );
      }
      return fail(
        "rejected",
        `Nieoczekiwana odpowiedź MailerLite (${response.status}). ${detail}`,
      );
  }
}

/** Wyciąga czytelny opis błędu, cokolwiek MailerLite przysłał. */
async function readErrorDetail(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return "";

    const parsed = JSON.parse(text) as {
      message?: string;
      errors?: Record<string, string[]>;
    };

    const fieldErrors = parsed.errors
      ? Object.values(parsed.errors).flat().join("; ")
      : "";

    return [parsed.message, fieldErrors].filter(Boolean).join(" ").trim();
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Operacje                                                                    */
/* -------------------------------------------------------------------------- */

interface MailerliteSubscriber {
  id: string;
  email: string;
  status: string;
}

interface SubscribeArgs {
  email: string;
  /** Imię — trafia do pola `name`, którego MailerLite używa w personalizacji maili. */
  name?: string | null;
  /** ID grupy. Puste = kontakt ląduje na koncie bez przypisania do grupy. */
  groupId?: string | null;
}

/**
 * Dodaje kontakt do listy (i do grupy, jeśli podana).
 *
 * Duplikaty nie są błędem: endpoint `POST /subscribers` w MailerLite działa jak
 * upsert — istniejący kontakt zostaje zaktualizowany i dopisany do grupy,
 * odpowiedź to 200 zamiast 201. Nie musimy więc sprawdzać wcześniej, czy adres
 * już istnieje, i nie ma tu wyścigu przy dwóch równoczesnych zapisach.
 */
export async function subscribeToMailerlite({
  email,
  name,
  groupId,
}: SubscribeArgs): Promise<MailerliteResult<MailerliteSubscriber>> {
  const trimmedName = name?.trim();

  return request<MailerliteSubscriber>({
    method: "POST",
    path: "/subscribers",
    body: {
      email: email.trim().toLowerCase(),
      ...(trimmedName ? { fields: { name: trimmedName } } : {}),
      ...(groupId ? { groups: [groupId] } : {}),
      // "unconfirmed" uruchamia maila potwierdzającego po stronie MailerLite;
      // "active" dopisuje od razu. Zgodę marketingową i tak zbieramy na naszym
      // formularzu i zapisujemy w bazie — double opt-in to dodatkowa warstwa,
      // która poprawia dostarczalność kosztem części zapisów.
      status: usesDoubleOptIn() ? "unconfirmed" : "active",
    },
  });
}

/**
 * Znajduje kontakt po adresie e-mail.
 *
 * Potrzebne przy usuwaniu danych po upływie okresu przechowywania: zanim
 * cokolwiek skasujemy, musimy wiedzieć, w ilu grupach ta osoba jest.
 */
export async function findMailerliteSubscriber(
  email: string,
): Promise<MailerliteResult<MailerliteSubscriberDetails | null>> {
  const result = await request<{
    data?: { id: string; email: string; groups?: Array<{ id: string }> };
  }>({
    method: "GET",
    path: `/subscribers/${encodeURIComponent(email.trim().toLowerCase())}`,
  });

  if (result.ok) {
    const data = result.data?.data;
    return {
      ok: true,
      data: data
        ? {
            id: String(data.id),
            email: data.email,
            groupIds: (data.groups ?? []).map((group) => String(group.id)),
          }
        : null,
    };
  }

  // Brak kontaktu to nie awaria — po prostu nigdy tam nie dotarł (np. konto
  // odrzucało zapisy) albo został już usunięty ręcznie.
  if (result.reason === "rejected" && result.message.includes("404")) {
    return { ok: true, data: null };
  }

  return result;
}

export interface MailerliteSubscriberDetails {
  id: string;
  email: string;
  groupIds: string[];
}

/** Usuwa kontakt z konta w całości. */
export async function deleteMailerliteSubscriber(
  subscriberId: string,
): Promise<MailerliteResult<void>> {
  return request<void>({
    method: "DELETE",
    path: `/subscribers/${subscriberId}`,
  });
}

/** Wypisuje kontakt z jednej grupy, zostawiając go w pozostałych. */
export async function removeMailerliteSubscriberFromGroup(
  subscriberId: string,
  groupId: string,
): Promise<MailerliteResult<void>> {
  return request<void>({
    method: "DELETE",
    path: `/subscribers/${subscriberId}/groups/${groupId}`,
  });
}

export interface MailerliteGroup {
  id: string;
  name: string;
  activeCount: number;
}

/**
 * Lista grup na koncie — do wskazania, gdzie mają lądować zapisy.
 *
 * W Etapie 1 służy do jednorazowego znalezienia ID grupy przy konfiguracji
 * (patrz `npm run waitlist:groups`). W Etapie 2 zasili listę wyboru w panelu.
 */
export async function listMailerliteGroups(): Promise<
  MailerliteResult<MailerliteGroup[]>
> {
  const result = await request<{
    data?: Array<{ id: string; name: string; active_count?: number }>;
  }>({ method: "GET", path: "/groups?limit=100" });

  if (!result.ok) return result;

  const groups = (result.data?.data ?? []).map((group) => ({
    id: String(group.id),
    name: group.name,
    activeCount: group.active_count ?? 0,
  }));

  return { ok: true, data: groups };
}
