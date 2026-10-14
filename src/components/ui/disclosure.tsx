import * as React from "react";
import { clsx } from "clsx";
// Keep the native disclosure keyboard interaction and persisted open property.
export const Disclosure = React.forwardRef<
  HTMLDetailsElement,
  React.DetailsHTMLAttributes<HTMLDetailsElement>
>(({ className, ...props }, ref) => (
  <details ref={ref} className={clsx("ui-disclosure", className)} {...props} />
));
Disclosure.displayName = "Disclosure";
export function DisclosureTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <summary className={clsx("ui-disclosure-title", className)} {...props} />
  );
}
