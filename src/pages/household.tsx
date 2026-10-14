import type { ShoppingItem, Countdown, TimerItem } from "../types/views";
import { NativeButton } from "../components/ui/button";
import { Button } from "../components/ui/button";
export function ShoppingList({
  items,
  onToggle,
  empty,
}: {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  empty?: boolean;
}) {
  return items.length ? (
    items.map((item) => (
      <NativeButton
        key={item.id}
        type="button"
        className="shopping-item"
        aria-pressed={item.done}
        onClick={() => onToggle(item.id)}
      >
        <span className="shopping-mark" aria-hidden="true">
          {item.done ? "✓" : "○"}
        </span>
        <span>{item.text}</span>
      </NativeButton>
    ))
  ) : empty ? (
    <p className="subtle small">Your list is clear.</p>
  ) : null;
}
export function CountdownList({
  items,
  today,
  dayDelta,
  editing,
  onRemove,
}: {
  items: Countdown[];
  today: string;
  dayDelta: (date: string, today: string) => number;
  editing: boolean;
  onRemove: (index: number) => void;
}) {
  return items.map((item, i: number) => {
    const delta = dayDelta(item.date, today);
    return editing ? (
      <div
        key={item.title + "/" + item.date + "/" + i}
        className="preference-row"
      >
        <span>{item.title + " · " + item.date}</span>
        <Button variant="ghost" onClick={() => onRemove(i)}>
          Remove
        </Button>
      </div>
    ) : (
      <div
        key={item.title + "/" + item.date + "/" + i}
        className="countdown-row"
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
  });
}
export function HouseholdTimers({
  items,
  now,
  onRemove,
}: {
  items: TimerItem[];
  now: number;
  onRemove: (id: string) => void;
}) {
  return items.map((item) => {
    const seconds = Math.max(0, Math.ceil((item.end - now) / 1000));
    return (
      <div key={item.id} className="timer-row">
        <strong>{item.title}</strong>
        <span data-timer={item.id} className={!seconds ? "timer-done" : ""}>
          {seconds
            ? Math.floor(seconds / 60) +
              ":" +
              String(seconds % 60).padStart(2, "0")
            : "Time is up"}
        </span>
        <Button variant="ghost" onClick={() => onRemove(item.id)}>
          Dismiss
        </Button>
      </div>
    );
  });
}
export function YouTubeShortcuts({
  items,
  editing,
  onOpen,
  onRemove,
}: {
  items: { title: string; url: string }[];
  editing: boolean;
  onOpen: (url: string) => void;
  onRemove: (index: number) => void;
}) {
  return items.map((item, i: number) =>
    editing ? (
      <div key={item.url + "/" + i} className="preference-row">
        <span>{item.title}</span>
        <Button variant="ghost" onClick={() => onRemove(i)}>
          Remove
        </Button>
      </div>
    ) : (
      <Button
        key={item.url + "/" + i}
        variant="secondary"
        onClick={() => onOpen(item.url)}
      >
        {item.title + " ↗"}
      </Button>
    ),
  );
}
