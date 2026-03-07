/**
 * Booth Data Service — Kottayam District (LACs 93–101)
 * ─────────────────────────────────────────────────────
 * Loads official polling station records for all 9 LACs in Kottayam district.
 * Provides:
 *   - Full-text fuzzy search by area, name, landmark, station number
 *   - GPS coordinate extraction for Google Maps links (LAC 97 has GPS)
 *   - LAC-aware filtering and display
 *   - Malayalam + English content
 *   - BM25-style search for direct queries
 */

import kottayamData from '@/../kottayam_booth_data.json';
import ettumanoorData from '@/../ettumanoor_booth_data.json';
import puthuppallyData from '@/../puthuppally_booth_data.json';
import changanasseryData from '@/../changanassery_booth_data.json';
import kanjirappally_data from '@/../kanjirappally_booth_data.json';
import palaData from '@/../pala_booth_data.json';
import kaduthuruthyData from '@/../kaduthuruthy_booth_data.json';
import vaikomData from '@/../vaikom_booth_data.json';
import erattupettaData from '@/../erattupetta_booth_data.json';

// ── LAC metadata ─────────────────────────────────────────────────

export interface LACInfo {
  lacNumber: number;
  nameEn: string;
  nameMl: string;
}

export const LAC_REGISTRY: Record<number, LACInfo> = {
  93:  { lacNumber: 93,  nameEn: 'Ettumanoor',    nameMl: 'എറ്റുമാനൂർ' },
  94:  { lacNumber: 94,  nameEn: 'Puthuppally',   nameMl: 'പുതുപ്പള്ളി' },
  95:  { lacNumber: 95,  nameEn: 'Changanassery',  nameMl: 'ചങ്ങനാശ്ശേരി' },
  96:  { lacNumber: 96,  nameEn: 'Kanjirappally',  nameMl: 'കാഞ്ഞിരപ്പള്ളി' },
  97:  { lacNumber: 97,  nameEn: 'Kottayam',      nameMl: 'കോട്ടയം' },
  98:  { lacNumber: 98,  nameEn: 'Pala',           nameMl: 'പാലാ' },
  99:  { lacNumber: 99,  nameEn: 'Kaduthuruthy',   nameMl: 'കടുത്തുരുത്തി' },
  100: { lacNumber: 100, nameEn: 'Vaikom',         nameMl: 'വൈക്കം' },
  101: { lacNumber: 101, nameEn: 'Erattupetta',    nameMl: 'ഈരാറ്റുപേട്ട' },
};

const LAC_DATA_MAP: Record<number, unknown[]> = {
  93:  ettumanoorData as unknown[],
  94:  puthuppallyData as unknown[],
  95:  changanasseryData as unknown[],
  96:  kanjirappally_data as unknown[],
  97:  kottayamData as unknown[],
  98:  palaData as unknown[],
  99:  kaduthuruthyData as unknown[],
  100: vaikomData as unknown[],
  101: erattupettaData as unknown[],
};

// ── Types ────────────────────────────────────────────────────────

export interface BoothRecord {
  id: string;
  stationNumber: number;
  title: string;
  content: string;
  contentMl: string;
  source: string;
  sourceUrl: string;
  tags: string[];
  /** LAC number (93–101) */
  lacNumber: number;
  /** LAC name in English */
  lacNameEn: string;
  /** LAC name in Malayalam */
  lacNameMl: string;
  /** Latitude (decimal degrees) — 0 if unavailable */
  lat: number;
  /** Longitude (decimal degrees) — 0 if unavailable */
  lng: number;
  /** Landmark near the polling station */
  landmark: string;
  /** Area/sector name in Malayalam */
  areaMl: string;
}

// ── Parse raw JSON into typed records ────────────────────────────

