import type { PointerEvent, KeyboardEvent } from "react";
import type {
  DashboardModule,
  ModuleDefinition,
  ModuleType,
  Household,
  TimerItem,
} from "../types/views";
import { Icon } from "../components/icon";
import { NativeButton } from "../components/ui/button";
import { useEffect, useState, useRef } from "react";
export function DashboardTiles({
  modules,
  selected,
  definition,
  onSelect,
  onRemove,
  onBegin,
  onKey,
  register,
}: {
  modules: DashboardModule[];
  selected: ModuleType | null;
  definition: (type: ModuleType) => ModuleDefinition;
  onSelect: (type: ModuleType) => void;
  onRemove: (type: ModuleType) => void;
  onBegin: (event: PointerEvent, type: ModuleType, mode: string) => void;
  onKey: (
    event: KeyboardEvent,
    type: ModuleType,
    resize: boolean | string,
  ) => void;
  register: (type: ModuleType, node: HTMLDivElement | null) => void;
}) {
  return (
    <>
      {modules.map((item) => (
        <div
          className={
            "dashboard-editor-tile" +
            (selected === item.type ? " selected" : "")
          }
          data-module={item.type}
          key={item.type}
          ref={(n) => register(item.type, n)}
          style={{
            gridColumn: item.x + 1 + " / span " + item.w,
            gridRow: item.y + 1 + " / span " + item.h,
          }}
        >
          <NativeButton
            type="button"
            className="dashboard-move"
            aria-label={"Move " + definition(item.type).name}
            aria-pressed={selected === item.type}
            onClick={() => onSelect(item.type)}
            onPointerDown={(e) => onBegin(e, item.type, "move")}
            onKeyDown={(e) => onKey(e, item.type, false)}
          >
            {definition(item.type).name}
          </NativeButton>
          <NativeButton
            type="button"
            className="dashboard-delete"
            aria-label={"Remove " + definition(item.type).name + " widget"}
            onClick={() => onRemove(item.type)}
          >
            <Icon name="trash" />
          </NativeButton>
          <span className="dashboard-editor-size">
            {item.w + " × " + item.h}
          </span>
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <NativeButton
              key={corner}
              type="button"
              className={"dashboard-resize corner-" + corner}
              aria-label={
                "Resize " +
                definition(item.type).name +
                " from " +
                {
                  nw: "top left",
                  ne: "top right",
                  sw: "bottom left",
                  se: "bottom right",
                }[corner]
              }
              onPointerDown={(e) => onBegin(e, item.type, "resize-" + corner)}
              onKeyDown={(e) => onKey(e, item.type, corner)}
            >
              <span />
            </NativeButton>
          ))}
        </div>
      ))}
    </>
  );
}
export function DashboardGallery({
  catalog,
  included,
  clock,
  temperature,
  pictures,
  onAdd,
  onBegin,
}: {
  catalog: ModuleDefinition[];
  included: ModuleType[];
  clock: string;
  temperature: string;
  pictures: string[];
  onAdd: (type: ModuleType) => void;
  onBegin: (event: PointerEvent, type: ModuleType) => void;
}) {
  const touchStart = useRef<{ x: number; y: number; id: number } | null>(null);
  return (
    <>
      {catalog.map((definition) => (
        <div
          className="dashboard-gallery-card"
          data-included={included.includes(definition.type)}
          key={definition.type}
        >
          <NativeButton
            type="button"
            className="dashboard-gallery-item"
            data-type={definition.type}
            aria-label={
              definition.name +
              (included.includes(definition.type)
                ? " — on dashboard"
                : " — add widget")
            }
            disabled={included.includes(definition.type)}
            onClick={() => onAdd(definition.type)}
            onPointerDown={(e) => {
              if (e.pointerType !== "touch") onBegin(e, definition.type);
              else
                touchStart.current = {
                  x: e.clientX,
                  y: e.clientY,
                  id: e.pointerId,
                };
            }}
            onPointerMove={(e) => {
              const start = touchStart.current;
              if (!start || start.id !== e.pointerId) return;
              const dx = Math.abs(e.clientX - start.x),
                dy = Math.abs(e.clientY - start.y);
              if (dy > 10 && dy > dx) {
                touchStart.current = null;
                return;
              }
              if (dx > 10 && dx > dy) {
                touchStart.current = null;
                onBegin(e, definition.type);
              }
            }}
            onPointerUp={() => {
              touchStart.current = null;
            }}
            onPointerCancel={() => {
              touchStart.current = null;
            }}
          >
            <span className="dashboard-gallery-visual">
              <span
                className="dashboard-palette-preview"
                data-preview-type={definition.type}
                aria-hidden="true"
              >
                <WidgetMiniature
                  type={definition.type}
                  clock={clock}
                  temperature={temperature}
                  pictures={pictures}
                />
              </span>
              {included.includes(definition.type) && (
                <span className="dashboard-included-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </span>
              )}
            </span>
            <strong className="dashboard-gallery-name">
              {definition.name}
            </strong>
          </NativeButton>
        </div>
      ))}
    </>
  );
}
function WidgetMiniature({
  type,
  clock,
  temperature,
  pictures,
}: {
  type: ModuleType;
  clock: string;
  temperature: string;
  pictures: string[];
}) {
  if (type === "photos")
    return (
      <>
        {pictures.length ? (
          pictures.map((url, i) => <img key={i} src={url} alt="" />)
        ) : (
          <span className="mini-photo-landscape" />
        )}
      </>
    );
  if (type === "clock")
    return (
      <span className="widget-mini-clock">
        <small>Today</small>
        <b>{clock}</b>
        <i />
      </span>
    );
  if (type === "weather")
    return (
      <span className="widget-mini-weather">
        <small>Right now</small>
        <b>{temperature}</b>
        <Icon name="sun" />
        <i />
      </span>
    );
  if (type === "forecast")
    return (
      <span className="widget-mini-forecast">
        {["sun", "cloud", "sun"].map((icon, i) => (
          <span key={i}>
            <small>{["Now", "11 am", "Noon"][i]}</small>
            <Icon name={icon} />
            <b>{["17°", "18°", "20°"][i]}</b>
          </span>
        ))}
      </span>
    );
  if (type === "plans")
    return (
      <span className="widget-mini-list">
        <b>Upcoming</b>
        <span>10:00 · Breakfast</span>
        <span>15:00 · A walk</span>
      </span>
    );
  if (type === "shopping")
    return (
      <span className="widget-mini-list">
        <b>Shopping</b>
        <span>○ Bread</span>
        <span>○ Apples</span>
      </span>
    );
  if (type === "note")
    return (
      <span className="widget-mini-note">
        <small>A little note</small>
        <b>Enjoy the little things.</b>
      </span>
    );
  if (type === "countdowns")
    return (
      <span className="widget-mini-count">
        <small>Days until a day out</small>
        <b>12</b>
        <span>days to go</span>
      </span>
    );
  return (
    <span className="widget-mini-timer">
      <small>Tea timer</small>
      <b>04:32</b>
      <i />
    </span>
  );
}
function Timer({ item }: { item: TimerItem }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const seconds = Math.max(0, Math.ceil((item.end - now) / 1000));
  return (
    <div className="dashboard-timer">
      <strong>{item.title}</strong>
      <span>
        {seconds
          ? Math.floor(seconds / 60) +
            ":" +
            String(seconds % 60).padStart(2, "0")
          : "Time is up"}
      </span>
    </div>
  );
}
export function DashboardUtility({
  type,
  house,
  today,
  dayDelta,
  onCheck,
}: {
  type: ModuleType;
  house: Household;
  today: string;
  dayDelta: (date: string, today: string) => number;
  onCheck: (id: string) => void;
}) {
  if (type === "note")
    return (
      <p className="dashboard-note">
        {house.note || "Add a pinned note in Household settings."}
      </p>
    );
  if (type === "shopping") {
    const items = house.shopping.filter((i) => !i.done);
    return items.length ? (
      items.map((item) => (
        <NativeButton
          key={item.id}
          className="dashboard-shopping"
          aria-label={"Check off " + item.text}
          onClick={() => onCheck(item.id)}
        >
          <span>○</span>
          <span>{item.text}</span>
        </NativeButton>
      ))
    ) : (
      <p className="subtle">
        {house.shopping.length
          ? "Everything is checked off."
          : "Add items in Household."}
      </p>
    );
  }
  if (type === "countdowns")
    return house.countdowns.length ? (
      house.countdowns.map((item, i: number) => {
        const delta = dayDelta(item.date, today);
        return (
          <div
            key={item.title + "/" + item.date + "/" + i}
            className="dashboard-countdown"
          >
            <strong>{item.title}</strong>
            <span>
              {delta === 0
                ? "Today"
                : delta > 0
                  ? delta + " days away"
                  : Math.abs(delta) + " days ago"}
            </span>
          </div>
        );
      })
    ) : (
      <p className="subtle">Add a date in Household settings.</p>
    );
  return house.timers.length ? (
    house.timers.map((item) => <Timer key={item.id} item={item} />)
  ) : (
    <p className="subtle">Start a timer in Household.</p>
  );
}

