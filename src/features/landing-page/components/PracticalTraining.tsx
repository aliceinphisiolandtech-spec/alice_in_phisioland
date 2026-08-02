"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap, Ticket, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PracticalTrainingData } from "@/lib/types/landing";
import {
  fadeUp,
  fadeUpSm,
  fadeLeft,
  scaleIn,
  staggerContainer,
  staggerFast,
  revealOnScroll,
} from "@/lib/animations";

const MotionImage = motion.create(Image);

// STAŁE ZASOBY
const FEATURE_ICONS = [GraduationCap, Ticket];
const STATIC_IMAGE_SRC = "/landing-assets/mentoring-image.webp"; // Twoje zdjęcie
const STATIC_IMAGE_ALT = "Szkolenie praktyczne z diagnostyki";
const STATIC_BUTTON_URL = process.env.NEXT_PUBLIC_KURSY_LINK;

interface PracticalTrainingProps {
  data: PracticalTrainingData;
}

export const PracticalTraining = ({ data }: PracticalTrainingProps) => {
  const renderHeadline = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headlineAny = data.headline as any;

    if (typeof headlineAny === "object" && headlineAny !== null) {
      return (
        <>
          {headlineAny.line1} <br className="max-[500px]:hidden" />
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
                {/* Zachowujemy br dla responsywności */}
                <br className="max-[500px]:hidden" />
                <span className="text-highlight">{highlight}</span>
              </>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <section id="kursy" className="w-full py-40 pb-80 max-[1024px]:py-16">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[0.9fr_1.1fr] gap-16 px-4 max-[1024px]:grid-cols-1 max-[1024px]:gap-20">
        <motion.div
          variants={scaleIn}
          {...revealOnScroll}
          className="relative flex items-center justify-center"
        >
          <div className="relative w-full max-w-[500px]">
            <MotionImage
              variants={scaleIn}
              src={STATIC_IMAGE_SRC}
              alt={STATIC_IMAGE_ALT}
              height={445}
              width={515}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 14,
                delay: 0.3,
              }}
              className="absolute  -bottom-8 right-8 z-10 flex h-[160px] w-[160px] flex-col items-center justify-center rounded-full bg-[#0e3f2d] text-center text-white shadow-[-12px_12px_0px_0px_#c5e1a5] max-[500px]:h-[130px] max-[500px]:w-[130px] max-[500px]:-bottom-4 max-[500px]:-right-2">
              <span className="text-[36px] font-bold leading-none max-[500px]:text-[28px]">
                {data.badge.count}
              </span>
              <span className="text-[12px] font-medium uppercase tracking-wide opacity-90 max-[500px]:text-[10px]">
                {/* Bezpieczne dzielenie labela */}
                {data.badge.label.includes(" ") ? (
                  <>
                    {data.badge.label.split(" ")[0]}
                    <br />
                    {data.badge.label.split(" ").slice(1).join(" ")}
                  </>
                ) : (
                  data.badge.label
                )}
              </span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          {...revealOnScroll}
          className="flex flex-col justify-center gap-6  max-[1024px]:text-center  max-[520px]:gap-12"
        >
          <motion.h2 variants={fadeLeft} className="heading">
            {renderHeadline()}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className=" text-[16px] leading-relaxed text-[#4a4a4a] max-[500px]:text-[14px]"
          >
            {data.description}
          </motion.p>

          <motion.div
            variants={staggerFast}
            className=" flex gap-8 max-[640px]:flex-col max-[640px]:gap-12 my-4 items-center max-[1024px]:justify-around  max-[1024px]:flex-wrap "
          >
            {data.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
                <motion.div
                  key={index}
                  variants={fadeUpSm}
                  className="flex flex-1 flex-col gap-3  max-[1024px]:max-w-100  max-[1024px]:text-start  max-[800px]:max-w-[80%]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-primary">
                      <Icon color="#D4F0C8" size={24} />
                    </div>
                    <h3 className="text-[16px] font-bold text-[#1a1a1a]">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-[13px] leading-6 text-[#4a4a4a]">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div variants={fadeUp}>
            <Button
              href={STATIC_BUTTON_URL}
              bgColor="bg-[#0e3f2d]"
              textColor="text-white"
              iconBgColor="bg-[#c5e1a5]"
              icon={<ArrowUpRight size={12} />}
            >
              {data.button.label}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
