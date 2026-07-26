import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Star,
  Maximize2,
  SunMedium,
  LocateFixed,
  Share2,
  MoreHorizontal,
  Gauge,
  Navigation2,
  Crosshair,
  MapPin,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import type { StyleSpecification, GeoJSONSource } from "maplibre-gl";
import { getTool } from "@/lib/tools";
import { BottomNav } from "@/components/bottom-nav";
import { useFavorites, useHistory } from "@/hooks/use-local-list";
import { useLiveLocation } from "@/hooks/use-live-location";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const SLUG = "minha-localizacao";

export const Route = createFileRoute("/ferramenta/minha-localizacao")({
  head: () => ({
    meta: [
      { title: "Minha Localização — MIKE TOOLS" },
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

function cardinal(heading: number | null): string {
  if (heading == null) return "--";
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round((heading % 360) / 45) % 8];
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
  const maxSpeedRef = useRef<number>(0);

  const [layer, setLayer] = useState<MapLayer>("light");
  const [autoCenter, setAutoCenter] = useState(true);
  const [ready, setReady] = useState(false);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [showTrail, setShowTrail] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

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
      if (map.getLayer("trail-line")) {
        map.setLayoutProperty(
          "trail-line",
          "visibility",
          showTrail ? "visible" : "none",
        );
      }
    });
  }, [layer, ready, longitude, latitude, accuracy, showTrail]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (map.getLayer("trail-line")) {
      map.setLayoutProperty(
        "trail-line",
        "visibility",
        showTrail ? "visible" : "none",
      );
    }
  }, [showTrail, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    markerRef.current?.setLngLat([longitude, latitude]);

    const el = markerElRef.current;
    if (el) {
      if (speed != null && speed > 2 && heading != null) {
        el.innerHTML = `<svg class="live-location-arrow" viewBox="0 0 32 32" style="transform: rotate(${heading}deg)" xmlns="http://www.w3.org/2000/svg"><path d="M16 2 L26 28 L16 22 L6 28 Z" fill="hsl(210,85%,50%)" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
      } else if (!el.querySelector(".live-location-marker")) {
        el.innerHTML = '<div class="live-location-marker"></div>';
      }
    }

    if (speed != null && speed > maxSpeedRef.current) {
      maxSpeedRef.current = speed;
      setMaxSpeed(speed);
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

  const clearTrail = () => {
    trailRef.current = [];
    const map = mapRef.current;
    const trail = map?.getSource("trail") as GeoJSONSource | undefined;
    if (trail) {
      trail.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      });
    }
    toast.success("Trilha limpa");
  };

  const copyCoords = async () => {
    if (latitude == null || longitude == null) {
      toast.error("Sem posição ainda");
      return;
    }
    try {
      await navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      toast.success("Coordenadas copiadas");
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const openInMaps = () => {
    if (latitude == null || longitude == null) return;
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank");
  };

  const addrPrimary = address?.street
    ? address.number
      ? `${address.street}, ${address.number}`
      : address.street
    : null;
  const addrSecondary = address
    ? [
        address.neighborhood,
        address.city && address.state
          ? `${address.city} — ${address.state}`
          : address.city ?? address.state,
      ]
        .filter(Boolean)
        .join(" — ")
    : null;

  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      {!fullscreen && (
        <header
          className="relative px-4 pt-4 pb-3 text-brand-navy-foreground shrink-0"
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
            <div className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-xl bg-gradient-to-br ${tool.gradient}`}
              >
                <MapPin className="size-4 text-white" strokeWidth={2.4} />
              </div>
              <span className="text-base font-bold tracking-wide">SENTINELA</span>
            </div>
            <button
              onClick={() => toggle(SLUG)}
              aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
              className="rounded-lg p-1.5 -mr-1.5 hover:bg-white/10"
            >
              <Star
                className={`size-6 ${fav ? "fill-amber-400 text-amber-400" : ""}`}
              />
            </button>
          </div>
        </header>
      )}

      <main className="relative flex-1 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Floating address card */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-10">
          <div className="pointer-events-auto rounded-2xl border-l-4 border-brand-blue bg-brand-navy/90 backdrop-blur-md shadow-xl px-4 py-3 flex items-start gap-3">
            <MapPin
              className="size-7 text-brand-blue shrink-0 mt-0.5"
              strokeWidth={2.4}
            />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-white leading-tight truncate">
                {addrPrimary ??
                  (isGeocoding ? "Buscando endereço..." : "Aguardando GPS...")}
              </p>
              {addrSecondary && (
                <p className="text-xs text-white/70 mt-0.5 truncate">
                  {addrSecondary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* GPS / error banner */}
        {gpsDisabled && (
          <div className="absolute top-24 left-3 right-3 z-10 rounded-xl bg-destructive/95 px-3 py-2 text-sm text-destructive-foreground shadow-md">
            GPS desativado — ative no aparelho
          </div>
        )}
        {error && !gpsDisabled && (
          <div className="absolute top-24 left-3 right-3 z-10 rounded-xl bg-amber-500/95 px-3 py-2 text-sm text-white shadow-md">
            {error}{" "}
            <button onClick={startTracking} className="underline ml-1">
              tentar novamente
            </button>
          </div>
        )}

        {/* Bottom-left controls */}
        <div className="absolute bottom-24 left-3 z-10 flex items-center gap-2">
          <button
            onClick={() => setFullscreen((v) => !v)}
            className="size-11 rounded-full bg-brand-navy/85 backdrop-blur-md shadow-lg flex items-center justify-center text-white hover:bg-brand-navy"
            aria-label="Tela cheia"
          >
            <Maximize2 className="size-5" />
          </button>
          <button
            onClick={cycleLayer}
            className="size-11 rounded-full bg-brand-navy/85 backdrop-blur-md shadow-lg flex items-center justify-center text-white hover:bg-brand-navy"
            aria-label={`Camada: ${layer}`}
            title={`Camada: ${layer}`}
          >
            <SunMedium className="size-5" />
          </button>
        </div>

        {/* Bottom-right recenter */}
        <button
          onClick={recenter}
          className={`absolute bottom-24 right-3 z-10 size-14 rounded-full shadow-xl flex items-center justify-center transition-transform active:scale-95 ${
            autoCenter ? "bg-brand-blue text-white" : "bg-white text-brand-blue"
          }`}
          aria-label="Recentralizar"
        >
          <LocateFixed className="size-6" strokeWidth={2.4} />
        </button>

        {/* Bottom stats bar */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="rounded-2xl bg-brand-navy/85 backdrop-blur-md shadow-xl px-3 py-2.5 flex items-center gap-2 text-white text-sm">
            <div className="flex items-center gap-1.5 tabular-nums">
              <Gauge className="size-4 text-brand-blue" />
              <span className="font-bold">{speed != null ? speed : 0}</span>
              <span className="text-[10px] text-white/60">km/h</span>
              <span className="text-[10px] text-white/40">
                /{Math.round(maxSpeed)}
              </span>
            </div>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1">
              <Navigation2
                className="size-4 text-rose-400"
                style={{
                  transform: heading != null ? `rotate(${heading}deg)` : undefined,
                }}
              />
              <span className="font-semibold text-xs">{cardinal(heading)}</span>
            </div>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1">
              <Crosshair className="size-4 text-white/70" />
              <span className="text-xs tabular-nums">
                ±{accuracy != null ? Math.round(accuracy) : "--"}m
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={share}
                className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-semibold"
              >
                <Share2 className="size-3.5" />
                Enviar
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="size-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                    aria-label="Mais opções"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-56">
                  <DropdownMenuItem onClick={() => setShowTrail((v) => !v)}>
                    {showTrail ? (
                      <EyeOff className="size-4 mr-2" />
                    ) : (
                      <Eye className="size-4 mr-2" />
                    )}
                    {showTrail ? "Ocultar trilha" : "Mostrar trilha"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearTrail}>
                    <Trash2 className="size-4 mr-2" />
                    Limpar trilha
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={copyCoords}>
                    <Copy className="size-4 mr-2" />
                    Copiar coordenadas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openInMaps}>
                    <ExternalLink className="size-4 mr-2" />
                    Abrir no Google Maps
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
