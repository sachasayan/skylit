type OrderActions = {
  onMove: (id: string, delta: number) => void;
  onDrop: (id: string, target: string) => void;
};
import { NativeButton } from "../components/ui/button";
import { Input, Checkbox } from "../components/ui/field";
import { useRef, useState } from "react";
import { Button } from "../components/ui/button";
type Picture = { id: string; url: string; label: string; tags: string };
export function LibraryGrid({
  pictures,
  selected,
  selecting,
  onToggle,
  onOpen,
}: {
  pictures: Picture[];
  selected: string[];
  selecting: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return pictures.length ? (
    <>
      {pictures.map((photo) => (
        <div
          className="library-photo"
          key={photo.id}
          aria-selected={selected.includes(photo.id)}
        >
          <NativeButton
            type="button"
            className="library-photo-open"
            aria-label={(selecting ? "Select " : "Open ") + photo.label}
            onClick={() => (selecting ? onToggle(photo.id) : onOpen(photo.id))}
          >
            <img src={photo.url} alt={photo.label} loading="lazy" />
          </NativeButton>
          <label>
            <Checkbox
              hidden={!selecting}
              checked={selected.includes(photo.id)}
              data-library-photo={photo.id}
              onChange={() => onToggle(photo.id)}
            />
            <span>{photo.label}</span>
          </label>
          <div className="library-tags">{photo.tags}</div>
        </div>
      ))}
    </>
  ) : (
    <p className="small subtle">No pictures match.</p>
  );
}
export function PendingPictures({
  pictures,
  selected,
  onToggle,
}: {
  pictures: Picture[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return pictures.length ? (
    pictures.map((photo: Picture) => (
      <div key={photo.id} className="library-photo">
        <img src={photo.url} alt={photo.label} loading="lazy" />
        <label>
          <Checkbox
            checked={selected.includes(photo.id)}
            onChange={() => onToggle(photo.id)}
          />
          <span>{photo.label}</span>
        </label>
      </div>
    ))
  ) : (
    <p className="small subtle">No pictures waiting for review.</p>
  );
}
export function SimilarPictures({
  pairs,
  onOpen,
}: {
  pairs: [Picture, Picture][];
  onOpen: (id: string) => void;
}) {
  return pairs.length ? (
    pairs.map((pair: Picture[]) => (
      <div
        className="library-duplicate-pair"
        key={pair.map((p) => p.id).join("/")}
      >
        {pair.map((photo) => (
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.label}
            loading="lazy"
          />
        ))}
        <Button variant="ghost" onClick={() => onOpen(pair[1].id)}>
          Review
        </Button>
      </div>
    ))
  ) : (
    <p className="small subtle">
      No similar candidates in the current library. Signatures are available for
      newly imported pictures.
    </p>
  );
}
function OrderPicture({
  photo,
  onMove,
  onDrop,
}: { photo: Picture } & OrderActions) {
  const [dragging, setDragging] = useState(false),
    pointer = useRef<number | null>(null);
  return (
    <div
      className={"library-order-item" + (dragging ? " dragging" : "")}
      data-order-photo={photo.id}
    >
      <Button
        variant="ghost"
        aria-label={"Drag " + photo.label}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerUp={(e) => {
          if (pointer.current !== e.pointerId) return;
          const target = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>("[data-order-photo]");
          pointer.current = null;
          setDragging(false);
          if (target?.dataset.orderPhoto)
            onDrop(photo.id, target.dataset.orderPhoto);
        }}
        onPointerCancel={() => {
          pointer.current = null;
          setDragging(false);
        }}
      >
        ↕
      </Button>
      <img src={photo.url} alt="" loading="lazy" />
      <span>{photo.label}</span>
      <Button
        variant="ghost"
        aria-label={"Move " + photo.label + " up"}
        onClick={() => onMove(photo.id, -1)}
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        aria-label={"Move " + photo.label + " down"}
        onClick={() => onMove(photo.id, 1)}
      >
        ↓
      </Button>
    </div>
  );
}
export function PictureOrder({
  pictures,
  onMove,
  onDrop,
}: { pictures: Picture[] } & OrderActions) {
  return pictures.map((photo: Picture) => (
    <OrderPicture
      key={photo.id}
      photo={photo}
      onMove={onMove}
      onDrop={onDrop}
    />
  ));
}
