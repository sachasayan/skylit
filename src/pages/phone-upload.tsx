import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/field";
type Item = { file: File; state: string; video: boolean };
/** Conversion and the bounded queue remain on the phone; only JPEG bytes cross the API. */
async function jpeg(file: File): Promise<File> {
  if (file.size > 12 * 1024 * 1024) throw Error("Picture exceeds 12 MiB.");
  if (file.type === "image/jpeg") return file;
  if (!["image/png", "image/webp"].includes(file.type))
    throw Error("Choose JPEG, PNG or WebP. Export HEIC as JPEG first.");
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2400 / Math.max(image.width, image.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw Error("This browser could not prepare the picture.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(Error("Could not prepare picture.")),
        "image/jpeg",
        0.9,
      ),
    );
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } finally {
    image.close();
  }
}
export function PhoneUpload({
  upload,
  busy,
}: {
  upload: (
    file: File | undefined,
    video: boolean,
  ) => Promise<boolean | undefined | void>;
  busy: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]),
    [running, setRunning] = useState(false),
    [message, setMessage] = useState("");
  const active = useRef(true),
    working = useRef(false);
  useEffect(
    () => () => {
      active.current = false;
    },
    [],
  );
  async function run(queue: Item[]) {
    if (working.current || busy) return;
    working.current = true;
    setRunning(true);
    setItems(queue);
    for (let i = 0; i < queue.length && active.current; i++) {
      if (queue[i].state === "Saved") continue;
      const update = (state: string) => {
        queue = queue.map((item, j) => (j === i ? { ...item, state } : item));
        if (active.current) setItems(queue);
      };
      update("Preparing…");
      try {
        const file = queue[i].video ? queue[i].file : await jpeg(queue[i].file);
        if (!active.current) break;
        update("Sending…");
        const ok = await upload(file, queue[i].video);
        if (!active.current) break;
        update(
          ok ? "Saved" : "Not saved · check connection, format or storage",
        );
      } catch (e) {
        update((e as Error).message);
      }
    }
    working.current = false;
    if (active.current) setRunning(false);
  }
  function choose(files: FileList | null, video: boolean) {
    if (!files?.length) return;
    if (files.length > 20) {
      setMessage("Choose up to 20 pictures at a time.");
      return;
    }
    setMessage("");
    void run([...files].map((file) => ({ file, video, state: "Waiting" })));
  }
  return (
    <>
      <p>
        Choose pictures from your phone. They’re kept on the frame beyond normal
        expiry, within its storage limit.
      </p>
      <div className="upload-choice">
        <b>Pictures from your phone</b>
        <small>
          JPEG, PNG or WebP · up to 20 at once · 12 MiB each. Export HEIC as
          JPEG first.
        </small>
        <Input
          hidden
          aria-label="Picture files"
          id="upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || running}
          onChange={(e) => {
            choose(e.target.files, false);
            e.target.value = "";
          }}
        />
        <Button
          disabled={busy || running}
          onClick={() => document.getElementById("upload")?.click()}
        >
          Choose pictures
        </Button>
      </div>
      <details>
        <summary>Add a short video instead</summary>
        <div className="upload-choice">
          <b>Muted video</b>
          <small>H.264 MP4 · up to 30 seconds, 32 MiB</small>
          <Input
            hidden
            aria-label="Video file"
            id="upload-video"
            type="file"
            accept="video/mp4"
            disabled={busy || running}
            onChange={(e) => {
              choose(e.target.files, true);
              e.target.value = "";
            }}
          />
          <Button
            disabled={busy || running}
            onClick={() => document.getElementById("upload-video")?.click()}
          >
            Choose video
          </Button>
        </div>
      </details>
      {message && <p role="alert">{message}</p>}
      {items.length > 0 && (
        <div aria-live="polite">
          <p>
            {items.filter((i) => i.state === "Saved").length} of {items.length}{" "}
            saved{running ? " · sending…" : ""}
          </p>
          <ul className="upload-results">
            {items.map((item, i) => (
              <li key={i}>
                <span>{item.file.name}</span>
                <small>{item.state}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!running && items.some((i) => i.state !== "Saved") && (
        <Button disabled={busy} onClick={() => void run(items)}>
          Retry unsaved files
        </Button>
      )}
    </>
  );
}
