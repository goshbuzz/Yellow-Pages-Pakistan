// Nearby — uses the device's real GPS location to rank businesses by distance.
// Falls back to a city picker when geolocation is denied/unavailable.

import { useEffect, useMemo, useState } from 'react';
import { MapPinned, Crosshair, MapPin } from 'lucide-react';
import { CITIES } from '../data/geo';
import { searchBusinesses } from '../lib/dataset';
import { CompanyCard } from '../components/CompanyCard';
import { SkeletonList, Chip, useToast } from '../components/ui';
import { CityPicker } from '../components/CityPicker';
import { CATEGORY_BY_ID } from '../data/categories';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const NEARBY_FAQS = [
  {
    q: 'How does the GPS Nearby locator find Pakistani businesses?',
    a: 'It uses your browser or smartphone geolocation coordinates to calculate real-time haversine distances to verified businesses, sorting the closest establishments first.',
  },
  {
    q: 'What happens if I decline GPS location permissions?',
    a: 'You can simply tap "Pick a city" to select any of the 420 Pakistani cities and browse businesses sorted by rating or category without sharing location coordinates.',
  },
  {
    q: 'Are the distance estimates accurate in Pakistani cities?',
    a: 'Distance is measured in direct kilometres/metres from your GPS fix to the verified latitude/longitude pin of each business.',
  },
  {
    q: 'Can I filter nearby listings by category like Food or Hospitals?',
    a: 'Yes. Once location is active, category filter chips appear above the results so you can filter for clinics, pharmacies, restaurants, or repair shops.',
  },
];

export default function Nearby() {
  const toast = useToast();
  const [mode, setMode] = useState('idle'); // idle | locating | gps | city
  const [pos, setPos] = useState(null);
  const [city, setCity] = useState(null);
  const [cat, setCat] = useState(null);
  const [items, setItems] = useState(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [denied, setDenied] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) { setDenied(true); return; }
    setMode('locating');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setMode('gps'); },
      () => { setMode('idle'); setDenied(true); toast('Location unavailable — pick a city instead', '📍'); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Load candidate pool once mode/cat known
  useEffect(() => {
    if (mode !== 'gps' && mode !== 'city') return;
    let alive = true;
    setItems(null);
    const cityName = mode === 'city' ? city : null;
    searchBusinesses({ q: '', cat: cat ? String(cat) : null, city: cityName, sort: 'rating', page: 1, perPage: 220 }).then((r) => {
      if (alive) setItems(r.rows);
    });
    return () => { alive = false; };
  }, [mode, cat, city, pos?.lat]);

  const ranked = useMemo(() => {
    if (!items || !pos) return items;
    return items
      .map((b) => ({ ...b, _d: haversine(pos.lat, pos.lng, b.lat, b.lng) }))
      .sort((a, b) => a._d - b._d);
  }, [items, pos]);

  const popularCats = useMemo(() => [89, 97, 53, 57, 30, 68, 101, 79].map((id) => CATEGORY_BY_ID[id]).filter(Boolean), []);
  const schema = makeFaqSchema(NEARBY_FAQS);

  return (
    <div className="animate-slide-up pb-8 space-y-4">
      <SeoHead
        title="Find Businesses Near Me (GPS Locator) | Yellow Pages PK"
        description="Locate verified Pakistani businesses closest to you via GPS. Find nearby restaurants, clinics, repair shops, and stores across Pakistan."
        canonicalPath="/nearby"
        schema={schema}
      />

      <div>
        <h1 className="font-black text-2xl text-ink">Nearby businesses 📍</h1>
        <p className="text-[13px] font-semibold text-stone-500 mt-0.5 mb-3">Real GPS ranking — or browse any city&apos;s map.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={locate} className={`tap h-10 rounded-full px-4 text-[13px] font-extrabold flex items-center gap-1.5 border ${mode === 'gps' ? 'bg-ink text-brand border-ink' : 'bg-white border-stone-300 text-ink'}`}>
          <Crosshair size={14} className={mode === 'locating' ? 'animate-spin' : ''} /> {mode === 'gps' ? 'Using my location' : 'Use my location'}
        </button>
        <button onClick={() => setCityPickerOpen(true)} className={`tap h-10 rounded-full px-4 text-[13px] font-extrabold flex items-center gap-1.5 border ${mode === 'city' ? 'bg-ink text-brand border-ink' : 'bg-white border-stone-300 text-ink'}`}>
          <MapPin size={14} /> {mode === 'city' ? city : 'Pick a city'}
        </button>
      </div>

      {mode === 'gps' && pos && (
        <p className="text-[11.5px] font-bold text-stone-400 mt-2">
          {pos.lat.toFixed(4)}°, {pos.lng.toFixed(4)}° · sorted by real distance
        </p>
      )}
      {denied && mode !== 'gps' && mode !== 'city' && (
        <p className="text-[12px] font-bold text-amber-700 bg-brand-soft/70 border border-brand/40 rounded-xl px-3 py-2 mt-3">
          Allow location access in your browser to rank by distance — or pick a city above. 🙏
        </p>
      )}

      {(mode === 'gps' || mode === 'city') && (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Chip active={!cat} onClick={() => setCat(null)}>All</Chip>
            {popularCats.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.emoji} {c.name.split(' ')[0]}</Chip>
            ))}
          </div>

          {!ranked ? (
            <div className="mt-4"><SkeletonList n={5} /></div>
          ) : (
            <div className="mt-4 space-y-3">
              {ranked.slice(0, 30).map((b) => (
                <div key={b.name + (b.__i ?? '')} className="relative">
                  <CompanyCard b={b} dense />
                  {b._d != null && (
                    <span className="absolute top-3 right-14 bg-ink/85 text-brand text-[10px] font-black px-2 py-0.5 rounded-full">
                      {b._d < 1 ? `${Math.round(b._d * 1000)} m` : `${b._d.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === 'idle' && (
        <div className="grid grid-cols-2 gap-2.5">
          {CITIES.slice(0, 10).map((c) => (
            <button key={c.name} onClick={() => { setCity(c.name); setMode('city'); }}
              className="tap bg-white/90 rounded-2xl border border-stone-200/80 p-3 text-left shadow-card">
              <p className="font-extrabold text-ink text-[14px] flex items-center gap-1.5"><MapPinned size={14} className="text-brand-deeper" /> {c.name}</p>
              <p className="text-[11px] font-bold text-stone-400 mt-0.5">{c.province}</p>
            </button>
          ))}
          <button onClick={() => setCityPickerOpen(true)} className="tap bg-ink text-brand rounded-2xl p-3 text-left shadow-card">
            <p className="font-extrabold text-[14px]">All {CITIES.length} cities →</p>
            <p className="text-[11px] font-bold text-brand/60 mt-0.5">Every province, AJK & GB</p>
          </button>
        </div>
      )}

      <CityPicker open={cityPickerOpen} value={mode === 'city' ? city : null}
        onSelect={(c) => { if (c) { setCity(c); setMode('city'); } setCityPickerOpen(false); }}
        onClose={() => setCityPickerOpen(false)} />

      <div className="mt-8 pt-4">
        <PageFaq
          title="Nearby Search FAQ"
          subtitle="How device geolocation and city sorting work."
          faqs={NEARBY_FAQS}
        />
      </div>
    </div>
  );
}
