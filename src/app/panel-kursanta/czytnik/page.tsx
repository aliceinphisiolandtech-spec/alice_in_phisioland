import fs from "fs";
import path from "path";
import matter from "gray-matter";
import TocContent from "@/components/panel-kursanta/czytnik/TocContent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TableOfContentsPage() {
  const contentDir = path.join(process.cwd(), "content");

  // 1. Pobieranie plików (FS)
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

  // 2. Pobieranie postępu (Prisma)
  const session = await getServerSession(authOptions);
  let completedSlugs: string[] = [];

  if (session?.user?.id) {
    const progress = await prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        chapterId: true, // Pobieramy tylko ID (czyli slug)
      },
    });
    completedSlugs = progress.map((p) => p.chapterId);
  }

  // 3. Przekazujemy wszystko do klienta
  return (
    <div className="h-full w-full overflow-hidden">
      <TocContent chapters={chapters} completedChapters={completedSlugs} />
    </div>
  );
}
