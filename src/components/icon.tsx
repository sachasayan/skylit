import type { SVGProps } from "react";
const paths: Record<string, string> = {
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  auto: "M12 3a9 9 0 100 18 9 9 0 000-18ZM12 3v18M12 7h5m-5 5h8m-8 5h5",
  text: "M5 19 12 5l7 14M8 14h8",
  "text-large": "M2 21 10 3l8 18M5 14h10M20 4v6m-3-3h6",
  refresh: "M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0114 6M4 12a8 8 0 0014 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  drop: "M12 2S5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2Z",
  wind: "M3 8h12a3 3 0 10-3-3M2 12h17a3 3 0 11-3 3M4 16h5a3 3 0 11-3 3",
  sunset: "M2 18h20M4 21h16M6 15a6 6 0 0112 0M12 2v4M3 7l3 3m15-3-3 3",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  cloud: "M6 18a4 4 0 010-8 6 6 0 0111-2 5 5 0 010 10Z",
  rain: "M5 15a4 4 0 010-8 6 6 0 0111-2 5 5 0 012 10M8 18l-1 3m6-3-1 3m6-3-1 3",
  snow: "M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 3 3-3M9 20l3-3 3 3",
  moon: "M20 15A9 9 0 019 3a9 9 0 1011 12Z",
  home: "m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7",
  settings: "M4 6h16M4 12h16M4 18h16",
  play: "m8 4 12 8-12 8Z",
};
export function Icon({
  name,
  ...props
}: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {name === "sun" && <circle cx="12" cy="12" r="4" />}
      <path d={paths[name] || paths.cloud} />
    </svg>
  );
}
