/**
 * Szkielet ładowania podstron panelu.
 *
 * Bez tego pliku najbliższą granicą ładowania był globalny `app/loading.tsx`
 * — leżący NAD layoutem panelu. Przy przejściu między zakładkami Next nie miał
 * więc czego pokazać w środku i ekran stał zamrożony, aż serwer policzył dane
 * nowej strony. Teraz klik od razu zmienia treść na szkielet, a sidebar
 * i topbar zostają na miejscu.
 */

const Bar = ({ className }: { className: string }) => (
  <div className={`admin-skeleton rounded-lg ${className}`} />
);

export default function AdminLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[1600px] space-y-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Ładowanie…</span>

      <div className="space-y-3">
        <Bar className="h-8 w-56" />
        <Bar className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-[180px] rounded-[24px] border border-gray-100 bg-white p-6"
          >
            <Bar className="h-12 w-12 rounded-xl" />
            <Bar className="mt-8 h-4 w-28" />
            <Bar className="mt-3 h-8 w-36" />
          </div>
        ))}
      </div>

      <div className="rounded-[30px] border border-gray-100 bg-white p-8">
        <Bar className="h-5 w-48" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Bar key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
