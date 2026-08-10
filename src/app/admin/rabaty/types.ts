import type { DiscountType } from "@/lib/discounts";

/**
 * Wiersze przekazywane z serwera do panelu.
 * Daty jako stringi ISO — komponenty klienckie i tak konwertują je na potrzeby
 * inputów typu `date`, a string przechodzi przez granicę serwer/klient bez
 * niespodzianek.
 */

export interface PricingSettingsRow {
  basePriceGrosze: number;
  regularPriceGrosze: number;
  sandboxEnabled: boolean;
  sandboxBasePriceGrosze: number | null;
}

export interface DiscountRow {
  id: string;
  code: string;
  type: DiscountType;
  percentOff: number | null;
  amountOff: number | null;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  /** Utworzone lub zmienione w piaskownicy — niewidoczne dla klientek. */
  isSandbox: boolean;
  stackableWithSale: boolean;
  /** Suma rabatów udzielonych tym kodem (grosze, tylko opłacone zamówienia). */
  totalDiscountGrosze: number;
}

export interface SaleRow {
  id: string;
  name: string;
  type: "percent" | "fixed_price";
  percentOff: number | null;
  fixedPrice: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  /** Utworzone lub zmienione w piaskownicy — niewidoczne dla klientek. */
  isSandbox: boolean;
  ordersCount: number;
  totalDiscountGrosze: number;
}

/**
 * Kampania zapisów wskazana w adresie (`/admin/rabaty?tab=emails&zapisy=<id>`).
 *
 * Panel dostaje ją z serwera, a nie z paska adresu, bo liczba adresów pokazana
 * w formularzu ma być prawdziwa — a `?zapisy=` niesie samo ID.
 */
export interface WaitlistSourceRow {
  id: string;
  name: string;
  subscriberCount: number;
}

export interface EmailDiscountRow {
  id: string;
  name: string;
  type: DiscountType;
  percentOff: number | null;
  amountOff: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  /** Utworzone lub zmienione w piaskownicy — niewidoczne dla klientek. */
  isSandbox: boolean;
  members: { id: string; email: string }[];
  ordersCount: number;
  totalDiscountGrosze: number;
}
