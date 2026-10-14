/** Validate untrusted API/cache data before it reaches render code. */
export type WeatherData = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    is_day: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
  daily: {
    time: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
    sunset: (number | null)[];
  };
  hourly: {
    time: number[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    is_day: number[];
  };
  fetchedAt?: number;
};
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
export function normalizeWeather(value: unknown): WeatherData | null {
  if (
    !record(value) ||
    !record(value.current) ||
    !record(value.daily) ||
    !record(value.hourly)
  )
    return null;
  const { current, daily, hourly } = value;
  if (
    ![
      "temperature_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "wind_speed_10m",
      "relative_humidity_2m",
    ].every((key) => finite(current[key]))
  )
    return null;
  for (const [group, keys] of [
    [
      daily,
      [
        "temperature_2m_max",
        "temperature_2m_min",
        "weather_code",
        "precipitation_probability_max",
        "sunset",
      ],
    ],
    [
      hourly,
      ["temperature_2m", "precipitation_probability", "weather_code", "is_day"],
    ],
  ] as const) {
    const times = group.time;
    if (
      !Array.isArray(times) ||
      !times.length ||
      !times.every((t) => finite(t) && t > 0 && t < 8640000000000)
    )
      return null;
    if (
      !keys.every(
        (key) =>
          Array.isArray(group[key]) &&
          group[key].length === times.length &&
          group[key].every(
            (n: unknown) => finite(n) || (key === "sunset" && n === null),
          ),
      )
    )
      return null;
  }
  if (
    value.fetchedAt !== undefined &&
    (!finite(value.fetchedAt) ||
      value.fetchedAt <= 0 ||
      value.fetchedAt >= 8640000000000000)
  )
    return null;
  return value as WeatherData;
}
