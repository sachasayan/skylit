import type { HTMLAttributes } from "react";
import { clsx } from "clsx";
export function Status({
  className,
  tone = "neutral",
  role = "status",
  ...props
}: HTMLAttributes<HTMLParagraphElement> & {
  tone?: "neutral" | "success" | "error";
}) {
  return (
    <p
      {...props}
      role={role}
      aria-atomic="true"
      className={clsx("ui-status", "ui-status-" + tone, className)}
    />
  );
}
