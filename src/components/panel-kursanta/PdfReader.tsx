"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw, Loader2, X } from "lucide-react";
import Link from "next/link";

// Konfiguracja stylów i workera
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Upewnij się, że plik workera jest w /public (tak jak ustaliliśmy wcześniej)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfReaderProps {
  fileUrl: string;
}

export default function PdfReader({ fileUrl }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(
    window.innerWidth,
  );
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);

  // 1. Responsywność: Dopasuj szerokość PDF do ekranu przy starcie i zmianie orientacji
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Obsługa sukcesu ładowania - zapisujemy liczbę stron
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    // FULL SCREEN CONTAINER: fixed inset-0 zajmuje cały ekran, z-50 jest na wierzchu
    <div className="fixed inset-0 z-50 bg-[#1a1a1a] flex flex-col h-[100dvh] w-full overflow-hidden">
      {/* --- GÓRNY PASEK KONTROLNY (Floating) --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start pointer-events-none">
        {/* Przycisk Zamknij / Wróć */}
        <Link
          href="/panel-kursanta"
          className="pointer-events-auto bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </Link>

        {/* Kontrolki Zoomu (Dla Desktopu / Pomocnicze na Mobile) */}
        <div className="pointer-events-auto flex gap-2 bg-black/50 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-lg">
          <button
            onClick={() => transformComponentRef.current?.zoomOut()}
            className="p-2 text-white hover:text-[#D4F0C8] transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => transformComponentRef.current?.zoomIn()}
            className="p-2 text-white hover:text-[#D4F0C8] transition-colors"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => transformComponentRef.current?.resetTransform()}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* --- OBSZAR ZOOMOWALNY (Pan & Zoom) --- */}
      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <TransformWrapper
          ref={transformComponentRef}
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit={true}
          limitToBounds={false} // Pozwala swobodnie przesuwać długi dokument
          wheel={{ step: 0.1 }} // Zoom rolką myszy
          panning={{ velocityDisabled: true }} // Płynniejsze przesuwanie na dotyk
        >
          {/* Ten komponent obsługuje gesty (pinch) */}
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full flex justify-center min-h-screen"
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex h-screen w-screen items-center justify-center text-white">
                  <Loader2 className="animate-spin" size={40} />
                </div>
              }
              error={
                <div className="flex h-screen w-screen items-center justify-center text-red-400 font-bold">
                  Błąd ładowania pliku.
                </div>
              }
              className="flex flex-col items-center gap-4 py-20 px-4" // Gap między stronami
            >
              {/* Renderujemy WSZYSTKIE strony jedna pod drugą */}
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  // Szerokość dynamiczna (responsywna)
                  // Na mobile (szerokość ekranu), na desktop (max 800px)
                  width={containerWidth > 800 ? 800 : containerWidth - 20}
                  renderAnnotationLayer={false}
                  renderTextLayer={false} // Dla wydajności (tekst jako obrazek)
                  className="shadow-2xl bg-white"
                />
              ))}
            </Document>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
