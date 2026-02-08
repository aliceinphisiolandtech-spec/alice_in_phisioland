import { PrismaClient } from "../src/generated/prisma/index.js";

// Używamy pełnej struktury konfiguracyjnej zamiast skrótu datasourceUrl
const prisma = new PrismaClient();

const LANDING_DATA = {
  hero: {
    headline: {
      prefix: "Od Teorii Do Diagnozy",
      highlight: "Fizjoterapia",
      suffix: "Bez Domysłów",
    },
    description:
      "Studia dały Ci wiedzę, ja pokażę Ci, jak jej użyć. Praktyczny przewodnik po diagnostyce różnicowej, który wypełnia lukę między dyplomem a pierwszym pacjentem. Zrozum proces, odrzuć strach i postaw trafną hipotezę.",
    buttons: {
      primary: { label: "Zapisz się na kurs", url: "/ebook" },
      secondary: { label: "Zobacz E-book", url: "/ebook" },
    },
    socialProof: {
      stats: {
        count: "500+",
        labelLine1: "Sprzedanych",
        labelLine2: "egzemplarzy",
      },
    },
  },
  ebookFeatures: {
    headline: {
      line1: "Wiedza w",
      line2: "zasięgu",
      highlight: " twojej",
      line3: "ręki",
    },
    description:
      "Zamień stres przed pierwszym pacjentem na pewność trafnej diagnozy. Ten e-book to gotowe algorytmy i testy kliniczne, które wypełniają lukę między teorią ze studiów a realną pracą w gabinecie.",
    image: {
      src: "/landing-assets/E-book-presentation.webp",
      alt: "Fizjoterapeutyczna Diagnostyka Różnicowa",
    },
    button: {
      label: "Otrzymaj dostęp",
      url: "/ebook",
    },
    faq: {
      title: "Dla kogo jest ebook?",
      items: [
        {
          question: "Dla kogo jest ebook?",
          answer:
            "Został stworzony z myślą o studentach i świeżo upieczonych fizjoterapeutach, którzy czują stres przed samodzielną pracą z pacjentem i chcą usystematyzować swoją wiedzę diagnostyczną.",
        },
        {
          question: "W jakim formacie otrzymam plik?",
          answer:
            "E-book jest dostępny w formacie PDF, co pozwala na wygodne korzystanie z niego na komputerze, tablecie oraz smartfonie.",
        },
        {
          question: "Czy wiedza w nim zawarta jest czysto teoretyczna?",
          answer:
            "Nie. E-book skupia się na praktycznym zastosowaniu wiedzy, zawierając gotowe algorytmy postępowania i kliniczne przykłady.",
        },
        {
          question: "Czy otrzymam aktualizacje e-booka?",
          answer:
            "Tak, kupując e-booka otrzymujesz dożywotni dostęp do wszystkich przyszłych aktualizacji tego wydania.",
        },
        {
          question: "Czy e-book zastępuje kursy manualne?",
          answer:
            "E-book jest doskonałym uzupełnieniem kursów, porządkującym wiedzę teoretyczną i proces diagnostyczny, ale nie zastępuje praktycznej nauki technik manualnych.",
        },
      ],
    },
  },
  contentPreview: {
    headline: {
      line1: "Co znajdziesz",
      line2: "w środku?",
    },
    description:
      "To praktyczne uzupełnienie studiów, które wypełnia lukę między dyplomem a pierwszym pacjentem. Poznasz proces diagnostyki różnicowej, nauczysz się stawiać trafne hipotezy kliniczne i zarządzać bólem w oparciu o rzetelne dowody naukowe (EBM).",
    checklist: [
      "Fundamenty Diagnoz",
      "Czerwone Flagi",
      "Fazy Gojenia",
      "Dekalog Wywiadu",
      "Fenotypy Bólu",
      "Klastery Testów",
    ],
    features: [
      {
        title: "Logika wnioskowania",
        description:
          "Schematy eliminacji błędnych hipotez, które uporządkują Twoje badanie w gabinecie.",
      },
      {
        title: "Wskaźniki EBM",
        description:
          "Zastosowanie czułości i swoistości testów klinicznych do zawężenia obszaru poszukiwań.",
      },
      {
        title: "Analiza Uwrażliwienia",
        description:
          "Przewodnik po mechanizmach neuroplastyczności i pracy z bólem chronicznym.",
      },
      {
        title: "Bezpieczny Panel",
        description:
          "Dostęp do treści online w zabezpieczonym viewerze wraz z linkiem do wysokiej jakości infografik.",
      },
    ],
    transformation: [
      {
        id: 1,
        problemTitle: "Paraliż decyzyjny",
        problemDesc: ", przy trudnym pacjencie i obawa przed błędem.",
        solution: "Gotowe algorytmy postępowania dające pewność w gabinecie.",
      },
      {
        id: 2,
        problemTitle: "Chaos w testach",
        problemDesc: ", wykonywanie dziesiątek prób bez rzetelnego wniosku.",
        solution:
          "Kliniczne „mięso”, które od razu wdrażasz do pracy z pacjentem.",
      },
      {
        id: 3,
        problemTitle: "Błądzenie w diagnozie",
        problemDesc: ", niepewność, czy ból to tkanka, czy układ nerwowy.",
        solution:
          "Precyzyjna diagnostyka różnicowa i zrozumienie mechanizmów bólu.",
      },
      {
        id: 4,
        problemTitle: "Strach przed patologią",
        problemDesc: ", lęk, że przeoczysz nowotwór lub infekcję.",
        solution:
          "Znajomość Czerwonych Flag i bezpieczne prowadzenie pacjenta.",
      },
      {
        id: 5,
        problemTitle: "Niespójny wywiad",
        problemDesc: ", poczucie, że ważne informacje uciekają w rozmowie.",
        solution:
          "Dekalog wywiadu i celowane pytania, które budują pełny obraz.",
      },
    ],
  },
  testimonials: {
    headline: {
      line1: "Zaufanie budowane na",
      line2: "rzetelnej wiedzy",
    },
    reviews: [
      {
        id: 1,
        name: "Tomasz Kowalski",
        role: "Fizjoterapeuta",
        rating: 5,
        headline: "Absolutny game-changer",
        text: "System diagnostyki różnicowej Alicji zmienił moją pracę w gabinecie. Zobaczyłem, że nie muszę zgadywać, a mogę opierać się na twardych danych. To absolutny game-changer w mojej praktyce.",
      },
      {
        id: 2,
        name: "Sebastian Piasecki",
        role: "Student Fizjoterapii",
        rating: 5,
        headline: "Koniec z laniem wody",
        text: "Niesamowita dawka wiedzy. Ebook jest konkretny, bez lania wody. Czerwone flagi omówione w sposób, który daje mi spokój ducha przy każdym pacjencie. Egzaminy stały się prostsze.",
      },
      {
        id: 3,
        name: "Anna Nowak",
        role: "Osteopata",
        rating: 4.5,
        headline: "Podejście oparte na EBM",
        text: "W końcu ktoś zebrał to w jedną całość. Algorytmy postępowania to złoto. Polecam każdemu, kto czuje się niepewnie w diagnostyce. Bardzo podoba mi się podejście oparte na EBM.",
      },
      {
        id: 4,
        name: "Katarzyna Wójcik",
        role: "Fizjoterapeuta",
        headline: "Pewność trafnej hipotezy",
        rating: 5,
        text: "Sprawdź, jak system diagnostyki różnicowej zmienia codzienną pracę. Zamieniłam paraliż decyzyjny na pewność trafnej hipotezy klinicznej. Pacjenci to widzą i doceniają.",
      },
    ],
  },
  securePanel: {
    headline: {
      line1: "Twój Zabezpieczony",
      highlight: "Panel Wiedzy",
    },
    description:
      "To praktyczne uzupełnienie studiów, które wypełnia lukę między dyplomem a pierwszym pacjentem. Poznasz proces diagnostyki i otrzymasz dostęp do unikalnych materiałów w bezpiecznym środowisku.",
    image: {
      src: "/landing-assets/image_865524.png",
      alt: "Panel Wiedzy",
    },
    features: [
      {
        title: "Brak pobierania",
        description:
          "Treści są streamowane w bezpiecznym playerze, bez możliwości zapisu na dysk.",
      },
      {
        title: "Dynamiczny Watermark",
        description:
          "Twoje dane są wyświetlane w losowych miejscach, co zniechęca do nagrywania ekranu.",
      },
      {
        title: "Blokada kopiowania",
        description:
          "Tekst i materiały w panelu są zabezpieczone przed skrótami Ctrl+C / Ctrl+V.",
      },
      {
        title: "Kontrola wydruku",
        description:
          "Inteligentne blokady uniemożliwiają drukowanie materiałów chronionych prawem autorskim.",
      },
    ],
    button: {
      label: "Zarejestruj się",
      url: "/checkout",
    },
  },
  about: {
    headline: {
      prefix: "Nazywam się",
      highlight: "Alicja Wójcik",
    },
    description:
      "Jestem absolwentką Akademii Wychowania Fizycznego Józefa Piłsudskiego w Warszawie, kierunków fizjoterapia i wychowanie fizyczne. Studiuję na 4 roku w Akademii Ortopedycznej Terapii Manualnej – PSOTM. Zdobyłam dyplom terapeutki manualnej koncepcji Kaltenborna-Evjentha - narodowy egzamin końcowy zdany w 2022 roku po ukończeniu 296h szkoleń z zakresu badania i leczeniakręgosłupa, stawów obwodowych oraz stawów skroniowo-żuchwowych.",
    image: {
      src: "/landing-assets/about-image.webp",
      alt: "Alicja Wójcik",
    },
    cards: [
      {
        title: "Wykształcenie i Fundamenty",
        description:
          "Absolwentka AWF Warszawa oraz studentka 4. roku Akademii Ortopedycznej Terapii Manualnej – PSOTM.",
      },
      {
        title: "Specjalizacja i Certyfikacja",
        description:
          "Certyfikowana terapeutka manualna koncepcji Kaltenborna-Evjentha. Zdany egzamin państwowy w 2022 roku.",
      },
      {
        title: "Praktyka i doświadczenie",
        description:
          "Ponad 296h specjalistycznych szkoleń z zakresu badania i leczenia kręgosłupa oraz stawów obwodowych.",
      },
    ],
  },
  practicalTraining: {
    image: {
      src: "/landing-assets/mentoring-image.webp",
      alt: "Szkolenie praktyczne",
    },
    badge: {
      count: "30+",
      label: "szkoleń rocznie",
    },
    headline: {
      line1: "Opanuj Diagnostykę",
      highlight: "w Praktyce",
    },
    description:
      "Sam e-book to dopiero początek drogi do pełnej samodzielności diagnostycznej. Podczas kursów stacjonarnych przekładamy teorię na realne techniki manualne, analizujemy żywe przypadki kliniczne i budujemy Twoją pewność w gabinecie pod okiem doświadczonych mentorów.",
    features: [
      {
        title: "Autorski Program Szkoleniowy",
        description:
          "Skoncentrowany na młodych praktykach, którzy chcą usystematyzować wiedzę kliniczną.",
      },
      {
        title: "200 zł Rabatu dla Czytelników",
        description:
          "Każdy nabywca e-booka otrzymuje dedykowaną zniżkę na start swojej edukacji z Rehaintegro.",
      },
    ],
    button: {
      label: "Zobacz terminy",
      url: "/terminy",
    },
  },
  contactFooter: {},
};

async function main() {
  console.log("Rozpoczynam seedowanie bazy danych...");
  for (const [key, content] of Object.entries(LANDING_DATA)) {
    await prisma.section.upsert({
      where: { key },
      update: { content },
      create: { key, content },
    });
    console.log(`✓ Zaktualizowano sekcję: ${key}`);
  }
  console.log("Seedowanie zakończone sukcesem!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
