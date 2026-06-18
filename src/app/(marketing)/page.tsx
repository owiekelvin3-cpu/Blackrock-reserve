import dynamic from "next/dynamic";
import Hero from "@/components/marketing/Hero";

const StatsSection = dynamic(() => import("@/components/marketing/StatsSection"));
const TrustBar = dynamic(() => import("@/components/marketing/TrustBar"));
const WorkflowSteps = dynamic(() => import("@/components/marketing/WorkflowSteps"));
const Features = dynamic(() => import("@/components/marketing/Features"));
const Security = dynamic(() => import("@/components/marketing/Security"));
const SolutionsGrid = dynamic(() => import("@/components/marketing/SolutionsGrid"));
const WhyTrustUs = dynamic(() => import("@/components/marketing/WhyTrustUs"));
const InvestmentPreview = dynamic(() => import("@/components/marketing/InvestmentPreview"));
const Testimonials = dynamic(() => import("@/components/marketing/Testimonials"));
const FAQ = dynamic(() => import("@/components/marketing/FAQ"));
const BlogResources = dynamic(() => import("@/components/marketing/BlogResources"));
const CTABanner = dynamic(() => import("@/components/marketing/CTABanner"));

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <TrustBar />
      <WorkflowSteps />
      <Features />
      <Security />
      <SolutionsGrid />
      <WhyTrustUs />
      <InvestmentPreview />
      <Testimonials />
      <div id="faq" className="scroll-mt-28">
        <FAQ />
      </div>
      <BlogResources />
      <CTABanner />
    </>
  );
}
