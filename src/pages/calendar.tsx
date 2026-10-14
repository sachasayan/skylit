import type { CalendarEvent, EventRow, EventGroup } from "../types/views";
type CalendarSource = {
  id: string;
  name: string;
  color: string;
  fetchedAt?: number;
};
type SourceActions = {
  onVisible: (id: string, value: boolean) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, name: string, color: string) => boolean;
};
import { Disclosure, DisclosureTitle } from "../components/ui/disclosure";
import { NativeButton } from "../components/ui/button";
import { Input, Checkbox } from "../components/ui/field";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
export function CalendarSources({
  sources,
  hidden,
  errors,
  busy,
  format,
  onVisible,
  onRemove,
  onEdit,
}: {
  sources: CalendarSource[];
  hidden: string[];
  errors: Map<string, string>;
  busy: Set<string>;
  format: (n: number) => string;
  onVisible: (id: string, value: boolean) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, name: string, color: string) => boolean;
}) {
  return (
    <>
      {sources.map((s) => (
        <Source
          key={s.id}
          source={s}
          shown={!hidden.includes(s.id)}
          note={
            errors.get(s.id) ||
            (busy.has(s.id)
              ? "Checking calendar…"
              : s.fetchedAt
                ? "Updated · " + format(s.fetchedAt)
                : "Waiting for first connection")
          }
          onVisible={onVisible}
          onRemove={onRemove}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}
function Source({
  source: s,
  shown,
  note,
  onVisible,
  onRemove,
  onEdit,
}: { source: CalendarSource; shown: boolean; note: string } & SourceActions) {
  const [armed, setArmed] = useState(false),
    [editing, setEditing] = useState(false),
    [name, setName] = useState(s.name),
    [color, setColor] = useState(s.color);
  useEffect(() => {
    const reset = () => setArmed(false);
    window.addEventListener("skylit-settings", reset);
    return () => window.removeEventListener("skylit-settings", reset);
  }, []);
  return (
    <div className="cal-source">
      <div>
        <strong style={{ borderLeft: "5px solid " + s.color, paddingLeft: 10 }}>
          {s.name}
        </strong>
        <label className="cal-check cal-source-visibility">
          <Checkbox
            checked={shown}
            aria-label={"Show " + s.name + " on frame"}
            onChange={(e) => onVisible(s.id, e.target.checked)}
          />
          <span>Show on frame</span>
        </label>
        <p className="tiny">{note}</p>
        {editing && (
          <form
            className="cal-source-editor"
            onSubmit={(e) => {
              e.preventDefault();
              if (onEdit(s.id, name.trim(), color)) setEditing(false);
            }}
          >
            <Input
              aria-label="Calendar label"
              value={name}
              maxLength={60}
              required
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              aria-label="Calendar colour"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <Button variant="secondary" type="submit">
              Save
            </Button>
          </form>
        )}
      </div>
      <div className="cal-source-actions">
        <Button
          variant="secondary"
          aria-label={"Edit " + s.name}
          disabled={editing}
          onClick={() => {
            setName(s.name);
            setColor(s.color);
            setEditing(true);
          }}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          aria-label={"Remove " + s.name}
          onClick={() => (armed ? onRemove(s.id) : setArmed(true))}
        >
          {armed ? "Tap to confirm" : "Remove"}
        </Button>
        {armed && (
          <Button variant="ghost" onClick={() => setArmed(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
export function CalendarGrid({
  days,
  onSelect,
}: {
  days: {
    key: string;
    label: string;
    outside: boolean;
    today: boolean;
    selected: boolean;
    items: CalendarEvent[];
  }[];
  onSelect: (day: string) => void;
}) {
  return (
    <>
      {days.map((day) => (
        <NativeButton
          key={day.key}
          className={
            "cal-day" +
            (day.outside ? " outside" : "") +
            (day.today ? " today" : "")
          }
          aria-pressed={day.selected}
          aria-label={day.label + ", " + day.items.length + " events"}
          onClick={() => onSelect(day.key)}
        >
          <span className="cal-day-number">{Number(day.key.slice(-2))}</span>
          {day.items.slice(0, 1).map((e) => (
            <span
              className="cal-chip"
              key={e.key}
              style={{ borderLeftColor: e.color }}
            >
              {e.title}
            </span>
          ))}
          {day.items.length > 1 && (
            <span className="cal-more">+{day.items.length - 1}</span>
          )}
        </NativeButton>
      ))}
    </>
  );
}
function EventDetail({
  event: e,
  time,
  range,
  onCountdown,
}: EventRow & { onCountdown?: (title: string, date: string) => boolean }) {
  const [saved, setSaved] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <Disclosure className="cal-event" style={{ borderLeftColor: e.color }}>
      <DisclosureTitle>
        <span className="cal-event-time">{time}</span>
        <strong>{e.title}</strong>
      </DisclosureTitle>
      <p className="tiny">{e.name}</p>
      {e.location && <p className="small">{e.location}</p>}
      {range && <p className="small">{range}</p>}
      {e.description && (
        <p className="cal-description small">{e.description}</p>
      )}
      {onCountdown && (
        <Button
          variant="ghost"
          disabled={saved}
          onClick={() => {
            const ok = onCountdown(e.title, e.startDay);
            setSaved(!!ok);
            setFailed(!ok);
          }}
        >
          {saved
            ? "Countdown saved"
            : failed
              ? "Use Household options · maximum five dates"
              : "Add countdown on frame"}
        </Button>
      )}
    </Disclosure>
  );
}
export function CalendarAgenda({
  groups,
  empty,
  onCountdown,
}: {
  groups: EventGroup[];
  empty: string;
  onCountdown?: (title: string, date: string) => boolean;
}) {
  return (
    <>
      {groups.map((g) => (
        <div className="cal-agenda-day" key={g.key}>
          <h3>{g.title}</h3>
          {g.items.length ? (
            g.items.map((row) => (
              <EventDetail
                key={row.event.source + "/" + row.event.key}
                {...row}
                onCountdown={onCountdown}
              />
            ))
          ) : (
            <p className="subtle small">No events.</p>
          )}
        </div>
      ))}
      {empty && <p className="subtle small">{empty}</p>}
    </>
  );
}
export function OverviewEvents({
  groups,
  empty,
  onSelect,
  onAdd,
  multiple,
}: {
  groups: EventGroup[];
  empty: string;
  multiple: boolean;
  onSelect: (event: CalendarEvent) => void;
  onAdd: (() => void) | null;
}) {
  return (
    <>
      {groups.map((g) => (
        <section key={g.key} className="overview-event-group">
          <h3>{g.title}</h3>
          {g.items.map(({ event: e, time }) => (
            <Button
              key={e.source + "/" + e.key}
              className="overview-event"
              variant="ghost"
              aria-label={"Open calendar event: " + e.title}
              onClick={() => onSelect(e)}
            >
              <time>{time}</time>
              <div>
                <strong>{e.title}</strong>
                {multiple && <small>{e.name}</small>}
              </div>
            </Button>
          ))}
        </section>
      ))}
      {empty && <p className="subtle">{empty}</p>}
      {onAdd && (
        <Button variant="secondary" onClick={onAdd}>
          Add a calendar
        </Button>
      )}
    </>
  );
}
export function ApprovedInviters({
  addresses,
  onRevoke,
}: {
  addresses: string[];
  onRevoke: (address: string) => void;
}) {
  return addresses.length ? (
    addresses.map((address: string) => (
      <div key={address} className="cal-inviter-row">
        <span>{address}</span>
        <Button
          variant="ghost"
          aria-label={"Remove approved inviter " + address}
          onClick={() => onRevoke(address)}
        >
          Hide on frame
        </Button>
      </div>
    ))
  ) : (
    <p className="subtle small">No approved inviters yet.</p>
  );
}
export function PendingInviters({
  waiting,
  enabled,
  onApprove,
}: {
  waiting: { address: string; count: number }[];
  enabled: boolean;
  onApprove: (address: string) => void;
}) {
  return waiting.length ? (
    waiting.map((item) => (
      <div className="cal-inviter-row" key={item.address || "unknown"}>
        <span>
          {(item.address || "Organizer not provided") +
            " · " +
            item.count +
            " event" +
            (item.count === 1 ? "" : "s")}
        </span>
        {item.address && (
          <Button
            variant="secondary"
            aria-label={"Show events from " + item.address}
            onClick={() => onApprove(item.address)}
          >
            Show on frame
          </Button>
        )}
      </div>
    ))
  ) : (
    <p className="subtle small">
      {enabled
        ? "No invitations waiting in the loaded dates."
        : "Turn on review to screen new inviters."}
    </p>
  );
}
