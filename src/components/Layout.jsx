// App shell: top app bar + bottom navigation + install sheet + dataset gate.
// Adapts dynamically between Website Home (pure marketing page) and Web App views.

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { Home, LayoutGrid, Search, Bookmark, MapPinned, Download, WifiOff, Globe } from 'lucide-react';
import { Logo } from './icons';
import { ToastProvider } from './ui';
import { InstallSheet, useInstallPrompt, useAutoInstallSheet } from './InstallSheet';
import { useDataset } from '../lib/dataset';
import { getLeads } from '../lib/leads';

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
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
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
  const leadCount = getLeads().length;
  const items = [
    { to: '/app', icon: Home, label: 'App', end: true },
    { to: '/categories', icon: LayoutGrid, label: 'Categories' },
    { to: '/browse', icon: Search, label: 'Search', center: true },
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
                    <Icon size={24} className="text-ink" strokeWidth={2.6} />
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
      <p className="font-extrabold text-ink-soft text-sm animate-pulse">Loading 200,000 businesses…</p>
      <div className="w-44 h-2 rounded-full bg-stone-200 overflow-hidden">
        <div className="h-full w-1/2 bg-brand rounded-full skeleton" />
      </div>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const { sheetOpen, closeSheet, dismiss, install, canInstall, isIOS: isIOSDevice, openSheet } = useInstallPrompt();
  useAutoInstallSheet(openSheet);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  const isWebsiteHome = location.pathname === '/';

  // If pure Website Home page, render without app frame/bottom nav
  if (isWebsiteHome) {
    return (
      <ToastProvider>
        <div className="min-h-dvh flex flex-col">
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
      <div className="min-h-dvh flex flex-col bg-[#FFFBEF]">
        <TopBar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 pb-safe-nav">
          <DatasetGate>
            <Outlet />
          </DatasetGate>
        </main>
        <footer className="pb-safe-nav text-center -mt-6 pb-2">
          <NavLink to="/add" className="tap inline-block bg-brand text-ink font-black text-[12.5px] rounded-full px-4 py-2 shadow-card mb-2">
            + List your business — free
          </NavLink>
          <p className="text-[11px] font-semibold text-stone-400 mb-1">
            <Link to="/" className="hover:text-brand-deeper font-bold">Website</Link> · <NavLink to="/faq" className="hover:text-brand-deeper">FAQ</NavLink> · Yellow Pages Pakistan · 200,000+ listings
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
