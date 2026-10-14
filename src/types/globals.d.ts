import type { DashboardModule } from "./views";
import type { WeatherData } from "../lib/weather-data";
import type {
  NativeBridge,
  AppService,
  UpdateModel,
  UpdateState,
} from "./services";
import type { UI } from "../main";
import type onboardingModel from "../../web/onboarding-model";
declare global {
  interface Window {
    SkylitDashboard: {
      createClockPreview(host: HTMLElement, style: string): { fit(): void };
    };
    SkylitDashboardModel: {
      preset(value: string): { modules: DashboardModule[] };
    };
    SkylitWeatherArt: {
      apply(host: HTMLElement, code: number, isDay: number): void;
      describe(code: number): { label: string; icon: string };
    };
    SkylitAppModel: {
      forecast(
        data: WeatherData,
        now: number,
        zone: string,
      ): {
        hours: { time: number; index: number; isNow: boolean }[];
        days: {
          time: number;
          index: number;
          isToday: boolean;
          isPast: boolean;
        }[];
      };
    };
    SkylitOverview: {
      weather(data: WeatherData | null): {
        temperature: number;
        code: number;
        stale: boolean;
        fetchedAt: number;
      } | null;
    };
    SkylitPhonePairing: {
      canvas(value: string, document: Document): HTMLCanvasElement;
    };
    Skylit?: NativeBridge;
    SkylitApp: AppService;
    SkylitUpdates: {
      receive(value: unknown): void;
      status(): UpdateState;
      setPolicy(value: string): boolean;
    };
    SkylitUpdateModel: UpdateModel;
    SkylitVersion: { version: string; code: number };
    SkylitOnboardingModel: typeof onboardingModel;
    SKYLIT_LOCAL?: Record<string, unknown>;
    SkylitUI: typeof UI;
  }
}
