/**
 * Awaryjne wstrzymanie sprzedaży.
 *
 * Włączone po incydencie bezpieczeństwa w Fakturowni (wykryty 28.09.2026),
 * w której przez API automatycznie wystawialiśmy faktury za zakupy. Klucze API
 * zostały wygaszone, więc faktur nie da się teraz wystawić.
 * Dopóki flaga jest true:
 * - /api/checkout/intent odrzuca każdą próbę utworzenia płatności (503),
 * - strona /zakup pokazuje baner zamiast formularza i płatności.
 *
 * Webhook Stripe zostaje bez zmian — płatność rozpoczęta przed blokadą musi
 * nadal przyznać dostęp do e-booka.
 *
 * Aby przywrócić sprzedaż: ustaw false i wdróż.
 */
export const SALES_PAUSED = true;

export const SALES_PAUSED_MESSAGE =
  "Zakup e-booka jest chwilowo niemożliwy z powodu incydentu bezpieczeństwa w Fakturowni, w której automatycznie wystawialiśmy faktury.";
