"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { isoToLocalInput, localInputToIso } from "@/lib/date-input";
import { SegmentedControl } from "@/components/admin/ui/primitives";
import { InlineEdit } from "@/components/admin/waitlist/InlineEdit";
import { NavbarPreview } from "@/components/admin/waitlist/NavbarPreview";
import { CampaignSurface } from "@/components/site/waitlist/CampaignSurface";
import { WaitlistFormShell } from "@/components/site/waitlist/WaitlistFormShell";
import { ClosedNotice } from "@/components/site/waitlist/ClosedNotice";
import { SeatsMeter } from "@/components/site/waitlist/SeatsMeter";
import { SuccessNotice } from "@/components/site/waitlist/WaitlistForm";
import { HighlightedText } from "@/components/site/waitlist/CampaignText";
import {
  DESCRIPTION_CLASSES,
  HEADLINE_CLASSES,
  THEME_TOKENS,
  type ThemeTokens,
} from "@/lib/waitlist-appearance";
import { slugifyWaitlistName } from "@/lib/validators/waitlist";
import {
  createWaitlistPageAction,
  updateWaitlistPageAction,
} from "@/app/actions/waitlist";
import { CampaignSettings, SETTINGS_SECTIONS } from "./CampaignSettings";
import {
  initialCampaignState,
  type CampaignFormState,
  type GroupsState,
  type WaitlistPageRow,
} from "./types";

/**
 * Wizualny kreator strony zapisów.
 *
 * Kanwa po lewej to **ta sama strona**, którą zobaczy odbiorca — renderuje ją
 * `CampaignSurface`, dokładnie ten komponent co `/zapisy/[slug]`. Teksty
 * edytuje się przez kliknięcie w nie, a nie w oddzielnym formularzu obok.
 * Po prawej zostaje wyłącznie to, czego na stronie nie widać (adres, grupa
 * w MailerLite, terminy) i przełączniki wyglądu.
 *
 * Konsekwencja projektowa: podgląd nie może skłamać. Nie ma osobnej makiety,
 * która mogłaby się rozjechać ze stroną po zmianie stylów — jest jeden zestaw
 * komponentów używany w dwóch miejscach.
 */

/**
 * Pobiera grupy z MailerLite i zamienia odpowiedź na stan do wyświetlenia.
 *
 * Funkcja czysta względem Reacta — sama nic nie ustawia, tylko zwraca wynik.
 * Dzięki temu efekt montujący komponent zapisuje stan dopiero PO `await`,
 * a nie synchronicznie w swoim ciele (czego słusznie zabrania
 * `react-hooks/set-state-in-effect`, bo wywołuje kaskadę przerysowań).
 */
async function fetchGroupsState(): Promise<GroupsState> {
  try {
    const response = await fetch("/api/admin/mailerlite/groups");
    const data = await response.json();

    if (data.status === "ok") {
      return { status: "ok", groups: data.groups ?? [] };
    }

    return {
      status:
        data.status === "not_configured" ? "not_configured" : "unavailable",
      message: data.message ?? "Nie udało się pobrać grup z MailerLite.",
    };
  } catch {
    return {
      status: "unavailable",
      message:
        "Nie udało się połączyć z MailerLite. Możesz wpisać ID grupy ręcznie.",
    };
  }
}

/**
 * Klasy opisu bez marginesu górnego — na kanwie odstęp daje opakowanie,
 * żeby obrys pola edycji nie obejmował pustej przestrzeni nad tekstem.
 */
const DESCRIPTION_NO_MARGIN = DESCRIPTION_CLASSES.replace("mt-4", "").trim();

/** Który ekran kampanii pokazuje kanwa. */
type CanvasView = "form" | "success" | "closed";

const CANVAS_VIEWS = [
  { value: "form", label: "Formularz" },
  { value: "success", label: "Po zapisie" },
  { value: "closed", label: "Zamknięte" },
] as const;

