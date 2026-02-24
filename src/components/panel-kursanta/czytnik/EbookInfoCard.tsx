// src/components/panel-kursanta/czytnik/EbookInfoCard.tsx
import React from "react";
import { Mail, Instagram } from "lucide-react";
// 1. Definicja typów danych
export type ScheduleItem = {
  label: string;
  date: string;
  isCurrent?: boolean;
};

// 2. Definicja WSZYSTKICH pól, które mogą być dynamiczne
export type EbookInfoData = {
  schedule: ScheduleItem[];
  discountLink: string;
  discountAmount?: string; // np. "200 zł"
  trainingName?: string; // np. "Diagnostyka kliniczna..."
  contactEmail?: string;
  instagramHandle?: string;
};

// 3. Komponent przyjmuje te dane jako props
export const EbookInfoCard = ({
  schedule = [], // Domyślna pusta tablica (naprawia błąd .map crash)
  discountLink = "#",
  discountAmount = "200 zł",
  trainingName = "Diagnostyka kliniczna i postępowanie w fizjoterapii...",
  contactEmail = "aliceinphysioland@gmail.com",
  instagramHandle = "@alice_in_physioland",
}: EbookInfoData) => {
  // Bezpiecznik: upewniamy się, że schedule to tablica
  const safeSchedule = Array.isArray(schedule) ? schedule : [];

  return (
    <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden my-12 font-sans text-gray-800 not-prose">
      {/* 1. COPYRIGHT */}
      <div className="bg-[#103830] text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xl font-bold m-0 leading-tight">
              <span className="text-white montserrat">
                Copyright © by Alicja Wójcik
              </span>
            </div>
            <div className="text-sm m-0 mt-1 opacity-90 leading-normal">
              <span className="text-white montserrat">
                Wszelkie prawa zastrzeżone.
              </span>
            </div>
          </div>
          <div className="text-sm bg-contrast px-4 py-2 rounded-lg backdrop-blur-sm">
            <span className="text-primary montserrat  opacity-80">
              Projekt okładki:{" "}
            </span>
            <strong className="text-primary montserrat ">Alicja Wójcik</strong>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-10">
        {/* 2. NOTA PRAWNA */}
        <div className="bg-[#F2F4F7] border-l-4 border-[#103830] p-5 rounded-r-lg">
          <div className="font-bold m-0 mb-1 leading-tight">
            <span className="text-[#103830] montserrat">Nota prawna</span>
          </div>
          <div className="text-[16px] sm:text-[18px] m-0 leading-relaxed">
            <span className="text-gray-700 montserrat">
              Niniejszy e-book jest chroniony prawem autorskim. Kopiowanie,
              powielanie i rozpowszechnianie bez zgody właściciela praw
              autorskich jest zabronione. E-book ten jest przeznaczony wyłącznie
              do osobistego użytku
            </span>
          </div>
        </div>

        {/* 3. HARMONOGRAM */}
        <div>
          <div className="text-lg font-bold border-b border-gray-200 pb-2 mb-4 m-0 leading-tight">
            <span className="text-[#103830] montserrat">Harmonogram wydań</span>
          </div>

          <div className="flex flex-col gap-3 m-0 p-0">
            {safeSchedule.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg border text-[16px] sm:text-[18px] ${
                  item.isCurrent
                    ? "bg-[#103830] border-[#103830] shadow-md transform scale-[1.01]"
                    : "bg-[#F2F4F7] border-gray-100"
                }`}
              >
                <span
                  className={`font-medium montserrat ${item.isCurrent ? "text-white" : "text-[#103830]"}`}
                >
                  {item.label}
                </span>
                <span
                  className={`font-bold montserrat px-2 py-1 rounded text-xs ${item.isCurrent ? "bg-contrast text-[#103830]" : "text-[#103830]"}`}
                >
                  {item.date}
                </span>
              </div>
            ))}
            {safeSchedule.length === 0 && (
              <div className="text-gray-400 italic text-[16px] sm:text-[18px] p-2">
                Brak zdefiniowanego harmonogramu.
              </div>
            )}
          </div>
        </div>

        {/* 4. INFO OGÓLNE */}
        <div>
          <div className="text-lg font-bold border-b border-gray-200 pb-2 mb-4 m-0 leading-tight">
            <span className="text-[#103830] montserrat">Informacje ogólne</span>
          </div>

          <div className="flex flex-col gap-6 text-[16px] sm:text-[18px] m-0">
            {/* Punkt 1 */}
            <div className="flex gap-4 items-start m-0">
              <div className="w-1.5 h-1.5 mt-3 rounded-full bg-[#103830] shrink-0"></div>
              <div className="m-0 leading-relaxed">
                <span className="text-gray-700 montserrat">
                  Dożywotni dostęp do ebooka.
                </span>
              </div>
            </div>

            {/* Punkt 2 */}
            <div className="flex gap-4 items-start m-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#103830] mt-3 shrink-0"></div>
              <div className="m-0 leading-relaxed">
                <span className="text-gray-700 montserrat">
                  Na ostatniej stronie znajduje się link do dysku z{" "}
                </span>
                <strong className="text-gray-900 montserrat">
                  infografikami w wyższej jakości
                </strong>
                <span className="text-gray-700 montserrat">
                  {" "}
                  z możliwością pobrania.
                </span>
              </div>
            </div>

            {/* Punkt 3 - Używamy propsów: discountAmount, trainingName, discountLink */}
            <div className="flex gap-4 items-start m-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#103830] mt-3 shrink-0"></div>
              <div className="m-0 leading-relaxed">
                <div className="m-0 mb-2">
                  <span className="text-gray-700 montserrat">
                    Wszyscy nabywcy ebooka otrzymują{" "}
                  </span>
                  <strong className="text-gray-900 montserrat">
                    {discountAmount}
                  </strong>
                  <span className="text-gray-700 montserrat">
                    {" "}
                    rabatu na szkolenie:
                  </span>
                  <br />
                  <em className="text-gray-500 montserrat">„{trainingName}”</em>
                </div>
                <div className="flex w-full items-center justify-items-center justify-center">
                  <a
                    href={discountLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block self-center montserrat mt-3 text-white bg-[#103830] px-6 py-4 rounded text-xs font-bold hover:bg-[#0d2e27] transition-colors no-underline"
                  >
                    KLIKNIJ PO SZCZEGÓŁY
                  </a>
                </div>

                <div className="text-xs text-gray-400 m-0  italic montserrat text-center mt-4">
                  *W sprawie rabatu kontaktujcie się bezpośrednio z Rehaintegro
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. KONTAKT (Używa propsów) */}
        {/* 5. KONTAKT (Z ikonami) */}
        <div className="pt-6 border-t border-gray-100 flex flex-col gap-3 text-[16px] sm:text-[18px] w-fit self-center">
          <a
            href={`mailto:${contactEmail}`}
            className="text-[#103830] hover:underline font-medium flex items-center gap-3 no-underline"
          >
            <div className="bg-primary text-contrast p-2 rounded-full flex items-center justify-center">
              <Mail size={20} />
            </div>
            <span className="font-semibold">{contactEmail}</span>
          </a>

          <a
            href={`https://www.instagram.com/${instagramHandle.replace("@", "")}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#103830] hover:underline font-medium flex items-center gap-3 no-underline"
          >
            <div className="bg-primary text-contrast p-2 rounded-full flex items-center justify-center">
              <Instagram size={20} />
            </div>
            <span className="montserrat font-semibold">{instagramHandle}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
