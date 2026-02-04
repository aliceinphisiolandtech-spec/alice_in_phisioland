"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

export const Hero = () => {
  return (
    <section className="custom-container relative bg-white pt-[172px] pb-55">
      {/* --- MAIN CONTAINER --- */}
      <div className="flex flex-row ml-24 max-w-[70%] max-[1110px]:ml-12 max-[920px]:ml-6 max-[920px]:max-w-[75%] max-[860px]:flex-col max-[860px]:max-w-full max-[860px]:ml-0 max-[860px]:px-3 max-[550px]:overflow-hidden">
        {/* --- LEFT COLUMN --- */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col justify-center gap-8 max-[1024px]:w-full"
        >
          {/* --- HEADLINE --- */}
          <h1 className="heading mb-[-12px] max-w-[80%] max-[1070px]:max-w-[90%] max-[960px]:max-w-[110%] max-[860px]:self-center max-[860px]:text-center">
            Od Teorii Do Diagnozy <br />
            <span
              className="
  relative z-10 text-primary                 
  after:content-[''] 
  after:absolute 
  after:bottom-2 
  after:left-0                              
  after:-z-10                              
  after:h-3 
  after:w-full                              
  after:bg-accent/50
"
            >
              {" Fizjoterapia"}
            </span>
            {" " + "Bez Domysłów"}
          </h1>

          {/* --- PARAGRAPH --- */}
          <p className="paragraph max-w-[60%] max-[860px]:max-w-full max-[860px]:px-12 max-[860px]:text-center max-[480px]:px-3">
            Studia dały Ci wiedzę, ja pokażę Ci, jak jej użyć. Praktyczny
            przewodnik po diagnostyce różnicowej, który wypełnia lukę między
            dyplomem a pierwszym pacjentem. Zrozum proces, odrzuć strach i
            postaw trafną hipotezę.
          </p>

          {/* --- BUTTONS --- */}
          <div className="flex flex-row gap-4 max-[860px]:justify-center flex-wrap">
            <Button
              href="/ebook"
              icon={<ArrowUpRight size={14} strokeWidth={1} />}
            >
              Zobacz E-book
            </Button>

            <Button bgColor="bg-primary" href="/ebook">
              Zapisz się na kurs
            </Button>
          </div>

          {/* --- SOCIAL PROOF --- */}
          <div className="flex items-center gap-4 max-[860px]:self-center">
            <div className="flex -space-x-4">
              {[
                "https://images.pexels.com/photos/35967884/pexels-photo-35967884.jpeg?auto=compress&cs=tinysrgb&w=128",
                "https://images.pexels.com/photos/6030282/pexels-photo-6030282.jpeg?auto=compress&cs=tinysrgb&w=128",
                "https://images.pexels.com/photos/16845064/pexels-photo-16845064.jpeg?auto=compress&cs=tinysrgb&w=128",
              ].map((src, i) => (
                <div
                  key={i}
                  className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-gray-200"
                >
                  <Image
                    src={src}
                    alt={`User ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-black">500+</span>
              <span className="text-sm font-medium text-gray-500">
                Sprzedanych <br /> egzemplarzy
              </span>
            </div>
          </div>
        </motion.div>

        {/* --- RIGHT COLUMN --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          // Rodzic centruje zawartość flexem
          className="relative ml-12 flex items-center justify-center max-[860px]:ml-0 max-[860px]:mt-12 max-[860px]:w-full"
        >
          {/* --- WRAPPER ABSOLUTE/RELATIVE --- */}
          <div
            className="
            /* Desktop: Pozycjonowanie absolutne względem kolumny */
            absolute -left-58 
            max-[960px]:-left-64 max-[960px]:top-18

            /* Mobile: Relative wrapper, wyśrodkowany */
            max-[860px]:relative
            max-[860px]:left-auto max-[860px]:top-auto
            max-[860px]:w-full 
            max-[860px]:max-w-[450px]
            max-[860px]:flex max-[860px]:justify-center
          "
          >
            {/* KONTENER ZDJĘĆ I BLOBA */}
            <div
              className="
              relative flex h-full min-w-max flex-row items-center gap-3
              
              /* Mobile Reset */
              max-[860px]:min-w-0 
              max-[860px]:w-full 
              max-[860px]:items-center      /* Centrowanie w pionie */
              max-[860px]:justify-center   /* Centrowanie w poziomie */
              max-[860px]:gap-[2%]
            "
            >
              {/* --- BLOB (TŁO) --- */}
              {/* Przeniesiony na początek w DOM (z-index niższy naturalnie, ale wymuszamy klasą) */}
              <Image
                height={471}
                width={442}
                src={"/landing-assets/hero-blob.svg"}
                alt=""
                className="
                  /* Desktop Styles */
                  absolute left-[50px] top-[50px] z-10 shrink-0 max-w-none w-[442px] h-[471px]
                  
                  /* Mobile Styles - ABSOLUTE CENTERED */
                  max-[860px]:left-[60%] max-[860px]:top-[70%]
                  max-[860px]:-translate-x-1/2 max-[860px]:-translate-y-1/2
                  max-[860px]:w-[100%] max-[860px]:h-auto
                  max-[860px]:z-0  /* Pod spodem */
                  
                "
              />

              {/* ZDJĘCIE 1 */}
              <Image
                height={320}
                width={156}
                src={"/landing-assets/hero-image-01.webp"}
                alt=""
                className="
                  mt-[0px] z-20 shrink-0 max-w-none relative
                  max-[860px]:w-[34%] max-[860px]:h-auto
                "
              />

              {/* ZDJĘCIE 2 */}
              <Image
                height={320}
                width={140}
                src={"/landing-assets/hero-image-02.webp"}
                alt=""
                className="
                  mt-[120px] mr-[15px] z-20 shrink-0 max-w-none relative
                  max-[860px]:w-[30%] max-[860px]:h-auto max-[860px]:mr-0 max-[860px]:mt-[25%]
                "
              />

              {/* ZDJĘCIE 3 */}
              <Image
                height={320}
                width={127}
                src={"/landing-assets/hero-image-03.webp"}
                alt=""
                className="
                  mt-[20px] z-20 shrink-0 max-w-none relative
                  max-[860px]:w-[28%] max-[860px]:h-auto max-[860px]:mt-[4%]
                "
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
