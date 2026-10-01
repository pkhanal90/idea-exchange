// Normalizes a series of values into an SVG line + filled-area path within
// a width x height viewBox. A flat/empty series (common early on, when
// there's little real history yet) renders as a flat line at mid-height
// rather than dividing by zero.
export function buildSparklinePath(points: number[], width: number, height: number) {
  if (points.length === 0) {
    return { linePath: `M0,${height / 2} L${width},${height / 2}`, areaPath: "" };
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return { linePath, areaPath };
}
