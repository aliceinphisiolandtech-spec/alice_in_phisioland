import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

// Definiujemy TYLKO nowe sekcje.
// Stare sekcje (hero, about, etc.) nie zostaną dotknięte,
// ponieważ nie ma ich w tym obiekcie.
const NEW_PATIENT_DATA = {
  // --- 1. PATIENT HERO ---
  patientHero: {
    badge: "Strefa Pacjenta",
    title: "Skuteczna terapia manualna i diagnostyka funkcjonalna",
    description:
      "Nazywam się Alicja Wójcik. Stworzyłam tę strefę, aby ułatwić Ci proces leczenia. Znajdziesz tu rzetelne informacje o tym jak pracuję, ile kosztuje wizyta oraz jak przygotować się do pierwszego spotkania.",
    features: [
      {
        title: "Diagnostyka",
        desc: "Znajdujemy źródło bólu",
        // Dodaję 'icon' na sztywno, bo schemat Zod tego wymaga,
        // mimo że formularz tego nie edytuje (dla bezpieczeństwa typów).
        icon: "ScanSearch",
      },
      {
        title: "Terapia indywidualna",
        desc: "Czas w 100% dla Ciebie",
        icon: "UserCheck",
      },
      {
        title: "Edukacja i profilaktyka",
        desc: "Świadomość własnego ciała",
        icon: "BrainCircuit",
      },
    ],
    // Te pola nie są edytowalne w formularzu, ale muszą być w bazie
    cta: {
      text: "Sprawdź wolne terminy",
      href: "https://www.znanylekarz.pl/alicja-wojcik-4/fizjoterapeuta/warszawa",
    },
    stats: {
      rating: "5.0 / 5.0",
      ratingText: "Zweryfikowane opinie pacjentów",
    },
  },

  // --- 2. PATIENT REVIEWS ---
  patientReviews: {
    sectionTitle: "Co mówią pacjenci?",
    sectionSubtitle: "Opinie zweryfikowane z portalu ZnanyLekarz",
    widgetTitleMobile: "Umów wizytę online",
    reviews: [
      {
        name: "Aneta",
        text: "Serdecznie polecam, Pani Alicja wyleczyła już jedną z moich kontuzji, do dzisiaj nie wrócił ból. Teraz zajmujemy się kolejną. Dosłownie ręce, które leczą :)",
      },
      {
        name: "IIZ",
        text: "Niezwykle kompetentna, otwarta, rzeczowa i bardzo zaangażowana. Żaden fizjoterapeuta nie zajął się jak do tej pory moim problemem tak kompleksowo i z taką skutecznością. Polecam!",
      },
      {
        name: "AAda",
        text: "Jestem bardzo zadowolona, przychodzę już od kilku tygodni. Pani Alicja jest bardzo zaangażowana, słucha pacjenta i dostosowuje ćwiczenia i terapię do jego potrzeb.",
      },
    ],
    allReviewsLink: "Zobacz wszystkie 80+ opinii na ZnanyLekarz.pl →",
    allReviewsHref:
      "https://www.znanylekarz.pl/alicja-wojcik-4/fizjoterapeuta/warszawa#profile-reviews",
  },

  // --- 3. PATIENT PREPARATION ---
  patientPreparation: {
    badge: "Komfort wizyty",
    title: "Jak przygotować się do wizyty?",
    description: "3 proste kroki dla lepszej diagnozy.",
    steps: [
      {
        icon: "FileText",
        step: "01",
        title: "Dokumentacja",
        desc: "Zabierz aktualne badania obrazowe (RTG, MRI, USG) oraz wypisy ze szpitala.",
      },
      {
        icon: "Shirt",
        step: "02",
        title: "Strój",
        desc: "Luźny, sportowy strój niekrępujący ruchów. Dostępna jest przebieralnia.",
      },
      {
        icon: "Coffee",
        step: "03",
        title: "Posiłek",
        desc: "Nie jedz obfitego posiłku tuż przed wizytą, ale nie przychodź na czczo.",
      },
    ],
  },

  // --- 4. PATIENT FAQ ---
  patientFaq: {
    badge: "FAQ",
    title: "Pytania i odpowiedzi",
    items: [
      {
        id: 1,
        question: "Jak mogę odwołać wizytę?",
        answer:
          "Najszybciej zrobisz to samodzielnie przez profil na ZnanyLekarz.pl (link znajdziesz w mailu potwierdzającym). Możesz też wysłać SMS lub zadzwonić. Proszę o informację z wyprzedzeniem min. 24h.",
      },
      {
        id: 2,
        question: "Ile trwa wizyta?",
        answer:
          "Pierwsza wizyta diagnostyczna trwa zazwyczaj około 45-60 minut, co pozwala na dokładny wywiad i badanie. Kolejne wizyty terapeutyczne trwają standardowo około 45 minut.",
      },
      {
        id: 3,
        question: "Jakie są metody płatności?",
        answer:
          "Dla Twojej wygody w gabinecie akceptuję wszystkie popularne formy płatności: gotówkę, kartę płatniczą oraz BLIK.",
      },
      {
        id: 4,
        question: "Czy przyjmujesz dzieci?",
        answer:
          "Tak, pracuję z dziećmi (np. wady postawy). W przypadku niemowląt proszę o wcześniejszy kontakt telefoniczny przed umówieniem wizyty.",
      },
      {
        id: 5,
        question: "Czy muszę mieć skierowanie?",
        answer:
          "Nie, skierowanie nie jest wymagane. Jako fizjoterapeuta przeprowadzam własną diagnostykę funkcjonalną i kwalifikację do terapii.",
      },
      {
        id: 6,
        question: "Gdzie jest gabinet?",
        answer:
          "Gabinet znajduje się w ścisłym centrum. Dokładny adres oraz wskazówki dojazdu otrzymasz w wiadomości potwierdzającej rezerwację.",
      },
    ],
  },
};

async function main() {
  console.log("🚀 Rozpoczynam aktualizację sekcji STREFY PACJENTA...");

  for (const [key, content] of Object.entries(NEW_PATIENT_DATA)) {
    // Używamy upsert:
    // - Jeśli sekcja nie istnieje -> stworzy ją (CREATE).
    // - Jeśli sekcja już istnieje -> zaktualizuje ją do wersji z tego pliku (UPDATE).
    // To bezpieczne dla nowych sekcji. Stare sekcje (hero, about) są bezpieczne, bo ich tu nie ma.
    await prisma.section.upsert({
      where: { key },
      update: { content },
      create: { key, content },
    });
    console.log(`✓ Zaktualizowano/Dodano: ${key}`);
  }

  console.log(
    "✅ Zakończono! Stare sekcje (Hero, About itp.) pozostały bez zmian.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
