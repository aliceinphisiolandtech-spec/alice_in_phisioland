import { Award, GraduationCap, Hourglass } from "lucide-react";
import Image from "next/image";

export const About = () => {
  return (
    <section className="flex flex-col mt-52 gap-14 max-[1024px]:mt-20">
      {/* Sekcja tekstowa */}
      <div className="grid grid-cols-[2fr_4fr] custom-container w-full max-[1170px]:grid-cols-[2fr_5fr] max-[1024px]:flex max-[1024px]:justify-center">
        <div className="max-[1024px]:hidden"></div>
        <div className="flex flex-col gap-2.5 max-[1024px]:items-center max-[1024px]:text-center max-[1024px]:max-w-[70%] max-[1024px]:justify-center max-[1024px]:gap-6 max-[790px]:max-w-[90%]">
          <h1 className="heading">
            Nazywam się <br className="hidden max-[960px]:inline" />
            <span className="text-highlight">Alicja Wójcik</span>{" "}
          </h1>
          <p className="paragraph">
            Jestem absolwentką Akademii Wychowania Fizycznego Józefa
            Piłsudskiego w Warszawie, kierunków fizjoterapia i wychowanie
            fizyczne. Studiuję na 4 roku w Akademii Ortopedycznej Terapii
            Manualnej – PSOTM. Zdobyłam dyplom terapeutki manualnej koncepcji
            Kaltenborna-Evjentha - narodowy egzamin końcowy zdany w 2022 roku po
            ukończeniu 296h szkoleń z zakresu badania i leczeniakręgosłupa,
            stawów obwodowych oraz stawów skroniowo-żuchwowych.
          </p>
        </div>
      </div>

      {/* Sekcja z kartami i obrazkiem */}
      <div className="min-h-[350px] bg-primary relative flex items-center py-12 max-[1024px]:h-auto">
        <div className="grid grid-cols-[2fr_4fr] custom-container w-full max-[1170px]:grid-cols-[2fr_5fr] max-[1024px]:flex">
          {/* Kontener na zdjęcie */}
          <div className="relative max-[1024px]:hidden">
            <Image
              height={750}
              width={350}
              alt="Alicja Wójcik"
              src={"/landing-assets/about-image.webp"}
              className="absolute -bottom-12 right-12.5 object-contain"
            />
          </div>

          {/* Kontener na karty */}
          <div className="w-full flex items-start  max-[1024px]:flex-wrap">
            <div className="flex w-full flex-row justify-between max-[1024px]:!justify-around max-[790px]:flex-col max-[790px]:items-center max-[790px]:text-center  ">
              {/* Kolumna 1 */}
              <div className="w-[244px] pr-2 flex flex-col items-start gap-4  min-h-full max-[1024px]:border-r-0  max-[1024px]:pb-8 max-[1024px]:pr-0 max-[1024px]:mb-8">
                <div className="text-[#c5e1a5] max-[790px]:self-center">
                  <GraduationCap size={32} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-4">
                  <h3 className="text-[20px] font-semibold text-white leading-tight min-h-[50px] max-[1024px]:min-h-0">
                    Wykształcenie i Fundamenty
                  </h3>
                  <p className="text-[14px] leading-6 text-gray-300">
                    Absolwentka AWF Warszawa oraz studentka 4. roku Akademii
                    Ortopedycznej Terapii Manualnej – PSOTM.
                  </p>
                </div>
              </div>
              <span className="h-fill w-[1px] bg-white/20 hidden"></span>
              {/* Kolumna 2 */}
              <div className="w-[244px] pr-2 flex flex-col items-start gap-4   min-h-full max-[1024px]:border-r-0  max-[1024px]:pb-8 max-[1024px]:px-0 max-[1024px]:mb-8 max-[790px]:justify-self-center">
                <div className="text-[#c5e1a5] max-[790px]:self-center">
                  <Award size={32} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-4">
                  <h3 className="text-[20px] font-semibold text-white leading-tight min-h-[50px] max-[1024px]:min-h-0">
                    Specjalizacja i Certyfikacja
                  </h3>
                  <p className="text-[14px] leading-6 text-gray-300">
                    Certyfikowana terapeutka manualna koncepcji
                    Kaltenborna-Evjentha. Zdany egzamin państwowy w 2022 roku.
                  </p>
                </div>
              </div>
              <span className="h-fill w-[1px] bg-white/20 hidden"></span>
              {/* Kolumna 3 */}
              <div className="w-[244px] flex flex-col pr-2 items-start gap-4 min-h-full max-[1024px]:pr-0">
                <div className="text-[#c5e1a5] max-[790px]:self-center">
                  <Hourglass size={32} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-4">
                  <h3 className="text-[20px] font-semibold text-white leading-tight min-h-[50px] max-[1024px]:min-h-0">
                    Praktyka i doświadczenie
                  </h3>
                  <p className="text-[14px] leading-6 text-gray-300">
                    Ponad 296h specjalistycznych szkoleń z zakresu badania i
                    leczenia kręgosłupa oraz stawów obwodowych.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
