import axios from 'axios';

// Simple Nominatim (OpenStreetMap) based search to avoid Google API key complexity for now.
// NOTE: Respect usage policy: add a custom User-Agent & optional email (via env VAR NOMINATIM_EMAIL)
export async function searchPlaces(query, { limit = 3 } = {}) {
  if (!query || query.length < 3) return [];
  const params = {
    q: query,
    format: 'json',
    addressdetails: 1,
    limit,
    extratags: 0
  };
  const headers = { 'User-Agent': `rapid-astrology-app/1.0 (${process.env.NOMINATIM_EMAIL || 'support@example.com'})` };
  const url = 'https://nominatim.openstreetmap.org/search';
  const { data } = await axios.get(url, { params, headers, timeout: 8000 });
  return data.map(item => ({
    name: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    country: item.address?.country,
    state: item.address?.state || item.address?.region,
    district: item.address?.city || item.address?.town || item.address?.village || item.address?.county
  }));
}
