"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { Star, MapPin } from "lucide-react";

export const ZnanyLekarzWidget = ({ content }: { content: any }) => {
  const [loaded, setLoaded] = useState(false);
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if ("requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(() => setShowScript(true));
    } else {
      timeoutId = setTimeout(() => setShowScript(true), 2000);
    }

    return () => {
      if (idleId !== null) (window as any).cancelIdleCallback(idleId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className="bg-white relative pt-44 pb-44">
      <div className="custom-container px-4 relative z-10 max-[350]:px-1">
        {/* SVG ZnanyLekarz */}
        <svg
          className="w-110 h-110 text-contrast/50 fill-current absolute -top-40 -left-22 max-[1024px]:right-1/2 max-[400px]:h-auto max-[400px]:w-[300px]"
          viewBox="0 0 1297 1231"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M379.247 1226.83C367.247 1220.33 336.747 1197.83 336.747 1197.83C294.747 1167.66 203.247 1102.73 173.247 1084.33C143.247 1065.93 150.747 1034.99 158.247 1021.83C496.247 444.325 1136.25 340.328 1183.25 335.828C1220.85 332.228 1237.25 351.994 1240.75 362.328L1295.25 525.828C1304.05 566.228 1269.25 575.494 1252.25 579.828C787.847 698.228 516.413 1045.49 438.747 1204.33C416.347 1234.73 391.247 1233.33 379.247 1226.83Z" />
          <path d="M963.746 1220.33L1109.25 1115.83C1130.45 1087.43 1118.08 1062.66 1109.25 1053.83L953.246 797.325C939.246 783.725 925.746 786.992 920.746 790.325C786.746 897.825 763.746 943.825 741.746 972.825C724.146 996.025 729.746 1013.49 734.746 1019.33C780.079 1072.16 876.546 1184.73 899.746 1212.33C922.946 1239.93 952.079 1229.16 963.746 1220.33Z" />
          <path d="M775.246 384.825C532.446 469.625 354.079 612.492 295.246 673.325C275.245 686.923 251.912 678.991 242.746 673.325C185.579 650.159 63.2456 600.128 31.2456 585.328C-0.754414 570.528 -2.08775 545.828 1.24559 535.328C14.5789 489.828 44.3456 391.528 56.7456 362.328C69.1456 333.128 99.2456 333.495 112.746 337.328C197.912 356.495 380.146 398.028 427.746 410.828C475.346 423.628 489.579 392.495 490.746 375.328C498.079 281.661 513.846 84.9281 518.246 47.3281C522.646 9.72813 546.412 0.992818 557.746 1.32516C606.079 0.325164 709.746 -1.07484 737.746 1.32516C765.746 3.72516 777.079 23.9918 779.246 33.8252L808.746 351.825C805.546 375.425 785.079 383.659 775.246 384.825Z" />
        </svg>

        {/* GLOWNY GRID - Desktop: 2 kolumny, Mobile (<1024px): 1 kolumna */}
        <div className="grid grid-cols-2 justify-around items-start gap-12 max-[1024px]:grid-cols-1">
          {/* LEWA STRONA: WIDGET */}
          <div className="w-full relative">
            {/* Nagłówek widoczny tylko poniżej 1024px */}
            <h3 className="hidden text-2xl font-bold text-[#0c493e] mb-6 max-[1024px]:block">
              {content.widgetTitleMobile}
            </h3>

            {!loaded && (
              <div className="w-full rounded-xl overflow-hidden animate-pulse min-h-[580px] flex flex-col">
                {/* Skeleton Header */}
                <div className="p-6 flex gap-4 items-start">
                  <div className="w-16 h-16 bg-gray-200 rounded-md shrink-0"></div>
                  <div className="flex flex-col gap-2 w-full pt-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-4 h-4 bg-gray-200 rounded-sm"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Skeleton Body */}
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-300" />
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                  </div>
                </div>
                {/* Skeleton Calendar Area */}
                <div className="px-6 py-8 flex-grow">
                  <div className="h-10 w-full border border-gray-200 rounded flex items-center justify-center mb-6">
                    <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 bg-white rounded border border-gray-100"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showScript && (
              <Script
                id="zl-widget-s"
                src="https://platform.docplanner.com/js/widget.js"
                strategy="afterInteractive"
                onLoad={() => setLoaded(true)}
                onError={(e) => {
                  console.error("❌ widget.js failed to load", e);
                  setLoaded(true);
                }}
              />
            )}

            <div
              className={`rounded-xl mt-20 overflow-hidden pointer-cursor ${
                !loaded ? "hidden" : "block"
              }`}
            >
              <a
                id="zl-url"
                className="zl-url block pointer-cursor"
                href="https://www.znanylekarz.pl/alicja-wojcik-4/fizjoterapeuta/warszawa"
                rel="nofollow"
                data-zlw-doctor="alicja-wojcik-4"
                data-zlw-type="big_with_calendar"
                data-zlw-opinion="false"
                data-zlw-hide-branding="true"
                data-zlw-saas-only="true"
              >
                Alicja Wójcik - ZnanyLekarz.pl
              </a>
            </div>
          </div>

          {/* PRAWA STRONA: OPINIE */}
          {/* Padding top tylko na desktopie (>1024px) */}
          <div className="flex flex-col gap-8 pt-8 max-[1024px]:pt-0">
            <div className="mb-2">
              <h3 className="text-3xl font-bold text-[#0c493e] mb-2 max-[1024px]:text-center">
                {content.sectionTitle}
              </h3>
              <p className="text-gray-500 text-lg max-[1024px]:text-center">
                {content.sectionSubtitle}
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {content.reviews.map((review: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-[#f8f9fa] border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-[#0c493e] text-lg">
                      {review.name}
                    </span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-[#ffc107] fill-current"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed italic">
                    &quot;{review.text}&quot;
                  </p>
                </div>
              ))}
            </div>

            {/* Link */}
            <div className="mt-2 text-left max-[1024px]:text-center">
              <a
                href={content.allReviewsHref}
                target="_blank"
                rel="noreferrer"
                className="text-[#0c493e] text-sm font-bold hover:text-[#00cca3] transition-colors border-b border-[#0c493e]/20 hover:border-[#00cca3] pb-0.5 pointer-cursor"
              >
                {content.allReviewsLink}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
