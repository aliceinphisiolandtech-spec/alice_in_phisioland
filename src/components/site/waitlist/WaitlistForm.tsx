"use client";

import React, { useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  classifyEmailProvider,
  emailDomain,
  type EmailProviderVerdict,
} from "@/lib/google-email";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ThemeTokens } from "@/lib/waitlist-appearance";
import { WaitlistFormShell } from "./WaitlistFormShell";

/**
 * Formularz zapisu na listę oczekujących — logika wysyłki.
 *
 * Sam wygląd siedzi w `WaitlistFormShell`, wspólnym z kanwą kreatora. Tutaj
 * zostaje wyłącznie to, czego kreator nie potrzebuje: stan pól, walidacja,
 * żądanie do API i ekran potwierdzenia.
 *
 * Świadomie bez toastów (w odróżnieniu od zapisu ze stopki): to jest jedyna
 * treść na stronie, więc komunikat ma zostać na ekranie, a nie zniknąć po
 * trzech sekundach. Sukces podmienia formularz na potwierdzenie — nie da się
 * wtedy kliknąć drugi raz i nie ma wątpliwości, czy zapis przeszedł.
 */

interface WaitlistFormProps {
  slug: string;
  ctaLabel: string;
  collectName: boolean;
  consentText: string;
  footnote: string | null;
  successTitle: string;
  successMessage: string;
  tokens: ThemeTokens;
  /** Licznik wolnych miejsc — powłoka wstawia go pod polem e-mail. */
  seats?: React.ReactNode;
}

type FormState = "idle" | "submitting" | "success";

export function WaitlistForm({
  slug,
  ctaLabel,
  collectName,
  consentText,
  footnote,
  successTitle,
  successMessage,
  tokens,
  seats,
}: WaitlistFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  // Honeypot — pole niewidoczne dla człowieka, wypełniane przez boty.
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState({
    title: successTitle,
    message: successMessage,
  });

  /**
   * Werdykt adresu, o który właśnie dopytujemy w oknie. `null` = okno zamknięte.
   *
   * Trzymamy werdykt, a nie samo „otwarte/zamknięte", bo od niego zależy treść
   * pytania: przy wp.pl wiemy na pewno, że to nie Google, przy własnej domenie
   * tylko podejrzewamy.
   */
  const [pendingVerdict, setPendingVerdict] =
    useState<EmailProviderVerdict | null>(null);

  /**
   * Adres, dla którego pytanie o konto Google już padło i zostało potwierdzone.
   * Bez tego każde kolejne kliknięcie „Zapisz mnie" (np. po błędzie sieci)
   * otwierałoby to samo okno raz za razem.
   */
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

  /**
   * Radix woła `onOpenChange(false)` także wtedy, gdy okno zamyka przycisk
   * potwierdzenia. Ta flaga odróżnia „zamknięte, bo potwierdzono" od
   * „zamknięte, bo zrezygnowano" — inaczej po potwierdzeniu wysyłki
   * pokazywalibyśmy podpowiedź „popraw adres" w trakcie zapisywania.
   */
  const confirmedRef = useRef(false);

  const fieldId = useId();
  const ids = {
    name: `${fieldId}-name`,
    email: `${fieldId}-email`,
    emailHint: `${fieldId}-email-hint`,
    consent: `${fieldId}-consent`,
    error: `${fieldId}-error`,
    honeypot: `${fieldId}-website`,
  };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "submitting") return;

    // Walidacja po naszej stronie tylko po to, żeby nie wysyłać oczywiście
    // pustego żądania. Źródłem prawdy jest schemat na serwerze.
    if (!email.trim()) {
      setError("Podaj swój adres e-mail.");
      return;
    }

    if (collectName && !name.trim()) {
      setError("Podaj swoje imię.");
      return;
    }

    if (!consent) {
      setError("Zaznacz zgodę, żeby dokończyć zapis.");
      return;
    }

    // Adres spoza Gmaila zatrzymujemy PYTANIEM, nie odmową. Konto Workspace
    // na własnej domenie wygląda stąd identycznie jak zwykła poczta, więc
    // twarda blokada odcinałaby ludzi, dla których wszystko jest w porządku.
    const normalizedEmail = email.trim().toLowerCase();
    const verdict = classifyEmailProvider(normalizedEmail);

    if (verdict !== "google" && confirmedEmail !== normalizedEmail) {
      setError(null);
      setPendingVerdict(verdict);
      return;
    }

    void submit();
  }

  /** Właściwa wysyłka — po przejściu walidacji i ewentualnym potwierdzeniu. */
  async function submit() {
    setError(null);
    setState("submitting");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          email,
          ...(collectName ? { name } : {}),
          consent: true,
          website,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Nie udało się zapisać. Spróbuj ponownie za chwilę.",
        );
      }

      setSuccess({
        title: data?.title || successTitle,
        message: data?.message || successMessage,
      });
      setState("success");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nie udało się zapisać. Spróbuj ponownie za chwilę.",
      );
      setState("idle");
    }
  }

  /** „Wyślij ten adres mimo to" — zapamiętujemy zgodę i wysyłamy. */
  function handleConfirmSend() {
    confirmedRef.current = true;
    setConfirmedEmail(email.trim().toLowerCase());
    setPendingVerdict(null);
    void submit();
  }

  function handleConfirmOpenChange(open: boolean) {
    if (open) return;

    setPendingVerdict(null);

    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }

    // Rezygnacja z wysyłki. Zamiast przestawiać focus (Radix i tak oddaje go
    // przyciskowi po zamknięciu okna) zostawiamy zdanie przy formularzu —
    // czytnik ekranu ogłosi je przez `role="alert"`, a wzrokowo ląduje ono
    // dokładnie tam, gdzie trzeba coś poprawić.
    setError(
      "Wpisz adres Google (Gmail) albo kliknij zapis ponownie i potwierdź wysyłkę tego adresu.",
    );
  }

  if (state === "success") {
    return <SuccessNotice tokens={tokens} {...success} />;
  }

  return (
    <>
      <WaitlistFormShell
        tokens={tokens}
        collectName={collectName}
        ctaLabel={ctaLabel}
        consentText={consentText}
        footnote={footnote}
        seats={seats}
        ids={ids}
        name={name}
        email={email}
        consent={consent}
        website={website}
        onName={setName}
        onEmail={setEmail}
        onConsent={setConsent}
        onWebsite={setWebsite}
        error={error}
        isSubmitting={state === "submitting"}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingVerdict !== null}
        onOpenChange={handleConfirmOpenChange}
        title="Ten adres nie wygląda na konto Google"
        description={
          <GoogleEmailWarning email={email} verdict={pendingVerdict} />
        }
        confirmLabel="Wyślij ten adres"
        cancelLabel="Popraw adres"
        onConfirm={handleConfirmSend}
      />
    </>
  );
}

