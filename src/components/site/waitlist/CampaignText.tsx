import React from "react";
import { cn } from "@/lib/utils/cn";
import type { ThemeTokens } from "@/lib/waitlist-appearance";
import { splitAroundHighlight } from "@/lib/waitlist-text";

/**
 * Nagłówek i opis kampanii. Współdzielone przez stronę publiczną i kreator,
 * żeby podświetlenie i typografia nie mogły się rozjechać między nimi.
 */

/**
 * Podkreślenie akcentem pod wyróżnionym fragmentem.
 *
 * Kładziemy je jako osobny element ZA tekstem (`-z-10`), a nie jako tło samego
 * napisu — dzięki temu pasek ma stałą wysokość niezależnie od wielkości liter
 * i wygląda jak zamalowanie zakreślaczem, a nie jak wyróżnienie w edytorze.
 */
export function HighlightedText({
  text,
  highlight,
  highlightClass,
}: {
  text: string;
  highlight: string | null | undefined;
  highlightClass: string;
}) {
  const parts = splitAroundHighlight(text, highlight);

  if (!parts.highlighted) return <>{parts.before}</>;

  return (
    <>
      {parts.before}
      <span className="relative">
        <span
          aria-hidden
          className={cn(
            "absolute bottom-[5px] left-0 -z-10 h-3 w-full",
            highlightClass,
          )}
        />
        {parts.highlighted}
      </span>
      {parts.after}
    </>
  );
}

export function CampaignHeadline({
  headline,
  highlight,
  tokens,
  className,
}: {
  headline: string;
  highlight: string | null;
  tokens: ThemeTokens;
  className?: string;
}) {
  return (
    <h1 className={cn(className, tokens.heading)}>
      <HighlightedText
        text={headline}
        highlight={highlight}
        highlightClass={tokens.highlight}
      />
    </h1>
  );
}

export function CampaignDescription({
  description,
  tokens,
  className,
}: {
  description: string;
  tokens: ThemeTokens;
  className?: string;
}) {
  return <p className={cn(className, tokens.body)}>{description}</p>;
}
