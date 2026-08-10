"use client";

import { useEffect } from "react";

/**
 * Ustawia widok tak, żeby karta kampanii wylądowała na środku ekranu zaraz
 * po wejściu na stronę.
 *
 * Samo CSS tego nie zrobi: kontener karty ma pełną wysokość okna, ale leży
 * POD navbarem, który jest w normalnym flow. Przeglądarka otwiera stronę na
 * pozycji 0, więc karta wychodzi o wysokość navbara poniżej środka ekranu.
 * Przewinięcie o tę różnicę jest jedyną rzeczą, którą trzeba tu dorobić.
 *
 * Świadomie NIE robimy tego przez `position: absolute` na navbarze: miał zostać
 * w flow strony, żeby tło kampanii sięgało samej góry okna i nic go nie
 * przykrywało.
 */
export function CenterCardOnLoad({ targetId }: { targetId: string }) {
  useEffect(() => {
    /*
     * Nie porywamy widoku komuś, kto już go sobie ustawił.
     *
     * Powrót przyciskiem „wstecz" przywraca pozycję przewinięcia, a kotwica
     * w adresie wskazuje konkretne miejsce na stronie. W obu przypadkach
     * przewinięcie do karty byłoby zabraniem sterowania użytkownikowi.
     */
    if (window.scrollY > 0 || window.location.hash) return;

    const card = document.getElementById(targetId);
    if (!card) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /*
     * Po `requestAnimationFrame`, bo w tym samym momencie karta zaczyna swoją
     * animację wejścia (przesunięcie w górę). Liczenie pozycji w trakcie
     * pierwszej klatki dawałoby wynik zaniżony o wysokość tego przesunięcia.
     */
    const frame = requestAnimationFrame(() => {
      card.scrollIntoView({
        block: "center",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [targetId]);

  return null;
}
