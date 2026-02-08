"use client";

import React from "react";
import { Award, GraduationCap, Hourglass } from "lucide-react";
import Image from "next/image";
import { AboutData } from "@/lib/types/landing";

// STAŁE ZASOBY
const CARD_ICONS = [GraduationCap, Award, Hourglass];
const STATIC_IMAGE_SRC = "/landing-assets/about-image.webp"; // Twoje zdjęcie
const STATIC_IMAGE_ALT = "Alicja - O mnie";

interface AboutProps {
  data: AboutData;
}

export const About = ({ data }: AboutProps) => {
  // Standardowa funkcja renderowania nagłówka (taka jak w innych sekcjach)
  const renderHeadline = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headlineAny = data.headline as any;

    // Fallback dla starych danych (jeśli w bazie wciąż jest obiekt {prefix, highlight})
    if (typeof headlineAny === "object" && headlineAny !== null) {
      return (
        <>
          {headlineAny.prefix} <br className="hidden max-[960px]:inline" />
          <span className="text-highlight">{headlineAny.highlight}</span>
        </>
      );
    }

    const { headline, highlight } = data;
    if (typeof headline !== "string") return null;

    if (!highlight || !headline.includes(highlight)) {
      return headline;
    }

    const parts = headline.split(highlight);
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <>
                {/* Zachowujemy br dla responsywności z oryginału, jeśli potrzebne, 
                     choć przy pełnym stringu łamanie linii może być automatyczne */}
                <br className="hidden max-[960px]:inline" />
                <span className="text-highlight">{highlight}</span>
              </>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <section className="flex flex-col mt-52 gap-14 max-[1024px]:mt-20">
      <div className="grid grid-cols-[2fr_4fr] custom-container w-full max-[1170px]:grid-cols-[2fr_5fr] max-[1024px]:flex max-[1024px]:justify-center">
        <div className="max-[1024px]:hidden"></div>
        <div className="flex flex-col gap-2.5 max-[1024px]:items-center max-[1024px]:text-center max-[1024px]:max-w-[70%] max-[1024px]:justify-center max-[1024px]:gap-6 max-[790px]:max-w-[90%]">
          <h1 className="heading">{renderHeadline()}</h1>
          <p className="paragraph">{data.description}</p>
        </div>
      </div>

      <div className="min-h-[350px] bg-primary relative flex items-center py-12 max-[1024px]:h-auto">
        <div className="grid grid-cols-[2fr_4fr] custom-container w-full max-[1170px]:grid-cols-[2fr_5fr] max-[1024px]:flex">
          <div className="relative max-[1024px]:hidden">
            <Image
              height={750}
              width={350}
              alt={STATIC_IMAGE_ALT}
              src={STATIC_IMAGE_SRC}
              className="absolute -bottom-12 right-12.5 object-contain"
            />
          </div>

          <div className="w-full flex items-start max-[1024px]:flex-wrap">
            <div className="flex w-full flex-row justify-between max-[1024px]:!justify-around max-[790px]:flex-col max-[790px]:items-center max-[790px]:text-center  ">
              {data.cards.map((card, index) => {
                const Icon = CARD_ICONS[index % CARD_ICONS.length];
                return (
                  <div
                    key={index}
                    className="w-[244px] pr-2 flex flex-col items-start gap-4  min-h-full max-[1024px]:border-r-0  max-[1024px]:pb-8 max-[1024px]:pr-0 max-[1024px]:mb-8 max-[790px]:items-center"
                  >
                    <div className="text-[#c5e1a5] max-[790px]:self-center">
                      <Icon size={32} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-4">
                      <h3 className="text-[20px] font-semibold text-white leading-tight min-h-[50px] max-[1024px]:min-h-0">
                        {card.title}
                      </h3>
                      <p className="text-[14px] leading-6 text-gray-300">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
