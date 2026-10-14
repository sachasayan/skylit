import { useEffect, useRef, useState } from "react";
import { Input } from "../components/ui/field";
import { Button } from "../components/ui/button";
import { SegmentedControl } from "../components/ui/segmented-control";
import { PhoneDialog, PhoneIcon, photoUrl } from "./phone-ui";
import { pictureDetails, type Photo } from "../lib/phone-data";
export function PictureDetails({
  edit,
  setEdit,
  busy,
  onSave,
  onBack,
  onToggle,
}: {
  edit: Photo;
  setEdit: (photo: Photo) => void;
  busy: boolean;
  onSave: (photo: Photo) => void;
  onBack: () => void;
  onToggle: (action: string, value: boolean) => Promise<void>;
}) {
  const initial = useRef(JSON.stringify(pictureDetails(edit.choice))),
    [discard, setDiscard] = useState(false);
  const preview = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const box = preview.current;
    if (!box) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: box.clientWidth, height: box.clientHeight }),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  const quarter = edit.choice.rotation % 180 !== 0;
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const change = (key: string, value: string | number) =>
    setEdit({ ...edit, choice: { ...edit.choice, [key]: value } });
  function back() {
    if (initial.current !== JSON.stringify(pictureDetails(edit.choice)))
      setDiscard(true);
    else onBack();
  }
  return (
    <section id="edit">
      <form
        id="picture-details"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(edit);
        }}
      >
        <div className="phone-title edit-title">
          <Button variant="ghost" disabled={busy} onClick={back}>
            <PhoneIcon name="back" />
            Photos
          </Button>
          <Button type="submit" disabled={busy}>
            Save picture details
          </Button>
        </div>
        <h1>{edit.choice.title || edit.title}</h1>
        <div
          ref={preview}
          tabIndex={0}
          role="group"
          onKeyDown={(e) => {
            const moves: Record<string, number[]> = {
              ArrowLeft: [-2, 0],
              ArrowRight: [2, 0],
              ArrowUp: [0, -2],
              ArrowDown: [0, 2],
            };
            const d = moves[e.key];
            if (!d || busy || edit.choice.fit !== "cover") return;
            e.preventDefault();
            setEdit({
              ...edit,
              choice: {
                ...edit.choice,
                x: Math.max(0, Math.min(100, edit.choice.x + d[0])),
                y: Math.max(0, Math.min(100, edit.choice.y + d[1])),
              },
            });
          }}
          className={
            "picture-preview " +
            (edit.choice.fit === "cover" ? "is-cropping" : "")
          }
          aria-label="Picture framing preview"
          onPointerDown={(e) => {
            if (edit.choice.fit !== "cover" || busy) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              px: edit.choice.x,
              py: edit.choice.y,
            };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const r = e.currentTarget.getBoundingClientRect(),
              d = drag.current;
            setEdit({
              ...edit,
              choice: {
                ...edit.choice,
                x: Math.max(
                  0,
                  Math.min(100, d.px - ((e.clientX - d.x) / r.width) * 100),
                ),
                y: Math.max(
                  0,
                  Math.min(100, d.py - ((e.clientY - d.y) / r.height) * 100),
                ),
              },
            });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <img
            src={photoUrl(edit.id)}
            alt={edit.choice.description || edit.title}
            draggable={false}
            style={{
              width: quarter ? size.height : size.width,
              height: quarter ? size.width : size.height,
              objectFit: edit.choice.fit === "cover" ? "cover" : "contain",
              objectPosition: `${edit.choice.x}% ${edit.choice.y}%`,
              transform: `translate(-50%,-50%) rotate(${edit.choice.rotation}deg)`,
            }}
          />
          {edit.choice.fit === "cover" && <div className="crop-guides" />}
        </div>
        <p className="subtle">
          {edit.choice.fit === "cover"
            ? "Drag the picture to adjust the crop."
            : "The whole picture is visible. The frame’s layout may have different proportions."}
        </p>
        <div className="framing-tools">
          <SegmentedControl
            label="Picture framing"
            value={edit.choice.fit}
            disabled={busy}
            onValueChange={(v) => change("fit", v)}
            choices={[
              { value: "contain", label: "Fit" },
              { value: "cover", label: "Fill" },
              { value: "auto", label: "Slideshow" },
            ]}
          />
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              change("rotation", (edit.choice.rotation + 90) % 360)
            }
          >
            <PhoneIcon name="rotate" />
            Rotate
          </Button>
        </div>
        <label htmlFor="edit-title">Title</label>
        <Input
          id="edit-title"
          maxLength={100}
          disabled={busy}
          value={edit.choice.title}
          onChange={(e) => change("title", e.target.value)}
        />
        <details>
          <summary>Picture information</summary>
          <label htmlFor="edit-description">Accessibility description</label>
          <Input
            id="edit-description"
            maxLength={180}
            value={edit.choice.description}
            disabled={busy}
            onChange={(e) => change("description", e.target.value)}
          />
          <label htmlFor="edit-taken">Capture date · optional</label>
          <Input
            id="edit-taken"
            type="date"
            value={edit.choice.taken}
            disabled={busy}
            onChange={(e) => change("taken", e.target.value)}
          />
        </details>
        {edit.choice.fit === "cover" && (
          <details>
            <summary>Fine-tune crop</summary>
            {(["x", "y"] as const).map((k) => (
              <label key={k} htmlFor={"edit-" + k}>
                {k === "x" ? "Horizontal" : "Vertical"} position
                <Input
                  id={"edit-" + k}
                  type="range"
                  min={0}
                  max={100}
                  value={edit.choice[k]}
                  disabled={busy}
                  onChange={(e) => change(k, Number(e.target.value))}
                />
              </label>
            ))}
          </details>
        )}
      </form>
      <div className="phone-setting">
        <span>
          <b>Favourite</b>
          <small>Include in your favourites collection</small>
        </span>
        <Button
          variant="secondary"
          role="switch"
          aria-checked={!!edit.choice.favourite}
          aria-label="Favourite"
          disabled={busy}
          onClick={() => void onToggle("favourite", !edit.choice.favourite)}
        >
          {edit.choice.favourite ? "On" : "Off"}
        </Button>
      </div>
      <div className="phone-setting">
        <span>
          <b>Keep beyond normal expiry</b>
          <small>Uses your frame’s Keepers storage</small>
        </span>
        <Button
          variant="secondary"
          role="switch"
          aria-checked={edit.keeper}
          aria-label="Keep beyond normal expiry"
          disabled={busy}
          onClick={() => void onToggle("keeper", !edit.keeper)}
        >
          {edit.keeper ? "On" : "Off"}
        </Button>
      </div>
      {discard && (
        <PhoneDialog
          title="Discard picture edits?"
          onClose={() => setDiscard(false)}
        >
          <p>Your unsaved title and framing changes will be lost.</p>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setDiscard(false)}>
              Keep editing
            </Button>
            <Button onClick={onBack}>Discard edits</Button>
          </div>
        </PhoneDialog>
      )}
    </section>
  );
}
