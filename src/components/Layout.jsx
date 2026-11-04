// App shell: top app bar + bottom navigation + install sheet + dataset gate.
// Adapts dynamically between Website Home (pure marketing page) and Web App views.
// On wide screens the app becomes a dashboard: full-width content column plus a
// side column with stats and ad inventory; on phones it stays a single app column.

import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { Home, LayoutGrid, Search, Bookmark, MapPinned, Download, WifiOff, Globe, PlusCircle, MapPin, TrendingUp } from 'lucide-react';
import { Logo } from './icons';
import { ToastProvider, CountUp } from './ui';
import { InstallSheet, useInstallPrompt, useAutoInstallSheet } from './InstallSheet';
import { useDataset, useLiveCounts } from '../lib/dataset';
import { CITIES, slugify as citySlug } from '../data/geo';
import { CATEGORIES } from '../data/categories';
import { getLeads } from '../lib/leads';
import { BannerAd, NativeAd, OptionalAdScripts, ResponsiveBanner, SponsoredLink } from './ads/Ads';

function TopBar() {
  const { canInstall, isInstalled, openSheet } = useInstallPrompt();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-stone-200/70">
      <div className="max-w-[1240px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/app" className="tap" aria-label="Directory App Home"><Logo /></NavLink>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1 text-[11.5px] font-black text-stone-600 hover:text-amber-700 bg-stone-200/60 px-2.5 py-1 rounded-full transition-colors"
          >
            <Globe size={11} /> Website Home
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {!online && (
            <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-600 text-[10.5px] font-extrabold px-2 py-1 rounded-full">
              <WifiOff size={11} /> OFFLINE MODE
            </span>
          )}
          {!isInstalled && (
            <button onClick={openSheet} aria-label="Install app"
              className={`tap h-9 px-3 rounded-full text-[12.5px] font-extrabold flex items-center gap-1.5 ${canInstall ? 'bg-ink text-brand' : 'bg-brand-soft text-brand-deeper border border-brand/40'}`}>
              <Download size={14} /> <span className="hidden min-[420px]:inline">Install app</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const [leadCount, setLeadCount] = useState(() => getLeads().length);
  useEffect(() => {
    const sync = () => setLeadCount(getLeads().length);
    sync();
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('storage', sync); };
  }, [location.pathname]);
  const items = [
    { to: '/app', icon: Home, label: 'Home', end: true },
    { to: '/browse', icon: Search, label: 'Search' },
    { to: '/my-listings', icon: PlusCircle, label: 'Add', center: true },
    { to: '/leads', icon: Bookmark, label: 'Leads', badge: leadCount },
    { to: '/nearby', icon: MapPinned, label: 'Nearby' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe" aria-label="Main navigation">
      <div className="max-w-2xl mx-auto px-3 pb-2">
        <div className="bg-ink/95 backdrop-blur rounded-[26px] shadow-pop grid grid-cols-5 items-end pt-1.5 pb-1.5 relative">
          {items.map((it) => {
            const Icon = it.icon;
            if (it.center) {
              return (
                <NavLink key={it.to} to={it.to} aria-label={it.label} className="tap flex justify-center">
                  <span className="-mt-6 w-14 h-14 rounded-full bg-brand border-4 border-ink flex items-center justify-center shadow-pop">
                    <PlusCircle size={26} className="text-ink" strokeWidth={2.6} />
                  </span>
                </NavLink>
              );
            }
            return (
              <NavLink key={it.to} to={it.to} end={it.end}
                className={({ isActive }) => `tap flex flex-col items-center gap-0.5 py-1.5 rounded-2xl ${isActive ? 'text-brand' : 'text-stone-400'}`}>
                {({ isActive }) => (
                  <>
                    <span className={`relative ${isActive ? 'animate-wiggle' : ''}`}>
                      <Icon size={21} strokeWidth={isActive ? 2.7 : 2.1} />
                      {it.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 bg-brand text-ink text-[9.5px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-ink">
                          {it.badge > 99 ? '99+' : it.badge}
                        </span>
                      )}
                    </span>
                    <span className={`text-[9.5px] font-extrabold tracking-wide ${isActive ? '' : 'opacity-80'}`}>{it.label.toUpperCase()}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function DatasetGate({ children }) {
  const { ready, error } = useDataset();
  if (ready || error) return children;
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="animate-float"><Logo size={72} withWord={false} /></div>
      <p className="font-extrabold text-ink-soft text-sm animate-pulse">Loading directory…</p>
      <div className="w-44 h-2 rounded-full bg-stone-200 overflow-hidden">
        <div className="h-full w-1/2 bg-brand rounded-full skeleton" />
      </div>
    </div>
  );
}

// Wide-screen side column: live directory stats, ad inventory, city shortcuts.
// Hidden below xl — phones keep the single app column and the in-content banners.
function SideColumn() {
  const counts = useLiveCounts();
  const topCities = useMemo(
    () => [...CITIES].sort((a, b) => (counts.byCity[b.name] || 0) - (counts.byCity[a.name] || 0)).slice(0, 10),
    [counts]
  );
  return (
    <aside className="hidden xl:flex flex-col gap-4 sticky top-[4.5rem] self-start max-h-[calc(100dvh-6rem)] overflow-y-auto no-scrollbar pb-4">
      <div className="card card-pad">
        <p className="section-title">Directory stats</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-black text-ink leading-tight"><CountUp to={counts.total} /></p>
            <p className="text-[9.5px] font-extrabold tracking-wider text-stone-400">LISTINGS</p>
          </div>
          <div>
            <p className="text-lg font-black text-ink leading-tight"><CountUp to={CATEGORIES.length} /></p>
            <p className="text-[9.5px] font-extrabold tracking-wider text-stone-400">CATEGORIES</p>
          </div>
          <div>
            <p className="text-lg font-black text-ink leading-tight"><CountUp to={CITIES.length} /></p>
            <p className="text-[9.5px] font-extrabold tracking-wider text-stone-400">CITIES</p>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <p className="section-title flex items-center gap-1"><TrendingUp size={11} /> Top cities</p>
        <div className="flex flex-wrap gap-1.5">
          {topCities.map((c) => (
            <Link key={c.name} to={`/city/${citySlug(c.name)}`}
              className="tap inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-ink-soft hover:border-brand/60">
              <MapPin size={10} className="text-brand-deeper" /> {c.name}
              <span className="text-stone-400 font-bold">{counts.byCity[c.name] || 0}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Ad inventory — rendered at the full 300px column width so the 300×250
          placement actually fits its slot (card padding would shrink it). */}
      <div>
        <BannerAd format="rectangle" />
      </div>

      <div className="card card-pad">
        <p className="section-title">Own a business?</p>
        <p className="text-[12px] font-semibold text-stone-500 leading-relaxed">
          Get listed free — customers are searching this directory right now.
        </p>
        <Link to="/add" className="tap mt-3 inline-flex items-center justify-center gap-1.5 w-full min-h-[2.5rem] rounded-xl bg-ink text-brand font-black text-[12.5px]">
          <PlusCircle size={14} /> List my business
        </Link>
      </div>
    </aside>
  );
}

export default function Layout() {
  const location = useLocation();
  const { sheetOpen, closeSheet, dismiss, install, canInstall, isIOS: isIOSDevice, openSheet } = useInstallPrompt();
  useAutoInstallSheet(openSheet);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  const isWebsiteHome = location.pathname === '/';
  const showAds = location.pathname !== '/add' && location.pathname !== '/leads';

  // If pure Website Home page, render without app frame/bottom nav
  if (isWebsiteHome) {
    return (
      <ToastProvider>
        <div className="min-h-dvh flex flex-col">
          <OptionalAdScripts />
          <Outlet />
          <InstallSheet
            open={sheetOpen}
            onClose={closeSheet}
            onDismiss={dismiss}
            onInstall={install}
            canInstall={canInstall}
            isIOSDevice={isIOSDevice}
          />
        </div>
      </ToastProvider>
    );
  }

  // Otherwise, render full web app layout
  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-[#FFFBEF] relative">
        <OptionalAdScripts />
        <TopBar />
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 pt-5 pb-safe-nav">
          <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6 xl:items-start">
            <DatasetGate>
              <Outlet />
              {showAds && <>
                <ResponsiveBanner />
                <NativeAd />
                <SponsoredLink />
              </>}
            </DatasetGate>
            {showAds && <SideColumn />}
          </div>
        </main>
        <footer className="pb-safe-nav text-center -mt-6 pb-2">
          <NavLink to="/add" className="tap inline-block bg-brand text-ink font-black text-[12.5px] rounded-full px-4 py-2 shadow-card mb-2">
            + List your business — free
          </NavLink>
          <p className="text-[11px] font-semibold text-stone-400 mb-1">
            <Link to="/" className="hover:text-brand-deeper font-bold">Website</Link> ·
            {' '}<NavLink to="/categories" className="hover:text-brand-deeper">Categories</NavLink> ·
            {' '}<NavLink to="/cities" className="hover:text-brand-deeper">Cities</NavLink> ·
            {' '}<NavLink to="/my-listings" className="hover:text-brand-deeper">My listings</NavLink> ·
            {' '}<NavLink to="/coverage" className="hover:text-brand-deeper">Coverage</NavLink> ·
            {' '}<NavLink to="/faq" className="hover:text-brand-deeper">FAQ</NavLink>
          </p>
        </footer>
        <BottomNav />
        <InstallSheet
          open={sheetOpen}
          onClose={closeSheet}
          onDismiss={dismiss}
          onInstall={install}
          canInstall={canInstall}
          isIOSDevice={isIOSDevice}
        />
      </div>
    </ToastProvider>
  );
}
