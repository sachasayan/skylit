import { NativeButton } from "../components/ui/button";
import { Button } from "../components/ui/button";
type Picture = { id: string; url: string; favourite: boolean; hidden: boolean };
export function PhotoTiles({
  pictures,
  empty,
  onOpen,
  onExclude,
}: {
  pictures: Picture[];
  empty: string;
  onOpen: (id: string) => void;
  onExclude: (id: string, index: number) => void;
}) {
  return (
    <>
      {empty && <p className="photo-empty">{empty}</p>}
      {pictures.map((photo, i) => (
        <div className="photo-tile-card" key={photo.id}>
          <NativeButton
            type="button"
            className={"photo-tile" + (photo.hidden ? " is-hidden" : "")}
            data-photo-id={photo.id}
            aria-label={
              "Open picture " +
              (i + 1) +
              (photo.favourite ? " · Favourite" : "") +
              (photo.hidden ? " · Excluded" : "")
            }
            onClick={() => onOpen(photo.id)}
          >
            {photo.favourite && (
              <span className="photo-favourite-badge">★</span>
            )}
            <img src={photo.url} alt="" loading="lazy" />
          </NativeButton>
          <NativeButton
            type="button"
            className="photo-exclude"
            data-photo-id={photo.id}
            aria-label={
              (photo.hidden ? "Restore" : "Exclude") +
              " picture " +
              (i + 1) +
              (photo.hidden ? "" : " from gallery")
            }
            onClick={() => onExclude(photo.id, i)}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path
                d={
                  photo.hidden
                    ? "M3 10h6M3 10V4M3 10a9 9 0 1 1 1 9"
                    : "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"
                }
              />
            </svg>
          </NativeButton>
        </div>
      ))}
    </>
  );
}
export function PhotoStack({
  pictures,
}: {
  pictures: { id: string; url: string; angle: number }[];
}) {
  return (
    <>
      {pictures.map((photo) => (
        <img
          key={photo.id}
          src={photo.url}
          alt=""
          style={
            { "--photo-angle": photo.angle + "deg" } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}
