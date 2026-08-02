import type { Variants, Transition } from "framer-motion";

/**
 * Współdzielone warianty animacji dla stron marketingowych (landing, strefa pacjenta).
 *
 * Zasady wydajności:
 * - Animujemy WYŁĄCZNIE `opacity` oraz `transform` (x/y/scale) — są akcelerowane
 *   przez GPU i nie wywołują reflow, więc nie spowalniają renderu.
 * - Sekcje uruchamiają się przez `whileInView` z `viewport.once = true`,
 *   dzięki czemu każda animacja odpala się dokładnie raz (brak pracy przy scrollu).
 * - framer-motion jest już w zależnościach projektu — nie dokładamy nic do bundla.
 */

// Płynne, nowoczesne wejście (ease "out-expo"-podobny).
const EASE_OUT: Transition["ease"] = [0.21, 0.47, 0.32, 0.98];

// Domyślna konfiguracja viewportu — start lekko przed wejściem elementu w kadr.
export const VIEWPORT = { once: true, amount: 0.2, margin: "0px 0px -80px 0px" } as const;

/** Pojawienie się z dołu — bazowy "reveal" dla większości elementów. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Delikatniejsze pojawienie się z dołu (dla mniejszych elementów / list). */
export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Wjazd z lewej. */
export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};

/** Wjazd z prawej. */
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};

/** Subtelne przybliżenie — dla grafik / obrazów. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } },
};

/**
 * Kontener z efektem "stagger" — dzieci (z wariantem hidden/visible)
 * pojawiają się po kolei. Użyj na opakowaniu, a `fadeUp`/`fadeUpSm` na dzieciach.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

/** Szybszy stagger dla gęstych list (FAQ, karty cech). */
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

/**
 * Gotowe propsy do wpięcia w <motion.*> dla sekcji "reveal na scroll".
 * Przykład: <motion.div {...revealOnScroll} variants={staggerContainer}>
 */
export const revealOnScroll = {
  initial: "hidden" as const,
  whileInView: "visible" as const,
  viewport: VIEWPORT,
};
