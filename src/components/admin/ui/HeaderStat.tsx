import { cn } from "@/lib/utils/cn";

/** Mała statystyka w prawym rogu nagłówka strony (PageHeader `actions`). */
export const HeaderStat = ({
  value,
  label,
  accent = false,
}: {
  value: number | string;
  label: string;
  accent?: boolean;
}) => (
  <div
    className={cn(
      "min-w-[104px] rounded-2xl px-4 py-3 ring-1 backdrop-blur-sm",
      accent
        ? "bg-[#c5e96b] text-[#0c493e] ring-[#c5e96b]"
        : "bg-white/10 text-white ring-white/15",
    )}
  >
    <p className="text-2xl font-extrabold leading-none tabular-nums">{value}</p>
    <p
      className={cn(
        "mt-1 text-[10px] font-bold uppercase tracking-[0.16em]",
        accent ? "text-[#0c493e]/70" : "text-white/60",
      )}
    >
      {label}
    </p>
  </div>
);
