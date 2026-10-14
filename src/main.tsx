import type { ComponentProps, ReactNode } from "react";
import { normalizeWeather } from "./lib/weather-data";
import { PlaybackIcon } from "./components/playback-icon";
import { PhoneSession } from "./pages/phone-session";
import {
  template,
  ArticleBody,
  LibrarySection,
} from "./components/form-templates";
import { mountVisualChoiceControl } from "./components/visual-choice-control";
import { AppShell } from "./app-shell";
import {
  ShoppingList,
  CountdownList,
  HouseholdTimers,
  YouTubeShortcuts,
} from "./pages/household";
import {
  LibraryGrid,
  PendingPictures,
  SimilarPictures,
  PictureOrder,
} from "./pages/library";
import { PhotoTiles, PhotoStack } from "./pages/photos";
import {
  DashboardTiles,
  WidgetStyleChoices,
  DashboardGallery,
  DashboardUtility,
} from "./pages/dashboard";
import {
  CalendarSources,
  CalendarGrid,
  CalendarAgenda,
  OverviewEvents,
  ApprovedInviters,
  PendingInviters,
} from "./pages/calendar";
import { Onboarding } from "./pages/onboarding";
import onboardingModel from "../web/onboarding-model.js";
import { render } from "./lib/mount";
import { Weather, OverviewWeather, weatherStore } from "./pages/weather";
import { Updates } from "./pages/updates";
import { mountChoiceControl } from "./components/choice-control";
// Entry points are called only after the local frame surface is ready.
export const UI = {
  mountOnboarding() {
    window.SkylitOnboardingModel = onboardingModel;
    render(document.getElementById("setup")!, <Onboarding />);
  },
  mountUpdates(target: Element) {
    render(target, <Updates />);
  },
  playbackIcon: (host: Element, name: string, label?: string) =>
    render(host, <PlaybackIcon name={name} label={label} />),
  phoneSession: (props: ComponentProps<typeof PhoneSession>) =>
    render(
      document.getElementById("slideshow-phone-status")!,
      <PhoneSession {...props} />,
    ),
  template,
  renderNode: render,
  articleBody: (host: Element, title: string, children: ReactNode) =>
    render(host, <ArticleBody title={title}>{children}</ArticleBody>),
  librarySection: (host: Element, title: string, children: ReactNode) =>
    render(host, <LibrarySection title={title}>{children}</LibrarySection>),
  mountChoiceControl,
  mountVisualChoiceControl,
  household: {
    shopping: (id: string, props: ComponentProps<typeof ShoppingList>) =>
      render(document.getElementById(id)!, <ShoppingList {...props} />),
    countdowns: (id: string, props: ComponentProps<typeof CountdownList>) =>
      render(document.getElementById(id)!, <CountdownList {...props} />),
    timers: (props: ComponentProps<typeof HouseholdTimers>) =>
      render(
        document.getElementById("household-timers")!,
        <HouseholdTimers {...props} />,
      ),
    shortcuts: (
      host: Element,
      props: ComponentProps<typeof YouTubeShortcuts>,
    ) => render(host, <YouTubeShortcuts {...props} />),
  },
  library: {
    grid: (props: ComponentProps<typeof LibraryGrid>) =>
      render(
        document.getElementById("library-grid")!,
        <LibraryGrid {...props} />,
      ),
    pending: (props: ComponentProps<typeof PendingPictures>) =>
      render(
        document.getElementById("library-pending")!,
        <PendingPictures {...props} />,
      ),
    similar: (props: ComponentProps<typeof SimilarPictures>) =>
      render(
        document.getElementById("library-similar")!,
        <SimilarPictures {...props} />,
      ),
    order: (props: ComponentProps<typeof PictureOrder>) =>
      render(
        document.getElementById("library-order-list")!,
        <PictureOrder {...props} />,
      ),
  },
  photos: {
    tiles: (props: ComponentProps<typeof PhotoTiles>) =>
      render(
        document.getElementById("photo-tiles")!,
        <PhotoTiles {...props} />,
      ),
    stack: (props: ComponentProps<typeof PhotoStack>) =>
      render(
        document.getElementById("overview-photo-stack")!,
        <PhotoStack {...props} />,
      ),
  },
  dashboard: {
    styles: (host: Element, props: ComponentProps<typeof WidgetStyleChoices>) =>
      render(host, <WidgetStyleChoices {...props} />),
    tiles: (props: ComponentProps<typeof DashboardTiles>) =>
      render(
        document.getElementById("dashboard-editor-grid")!,
        <DashboardTiles {...props} />,
      ),
    gallery: (props: ComponentProps<typeof DashboardGallery>) =>
      render(
        document.getElementById("dashboard-gallery")!,
        <DashboardGallery {...props} />,
      ),
    utility: (host: Element, props: ComponentProps<typeof DashboardUtility>) =>
      render(host, <DashboardUtility {...props} />),
  },
  calendar: {
    sources: (props: ComponentProps<typeof CalendarSources>) =>
      render(
        document.getElementById("calendar-sources")!,
        <CalendarSources {...props} />,
      ),
    grid: (props: ComponentProps<typeof CalendarGrid>) =>
      render(
        document.getElementById("calendar-grid")!,
        <CalendarGrid {...props} />,
      ),
    agenda: (props: ComponentProps<typeof CalendarAgenda>) =>
      render(
        document.getElementById("calendar-agenda")!,
        <CalendarAgenda {...props} />,
      ),
    overview: (props: ComponentProps<typeof OverviewEvents>) =>
      render(
        document.getElementById("overview-events")!,
        <OverviewEvents {...props} />,
      ),
    approved: (props: ComponentProps<typeof ApprovedInviters>) =>
      render(
        document.getElementById("calendar-approved")!,
        <ApprovedInviters {...props} />,
      ),
    pending: (props: ComponentProps<typeof PendingInviters>) =>
      render(
        document.getElementById("calendar-pending")!,
        <PendingInviters {...props} />,
      ),
  },
  weather: weatherStore,
  normalizeWeather,
  mountWeather() {
    render(document.getElementById("weather")!, <Weather />);
    render(document.querySelector(".overview-weather")!, <OverviewWeather />);
  },
};

window.SkylitUI = UI;
render(document.getElementById("root")!, <AppShell />);
window.SkylitUI.mountWeather();
