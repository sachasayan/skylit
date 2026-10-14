export type Choice = {
  title: string;
  description: string;
  fit: string;
  rotation: number;
  x: number;
  y: number;
  taken: string;
  hidden?: boolean;
  favourite?: boolean;
};
export type Photo = {
  id: string;
  title: string;
  keeper: boolean;
  pending: boolean;
  choice: Choice;
};
export type SlideshowOptions = {
  duration: number;
  style: string;
  collection: string;
  order: string;
};
export type PhoneState = {
  sessionRemainingMs?: number;
  photos: Photo[];
  albums: { id: string; name: string; photos?: string[] }[];
  options: SlideshowOptions;
};
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export function parsePhoneState(raw: unknown): PhoneState {
  if (
    !record(raw) ||
    !Array.isArray(raw.photos) ||
    !Array.isArray(raw.albums) ||
    !record(raw.options)
  )
    throw Error("Invalid frame response.");
  const options = raw.options;
  if (
    !finite(options.duration) ||
    !["style", "collection", "order"].every(
      (k) => typeof options[k] === "string",
    )
  )
    throw Error("Invalid slideshow settings.");
  for (const photo of raw.photos) {
    if (
      !record(photo) ||
      typeof photo.id !== "string" ||
      typeof photo.title !== "string" ||
      !record(photo.choice)
    )
      throw Error("Invalid picture response.");
    const choice = photo.choice;
    if (
      !["title", "description", "fit", "taken"].every(
        (k) => typeof choice[k] === "string",
      ) ||
      !["rotation", "x", "y"].every((k) => finite(choice[k]))
    )
      throw Error("Invalid picture details.");
  }
  if (
    !raw.albums.every(
      (a) =>
        record(a) &&
        typeof a.id === "string" &&
        typeof a.name === "string" &&
        (a.photos === undefined ||
          (Array.isArray(a.photos) &&
            a.photos.every((id) => typeof id === "string"))),
    )
  )
    throw Error("Invalid collection response.");
  if (raw.sessionRemainingMs !== undefined && !finite(raw.sessionRemainingMs))
    throw Error("Invalid session expiry.");
  return raw as PhoneState;
}

/** Only editable picture fields cross the native mutation boundary. */
export function pictureDetails(choice: Choice) {
  const { title, description, fit, rotation, x, y, taken } = choice;
  return { title, description, fit, rotation, x, y, taken, customCrop: true };
}
