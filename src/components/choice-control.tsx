import { useSyncExternalStore } from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { render } from "../lib/mount";
import { Icon } from "./icon";
type Option = { value: string; label: string };
type Snapshot = { value: string; disabled: boolean; options: Option[] };
export function mountChoiceControl(
  control: HTMLSelectElement,
  label: string,
  choices?: string[][],
) {
  const host = document.createElement("div");
  host.className = "react-control";
  control.before(host);
  const listeners = new Set<() => void>();
  let snapshot: Snapshot = {
      value: control.value,
      disabled: control.disabled,
      options: [],
    },
    signature = "";
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  function sync() {
    const next = {
      value: control.value,
      disabled: control.disabled,
      options: choices
        ? choices.map(([value, label]) => ({ value, label }))
        : Array.from(control.options)
            .filter((o) => !o.disabled)
            .map((o) => ({ value: o.value, label: o.textContent || o.value })),
    };
    const key = JSON.stringify(next);
    if (key === signature) return;
    signature = key;
    snapshot = next;
    listeners.forEach((fn) => fn());
  }
  sync();
  function Choices() {
    const state = useSyncExternalStore(subscribe, () => snapshot);
    const known = state.options.some((o) => o.value === state.value);
    return (
      <>
        <ToggleGroup.Root
          type="single"
          className="settings-choices"
          data-choice-for={control.id}
          aria-label={label}
          value={state.value}
          disabled={state.disabled}
          onValueChange={(value) => {
            if (!value) return;
            control.value = value;
            control.dispatchEvent(new Event("change", { bubbles: true }));
            sync();
          }}
        >
          {state.options.map((option) => (
            <ToggleGroup.Item
              key={option.value}
              value={option.value}
              data-choice={option.value}
              className="settings-choice"
              aria-pressed={state.value === option.value}
            >
              {(control.id === "appearance-mode" ||
                control.id === "display-text") && (
                <Icon
                  name={
                    control.id === "appearance-mode"
                      ? { light: "sun", dark: "moon", auto: "auto" }[
                          option.value
                        ] || "auto"
                      : option.value === "large"
                        ? "text-large"
                        : "text"
                  }
                />
              )}
              {option.label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
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
