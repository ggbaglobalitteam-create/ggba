import Hero from "@/components/sections/Hero";
import GlobalNetwork from "@/components/sections/GlobalNetwork";
import ActionCards from "@/components/sections/ActionCards";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import InstitutionsBanner from "@/components/sections/Institutionsbanner";

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-white">
      <Hero />
      <div className="-mt-6">
        <GlobalNetwork />
      </div>
      <div className="-mt-4">
        <ActionCards />
      </div>
      <div className="-mt-4">
        <WhyChooseUs />
      </div>
      <div className="mb-8 mt-4">
        <InstitutionsBanner />
      </div>
    </div>
  );
}
