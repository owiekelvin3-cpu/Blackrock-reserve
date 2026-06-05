import dynamic from "next/dynamic";
import Hero from "@/components/marketing/Hero";

function SectionLoader() {
  return (
    <div className="section-padding">
      <div className="mx-auto max-w-7xl h-48 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
    </div>
  );
}

const Stats = dynamic(() => import("@/components/marketing/Stats"), { loading: SectionLoader });
const ProcessFlow = dynamic(() => import("@/components/marketing/ProcessFlow"), { loading: SectionLoader });
const WorkflowSteps = dynamic(() => import("@/components/marketing/WorkflowSteps"), { loading: SectionLoader });
const Features = dynamic(() => import("@/components/marketing/Features"), { loading: SectionLoader });
const InvestmentPreview = dynamic(() => import("@/components/marketing/InvestmentPreview"), { loading: SectionLoader });
const Testimonials = dynamic(() => import("@/components/marketing/Testimonials"), { loading: SectionLoader });
const Security = dynamic(() => import("@/components/marketing/Security"), { loading: SectionLoader });
const Pricing = dynamic(() => import("@/components/marketing/Pricing"), { loading: SectionLoader });
const CTABanner = dynamic(() => import("@/components/marketing/CTABanner"), { loading: SectionLoader });

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <ProcessFlow />
      <WorkflowSteps />
      <Features />
      <InvestmentPreview />
      <Testimonials />
      <Security />
      <Pricing />
      <CTABanner />
    </>
  );
}
