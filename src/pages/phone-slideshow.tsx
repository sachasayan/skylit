import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input, Select } from "../components/ui/field";
import { SegmentedControl } from "../components/ui/segmented-control";
import type { PhoneState, SlideshowOptions, Photo } from "../lib/phone-data";
import { photoUrl } from "./phone-ui";
const collections = [
  ["recent", "Recent photos"],
  ["keepers", "Keepers"],
  ["all", "All pictures"],
  ["favourites", "Favourites"],
  ["memories", "On this day"],
];
const styles = [
  ["fade", "Soft fade", "One picture gently dissolves into the next."],
  ["stack", "Falling prints", "Overlapping prints settle onto the screen."],
  ["collage", "Photo collage", "Several pictures share the screen."],
  ["gentle", "Gentle pan & zoom", "Slow movement across each picture."],
  ["still", "Still gallery", "Pictures change without an animated transition."],
];
export function SlideshowSettings({
  options,
  setOptions,
  albums,
  photos,
  busy,
  onSave,
}: {
  options: SlideshowOptions;
  setOptions: (next: SlideshowOptions) => void;
  albums: PhoneState["albums"];
  photos: Photo[];
  busy: boolean;
  onSave: () => void;
}) {
  const [custom, setCustom] = useState(false);
  return (
    <section>
      <form
        id="settings"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="phone-title slideshow-title">
          <h1>Slideshow</h1>
          <Button type="submit" disabled={busy}>
            Save slideshow
          </Button>
        </div>
        <p className="subtle">
          How stored pictures appear on your frame. Shared Google albums use
          Google’s player.
        </p>
        <h2>Style</h2>
        <div
          className="slideshow-styles"
          role="group"
          aria-label="Slideshow style"
        >
          {styles.map(([id, label, help]) => (
            <Button
              key={id}
              variant="unstyled"
              className={"style-choice style-" + id}
              aria-pressed={options.style === id}
              onClick={() => setOptions({ ...options, style: id })}
            >
              <span className="style-art">
                {(photos.length
                  ? [photos[0], photos[1] || photos[0], photos[2] || photos[0]]
                  : [null, null, null]
                ).map((p, i) =>
                  p ? (
                    <img key={i} src={photoUrl(p.id)} alt="" />
                  ) : (
                    <span key={i} className="sample-art" />
                  ),
                )}
              </span>
              <b>{label}</b>
              <small>{help}</small>
            </Button>
          ))}
        </div>
        <h2>Time per picture</h2>
        <SegmentedControl
          label="Time per picture"
          value={
            custom || ![10, 30, 60].includes(options.duration)
              ? "custom"
              : String(options.duration)
          }
          onValueChange={(v) => {
            setCustom(v === "custom");
            if (v !== "custom") setOptions({ ...options, duration: Number(v) });
          }}
          choices={[
            { value: "10", label: "10s" },
            { value: "30", label: "30s" },
            { value: "60", label: "1 min" },
            { value: "custom", label: "Custom" },
          ]}
        />
        {(custom || ![10, 30, 60].includes(options.duration)) && (
          <label htmlFor="duration">
            Seconds per picture
            <Input
              id="duration"
              type="number"
              required
              min={5}
              max={3600}
              value={options.duration}
              onChange={(e) =>
                setOptions({ ...options, duration: Number(e.target.value) })
              }
            />
          </label>
        )}
        <label htmlFor="collection">Play from</label>
        <Select
          id="collection"
          value={options.collection}
          onChange={(e) =>
            setOptions({ ...options, collection: e.target.value })
          }
        >
          {[...collections, ...albums.map((a) => [a.id, a.name])].map(
            ([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ),
          )}
        </Select>
        <h2>Order</h2>
        <SegmentedControl
          label="Slideshow order"
          value={options.order}
          choices={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "shuffle", label: "Shuffle" },
            ...(options.order === "manual"
              ? [{ value: "manual", label: "Frame order" }]
              : []),
          ]}
          onValueChange={(v) => setOptions({ ...options, order: v })}
        />
        {options.order === "manual" && (
          <p className="subtle">
            Your existing frame order is preserved. Arrange pictures on the
            frame.
          </p>
        )}
        <p className="subtle">
          Changes apply when you save. Your choices stay here while you browse
          other tabs.
        </p>
      </form>
    </section>
  );
}
