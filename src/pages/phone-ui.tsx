import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "../components/ui/button";
export const photoUrl = (id: string) =>
  "/photo/" + encodeURIComponent(id) + ".jpg";
export function PhoneIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    photos: "M3 3h18v18H3zM3 16l6-6 4 4 3-3 5 5",
    collections: "M3 6h18v15H3zM6 3h12",
    play: "m8 4 12 8-12 8Z",
    back: "m15 5-7 7 7 7",
    plus: "M12 4v16M4 12h16",
    check: "m5 12 4 4L19 6",
    search: "M16 16l5 5M18 10a8 8 0 11-16 0 8 8 0 0116 0",
    close: "m5 5 14 14M5 19 19 5",
    rotate: "M20 7v5h-5M6 6a8 8 0 111 13",
    heart: "M12 21 3 12C-2 5 7 0 12 6c5-6 14-1 9 6Z",
    more: "M5 12h1m5 0h1m5 0h1",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.photos} />
    </svg>
  );
}
export function PhoneDialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="phone-dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="phone-title">
        <h2 id="dialog-title">{title}</h2>
        <Button
          variant="ghost"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          <PhoneIcon name="close" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
