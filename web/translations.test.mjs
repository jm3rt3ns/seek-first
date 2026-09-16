/* Regression tests for the translation layer: which URL each publisher's API is
   asked for, how their answers become verses, and — the part that matters most —
   that every failure lands quietly back on the ASV that ships with the page.

   Like the prayer-parse tests, this lifts the marked #region out of index.html and
   runs it on its own, with the page's globals passed in as stubs. The NLT's HTML is
   parsed with DOMParser, which Node has no equivalent of, so what is covered here is
   the request it makes and the fallback when the parse cannot happen.

       node --test web/                 # or: yarn test:web
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const page = readFileSync(fileURLToPath(new URL('./index.html', import.meta.url)), 'utf8');

function region(name) {
  const open = page.indexOf('/*#region ' + name);
  assert.notEqual(open, -1, `index.html has no /*#region ${name}`);
  const close = page.indexOf('/*#endregion*/', open);
  assert.notEqual(close, -1, `#region ${name} is never closed`);
  return page.slice(open, close);
}

const BOOKS = [{ b: 19, n: 'Psalms' }, { b: 43, n: 'John' }, { b: 62, n: '1 John' }];
const bookName = b => (BOOKS.find(x => x.b === b).n === 'Psalms' ? 'Psalm' : BOOKS.find(x => x.b === b).n);

// John 3 as the page's own ASV data: [chapter][verse]
const ASV_JOHN = [[], [], ['ASV 3:1', 'ASV 3:2', 'ASV 3:3']];

/* Builds one isolated copy of the region with stubbed globals.
   `responses` maps a substring of the URL to a canned response. */
function build({ keys = {}, responses = {}, read = 'asv' } = {}) {
  const cell = new Map(Object.entries(keys).map(([k, v]) => ['seekfirst.key.' + k, v]));
  const localStorage = {
    getItem: k => (cell.has(k) ? cell.get(k) : null),
    setItem: (k, v) => cell.set(k, v),
    removeItem: k => cell.delete(k),
  };
  const S = { settings: { readTranslation: read, memoryTranslation: 'asv' } };
  const calls = [];
  const fetchStub = async (url, opts) => {
    url = String(url);
    calls.push({ url, opts });
    if (url.startsWith('bible/')) return { ok: true, json: async () => ASV_JOHN };
    const hit = Object.keys(responses).find(k => url.includes(k));
    if (!hit) return { ok: false, status: 404 };
    const r = responses[hit];
    return typeof r === 'function' ? r(url, opts) : r;
  };
  const api = new Function('bookName', 'BOOKS', 'S', 'localStorage', 'fetch', 'DOMParser',
    region('translations') +
    '\nreturn {segRef, splitNumbered, segmentVerses, passageText, renderPassage, parseRef, translationReady, forgetTranslation, TRANSLATIONS};'
  )(bookName, BOOKS, S, localStorage, fetchStub, undefined);
  return { ...api, S, calls, localStorage };
}

const ok = body => ({ ok: true, status: 200, json: async () => body, text: async () => body });
const john = (v1 = 1, v2 = 999) => ({ b: 43, c: 3, v1, v2 });

test('a reference is written the way the APIs expect it', () => {
  const { segRef } = build();
  assert.equal(segRef(john()), 'John 3');
  assert.equal(segRef(john(16, 17)), 'John 3:16-17');
  assert.equal(segRef({ b: 19, c: 23, v1: 1, v2: 999 }), 'Psalm 23');
});

test('ESV verse markers split into verses', () => {
  const { splitNumbered } = build();
  assert.deepEqual(splitNumbered('[1] In the beginning.\n\n  [2] And the earth [3] was'), [
    { n: 1, t: 'In the beginning.' },
    { n: 2, t: 'And the earth' },
    { n: 3, t: 'was' },
  ]);
  assert.deepEqual(splitNumbered(''), []);
});

test('the ASV comes from the page, clipped to the verses that exist', async () => {
  const t = build();
  const got = await t.segmentVerses(john(2, 99), 'asv');
  assert.equal(got.tid, 'asv');
  assert.deepEqual(got.verses, [{ n: 2, t: 'ASV 3:2' }, { n: 3, t: 'ASV 3:3' }]);
  assert.deepEqual(t.calls.map(c => c.url), ['bible/43.json']);
});

test('the NET is fetched without a key and cached for the page', async () => {
  const t = build({ responses: { 'labs.bible.org': ok([{ verse: '16', text: 'NET sixteen' }]) } });
  const got = await t.segmentVerses(john(16, 16), 'net');
  assert.equal(got.tid, 'net');
  assert.deepEqual(got.verses, [{ n: 16, t: 'NET sixteen' }]);
  assert.match(t.calls[0].url, /passage=John%203%3A16-16/);
  await t.segmentVerses(john(16, 16), 'net');
  assert.equal(t.calls.length, 1, 'the second read of the same passage is served from cache');
});

