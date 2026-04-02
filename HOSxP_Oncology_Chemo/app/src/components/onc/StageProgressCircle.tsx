/* ══════════════════════════════════════════════
   StageProgressCircle — Dynamic ring for pipeline stages
   ──────────────────────────────────────────────
   Visualizes 3 data points in a single ring:
   1. Throughput (fill %) = completed / totalToday
   2. SLA urgency (color) = green / orange / red
   3. Held ratio (red segment) = heldCount / count
   + Role-based glow for user's primary workspace
   ══════════════════════════════════════════════ */

export interface StageCircleProps {
  /** URL of the avatar image inside the ring */
  avatar: string;
  /** Number of patients completed in this stage */
  completed: number;
  /** Total patients scheduled today */
  totalToday: number;
  /** Number of patients currently held (safety gate) */
  heldCount: number;
  /** Total patients in this stage */
  count: number;
  /** Oldest case waiting time in minutes */
  oldestWaitMinutes: number;
  /** Whether this is the user's primary workspace */
  isRoleStage: boolean;
  /** Whether this stage is currently selected */
  isActive: boolean;
}

/** Determine ring color based on SLA thresholds */
function getSLAColor(minutes: number): string {
  if (minutes > 60) return "#ef4444";   // red — bottleneck
  if (minutes > 45) return "#f59e0b";   // orange — warning
  return "#3eaf3f";                      // green — healthy
}

export default function StageProgressCircle({
  avatar, completed, totalToday, heldCount, count,
  oldestWaitMinutes, isRoleStage, isActive,
}: StageCircleProps) {
  /* ── Dimensions ── */
  const size = isRoleStage ? 116 : 100;
  const strokeWidth = isRoleStage ? 7 : 6;
  const r = (size / 2) - (strokeWidth / 2) - (isRoleStage ? 4 : 2);
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  /* ── Throughput ratio ── */
  const throughput = totalToday > 0 ? Math.min(completed / totalToday, 1) : 0;

  /* ── Held ratio (segment of the filled arc) ── */
  const heldRatio = count > 0 ? Math.min(heldCount / count, 1) : 0;
  const healthyArc = throughput * (1 - heldRatio);
  const heldArc = throughput * heldRatio;

  /* ── SLA color ── */
  const slaColor = getSLAColor(oldestWaitMinutes);
  const isBottleneck = oldestWaitMinutes > 60;

  /* ── Dash offsets ── */
  const healthyDash = circ * healthyArc;
  const healthyGap = circ * (1 - healthyArc);
  const heldDash = circ * heldArc;
  const heldGap = circ * (1 - heldArc);
  const heldRotation = -90 + (healthyArc * 360);

  /* ── Inner photo circle ── */
  const innerSize = isRoleStage ? 88 : 76;
  const innerOffset = (size - innerSize) / 2;

  /* ── Glow filter for role stage ── */
  const filterId = `glow-${isRoleStage ? "role" : "none"}`;

  return (
    <div
      className="relative shrink-0 transition-transform"
      style={{
        width: size, height: size,
        transform: isActive ? "scale(1.08)" : isRoleStage ? "scale(1.03)" : "scale(1)",
        filter: isRoleStage ? "drop-shadow(0 0 8px rgba(0,178,183,0.5))" : undefined,
      }}
      role="img"
      aria-label={`${completed}/${totalToday} เสร็จ, ${heldCount} ระงับ`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />

        {/* Healthy progress arc (green/orange/red based on SLA) */}
        {healthyArc > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={isActive ? "#fff" : slaColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${healthyDash} ${healthyGap}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            filter={isRoleStage ? `url(#${filterId})` : undefined}
            className="transition-all duration-500"
          />
        )}

        {/* Held segment (always red) */}
        {heldArc > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            strokeDasharray={`${heldDash} ${heldGap}`}
            strokeLinecap="round"
            transform={`rotate(${heldRotation} ${cx} ${cy})`}
            className="transition-all duration-500"
          />
        )}

        {/* Outer glow ring for role stage */}
        {isRoleStage && (
          <circle
            cx={cx} cy={cy} r={r + strokeWidth / 2 + 2}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* SLA indicator dot at 12 o'clock */}
        {isBottleneck && (
          <circle
            cx={cx} cy={cy - r}
            r="4" fill="#ef4444"
            stroke="#fff" strokeWidth="1.5"
          />
        )}
      </svg>

      {/* Inner photo circle with gradient */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          top: innerOffset, left: innerOffset,
          width: innerSize, height: innerSize,
          background: "linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.1) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <img
          src={avatar}
          className="w-full h-full object-cover object-top"
          alt=""
          loading="lazy"
        />
      </div>
    </div>
  );
}
