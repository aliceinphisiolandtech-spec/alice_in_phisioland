import Image from "next/image";
import React from "react";
// 1. Importujemy konkretne ikony
import { ScanSearch, UserCheck, BrainCircuit, CircleHelp } from "lucide-react";

// 2. Definiujemy tablicę ikon w stałej kolejności (odpowiadającej kolejności w bazie/seedzie)
const FEATURE_ICONS = [
  ScanSearch, // Dla kafelka 1 (Diagnostyka)
  UserCheck, // Dla kafelka 2 (Terapia)
  BrainCircuit, // Dla kafelka 3 (Edukacja)
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PatientZoneHero = ({ content }: any) => {
  return (
    <section
      className="bg-primary relative pt-20 flex items-center pb-44"
      id="strefa-pacjenta"
    >
      <div className="custom-container px-4 relative z-10 pt-32">
        <div className="flex flex-row items-center gap-20 max-[1150px]:flex-col max-[1150px]:gap-12">
          {/* --- LEWA KOLUMNA: TREŚĆ --- */}
          <div className="flex-1 w-full flex flex-col items-start gap-10 -mt-12 max-[1150px]:items-center">
            <div className="flex flex-col items-start gap-6 max-[1150px]:items-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#d4f0c8] text-[#0c493e] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm max-[1150px]:text-center">
                {content.badge}
              </div>

              {/* Nagłówek */}
              <h1 className="heading text-white text-balance w-[120%] max-[1150px]:text-center max-[1150px]:w-full">
                {content.title}
              </h1>

              {/* Opis */}
              <p className="paragraph text-white/90 max-w-xl max-[1150px]:text-center">
                {content.description}
              </p>
            </div>

            {/* --- KAFELKI INFORMACYJNE --- */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl max-[700px]:grid-cols-1">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {content.features.map((feature: any, index: number) => {
                // 3. Wybieramy ikonę na podstawie indeksu
                const IconComponent = FEATURE_ICONS[index] || CircleHelp;

                return (
                  <div
                    key={index}
                    className="bg-[#d4f0c8]/5 border border-[#d4f0c8]/20 p-4 rounded-2xl backdrop-blur-sm hover:bg-[#d4f0c8]/10 transition-colors pointer-cursor group max-[1150px]:text-center"
                  >
                    <div className="w-10 h-10 bg-[#d4f0c8] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform max-[1150px]:justify-self-center">
                      {/* 4. Renderujemy wybraną ikonę */}
                      <IconComponent
                        className="w-5 h-5 text-[#0c493e]"
                        strokeWidth={2.5}
                      />
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-[#d4f0c8]/70 text-xs">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- PRAWA KOLUMNA: ZDJĘCIE (Bez zmian) --- */}
          <div className="flex-1 w-full relative flex justify-end max-[1150px]:justify-center">
            <div className="relative w-full max-w-[460px] aspect-[4/5] min-h-[500px] -left-12 max-[1150px]:left-0 max-[500px]:w-full min-h-auto">
              <Image
                fill
                src={"/patient-zone/patient-zone.webp"}
                alt="Fizjoterapeuta Warszawa"
                className="object-cover rounded-3xl shadow-2xl border border-white/10 relative z-10"
                sizes="(max-width: 1150px) 100vw, 500px"
                priority
              />

              {/* Karta opinii - ZnanyLekarz */}
              <div className="absolute bottom-8 -left-12 z-20 bg-white p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 max-w-[260px] pointer-cursor transition-transform hover:scale-105 border border-gray-100 animate-fade-in-up max-[1150px]:-left-6 max-[460px]:p-2 max-[460px]:-left-4">
                <div className="w-10 h-10 bg-[#0c493e] rounded-full flex items-center justify-center text-[#d4f0c8] shrink-0 max-[460px]:w-8 max-[460px]:h-8">
                  <svg
                    className="w-5 h-5 text-[#d4f0c8] fill-current max-[460px]:w-4 max-[460px]:h-4"
                    viewBox="0 0 1297 1231"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M379.247 1226.83C367.247 1220.33 336.747 1197.83 336.747 1197.83C294.747 1167.66 203.247 1102.73 173.247 1084.33C143.247 1065.93 150.747 1034.99 158.247 1021.83C496.247 444.325 1136.25 340.328 1183.25 335.828C1220.85 332.228 1237.25 351.994 1240.75 362.328L1295.25 525.828C1304.05 566.228 1269.25 575.494 1252.25 579.828C787.847 698.228 516.413 1045.49 438.747 1204.33C416.347 1234.73 391.247 1233.33 379.247 1226.83Z" />
                    <path d="M963.746 1220.33L1109.25 1115.83C1130.45 1087.43 1118.08 1062.66 1109.25 1053.83L953.246 797.325C939.246 783.725 925.746 786.992 920.746 790.325C786.746 897.825 763.746 943.825 741.746 972.825C724.146 996.025 729.746 1013.49 734.746 1019.33C780.079 1072.16 876.546 1184.73 899.746 1212.33C922.946 1239.93 952.079 1229.16 963.746 1220.33Z" />
                    <path d="M775.246 384.825C532.446 469.625 354.079 612.492 295.246 673.325C275.245 686.923 251.912 678.991 242.746 673.325C185.579 650.159 63.2456 600.128 31.2456 585.328C-0.754414 570.528 -2.08775 545.828 1.24559 535.328C14.5789 489.828 44.3456 391.528 56.7456 362.328C69.1456 333.128 99.2456 333.495 112.746 337.328C197.912 356.495 380.146 398.028 427.746 410.828C475.346 423.628 489.579 392.495 490.746 375.328C498.079 281.661 513.846 84.9281 518.246 47.3281C522.646 9.72813 546.412 0.992818 557.746 1.32516C606.079 0.325164 709.746 -1.07484 737.746 1.32516C765.746 3.72516 777.079 23.9918 779.246 33.8252L808.746 351.825C805.546 375.425 785.079 383.659 775.246 384.825Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#0c493e] font-bold text-base">
                    {content.stats.rating}
                  </p>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                    {content.stats.ratingText}
                  </p>
                </div>
              </div>

              <div className="absolute -z-0 top-6 -right-6 w-full h-full border-2 border-[#d4f0c8]/20 rounded-3xl max-[1150px]:hidden" />
              <div className="absolute -z-10 -top-12 -right-12 w-24 h-24 bg-[#d4f0c8]/10 rounded-full blur-2xl max-[1150px]:hidden" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
