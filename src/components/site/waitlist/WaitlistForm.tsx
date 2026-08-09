"use client";

import React, { useId, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
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

  const fieldId = useId();
  const ids = {
    name: `${fieldId}-name`,
    email: `${fieldId}-email`,
    consent: `${fieldId}-consent`,
    error: `${fieldId}-error`,
    honeypot: `${fieldId}-website`,
  };

  async function handleSubmit(event: React.FormEvent) {
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

  if (state === "success") {
    return <SuccessNotice tokens={tokens} {...success} />;
  }

  return (
    <WaitlistFormShell
      tokens={tokens}
      collectName={collectName}
      ctaLabel={ctaLabel}
      consentText={consentText}
      footnote={footnote}
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
