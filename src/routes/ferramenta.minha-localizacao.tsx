import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Star,
  Crosshair,
  Layers,
  Share2,
  Gauge,
  Navigation as NavIcon,
  Compass,
  MapPin,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import type { StyleSpecification, GeoJSONSource } from "maplibre-gl";
import { getTool } from "@/lib/tools";
import { BottomNav } from "@/components/bottom-nav";
import { useFavorites, useHistory } from "@/hooks/use-local-list";
import { useLiveLocation } from "@/hooks/use-live-location";
import { toast } from "sonner";

const SLUG = "minha-localizacao";

export const Route = createFileRoute("/ferramenta/minha-localizacao")({
  head: () => ({
    meta: [
      { title: "Minha Localização — QAP, QRV!" },
      {
        name: "description",
        content:
          "Acompanhe sua posição em tempo real no mapa com GPS de alta precisão.",
      },
    ],
  }),
  component: MinhaLocalizacaoPage,
});

type MapLayer = "light" | "dark" | "satellite";

function createRasterStyle(layer: MapLayer): StyleSpecification {
  const tiles: Record<MapLayer, { url: string; maxZoom: number; attribution: string }> = {
    light: {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    },
    dark: {
      url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      maxZoom: 19,
      attribution: "© CARTO © OpenStreetMap",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 18,
      attribution: "© Esri",
    },
  };
  const t = tiles[layer];
  return {
    version: 8,
    sources: {
      raster: {
        type: "raster",
        tiles: [t.url],
        tileSize: 256,
        maxzoom: t.maxZoom,
        attribution: t.attribution,
      },
    },
    layers: [{ id: "raster-layer", type: "raster", source: "raster" }],
  };
}

