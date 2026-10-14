import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { render } from "../lib/mount";
type Option = [string, string, string?];
function ChoiceArtwork({
  id,
  value,
  kind,
}: {
  id: string;
  value: string;
  kind?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (id !== "dashboard-clock-style" || !ref.current) return;
    const host = ref.current,
      clock = window.SkylitDashboard.createClockPreview(host, value),
      observer = new ResizeObserver(() => clock.fit());
    observer.observe(host);
    return () => {
      observer.disconnect();
      host.replaceChildren();
    };
  }, [id, value]);
  const modules =
    id === "overview-preset"
      ? window.SkylitDashboardModel.preset(value).modules
      : [];
  return (
    <span
      ref={ref}
      className="choice-picture"
      data-look={kind || value}
      aria-hidden="true"
      style={/^#[a-f0-9]{6}$/i.test(value) ? { background: value } : undefined}
    >
      {modules.map((m) => (
        <span
          key={m.type}
          style={{
            left: (m.x / 12) * 100 + "%",
            top: (m.y / 12) * 100 + "%",
            width: (m.w / 12) * 100 + "%",
            height: (m.h / 12) * 100 + "%",
          }}
        />
      ))}
      {id === "photo-style" ? (
        <>
          <i />
          <i />
          <i />
        </>
      ) : kind === "light" ? (
        "☀"
      ) : kind === "dark" ? (
        "☾"
      ) : kind === "auto" ? (
        "☀ / ☾"
      ) : (
        ""
      )}
    </span>
  );
}
export function mountVisualChoiceControl(
  control: HTMLSelectElement,
  label: string,
  options: Option[],
) {
  const host = document.createElement("div");
  host.className = "react-control";
  control.before(host);
  let snapshot = { value: control.value, disabled: control.disabled };
  const listeners = new Set<() => void>();
  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  };
  function sync() {
    if (
      snapshot.value === control.value &&
      snapshot.disabled === control.disabled
    )
      return;
    snapshot = { value: control.value, disabled: control.disabled };
    listeners.forEach((fn) => fn());
  }
  function Choices() {
    const state = useSyncExternalStore(subscribe, () => snapshot),
      known = options.some(([v]) => v === state.value);
    return (
      <>
        <div
          className={
            "settings-choices visual-choices" +
            (control.id === "overview-preset"
              ? " dashboard-templates"
              : control.id === "dashboard-clock-style"
                ? " clock-style-choices"
                : "")
          }
          data-choice-for={control.id}
          role="group"
          aria-label={label}
        >
          {options.map(([value, title, kind]) => (
            <button
              key={value}
              type="button"
              className="settings-choice"
              data-choice={value}
              aria-pressed={value === state.value}
              disabled={state.disabled}
              onClick={() => {
                control.value = value;
                control.dispatchEvent(new Event("change", { bubbles: true }));
                sync();
              }}
            >
              <ChoiceArtwork id={control.id} value={value} kind={kind} />
              <span>{title}</span>
            </button>
          ))}
        </div>
        <p className="choice-current small" role="status" hidden={known}>
          {known
            ? ""
            : "Current: " +
              (control.selectedOptions[0]?.textContent || state.value)}
        </p>
      </>
    );
  }
  render(host, <Choices />);
  control.addEventListener("change", sync);
  return { group: host.querySelector(".settings-choices"), sync };
}
