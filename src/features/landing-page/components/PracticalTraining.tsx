import React from "react";
import Image from "next/image";
import { GraduationCap, Ticket, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const PracticalTraining = () => {
  return (
    <section className="w-full py-24 max-[1024px]:py-16">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[0.9fr_1.1fr] gap-16 px-4 max-[1024px]:grid-cols-1 max-[1024px]:gap-20">
        {/* Kolumna ze zdjęciem i badge */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-[500px]">
            <Image
              src="/landing-assets/mentoring-image.webp"
              alt="Szkolenie praktyczne"
              height={445}
              width={515}
            />

            {/* Badge koło */}
            <div className="absolute  -bottom-8 right-8 z-10 flex h-[160px] w-[160px] flex-col items-center justify-center rounded-full bg-[#0e3f2d] text-center text-white shadow-[-12px_12px_0px_0px_#c5e1a5] max-[500px]:h-[130px] max-[500px]:w-[130px] max-[500px]:-bottom-4 max-[500px]:-right-2">
              <span className="text-[36px] font-bold leading-none max-[500px]:text-[28px]">
                30+
              </span>
              <span className="text-[12px] font-medium uppercase tracking-wide opacity-90 max-[500px]:text-[10px]">
                szkoleń
                <br />
                rocznie
              </span>
            </div>
          </div>
        </div>

        {/* Kolumna z treścią */}
        <div className="flex flex-col justify-center gap-6  max-[1024px]:text-center  max-[520px]:gap-12">
          <h2 className="heading">
            Opanuj Diagnostykę <br className="max-[500px]:hidden" />
            <span className="text-highlight">w Praktyce</span>
          </h2>

          <p className=" text-[16px] leading-relaxed text-[#4a4a4a] max-[500px]:text-[14px]">
            Sam e-book to dopiero początek drogi do pełnej samodzielności
            diagnostycznej. Podczas kursów stacjonarnych przekładamy teorię na
            realne techniki manualne, analizujemy żywe przypadki kliniczne i
            budujemy Twoją pewność w gabinecie pod okiem doświadczonych
            mentorów.
          </p>

          <div className=" flex gap-8 max-[640px]:flex-col max-[640px]:gap-12 my-4 items-center max-[1024px]:justify-around  max-[1024px]:flex-wrap ">
            {/* Feature 1 */}
            <div className="flex flex-1 flex-col gap-3  max-[1024px]:max-w-100  max-[1024px]:text-start  max-[800px]:max-w-[80%]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-primary">
                  <GraduationCap color="#D4F0C8" size={24} />
                </div>
                <h3 className="text-[16px] font-bold text-[#1a1a1a]">
                  Autorski Program Szkoleniowy
                </h3>
              </div>
              <p className="text-[13px] leading-6 text-[#4a4a4a]">
                Skoncentrowany na młodych praktykach, którzy chcą
                usystematyzować wiedzę kliniczną.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-1 flex-col gap-3  max-[1024px]:max-w-100  max-[1024px]:text-start  max-[800px]:max-w-[80%]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-primary">
                  <Ticket color="#D4F0C8" size={24} />
                </div>
                <h3 className="text-[16px] font-bold text-[#1a1a1a]">
                  200 zł Rabatu dla Czytelników
                </h3>
              </div>
              <p className="text-[13px] leading-6 text-[#4a4a4a]">
                Każdy nabywca e-booka otrzymuje dedykowaną zniżkę na start
                swojej edukacji z Rehaintegro.
              </p>
            </div>
          </div>

          <div>
            <Button
              href="/terminy" // Możesz zmienić na onClick lub odpowiedni link
              bgColor="bg-[#0e3f2d]"
              textColor="text-white"
              iconBgColor="bg-[#c5e1a5]"
              icon={<ArrowUpRight size={12} />} // Ikona pomniejszona, aby pasowała do kółka w komponencie
            >
              Zobacz terminy
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
