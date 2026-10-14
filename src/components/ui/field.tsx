import * as React from "react";
import { clsx } from "clsx";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={clsx("ui-input", className)}
    {...props}
  />
));
Input.displayName = "Input";
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={clsx("ui-select", className)} {...props} />
));
Select.displayName = "Select";
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={clsx("ui-textarea", className)} {...props} />
));
Textarea.displayName = "Textarea";

// Native inputs preserve form submission, keyboard behavior and legacy change listeners.
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    type="checkbox"
    className={clsx("ui-checkbox", className)}
  />
));
Checkbox.displayName = "Checkbox";
export const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    type="checkbox"
    role="switch"
    className={clsx("ui-switch", className)}
  />
));
Switch.displayName = "Switch";

export function Field({
  id,
  label,
  description,
  error,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  children: React.ReactElement;
}) {
  const help = error || description;
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": help ? id + "-help" : undefined,
      })}
      {help && (
        <p
          id={id + "-help"}
          className={clsx("ui-field-help", error && "ui-field-error")}
        >
          {help}
        </p>
      )}
    </div>
  );
}
export function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ui-setting-row">
      <div>
        <strong>{label}</strong>
        {description && <p>{description}</p>}
      </div>
      <div className="ui-setting-control">{children}</div>
    </div>
  );
}
