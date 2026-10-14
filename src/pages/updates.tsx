import type {
  UpdateSettings,
  UpdateState,
  NativeBridge,
} from "../types/services";
import { Disclosure, DisclosureTitle } from "../components/ui/disclosure";
import { Status } from "../components/ui/status";
import { Select, Field } from "../components/ui/field";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../components/ui/button";
import { SegmentedControl } from "../components/ui/segmented-control";
const policies = [
  { value: "manual", label: "Manual" },
  { value: "check", label: "Notify me" },
  { value: "download", label: "Download" },
  { value: "idle", label: "Install when idle" },
];
export function Updates() {
  const model = window.SkylitUpdateModel,
    native = window.Skylit,
    app = window.SkylitApp,
    supported = !!native?.updateStatus;
  const [state, setState] = useState(() => model.normalize()),
    [feedback, setFeedback] = useState("");
  const working = ["checking", "downloading", "installing"].includes(
      state.stage,
    ),
    policy = model.policy(state.settings);
  function refresh() {
    if (!supported) return;
    try {
      const next = model.normalize(JSON.parse(native!.updateStatus())),
        timezone = app.calendarPreferences().timezone;
      if (
        timezone &&
        next.settings.timezone !== timezone &&
        native!.updateConfigure(JSON.stringify({ ...next.settings, timezone }))
      )
        next.settings.timezone = timezone;
      setState(next);
    } catch {
      setFeedback("Update status is unavailable. Try again.");
    }
  }
  function save(settings: UpdateSettings) {
    if (!supported) return false;
    if (settings.start === settings.end) {
      setFeedback("Choose different start and end times.");
      return false;
    }
    try {
      if (!native!.updateConfigure(JSON.stringify(settings))) throw Error();
      refresh();
      setFeedback("Update preferences saved.");
      return true;
    } catch {
      setFeedback(
        "Could not save update preferences. Your previous policy is retained.",
      );
      return false;
    }
  }
  function setPolicy(value: string) {
    const next = model.policySettings(value, state.settings);
    return next ? save(next) : false;
  }
  function invoke(kind: "check" | "download" | "install") {
    if (!supported || working) return;
    const methods: Record<
      "check" | "download" | "install",
      "updateCheck" | "updateDownload" | "updateInstall"
    > = {
      check: "updateCheck",
      download: "updateDownload",
      install: "updateInstall",
    };
    try {
      native![methods[kind]]();
      if (kind !== "install")
        setState((s: UpdateState) => ({
          ...s,
          stage: kind === "check" ? "checking" : "downloading",
        }));
      setTimeout(refresh, 300);
    } catch {
      app.notify("Could not start the update. Try again.");
    }
  }
  useEffect(() => {
    refresh();
    const onFocus = () => refresh(),
      onPrefs = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("skylit-preferences", onPrefs);
    const timer = setInterval(() => {
      if (supported) {
        refresh();
        native!.updateHeartbeat(
          !app.settingsOpen() &&
            app.status().tab === "overview" &&
            !document.hidden,
        );
      }
    }, 30000);
    if (supported) {
      try {
        const initial = model.normalize(JSON.parse(native!.updateStatus()));
        if (
          initial.settings.check &&
          Date.now() - initial.lastChecked > 12 * 3600000
        )
          native!.updateBackgroundCheck();
      } catch {}
    }
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("skylit-preferences", onPrefs);
    };
  }, []);
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, [working]);
  // Native callbacks are stable public entry points, while React owns the view.
  window.SkylitUpdates = {
    receive: (value: unknown) => setState(model.normalize(value)),
    status: () => state,
    setPolicy,
  };
  useEffect(() => {
    window.dispatchEvent(new Event("skylit-update-state"));
  }, [state]);
  const action = model.action(state),
    text: Record<string, string> = {
      idle: "Check GitHub for a newer signed Skylit release.",
      current: "You’re up to date with the latest verified release.",
      available: "Skylit " + state.version + " is available.",
      checking: "Checking GitHub…",
      downloading: "Downloading and verifying the update…",
      ready: "Skylit " + state.version + " is ready to install.",
      installing: "Android is installing the update…",
      confirm: "The update needs your confirmation in Android.",
      failed: "Could not complete the update. You can retry.",
    };
  const note =
    policy === "custom"
      ? "Your existing custom policy is retained. Choose an option to replace it."
      : policy === "idle"
        ? "Installs only during the window below after five minutes without touch. Android may ask for confirmation."
        : policy === "download"
          ? "Downloads a verified APK. You decide when to install."
          : policy === "check"
            ? "Checks for releases and shows the sidebar update button."
            : "Checks only when you ask.";
  return (
    <>
      <article className="card setting-block">
        <h3>App updates</h3>
        <p id="update-version" className="subtle">
          {state.installed ? "Installed version " + state.installed : ""}
        </p>
        <Status id="update-status" role="status">
          {state.supported
            ? state.message || text[state.stage] || "Updates are unavailable."
            : "App installation is available on the Android frame. This browser preview cannot update an APK."}
        </Status>
        {working && (
          <progress id="update-progress" aria-label="Update in progress" />
        )}
        <div className="update-actions">
          {action && (
            <Button
              id="update-action"
              disabled={working}
              onClick={() => invoke(action[0])}
            >
              {action[1]}
            </Button>
          )}
          {state.supported && state.version && (
            <Button
              id="update-check"
              variant="ghost"
              disabled={working}
              onClick={() => invoke("check")}
            >
              Check now
            </Button>
          )}
          {state.supported &&
            !state.permission &&
            (state.settings.install ||
              state.stage === "ready" ||
              state.stage === "confirm") && (
              <Button
                id="update-permission"
                variant="secondary"
                onClick={() => {
                  try {
                    native!.updatePermission();
                  } catch {
                    app.notify(
                      "Android installation settings are unavailable.",
                    );
                  }
                }}
              >
                Allow Skylit to install updates
              </Button>
            )}
        </div>
        <p id="update-checked" className="tiny">
          {state.lastChecked
            ? "Last checked " + new Date(state.lastChecked).toLocaleString()
            : ""}
        </p>
        {state.notes && (
          <Disclosure id="update-release-notes">
            <DisclosureTitle>What’s new</DisclosureTitle>
            <p id="update-notes">{state.notes}</p>
          </Disclosure>
        )}
      </article>
      <article className="card setting-block">
        <h3>Update policy</h3>
        <p className="small subtle">
          Choose how far Skylit should proceed automatically. Installation
          respects the saved idle window.
        </p>
        <SegmentedControl
          label="Update policy"
          value={policy}
          choices={policies.map((p) => ({
            ...p,
            label: <span data-policy={p.value}>{p.label}</span>,
          }))}
          disabled={!state.supported}
          onValueChange={setPolicy}
        />
        <p className="small subtle">{note}</p>
        {policy === "idle" && (
          <>
            <div className="update-window">
              {(["start", "end"] as const).map((key) => (
                <Field
                  key={key}
                  id={"update-" + key}
                  label={key === "start" ? "Between" : "And"}
                >
                  <Select
                    id={"update-" + key}
                    value={state.settings[key]}
                    disabled={!state.supported}
                    onChange={(e) =>
                      save({
                        ...state.settings,
                        [key]: Number(e.target.value),
                        timezone: app.calendarPreferences().timezone || "UTC",
                      })
                    }
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
            </div>
            <p id="update-window-zone" className="tiny">
              Times follow{" "}
              {app.calendarPreferences().timezone || state.settings.timezone}.
            </p>
          </>
        )}
        <p className="small subtle">
          Installation waits until nobody has touched the frame for five minutes
          and the dashboard or automatic ambient display is idle. Android may
          require confirmation. Android closes Skylit during installation;
          reopen it if needed. Your settings and pictures stay on the frame.
        </p>
        <Status id="update-save-status" role="status" className="small">
          {feedback}
        </Status>
      </article>
      {createPortal(
        <Button
          id="update-sidebar"
          variant="ghost"
          className="nav update-sidebar"
          hidden={!model.badge(state)}
          onClick={() => app.openSettings("updates")}
        >
          <span aria-hidden="true">↑</span>
          <span>
            {state.stage === "confirm"
              ? "Confirm update"
              : state.stage === "ready"
                ? "Install update"
                : "Update"}
          </span>
        </Button>,
        document.querySelector(".rail-bottom")!,
      )}
    </>
  );
}
