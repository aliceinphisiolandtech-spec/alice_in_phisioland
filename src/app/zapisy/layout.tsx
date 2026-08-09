import React from "react";

/**
 * Szkielet stron zapisów — celowo poza grupą `(site)`.
 *
 * Strona kampanijna ma jedno zadanie: zebrać adres. Pełna nawigacja dawałaby
 * kilkanaście wyjść z tej strony, więc jej tu nie ma.
 *
 * Layout jest bezbarwny, bo siedzi NAD segmentem `[slug]` i nie zna motywu
 * konkretnej kampanii. Tło, logo i stopkę renderuje sama strona — tylko ona wie,
 * czy kampania jest zielona, jasna czy grafitowa.
 */
export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
