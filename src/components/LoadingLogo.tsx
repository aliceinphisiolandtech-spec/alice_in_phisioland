"use client";

import { motion, Variants } from "framer-motion";

export default function LoadingLogoLessFade() {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const drawAndHoldVariants: Variants = {
    hidden: {
      pathLength: 0,
      fillOpacity: 0,
    },
    visible: {
      pathLength: [0, 1, 1, 1, 1, 0],
      fillOpacity: [0, 0, 1, 1, 1, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        // Zmiana tutaj: używamy wbudowanego stringa zamiast tablicy liczb
        ease: "easeInOut",
        times: [0, 0.1, 0.2, 0.8, 0.9, 1],
      },
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <motion.svg
        width="90"
        height="70"
        viewBox="0 0 45 35"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 1. Main Left/Bottom Part (Teal) */}
        <motion.path
          variants={drawAndHoldVariants}
          d="M3.81892 35H0L8.78108 0.217842H14.5703L21.527 28.4889L28.7757 0.290456H32.327L23.8622 35H19.0216L16.6865 24.955H7.75946L8.85405 20.4288H15.7135L11.627 3.31604L3.81892 35Z"
          stroke="#0C493E"
          strokeWidth="0.5"
          fill="#0C493E"
        />

        {/* 2. Middle Top Part */}
        <motion.path
          variants={drawAndHoldVariants}
          d="M24.7622 5.61549L23.1811 12.2234L19.5568 0.363071L23.3027 0.290456L24.7622 5.61549Z"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="currentColor"
          className="text-zinc-900 dark:text-zinc-100"
        />

        {/* 3. Right Part */}
        <motion.path
          variants={drawAndHoldVariants}
          d="M30.5027 25.2697L30.5205 25.2063L29.3897 20.8645L31.6355 12.9253L32.6663 17.577L32.6676 17.5726L34.8324 27.3513L41.1081 0H45L36.6324 34.758H33.0081L30.5027 25.2697Z"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="currentColor"
          className="text-zinc-900 dark:text-zinc-100"
        />
      </motion.svg>
    </div>
  );
}
