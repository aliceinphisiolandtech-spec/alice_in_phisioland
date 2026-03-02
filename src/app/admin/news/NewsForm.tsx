"use client";

import { createNewsAction } from "@/app/actions/news";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/LoadingButton"; // Upewnij się co do ścieżki
import { BellRing, Info } from "lucide-react";

export const NewsForm = () => {
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [isPending, startTransition] = useTransition();

  const handlePublish = async () => {
    // 1. Pobieramy dane
    const title = titleRef.current?.value || "";
    const content = contentRef.current?.value || "";

    // Zgodnie z wytyczną - zawsze wysyłamy PUSH
    const sendPush = true;

    // 2. Walidacja
    if (title.length < 3) {
      toast.error("Tytuł jest za krótki (min. 3 znaki).");
      titleRef.current?.focus();
      return;
    }

    if (content.length < 10) {
      toast.error("Treść jest za krótka (min. 10 znaków).");
      contentRef.current?.focus();
      return;
    }

    // 3. Potwierdzenie (opcjonalne, ale zalecane przy auto-push)

    // 4. Server Action
    startTransition(async () => {
      // Przekazujemy 'true' jako trzeci argument (sendPush)
      const res = await createNewsAction(title, content, sendPush);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Opublikowano i wysłano powiadomienia!");
        if (formRef.current) formRef.current.reset();
      }
    });
  };

  return (
    <form ref={formRef} className="flex flex-col gap-4">
      {/* INFO O PUSH */}
      <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
        <div className="p-1.5 bg-blue-100 rounded-full text-blue-600">
          <BellRing size={14} />
        </div>
        <div>
          <p className="text-xs font-bold text-blue-800">Automatyczny PUSH</p>
          <p className="text-[10px] text-blue-600/80 leading-tight mt-0.5">
            Każda nowa aktualność automatycznie wyśle powiadomienie do
            użytkowników.
          </p>
        </div>
      </div>

      {/* TYTUŁ */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Tytuł
        </label>
        <input
          ref={titleRef}
          name="title"
          placeholder="np. Nowy moduł dostępny"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#0c493e] focus:ring-1 focus:ring-[#0c493e] outline-none transition-all placeholder:text-gray-400"
        />
      </div>

      {/* TREŚĆ */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Treść
        </label>
        <textarea
          ref={contentRef}
          name="content"
          rows={3}
          placeholder="Krótki opis aktualności..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#0c493e] focus:ring-1 focus:ring-[#0c493e] outline-none transition-all resize-none placeholder:text-gray-400"
        />
      </div>

      {/* ANIMOWANY BUTTON */}
      <div className="pt-2">
        <LoadingButton
          type="button"
          onClick={handlePublish}
          isLoading={isPending}
          variant="primary" // Primary ma biały spinner i zielone tło
          className="w-full text-xs font-bold uppercase tracking-wider"
        >
          Opublikuj
        </LoadingButton>
      </div>
    </form>
  );
};
