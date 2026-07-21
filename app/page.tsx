export const dynamic = "force-dynamic";

import Nav from "@/components/Nav";
import Hero3D from "@/components/Hero3D";
import AgentConsole from "@/components/AgentConsole";
import TeamSection from "@/components/TeamSection";
import Capabilities from "@/components/Capabilities";
import Integrations from "@/components/Integrations";
import HowItWorks from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero3D />
      <TeamSection />
      <Capabilities />
      <Integrations />
      <HowItWorks />
      <DashboardPreview />
      <Testimonials />
      <Pricing />
      <Footer />
      <AgentConsole />
    </main>
  );
}
