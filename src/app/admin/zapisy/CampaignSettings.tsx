"use client";

import React, { useId } from "react";
import {
  CalendarClock,
  Highlighter,
  Link2,
  Loader2,
  Palette,
  RefreshCw,
  Send,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DatePicker } from "@/components/ui/DatePicker";
import { isoToLocalInput } from "@/lib/date-input";
import {
  Collapse,
  FormSection,
  SegmentedControl,
  SwitchRow,
  inputClass,
  labelClass,
} from "@/components/admin/ui/primitives";
import {
  THEME_SWATCHES,
  WAITLIST_LAYOUTS,
  WAITLIST_THEMES,
  type WaitlistTheme,
} from "@/lib/waitlist-appearance";
import type { CampaignFormState, GroupsState } from "./types";

/**
 * Panel ustawień kreatora — wszystko, czego NIE da się kliknąć na stronie.
 *
 * Podział jest celowy: teksty widoczne dla odbiorcy edytuje się wprost na
 * kanwie, a tutaj zostają rzeczy niewidoczne (adres, grupa w MailerLite,
 * terminy) i przełączniki wyglądu, których efekt widać na kanwie od razu.
 */

/**
 * Sekcje panelu — jedna lista dla rozwiniętego widoku i dla paska ikon
 * po zwinięciu. Gdyby ikony miały własną listę, po dodaniu sekcji trzeba by
 * pamiętać o dwóch miejscach i prędzej czy później rozjechałyby się.
 *
 * `id` służy jednocześnie za kotwicę: kliknięcie ikony rozwija panel
 * i przewija do właściwej sekcji.
 */
export const SETTINGS_SECTIONS = [
  { id: "ustawienia-adres", label: "Adres i nazwa", icon: Link2 },
  { id: "ustawienia-wyglad", label: "Wygląd", icon: Palette },
  { id: "ustawienia-mailerlite", label: "Gdzie trafiają adresy", icon: Send },
  { id: "ustawienia-okno", label: "Kiedy zbiera zapisy", icon: CalendarClock },
  {
    id: "ustawienia-podkreslenie",
    label: "Podkreślenie w nagłówku",
    icon: Highlighter,
  },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

/**
 * Kotwica sekcji. `scroll-mt-24` odsuwa cel przewijania spod przyklejonego
 * paska zapisu — bez tego nagłówek sekcji lądowałby pod nim i wyglądałoby to
 * na przewinięcie w złe miejsce.
 */
function SectionAnchor({
  id,
  children,
}: {
  id: SettingsSectionId;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      {children}
    </div>
  );
}

interface CampaignSettingsProps {
  form: CampaignFormState;
  set: <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) => void;
  onSlugEdited: () => void;
  groups: GroupsState;
  onReloadGroups: () => void;
  previewUrl: string;
  isEditing: boolean;
  /** Ile miejsc już zajęto. Null przy nowej kampanii — jeszcze nie istnieje. */
  signupCount: number | null;
}

