"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Network,
  Microscope,
  Brain,
  ShieldCheck,
  CircleQuestionMark,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import React, { useState } from "react";
import { ContentPreviewData } from "@/lib/types/landing";

const FEATURE_ICONS = [Network, Microscope, Brain, ShieldCheck];

interface ContentPreviewProps {
  data: ContentPreviewData;
}

export const ContentPreview = ({ data }: ContentPreviewProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const renderHeadline = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headlineAny = data.headline as any;

    if (typeof headlineAny === "object" && headlineAny !== null) {
      return (
        <>
          {headlineAny.line1} <br />
          <span className="text-highlight">{headlineAny.line2}</span>
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
              <span className="text-highlight relative inline-block">
                {highlight}
                <span className="absolute bottom-2 left-0 -z-10 h-3 w-full bg-[#D4F0C8]" />
              </span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <>
      <section className="custom-container bg-white py-24 max-[1024px]:py-16 px-4">
        <div className="flex flex-row items-center justify-between gap-16 max-[1024px]:flex-col max-[1024px]:gap-20">
          <div className="flex w-[45%] flex-col gap-12 max-[1024px]:w-full max-[1024px]:text-center max-[1024px]:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-12"
            >
              <h2 className="heading">{renderHeadline()}</h2>

              <p className="paragraph text-gray-600">{data.description}</p>

              <div className="flex flex-wrap gap-y-4 max-[1024px]:max-w-[500px] max-[1024px]:mx-auto max-[1024px]:pl-15  max-[500px]:pl-32 max-[450px]:pl-24  max-[380px]:pl-16">
                {data.checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex w-1/2 items-center gap-3 max-[500px]:w-full max-[1024px]:justify-start"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#103830] text-white">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-[15px] font-medium text-gray-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="flex w-[50%] flex-col gap-6 max-[1024px]:w-full">
            {data.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group flex flex-row items-start gap-6 rounded-2xl bg-[#F6F8F7] p-6 transition-all hover:shadow-lg max-[600px]:flex-col max-[600px]:items-center max-[600px]:text-center"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#103830] text-[#D4F0C8] shadow-sm transition-transform group-hover:scale-105">
                    <Icon size={28} strokeWidth={1.5} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-[#103830]">
                      {feature.title}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="custom-container bg-white py-24 px-4">
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-4">
          {data.transformation.map((item) => {
            const isActive = activeId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setActiveId(isActive ? null : item.id)}
                initial={false}
                animate={{
                  backgroundColor: isActive ? "#103830" : "#F6F8F7",
                }}
                className={cn(
                  "relative flex min-h-[80px] cursor-pointer items-center justify-between overflow-hidden rounded-full px-8 py-4 shadow-md transition-shadow duration-300",
                  "max-[640px]:h-[130px] max-[640px]:rounded-2xl max-[640px]:px-6 max-[640px]:flex-col max-[640px]:justify-center max-[640px]:items-center max-[640px]:gap-4",
                )}
              >
                <motion.div
                  layout
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 max-[640px]:h-8 max-[640px]:w-8",
                    isActive
                      ? "bg-transparent border border-white/30 text-white order-first mr-4 max-[640px]:order-last max-[640px]:mr-0"
                      : "bg-[#103830] text-white order-last ml-4 max-[640px]:ml-0",
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isActive ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check size={18} strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="question"
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CircleQuestionMark size={20} strokeWidth={2} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  layout
                  className="flex-1 text-left max-[640px]:text-center"
                >
                  <AnimatePresence mode="wait">
                    {isActive ? (
                      <motion.p
                        key="solution"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="text-[16px] font-medium text-white max-[640px]:text-[14px]"
                      >
                        {item.solution}
                      </motion.p>
                    ) : (
                      <motion.p
                        key="problem"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="text-[16px] font-medium text-gray-800 max-[640px]:text-[14px]"
                      >
                        <span className="font-bold">{item.problemTitle}</span>
                        {item.problemDesc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
};
