import { buildSparklinePath } from "@/lib/sparkline";

export function Sparkline({
  points,
  color,
  width = 80,
  height = 24,
}: {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const { linePath } = buildSparklinePath(points, width, height);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
