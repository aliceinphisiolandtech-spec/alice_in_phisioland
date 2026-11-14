import {
  LayoutDashboard,
  MailboxIcon,
  MailPlus,
  FilePenLine,
  BellRing,
  TicketPercent,
  PlayCircle,
  MessageSquareQuote,
  type LucideIcon,
} from "lucide-react";

/**
 * Jedna lista zakładek panelu — czyta ją Sidebar (menu) i Topbar (tytuł
 * bieżącej strony). Dzięki temu nazwa w nagłówku nie rozjedzie się z menu.
 */
export type AdminNavSection = "Przegląd" | "Sprzedaż" | "Treści" | "Wkrótce";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  locked: boolean;
  section: AdminNavSection;
  /** Krótki opis pod tytułem w górnym pasku. */
  hint: string;
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    locked: false,
    section: "Przegląd",
    hint: "Sprzedaż i najważniejsze liczby",
  },
  {
    label: "Rabaty",
    href: "/admin/rabaty",
    icon: TicketPercent,
    locked: false,
    section: "Sprzedaż",
    hint: "Kody, przeceny i pasek promocji",
  },
  {
    label: "Zapisy na listę",
    href: "/admin/zapisy",
    icon: MailPlus,
    locked: false,
    section: "Sprzedaż",
    hint: "Strony zapisów i MailerLite",
  },
  {
    label: "Aktualności",
    href: "/admin/news",
    icon: BellRing,
    locked: false,
    section: "Treści",
    hint: "Komunikaty dla kursantów",
  },
  {
    label: "CMS",
    href: "/admin/cms",
    icon: FilePenLine,
    locked: false,
    section: "Treści",
    hint: "Teksty strony głównej",
  },
  {
    label: "Opinie",
    href: "/admin/opinie",
    icon: MessageSquareQuote,
    locked: false,
    section: "Treści",
    hint: "Opinie na stronie głównej",
  },
  {
    label: "Newsletter",
    href: "#",
    icon: MailboxIcon,
    locked: true,
    section: "Wkrótce",
    hint: "",
  },
  {
    label: "Kursy Video",
    href: "#",
    icon: PlayCircle,
    locked: true,
    section: "Wkrótce",
    hint: "",
  },
];

export const adminNavSections: AdminNavSection[] = [
  "Przegląd",
  "Sprzedaż",
  "Treści",
  "Wkrótce",
];

/**
 * Zakładka aktywna dla adresu. Podstrony też się liczą (`/admin/zapisy/abc`
 * podświetla „Zapisy na listę”) — wcześniej porównanie było dokładne i na
 * edycji kampanii czy wpisu menu nie pokazywało, gdzie jesteś.
 */
export function getActiveNavItem(pathname: string): AdminNavItem | null {
  let best: AdminNavItem | null = null;

  for (const item of adminNavItems) {
    if (item.locked) continue;
    const matches =
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
    if (matches && (!best || item.href.length > best.href.length)) best = item;
  }

  return best;
}