export function CampaignEditor({
  row,
  siteUrl,
}: {
  row: WaitlistPageRow | null;
  siteUrl: string;
}) {
  const router = useRouter();
  const isEditing = row !== null;

  const [form, setForm] = useState<CampaignFormState>(() =>
    initialCampaignState(row, isoToLocalInput),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasView, setCanvasView] = useState<CanvasView>("form");
  const [groups, setGroups] = useState<GroupsState>({ status: "loading" });
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);

  /**
   * Czy adres był ruszany ręcznie. Dopóki nie był, podpowiadamy go z nazwy —
   * po pierwszej ręcznej zmianie przestajemy nadpisywać, bo to znaczy, że ktoś
   * świadomie wybrał inny adres.
   */
  const slugTouched = useRef(isEditing);

  /**
   * Ostatnio zapisana wersja, do porównania „czy są niezapisane zmiany".
   *
   * Stan, a nie `useRef`: `isDirty` decyduje o tym, co się renderuje (pasek
   * ostrzeżenia, dostępność przycisku podglądu), a wartości czytanej podczas
   * renderowania nie wolno trzymać w refie — nie wywołałaby przerysowania.
   */
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(initialCampaignState(row, isoToLocalInput)),
  );
  const isDirty = JSON.stringify(form) !== savedSnapshot;

  const tokens = THEME_TOKENS[form.theme];
  const previewUrl = `${siteUrl}/zapisy/${form.slug || "adres-strony"}`;

  /* --- Grupy MailerLite ------------------------------------------------- */

  /**
   * Kreator jest osobną stroną, więc grupy pobieramy przy wejściu.
   *
   * Anulowanie przez flagę, a nie `AbortController`: zapytanie i tak dobiegnie
   * końca, chodzi wyłącznie o to, żeby nie ustawiać stanu komponentu, którego
   * już nie ma na ekranie (odejście z kreatora w trakcie pobierania).
   */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = await fetchGroupsState();
      if (!cancelled) setGroups(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Ponowne pobranie z przycisku „Odśwież" / „Spróbuj ponownie". */
  const loadGroups = useCallback(async () => {
    setGroups({ status: "loading" });
    setGroups(await fetchGroupsState());
  }, []);

  /* --- Ostrzeżenie o niezapisanych zmianach ------------------------------ */

  useEffect(() => {
    if (!isDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  /* --- Edycja ------------------------------------------------------------ */

  const set = useCallback(
    <K extends keyof CampaignFormState>(
      key: K,
      value: CampaignFormState[K],
    ) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const setName = useCallback((value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched.current ? current.slug : slugifyWaitlistName(value),
    }));
  }, []);

  /**
   * Kliknięcie ikony na zwiniętym pasku: rozwiń panel i przewiń do sekcji.
   *
   * Podwójny `requestAnimationFrame`, bo zwinięty panel jest ukryty przez
   * `display: none` — `scrollIntoView` na takim elemencie nic nie robi.
   * Czekamy więc, aż React wykona zmianę w DOM (pierwsza klatka) i przeglądarka
   * policzy układ (druga), a dopiero potem przewijamy.
   */
  const openSettingsSection = useCallback((id: string) => {
    setSettingsCollapsed(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, []);

  /* --- Zapis ------------------------------------------------------------- */

  async function handleSave() {
    if (isSaving) return;

    setError(null);
    setIsSaving(true);

    const payload = {
      slug: form.slug,
      name: form.name,
      headline: form.headline,
      highlight: form.highlight,
      description: form.description,
      ctaLabel: form.ctaLabel,
      footnote: form.footnote,
      successTitle: form.successTitle,
      successMessage: form.successMessage,
      consentText: form.consentText,
      mailerliteGroupId: form.mailerliteGroupId,
      collectName: form.collectName,
      layoutVariant: form.layoutVariant,
      theme: form.theme,
      heroImageUrl: form.heroImageUrl,
      ogImageUrl: form.ogImageUrl,
      backgroundImageUrl: form.backgroundImageUrl,
      overlayOpacity: form.overlayOpacity,
      isActive: form.isActive,
      // Kalendarz oddaje czas lokalny; do bazy idzie ISO. Koniec okna domykamy
      // do 23:59:59.999, żeby ostatni dzień liczył się w całości.
      opensAt: form.opensAt ? localInputToIso(form.opensAt) : null,
      closesAt: form.closesAt ? localInputToIso(form.closesAt, true) : null,
      // Puste pole = brak limitu. Napis zamieniamy na liczbę dopiero tutaj,
      // bo pole liczbowe w Reakcie musi trzymać napis, żeby dało się je opróżnić.
      maxSignups:
        form.maxSignups.trim() === "" ? null : Number(form.maxSignups),
      closedMessage: form.closedMessage,
    };

    const result = isEditing
      ? await updateWaitlistPageAction(row.id, payload)
      : await createWaitlistPageAction(payload);

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      // Błąd może dotyczyć pola z panelu po prawej, który bywa przewinięty
      // poza ekran — komunikat leci też toastem, żeby nie zginął.
      toast.error(result.error);
      return;
    }

    setSavedSnapshot(JSON.stringify(form));

    if (isEditing) {
      toast.success("Zmiany zapisane.");
      router.refresh();
      return;
    }

    toast.success(
      form.isActive
        ? "Strona utworzona i włączona — link działa."
        : "Strona utworzona. Włącz ją, gdy treść będzie gotowa.",
    );
    // Po utworzeniu przechodzimy na adres edycji, żeby kolejny zapis
    // aktualizował rekord zamiast tworzyć drugi taki sam.
    router.replace(`/admin/zapisy/${"id" in result ? result.id : ""}`);
  }

  /* --- Kanwa ------------------------------------------------------------- */

  /**
   * Wszystkie sloty kanwy są funkcjami tokenów — powłoka podaje im właściwy
   * zestaw kolorów (inny w karcie ze zdjęciem, inny na tle strony), dokładnie
   * tak samo jak stronie publicznej.
   */
  const canvasBody = useCallback(
    (slotTokens: ThemeTokens) => {
      if (canvasView === "success") {
        return (
          <SuccessNotice
            tokens={slotTokens}
            title={form.successTitle}
            message={form.successMessage}
          />
        );
      }

      if (canvasView === "closed") {
        return (
          <ClosedNotice
            status="closed"
            message={form.closedMessage}
            opensAt={null}
            tokens={slotTokens}
          />
        );
      }

      return (
        <WaitlistFormShell
          preview
          tokens={slotTokens}
          collectName={form.collectName}
          // Ten sam licznik i w tym samym miejscu co na stronie — pod polem
          // e-mail. Kanwa ma pokazywać komplet treści.
          seats={
            <SeatsMeter
              signupCount={row?.subscriberCount ?? 0}
              maxSignups={
                form.maxSignups.trim() === "" ? null : Number(form.maxSignups)
              }
              tokens={slotTokens}
            />
          }
          ctaLabel={
            <InlineEdit
              value={form.ctaLabel}
              onChange={(value) => set("ctaLabel", value)}
              label="Napis na przycisku"
              align="center"
              className="text-[15px] font-bold"
              placeholder="Zapisz się"
            >
              <span>{form.ctaLabel}</span>
            </InlineEdit>
          }
          consentText={
            <InlineEdit
              value={form.consentText}
              onChange={(value) => set("consentText", value)}
              label="Treść zgody marketingowej"
              multiline
              className="text-[12px] leading-[160%]"
              placeholder="Treść zgody na otrzymywanie informacji handlowych"
            >
              <span>{form.consentText}</span>
            </InlineEdit>
          }
          footnote={
            <InlineEdit
              value={form.footnote}
              onChange={(value) => set("footnote", value)}
              label="Drobny tekst pod przyciskiem"
              align="center"
              className="text-[12px]"
              placeholder="Drobny tekst pod przyciskiem (opcjonalny)"
            >
              <span>{form.footnote}</span>
            </InlineEdit>
          }
        />
      );
    },
    [canvasView, form, set, row],
  );

  /**
   * Pola edycji na kanwie są przyciskami i polami tekstowymi, więc nie
   * dziedziczą koloru z motywu tak jak zwykły tekst — kolor podajemy im wprost
   * tą samą klasą, której użyłaby strona.
   */
  const canvasHeadline = useCallback(
    (slotTokens: ThemeTokens) => (
      <InlineEdit
        value={form.headline}
        onChange={(value) => set("headline", value)}
        label="Nagłówek strony"
        className={cn(HEADLINE_CLASSES, slotTokens.heading)}
        placeholder="Nagłówek strony"
      >
        <h1 className={cn(HEADLINE_CLASSES, slotTokens.heading)}>
          <HighlightedText
            text={form.headline}
            highlight={form.highlight}
            highlightClass={slotTokens.highlight}
          />
        </h1>
      </InlineEdit>
    ),
    [form.headline, form.highlight, set],
  );

  const canvasDescription = useCallback(
    (slotTokens: ThemeTokens) => (
      <div className="mt-4">
        <InlineEdit
          value={form.description}
          onChange={(value) => set("description", value)}
          label="Opis"
          multiline
          // Bez marginesu z DESCRIPTION_CLASSES — daje go już opakowanie wyżej,
          // żeby obrys pola edycji nie obejmował pustego odstępu nad tekstem.
          className={cn(DESCRIPTION_NO_MARGIN, slotTokens.body)}
          placeholder="Opisz, co dostanie osoba, która się zapisze"
        >
          <p className={cn(DESCRIPTION_NO_MARGIN, slotTokens.body)}>
            {form.description}
          </p>
        </InlineEdit>
      </div>
    ),
    [form.description, set],
  );

  return (
    <div className="w-full">
      <EditorHeader
        isEditing={isEditing}
        name={form.name}
        onName={setName}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        previewUrl={previewUrl}
        canOpenPreview={isEditing && !isDirty}
      />

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex gap-6 max-[1200px]:flex-col">
        {/* --- KANWA --- */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Eye size={13} className="text-gray-400" />
              Kliknij dowolny tekst, żeby go zmienić.
            </p>

            <div className="w-[280px] max-[520px]:w-full">
              <SegmentedControl
                name="canvas-view"
                columns={3}
                value={canvasView}
                onChange={setCanvasView}
                options={CANVAS_VIEWS}
              />
            </div>
          </div>

          {/*
            Ramka udaje okno przeglądarki: kanwa jest tą samą stroną, ale siedzi
            w panelu, więc bez wyraźnej granicy zlewałaby się z interfejsem
            i nie byłoby wiadomo, co zobaczy odbiorca, a co jest narzędziem.
          */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              </span>
              <span className="ml-2 truncate font-mono text-[11px] text-gray-500">
                {previewUrl}
              </span>
            </div>

            <div className="relative min-h-[560px]">
              <CampaignSurface
                embedded
                layout={form.layoutVariant}
                theme={form.theme}
                tokens={tokens}
                heroImageUrl={form.heroImageUrl || null}
                backgroundImageUrl={form.backgroundImageUrl || null}
                overlayOpacity={form.overlayOpacity}
                navbar={
                  <NavbarPreview
                    onDark={
                      Boolean(form.backgroundImageUrl) || form.theme !== "light"
                    }
                  />
                }
                headline={canvasHeadline}
                description={canvasDescription}
                body={canvasBody}
              />
            </div>
          </div>
        </div>

        {/* --- USTAWIENIA --- */}
        {/*
          Zwijanie jest sterowane klasami, a nie warunkowym renderowaniem, bo
          poniżej 1200 px panel ląduje pod kanwą na całej szerokości i wtedy
          zwijanie nic nie daje. Klasy `max-[1200px]:` przywracają tam pełny
          panel niezależnie od stanu — bez zgadywania szerokości okna w JS.
        */}
        <aside
          className={cn(
            "shrink-0 transition-[width] duration-300 max-[1200px]:w-full",
            settingsCollapsed ? "w-[64px]" : "w-[380px]",
          )}
        >
          <div className="sticky top-24">
            <SettingsRail
              hidden={!settingsCollapsed}
              onExpand={() => setSettingsCollapsed(false)}
              onOpenSection={openSettingsSection}
            />

            <div
              className={cn(
                "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm max-[1200px]:block",
                settingsCollapsed && "hidden",
              )}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900">Ustawienia</h2>
                <button
                  type="button"
                  onClick={() => setSettingsCollapsed(true)}
                  title="Zwiń panel do ikon"
                  aria-label="Zwiń panel ustawień"
                  className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 max-[1200px]:hidden"
                >
                  <PanelRightClose size={15} />
                </button>
              </div>

              <CampaignSettings
                form={form}
                set={set}
                onSlugEdited={() => {
                  slugTouched.current = true;
                }}
                groups={groups}
                onReloadGroups={loadGroups}
                previewUrl={previewUrl}
                isEditing={isEditing}
                signupCount={row?.subscriberCount ?? null}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Zwinięty panel ustawień — sama kolumna ikon.
 *
 * Ikony pochodzą z tej samej listy co sekcje panelu (`SETTINGS_SECTIONS`),
 * więc dodanie sekcji nie wymaga pamiętania o drugim miejscu.
 *
 * Zwinięcie oddaje kanwie ~300 px szerokości — przy układzie „dwie kolumny"
 * to różnica między oglądaniem strony a oglądaniem jej ściśniętej wersji.
 */
function SettingsRail({
  hidden,
  onExpand,
  onOpenSection,
}: {
  hidden: boolean;
  onExpand: () => void;
  onOpenSection: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm",
        // Poniżej 1200 px panel i tak jest pełnej szerokości pod kanwą,
        // więc pasek ikon nie ma się tam po co pokazywać.
        "max-[1200px]:hidden",
        hidden && "hidden",
      )}
    >
      <button
        type="button"
        onClick={onExpand}
        title="Rozwiń panel ustawień"
        aria-label="Rozwiń panel ustawień"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <PanelRightOpen size={17} />
      </button>

      <span className="my-1 h-px w-6 bg-gray-200" />

      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onOpenSection(section.id)}
            title={section.label}
            aria-label={`Otwórz ustawienia: ${section.label}`}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-[#0c493e]/5 hover:text-[#0c493e]"
          >
            <Icon size={17} />
          </button>
        );
      })}
    </div>
  );
}

