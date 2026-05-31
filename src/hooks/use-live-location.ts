import { useCallback, useEffect, useRef, useState } from "react";

export type LiveAddress = {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
} | null;

export type LiveLocationState = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null; // km/h
  heading: number | null; // 0-360
  address: LiveAddress;
  isGeocoding: boolean;
  error: string | null;
  gpsDisabled: boolean;
  isTracking: boolean;
  lastPositionAt: number | null;
  startTracking: () => void;
};

const CACHE_KEY = "qapqrv:last-location";
const GEO_DEBOUNCE_MS = 1500;
const GEO_MIN_DISTANCE = 20; // meters
const GEO_MIN_INTERVAL = 5000;

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371e3;
  const f1 = (a[0] * Math.PI) / 180;
  const f2 = (b[0] * Math.PI) / 180;
  const df = ((b[0] - a[0]) * Math.PI) / 180;
  const dl = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

type NominatimAddr = {
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
};

async function reverseGeocode(
  lat: number,
  lon: number,
  signal: AbortSignal,
): Promise<LiveAddress> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=pt-BR&zoom=18`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Geocoder ${res.status}`);
  const data = (await res.json()) as { address?: NominatimAddr };
  const a = data.address ?? {};
  return {
    street: a.road,
    number: a.house_number,
    neighborhood: a.suburb ?? a.neighbourhood,
    city: a.city ?? a.town ?? a.village ?? a.municipality,
    state: a.state,
  };
}

export function useLiveLocation(): LiveLocationState {
  const [state, setState] = useState<
    Omit<LiveLocationState, "startTracking">
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = window.localStorage.getItem(CACHE_KEY);
        if (cached) {
          const p = JSON.parse(cached);
          return {
            latitude: p.latitude ?? null,
            longitude: p.longitude ?? null,
            accuracy: p.accuracy ?? null,
            speed: null,
            heading: null,
            address: p.address ?? null,
            isGeocoding: false,
            error: null,
            gpsDisabled: false,
            isTracking: false,
            lastPositionAt: p.at ?? null,
          };
        }
      } catch {
        /* ignore */
      }
    }
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      speed: null,
      heading: null,
      address: null,
      isGeocoding: false,
      error: null,
      gpsDisabled: false,
      isTracking: false,
      lastPositionAt: null,
    };
  });

  const watchIdRef = useRef<number | null>(null);
  const lastGeoAtRef = useRef<number>(0);
  const lastGeoPosRef = useRef<[number, number] | null>(null);
  const geoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoAbortRef = useRef<AbortController | null>(null);
  const addressRef = useRef<LiveAddress>(state.address);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scheduleGeocode = useCallback((lat: number, lon: number) => {
    const now = Date.now();
    const last = lastGeoPosRef.current;
    const distance = last ? haversine(last, [lat, lon]) : Infinity;
    if (
      distance < GEO_MIN_DISTANCE &&
      now - lastGeoAtRef.current < GEO_MIN_INTERVAL
    ) {
      return;
    }
    if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
    geoTimerRef.current = setTimeout(async () => {
      lastGeoAtRef.current = Date.now();
      lastGeoPosRef.current = [lat, lon];
      geoAbortRef.current?.abort();
      const ctrl = new AbortController();
      geoAbortRef.current = ctrl;
      setState((s) => ({ ...s, isGeocoding: true }));
      try {
        const addr = await reverseGeocode(lat, lon, ctrl.signal);
        addressRef.current = addr;
        setState((s) => ({ ...s, address: addr, isGeocoding: false }));
        try {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              latitude: lat,
              longitude: lon,
              address: addr,
              at: Date.now(),
            }),
          );
        } catch {
          /* ignore */
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState((s) => ({ ...s, isGeocoding: false }));
        }
      }
    }, GEO_DEBOUNCE_MS);
  }, []);

  const startTracking = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocalização não suportada" }));
      return;
    }
    if (watchIdRef.current != null) return;

    const onPos = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      const speedKmh = speed != null && speed >= 0 ? speed * 3.6 : null;
      setState((s) => ({
        ...s,
        latitude,
        longitude,
        accuracy,
        speed: speedKmh != null ? Math.round(speedKmh * 10) / 10 : s.speed,
        heading:
          heading != null && !Number.isNaN(heading)
            ? Math.round(heading)
            : s.heading,
        gpsDisabled: false,
        error: null,
        isTracking: true,
        lastPositionAt: Date.now(),
      }));
      scheduleGeocode(latitude, longitude);
    };

    const onErr = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setState((s) => ({
          ...s,
          error: "Permissão de localização negada",
          isTracking: false,
        }));
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setState((s) => ({ ...s, gpsDisabled: true, error: null }));
        if (!pollingRef.current) {
          pollingRef.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              (p) => {
                if (pollingRef.current) {
                  clearInterval(pollingRef.current);
                  pollingRef.current = null;
                }
                onPos(p);
              },
              () => {
                /* still off */
              },
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
            );
          }, 3000);
        }
      } else {
        setState((s) => ({ ...s, error: err.message }));
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });

    // Quick first fix from cache
    navigator.geolocation.getCurrentPosition(onPos, () => {}, {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000,
    });
  }, [scheduleGeocode]);

  useEffect(() => {
    startTracking();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            setState((s) => ({
              ...s,
              latitude,
              longitude,
              accuracy,
              lastPositionAt: Date.now(),
              gpsDisabled: false,
            }));
            scheduleGeocode(latitude, longitude);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 },
        );
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
      geoAbortRef.current?.abort();
    };
  }, [startTracking, scheduleGeocode]);

  return { ...state, startTracking };
}