export function WidgetStyleChoices({
  type,
  value,
  pictures,
  temperature,
  onChange,
}: {
  type: "photos" | "weather";
  value: string;
  pictures: string[];
  temperature: string;
  onChange: (value: string) => void;
}) {
  const entries =
    type === "photos"
      ? [
          ["prints", "Prints"],
          ["mosaic", "Mosaic"],
          ["spotlight", "Spotlight"],
        ]
      : [
          ["landscape", "Landscape"],
          ["minimal", "At a glance"],
          ["sky", "Sky"],
        ];
  return (
    <div
      className="widget-style-choices"
      role="group"
      aria-label={
        type === "photos" ? "Photo widget style" : "Weather widget style"
      }
    >
      {entries.map(([id, name]) => (
        <NativeButton
          type="button"
          key={id}
          className="widget-style-choice"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          <span className={"widget-style-art style-" + id} aria-hidden="true">
            {type === "photos" ? (
              pictures.length ? (
                pictures
                  .slice(0, id === "spotlight" ? 1 : 3)
                  .map((src, i) => <img src={src} alt="" key={i} />)
              ) : (
                <span>Photos</span>
              )
            ) : (
              <>
                <Icon name="sun" />
                <strong>{temperature}</strong>
                <i />
              </>
            )}
          </span>
          <span>{name}</span>
        </NativeButton>
      ))}
    </div>
  );
}
