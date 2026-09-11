// Install prompt — captures beforeinstallprompt, shows a playful bottom sheet,
// with iOS Safari "Add to Home Screen" fallback instructions.

import { useCallback, useEffect, useState } from 'react';
import { Download, Share2, Plus, X } from 'lucide-react';
import { Logo } from './icons';
import { getPrefs, setPref } from '../lib/leads';

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
export function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const dismiss = useCallback(() => {
    setSheetOpen(false);
    setPref('installDismissedAt', Date.now());
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setPref('installDismissedAt', 9e15); // never auto-ask again
      setDeferred(null);
    }
    setSheetOpen(false);
  }, [deferred]);

  const canInstall = !!deferred;
  return { canInstall, isInstalled: isStandalone(), sheetOpen, openSheet, closeSheet, dismiss, install, isIOS: isIOS() };
}

export function InstallSheet({ open, onClose, onDismiss, onInstall, canInstall, isIOSDevice }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center" role="dialog" aria-label="Install app">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-cream rounded-t-[28px] p-5 pb-8 animate-slide-up shadow-pop">
        <button onClick={onClose} aria-label="Close" className="tap absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center">
          <X size={16} />
        </button>
        <div className="flex items-start gap-4 mt-1">
          <div className="animate-wiggle"><Logo size={62} withWord={false} /></div>
          <div className="pt-1">
            <h3 className="font-black text-xl text-ink leading-tight">Install the app 📲</h3>
            <p className="text-sm text-stone-600 font-medium mt-0.5">Works offline · No Play Store needed · Takes 5 seconds</p>
          </div>
        </div>

        <ul className="my-4 space-y-2">
          {[
            ['⚡', 'Instant search across 200,000 listings — even with no internet'],
            ['🎯', 'One-tap call, WhatsApp & Google Maps directions'],
            ['🔖', 'Lead lists + CSV export — your outreach kit in your pocket'],
            ['🚫', 'No ads, no clutter, no tracking'],
          ].map(([e, t]) => (
            <li key={t} className="flex items-center gap-3 bg-white/80 rounded-2xl px-3.5 py-2.5 border border-stone-200/70">
              <span className="text-xl">{e}</span>
              <span className="text-[13.5px] font-semibold text-ink-soft">{t}</span>
            </li>
          ))}
        </ul>

        {canInstall ? (
          <button
            onClick={onInstall}
            className="tap w-full bg-ink text-brand font-black text-[15px] rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-pop active:translate-y-0.5"
          >
            <Download size={18} /> Install Yellow Pages PK
          </button>
        ) : isIOSDevice ? (
          <div className="bg-brand-soft/70 border border-brand/40 rounded-2xl p-4 text-sm font-semibold text-ink-soft leading-relaxed">
            On iPhone / iPad:<br />
            1. Tap the <Share2 size={14} className="inline mx-0.5" /> <b>Share</b> button in Safari<br />
            2. Choose <Plus size={14} className="inline mx-0.5" /> <b>Add to Home Screen</b><br />
            3. Tap <b>Add</b> — done! 🎉
          </div>
        ) : (
          <div className="bg-brand-soft/70 border border-brand/40 rounded-2xl p-4 text-sm font-semibold text-ink-soft leading-relaxed">
            In your browser menu (⋮), choose <b>“Install app”</b> or <b>“Add to Home screen”</b> 🎉
          </div>
        )}
        <button onClick={onDismiss} className="w-full text-center text-[13px] font-bold text-stone-400 mt-3">Maybe later</button>
      </div>
    </div>
  );
}

// Auto-show once per week (unless installed or dismissed recently)
export function useAutoInstallSheet(openSheet) {
  useEffect(() => {
    if (isStandalone()) return;
    const t = setTimeout(() => {
      const dismissedAt = getPrefs().installDismissedAt || 0;
      if (Date.now() - dismissedAt > 7 * 24 * 3600 * 1000) openSheet();
    }, 9000);
    return () => clearTimeout(t);
  }, [openSheet]);
}
