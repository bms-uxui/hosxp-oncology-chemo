/* ══════════════════════════════════════════════
   PatientAvatar — Deterministic avatar from DiceBear
   Each HN gets a unique consistent avatar
   ══════════════════════════════════════════════ */

export default function PatientAvatar({ hn, size = 40, className = "" }: { hn: string; size?: number; className?: string }) {
  return (
    <img
      src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${hn}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
      alt=""
      className={`rounded-full shrink-0 bg-gray-100 object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
