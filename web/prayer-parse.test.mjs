/* Regression tests for the rule engine that turns a plain-language note into
   prayer-list actions. The functions live inside index.html (the page is the
   whole app), so the test lifts the marked #region blocks out of it and runs
   them on their own — no DOM, no app state.

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

const { parseNote, splitClauses, splitWhoWhat, extractWhen, ruleCategory } =
  new Function(region('dates') + region('prayer-parse') +
    '\nreturn {parseNote, splitClauses, splitWhoWhat, extractWhen, ruleCategory};')();

const TODAY = '2026-09-15';                      // a Tuesday
const ITEMS = [
  { id: 'a1', who: 'Sarah', what: 'her surgery' },
  { id: 'a2', who: 'Priya', what: 'her shoulder' },
  { id: 'a3', who: 'The Ortiz family', what: 'their move to Denver' },
];
const parse = (note, items = ITEMS, lastWho = '') => parseNote(note, { today: TODAY, items, lastWho });
const adds = note => parse(note).actions.filter(a => a.type === 'add');
const one = note => {
  const a = adds(note);
  assert.equal(a.length, 1, `expected one request from ${JSON.stringify(note)}, got ${a.length}`);
  return a[0];
};

test('a name and a need', () => {
  const a = one('pray for Priya about her shoulder');
  assert.equal(a.who, 'Priya');
  assert.equal(a.what, 'her shoulder');
});

test('the leading ask is stripped however it is phrased', () => {
  for (const note of ['pray for Ana', 'please pray for Ana', 'Could you pray for Ana',
                      'praying for Ana', 'remember Ana', 'lift up Ana', 'add Ana to the list',
                      'ok so pray for Ana, thanks']) {
    assert.equal(one(note).who, 'Ana', note);
  }
});

test('a possessive splits the person from the need', () => {
  assert.deepEqual(pick(one("Priya's shoulder")), { who: 'Priya', what: 'shoulder' });
  assert.deepEqual(pick(one('pray for my neighbour Dave’s chemo')), { who: 'Dave', what: 'chemo' });
});

test('a verb splits the person from the need', () => {
  assert.deepEqual(pick(one('my mom is having a hard time with her knee')),
    { who: 'Mom', what: 'is having a hard time with her knee' });
  assert.deepEqual(pick(one('Tom, who just lost his job')), { who: 'Tom', what: 'who just lost his job' });
});

test('a group stays whole', () => {
  assert.equal(one('the persecuted church in Nigeria').who, 'Persecuted church in Nigeria');
});

test('the writer’s own needs land on Me', () => {
  assert.equal(one('pray for me').who, 'Me');
  assert.equal(one('pray for me about my temper').cat, 'Me');
  assert.deepEqual(pick(one('my own anxiety about work')), { who: 'Me', what: 'my own anxiety about work' });
});

test('categories follow the words used', () => {
  assert.equal(one('my wife').cat, 'Family');
  assert.equal(one('our pastor Tim').cat, 'Church');
  assert.equal(one('missionaries in Japan').cat, 'World');
  assert.equal(one('the persecuted church in Nigeria').cat, 'World');   // not Church
  assert.equal(one('my coworker Raj').cat, 'Friends');
});

test('a category nobody voted for is left open for the on-device model', () => {
  assert.equal(one('pray for Ana').catSure, false);
  assert.equal(one('my brother').catSure, true);
});

test('time words set an end date and are cut from the need', () => {
  assert.equal(one('pray for Priya about her shoulder this week').until, '2026-09-22');
  assert.equal(one('pray for Priya about her shoulder this week').what, 'her shoulder');
  assert.equal(one('pray for Ruth for the next three weeks').until, '2026-10-06');
  assert.equal(one('pray for Ruth for 10 days').until, '2026-09-25');
  assert.equal(one('pray for Ruth today').until, TODAY);
  assert.equal(one('pray for Ruth tomorrow').until, '2026-09-16');
  assert.equal(one('pray for Ruth next week').until, '2026-09-29');
  assert.equal(one('keep praying for the Ortiz family until Friday').until, '2026-09-18');
  assert.equal(one('pray for grandma until the end of the month').until, '2026-10-15');
  assert.equal(one('pray for Ana').until, '');
});

test('a dated event keeps its words but still sets the end date', () => {
  const a = one('praying for Ana about her surgery on Friday');
  assert.equal(a.until, '2026-09-18');
  assert.equal(a.what, 'her surgery on Friday');
});

test('“every day” marks a request daily', () => {
  for (const note of ['pray for my brother daily', 'pray for my brother every day', 'pray for my brother each morning']) {
    assert.equal(one(note).daily, true, note);
  }
  assert.equal(one('pray for my brother').daily, false);
});

test('one line, several requests', () => {
  assert.deepEqual(adds('please pray for Ana and Priya').map(a => a.who), ['Ana', 'Priya']);
  assert.deepEqual(adds('pray for Priya’s shoulder and my mom’s knee').map(a => a.who), ['Priya', 'Mom']);
  assert.deepEqual(adds('Pray for Ana. Also Priya needs work.').map(a => a.who), ['Ana', 'Priya']);
  assert.deepEqual(adds('pray for Ana\nthe Baker family').map(a => a.who), ['Ana', 'Baker family']);
  assert.deepEqual(adds('pray for Ana and the Ortiz family').map(a => a.who), ['Ana', 'Ortiz family']);
});

test('a stray conjunction never lands in the need', () => {
  assert.deepEqual(adds('pray for Ana and the Ortiz family').map(a => a.what), ['', '']);
});

test('a need with “and” in it stays one request', () => {
  assert.deepEqual(adds('pray for Priya’s shoulder and knee').map(a => a.who), ['Priya']);
  assert.equal(splitClauses('Dr. Reyes about her clinic').length, 1);   // not a sentence break
});

test('“and his wife” carries the last person forward', () => {
  assert.deepEqual(adds('pray for John and his wife').map(a => a.who), ['John', 'John’s wife']);
  assert.equal(parse('also his wife', ITEMS, 'John').actions[0].who, 'John’s wife');
  assert.equal(parse('also his wife').misses[0].reason, 'empty');       // nobody to carry forward
});

test('good news closes the matching request', () => {
  for (const note of ['Sarah’s surgery went well', 'answered: Sarah', 'praise God — Sarah is out of the hospital',
                      'Sarah is better', 'good news: Sarah is home']) {
    assert.deepEqual(parse(note).actions, [{ type: 'answered', id: 'a1', who: 'Sarah' }], note);
  }
});

test('a request can be taken off the list', () => {
  for (const note of ['take Priya off the list', 'remove Priya', 'we can stop praying for Priya',
                      'delete the request about her shoulder']) {
    assert.equal(parse(note).actions[0].type, 'remove', note);
    assert.equal(parse(note).actions[0].id, 'a2', note);
  }
});

test('a close-out naming nobody on the list is reported, not guessed at', () => {
  const r = parse('answered: Jonathan');
  assert.deepEqual(r.actions, []);
  assert.deepEqual(r.misses.map(m => m.reason), ['answered']);
  assert.equal(r.misses[0].text, 'Jonathan');
});

test('good news about nobody on the list reads as a new request', () => {
  assert.equal(one('Jonathan got the job').who, 'Jonathan');
});

test('the same request is not closed twice in one note', () => {
  const r = parse('answered: Sarah; answered: Sarah');
  assert.equal(r.actions.length, 1);
  assert.equal(r.misses.length, 1);
});

test('nothing usable is a miss, never a blank request', () => {
  for (const note of ['', '   ', 'thanks', 'ok']) {
    const r = parse(note);
    assert.deepEqual(r.actions, [], note);
  }
});

test('parseNote never throws on junk', () => {
  for (const note of [undefined, null, 42, '🙏', '...', 'a'.repeat(4000), 'pray for ' + '🙏'.repeat(50)]) {
    assert.doesNotThrow(() => parseNote(note, { today: TODAY, items: ITEMS }), String(note).slice(0, 20));
  }
  assert.doesNotThrow(() => parseNote('pray for Ana', undefined));
});

test('every action is shaped the way addRequest expects', () => {
  for (const a of adds('pray for my wife Ana about her exams this week and for Priya every day')) {
    assert.equal(typeof a.who, 'string');
    assert.equal(typeof a.what, 'string');
    assert.ok(['Family', 'Friends', 'Church', 'World', 'Me'].includes(a.cat), a.cat);
    assert.equal(typeof a.daily, 'boolean');
    assert.ok(a.until === '' || /^\d{4}-\d{2}-\d{2}$/.test(a.until), a.until);
  }
});

function pick(a) { return { who: a.who, what: a.what }; }
