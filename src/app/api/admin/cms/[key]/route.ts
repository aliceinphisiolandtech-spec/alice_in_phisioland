import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SECTION_SCHEMAS } from "@/lib/validators/landing";

// 1. DODANO 'async' tutaj
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function transformDataBeforeSave(key: string, data: any) {
  // 1. HERO
  if (key === "hero") {
    const { headline, highlight, description, buttons, socialProof } = data;
    return {
      headline,
      highlight,
      description,
      buttons: {
        primary: { label: buttons.primary.label, url: "/kurs" },
        secondary: { label: buttons.secondary.label, url: "/ebook" },
      },
      socialProof,
    };
  }

  // 2. CONTENT PREVIEW
  if (key === "contentPreview") {
    return {
      ...data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checklist: data.checklist.map((item: any) => item.text),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformation: data.transformation.map((item: any, index: number) => ({
        ...item,
        id: item.id || (index + 1).toString(),
      })),
    };
  }
  if (key === "authPage") {
    return data;
  }
  // 3. EBOOK FEATURES
  if (key === "ebookFeatures") {
    return data;
  }
  if (key === "practicalTraining") {
    return {
      headline: data.headline,
      highlight: data.highlight,
      description: data.description,
      badge: data.badge,
      features: data.features,
      button: {
        label: data.button.label,
        // url jest w kodzie
      },
      // image jest w kodzie
    };
  }
  // 4. TESTIMONIALS (Zachowujemy opinie, aktualizujemy tylko nagłówek)
  if (key === "testimonials") {
    const currentSection = await prisma.section.findUnique({
      where: { key: "testimonials" },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentContent = (currentSection?.content as any) || {};

    return {
      ...currentContent,
      headline: data.headline,
      highlight: data.highlight,
    };
  }

  // 5. SECURE PANEL
  if (key === "securePanel") {
    return {
      headline: data.headline,
      highlight: data.highlight,
      description: data.description,
      features: data.features,
      button: {
        label: data.button.label,
        // url jest w kodzie
      },
      // image jest w kodzie
    };
  }

  // 6. ABOUT (Nowość!)
  if (key === "about") {
    return {
      headline: data.headline,
      highlight: data.highlight,
      description: data.description,
      cards: data.cards,
      // image jest w kodzie
    };
  }

  return data;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    const body = await request.json();

    const schema = SECTION_SCHEMAS[key];

    if (!schema) {
      return NextResponse.json(
        { message: `Nie znaleziono schematu dla sekcji: ${key}` },
        { status: 400 },
      );
    }

    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Błąd walidacji danych",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // 2. DODANO 'await' tutaj, bo funkcja wyżej jest teraz async
    const contentToSave = await transformDataBeforeSave(key, validation.data);

    await prisma.section.upsert({
      where: { key: key },
      update: { content: contentToSave },
      create: {
        key: key,
        content: contentToSave,
      },
    });

    return NextResponse.json(
      { message: "Zapisano pomyślnie!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[CMS API ERROR]", error);
    return NextResponse.json(
      { message: "Wystąpił błąd serwera." },
      { status: 500 },
    );
  }
}
