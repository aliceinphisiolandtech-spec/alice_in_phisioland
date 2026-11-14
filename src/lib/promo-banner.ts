import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { evaluateDiscount } from "@/lib/discounts";
import { formatPromoRange, resolveBannerText } from "@/lib/promo-banner-format";
import {
  getPricingSettings,
  isSandboxActiveFor,
  resolveSettingsBasePrice,
} from "@/lib/pricing-settings";
import { calculatePrice } from "@/lib/pricing-engine";
import { resolveWaitlistPageStatus } from "@/lib/waitlist-status";

/**
 * Pasek i popup promocji na stronie głównej.
 *
 * Steruje nimi sekcja „Pasek na stronie głównej” w formularzu przeceny
 * (/admin/rabaty). Termin, rabat i cena pochodzą z tego samego rekordu co
 * okno w silniku cenowym, więc nie da się ich rozjechać z koszykiem.
 *
 * Widać je, gdy przecena ma włączony pasek, sama jest włączona i nie
 * wygasła ani nie wyczerpała limitu — także PRZED startem (zapowiedź terminu).
 *
 * PIASKOWNICA: tak samo jak w koszyku (lib/checkout-pricing) — przeceny
 * z flagą `isSandbox` widzi WYŁĄCZNIE admin przy włączonym trybie testowym.
 * Dla klientek filtr siedzi w zapytaniu, więc testowa promocja nie może im
 * się pokazać.
 */

export interface PromoBannerData {
  /** ID przeceny — popup zapamiętuje po nim, że klientka go już zamknęła. */
  saleId: string;
  text: string;
  /** "23–30.11.2026", "od 23.11.2026", "do 30.11.2026" albo null (brak okna). */
  dateLabel: string | null;
  /** "upcoming" = zapowiedź przed startem, "live" = promocja trwa. */
  status: "upcoming" | "live";
  /** Etykieta rabatu, np. "−20%"; null przy cenie docelowej. */
  discountLabel: string | null;
  /** Cena w promocji i bez niej (grosze) — tym samym silnikiem co koszyk. */
  promoPrice: number;
  regularPrice: number;
  /** Omnibus: najniższa cena z 30 dni przed obniżką (grosze) albo null. */
  lowestPrice30d: number | null;
  /** Granice okna (ISO) — popup odlicza do startu, a w trakcie do końca. */
  startsAt: string | null;
  endsAt: string | null;
  /**
   * Formularz „Powiadom mnie” — tylko gdy przecena ma podpiętą listę i ta
   * lista właśnie przyjmuje zapisy. Treść zgody idzie z listy (RODO: ta sama,
   * którą zapisujemy przy subskrybencie).
   */
  notify: { slug: string; consentText: string } | null;
}

async function loadPromoBanner(
  isAdmin: boolean,
  email: string | null,
): Promise<PromoBannerData | null> {
  try {
    const settings = await getPricingSettings();
    const sandboxActive = isAdmin
      ? isSandboxActiveFor(settings, { isAdmin, email })
      : false;

    const sales = await prisma.sale.findMany({
      where: {
        isActive: true,
        showBanner: true,
        ...(sandboxActive ? {} : { isSandbox: false }),
      },
      orderBy: { validFrom: "asc" },
      include: {
        notifyWaitlist: {
          select: {
            slug: true,
            consentText: true,
            isActive: true,
            opensAt: true,
            closesAt: true,
            maxSignups: true,
            _count: { select: { subscribers: true } },
          },
        },
      },
    });

    // Trwająca przecena ma pierwszeństwo przed zaplanowaną.
    const candidates = sales.filter((sale) => {
      const result = evaluateDiscount(sale);
      return result.usable || result.reason === "not_started";
    });
    const live = candidates.find((s) => evaluateDiscount(s).usable);
    const sale = live ?? candidates[0];
    if (!sale) return null;

    // Cena liczona jak w koszyku, ale „na niby” z tą jedną przeceną — przed
    // startem pokazuje, ile e-book BĘDZIE kosztował w promocji.
    const { basePrice } = resolveSettingsBasePrice(settings, sandboxActive);
    const priced = calculatePrice({
      baseAmount: basePrice,
      sales: [
        {
          id: sale.id,
          name: sale.name,
          type: sale.type,
          percentOff: sale.percentOff,
          fixedPrice: sale.fixedPrice,
        },
      ],
    });

    const list = sale.notifyWaitlist;
    const notifyOpen =
      list !== null &&
      resolveWaitlistPageStatus({
        ...list,
        signupCount: list._count.subscribers,
      }) === "open";

    return {
      saleId: sale.id,
      text: resolveBannerText(sale.bannerText, sale.name),
      dateLabel: formatPromoRange(sale.validFrom, sale.validUntil),
      status: live ? "live" : "upcoming",
      discountLabel:
        sale.type === "percent" && sale.percentOff
          ? `−${sale.percentOff}%`
          : null,
      promoPrice: priced.finalAmount,
      regularPrice: priced.baseAmount,
      lowestPrice30d: sale.lowestPrice30dGrosze,
      startsAt: sale.validFrom?.toISOString() ?? null,
      endsAt: sale.validUntil?.toISOString() ?? null,
      notify:
        notifyOpen && list
          ? { slug: list.slug, consentText: list.consentText }
          : null,
    };
  } catch (error) {
    // Woła to layout całej części publicznej — błąd bazy ma zgasić pasek
    // i popup, a nie wywrócić każdą stronę.
    console.error("Promo banner query error:", error);
    return null;
  }
}

/**
 * `cache` z Reacta: layout (pasek) i strona główna (popup) pytają o to samo
 * w jednym żądaniu — baza dostaje jedno zapytanie zamiast dwóch. Klucz to
 * prymitywy, bo `cache` porównuje argumenty przez referencję.
 */
const cachedPromoBanner = cache(loadPromoBanner);

export function getPromoBanner(viewer?: {
  isAdmin: boolean;
  email?: string | null;
}): Promise<PromoBannerData | null> {
  return cachedPromoBanner(viewer?.isAdmin ?? false, viewer?.email ?? null);
}
