// Geo integrity — is this coordinate inside Pakistan at all?
//
// Why this file exists: the directory published hospital listings whose map pins opened in
// Kenya, Nigeria, Egypt and London while the card said "Sahiwal". Nothing validated
// coordinates on the way in, and the detail page's "Open in Maps" link sent users abroad.
//
// Pakistan straddles roughly lat 23.5–37.1, lng 60.8–77.9 (Gwadar in the south-west,
// Khunjerab in the north-east). A pin outside that box cannot belong to a Pakistani
// business, so it is treated as **no location at all** rather than a wrong one: the map
// button hides itself, and importers reject the row.
//
// `cityForPoint` lives here too, because assigning a foreign pin to the nearest Pakistani
// city is precisely how a Nairobi hospital became a Sahiwal one.

export const PK_BOUNDS = {
  minLat: 23.4, maxLat: 37.2,
  minLng: 60.5, maxLng: 78.1,
};

/** Cheap rectangle test. Anything that fails it is not in Pakistan. */
export function inPakistan(lat, lng) {
  const la = Number(lat), ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (la === 0 && ln === 0) return false; // null-island placeholder
  return la >= PK_BOUNDS.minLat && la <= PK_BOUNDS.maxLat
    && ln >= PK_BOUNDS.minLng && ln <= PK_BOUNDS.maxLng;
}

/** Both coordinates present, finite and inside Pakistan. */
export function validPkPoint(lat, lng) {
  if (lat == null || lng == null || lat === '' || lng === '') return false;
  return inPakistan(lat, lng);
}

/** Great-circle distance in km. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Nearest city to a point, but only if that city is genuinely nearby.
 * Returns null beyond `maxKm`, so a foreign coordinate is never silently adopted by the
 * closest Pakistani town (Jiwani and Taftan, on the Iranian border, used to absorb most of
 * Africa and Europe).
 */
export function cityForPoint(lat, lng, cities, maxKm = 120) {
  if (!inPakistan(lat, lng)) return null;
  let best = null, bestD = Infinity;
  for (const c of cities) {
    const d = haversineKm(c.lat, c.lng, lat, lng);
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD <= maxKm ? best : null;
}
