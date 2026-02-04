"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;

  // Opcje wyglądu
  bgColor?: string;
  textColor?: string;

  // Ikona
  icon?: ReactNode;
  iconBgColor?: string;
}

export const Button = ({
  children,
  href,
  onClick,
  className,
  bgColor = "bg-black",
  textColor = "text-white",
  icon,
  iconBgColor = "bg-accent",
}: ButtonProps) => {
  // --- BASE CLASSES ---
  const baseClasses = cn(
    "group relative inline-flex items-center justify-between gap-[10px] rounded-[11px] transition-all duration-300 ease-out",
    "px-[20px] py-[12px] h-fit",
    "hover:scale-[1.02] active:scale-95 hover:shadow-lg",
    bgColor,
    className,
  );

  // --- CONTENT ---
  const content = (
    <>
      {/* TEXT */}
      <span
        className={cn(
          "font-montserrat text-[12px] font-bold capitalize tracking-wide",
          textColor,
        )}
      >
        {children}
      </span>

      {/* ICON CONTAINER */}
      {icon && (
        <div
          className={cn(
            "relative flex h-[16px] w-[16px] shrink-0 items-center justify-center overflow-hidden rounded-full transition-transform duration-300",
            iconBgColor,
            "group-hover:scale-110", // Skala zostaje, rotację usunąłem dla czystości kierunku
          )}
        >
          {/* ICON 1 (EXITING) */}
          <div className="absolute inset-0 flex items-center justify-center text-black transition-all duration-300 group-hover:-translate-y-full group-hover:translate-x-full">
            {icon}
          </div>

          {/* ICON 2 (ENTERING) */}
          <div className="absolute inset-0 flex items-center justify-center text-black transition-all duration-300 -translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0">
            {icon}
          </div>
        </div>
      )}
    </>
  );

  // --- RENDER ---
  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
};
