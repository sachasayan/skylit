import { Status } from "../components/ui/status";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Icon } from "../components/icon";
import model from "../../web/onboarding-model.js";
export function Onboarding() {
  const app = window.SkylitApp;
  const [revision, setRevision] = useState(0);
  const [step, setStep] = useState(() => {
    try {
      return localStorage.getItem("skylit.onboarding.step") || "";
    } catch {
      return "";
    }
  });
  const read = (name: "photoStatus" | "calendarList", fallback: unknown) => {
      try {
        return JSON.parse(window.Skylit![name]()) as unknown;
      } catch {
        return fallback;
      }
    },
    state = app.setupState(),
    rawMail = read("photoStatus", {}),
    mail = (rawMail && typeof rawMail === "object" ? rawMail : {}) as {
      connected?: boolean;
      photos?: unknown[];
    },
    calendars = read("calendarList", []),
    sources = Array.isArray(calendars)
      ? calendars.filter(
          (c): c is { fetchedAt: number } =>
            !!c && typeof c === "object" && Number.isFinite(c.fetchedAt),
        )
      : [];
  const labels = model.progress(
    state.city,
    state.album,
    !!mail.connected,
    sources.length,
    Array.isArray(mail.photos) ? mail.photos.length : 0,
    sources.length && sources.every((c) => c.fetchedAt > 0)
      ? Math.min(...sources.map((c) => c.fetchedAt))
      : 0,
  );
  function finish() {
    try {
      localStorage.setItem("skylit.onboarding.done", "1");
    } catch {}
    app.go("overview");
  }
  useEffect(() => {
    const update = () => setRevision((v) => v + 1),
      open = () => {
        update();
        app.go("setup");
      },
      button = document.getElementById("setup-reopen");
    button?.addEventListener("click", open);
    window.addEventListener("skylit-tab", update);
    window.addEventListener("skylit-preferences", update);
    let stored = false,
      done = false;
    try {
      stored = localStorage.getItem("skylit.settings") !== null;
      done = localStorage.getItem("skylit.onboarding.done") === "1";
    } catch {}
    if (
      model.shouldOpen(
        stored,
        !!(window.SKYLIT_LOCAL && Object.keys(window.SKYLIT_LOCAL).length),
        done,
        location.hash.slice(1),
      )
    )
      open();
    return () => {
      button?.removeEventListener("click", open);
      window.removeEventListener("skylit-tab", update);
      window.removeEventListener("skylit-preferences", update);
    };
  }, []);
  const steps = [
    {
      target: "city-search",
      title: "Weather & time",
      description:
        "Find your city for the forecast, clock and automatic night colours.",
      status: labels.city,
      id: "city",
      action: "Choose city",
      area: "weather",
    },
    {
      target: "photos",
      title: "Photos",
      description:
        "Use a shared Google album, import local pictures, or connect a dedicated Gmail inbox. Set the idle delay in Settings.",
      status: labels.photos,
      id: "photos",
      action: "Choose photo source",
      area: "photos",
    },
    {
      target: "calendar",
      title: "Calendar",
      description:
        "Add each calendar’s private iCal address on the frame. Events appear in Skylit; edit them in Google Calendar.",
      status: labels.calendar,
      id: "calendar",
      action: "Manage calendars",
      area: "calendars",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FIRST STEPS</p>
          <h1>Set up your frame</h1>
        </div>
        <Button id="setup-dismiss" variant="ghost" onClick={finish}>
          Use dashboard <Icon name="arrow" />
        </Button>
      </div>
      <p className="setup-intro">
        Start with your city, then choose how photos arrive. Calendar and home
        controls can wait. Settings stay on this frame.
      </p>
      <div className="setup-grid">
        {steps.map((s, i) => (
          <article
            key={s.id}
            className="card setup-step"
            aria-current={s.target === step ? "step" : undefined}
          >
            <span className="setup-number">0{i + 1}</span>
            <div>
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              <Status
                id={"setup-" + s.id + "-status"}
                className="setup-status"
                role="status"
              >
                {s.status}
              </Status>
              <Button
                variant="secondary"
                data-setup-target={s.target}
                onClick={() => {
                  setStep(s.target);
                  try {
                    localStorage.setItem("skylit.onboarding.step", s.target);
                  } catch {}
                  app.openSettings(s.area, "setup");
                }}
              >
                {s.action} <Icon name="arrow" />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="setup-footer">
        <p>Home and YouTube are optional. Open either tab when you’re ready.</p>
        <Button id="setup-finish" onClick={finish}>
          Open dashboard
        </Button>
      </div>
    </>
  );
}
