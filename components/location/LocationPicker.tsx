"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { MapPin, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Leaflet requires browser APIs — load only on client
const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export interface LocationValue {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface LocationPickerProps {
  value?: LocationValue;
  onChange: (value: LocationValue) => void;
  placeholder?: string;
  className?: string;
}

// Default center: Ghana (meaningful for the project context)
const DEFAULT_CENTER: [number, number] = [7.9465, -1.0232];
const DEFAULT_ZOOM = 6;

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search or click the map…",
  className,
}: LocationPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [query, setQuery] = useState(value?.address ?? "");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const marker: [number, number] | null =
    value?.lat != null && value?.lng != null
      ? [value.lat, value.lng]
      : null;

  const center: [number, number] = marker ?? DEFAULT_CENTER;
  const zoom = marker ? 10 : DEFAULT_ZOOM;

  // Reverse geocode after map click
  const handleMapPick = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
          { headers: { "User-Agent": "LotsuFamilyTree/1.0" } }
        );
        const data: { display_name?: string } = await res.json();
        const address = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setQuery(address);
        setSuggestions([]);
        onChange({ address, lat, lng });
      } catch {
        const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setQuery(address);
        onChange({ address, lat, lng });
      } finally {
        setIsGeocoding(false);
      }
    },
    [onChange]
  );

  // Forward geocode (search suggestions)
  function handleQueryChange(q: string) {
    setQuery(q);
    if (!q.trim()) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=en`,
          { headers: { "User-Agent": "LotsuFamilyTree/1.0" } }
        );
        const results: NominatimResult[] = await res.json();
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  }

  function selectSuggestion(s: NominatimResult) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setQuery(s.display_name);
    setSuggestions([]);
    onChange({ address: s.display_name, lat, lng });
  }

  function clearLocation() {
    setQuery("");
    setSuggestions([]);
    onChange({ address: "", lat: null, lng: null });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={placeholder}
              className="h-11 rounded-xl pr-8"
            />
            {isGeocoding && (
              <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {query && !isGeocoding && (
              <button
                type="button"
                onClick={clearLocation}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant={showMap ? "default" : "outline"}
            size="icon"
            className="h-11 w-11 rounded-xl flex-shrink-0"
            onClick={() => setShowMap((v) => !v)}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="line-clamp-2">{s.display_name}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable map */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 268 }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-border"
          >
            <LocationPickerMap
              center={center}
              zoom={zoom}
              marker={marker}
              onPick={handleMapPick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coordinates indicator */}
      {value?.lat != null && value?.lng != null && (
        <p className="text-xs text-muted-foreground font-mono">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function MapSkeleton() {
  return (
    <div className="h-[260px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <MapPin className="w-6 h-6 text-muted-foreground/40" />
    </div>
  );
}
