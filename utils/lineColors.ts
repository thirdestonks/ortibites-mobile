export type LineColor = {
  bg: string;
  bg2: string;
  border: string;
  ink: string;
  inkMuted: string;
  label: string;
};

// "Carbon copy" duplicate-stock tones, cycled per station — same idea as an
// old triplicate invoice pad (gold/magenta/jade/powder) instead of a single
// paper color for every station. Each has a second, close shade of the same
// hue (bg2) so the card gradient-drifts gently instead of sitting flat —
// kept close to bg on purpose so the wash stays subtle, not high-contrast.
const LINE_COLORS: LineColor[] = [
  { bg: "#c9962f", bg2: "#b28234", border: "#1e160d", ink: "#1e160d", inkMuted: "#4a3a1c", label: "Gold Copy" },
  { bg: "#b23a6b", bg2: "#9c3560", border: "#1e160d", ink: "#f4e6ec", inkMuted: "#f0d3e0", label: "Magenta Copy" },
  { bg: "#3f7a5c", bg2: "#396c52", border: "#0f2019", ink: "#eafff2", inkMuted: "#cdeede", label: "Jade Copy" },
  { bg: "#3f6fa8", bg2: "#396197", border: "#0f1c2c", ink: "#eaf3ff", inkMuted: "#cfe1f7", label: "Powder Copy" },
];

export const UNSORTED_LINE_COLOR: LineColor = {
  bg: "#8a8066",
  bg2: "#7d745c",
  border: "#1e160d",
  ink: "#1e160d",
  inkMuted: "#4a4030",
  label: "Unsorted Copy",
};

export function getLineColor(index: number): LineColor {
  return LINE_COLORS[index % LINE_COLORS.length];
}
