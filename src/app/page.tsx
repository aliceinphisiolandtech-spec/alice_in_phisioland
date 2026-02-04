import { About } from "@/features/landing-page/components/About";
import { ContactFooter } from "@/features/landing-page/components/ContactFooter";
import { ContentPreview } from "@/features/landing-page/components/ContentPreview";
import { EbookFeatures } from "@/features/landing-page/components/EbookFeatures";
import { Hero } from "@/features/landing-page/components/Hero";
import { PracticalTraining } from "@/features/landing-page/components/PracticalTraining";
import { SecurePanel } from "@/features/landing-page/components/SecurePanel";
import { Testimonials } from "@/features/landing-page/components/Testimonials";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-grow">
        <Hero />
        <EbookFeatures />
        <ContentPreview />
        <Testimonials />
        <SecurePanel />
        <About />
        <PracticalTraining />
      </main>

      <ContactFooter />
    </div>
  );
}
