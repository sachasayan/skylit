import { FeatureBoundary } from "./error-boundary";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import type { ReactNode } from "react";
const roots = new WeakMap<Element, Root>();
export function render(target: Element, element: ReactNode) {
  let root = roots.get(target);
  if (!root) {
    root = createRoot(target);
    roots.set(target, root);
  }
  flushSync(() =>
    root!.render(
      <FeatureBoundary revision={element}>{element}</FeatureBoundary>,
    ),
  );
}
export function unmount(target: Element) {
  const root = roots.get(target);
  if (root) {
    root.unmount();
    roots.delete(target);
  }
}
