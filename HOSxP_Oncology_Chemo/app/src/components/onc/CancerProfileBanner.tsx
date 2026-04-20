import bannerIllustration from "/onc/cancer-banner-v2.png?url";
import { Tooltip as HeroTooltip } from "@heroui/react";
import { Info } from "lucide-react";

const ecogDefinitions = [
  "ทำกิจกรรมได้ตามปกติโดยไม่มีข้อจำกัด สามารถดำเนินชีวิตได้เหมือนก่อนเจ็บป่วย",
  "จำกัดกิจกรรมที่ต้องออกแรงมาก แต่ยังเดินไปมาได้ ทำงานเบาหรืองานนั่งโต๊ะได้",
  "เดินไปมาได้และดูแลตัวเองได้ทั้งหมด แต่ไม่สามารถทำงานใดๆ ได้ ลุกนั่งมากกว่า 50% ของเวลาตื่น",
  "ดูแลตัวเองได้จำกัด ต้องนอนพักบนเตียงหรือเก้าอี้มากกว่า 50% ของเวลาตื่น",
  "ช่วยเหลือตัวเองไม่ได้เลย ต้องนอนพักบนเตียงหรือเก้าอี้ตลอดเวลา",
];

export default function CancerProfileBanner({ pt }: { pt: { diagnosis: string; icd10: string; stage: string; t: string; n: string; m: string; ecog: number; morphology: string } }) {
  return (
    <div className="relative rounded-2xl px-6 py-5 overflow-hidden" style={{ background: "linear-gradient(135deg, #E8E3F8 0%, #D8D0F0 40%, #C8BFE8 100%)", boxShadow: "0 4px 20px rgba(103,75,179,0.1)" }}>
      <div className="relative z-10 max-w-[65%]">
        <p className="text-sm text-[#674BB3]/70 font-medium">{pt.diagnosis} · {pt.icd10}</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-4xl font-black text-[#404040]">Stage {pt.stage}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-bold text-[#674BB3] bg-white/70 px-3 py-1 rounded-full">
            T{pt.t}N{pt.n}M{pt.m}
          </span>
          <HeroTooltip placement="bottom" className="bg-white shadow-lg rounded-lg border border-gray-100 max-w-xs"
            content={
              <div className="px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <Info size={12} className="text-[#674BB3]" />
                  <p className="font-bold text-[#404040]">ECOG {pt.ecog}</p>
                </div>
                <p className="text-[#898989] leading-relaxed">{ecogDefinitions[pt.ecog]}</p>
              </div>
            }>
            <span className="text-xs font-bold text-[#674BB3] bg-white/70 px-3 py-1 rounded-full cursor-help inline-flex items-center gap-1">
              ECOG {pt.ecog} <Info size={11} className="text-[#674BB3]" />
            </span>
          </HeroTooltip>
          <span className="text-xs text-[#404040]/60">{pt.morphology}</span>
        </div>
      </div>
      <img src={bannerIllustration} alt="" className="absolute right-4 -top-2 h-[150%] object-contain pointer-events-none opacity-80" />
    </div>
  );
}
