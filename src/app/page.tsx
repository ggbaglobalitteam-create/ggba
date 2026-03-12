import Hero from "@/components/sections/Hero";
import GlobalNetwork from "@/components/sections/GlobalNetwork";
import ActionCards from "@/components/sections/ActionCards";
import FeaturedPartners from "@/components/sections/FeaturedPartners";
import WhyChooseUs from "@/components/sections/WhyChooseUs";

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-white">
      <Hero />
      <GlobalNetwork />
      <ActionCards />
      <WhyChooseUs />
      {/* <FeaturedPartners /> */}
    </div>
  );
}
