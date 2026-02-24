"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useLayoutEffect } from "react";

type Chapter = {
  slug: string;
  title: string;
  order: number;
};

interface TocContentProps {
  chapters: Chapter[];
}

// --- 1. Helpery ---

function toRoman(num: number): string {
  if (num === 0) return "W";
  const map: { [key: string]: number } = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = "";
  let n = num;
  for (const i in map) {
    while (n >= map[i]) {
      roman += i;
      n -= map[i];
    }
  }
  return roman;
}

// NOWA FUNKCJA: Usuwa "VI. ", "I. ", "X. " z początku tekstu
function cleanTitle(title: string): string {
  // Regex szuka: Początku linii (^), potem znaków rzymskich ([IVXLCDM]+),
  // potem opcjonalnej kropki (\.?), a na końcu spacji (\s+)
  return title.replace(/^[IVXLCDM]+\.?\s+/, "");
}

// --- 2. NAGŁÓWEK ---
const RolodexHeader = ({ scrollTop }: { scrollTop: number }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const threshold = 50;
    const adjustedScroll = Math.max(0, scrollTop - threshold);
    const ratio = Math.min(adjustedScroll / 250, 1);

    const scale = 1 - ratio * 0.2;
    const opacity = 1 - ratio * 1.5;
    const blur = ratio * 10;
    const rotateX = ratio * 45;

    ref.current.style.opacity = `${Math.max(0, opacity)}`;
    ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) scale(${scale})`;
    ref.current.style.filter = `blur(${blur}px)`;
    ref.current.style.pointerEvents = opacity < 0.1 ? "none" : "auto";
  }, [scrollTop]);

  return (
    <div
      ref={ref}
      style={{
        willChange: "transform, opacity, filter",
        transformOrigin: "center bottom",
      }}
      className="text-center mb-6 md:mb-10 mx-auto w-full max-w-md transition-transform duration-75 ease-linear pt-6 md:pt-10"
    >
      <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center text-contrast mb-3 md:mb-4 shadow-sm">
        <BookOpen size={24} className="md:w-[32px] md:h-[32px]" />
      </div>
      <h1 className="text-xl md:text-2xl font-bold text-[#103830]">
        Spis Treści
      </h1>
      <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2 px-4">
        Fizjoterapeutyczna diagnostyka różnicowa
      </p>
    </div>
  );
};

// --- 3. KARTA ---
const RolodexCard = ({
  chapter,
  containerRef,
  scrollTop,
}: {
  chapter: Chapter;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollTop: number;
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !linkRef.current) return;

    const container = containerRef.current;
    const card = linkRef.current;

    const defaultCenter = container.clientHeight / 2;
    const centerOffset = Math.max(0, 200 - scrollTop);
    const focalPoint = defaultCenter - centerOffset;

    const cardTop = card.offsetTop - scrollTop;
    const cardCenter = cardTop + card.clientHeight / 2;

    const distance = focalPoint - cardCenter;
    const absDistance = Math.abs(distance);

    const safeZone = 160;

    let effectRatio = 0;

    if (absDistance <= safeZone) {
      effectRatio = 0;
    } else {
      const excess = absDistance - safeZone;
      effectRatio = Math.min(excess / 300, 1);
    }

    const direction = distance > 0 ? -1 : 1;
    const rotateX = effectRatio * 45 * direction;
    const scale = 1 - effectRatio * 0.2;
    const opacity = 1 - effectRatio * 0.7;
    const blur = effectRatio * 5;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) scale(${scale})`;
    card.style.opacity = `${opacity}`;
    card.style.filter = `blur(${blur}px)`;
    card.style.pointerEvents = effectRatio < 0.5 ? "auto" : "none";
  }, [scrollTop, containerRef]);

  return (
    <Link
      ref={linkRef}
      href={`/panel-kursanta/czytnik/${chapter.slug}`}
      style={{ willChange: "transform, opacity, filter" }}
      className={`
        group
        w-full max-w-md mx-auto mb-3 md:mb-4 h-[72px] md:h-[100px] flex items-center gap-3 md:gap-4 p-3 md:p-4 
        bg-white rounded-xl md:rounded-2xl shadow-sm 
        transition-all duration-300 ease-out
        
       hover:shadow-md hover:scale-[1.02]
      `}
    >
      <div
        className={`
          shrink-0 flex items-center justify-center rounded-lg font-bold transition-colors duration-300 
          w-10 h-8 md:w-12 md:h-10 text-xs md:text-sm 
          bg-[#F2F4F7] text-[#103830]
          
          group-hover:bg-[#103830] group-hover:text-contrast
        `}
      >
        {toRoman(chapter.order)}
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className={`
            font-bold leading-tight transition-colors duration-300 text-xs md:text-sm 
            text-gray-800
            
            group-hover:text-[#103830]
          `}
        >
          {/* TUTAJ UŻYWAMY FUNKCJI CZYSZCZĄCEJ TYTUŁ */}
          {cleanTitle(chapter.title)}
        </h3>
      </div>

      <span className="text-gray-300 transition-colors duration-300 group-hover:text-[#103830]">
        <ChevronRight className="w-4 h-4 md:w-[18px] md:h-[18px]" />
      </span>
    </Link>
  );
};

// --- 4. GŁÓWNY KOMPONENT ---
export default function TocContent({ chapters }: TocContentProps) {
  const [showIntro, setShowIntro] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  const topGradientOpacity = Math.min(Math.max((scrollTop - 50) / 150, 0), 1);

  return (
    <div className="relative h-full w-full bg-[#F2F4F7] flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div
              className="relative w-full h-full max-w-[600px] max-h-[800px] shadow-2xl rounded-xl overflow-hidden"
              exit={{ scale: 0.9, opacity: 0, filter: "blur(20px)", y: -50 }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src="/okładka.png"
                alt="Okładka"
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full h-full max-h-[900px] flex items-center justify-center relative"
      >
        <div className="relative w-full h-full max-w-2xl">
          <div
            className="absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-b from-[#F2F4F7] via-[#F2F4F7]/90 to-transparent z-10 pointer-events-none transition-opacity duration-300"
            style={{ opacity: topGradientOpacity }}
          />

          <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 bg-gradient-to-t from-[#F2F4F7] via-[#F2F4F7]/90 to-transparent z-10 pointer-events-none" />

          <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`
              h-full w-full overflow-y-auto scrollbar-hide 
              px-4 
              pt-4 pb-[40vh]
            `}
          >
            <RolodexHeader scrollTop={scrollTop} />

            {chapters.map((chapter) => (
              <RolodexCard
                key={chapter.slug}
                chapter={chapter}
                containerRef={containerRef}
                scrollTop={scrollTop}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