function parseCoordinates(content: string): { lat: number; lng: number } {
  // Pattern: "located at 9.6384 N, 76.5367 E"
  const match = content.match(/([\d.]+)\s*N,?\s*([\d.]+)\s*E/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return { lat: 0, lng: 0 };
}

function parseLandmark(content: string): string {
  // Pattern: "identified by the landmark: Near Hotel Excalibur, Thellakom"
  const match = content.match(/landmark:\s*([^.]+)/i);
  return match ? match[1].trim() : '';
}

function parseLACFromTags(tags: (string | number)[]): number {
  for (const tag of tags) {
    const tagStr = String(tag);
    const m = tagStr.match(/^LAC\s*(\d+)$/i);
    if (m) return parseInt(m[1], 10);
  }
  return 0;
}

let _booths: BoothRecord[] | null = null;

export function getAllBooths(lacFilter?: number): BoothRecord[] {
  if (!_booths) {
    _booths = [];
    for (const [lacNumStr, rawData] of Object.entries(LAC_DATA_MAP)) {
      const lacNum = parseInt(lacNumStr, 10);
      const lacInfo = LAC_REGISTRY[lacNum];
      if (!lacInfo) continue;

      const records = (rawData as Array<{
        id: string;
        title: string;
        content: string;
        content_ml: string;
        source: string;
        source_url: string;
        tags: (string | number)[];
      }>).map((raw) => {
        const coords = parseCoordinates(raw.content);
        const stationNumber = typeof raw.tags[0] === 'number' ? raw.tags[0] : parseInt(String(raw.tags[0]), 10);
        const detectedLac = parseLACFromTags(raw.tags) || lacNum;
        const lac = LAC_REGISTRY[detectedLac] || lacInfo;

        return {
          id: raw.id,
          stationNumber,
          title: raw.title,
          content: raw.content,
          contentMl: raw.content_ml,
          source: raw.source,
          sourceUrl: raw.source_url,
          tags: raw.tags.map(String),
          lacNumber: lac.lacNumber,
          lacNameEn: lac.nameEn,
          lacNameMl: lac.nameMl,
          lat: coords.lat,
          lng: coords.lng,
          landmark: parseLandmark(raw.content),
          areaMl: typeof raw.tags[3] === 'string' ? raw.tags[3] : '',
        };
      });
      _booths.push(...records);
    }
  }

  if (lacFilter !== undefined) {
    return _booths.filter((b) => b.lacNumber === lacFilter);
  }
  return _booths;
}

/** Get total booth count across all LACs or for a specific LAC */
export function getBoothCount(lacFilter?: number): number {
  return getAllBooths(lacFilter).length;
}

/** Get summary of all LACs with their booth counts */
export function getLACSummary(): Array<LACInfo & { boothCount: number }> {
  const booths = getAllBooths();
  return Object.values(LAC_REGISTRY).map((lac) => ({
    ...lac,
    boothCount: booths.filter((b) => b.lacNumber === lac.lacNumber).length,
  }));
}

// ── Google Maps URL ──────────────────────────────────────────────

export function getGoogleMapsUrl(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${q}`;
}

export function getGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// ── Search booths ────────────────────────────────────────────────

/**
 * Search booths by query string. Uses multi-signal scoring:
 *   - Exact station number match (highest priority)
 *   - LAC name match (filters or boosts)
 *   - Title / area name match
 *   - Landmark match
 *   - Tag match (includes Malayalam area names)
 *   - BM25-style content match
 */
export function searchBooths(query: string, maxResults = 5, lacFilter?: number): BoothRecord[] {
  const booths = getAllBooths(lacFilter);
  const lowerQuery = query.toLowerCase().trim();

  // Check for station number query (e.g., "booth 5", "station 42", "booth number is 133", "ബൂത്ത് 133")
  const numberMatch = lowerQuery.match(/(?:booth|station|polling\s*station)\s*(?:number\s*(?:is\s*)?)?(\ d+)/i)
    || lowerQuery.match(/(?:number|no\.?|#)\s*(?:is\s*)?(\d+)/i)
    || lowerQuery.match(/^(\d{1,3})$/)
    || query.match(/(?:ബൂത്ത്|നമ്പർ|പോളിംഗ്|പോളിങ്|സ്റ്റേഷൻ)\s*(?:നമ്പർ\s*)?(?:ആണ്\s*)?(\d+)/i)
    || query.match(/(\d+)\s*(?:ആണ്|ആണ)\s*$/i);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    const exact = booths.filter((b) => b.stationNumber === num);
    if (exact.length > 0) return exact.slice(0, maxResults);
  }

  // Score each booth
  const scored = booths.map((booth) => {
    let score = 0;
    const titleLower = booth.title.toLowerCase();
    const landmarkLower = booth.landmark.toLowerCase();
    const tagsLower = booth.tags.map((t) => t.toLowerCase());
    const contentLower = booth.content.toLowerCase();

    // Query terms
    const queryTerms = lowerQuery.split(/\s+/).filter((t) => t.length > 2);

    // Title match (high weight)
    if (titleLower.includes(lowerQuery)) score += 10;
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 3;
    }

    // Landmark match
    if (landmarkLower.includes(lowerQuery)) score += 8;
    for (const term of queryTerms) {
      if (landmarkLower.includes(term)) score += 2;
    }

    // Tag match (includes Malayalam area names like "മുടിയൂർക്കര")
    for (const tag of tagsLower) {
      if (tag.includes(lowerQuery)) score += 7;
      for (const term of queryTerms) {
        if (tag.includes(term)) score += 2;
      }
    }

    // Malayalam area match
    if (booth.areaMl && query.includes(booth.areaMl)) score += 9;

    // Content BM25-style
    for (const term of queryTerms) {
      const count = (contentLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += count * 0.5;
    }

    return { booth, score };
  });

  // Sort by score descending and return top results
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, maxResults)
    .map((s) => s.booth);
}

/**
 * Format a booth result as a human-readable string with map link.
 */
export function formatBoothResult(booth: BoothRecord, locale: 'en' | 'ml'): string {
  const hasGps = booth.lat > 0 && booth.lng > 0;
  const mapsUrl = hasGps ? getGoogleMapsDirectionsUrl(booth.lat, booth.lng) : '';
  const lacLabel = `LAC ${booth.lacNumber}-${locale === 'ml' ? booth.lacNameMl : booth.lacNameEn}`;

  if (locale === 'ml') {
    let result = `**പോളിംഗ് സ്റ്റേഷൻ ${booth.stationNumber}** — ${booth.title}
- **നിയോജകമണ്ഡലം:** ${lacLabel}`;
    if (booth.landmark) result += `\n- **ലാൻഡ്‌മാർക്ക്:** ${booth.landmark}`;
    if (hasGps) {
      result += `\n- **GPS:** ${booth.lat}°N, ${booth.lng}°E`;
      result += `\n- [Google Maps-ൽ വഴി കാണുക](${mapsUrl})`;
    }
    return result;
  }

  let result = `**Polling Station ${booth.stationNumber}** — ${booth.title}
- **Constituency:** ${lacLabel}`;
  if (booth.landmark) result += `\n- **Landmark:** ${booth.landmark}`;
  if (hasGps) {
    result += `\n- **GPS:** ${booth.lat}°N, ${booth.lng}°E`;
    result += `\n- [Get Directions](${mapsUrl})`;
  }
  return result;
}

// ── GPS-based nearest booth search (Haversine) ────────────────────

/**
 * Haversine distance in kilometers between two GPS coordinates.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest polling booths by GPS coordinates.
 * Only considers booths that have valid GPS data (lat/lng > 0).
 * Returns booths sorted by distance, with distance in km attached.
 */
export function searchNearestBooths(
  lat: number,
  lng: number,
  maxResults = 5,
  maxDistanceKm = 10
): Array<BoothRecord & { distanceKm: number }> {
  const booths = getAllBooths();

  const withDistance = booths
    .filter((b) => b.lat > 0 && b.lng > 0) // Only booths with valid GPS
    .map((booth) => ({
      ...booth,
      distanceKm: haversineDistance(lat, lng, booth.lat, booth.lng),
    }))
    .filter((b) => b.distanceKm <= maxDistanceKm) // Within max radius
    .sort((a, b) => a.distanceKm - b.distanceKm); // Closest first

  return withDistance.slice(0, maxResults);
}

/**
 * Format a nearest booth result with distance info.
 */
export function formatNearestBoothResult(
  booth: BoothRecord & { distanceKm: number },
  locale: 'en' | 'ml'
): string {
  const hasGps = booth.lat > 0 && booth.lng > 0;
  const mapsUrl = hasGps ? getGoogleMapsDirectionsUrl(booth.lat, booth.lng) : '';
  const distStr = booth.distanceKm < 1
    ? `${Math.round(booth.distanceKm * 1000)}m`
    : `${booth.distanceKm.toFixed(1)}km`;
  const lacLabel = `LAC ${booth.lacNumber}-${locale === 'ml' ? booth.lacNameMl : booth.lacNameEn}`;

  if (locale === 'ml') {
    let result = `**പോളിംഗ് സ്റ്റേഷൻ ${booth.stationNumber}** — ${booth.title}
- **ദൂരം:** 📍 ${distStr}
- **നിയോജകമണ്ഡലം:** ${lacLabel}`;
    if (booth.landmark) result += `\n- **ലാൻഡ്‌മാർക്ക്:** ${booth.landmark}`;
    if (hasGps) {
      result += `\n- **GPS:** ${booth.lat}°N, ${booth.lng}°E`;
      result += `\n- [Google Maps-ൽ വഴി കാണുക](${mapsUrl})`;
    }
    return result;
  }

  let result = `**Polling Station ${booth.stationNumber}** — ${booth.title}
- **Distance:** 📍 ${distStr}
- **Constituency:** ${lacLabel}`;
  if (booth.landmark) result += `\n- **Landmark:** ${booth.landmark}`;
  if (hasGps) {
    result += `\n- **GPS:** ${booth.lat}°N, ${booth.lng}°E`;
    result += `\n- [Get Directions](${mapsUrl})`;
  }
  return result;
}