/**
 * Treść pytania o adres spoza Gmaila.
 *
 * Dwa warianty, bo dwie różne sytuacje. Przy znanym dostawcy (wp.pl, onet)
 * wiemy na pewno, że konta Google tam nie ma, i mówimy to wprost. Przy własnej
 * domenie tylko podejrzewamy — a że firmowy Workspace wygląda dokładnie tak
 * samo, komunikat musi zostawić miejsce na „u mnie jest dobrze".
 */
function GoogleEmailWarning({
  email,
  verdict,
}: {
  email: string;
  verdict: EmailProviderVerdict | null;
}) {
  const domain = emailDomain(email);

  return (
    <>
      <span className="block">
        Dostęp do materiałów działa wyłącznie przez logowanie Google. Adres
        {domain ? (
          <>
            {" "}
            w domenie <strong className="font-semibold">{domain}</strong>
          </>
        ) : (
          ", który podałaś,"
        )}{" "}
        {verdict === "foreign"
          ? "nie jest kontem Google — na takim adresie nie zalogujesz się do konta i nie odbierzesz dostępu."
          : "nie wygląda na konto Google — jeśli nim nie jest, nie zalogujesz się do konta i nie odbierzesz dostępu."}
      </span>

      <span className="mt-3 block">
        {verdict === "foreign"
          ? "Wpisz adres @gmail.com — to zajmie chwilę, a zaoszczędzi tłumaczenia później."
          : "Jeśli ta domena jest obsługiwana przez Google Workspace, wszystko gra — wyślij ten adres. W przeciwnym razie wpisz adres @gmail.com."}
      </span>
    </>
  );
}

/** Ekran po udanym zapisie. Wydzielony, bo kreator pokazuje go jako podgląd. */
export function SuccessNotice({
  title,
  message,
  tokens,
}: {
  title: string;
  message: string;
  tokens: ThemeTokens;
}) {
  return (
    <div
      // role="status" sprawia, że czytnik ekranu ogłosi potwierdzenie —
      // formularz znika, więc bez tego zmiana byłaby niezauważalna.
      role="status"
      className={cn("rounded-[12px] border px-5 py-7 text-center", tokens.notice)}
    >
      <div
        className={cn(
          "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full",
          tokens.noticeIcon,
        )}
      >
        <Check size={24} strokeWidth={3} />
      </div>

      <h2 className={cn("text-[20px] font-bold", tokens.heading)}>{title}</h2>

      <div
        className={cn(
          "mt-2 text-[14px] leading-[165%] whitespace-pre-line",
          tokens.body,
        )}
      >
        {message}
      </div>
    </div>
  );
}
