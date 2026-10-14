import * as ToggleGroup from "@radix-ui/react-toggle-group";
import type { ReactNode } from "react";
export interface Choice {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export function SegmentedControl({
  label,
  value,
  choices,
  onValueChange,
  disabled = false,
  className = "",
}: {
  label: string;
  value: string;
  choices: Choice[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      disabled={disabled}
      aria-label={label}
      className={"settings-choices " + className}
    >
      {choices.map((choice) => (
        <ToggleGroup.Item
          key={choice.value}
          value={choice.value}
          disabled={choice.disabled}
          className="settings-choice"
          aria-pressed={choice.value === value}
        >
          {choice.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
