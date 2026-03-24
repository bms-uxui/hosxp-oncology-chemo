import { Construction } from "lucide-react";

export default function Placeholder({ title = "Coming Soon" }: { title?: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-onc-bg flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-onc" />
        </div>
        <h2 className="text-lg font-bold text-text">{title}</h2>
        <p className="text-sm text-text-muted mt-1">อยู่ระหว่างพัฒนา</p>
      </div>
    </div>
  );
}