function EditorHeader({
  isEditing,
  name,
  onName,
  isDirty,
  isSaving,
  onSave,
  previewUrl,
  canOpenPreview,
}: {
  isEditing: boolean;
  name: string;
  onName: (value: string) => void;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  previewUrl: string;
  canOpenPreview: boolean;
}) {
  return (
    // Pasek zapisu jest przyklejony do góry: kanwa bywa długa, a przewinięcie
    // do przycisku „Zapisz" po każdej poprawce byłoby karą za edycję na dole.
    <div className="sticky top-0 z-30 -mx-8 mb-5 border-b border-gray-200 bg-[#F5F6F8]/95 px-8 py-4 backdrop-blur max-[980px]:-mx-4 max-[980px]:px-4">
      <div className="flex items-center gap-4 max-[720px]:flex-col max-[720px]:items-stretch">
        <Link
          href="/admin/zapisy"
          className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-[#0c493e]"
        >
          <ArrowLeft size={14} />
          Wszystkie kampanie
        </Link>

        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(event) => onName(event.target.value)}
            placeholder="Nazwa robocza kampanii"
            aria-label="Nazwa robocza kampanii"
            className="w-full truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-bold text-gray-900 outline-none transition-colors hover:border-gray-200 focus:border-[#0c493e] focus:bg-white"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isDirty && (
            <span className="text-xs font-semibold text-amber-600">
              Niezapisane zmiany
            </span>
          )}

          {canOpenPreview && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
              title="Otwórz prawdziwą stronę w nowej karcie"
            >
              <ExternalLink size={13} />
              Otwórz stronę
            </a>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#0c493e] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#0a3b32] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isEditing ? "Zapisz zmiany" : "Utwórz stronę"}
          </button>
        </div>
      </div>
    </div>
  );
}