test('the ESV goes out with the reader’s key and nothing else', async () => {
  const t = build({ keys: { esv: 'k-123' }, responses: { 'api.esv.org': ok({ passages: ['[16] ESV sixteen [17] ESV seventeen'] }) } });
  const got = await t.segmentVerses(john(16, 16), 'esv');
  assert.equal(got.tid, 'esv');
  assert.deepEqual(got.verses, [{ n: 16, t: 'ESV sixteen' }], 'verses outside the range are dropped');
  assert.equal(t.calls[0].opts.headers.Authorization, 'Token k-123');
  assert.match(t.calls[0].url, /include-footnotes=false/);
  assert.ok(!t.calls[0].url.includes('k-123'), 'the key travels in the header, not the query');
});

test('without a key the ASV stands in and no request is made', async () => {
  const t = build();
  const got = await t.segmentVerses(john(16, 16), 'esv');
  assert.equal(got.tid, 'asv');
  assert.equal(got.why, 'key');
  assert.deepEqual(t.calls.map(c => c.url), ['bible/43.json']);
  assert.equal(t.translationReady('esv'), false);
  assert.equal(t.translationReady('net'), true);
  assert.equal(t.translationReady('asv'), true);
});

test('a publisher that is down or answers with nothing falls back to the ASV', async () => {
  for (const responses of [{ 'labs.bible.org': { ok: false, status: 503 } }, { 'labs.bible.org': ok([]) }]) {
    const t = build({ responses });
    const got = await t.segmentVerses(john(1, 1), 'net');
    assert.equal(got.tid, 'asv');
    assert.equal(got.why, 'away');
    assert.deepEqual(got.verses, [{ n: 1, t: 'ASV 3:1' }]);
  }
});

test('the NLT asks for a dotted reference and degrades when it cannot be read', async () => {
  const t = build({ keys: { nlt: 'k-9' }, responses: { 'api.nlt.to': ok('<verse_export vn="16">…</verse_export>') } });
  const got = await t.segmentVerses(john(16, 16), 'nlt');   // no DOMParser in Node
  assert.match(t.calls[0].url, /ref=John\.3\.16-16/);
  assert.match(t.calls[0].url, /key=k-9/);
  assert.equal(got.tid, 'asv', 'an unreadable answer is not an error the reader ever sees');
  assert.equal(got.why, 'away');
});

test('a changed key clears what was cached for that translation', async () => {
  let n = 0;
  const t = build({ keys: { esv: 'first' }, responses: { 'api.esv.org': () => ok({ passages: [`[1] call ${++n}`] }) } });
  assert.equal((await t.segmentVerses(john(1, 1), 'esv')).verses[0].t, 'call 1');
  assert.equal((await t.segmentVerses(john(1, 1), 'esv')).verses[0].t, 'call 1');
  t.forgetTranslation('esv');
  assert.equal((await t.segmentVerses(john(1, 1), 'esv')).verses[0].t, 'call 2');
});

test('a memory verse comes back as one run of prose in the translation used', async () => {
  const t = build({ responses: { 'labs.bible.org': ok([{ verse: '16', text: 'NET sixteen' }, { verse: '17', text: 'NET seventeen' }]) } });
  assert.deepEqual(await t.passageText([john(16, 17)], 'net'), { text: 'NET sixteen NET seventeen', tid: 'net' });
  const t2 = build();
  assert.deepEqual(await t2.passageText([john(1, 2)], 'asv'), { text: 'ASV 3:1 ASV 3:2', tid: 'asv' });
});

test('a rendered passage credits what it actually showed', async () => {
  const t = build({ keys: { esv: 'k' }, responses: { 'api.esv.org': ok({ passages: ['[1] ESV one'] }) }, read: 'esv' });
  const el = { innerHTML: '' };
  await t.renderPassage(el, [john(1, 1)], { chapterLabels: false });
  assert.match(el.innerHTML, /<sup>1<\/sup>ESV one/);
  assert.match(el.innerHTML, /Crossway/);
  assert.ok(!el.innerHTML.includes('American Standard Version'));

  const down = build({ read: 'nlt' });                        // no key saved
  const el2 = { innerHTML: '' };
  await down.renderPassage(el2, [john(1, 1)], { chapterLabels: false });
  assert.match(el2.innerHTML, /ASV 3:1/);
  assert.match(el2.innerHTML, /American Standard Version/);
  assert.match(el2.innerHTML, /add a free NLT key/);
});

test('verse text is escaped, never injected', async () => {
  const t = build({ responses: { 'labs.bible.org': ok([{ verse: '1', text: '<script>bad()</script> & so on' }]) }, read: 'net' });
  const el = { innerHTML: '' };
  await t.renderPassage(el, [john(1, 1)], { chapterLabels: false });
  assert.ok(!el.innerHTML.includes('<script>'));
  assert.match(el.innerHTML, /&lt;script&gt;bad\(\)&lt;\/script&gt; &amp; so on/);
});

test('when even the ASV cannot be reached the step still reads', async () => {
  const t = build();
  t.calls.length = 0;
  const el = { innerHTML: '' };
  await t.renderPassage(el, [{ b: 99, c: 1, v1: 1, v2: 1 }], {});   // no such book file
  assert.match(el.innerHTML, /read it in your own Bible/);
});