function circlePolygon(
  center: [number, number],
  radiusMeters: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  const dLat = radiusMeters / 111320;
  const dLng = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

function distance(a: [number, number], b: [number, number]) {
  const R = 6371e3;
  const f1 = (a[1] * Math.PI) / 180;
  const f2 = (b[1] * Math.PI) / 180;
  const df = ((b[1] - a[1]) * Math.PI) / 180;
  const dl = ((b[0] - a[0]) * Math.PI) / 180;
  const x =
    Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function MinhaLocalizacaoPage() {
  const tool = getTool(SLUG)!;
  const { push } = useHistory();
  const { isFav, toggle } = useFavorites();
  const fav = isFav(SLUG);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const markerElRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<[number, number][]>([]);

  const [layer, setLayer] = useState<MapLayer>("light");
  const [autoCenter, setAutoCenter] = useState(true);
  const [ready, setReady] = useState(false);

  const {
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    address,
    isGeocoding,
    gpsDisabled,
    error,
    startTracking,
  } = useLiveLocation();

  useEffect(() => {
    push(SLUG);
  }, [push]);

  // Init map (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current || mapRef.current) return;

    let savedView = { lng: -46.633, lat: -23.55, zoom: 14 };
    try {
      const raw = localStorage.getItem("qapqrv:map-view");
      if (raw) savedView = { ...savedView, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createRasterStyle("light"),
      center: [savedView.lng, savedView.lat],
      zoom: savedView.zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const el = document.createElement("div");
    el.className = "maplibre-user-marker";
    el.innerHTML = '<div class="live-location-marker"></div>';
    markerElRef.current = el;
    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([savedView.lng, savedView.lat])
      .addTo(map);

    map.on("load", () => {
      map.addSource("accuracy-circle", {
        type: "geojson",
        data: circlePolygon([savedView.lng, savedView.lat], 0),
      });
      map.addLayer({
        id: "accuracy-fill",
        type: "fill",
        source: "accuracy-circle",
        paint: {
          "fill-color": "hsla(210, 85%, 50%, 0.12)",
          "fill-outline-color": "hsla(210, 85%, 50%, 0.45)",
        },
      });
      map.addSource("trail", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });
      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "hsl(210, 85%, 50%)",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
      setReady(true);
    });

    map.on("dragstart", () => setAutoCenter(false));
    map.on("moveend", () => {
      const c = map.getCenter();
      try {
        localStorage.setItem(
          "qapqrv:map-view",
          JSON.stringify({ lng: c.lng, lat: c.lat, zoom: map.getZoom() }),
        );
      } catch {
        /* ignore */
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Switch map style
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(createRasterStyle(layer));
    map.once("styledata", () => {
      if (!map.getSource("accuracy-circle")) {
        map.addSource("accuracy-circle", {
          type: "geojson",
          data: circlePolygon(
            [longitude ?? -46.633, latitude ?? -23.55],
            accuracy ?? 0,
          ),
        });
        map.addLayer({
          id: "accuracy-fill",
          type: "fill",
          source: "accuracy-circle",
          paint: {
            "fill-color": "hsla(210, 85%, 50%, 0.12)",
            "fill-outline-color": "hsla(210, 85%, 50%, 0.45)",
          },
        });
      }
      if (!map.getSource("trail")) {
        map.addSource("trail", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: trailRef.current },
          },
        });
        map.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "hsl(210, 85%, 50%)",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });
      }
    });
  }, [layer, ready, longitude, latitude, accuracy]);

  // Update on new position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    markerRef.current?.setLngLat([longitude, latitude]);

    // Marker style: arrow when moving, pulse otherwise
    const el = markerElRef.current;
    if (el) {
      if (speed != null && speed > 2 && heading != null) {
        el.innerHTML = `<svg class="live-location-arrow" viewBox="0 0 32 32" style="transform: rotate(${heading}deg)" xmlns="http://www.w3.org/2000/svg"><path d="M16 2 L26 28 L16 22 L6 28 Z" fill="hsl(210,85%,50%)" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
      } else if (!el.querySelector(".live-location-marker")) {
        el.innerHTML = '<div class="live-location-marker"></div>';
      }
    }

    const acc = map.getSource("accuracy-circle") as GeoJSONSource | undefined;
    if (acc) acc.setData(circlePolygon([longitude, latitude], accuracy ?? 0));

    const last = trailRef.current[trailRef.current.length - 1];
    if (!last || distance(last, [longitude, latitude]) >= 10) {
      trailRef.current.push([longitude, latitude]);
      if (trailRef.current.length > 500) trailRef.current.shift();
      const trail = map.getSource("trail") as GeoJSONSource | undefined;
      if (trail) {
        trail.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: trailRef.current },
        });
      }
    }

    if (autoCenter) {
      map.easeTo({ center: [longitude, latitude], duration: 500 });
    }
  }, [latitude, longitude, accuracy, speed, heading, autoCenter]);

  const recenter = () => {
    setAutoCenter(true);
    const map = mapRef.current;
    if (map && latitude != null && longitude != null) {
      map.flyTo({ center: [longitude, latitude], zoom: 17, duration: 800 });
    }
  };

  const cycleLayer = () => {
    setLayer((l) => (l === "light" ? "dark" : l === "dark" ? "satellite" : "light"));
  };

  const share = async () => {
    if (latitude == null || longitude == null) {
      toast.error("Sem posição ainda");
      return;
    }
    const text = `Minha localização: https://www.google.com/maps?q=${latitude},${longitude}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Minha Localização", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Link copiado");
      }
    } catch {
      /* user canceled */
    }
  };

  const addrLine = address
    ? [
        address.street && (address.number ? `${address.street}, ${address.number}` : address.street),
        address.neighborhood,
        address.city && address.state ? `${address.city}/${address.state}` : address.city ?? address.state,
      ]
        .filter(Boolean)
        .join(" — ")
    : null;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header
        className="relative px-5 pt-6 pb-5 text-brand-navy-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/inicio"
            className="rounded-lg p-1.5 -ml-1.5 hover:bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-6" />
          </Link>
          <button
            onClick={() => toggle(SLUG)}
            aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
            className="rounded-lg p-1.5 -mr-1.5 hover:bg-white/10"
          >
            <Star className={`size-6 ${fav ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-lg`}>
            <MapPin className="size-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Minha Localização</h1>
            <p className="text-xs text-white/70 mt-0.5">GPS em tempo real</p>
          </div>
        </div>
      </header>

      <main className="px-4 mt-4 space-y-4">
        <div className="relative h-[58vh] min-h-[360px] w-full overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)] bg-muted">
          <div ref={containerRef} className="absolute inset-0" />

          {/* Map controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={cycleLayer}
              className="rounded-xl bg-white/95 backdrop-blur p-2.5 shadow-md hover:bg-white"
              aria-label="Trocar camada do mapa"
              title={`Camada: ${layer}`}
            >
              <Layers className="size-5 text-foreground" />
            </button>
            <button
              onClick={recenter}
              className="rounded-xl bg-white/95 backdrop-blur p-2.5 shadow-md hover:bg-white"
              aria-label="Recentralizar"
            >
              <Crosshair className={`size-5 ${autoCenter ? "text-brand-blue" : "text-foreground"}`} />
            </button>
            <button
              onClick={share}
              className="rounded-xl bg-white/95 backdrop-blur p-2.5 shadow-md hover:bg-white"
              aria-label="Compartilhar"
            >
              <Share2 className="size-5 text-foreground" />
            </button>
          </div>

          {gpsDisabled && (
            <div className="absolute top-3 left-3 right-16 rounded-xl bg-destructive/95 px-3 py-2 text-sm text-destructive-foreground shadow-md">
              GPS desativado — ative no aparelho
            </div>
          )}
          {error && !gpsDisabled && (
            <div className="absolute top-3 left-3 right-16 rounded-xl bg-amber-500/95 px-3 py-2 text-sm text-white shadow-md">
              {error}{" "}
              <button onClick={startTracking} className="underline ml-1">
                tentar novamente
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Gauge} label="Velocidade" value={speed != null ? `${speed} km/h` : "--"} />
          <Stat icon={NavIcon} label="Precisão" value={accuracy != null ? `±${Math.round(accuracy)} m` : "--"} />
          <Stat icon={Compass} label="Direção" value={heading != null ? `${heading}°` : "--"} />
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-brand-blue/10">
              <MapPin className="size-5 text-brand-blue" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Endereço aproximado</p>
              <p className="mt-0.5 text-sm font-medium text-foreground break-words">
                {addrLine ?? (isGeocoding ? "Buscando endereço..." : "Aguardando posição...")}
              </p>
              {latitude != null && longitude != null && (
                <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-base font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
