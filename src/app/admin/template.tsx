"use client";

import { motion } from "framer-motion";

/**
 * Przejście między podstronami panelu.
 *
 * `template` (w przeciwieństwie do `layout`) montuje się od nowa przy każdej
 * nawigacji, więc treść nowej strony delikatnie wjeżdża, a sidebar i topbar
 * z layoutu stoją w miejscu. Animujemy wyłącznie opacity + transform — bez
 * reflow i bez wpływu na czas ładowania danych.
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
