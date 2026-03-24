/* ══════════════════════════════════════════════
   Skeleton Loading Screens
   Ref: Spec §5 "Use Skeleton Screens for worklists"
   ══════════════════════════════════════════════ */

export function SkeletonLine({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`onc-skeleton ${w} ${h}`} />;
}

export function SkeletonCard() {
  return (
    <div className="onc-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="onc-skeleton w-10 h-10 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <SkeletonLine w="w-3/4" />
          <SkeletonLine w="w-1/2" h="h-3" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine w="w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="onc-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <SkeletonLine w="w-48" h="h-5" />
      </div>
      <div className="divide-y divide-border-light">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3">
            <SkeletonLine w="w-8" h="h-3" />
            <SkeletonLine w="w-32" />
            <SkeletonLine w="w-20" />
            <SkeletonLine w="w-16" />
            <div className="flex-1" />
            <SkeletonLine w="w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-5">
      <SkeletonLine w="w-64" h="h-7" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="onc-card p-5 flex items-center gap-4">
            <div className="onc-skeleton w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <SkeletonLine w="w-12" h="h-6" />
              <SkeletonLine w="w-20" h="h-3" />
            </div>
          </div>
        ))}
      </div>
      <SkeletonCard />
      <SkeletonTable />
    </div>
  );
}
