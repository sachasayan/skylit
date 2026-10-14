const paths: Record<string, string> = {
  previous: "M15 18l-6-6 6-6",
  next: "M9 18l6-6-6-6",
  play: "M8 5l11 7-11 7z",
  pause: "M8 5v14M16 5v14",
  zoom: "M21 21l-5-5M10 7v6M7 10h6",
  fit: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
  close: "M6 6l12 12M18 6L6 18",
};
export function PlaybackIcon({
  name,
  label,
}: {
  name: string;
  label?: string;
}) {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {name === "zoom" && <circle cx="10" cy="10" r="7" />}
        <path d={paths[name]} />
      </svg>
      {label && <span>{label}</span>}
    </>
  );
}
