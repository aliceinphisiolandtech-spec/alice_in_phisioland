import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Mail,
  Instagram,
  AlertTriangle,
} from "lucide-react";
import { notFound } from "next/navigation";
// Upewnij się, że ścieżka do Twojego komponentu jest poprawna
import { EbookInfoCard } from "@/components/panel-kursanta/czytnik/EbookInfoCard";
import { ProgressTracker } from "@/components/panel-kursanta/czytnik/ProgressTracker";

// --- 1. TWOJE STANDARDOWE KOMPONENTY ---
const components = {
  // --- Standardowe tagi HTML ---
  h1: (props: any) => (
    <h1
      className="text-2xl sm:text-3xl font-bold text-[#103830] mt-8 mb-6 leading-tight"
      {...props}
    />
  ),
  h2: (props: any) => (
    <h2
      className="text-xl font-bold text-[#103830] mt-8 mb-4 border-b pb-2 border-gray-100"
      {...props}
    />
  ),
  h3: (props: any) => (
    <h3 className="text-lg font-bold text-[#103830] mt-6 mb-3" {...props} />
  ),
  p: (props: any) => (
    <p
      className="text-gray-700 leading-relaxed mb-4 text-[16px] sm:text-[18px]"
      {...props}
    />
  ),
  ul: (props: any) => (
    <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-700" {...props} />
  ),
  li: (props: any) => <li className="pl-1 !text-[18px]" {...props} />,
  strong: (props: any) => (
    <strong className="font-bold text-[#103830]" {...props} />
  ),

  // Uwaga: EbookInfoCard tutaj jest tylko "zaślepką",
  // właściwa wersja z danymi zostanie stworzona dynamicznie poniżej w `componentsWithData`.
  EbookInfoCard: EbookInfoCard,

  Image: (props: any) => (
    <Image
      {...props}
      width={props.width || 1000}
      height={props.height || 1000}
      sizes="100vw"
      className="w-full h-auto rounded-lg shadow-md my-8 pointer-cursor object-contain"
      alt=""
    />
  ),

  Link: (props: any) => <Link {...props} />,

  // --- 3. Customowe Komponenty ---

  ContactLink: ({ email, instagram }: { email: string; instagram: string }) => (
    <div className="flex flex-col gap-3 mt-4 mb-8">
      <a
        href={`mailto:${email}`}
        className="flex items-center gap-2 text-gray-700 hover:text-[#103830] transition-colors w-fit pointer-cursor"
      >
        <div className="p-2 bg-gray-100 rounded-full text-[#103830]">
          <Mail size={16} />
        </div>
        <span className="font-bold text-sm">{email}</span>
      </a>
      <a
        href={`https://instagram.com/${instagram}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors w-fit pointer-cursor"
      >
        <div className="p-2 bg-gray-100 rounded-full text-pink-600">
          <Instagram size={16} />
        </div>
        <span className="font-bold text-sm">@{instagram}</span>
      </a>
    </div>
  ),

  Note: ({ type, children }: { type?: string; children: React.ReactNode }) => (
    <div
      className={`my-6 p-4 rounded-xl border-l-4 ${
        type === "warning"
          ? "bg-red-50 border-red-500 text-red-900"
          : "bg-gray-50 border-gray-400 text-gray-700"
      }`}
    >
      <div className="flex gap-3 items-start">
        {type === "warning" && (
          <AlertTriangle size={20} className="shrink-0 text-red-500 mt-0.5" />
        )}
        <div className="text-sm font-medium leading-relaxed">{children}</div>
      </div>
    </div>
  ),

  ImportantBox: ({ children }: { children: React.ReactNode }) => (
    <div className="my-8 p-6 bg-[#F2F4F7] rounded-xl border-l-4 border-[#103830] italic text-gray-800 shadow-sm">
      {children}
    </div>
  ),

  TwoColumn: ({
    left,
    right,
  }: {
    left: React.ReactNode;
    right: React.ReactNode;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 items-center">
      <div className="flex justify-center">{left}</div>
      <div className="text-sm text-gray-600 italic">{right}</div>
    </div>
  ),
};

// --- 2. LOGIKA POBIERANIA PLIKÓW ---
const contentDir = path.join(process.cwd(), "content");

function getOrderedFiles() {
  if (!fs.existsSync(contentDir)) return [];

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));

  const allChapters = files.map((filename) => {
    const fileContent = fs.readFileSync(
      path.join(contentDir, filename),
      "utf-8",
    );
    const { data } = matter(fileContent);
    return {
      slug: filename.replace(".mdx", ""),
      title: data.title,
      order:
        typeof data.order === "number"
          ? data.order
          : parseInt(data.order) || 999,
      description: data.description,
    };
  });

  return allChapters.sort((a, b) => a.order - b.order);
}

export async function generateStaticParams() {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));
  return files.map((filename) => ({
    slug: filename.replace(".mdx", ""),
  }));
}

// --- 3. WIDOK STRONY ---

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ChapterPage({ params }: Props) {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);

  const filename = `${decodedSlug}.mdx`;
  const filePath = path.join(contentDir, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Błąd: Nie znaleziono pliku: ${filePath}`);
    return notFound();
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(fileContent);

  // POBIERAMY DANE Z FRONTMATTERA (YAML)
  const cardData = data.cardData || {};

  const chapters = getOrderedFiles();
  const currentIndex = chapters.findIndex((c) => c.slug === decodedSlug);
  const prevChapter = chapters[currentIndex - 1];
  const nextChapter = chapters[currentIndex + 1];

  // TWORZYMY SPECJALNĄ LISTĘ KOMPONENTÓW Z WSTRZYKNIĘTYMI DANYMI
  const componentsWithData = {
    ...components,
    // Nadpisujemy EbookInfoCard tak, żeby miał już dane z YAML
    EbookInfoCard: () => (
      <EbookInfoCard
        schedule={cardData.schedule}
        discountLink={cardData.discountLink}
        discountAmount={cardData.discountAmount}
        trainingName={cardData.trainingName}
        contactEmail={cardData.contactEmail}
        instagramHandle={cardData.instagramHandle}
      />
    ),
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <ProgressTracker slug={decodedSlug} />
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <Link
          href="/panel-kursanta/czytnik"
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#103830] transition-colors uppercase tracking-wider pointer-cursor"
        >
          <ArrowLeft size={16} /> Spis Treści
        </Link>
        <div className="text-[10px] font-bold text-[#103830] bg-[#D4F0C8] px-2 py-1 rounded-md">
          {data.order !== undefined ? `ROZDZIAŁ ${data.order}` : "WSTĘP"}
        </div>
      </div>

      {/* TREŚĆ */}
      <article className="max-w-2xl mx-auto px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-[#103830] leading-tight mb-2">
            {data.title}
          </h1>
          {data.description && (
            <p className="text-sm text-gray-400 font-medium">
              {data.description}
            </p>
          )}
        </div>

        <div className="prose prose-stone prose-lg max-w-none prose-headings:text-[#103830] prose-a:text-[#103830]">
          {/* Przekazujemy naszą nową listę komponentów z danymi */}
          <MDXRemote source={content} components={componentsWithData} />
        </div>
      </article>

      {/* NAWIGACJA DÓŁ */}
      <div className="max-w-2xl mx-auto px-5 mt-16 flex flex-col gap-4">
        {nextChapter ? (
          <Link
            href={`/panel-kursanta/czytnik/${nextChapter.slug}`}
            className="group relative flex items-center justify-between bg-[#103830] text-white p-6 rounded-2xl shadow-xl shadow-[#103830]/20 hover:scale-[1.02] transition-all active:scale-95 pointer-cursor"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1 font-bold">
                Następnie
              </span>
              <span className="font-bold text-lg leading-tight pr-4">
                {nextChapter.title}
              </span>
            </div>
            <div className="bg-white/10 p-3 rounded-full group-hover:bg-white group-hover:text-[#103830] transition-colors">
              <ArrowRight size={24} />
            </div>
          </Link>
        ) : (
          <div className="text-center p-10 bg-contrast rounded-2xl border border-gray-100">
            <div className="w-full flex items-center justify-center mb-4">
              <div className="bg-primary  h-12  flex items-center content-center w-12 rounded-full">
                <Star
                  className="mx-auto text-contrast "
                  size={26}
                  fill="currentColor"
                />
              </div>
            </div>
            <p className="font-bold text-gray-900">To już koniec e-booka!</p>
            <Link
              href="/panel-kursanta/kursy"
              className="text-sm text-[#103830] underline mt-2 block pointer-cursor"
            >
              Wróć do listy kursów
            </Link>
          </div>
        )}

        {prevChapter && (
          <Link
            href={`/panel-kursanta/czytnik/${prevChapter.slug}`}
            className="text-center text-sm font-bold mt-4 bg-contrast p-2 rounded-2xl text-primary py-4 pointer-cursor hover:scale-[1.02] transition-all"
          >
            Poprzedni rozdział: {prevChapter.title}
          </Link>
        )}
      </div>
    </div>
  );
}
