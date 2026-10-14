import { Disclosure, DisclosureTitle } from "./components/ui/disclosure";
import { Status } from "./components/ui/status";
import { Button } from "./components/ui/button";
import { NativeButton } from "./components/ui/button";
import { Input, Select, Checkbox, Switch } from "./components/ui/field";
/* Stable frame shell. Dynamic views mount only inside their empty surface hosts. */
export function AppShell() {
  return (
    <>
      <div className="shell">
        <aside className="rail">
          <div className="momo-home">
            <NativeButton
              id="momo"
              className="momo-button"
              aria-label="Say hello to Momo"
              title="Tap to say hello"
            >
              <canvas
                id="momo-canvas"
                width="420"
                height="310"
                aria-hidden="true"
              ></canvas>
            </NativeButton>
          </div>
          <nav aria-label="Main navigation">
            <NativeButton data-tab="overview" className="nav">
              <span data-icon="overview"></span>
              {"Overview"}
            </NativeButton>
            <NativeButton data-tab="weather" className="nav active">
              <span data-icon="sun"></span>
              {"Weather"}
            </NativeButton>
            <NativeButton data-tab="photos" className="nav">
              <span data-icon="photo"></span>
              {"Photos"}
            </NativeButton>
            <NativeButton data-tab="calendar" className="nav">
              <span data-icon="calendar"></span>
              {"Calendar"}
            </NativeButton>
            <NativeButton data-tab="home" className="nav">
              <span data-icon="home"></span>
              {"Home"}
            </NativeButton>
            <NativeButton data-tab="youtube" className="nav">
              <span data-icon="tv"></span>
              {"YouTube"}
            </NativeButton>
            <NativeButton data-tab="settings" className="nav">
              <span data-icon="settings"></span>
              {"Settings"}
            </NativeButton>
          </nav>
          <div className="rail-bottom">
            <span className="tiny" id="connection">
              {"Checking connection"}
            </span>
          </div>
        </aside>
        <main>
          <header className="topline">
            <span id="greeting">{"Welcome home."}</span>
            <span className="location">
              <span className="status-dot"></span>
              <span id="location-name">{"Choose your city"}</span>
            </span>
          </header>
          <section
            id="setup"
            className="page"
            aria-label="Set up Skylit"
          ></section>
          <section id="overview" className="page" aria-label="Overview">
            <div className="overview-grid">
              <header className="card overview-heading">
                <h1 id="clock" aria-label="Current time">
                  <span id="clock-time">{"—"}</span>
                  <small id="clock-period"></small>
                </h1>
                <p id="date">{"—"}</p>
              </header>
              <article className="card overview-weather"></article>
              <NativeButton
                id="overview-photos"
                className="overview-photos"
                type="button"
                aria-label="Open recent photos"
                hidden={true}
              >
                <span
                  id="overview-photo-stack"
                  className="overview-photo-stack"
                  aria-hidden="true"
                ></span>
              </NativeButton>
              <article className="card overview-plans">
                <div className="section-title">
                  <h2>{"Upcoming"}</h2>
                  <Button
                    type="submit"
                    variant="ghost"
                    data-go="calendar"
                    aria-label="Open calendar"
                  >
                    <span data-icon="arrow"></span>
                  </Button>
                </div>
                <Status
                  id="overview-calendar-status"
                  className="tiny"
                  role="status"
                ></Status>
                <div id="overview-events">
                  <p className="subtle">
                    {"Add a calendar to see upcoming events."}
                  </p>
                </div>
              </article>
            </div>
          </section>
          <section
            id="weather"
            className="page active"
            aria-label="Weather"
          ></section>
          <section id="photos" className="page" aria-label="Photos">
            <div className="page-heading">
              <div>
                <h1>{"Photos"}</h1>
              </div>
            </div>
            <article className="card photo-feature">
              <div className="photo-copy">
                <p className="eyebrow">{"YOUR SHARED GOOGLE PHOTOS ALBUM"}</p>
                <h2>{"Shared album"}</h2>
                <p>{"Play your Google Photos album full screen."}</p>
                <Button type="submit" variant="default" id="start-photos">
                  <span data-icon="play"></span>
                  {"Start slideshow"}
                </Button>
                <Button type="submit" variant="ghost" data-go="settings">
                  {"Change album or timing "}
                  <span data-icon="arrow"></span>
                </Button>
              </div>
            </article>
            <div className="two-cards">
              <article className="card detail">
                <span data-icon="moon"></span>
                <h3>{"Automatic slideshow"}</h3>
                <p id="idle-description">
                  {
                    "After 2 minutes of quiet, your frame switches to family photos."
                  }
                </p>
                <p className="subtle">
                  {"Touch anywhere to return to your dashboard."}
                </p>
              </article>
              <article className="card detail">
                <span data-icon="photo"></span>
                <h3>{"One shared album"}</h3>
                <p id="album-status">{"Checking album configuration…"}</p>
                <p className="subtle">
                  {
                    "Uses Google's own slideshow. No photo copies are stored by Skylit."
                  }
                </p>
              </article>
            </div>
          </section>
          <section id="home" className="page" aria-label="Home controls">
            <div className="page-heading">
              <div>
                <h1>{"Home controls"}</h1>
              </div>
              <span className="pill">{"Google Home"}</span>
            </div>
            <article className="card home-feature">
              <div>
                <p className="eyebrow"></p>
                <h2>{"Google Home"}</h2>
                <p>
                  {
                    "On your frame, Google Home opens here beside the Skylit sidebar."
                  }
                </p>
                <Button type="submit" id="open-home" variant="default">
                  <span data-icon="home"></span>
                  {"Open home controls"}
                </Button>
                <p className="subtle small">
                  {"First time on this frame? Sign in to Google when prompted."}
                </p>
              </div>
            </article>
            <p className="subtle small">
              {
                "Availability depends on the devices supported by Google Home for web. Skylit doesn't display guessed device states."
              }
            </p>
          </section>
          <section id="calendar" className="page" aria-label="Calendar">
            <div className="page-heading">
              <div>
                <h1>{"Calendar"}</h1>
              </div>
            </div>
            <div className="cal-top">
              <Status
                id="calendar-status"
                className="subtle"
                role="status"
              ></Status>
              <div className="cal-actions">
                <Button type="submit" id="calendar-review" variant="secondary">
                  {"Review inviters"}
                </Button>
                <Button type="submit" id="calendar-setup" variant="secondary">
                  {"Calendar options"}
                </Button>
              </div>
            </div>
            <Disclosure className="calendar-search-disclosure">
              <DisclosureTitle>{"Search loaded dates"}</DisclosureTitle>
              <label htmlFor="calendar-search" className="sr-only">
                {"Search event titles in loaded dates"}
              </label>
              <Input
                id="calendar-search"
                type="search"
                maxLength={100}
                placeholder="Search loaded event titles"
              />
            </Disclosure>
            <div id="calendar-empty" className="card cal-empty">
              <h2>{"No calendars yet"}</h2>
              <p>
                {"Connect a private Google Calendar feed to see events here."}
              </p>
              <Button type="submit" id="calendar-connect" variant="default">
                {"Add your first calendar"}
              </Button>
              <p className="subtle small">
                {"One private link. No account sign-in on the frame."}
              </p>
            </div>
            <div id="calendar-content" className="cal-layout" hidden={true}>
              <article className="card cal-month">
                <div className="cal-month-heading">
                  <h2 id="calendar-month-title"></h2>
                  <div className="cal-navigation">
                    <Button
                      type="submit"
                      id="calendar-prev"
                      variant="ghost"
                      aria-label="Previous month"
                    >
                      {"‹"}
                    </Button>
                    <Button type="submit" id="calendar-today" variant="ghost">
                      {"Today"}
                    </Button>
                    <Button
                      type="submit"
                      id="calendar-next"
                      variant="ghost"
                      aria-label="Next month"
                    >
                      {"›"}
                    </Button>
                  </div>
                </div>
                <div className="cal-weekdays" aria-hidden="true">
                  <span>{"Sun"}</span>
                  <span>{"Mon"}</span>
                  <span>{"Tue"}</span>
                  <span>{"Wed"}</span>
                  <span>{"Thu"}</span>
                  <span>{"Fri"}</span>
                  <span>{"Sat"}</span>
                </div>
                <div
                  id="calendar-grid"
                  className="cal-grid"
                  aria-label="Choose a date"
                ></div>
              </article>
              <aside className="card cal-agenda">
                <p className="eyebrow">{"AGENDA"}</p>
                <h2 id="calendar-agenda-title"></h2>
                <div id="calendar-agenda"></div>
              </aside>
            </div>
            <Disclosure
              id="calendar-inviters"
              className="card setting-block cal-inviters"
            >
              <DisclosureTitle>{"Who appears on this frame"}</DisclosureTitle>
              <p className="subtle small">
                {
                  "Choose which event organizers Skylit displays. This does not change your Google Calendar or its invitation settings."
                }
              </p>
              <p className="subtle small">
                {
                  "To review unfamiliar inviters, their invitations must first reach this calendar. Check Google Calendar’s invitation setting on your computer."
                }
              </p>
              <label className="cal-check">
                <Switch id="calendar-gate-enable" />
                {" Review new inviters before showing their events"}
              </label>
              <label htmlFor="calendar-owner">{"Calendar account email"}</label>
              <Input
                id="calendar-owner"
                type="email"
                placeholder="Your calendar account"
                autoComplete="off"
              />
              <p className="tiny">
                {
                  "Events organized by this account always appear. Set this before switching on review."
                }
              </p>
              <form id="calendar-approve-form" className="input-row">
                <label htmlFor="calendar-approve-email" className="sr-only">
                  {"Approve an inviter"}
                </label>
                <Input
                  id="calendar-approve-email"
                  type="email"
                  placeholder="Add an inviter’s email"
                  autoComplete="off"
                  required={true}
                />
                <Button variant="secondary" type="submit">
                  {"Approve"}
                </Button>
              </form>
              <div id="calendar-approved" className="cal-inviter-list"></div>
              <h3>
                {"Waiting for review "}
                <span id="calendar-pending-count" className="pill">
                  {"0"}
                </span>
              </h3>
              <div id="calendar-pending" className="cal-inviter-list"></div>
              <label className="cal-check">
                <Switch id="calendar-unattributed" />
                {" Show events without an organizer address"}
              </label>
              <Status
                id="calendar-gate-status"
                className="small"
                role="status"
              ></Status>
            </Disclosure>
            <p className="subtle small cal-foot">
              {
                "Read-only · Add or edit plans in Google Calendar on your phone. Refreshes every 15 minutes."
              }
            </p>
          </section>
          <section id="youtube" className="page" aria-label="YouTube">
            <div className="page-heading">
              <div>
                <h1>{"YouTube"}</h1>
              </div>
              <span className="pill">{"YouTube"}</span>
            </div>
            <article className="card home-feature">
              <div>
                <p className="eyebrow"></p>
                <h2>{"Watch on YouTube"}</h2>
                <p>
                  {
                    "On your frame, YouTube opens here beside the Skylit sidebar."
                  }
                </p>
                <Button type="submit" id="open-youtube" variant="default">
                  <span data-icon="play"></span>
                  {"Open YouTube"}
                </Button>
                <p className="subtle small">
                  {"Photo mode pauses while you watch."}
                </p>
              </div>
            </article>
          </section>
          <section id="settings" className="page" aria-label="Settings">
            <div className="page-heading">
              <div>
                <h1>{"Settings"}</h1>
              </div>
              <span id="saved" className="pill" role="status">
                {"Saved on this frame"}
              </span>
            </div>
            <article className="card setup-revisit">
              <div>
                <h3>{"Setup guide"}</h3>
                <p className="subtle small">
                  {"City, photos and calendar in one place."}
                </p>
              </div>
              <Button type="submit" id="setup-reopen" variant="secondary">
                {"Open setup guide"}
              </Button>
            </article>
            <article className="card setting-block">
              <h3>{"Appearance"}</h3>
              <label htmlFor="appearance-mode">{"Colour mode"}</label>
              <Select id="appearance-mode">
                <option value="auto">{"Automatic · sunrise and sunset"}</option>
                <option value="light">{"Light"}</option>
                <option value="dark">{"Dark"}</option>
              </Select>
              <Status
                id="appearance-note"
                className="subtle small"
                role="status"
              ></Status>
              <div
                id="theme-options"
                className="themes"
                role="group"
                aria-label="Colour palette"
              ></div>
            </article>
            <article
              className="card setting-block momo-settings"
              id="momo-settings"
            >
              <div>
                <p className="eyebrow"></p>
                <h3>{"Momo"}</h3>
                <p className="subtle">
                  {
                    "Tap him for a hello. He looks around, follows your scrolling, and gets a little sleepy in quiet moments."
                  }
                </p>
              </div>
              <div className="momo-options">
                <div>
                  <label htmlFor="momo-outfit">{"Today’s accessory"}</label>
                  <Select id="momo-outfit">
                    <option value="auto">
                      {"Surprise me · changes every 90 seconds"}
                    </option>
                    <option value="daily">{"New clothes every day"}</option>
                    <option value="none">{"Just Momo"}</option>
                    <option value="beret">{"Terracotta beret"}</option>
                    <option value="beanie">{"Blue bobble beanie"}</option>
                    <option value="bucket">{"Garden bucket hat"}</option>
                    <option value="cap">{"Weekend cap"}</option>
                    <option value="party">{"Party hat"}</option>
                    <option value="crown">{"Little crown"}</option>
                    <option value="flower">{"Flower clip"}</option>
                    <option value="headphones">{"Headphones"}</option>
                    <option value="bow">{"Bow tie for his hair"}</option>
                    <option value="nightcap">{"Sleepy nightcap"}</option>
                    <option value="wizard">{"Wizard hat"}</option>
                    <option value="leaf">{"Autumn leaf"}</option>
                    <option value="earmuffs">{"Winter earmuffs"}</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="momo-motion">{"His energy"}</label>
                  <Select id="momo-motion">
                    <option value="lively">{"Playful"}</option>
                    <option value="gentle">{"Gentle"}</option>
                    <option value="still">{"Still"}</option>
                  </Select>
                </div>
              </div>
              <div className="momo-routine-control">
                <label htmlFor="momo-routine">{"His daily rhythm"}</label>
                <Select id="momo-routine">
                  <option value="day">
                    {"Follow the day · snooze at night"}
                  </option>
                  <option value="anytime">{"Playful at any hour"}</option>
                </Select>
                <p id="momo-routine-note" className="subtle small"></p>
              </div>
              <Status
                id="momo-outfit-note"
                className="subtle small"
                role="status"
              ></Status>
              <p className="tiny">
                {
                  "Tap an accessory to keep that look, or choose a changing wardrobe above."
                }
              </p>
              <div
                id="momo-gallery"
                className="momo-gallery"
                role="group"
                aria-label="Momo’s accessory gallery"
              ></div>
              <div className="momo-actions">
                <Button type="submit" id="momo-shuffle" variant="secondary">
                  {"Try another accessory"}
                </Button>
                <Button type="submit" id="momo-preview" variant="ghost">
                  {"Make a face"}
                </Button>
                <span
                  id="momo-expression"
                  className="subtle small"
                  role="status"
                >
                  {"Pleased to meet you."}
                </span>
              </div>
              <p className="tiny">
                {"Momo also respects your device’s reduced-motion preference."}
              </p>
            </article>
            <div className="settings-grid">
              <article className="card setting-block">
                <h3>{"Weather & time"}</h3>
                <label htmlFor="city-search">{"Find your city"}</label>
                <form id="city-form" className="input-row">
                  <Input
                    id="city-search"
                    placeholder="City name"
                    autoComplete="off"
                    required={true}
                  />
                  <Button variant="secondary" type="submit">
                    {"Find"}
                  </Button>
                </form>
                <div id="city-results" role="status"></div>
                <label htmlFor="units">{"Temperature"}</label>
                <Select id="units">
                  <option value="celsius">{"Celsius · °C"}</option>
                  <option value="fahrenheit">{"Fahrenheit · °F"}</option>
                </Select>
                <label htmlFor="clock-format">{"Clock"}</label>
                <Select id="clock-format">
                  <option value="12">{"12 hour"}</option>
                  <option value="24">{"24 hour"}</option>
                </Select>
                <p className="subtle small" id="timezone-note"></p>
              </article>
              <article className="card setting-block">
                <h3>{"Photos & idle mode"}</h3>
                <label htmlFor="idle-delay">{"Show photos after"}</label>
                <Select id="idle-delay">
                  <option value="0">{"Never automatically"}</option>
                  <option value="60">{"1 minute without a touch"}</option>
                  <option value="120">{"2 minutes without a touch"}</option>
                  <option value="300">{"5 minutes without a touch"}</option>
                  <option value="600">{"10 minutes without a touch"}</option>
                </Select>
                <label htmlFor="album-url">
                  {"Google Photos shared-album link"}
                </label>
                <Input
                  type="url"
                  id="album-url"
                  placeholder="https://photos.app.goo.gl/…"
                  autoComplete="off"
                />
                <Button type="submit" variant="secondary" id="save-album">
                  {"Save album"}
                </Button>
                <Button type="submit" variant="ghost" id="test-idle">
                  {"Preview idle photo mode "}
                  <span data-icon="arrow"></span>
                </Button>
                <p className="subtle small">
                  {"Sharing-link access is required. Keep this link private."}
                </p>
              </article>
              <article className="card setting-block">
                <h3>{"Home connection"}</h3>
                <label htmlFor="home-url">{"Google Home page"}</label>
                <Input type="url" id="home-url" autoComplete="off" />
                <Button type="submit" id="save-home" variant="secondary">
                  {"Save home page"}
                </Button>
                <p className="subtle small">
                  {"Sign in on the frame. Your Mac's login is not transferred."}
                </p>
              </article>
              <article className="card setting-block" id="calendar-settings">
                <h3>{"Your calendars"}</h3>
                <p className="subtle small">
                  {"Read-only Google Calendar feeds."}
                </p>
                <div id="calendar-sources"></div>
                <Disclosure id="calendar-help">
                  <DisclosureTitle>
                    {"Where do I find my calendar link?"}
                  </DisclosureTitle>
                  <ol>
                    <li>
                      {"On your computer, open Google Calendar → Settings."}
                    </li>
                    <li>
                      {"Select a calendar under "}
                      <b>{"Settings for my calendars"}</b>
                      {"."}
                    </li>
                    <li>
                      {"Choose "}
                      <b>{"Integrate calendar"}</b>
                      {" and copy "}
                      <b>{"Secret address in iCal format"}</b>
                      {"."}
                    </li>
                    <li>
                      {
                        "Paste it below. Repeat for each calendar you want here."
                      }
                    </li>
                  </ol>
                  <p className="small">
                    {
                      "Keep this link private. Do not make your calendar public. If it is missing, use the calendar owner's account or check your organisation's settings."
                    }
                  </p>
                </Disclosure>
                <form id="calendar-form">
                  <label htmlFor="calendar-name">{"Calendar name"}</label>
                  <Input
                    id="calendar-name"
                    placeholder="Family plans"
                    maxLength={60}
                    required={true}
                    autoComplete="off"
                  />
                  <label htmlFor="calendar-color">{"Colour"}</label>
                  <Select id="calendar-color">
                    <option value="#9a513b">{"Terracotta"}</option>
                    <option value="#687354">{"Olive"}</option>
                    <option value="#547d91">{"Blue"}</option>
                    <option value="#916980">{"Plum"}</option>
                    <option value="#ad7937">{"Honey"}</option>
                  </Select>
                  <label htmlFor="calendar-feed">{"Secret iCal address"}</label>
                  <Input
                    id="calendar-feed"
                    type="password"
                    placeholder="Paste your private iCal link"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    required={true}
                  />
                  <p className="tiny">
                    {
                      "Saved only on this frame. The address is never displayed after saving."
                    }
                  </p>
                  <Button id="calendar-add" variant="secondary" type="submit">
                    {"Connect calendar"}
                  </Button>
                  <Status
                    id="calendar-form-status"
                    className="small"
                    role="status"
                  ></Status>
                </form>
              </article>
              <article className="card setting-block">
                <h3>{"About this frame"}</h3>
                <p>{"Skylit"}</p>
                <p className="subtle">
                  {"An offline dashboard with connected services."}
                </p>
                <Button type="submit" id="wifi-settings" variant="ghost">
                  {"Wi-Fi settings "}
                  <span data-icon="settings"></span>
                </Button>
                <Button type="submit" id="android-controls" variant="ghost">
                  {"Android apps "}
                  <span data-icon="overview"></span>
                </Button>
                <Button type="submit" id="wireless-settings" variant="ghost">
                  {"Wireless connection settings "}
                  <span data-icon="settings"></span>
                </Button>
                <Button type="submit" id="stock" variant="ghost">
                  {"Open original Skylight app "}
                  <span data-icon="arrow"></span>
                </Button>
                <p className="subtle small">
                  {
                    "Setup and restoration notes are in the frame's Downloads folder."
                  }
                </p>
              </article>
            </div>
          </section>
        </main>
      </div>
      <div id="toast" role="status"></div>
    </>
  );
}
