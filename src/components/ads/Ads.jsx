import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AD_HOST, BANNERS, NATIVE_KEY, SMART_LINK, OPTIONAL_SCRIPTS, bannerDocument } from '../../lib/ads';

const enabled = import.meta.env.VITE_ADSTERRA_ENABLED !== 'false';

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

// Load only when the placement fits AND is close to the viewport. Hidden
// desktop inventory must never make ad requests on a phone.
function useVisibleAd(ref, minWidth = 0, maxWidth = Infinity) {
  const online = useOnline();
  const [fits, setFits] = useState(false);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const measure = () => {
      const width = node.getBoundingClientRect().width;
      setFits(width >= minWidth && width <= maxWidth && width > 0);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true);
    }, { rootMargin: '200px' });
    observer.observe(node);
    return () => { resize.disconnect(); observer.disconnect(); };
  }, [ref, minWidth, maxWidth]);
  return enabled && online && fits && near;
}

export function BannerAd({ format = 'rectangle' }) {
  const ref = useRef(null);
  const ad = BANNERS[format];
  const active = useVisibleAd(ref, ad.width);
  if (!enabled) return null;
  return (
    <aside ref={ref} className={`ad-slot ad-slot--${format}`} aria-label="Advertisement">
      <span className="ad-label">Advertisement</span>
      <div className="ad-frame-space" style={{ width: ad.width, height: ad.height }}>
        {active && <iframe title={`Advertisement (${ad.width} × ${ad.height})`}
          width={ad.width} height={ad.height} scrolling="no" frameBorder="0"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin" srcDoc={bannerDocument(ad)} />}
      </div>
    </aside>
  );
}

export function ResponsiveBanner() {
  return <div className="ad-responsive">
    <div className="ad-mobile"><BannerAd format="mobile" /></div>
    <div className="ad-medium"><BannerAd format="banner" /></div>
    <div className="ad-wide"><BannerAd format="leaderboard" /></div>
  </div>;
}

export function NativeAd() {
  const ref = useRef(null);
  const active = useVisibleAd(ref, 1);
  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current;
    // Defer one task so StrictMode's rehearsal cannot send duplicate requests.
    const timer = setTimeout(() => {
      const container = document.createElement('div');
      container.id = `container-${NATIVE_KEY}`;
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = 'false';
      script.src = `${AD_HOST}/${NATIVE_KEY}/invoke.js`;
      node.append(container, script);
    }, 0);
    return () => { clearTimeout(timer); node.replaceChildren(); };
  }, [active]);
  if (!enabled) return null;
  return <aside className="ad-native" aria-label="Sponsored recommendations">
    <span className="ad-label">Advertisement · Sponsored recommendations</span>
    <div ref={ref} className="ad-native-content" />
  </aside>;
}

export function SponsoredLink() {
  if (!enabled) return null;
  return <div className="ad-smart-link"><a href={SMART_LINK} target="_blank" rel="sponsored nofollow noopener noreferrer">
    Explore sponsored offers <span aria-hidden="true">↗</span>
    <span className="ad-label">Advertisement · Opens a new tab</span>
  </a></div>;
}

// Unidentified standalone formats are opt-in: they may install page-level
// handlers. Load each at most once per document, not on every SPA navigation.
export function OptionalAdScripts() {
  const online = useOnline();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!enabled || !online || pathname === '/add' || pathname === '/leads') return;
    const timer = setTimeout(() => {
      for (const { flag, path } of OPTIONAL_SCRIPTS) {
        if (import.meta.env[flag] !== 'true') continue;
        const id = `adsterra-${flag}`;
        if (document.getElementById(id)) continue;
        const script = document.createElement('script');
        script.id = id;
        script.async = true;
        script.src = AD_HOST + path;
        document.body.appendChild(script);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [online, pathname]);
  return null;
}

export function AdSideRails() {
  if (!enabled) return null;
  return <>
    <div className="ad-rail ad-rail--left"><BannerAd format="skyscraper" /></div>
    <div className="ad-rail ad-rail--right"><BannerAd format="smallSkyscraper" /></div>
  </>;
}
