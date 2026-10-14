import { useRef, useState } from "react";

/** Server refreshes never replace a user's draft. A save acknowledges its own revision. */
export function useDraft<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const current = useRef(initial),
    revision = useRef(0),
    dirty = useRef(false);
  function edit(next: T) {
    current.current = next;
    dirty.current = true;
    revision.current++;
    setValue(next);
  }
  function receive(next: T, savedRevision?: number) {
    if (dirty.current && savedRevision !== revision.current) return;
    current.current = next;
    dirty.current = false;
    setValue(next);
  }
  function reset(next: T) {
    revision.current++;
    dirty.current = false;
    current.current = next;
    setValue(next);
  }
  return {
    value,
    edit,
    receive,
    reset,
    snapshot: () => ({ value: current.current, revision: revision.current }),
    isDirty: () => dirty.current,
  };
}
