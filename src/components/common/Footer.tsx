import React from "react";
import { Instagram } from "lucide-react";
import Image from "next/image";
import { TechFooterSignature } from "./TechFooterSignature";
import { NewsletterForm } from "../site/footer/NewsLetterForm";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full bg-primary pt-16 pb-8 text-white ">
      <div className="mx-auto max-w-[1200px] px-4">
        {/* --- CZĘŚĆ GÓRNA: LOGO I SOCIAL --- */}
        <div className="flex items-center justify-between pb-12 max-[768px]:flex-col max-[768px]:gap-8">
          {/* Lewa strona: Małe logo i nazwa */}
          <div className="flex items-center gap-4 max-[768px]:flex-col max-[768px]:text-center">
            <Image src={"/AW-logo-negatyw.svg"} height={35} width={45} alt="" />

            <div className="flex flex-col ">
              <span className="text-[12px] font-bold uppercase  text-white font-montserrat">
                Alicja Wójcik
              </span>
              <span className="text-[12px] font-light font-montserrat italic">
                aliceinphysioland
              </span>
            </div>
          </div>

          {/* Środek: Duże Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 transform max-[768px]:hidden [768px]:transform-none">
            <Image src={"/AW-logo-negatyw.svg"} height={75} width={58} alt="" />
          </div>

          {/* Prawa strona: Sociadasdl Media */}
          <div>
            <a
              href="https://www.instagram.com/alice_in_physioland/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white transition-colors hover:bg-white hover:text-[#0e3f2d]"
              aria-label="Instagram"
              target="_blank"
            >
              <Instagram size={20} />
            </a>
          </div>
        </div>

        {/* Separator 1 */}
        <div className="h-[1px] w-full bg-white/10"></div>

        {/* --- CZĘŚĆ ŚRODKOWA: NEWSLETTER --- */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-6 text-[14px] font-bold text-white">
            Zapisz się na newsletter
          </h3>

          <NewsletterForm />
        </div>
        <div className="flex flex-col gap-2 text-center mb-7">
          <Link
            href="/regulamin"
            className="text-[15px] text-white/70 transition-colors hover:text-white"
          >
            Regulamin aplikacji
          </Link>
          <Link
            href="/polityka-prywatnosci"
            className="text-[15px] text-white/70 transition-colors hover:text-white"
          >
            Polityka prywatności
          </Link>
          <Link
            href="/regulamin-zakupow"
            className="text-[15px] text-white/70 transition-colors hover:text-white"
          >
            Regulamin zakupu e-booka
          </Link>
        </div>
        {/* Separator 2 */}
        <div className="h-[1px] w-full bg-white/10"></div>

        {/* --- CZĘŚĆ DOLNA: COPYRIGHT --- */}
        <div className="pt-5 flex flex-row flex-wrap justify-between relative max-[600px]:flex-col max-[600px]:items-center max-[600px]:pb-9">
          <p className="text-[12px] text-gray-400">
            Copyright © 2026 AliceinPhysioland
          </p>
          <TechFooterSignature />
        </div>
      </div>
    </footer>
  );
};
