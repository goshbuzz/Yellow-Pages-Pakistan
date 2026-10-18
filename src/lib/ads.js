// Keep publisher keys in one place. These are public placement IDs, not secrets.
export const AD_HOST = 'https://thatlobster.com';
export const BANNERS = {
  rectangle: { key: '12b45e8a995f936c5a1bb15e3cc75046', width: 300, height: 250 },
  banner: { key: 'c3bec8fb7eb4927a833c7d9b30d061d6', width: 468, height: 60 },
  skyscraper: { key: '54eed1c3c94baf0abd9ae705940a337f', width: 160, height: 600 },
  smallSkyscraper: { key: '1c2d8ac787c172f2445ffd6fd5755df2', width: 160, height: 300 },
  mobile: { key: '2ebe4d3aa7e5cc234eda5c46896ea939', width: 320, height: 50 },
  leaderboard: { key: 'beb27bdbfd9bdb862c43196d40850005', width: 728, height: 90 },
};
export const NATIVE_KEY = 'cf24c447d0a53acc1c25eea9effeaacb';
export const SMART_LINK = `${AD_HOST}/q2s0fr4p?key=fd912fe3b625157720aec2f65a44fabb`;
export const OPTIONAL_SCRIPTS = [
  { flag: 'VITE_ADSTERRA_SCRIPT_8DB0', path: '/8d/b0/d3/8db0d373a6c17dcce0ea349ff7589e78.js' },
  { flag: 'VITE_ADSTERRA_SCRIPT_EE16', path: '/ee/16/c4/ee16c49a346871f1b818b4f01c6659d8.js' },
];

// Each banner gets its own window.atOptions and parser-inserted provider script.
// This supports document.write without clobbering React or racing other slots.
export function bannerDocument({ key, width, height }) {
  return `<!doctype html><html><head><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden}</style></head><body><script>var atOptions=${JSON.stringify({ key, format: 'iframe', height, width, params: {} })};<\/script><script src="${AD_HOST}/${key}/invoke.js"><\/script></body></html>`;
}
