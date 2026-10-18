import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { AD_HOST, BANNERS, NATIVE_KEY, OPTIONAL_SCRIPTS, SMART_LINK, bannerDocument } from '../src/lib/ads.js';

for (const [format, ad] of Object.entries(BANNERS)) {
  test(`${format}: isolated provider document has matching options and script`, () => {
    const html = bannerDocument(ad);
    const scripts = [...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 2);
    const context = {};
    vm.runInNewContext(scripts[0][2], context);
    assert.deepEqual(JSON.parse(JSON.stringify(context.atOptions)), {
      key: ad.key, format: 'iframe', height: ad.height, width: ad.width, params: {},
    });
    assert.equal(scripts[1][1], `${AD_HOST}/${ad.key}/invoke.js`);
    assert.ok(html.includes(`width:${ad.width}px;height:${ad.height}px`));
  });
}

test('all ten supplied modules have distinct, valid HTTPS addresses', () => {
  const urls = [
    ...Object.values(BANNERS).map(({ key }) => `${AD_HOST}/${key}/invoke.js`),
    `${AD_HOST}/${NATIVE_KEY}/invoke.js`,
    ...OPTIONAL_SCRIPTS.map(({ path }) => AD_HOST + path), SMART_LINK,
  ];
  assert.equal(urls.length, 10);
  assert.equal(new Set(urls).size, 10);
  for (const url of urls) {
    assert.equal(new URL(url).protocol, 'https:');
    assert.equal(new URL(url).hostname, 'thatlobster.com');
  }
  assert.equal(new URL(SMART_LINK).searchParams.get('key'), 'fd912fe3b625157720aec2f65a44fabb');
});

test('banner windows do not share atOptions', () => {
  const contexts = Object.values(BANNERS).map(ad => {
    const context = {};
    vm.runInNewContext(bannerDocument(ad).match(/<script>(.*?)<\/script>/)[1], context);
    return context;
  });
  assert.equal(new Set(contexts.map(c => c.atOptions.key)).size, 6);
});
