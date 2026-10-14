import { PhoneUpload } from "./phone-upload";
import { useEffect, useRef, useState } from "react";
import { Status } from "../components/ui/status";
import { Button } from "../components/ui/button";
import { Input, Select } from "../components/ui/field";
import { SegmentedControl } from "../components/ui/segmented-control";
import { PictureDetails } from "./phone-picture-details";
import { SlideshowSettings } from "./phone-slideshow";
import {
  pictureDetails,
  type PhoneState,
  type Photo,
  type SlideshowOptions,
} from "../lib/phone-data";

import { PhoneDialog, PhoneIcon, photoUrl } from "./phone-ui";
export function PhoneWorkspace({
  data,
  busy,
  mutate,
  upload,
  options,
  setOptions,
  onSaveSlideshow,
  deadline,
  status,
}: {
  data: PhoneState;
  busy: boolean;
  status: string;
  mutate: (
    body: unknown,
    message: string,
    savedRevision?: number,
  ) => Promise<boolean | undefined>;
  upload: (
    file: File | undefined,
    video: boolean,
  ) => Promise<boolean | undefined | void>;
  options: SlideshowOptions;
  setOptions: (next: SlideshowOptions) => void;
  onSaveSlideshow: () => Promise<boolean | undefined>;
  deadline: number;
}) {
  const [page, setPage] = useState("photos"),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(false);
  const [selecting, setSelecting] = useState(false),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [edit, setEdit] = useState<Photo | null>(null);
  const [collection, setCollection] = useState(""),
    [sheet, setSheet] = useState(""),
    [name, setName] = useState(""),
    [album, setAlbum] = useState("");
  const [confirm, setConfirm] = useState<{
      action: string;
      value: boolean;
      ids: string[];
      title: string;
    } | null>(null),
    [now, setNow] = useState(Date.now());
  const lastPhoto = useRef("");
  const changePage = (next: string) => {
    setPage(next);
    setEdit(null);
    setSelected(new Set());
    setSelecting(false);
    setCollection("");
    setQuery("");
    setFilter("all");
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const ids = new Set(data.photos.map((p) => p.id));
    setSelected((old) => new Set([...old].filter((id) => ids.has(id))));
    if (edit && !ids.has(edit.id)) setEdit(null);
    if (
      collection &&
      !["keepers", "favourites"].includes(collection) &&
      !data.albums.some((a) => a.id === collection)
    )
      setCollection("");
  }, [data]);
  const resetSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const pending = data.photos.filter((p) => p.pending && !p.choice.hidden);
  const collectionPhotos = (id: string) =>
    data.photos.filter((p) =>
      id === "keepers"
        ? p.keeper
        : id === "favourites"
          ? p.choice.favourite
          : data.albums.find((a) => a.id === id)?.photos?.includes(p.id),
    );
  const source = collection ? collectionPhotos(collection) : data.photos;
  const visible = source.filter(
    (p) =>
      (filter === "excluded"
        ? p.choice.hidden
        : !p.choice.hidden && !p.pending) &&
      (!query || p.title.toLowerCase().includes(query.toLowerCase())),
  );
  const title =
    collection === "keepers"
      ? "Keepers"
      : collection === "favourites"
        ? "Favourites"
        : data.albums.find((a) => a.id === collection)?.name || "Photos";
  function openPhoto(photo: Photo) {
    lastPhoto.current = photo.id;
    setEdit({ ...photo, choice: { ...photo.choice } });
    window.scrollTo(0, 0);
  }
  function closeEdit() {
    setEdit(null);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(
          '[data-photo="' + lastPhoto.current + '"]',
        )
        ?.focus(),
    );
  }
  async function apply(action: string, value: boolean, ids = [...selected]) {
    if (!ids.length || busy) return;
    if (await mutate({ action, value, ids }, "Saved on the frame.")) {
      setConfirm(null);
      setSheet("");
      resetSelection();
    }
  }
  function hide(ids = [...selected]) {
    setConfirm({
      action: "exclude",
      value: true,
      ids,
      title: `Hide ${ids.length === 1 ? "this picture" : ids.length + " pictures"}?`,
    });
  }
  async function saveAlbum(mode: string) {
    if (
      await mutate(
        { action: "album", mode, ids: [...selected], name: name.trim(), album },
        "Collection saved.",
      )
    ) {
      setSheet("");
      setName("");
      resetSelection();
    }
  }
  const row = (id: string, label: string) => {
    const pictures = collectionPhotos(id),
      cover = pictures.find((p) => !p.choice.hidden);
    return (
      <Button
        key={id}
        variant="unstyled"
        className="collection-row"
        onClick={() => {
          setCollection(id);
          setPage("photos");
          setFilter("all");
          setQuery("");
          resetSelection();
        }}
      >
        {cover ? (
          <img src={photoUrl(cover.id)} alt="" />
        ) : (
          <span className="collection-placeholder">
            <PhoneIcon name="collections" />
          </span>
        )}
        <span>
          <b>{label}</b>
          <small>
            {pictures.filter((p) => !p.choice.hidden && !p.pending).length}{" "}
            pictures on frame
          </small>
        </span>
        <span aria-hidden="true">›</span>
      </Button>
    );
  };
  return (
    <div
      id="manager"
      className={selecting && selected.size ? "is-selecting" : ""}
    >
      <Status id="status" role="status" className="phone-status">
        {status}
      </Status>
      <div className="session-line">
        <span className="connected-dot" />
        {Math.max(0, Math.ceil((deadline - now) / 60000))} min left
        <Button
          variant="ghost"
          aria-label="Connection details"
          onClick={() => setSheet("connection")}
        >
          <PhoneIcon name="more" />
        </Button>
      </div>
      <div className="phone-content">
        {edit ? (
          <PictureDetails
            edit={edit}
            setEdit={setEdit}
            busy={busy}
            onBack={closeEdit}
            onSave={async (photo) => {
              if (
                await mutate(
                  {
                    action: "details",
                    ids: [photo.id],
                    choice: pictureDetails(photo.choice),
                  },
                  "Picture details saved.",
                )
              )
                closeEdit();
            }}
            onToggle={async (action, value) => {
              if (
                await mutate(
                  { action, value, ids: [edit.id] },
                  "Saved on the frame.",
                )
              )
                setEdit((old) =>
                  old
                    ? {
                        ...old,
                        ...(action === "keeper"
                          ? { keeper: value }
                          : { choice: { ...old.choice, favourite: value } }),
                      }
                    : null,
                );
            }}
          />
        ) : page === "photos" ? (
          <section aria-label={title}>
            <div className="phone-title">
              <h1>{selecting ? `${selected.size} selected` : title}</h1>
              {selecting ? (
                <Button variant="ghost" onClick={resetSelection}>
                  Cancel
                </Button>
              ) : collection ? (
                <Button
                  variant="ghost"
                  onClick={() => changePage("collections")}
                >
                  ‹ Collections
                </Button>
              ) : (
                <Button onClick={() => setSheet("upload")}>
                  <PhoneIcon name="plus" />
                  Add
                </Button>
              )}
            </div>
            {!selecting && !collection && pending.length > 0 && (
              <Button
                variant="unstyled"
                className="review-banner"
                onClick={() => {
                  setPage("review");
                  window.scrollTo(0, 0);
                }}
              >
                <b>
                  {pending.length} new{" "}
                  {pending.length === 1 ? "picture" : "pictures"} to review
                </b>
                <small>Choose what appears on your frame ›</small>
              </Button>
            )}
            <div className="photo-tools">
              <SegmentedControl
                label="Photos shown"
                value={filter}
                onValueChange={(v) => {
                  setFilter(v);
                  resetSelection();
                }}
                choices={[
                  { value: "all", label: "On frame" },
                  { value: "excluded", label: "Hidden" },
                ]}
              />
              <Button
                variant="ghost"
                aria-label="Search pictures"
                onClick={() => setSearch(!search)}
              >
                <PhoneIcon name="search" />
              </Button>
              {!selecting && (
                <Button
                  variant="ghost"
                  disabled={!visible.length}
                  onClick={() => setSelecting(true)}
                >
                  Select
                </Button>
              )}
            </div>
            {search && (
              <label className="search-field">
                Search titles
                <Input
                  id="search"
                  type="search"
                  autoFocus
                  maxLength={100}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelected(new Set());
                  }}
                />
              </label>
            )}
            {selecting && (
              <p className="subtle">
                Tap pictures to select them.
                <Button
                  variant="ghost"
                  onClick={() => setSelected(new Set(visible.map((p) => p.id)))}
                >
                  Select all
                </Button>
              </p>
            )}
            <div id="pictures" className="photo-grid">
              {visible.map((photo) => (
                <Button
                  key={photo.id}
                  variant="unstyled"
                  data-photo={photo.id}
                  className={
                    "photo-tile" +
                    (selected.has(photo.id) ? " is-selected" : "")
                  }
                  aria-label={(selecting ? "Select " : "Open ") + photo.title}
                  aria-pressed={selecting ? selected.has(photo.id) : undefined}
                  onClick={() => {
                    if (selecting) {
                      setSelected((old) => {
                        const next = new Set(old);
                        next.has(photo.id)
                          ? next.delete(photo.id)
                          : next.add(photo.id);
                        return next;
                      });
                    } else openPhoto(photo);
                  }}
                >
                  <img src={photoUrl(photo.id)} alt="" loading="lazy" />
                  {selecting && (
                    <span className="selection-tick">
                      {selected.has(photo.id) && <PhoneIcon name="check" />}
                    </span>
                  )}
                  {!selecting && photo.keeper && (
                    <span className="photo-badge">Keeper</span>
                  )}
                </Button>
              ))}
            </div>
            {!visible.length && (
              <div className="phone-empty">
                <PhoneIcon name="photos" />
                <h2>
                  {query
                    ? "No matching pictures"
                    : filter === "excluded"
                      ? "No hidden pictures"
                      : collection
                        ? "No pictures here yet"
                        : "Your pictures will appear here"}
                </h2>
                <p>
                  {query
                    ? "Try another title or clear your search."
                    : filter === "excluded"
                      ? "Pictures you hide can be restored here."
                      : collection
                        ? "Select pictures in Photos to add them to a collection."
                        : "Add a picture from this phone, or send one to the frame’s photo inbox."}
                </p>
                {query ? (
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                ) : (
                  !collection &&
                  filter === "all" && (
                    <Button onClick={() => setSheet("upload")}>
                      Add pictures
                    </Button>
                  )
                )}
              </div>
            )}
            {selecting && selected.size > 0 && (
              <div
                className="selection-actions"
                aria-label="Selected picture actions"
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAlbum(data.albums[0]?.id || "");
                    setSheet("album");
                  }}
                >
                  Add to collection
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    filter === "excluded"
                      ? void apply("exclude", false)
                      : hide()
                  }
                >
                  {filter === "excluded" ? "Restore" : "Hide"}
                </Button>
                <Button
                  variant="ghost"
                  aria-label="More picture actions"
                  onClick={() => setSheet("more")}
                >
                  <PhoneIcon name="more" />
                </Button>
              </div>
            )}
          </section>
        ) : page === "collections" ? (
          <section>
            <div className="phone-title">
              <h1>Collections</h1>
              <Button
                variant="ghost"
                onClick={() => {
                  changePage("photos");
                  setSelecting(true);
                  setSheet("new-help");
                }}
              >
                ＋ New
              </Button>
            </div>
            {data.albums.map((a) => row(a.id, a.name))}
            {row("favourites", "Favourites")}
            {row("keepers", "Keepers")}
            <p className="subtle">
              Favourites mark pictures you love. Keepers protect pictures from
              rolling expiry, within your frame’s storage limit.
            </p>
          </section>
        ) : page === "review" ? (
          <section>
            <div className="phone-title">
              <Button variant="ghost" onClick={() => changePage("photos")}>
                ‹ Photos
              </Button>
              <span>{pending.length} waiting</span>
            </div>
            {pending[0] ? (
              <>
                <h1>Show this picture?</h1>
                <img
                  className="review-picture"
                  src={photoUrl(pending[0].id)}
                  alt={pending[0].title}
                />
                <p>{pending[0].title}</p>
                <div className="review-actions">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        action: "review",
                        value: false,
                        ids: [pending[0].id],
                        title: "Keep this picture hidden?",
                      })
                    }
                  >
                    Keep hidden
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => void apply("review", true, [pending[0].id])}
                  >
                    Show on frame
                  </Button>
                </div>
              </>
            ) : (
              <div className="phone-empty">
                <h1>All caught up</h1>
                <p>There are no new pictures waiting for review.</p>
                <Button onClick={() => changePage("photos")}>
                  Back to Photos
                </Button>
              </div>
            )}
          </section>
        ) : (
          <SlideshowSettings
            options={options}
            setOptions={setOptions}
            albums={data.albums}
            photos={data.photos.filter((p) => !p.choice.hidden && !p.pending)}
            busy={busy}
            onSave={() => void onSaveSlideshow()}
          />
        )}
      </div>
      {!edit && (
        <nav className="phone-nav" aria-label="Phone navigation">
          {[
            ["photos", "Photos", "photos"],
            ["collections", "Collections", "collections"],
            ["slideshow", "Slideshow", "play"],
          ].map(([id, label, icon]) => (
            <Button
              key={id}
              variant="ghost"
              aria-current={page === id ? "page" : undefined}
              onClick={() => changePage(id)}
            >
              <PhoneIcon name={icon} />
              <span>{label}</span>
            </Button>
          ))}
        </nav>
      )}
      {confirm && (
        <PhoneDialog
          title={confirm.title}
          busy={busy}
          onClose={() => setConfirm(null)}
        >
          <p role="status" className="dialog-status">
            {/^(Could|Upload|Choose|Saving|Sending|Media)/.test(status)
              ? status
              : ""}
          </p>
          <p>
            It will stop appearing on the frame. You can restore cached pictures
            from Hidden. This does not delete email.
          </p>
          <div className="dialog-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void apply(confirm.action, confirm.value, confirm.ids)
              }
            >
              Hide pictures
            </Button>
          </div>
        </PhoneDialog>
      )}
      {sheet && (
        <PhoneDialog
          title={
            {
              album: "Add to collection",
              more: "Picture actions",
              upload: "Add to your frame",
              connection: "Connection",
              "new-help": "Create a collection",
            }[sheet] || "Photos"
          }
          busy={busy}
          onClose={() => setSheet("")}
        >
          <p role="status" className="dialog-status">
            {/^(Could|Upload|Choose|Saving|Sending|Media)/.test(status)
              ? status
              : ""}
          </p>
          {sheet === "album" ? (
            <>
              <p>{selected.size} pictures selected</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveAlbum("create");
                }}
              >
                <label htmlFor="album-name">New collection name</label>
                <Input
                  id="album-name"
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Button
                  id="album-create"
                  type="submit"
                  disabled={busy || !name.trim()}
                >
                  Create collection
                </Button>
              </form>
              {data.albums.length > 0 && (
                <>
                  <label htmlFor="album-existing">
                    Or add to an existing collection
                  </label>
                  <Select
                    id="album-existing"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                  >
                    {data.albums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    id="album-add"
                    disabled={busy || !album}
                    onClick={() => void saveAlbum("add")}
                  >
                    Add pictures
                  </Button>
                </>
              )}
            </>
          ) : sheet === "more" ? (
            <div className="action-list">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void apply("keeper", true)}
              >
                Keep beyond normal expiry
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => void apply("keeper", false)}
              >
                Use normal expiry
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void apply("favourite", true)}
              >
                Mark as favourites
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => void apply("favourite", false)}
              >
                Remove from favourites
              </Button>
              {collection && data.albums.some((a) => a.id === collection) && (
                <Button
                  disabled={busy}
                  variant="ghost"
                  onClick={async () => {
                    if (
                      await mutate(
                        {
                          action: "album",
                          mode: "remove",
                          album: collection,
                          ids: [...selected],
                        },
                        "Removed from collection.",
                      )
                    ) {
                      setSheet("");
                      resetSelection();
                    }
                  }}
                >
                  Remove from this collection
                </Button>
              )}
              <p className="subtle">
                Keepers survive normal expiry, within the frame’s storage
                budget.
              </p>
            </div>
          ) : sheet === "upload" ? (
            <PhoneUpload upload={upload} busy={busy} />
          ) : sheet === "new-help" ? (
            <>
              <p>
                Select the pictures you want, then tap <b>Add to collection</b>{" "}
                to give your group a name.
              </p>
              <Button onClick={() => setSheet("")}>Choose pictures</Button>
            </>
          ) : (
            <>
              <p>
                Connected over local Wi-Fi. Access ends in about{" "}
                {Math.max(0, Math.ceil((deadline - now) / 60000))} minutes.
              </p>
              <p>
                To stop access immediately, open Photos on the frame and stop
                phone access. Scan its current QR code to reconnect later.
              </p>
              <p className="subtle">
                This page cannot read accounts, passwords, mail or calendars.
              </p>
            </>
          )}
        </PhoneDialog>
      )}
    </div>
  );
}
