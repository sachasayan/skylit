import { PhoneWorkspace } from "./phone-workspace";
import { useDraft } from "../lib/draft";
import { FeatureBoundary } from "../lib/error-boundary";
import { Status } from "../components/ui/status";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { parsePhoneState, type PhoneState as State } from "../lib/phone-data";

function Phone() {
  const [data, setData] = useState<State | null>(null),
    [status, setStatus] = useState(""),
    [pair, setPair] = useState(""),
    [pairHelp, setPairHelp] = useState(
      "Scan the QR code in Photos on the frame. Compare the random number here with the frame, then approve on the frame. No photos are shared before approval.",
    );
  const [busy, setBusy] = useState(false),
    [ended, setEnded] = useState(false);
  const connectedBefore = useRef(false);
  const initialOptions: State["options"] = {
    duration: 30,
    style: "fade",
    collection: "recent",
    order: "newest",
  };
  const draft = useDraft(initialOptions),
    options = draft.value,
    setOptions = draft.edit;
  const deadline = useRef(0),
    inFlight = useRef(false),
    refreshRevision = useRef(0);
  const active = useRef(true),
    generation = useRef(0);
  function expire() {
    generation.current++;
    deadline.current = 0;
    setData(null);
    setEnded(connectedBefore.current);
    setPair("");
    draft.reset(initialOptions);
    setPairHelp(
      "Session ended or disconnected. Open Photos on the frame and scan its current QR code.",
    );
  }
  async function request(path: string, body?: unknown) {
    let r: Response;
    try {
      r = await fetch(path, {
        credentials: "same-origin",
        cache: "no-store",
        ...(body
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });
    } catch {
      expire();
      throw Error(
        "Frame disconnected. Open Photos on the frame and scan its QR code.",
      );
    }
    if (!r.ok) {
      if (r.status === 403) {
        expire();
        throw Error(
          "Session unavailable. Open Photos on the frame and scan its QR code.",
        );
      }
      throw Error("Could not save. Check the frame and its storage capacity.");
    }
    return r.json();
  }
  async function refresh(savedRevision?: number) {
    const token = generation.current,
      revision = ++refreshRevision.current,
      started = Date.now(),
      raw: unknown = await request("/state");
    if (
      !active.current ||
      generation.current !== token ||
      revision !== refreshRevision.current
    )
      return;
    let next: State;
    try {
      next = parsePhoneState(raw);
    } catch (e) {
      expire();
      throw e;
    }
    if (
      !Array.isArray(next.photos) ||
      !Array.isArray(next.albums) ||
      !next.options
    ) {
      expire();
      throw Error("Invalid frame response. Reconnect to the frame.");
    }
    connectedBefore.current = true;
    setEnded(false);
    setData(next);
    deadline.current = Math.min(
      deadline.current || Infinity,
      started +
        Math.max(0, Math.min(900000, next.sessionRemainingMs ?? 900000)),
    );
    draft.receive(
      {
        duration: next.options.duration,
        style: next.options.style,
        collection: next.options.collection,
        order: next.options.order,
      },
      savedRevision,
    );
  }
  function showPair(row: { number: string }) {
    if (!active.current) return;
    setPair(row.number);
    setPairHelp(
      "Compare this number with the frame. Tap “Numbers match · Allow” on the frame if they match. If they differ, reject the request.",
    );
    setStatus("Waiting for approval on the frame.");
  }
  useEffect(() => {
    active.current = true;
    let timer: ReturnType<typeof setTimeout>;
    async function wait() {
      try {
        const row = await request("/pair-state");
        if (!active.current) return;
        if (row.state === "paired") {
          await refresh();
          setPair("");
          setStatus("");
          return;
        }
        showPair(row);
        timer = setTimeout(wait, 1000);
      } catch (e) {
        if (active.current) {
          setPair("");
          setPairHelp(
            "Request expired or rejected. Scan the current QR code in Photos on the frame.",
          );
          setStatus((e as Error).message);
        }
      }
    }
    async function connect() {
      const ticket = new URLSearchParams(location.hash.slice(1)).get("pair");
      if (location.hash) history.replaceState(null, "", location.pathname);
      if (ticket) {
        if (!/^[a-f0-9]{64}$/.test(ticket)) {
          setStatus("Invalid invitation. Scan the frame’s QR code again.");
          return;
        }
        try {
          showPair(await request("/pair", { ticket }));
          await wait();
        } catch (e) {
          if (active.current) setStatus((e as Error).message);
        }
        return;
      }
      try {
        await refresh();
        if (active.current) setStatus("");
      } catch {
        try {
          showPair(await request("/pair-state"));
          await wait();
        } catch {
          if (active.current)
            setStatus("Open Photos on the frame, then scan its QR code.");
        }
      }
    }
    void connect();
    return () => {
      active.current = false;
      clearTimeout(timer);
    };
  }, []);
  async function mutate(
    body: unknown,
    message: string,
    savedRevision?: number,
  ) {
    if (inFlight.current || !deadline.current || Date.now() >= deadline.current)
      return false;
    inFlight.current = true;
    setBusy(true);
    setStatus("Saving…");
    const token = generation.current;
    try {
      await request("/action", body);
      if (token !== generation.current) return false;
      await refresh(savedRevision);
      if (token === generation.current) setStatus(message);
      return token === generation.current;
    } catch (e) {
      setStatus((e as Error).message);
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!data) return;
    let checking = false;
    const check = async () => {
      if (checking || inFlight.current) return;
      if (deadline.current && Date.now() >= deadline.current) {
        expire();
        setStatus(
          "Session expired. Open Photos on the frame and scan its QR code.",
        );
        return;
      }
      checking = true;
      try {
        await refresh();
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        checking = false;
      }
    };
    const timer = setInterval(() => {
      if (deadline.current && Date.now() >= deadline.current) {
        expire();
        setStatus(
          "Session expired. Open Photos on the frame and scan its QR code.",
        );
      }
    }, 1000);
    const poll = setInterval(check, 10000);
    const visible = () => {
      if (!document.hidden) void check();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      clearInterval(poll);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [!!data]);
  useEffect(() => {
    if (
      !data ||
      !/^(Connected|Approved|Saved|Picture details saved|Slideshow saved|Collection saved|Media imported|Removed from)/.test(
        status,
      )
    )
      return;
    const t = setTimeout(() => setStatus(""), 4500);
    return () => clearTimeout(t);
  }, [status, !!data]);
  async function upload(file: File | undefined, video: boolean) {
    if (
      !file ||
      inFlight.current ||
      !deadline.current ||
      Date.now() >= deadline.current
    )
      return false;
    const max = video ? 32 : 12;
    if (file.size > max * 1024 * 1024) {
      setStatus("Choose a file smaller than " + max + " MiB.");
      return false;
    }
    inFlight.current = true;
    setBusy(true);
    setStatus("Sending to your frame…");
    const token = generation.current;
    try {
      let response: Response;
      try {
        response = await fetch(video ? "/upload-video" : "/upload", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": video ? "video/mp4" : "image/jpeg" },
          body: file,
        });
      } catch {
        expire();
        throw Error(
          "Frame disconnected. Open Photos on the frame and scan its QR code.",
        );
      }
      if (token !== generation.current) return false;
      if (!response.ok) {
        if (response.status === 403) expire();
        throw Error(
          "Upload could not be saved. Check format and frame capacity.",
        );
      }
      await refresh();
      if (token !== generation.current) return false;
      setStatus("Media imported to this frame.");
      return true;
    } catch (e) {
      setStatus((e as Error).message);
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="phone-shell">
      <header className="phone-header">
        <strong>Skylit</strong>
        <span>{data ? "Connected to your frame" : "Your photo companion"}</span>
      </header>
      {!data && (
        <Status id="status" role="status" className="phone-status">
          {status}
        </Status>
      )}
      {!data ? (
        <section id="pair" className="phone-pair">
          <h1>
            {pair
              ? "Do these numbers match?"
              : ended
                ? "Connection ended"
                : "Connect to your frame"}
          </h1>
          {pair && (
            <Status id="pair-number" aria-label="Matching number" role="status">
              {pair.slice(0, 3)} {pair.slice(3)}
            </Status>
          )}
          <p id="pair-help">{pairHelp}</p>
          <p className="subtle">Your photos stay private until you approve.</p>
          <details>
            <summary>Connection help</summary>
            <p>
              Keep both devices on the same Wi-Fi. Open Photos on the frame and
              scan its current QR code.
            </p>
            <p>
              Verify the certificate fingerprint against the frame before
              accepting its local certificate warning.
            </p>
          </details>
        </section>
      ) : (
        <PhoneWorkspace
          status={status}
          data={data}
          busy={busy}
          mutate={mutate}
          upload={upload}
          options={options}
          setOptions={setOptions}
          deadline={deadline.current}
          onSaveSlideshow={async () => {
            const saved = draft.snapshot();
            return mutate(
              { action: "settings", options: saved.value },
              "Slideshow saved on the frame.",
              saved.revision,
            );
          }}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <FeatureBoundary>
    <Phone />
  </FeatureBoundary>,
);