export function CampaignSettings({
  form,
  set,
  onSlugEdited,
  groups,
  onReloadGroups,
  previewUrl,
  isEditing,
  signupCount,
}: CampaignSettingsProps) {
  const fieldId = useId();
  const hasTimeWindow = Boolean(form.opensAt || form.closesAt);
  /** Grafika ma sens tylko w układach, które ją pokazują. */
  const usesHeroImage =
    form.layoutVariant === "hero" || form.layoutVariant === "split";

  return (
    <div className="flex flex-col gap-7">
      {/* --- ADRES --- */}
      <SectionAnchor id="ustawienia-adres">
        <FormSection
          title="Adres i nazwa"
          description="Nazwa robocza jest tylko dla Ciebie. Adres widzą wszyscy."
        >
          <div>
            <label htmlFor={`${fieldId}-name`} className={labelClass}>
              Nazwa robocza
            </label>
            <input
              id={`${fieldId}-name`}
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Promocja letnia 2026"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`${fieldId}-slug`} className={labelClass}>
              Adres strony
            </label>
            <input
              id={`${fieldId}-slug`}
              value={form.slug}
              onChange={(event) => {
                onSlugEdited();
                set("slug", event.target.value);
              }}
              placeholder="promocja-lato"
              className={cn(inputClass, "font-mono")}
            />
            <p className="mt-1 break-all text-xs text-gray-500">{previewUrl}</p>
          </div>

          {isEditing && (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <TriangleAlert size={13} className="mt-0.5 shrink-0" />
              Zmiana adresu unieważnia linki już opublikowane w postach — kto
              kliknie stary, trafi na komunikat o nieistniejącej stronie.
            </p>
          )}
        </FormSection>
      </SectionAnchor>

      {/* --- WYGLĄD --- */}
      <SectionAnchor id="ustawienia-wyglad">
        <FormSection title="Wygląd" description="Efekt widać od razu obok.">
          <div>
            <span className={labelClass}>Układ</span>
            <SegmentedControl
              name="waitlist-layout"
              columns={3}
              value={form.layoutVariant}
              onChange={(value) => set("layoutVariant", value)}
              options={WAITLIST_LAYOUTS.map((layout) => ({
                value: layout.value,
                label: layout.label,
              }))}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              {
                WAITLIST_LAYOUTS.find(
                  (layout) => layout.value === form.layoutVariant,
                )?.description
              }
            </p>
          </div>

          <div>
            <span className={labelClass}>Motyw</span>
            <div className="grid grid-cols-3 gap-2">
              {WAITLIST_THEMES.map((theme) => (
                <ThemeOption
                  key={theme.value}
                  theme={theme.value}
                  label={theme.label}
                  description={theme.description}
                  active={form.theme === theme.value}
                  onSelect={() => set("theme", theme.value)}
                />
              ))}
            </div>
          </div>

          <Collapse open={usesHeroImage}>
            <div className="pt-1">
              <label htmlFor={`${fieldId}-hero`} className={labelClass}>
                Adres grafiki
                {form.layoutVariant === "hero"
                  ? " (wymagany)"
                  : " (opcjonalny)"}
              </label>
              <input
                id={`${fieldId}-hero`}
                value={form.heroImageUrl}
                onChange={(event) => set("heroImageUrl", event.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={cn(inputClass, "font-mono text-xs")}
              />
              <p className="mt-1 text-xs text-gray-500">
                Wklej pełny adres obrazka (kliknij grafikę prawym przyciskiem →
                „Kopiuj adres obrazu”). Nie ma tu wgrywania plików.
              </p>
            </div>
          </Collapse>

          <div>
            <label htmlFor={`${fieldId}-background`} className={labelClass}>
              Zdjęcie w tle strony
            </label>
            <input
              id={`${fieldId}-background`}
              value={form.backgroundImageUrl}
              onChange={(event) => set("backgroundImageUrl", event.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={cn(inputClass, "font-mono text-xs")}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leży pod całą stroną — karta z formularzem zostaje na wierzchu,
              nietknięta. Tekst POZA kartą przechodzi wtedy na jasny, żeby dało
              się go przeczytać na zdjęciu.
            </p>
          </div>

          {/* Suwak ma sens tylko wtedy, gdy jest co przykrywać. */}
          <Collapse open={Boolean(form.backgroundImageUrl.trim())}>
            <div className="pt-1">
              <label htmlFor={`${fieldId}-overlay`} className={labelClass}>
                Krycie nakładki — {form.overlayOpacity}%
              </label>
              <input
                id={`${fieldId}-overlay`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.overlayOpacity}
                onChange={(event) =>
                  set("overlayOpacity", Number(event.target.value))
                }
                className="w-full cursor-pointer accent-[#0c493e]"
              />
              <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                <span>Samo zdjęcie</span>
                <span>Sam kolor</span>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Im wyżej, tym mocniej kolor marki przykrywa zdjęcie. Przy niskim
                kryciu tekst poza kartą zaczyna ginąć na jaśniejszych zdjęciach —
                sprawdź efekt na podglądzie obok.
              </p>
            </div>
          </Collapse>

          <div>
            <label htmlFor={`${fieldId}-og`} className={labelClass}>
              Obrazek podglądu w social mediach
            </label>
            <input
              id={`${fieldId}-og`}
              value={form.ogImageUrl}
              onChange={(event) => set("ogImageUrl", event.target.value)}
              placeholder="https://..."
              className={cn(inputClass, "font-mono text-xs")}
            />
            <p className="mt-1 text-xs text-gray-500">
              To widać po wklejeniu linku na Instagramie czy Facebooku. Puste =
              standardowy obrazek strony. Zalecany format poziomy, 1200×630 px.
            </p>
          </div>
        </FormSection>
      </SectionAnchor>

      {/* --- MAILERLITE --- */}
      <SectionAnchor id="ustawienia-mailerlite">
        <FormSection
          title="Gdzie trafiają adresy"
          description="Każdy zapis ląduje najpierw w naszej bazie, a potem jest wysyłany do MailerLite."
        >
          <GroupPicker
            id={`${fieldId}-group`}
            value={form.mailerliteGroupId}
            onChange={(value) => set("mailerliteGroupId", value)}
            groups={groups}
            onReload={onReloadGroups}
          />

          <SwitchRow
            checked={form.collectName}
            onChange={() => set("collectName", !form.collectName)}
            title="Pytaj też o imię"
            description="Pozwala pisać maile ze zwrotem po imieniu. Każde dodatkowe pole obniża jednak liczbę zapisów."
          />
        </FormSection>
      </SectionAnchor>

      {/* --- OKNO ZAPISÓW --- */}
      <SectionAnchor id="ustawienia-okno">
        <FormSection
          title="Kiedy strona zbiera zapisy"
          description="Wyłącznik działa natychmiast i ma pierwszeństwo przed datami."
        >
          <SwitchRow
            checked={form.isActive}
            onChange={() => set("isActive", !form.isActive)}
            title="Strona włączona"
            description={
              form.isActive
                ? "Link działa i przyjmuje zapisy."
                : "Link pokazuje komunikat o zamkniętych zapisach."
            }
            tone={form.isActive ? "brand" : "warn"}
          />

          <SwitchRow
            checked={hasTimeWindow}
            onChange={() => {
              if (hasTimeWindow) {
                set("opensAt", "");
                set("closesAt", "");
              } else {
                // Włączenie bez wypełnienia dat nic by nie zmieniło — od razu
                // podstawiamy dzisiejszą datę jako początek okna.
                set("opensAt", isoToLocalInput(new Date().toISOString()));
              }
            }}
            title="Ogranicz czasowo"
            description="Zapisy same się otworzą i zamkną w wybranych dniach."
          >
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor={`${fieldId}-opens`} className={labelClass}>
                  Start zapisów
                </label>
                <DatePicker
                  id={`${fieldId}-opens`}
                  value={form.opensAt}
                  onChange={(value) => set("opensAt", value)}
                  dayTime="00:00"
                  placeholder="Od zawsze"
                  ariaLabel="Data rozpoczęcia zapisów"
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-closes`} className={labelClass}>
                  Koniec zapisów (włącznie)
                </label>
                <DatePicker
                  id={`${fieldId}-closes`}
                  value={form.closesAt}
                  onChange={(value) => set("closesAt", value)}
                  dayTime="23:59"
                  placeholder="Bezterminowo"
                  ariaLabel="Data zakończenia zapisów"
                />
              </div>

              <p className="text-xs text-gray-500">
                Ostatni dzień liczy się w całości — zapisy zamkną się o 23:59.
              </p>
            </div>
          </SwitchRow>

          <SwitchRow
            checked={form.maxSignups !== ""}
            onChange={() =>
              set("maxSignups", form.maxSignups === "" ? "100" : "")
            }
            title="Ogranicz liczbę miejsc"
            description="Po zebraniu tylu adresów strona sama przestanie je przyjmować."
          >
            <div>
              <label htmlFor={`${fieldId}-max`} className={labelClass}>
                Maksymalna liczba zapisów
              </label>
              <input
                id={`${fieldId}-max`}
                type="number"
                min={0}
                step={1}
                value={form.maxSignups}
                onChange={(event) => set("maxSignups", event.target.value)}
                placeholder="np. 100"
                className={inputClass}
              />

              {signupCount !== null && (
                <p className="mt-1.5 text-xs text-gray-500">
                  Zajęte miejsca: <strong>{signupCount}</strong>
                  {form.maxSignups !== "" && ` z ${form.maxSignups}`}.
                </p>
              )}

              {/*
                Limit poniżej liczby już zebranych adresów zamyka zapisy
                natychmiast po zapisaniu. Bywa to zamierzone („dość, kończymy"),
                ale częściej jest pomyłką — mówimy o tym wprost, zanim ktoś
                kliknie zapisz i zdziwi się, że link przestał działać.
              */}
              {signupCount !== null &&
                form.maxSignups !== "" &&
                Number(form.maxSignups) <= signupCount && (
                  <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                    Ten limit jest już osiągnięty — po zapisaniu strona
                    przestanie przyjmować kolejne adresy.
                  </p>
                )}
            </div>
          </SwitchRow>
        </FormSection>
      </SectionAnchor>

      {/* --- WYRÓŻNIENIE --- */}
      <SectionAnchor id="ustawienia-podkreslenie">
        <FormSection
          title="Podkreślenie w nagłówku"
          description="Fragment nagłówka zamalowany akcentem."
        >
          <div>
            <label htmlFor={`${fieldId}-highlight`} className={labelClass}>
              Wyróżniony fragment
            </label>
            <input
              id={`${fieldId}-highlight`}
              value={form.highlight}
              onChange={(event) => set("highlight", event.target.value)}
              placeholder="np. Promocja letnia"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              Musi występować w nagłówku. Jeśli się nie zgadza, nagłówek
              wyświetli się bez podkreślenia — zobaczysz to od razu obok.
            </p>
          </div>
        </FormSection>
      </SectionAnchor>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Wybór grupy MailerLite                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Lista grup z konta albo — gdy MailerLite nie odpowiada — ręczne pole na ID.
 *
 * Awaria cudzego API nie może zablokować założenia kampanii, więc każdy stan
 * poza „ok" degraduje się do zwykłego inputa zamiast wyłączać sekcję.
 */
function GroupPicker({
  id,
  value,
  onChange,
  groups,
  onReload,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  groups: GroupsState;
  onReload: () => void;
}) {
  if (groups.status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        <Loader2 size={14} className="animate-spin" />
        Pobieram grupy z MailerLite…
      </div>
    );
  }

  if (groups.status === "ok") {
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          Grupa w MailerLite
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, "cursor-pointer")}
        >
          <option value="">Bez grupy — zapisuj tylko do bazy tej strony</option>
          {groups.groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.activeCount} kontaktów)
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onReload}
          className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-[#0c493e]"
        >
          <RefreshCw size={11} />
          Odśwież listę grup
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        ID grupy w MailerLite
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="np. 123456789"
        className={cn(inputClass, "font-mono")}
      />

      <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <TriangleAlert size={13} className="mt-0.5 shrink-0" />
        <span>
          {groups.message} Zostaw puste, jeśli na razie wystarczy zbieranie
          adresów do bazy — dobowy cron dośle je do MailerLite, gdy integracja
          zacznie działać.
        </span>
      </p>

      <button
        type="button"
        onClick={onReload}
        className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-[#0c493e]"
      >
        <RefreshCw size={11} />
        Spróbuj ponownie
      </button>
    </div>
  );
}

function ThemeOption({
  theme,
  label,
  description,
  active,
  onSelect,
}: {
  theme: WaitlistTheme;
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  const [background, surface, accent] = THEME_SWATCHES[theme];

  return (
    <button
      type="button"
      onClick={onSelect}
      title={description}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-2 py-3 transition-colors duration-200",
        active
          ? "border-[#0c493e] bg-[#0c493e]/5"
          : "border-gray-200 hover:border-gray-300",
      )}
    >
      <span className="flex items-center gap-1">
        <span
          className={cn(
            "h-4 w-4 rounded-full border border-black/10",
            background,
          )}
        />
        <span
          className={cn("h-4 w-4 rounded-full border border-black/10", surface)}
        />
        <span
          className={cn("h-4 w-4 rounded-full border border-black/10", accent)}
        />
      </span>
      <span
        className={cn(
          "text-xs font-bold",
          active ? "text-[#0c493e]" : "text-gray-500",
        )}
      >
        {label}
      </span>
    </button>
  );
}
