import fs from "fs";
import path from "path";
import matter from "gray-matter";
import TocContent from "@/components/panel-kursanta/czytnik/TocContent";

export default function TableOfContentsPage() {
  const contentDir = path.join(process.cwd(), "content");

  // Pobieramy i sortujemy pliki (Logika serwerowa - FS)
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));

  const chapters = files
    .map((filename) => {
      const fileContent = fs.readFileSync(
        path.join(contentDir, filename),
        "utf-8",
      );
      const { data } = matter(fileContent);
      return {
        slug: filename.replace(".mdx", ""),
        title: data.title,
        order: data.order,
      };
    })
    .sort((a, b) => a.order - b.order);

  // Przekazujemy dane do Client Componentu z animacją
  return (
    <div className="h-full w-full overflow-hidden">
      <TocContent chapters={chapters} />
    </div>
  );
}
