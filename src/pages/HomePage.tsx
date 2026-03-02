import { Footer } from "../components/reusable/footer";
import { ReusableNav } from "../components/reusable/nav";
import { DashboardsSection } from "../sections/homepage/DashboardsSection";
import { FeaturesSection } from "../sections/homepage/FeaturesSection";
import { HeroSection } from "../sections/homepage/HeroSection";
import { ContactSection } from "../sections/homepage/ContactSection";
import { WorkflowSection } from "../sections/homepage/WorkflowSection";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-tawi-bg overflow-x-hidden">
      {/* Top glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-tawi-leaf/35 blur-3xl" />

      <ReusableNav />

      <main className="relative">
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <ContactSection />
        <Footer />
      </main>
    </div>
  );
}