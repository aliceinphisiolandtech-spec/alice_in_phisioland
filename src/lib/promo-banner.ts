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

const NOTIFY_LIST_SELECT = {
  slug: true,
  consentText: true,
  isActive: true,
  opensAt: true,
  closesAt: true,
  maxSignups: true,
  _count: { select: { subscribers: true } },
} as const;

type SaleWithList = Awaited<ReturnType<typeof findBannerSales>>[number];

function findBannerSales(where: Record<string, unknown>) {
  return prisma.sale.findMany({
    where: { isActive: true, showBanner: true, ...where },
    orderBy: { validFrom: "asc" },
    include: { notifyWaitlist: { select: NOTIFY_LIST_SELECT } },
  });
}

/** Trwająca przecena ma pierwszeństwo przed zaplanowaną; wygasłe odpadają. */
function pickSale(sales: SaleWithList[]) {
  const candidates = sales.filter((sale) => {
    const result = evaluateDiscount(sale);
    return result.usable || result.reason === "not_started";
  });
  const live = candidates.find((s) => evaluateDiscount(s).usable);
  const sale = live ?? candidates[0];
  return sale ? { sale, isLive: Boolean(live) } : null;
}

/**
 * Składa dane dla paska / popupu / strony zapisów z jednej przeceny.
 *
 * `priceVisible = false` ukrywa wszystko, co mówi o cenie (rabat, kwoty,
 * Omnibus). Używa tego strona zapisów, gdy przecena jest jeszcze w piaskownicy,
 * a ogląda ją ktoś spoza niej: wygląd i termin zostają, ceny nie wyciekają
 * przed publikacją.
 */
function buildPromoData(
  sale: SaleWithList,
  isLive: boolean,
  basePrice: number,
  priceVisible: boolean,
): PromoBannerData {
  // Cena liczona jak w koszyku, ale „na niby” z tą jedną przeceną — przed
  // startem pokazuje, ile e-book BĘDZIE kosztował w promocji.
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
    status: isLive ? "live" : "upcoming",
    discountLabel:
      priceVisible && sale.type === "percent" && sale.percentOff
        ? `−${sale.percentOff}%`
        : null,
    // Bez widocznej ceny: promo = regularna, więc widoki uznają, że nie ma
    // czego pokazywać (hasDiscount = false).
    promoPrice: priceVisible ? priced.finalAmount : priced.baseAmount,
    regularPrice: priced.baseAmount,
    lowestPrice30d: priceVisible ? sale.lowestPrice30dGrosze : null,
    startsAt: sale.validFrom?.toISOString() ?? null,
    endsAt: sale.validUntil?.toISOString() ?? null,
    notify:
      notifyOpen && list
        ? { slug: list.slug, consentText: list.consentText }
        : null,
  };
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

    const sales = await findBannerSales(
      sandboxActive ? {} : { isSandbox: false },
    );
    const picked = pickSale(sales);
    if (!picked) return null;

    const { basePrice } = resolveSettingsBasePrice(settings, sandboxActive);
    return buildPromoData(picked.sale, picked.isLive, basePrice, true);
  } catch (error) {
    // Woła to layout całej części publicznej — błąd bazy ma zgasić pasek
    // i popup, a nie wywrócić każdą stronę.
    console.error("Promo banner query error:", error);
    return null;
  }
}

/**
 * Promocja podpięta pod konkretną listę zapisów — dla strony /zapisy/<slug>.
 *
 * Strona listy dostaje wygląd promocji (jak popup), gdy jakaś przecena
 * z paskiem wskazuje tę listę w „Popup: zapis »Powiadom mnie«”. Wygląd
 * i termin widać zawsze; ceny tylko wtedy, gdy przecena jest opublikowana
 * albo ogląda ją admin w piaskownicy (ta sama zasada co w koszyku).
 */
export async function getPromoForWaitlistPage(
  pageId: string,
  viewer: { isAdmin: boolean; email?: string | null },
): Promise<PromoBannerData | null> {
  try {
    const settings = await getPricingSettings();
    const sandboxActive = viewer.isAdmin
      ? isSandboxActiveFor(settings, viewer)
      : false;

    const sales = await findBannerSales({ notifyWaitlistId: pageId });
    const picked = pickSale(sales);
    if (!picked) return null;

    const priceVisible = !picked.sale.isSandbox || sandboxActive;
    const { basePrice } = resolveSettingsBasePrice(settings, sandboxActive);
    return buildPromoData(picked.sale, picked.isLive, basePrice, priceVisible);
  } catch (error) {
    console.error("Promo waitlist query error:", error);
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
