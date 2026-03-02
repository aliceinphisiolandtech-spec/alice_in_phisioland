"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Download, Receipt, Code, Loader2 } from "lucide-react"; // Dodano Loader2
import { useState } from "react";
import { toast } from "sonner"; // Upewnij się, że masz sonner zainstalowany

interface DocumentsSectionProps {
  hasAccess: boolean;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export const DocumentsSection = ({ hasAccess }: DocumentsSectionProps) => {
  return (
    <AnimatePresence>
      {hasAccess && (
        <motion.section
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF */}
            <DocumentButton
              format="pdf" // Przekazujemy format
              icon={<Receipt size={24} />}
              label="Faktura VAT (PDF)"
              colorClass="text-orange-500 bg-orange-50 group-hover:bg-orange-500 group-hover:text-white"
            />
            {/* XML */}
            <DocumentButton
              format="xml" // Przekazujemy format
              icon={<Code size={24} />}
              label="Faktura (XML/KSeF)"
              colorClass="text-indigo-500 bg-indigo-50 group-hover:bg-indigo-500 group-hover:text-white"
            />
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

// --- KOMPONENT PRZYCISKU Z LOGIKĄ POBIERANIA ---

const DocumentButton = ({
  icon,
  label,
  colorClass,
  format,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  format: "pdf" | "xml";
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // 1. Strzelamy do naszego endpointu proxy
      const response = await fetch(`/api/invoices/download?format=${format}`);

      if (!response.ok) {
        throw new Error("Błąd pobierania");
      }

      // 2. Odbieramy plik jako Blob (Binary Large Object)
      const blob = await response.blob();

      // 3. Tworzymy tymczasowy link w przeglądarce i "klikamy" go wirtualnie
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faktura.${format}`; // Nazwa pliku (fallback)
      document.body.appendChild(a);
      a.click();

      // 4. Sprzątanie
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Pobrano fakturę ${format.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      toast.error("Nie udało się pobrać faktury. Spróbuj później.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.button
      onClick={handleDownload}
      disabled={isDownloading}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all group text-left w-full disabled:opacity-70 disabled:cursor-wait"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${colorClass}`}
      >
        {/* Jeśli trwa pobieranie, pokaż spinner zamiast ikony dokumentu */}
        {isDownloading ? (
          <Loader2 size={24} className="animate-spin text-gray-400" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
          Do pobrania
        </p>
        <p className="font-bold text-gray-800">{label}</p>
      </div>
      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#103830]/10 group-hover:text-[#103830] transition-colors">
        {isDownloading ? (
          // Opcjonalnie: mniejszy spinner lub nic
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
        ) : (
          <Download size={16} />
        )}
      </div>
    </motion.button>
  );
};
