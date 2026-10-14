// Court Lab: screens, buttons, and navigation.
//
// How it works: each screen is a function that returns HTML. Buttons carry a
// data-act="..." name, and the ACTIONS table below says what each one does.
// After any change we save and redraw the screen.

import { FOCUSES, EQUIPMENT, SHOT_TYPES, byId } from './exercises.js';
import { generate, blankWorkout, swapFor, addable, makeItem, totalMinutes } from './generator.js';
import * as db from './storage.js';
import * as U from './units.js';

const view = document.getElementById('view');
const overlay = document.getElementById('overlay');

let settings = db.getSettings();
let draft = db.getDraft();                       // workout being planned/logged
let form = { focus: 'strength', minutes: 60, pain: null };
let mode = draft?.status === 'active' ? 'log' : 'edit';
let finish = null;                               // the "finish workout" form
let pickerQuery = '';

// ---------- small helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const focusName = f => (f === 'custom' ? 'Custom session' : FOCUSES[f]?.name || f);
const saveDraft = () => db.saveDraft(draft);
const go = hash => (location.hash === hash ? render() : (location.hash = hash));
const num = v => (v === '' || v == null || isNaN(parseFloat(v)) ? null : parseFloat(v));
const val = v => (v == null ? '' : v);
const pad = n => String(n).padStart(2, '0');
const dayKey = d => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const units = () => settings.units;
const wUnit = () => U.weightUnit(units());

document.getElementById('today').textContent = new Date()
  .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

// ---------- scoreboard numbers ----------
function stats() {
  const ws = db.getWorkouts();
  const days = new Set(ws.map(w => dayKey(w.finishedAt)));
  let streak = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // today not done yet doesn't break it
  while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week = ws.filter(w => new Date(w.finishedAt) >= monday).length;
  return { total: ws.length, streak, week };
}

const scoreboard = s => `
  <div class="scoreboard">
    <div class="score"><div class="num">${s.week}</div><div class="lbl">This week</div></div>
    <div class="score"><div class="num">${s.streak}</div><div class="lbl">Day streak</div></div>
    <div class="score"><div class="num">${s.total}</div><div class="lbl">All time</div></div>
  </div>`;

// =====================================================================
// HOME: build a workout
// =====================================================================
function homeView() {
  const p = form.pain;
  const painClass = n => (n >= 6 ? 'pain-high' : n >= 3 ? 'pain-mid' : '');
  return `
    <div class="h1">Game Day</div>
    <p class="sub">Pick a focus and your time. The app builds the rest.</p>
    ${scoreboard(stats())}

    ${draft ? `
      <div class="card draft-card">
        <div class="small">${draft.status === 'active' ? 'IN PROGRESS' : 'PLANNED, NOT STARTED'}</div>
        <div class="item-name">${esc(focusName(draft.focus))}</div>
        <div class="small">${draft.items.length} exercises · ~${totalMinutes(draft.items)} min</div>
        <button class="btn primary block" data-act="open-draft" style="margin-top:10px">Continue</button>
      </div>` : ''}

    <div class="h2">Focus</div>
    <div class="tiles">
      ${Object.entries(FOCUSES).map(([k, f]) => `
        <button class="tile ${form.focus === k ? 'on' : ''}" data-act="focus" data-v="${k}">
          <div class="t">${f.name}</div><div class="d">${f.desc}</div>
        </button>`).join('')}
    </div>

    <div class="h2">Time</div>
    <div class="chips">
      ${[45, 60, 75, 90, 105, 120].map(m => `<button class="chip ${form.minutes === m ? 'on' : ''}" data-act="min" data-v="${m}">${m < 60 ? m + 'm' : (m / 60) + 'h'}</button>`).join('')}
    </div>

    <div class="h2">Knee pain right now</div>
    <div class="chips">
      ${Array.from({ length: 11 }, (_, n) => `<button class="chip ${painClass(n)} ${p === n ? 'on' : ''}" data-act="pain" data-v="${n}">${n}</button>`).join('')}
    </div>
    <p class="small" style="margin-top:6px">0 = none · 3+ = low-impact only · 6+ = recovery day</p>
    ${p >= 6 ? `<div class="notice bad">Pain ${p}/10. Today will be a recovery day: no running or jumping.</div>`
      : p >= 3 ? `<div class="notice">Pain ${p}/10. Running and hard jumps will be swapped for bike, pool, and low-impact work.</div>` : ''}

    <button class="btn primary block" data-act="generate" style="margin-top:18px">Build my workout</button>
    <button class="btn ghost block" data-act="blank" style="margin-top:8px">Log a trainer or custom session</button>`;
}

// =====================================================================
// WORKOUT: edit the plan, then log it
// =====================================================================
function target(it) {
  const u = units();
  switch (it.kind) {
    case 'reps': {
      const r = it.repUnit === 'm' ? U.shortDist(it.reps, u) : `${it.reps}${it.repUnit === 'sec' ? ' s' : ''}`;
      return `${it.sets} × ${r}${it.side ? ' /side' : ''} · rest ${it.rest}s`;
    }
    case 'sprint': return `${it.sets} × ${U.shortDist(it.distM, u)} · rest ${it.rest}s`;
    case 'swim': return `${it.laps} laps (${it.laps * 50} m) · ~${it.min} min`;
    case 'shots': return `${it.attempts} shots · ~${it.min} min`;
    default: return `${it.min} min`;
  }
}

function field(label, attrs, value, step = 'any') {
  return `<label class="fld"><span>${label}</span><input type="number" inputmode="decimal" step="${step}" ${attrs} value="${val(value)}"></label>`;
}

// Inputs for changing the plan (sets, reps, minutes...)
function targetFields(it) {
  const t = k => `data-tgt="${k}" data-uid="${it.uid}"`;
  switch (it.kind) {
    case 'reps': return field('Sets', t('sets'), it.sets) + field(it.repUnit === 'sec' ? 'Seconds' : it.repUnit === 'm' ? 'Meters' : 'Reps', t('reps'), it.reps) + field('Rest s', t('rest'), it.rest);
    case 'sprint': return field('Sets', t('sets'), it.sets) + field('Meters', t('distM'), it.distM) + field('Rest s', t('rest'), it.rest);
    case 'swim': return field('Laps', t('laps'), it.laps) + field('Minutes', t('min'), it.min);
    case 'shots': return field('Shots', t('attempts'), it.attempts) + field('Minutes', t('min'), it.min);
    default: return field('Minutes', t('min'), it.min);
  }
}

// Fill in a blank log for an item the first time it's logged.
function ensureLog(it) {
  if (it.kind === 'reps' || it.kind === 'sprint') {
    it.log ||= { sets: [] };
    const last = it.kind === 'reps' && it.load !== 'bw' ? db.lastWeightFor(it.exId) : null;
    while (it.log.sets.length < (it.sets || 1)) {
      const prev = it.log.sets[it.log.sets.length - 1];
      it.log.sets.push(it.kind === 'reps' ? { reps: it.reps, kg: prev?.kg ?? last, done: false } : { sec: null, done: false });
    }
  } else if (it.kind === 'shots') it.log ||= { made: null, att: it.attempts, done: false };
  else if (it.kind === 'time') it.log ||= { min: it.min, done: false };
  else it.log ||= { distM: null, tMin: null, tSec: null, laps: it.laps ?? null, done: false };
}

const check = (done, act, uid, set = '') =>
  `<button class="check ${done ? 'on' : ''}" data-act="${act}" data-uid="${uid}" ${set !== '' ? `data-set="${set}"` : ''} aria-label="Done">✓</button>`;

// Inputs for logging what you actually did
function logFields(it) {
  ensureLog(it);
  const L = it.log;
  const a = (k, s = '') => `data-log="${k}" data-uid="${it.uid}" ${s !== '' ? `data-set="${s}"` : ''}`;
  const u = units();

  if (it.kind === 'reps') {
    const weighted = it.load !== 'bw';
    const repLbl = it.repUnit === 'sec' ? 'sec' : it.repUnit === 'm' ? 'm' : 'reps';
    return `
      ${L.sets.map((s, i) => `
        <div class="setrow ${s.done ? 'done' : ''}">
          <div class="setno">${i + 1}</div>
          ${field(repLbl, a('reps', i), s.reps)}
          ${weighted ? field(`${wUnit()}${it.load === 'db' ? ' each' : ''}`, a('kg', i), U.showWeight(s.kg, u)) : '<div class="fld bw">Bodyweight</div>'}
          ${check(s.done, 'set-done', it.uid, i)}
        </div>`).join('')}
      <div class="row" style="margin-top:6px">
        <button class="btn small" data-act="add-set" data-uid="${it.uid}">+ Set</button>
        <span class="spacer"></span>
        <button class="btn small" data-act="all-done" data-uid="${it.uid}">All sets done</button>
      </div>`;
  }
  if (it.kind === 'sprint') {
    return `
      ${L.sets.map((s, i) => `
        <div class="setrow ${s.done ? 'done' : ''}">
          <div class="setno">${i + 1}</div>
          ${field('time (s), optional', a('sec', i), s.sec)}
          ${check(s.done, 'set-done', it.uid, i)}
        </div>`).join('')}
      <div class="row" style="margin-top:6px"><span class="spacer"></span><button class="btn small" data-act="all-done" data-uid="${it.uid}">All done</button></div>`;
  }
  if (it.kind === 'shots') {
    const pct = L.att ? Math.round(((L.made || 0) / L.att) * 100) : 0;
    return `
      <div class="setrow ${L.done ? 'done' : ''}">
        ${field('Made', a('made'), L.made)}
        ${field('Attempted', a('att'), L.att)}
        <div class="pct">${L.made != null && L.att ? pct + '%' : '–'}</div>
        ${check(L.done, 'item-done', it.uid)}
      </div>`;
  }
  if (it.kind === 'time') {
    return `<div class="setrow ${L.done ? 'done' : ''}">${field('Minutes', a('min'), L.min)}${check(L.done, 'item-done', it.uid)}</div>`;
  }
  // run, bike, swim
  const first = it.kind === 'swim' ? field('Laps', a('laps'), L.laps) : field(U.distUnit(u), a('distM'), U.showDist(L.distM, u));
  return `
    <div class="setrow ${L.done ? 'done' : ''}">
      ${first}
      ${field('Min', a('tMin'), L.tMin, '1')}
      ${field('Sec', a('tSec'), L.tSec, '1')}
      ${check(L.done, 'item-done', it.uid)}
    </div>
    ${it.kind === 'run' && L.distM && (L.tMin || L.tSec) ? `<div class="small">Pace ${U.formatPace((L.tMin || 0) * 60 + (L.tSec || 0), L.distM, u)}</div>` : ''}`;
}

function itemCard(it) {
  const done = it.log && (it.log.done || it.log.sets?.length && it.log.sets.every(s => s.done));
  const impactTag = it.impact === 2 ? '<span class="tag warn">High knee load</span>' : '';
  return `
    <div class="card item ${mode === 'log' && done ? 'is-done' : ''}">
      <div class="item-head">
        <div>
          <div class="item-name">${esc(it.name)}</div>
          <div class="target">${target(it)} ${impactTag}</div>
        </div>
      </div>
      ${it.cue ? `<div class="cue">${esc(it.cue)}</div>` : ''}
      ${mode === 'edit' ? `
        <div class="fields">${targetFields(it)}</div>
        <div class="row item-actions">
          <button class="btn small" data-act="up" data-uid="${it.uid}" aria-label="Move up">↑</button>
          <button class="btn small" data-act="down" data-uid="${it.uid}" aria-label="Move down">↓</button>
          <span class="spacer"></span>
          <button class="btn small" data-act="swap" data-uid="${it.uid}">Swap</button>
          <button class="btn small danger" data-act="remove" data-uid="${it.uid}">Remove</button>
        </div>`
      : `<div class="log">${logFields(it)}</div>`}
    </div>`;
}

function workoutView() {
  if (!draft) return `<div class="empty"><div class="big">No workout yet</div><a href="#/">Build one</a></div>`;
  const sections = [['warmup', 'Warm-up'], ['main', 'Main work'], ['cooldown', 'Cool-down']];
  const painBit = draft.kneePain != null ? ` · knee ${draft.kneePain}/10` : '';
  const html = `
    <div class="h1">${esc(focusName(draft.focus))}</div>
    <p class="sub">~${totalMinutes(draft.items)} min · ${draft.items.length} exercises${painBit}</p>
    ${draft.notes.map(n => `<div class="notice ${n.level === 'bad' ? 'bad' : n.level === 'info' ? 'info' : ''}">${esc(n.text)}</div>`).join('')}

    <div class="seg">
      <button class="${mode === 'edit' ? 'on' : ''}" data-act="mode" data-v="edit">Edit plan</button>
      <button class="${mode === 'log' ? 'on' : ''}" data-act="mode" data-v="log">Log</button>
    </div>

    ${sections.map(([key, label]) => {
      const items = draft.items.filter(i => i.section === key);
      if (!items.length && !(key === 'main' && mode === 'edit')) return '';
      return `<div class="h2">${label}</div>${items.map(itemCard).join('')}
        ${key === 'main' && mode === 'edit' ? '<button class="btn block" data-act="add">+ Add exercise</button>' : ''}`;
    }).join('')}

    <div style="margin-top:20px">
      ${draft.status === 'planned'
        ? '<button class="btn primary block" data-act="start">Start workout</button>'
        : '<button class="btn primary block" data-act="finish">Finish &amp; save</button>'}
      <button class="btn ghost block danger" data-act="discard" style="margin-top:8px">Discard workout</button>
    </div>`;
  return html;
}

// =====================================================================
// HISTORY
// =====================================================================
function summarize(w) {
  const out = [];
  const u = units();
  let sets = 0, dist = 0, laps = 0;
  const shots = {};
  for (const it of w.items) {
    const L = it.log;
    if (!L) continue;
    if (L.sets) sets += L.sets.filter(s => s.done).length;
    if (!L.done) continue;
    if (L.distM) dist += L.distM;
    if (it.kind === 'swim' && L.laps) laps += L.laps;
    if (it.kind === 'shots' && L.att) {
      const t = (shots[it.shotType] ||= { m: 0, a: 0 });
      t.m += L.made || 0; t.a += L.att;
    }
  }
  if (sets) out.push(`${sets} sets`);
  if (dist) out.push(`${U.showDist(dist, u)} ${U.distUnit(u)}`);
  if (laps) out.push(`${laps} laps`);
  for (const [t, s] of Object.entries(shots)) out.push(`${SHOT_TYPES[t]} ${s.m}/${s.a}`);
  return out;
}

function historyView() {
  const ws = db.getWorkouts().slice().reverse();
  if (!ws.length) return `<div class="h1">History</div><div class="empty"><div class="big">No games played</div>Finish a workout and it shows up here.</div>`;
  return `
    <div class="h1">History</div>
    <p class="sub">${ws.length} workout${ws.length === 1 ? '' : 's'} logged</p>
    ${ws.map(w => {
      const d = new Date(w.finishedAt);
      return `
        <a class="card hist" href="#/history/${w.id}">
          <div class="date"><div class="mo">${d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</div><div class="dy">${d.getDate()}</div></div>
          <div class="hist-body">
            <div class="item-name">${esc(focusName(w.focus))} ${w.trainer ? '<span class="tag">Trainer</span>' : ''}</div>
            <div class="small">${w.durationMin} min${w.rpe ? ` · effort ${w.rpe}/10` : ''}</div>
            <div class="small">${summarize(w).join(' · ') || '&nbsp;'}</div>
          </div>
        </a>`;
    }).join('')}`;
}

function logText(it) {
  const L = it.log;
  const u = units();
  if (!L) return '<span class="muted">Not logged</span>';
  if (L.sets) {
    const done = L.sets.filter(s => s.done);
    if (!done.length) return '<span class="muted">Skipped</span>';
    return done.map((s, i) => {
      if (it.kind === 'sprint') return `${i + 1}. ${s.sec ? s.sec + ' s' : 'done'}`;
      const r = it.repUnit === 'sec' ? `${s.reps} s` : it.repUnit === 'm' ? U.shortDist(s.reps, u) : `${s.reps} reps`;
      return `${i + 1}. ${r}${s.kg ? ` @ ${U.showWeight(s.kg, u)} ${wUnit()}` : ''}`;
    }).join('<br>');
  }
  if (!L.done) return '<span class="muted">Skipped</span>';
  const t = (L.tMin || L.tSec) ? U.formatTime((L.tMin || 0) * 60 + (L.tSec || 0)) : '';
  switch (it.kind) {
    case 'shots': return `${L.made ?? 0}/${L.att} (${L.att ? Math.round(((L.made || 0) / L.att) * 100) : 0}%)`;
    case 'time': return `${L.min} min`;
    case 'swim': return [L.laps && `${L.laps} laps (${L.laps * 50} m)`, t].filter(Boolean).join(' in ') || 'Done';
    default: return [L.distM && `${U.showDist(L.distM, u)} ${U.distUnit(u)}`, t, it.kind === 'run' && L.distM && t && U.formatPace((L.tMin || 0) * 60 + (L.tSec || 0), L.distM, u)].filter(Boolean).join(' · ') || 'Done';
  }
}

function historyDetail(id) {
  const w = db.getWorkout(id);
  if (!w) return `<div class="empty">Workout not found. <a href="#/history">Back</a></div>`;
  const d = new Date(w.finishedAt);
  return `
    <a href="#/history" class="small">← History</a>
    <div class="h1">${esc(focusName(w.focus))}</div>
    <p class="sub">${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} ${w.trainer ? '<span class="tag">Trainer</span>' : ''}</p>
    <div class="scoreboard">
      <div class="score"><div class="num">${w.durationMin}</div><div class="lbl">Minutes</div></div>
      <div class="score"><div class="num">${w.rpe ?? '–'}</div><div class="lbl">Effort</div></div>
      <div class="score"><div class="num">${w.kneePainAfter ?? w.kneePain ?? '–'}</div><div class="lbl">Knee after</div></div>
    </div>
    ${w.comment ? `<div class="card">${esc(w.comment)}</div>` : ''}
    ${w.items.map(it => `
      <div class="card">
        <div class="item-name">${esc(it.name)}</div>
        <div class="small" style="margin-top:4px">${logText(it)}</div>
      </div>`).join('')}
    <button class="btn block danger" data-act="del-workout" data-v="${w.id}" style="margin-top:12px">Delete this workout</button>`;
}

// =====================================================================
// SETTINGS
// =====================================================================
function settingsView() {
  return `
    <div class="h1">Settings</div>
    <div class="h2">Units</div>
    <div class="seg">
      <button class="${units() === 'imperial' ? 'on' : ''}" data-act="units" data-v="imperial">lb · mi</button>
      <button class="${units() === 'metric' ? 'on' : ''}" data-act="units" data-v="metric">kg · km</button>
    </div>

    <div class="h2">My equipment</div>
    <p class="small">The generator only uses what's switched on.</p>
    <div class="chips">
      ${Object.entries(EQUIPMENT).map(([k, name]) => `<button class="chip ${settings.equipment.includes(k) ? 'on' : ''}" data-act="equip" data-v="${k}">${name}</button>`).join('')}
    </div>

    <div class="h2">My data</div>
    <p class="small">Everything is saved only on this phone, in this browser. Export a backup now and then.</p>
    <div class="row wrap">
      <button class="btn" data-act="export">Export backup</button>
      <button class="btn" data-act="import">Import backup</button>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </div>
    <button class="btn ghost danger" data-act="reset" style="margin-top:14px">Erase all data</button>`;
}

// =====================================================================
// OVERLAYS: add-exercise picker, finish form
// =====================================================================
const GROUPS = {
  squat: 'Legs', hinge: 'Legs', 'single-leg': 'Legs', push: 'Upper body', pull: 'Upper body', shoulders: 'Upper body', arms: 'Upper body',
  core: 'Core', calves: 'Knee care & calves', 'knee-care': 'Knee care & calves', 'jump-vertical': 'Plyometrics', 'jump-single': 'Plyometrics',
  'jump-horizontal': 'Plyometrics', reactive: 'Plyometrics', 'power-upper': 'Plyometrics', accel: 'Speed & agility', 'max-speed': 'Speed & agility',
  agility: 'Speed & agility', decel: 'Speed & agility', run: 'Running', engine: 'Conditioning', circuit: 'Conditioning', handle: 'Basketball',
  moves: 'Basketball', finish: 'Basketball', 'shoot-3': 'Basketball', 'shoot-mid': 'Basketball', 'shoot-ft': 'Basketball',
  swim: 'Swim & bike', bike: 'Swim & bike', mobility: 'Recovery', 'easy-cardio': 'Recovery',
};

function pickerList() {
  const q = pickerQuery.trim().toLowerCase();
  const list = addable(draft, settings.equipment).filter(e => !q || e.name.toLowerCase().includes(q));
  const groups = {};
  for (const e of list) (groups[GROUPS[e.slots[0]] || 'Other'] ||= []).push(e);
  if (!list.length) return '<div class="empty">No matches.</div>';
  return Object.entries(groups).map(([g, items]) => `
    <div class="h2">${g}</div>
    ${items.map(e => `<button class="pick" data-act="pick" data-v="${e.id}">${esc(e.name)}${e.impact === 2 ? ' <span class="tag warn">High knee load</span>' : ''}</button>`).join('')}`).join('');
}

function openPicker() {
  pickerQuery = '';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="row"><div class="h1" style="font-size:32px">Add exercise</div><span class="spacer"></span><button class="btn small" data-act="close">Close</button></div>
      <input class="search" type="search" placeholder="Search…" data-search>
      <div id="picker-list">${pickerList()}</div>
    </div>`;
  showOverlay();
}

function finishSheet() {
  const f = finish;
  const chipRow = (act, cur, max = 10, from = 0) => Array.from({ length: max - from + 1 }, (_, i) => i + from)
    .map(n => `<button class="chip ${cur === n ? 'on' : ''}" data-act="${act}" data-v="${n}">${n}</button>`).join('');
  return `
    <div class="sheet">
      <div class="row"><div class="h1" style="font-size:32px">Final buzzer</div><span class="spacer"></span><button class="btn small" data-act="close">Back</button></div>
      <div class="h2">Duration (min)</div>
      <input class="search" type="number" inputmode="numeric" data-fin="durationMin" value="${val(f.durationMin)}">
      <div class="h2">Effort (1 easy – 10 max)</div>
      <div class="chips">${chipRow('fin-rpe', f.rpe, 10, 1)}</div>
      <div class="h2">Knee pain now</div>
      <div class="chips">${chipRow('fin-pain', f.kneePainAfter)}</div>
      ${f.kneePainAfter > 3 ? '<div class="notice bad" style="margin-top:10px">Pain went above 3. Rest and ice today, pick Recovery or Swim/Bike next, and consider getting your knees checked.</div>' : ''}
      <div class="h2">Trainer session?</div>
      <div class="seg">
        <button class="${!f.trainer ? 'on' : ''}" data-act="fin-trainer" data-v="0">On my own</button>
        <button class="${f.trainer ? 'on' : ''}" data-act="fin-trainer" data-v="1">With trainer</button>
      </div>
      <div class="h2">Notes</div>
      <textarea class="search" rows="3" data-fin="comment" placeholder="How did it feel?">${esc(f.comment)}</textarea>
      <button class="btn primary block" data-act="save" style="margin-top:16px">Save workout</button>
    </div>`;
}

function showOverlay() { overlay.hidden = false; document.body.style.overflow = 'hidden'; }
function closeOverlay() { overlay.hidden = true; overlay.innerHTML = ''; document.body.style.overflow = ''; finish = null; }

// =====================================================================
// ACTIONS: what each button does
// =====================================================================
const findItem = uid => draft?.items.find(i => i.uid === uid);

function move(uid, dir) {
  const items = draft.items;
  const i = items.findIndex(x => x.uid === uid);
  let j = i + dir;
  while (j >= 0 && j < items.length && items[j].section !== items[i].section) j += dir;
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
}

function replaceDraftOk() {
  return !draft || confirm('You already have a workout in progress. Replace it?');
}

const ACTIONS = {
  focus: (b) => { form.focus = b.dataset.v; render(); },
  min: (b) => { form.minutes = +b.dataset.v; render(); },
  pain: (b) => { form.pain = +b.dataset.v; render(); },

  generate() {
    if (form.pain == null) { alert('Tap your knee pain first (0 if none).'); return; }
    if (!replaceDraftOk()) return;
    draft = generate({ focus: form.focus, minutes: form.minutes, kneePain: form.pain, equipment: settings.equipment });
    saveDraft(); mode = 'edit'; form.pain = null;
    go('#/workout');
  },
  blank() {
    if (!replaceDraftOk()) return;
    draft = blankWorkout(); saveDraft(); mode = 'edit';
    go('#/workout');
  },
  'open-draft': () => { mode = draft.status === 'active' ? 'log' : 'edit'; go('#/workout'); },

  mode(b) {
    mode = b.dataset.v;
    if (mode === 'log' && draft.status === 'planned') { draft.status = 'active'; draft.startedAt = new Date().toISOString(); saveDraft(); }
    render();
  },
  start() {
    draft.status = 'active'; draft.startedAt = new Date().toISOString(); saveDraft();
    mode = 'log'; render(); scrollTo(0, 0);
  },
  up: (b) => { move(b.dataset.uid, -1); saveDraft(); render(); },
  down: (b) => { move(b.dataset.uid, 1); saveDraft(); render(); },
  swap(b) {
    const it = findItem(b.dataset.uid);
    const next = swapFor(it, draft, settings.equipment);
    if (!next) { alert('No other options for this one with your equipment and knee rules. Try Remove or + Add exercise.'); return; }
    draft.items[draft.items.indexOf(it)] = next; saveDraft(); render();
  },
  remove(b) {
    const it = findItem(b.dataset.uid);
    if (!confirm(`Remove ${it.name}?`)) return;
    draft.items = draft.items.filter(x => x !== it); saveDraft(); render();
  },
  add: () => openPicker(),
  pick(b) {
    const it = makeItem(byId(b.dataset.v), 'main');
    const cd = draft.items.findIndex(x => x.section === 'cooldown');
    draft.items.splice(cd === -1 ? draft.items.length : cd, 0, it);
    saveDraft(); closeOverlay(); render();
  },
  close: () => closeOverlay(),

  'set-done'(b) {
    const it = findItem(b.dataset.uid); ensureLog(it);
    const s = it.log.sets[+b.dataset.set]; s.done = !s.done; saveDraft(); render();
  },
  'item-done'(b) { const it = findItem(b.dataset.uid); ensureLog(it); it.log.done = !it.log.done; saveDraft(); render(); },
  'all-done'(b) { const it = findItem(b.dataset.uid); ensureLog(it); it.log.sets.forEach(s => (s.done = true)); saveDraft(); render(); },
  'add-set'(b) { const it = findItem(b.dataset.uid); it.sets = (it.sets || 0) + 1; ensureLog(it); saveDraft(); render(); },

  discard() {
    if (!confirm('Throw away this workout without saving it?')) return;
    draft = null; db.clearDraft(); go('#/');
  },
  finish() {
    const elapsed = draft.startedAt ? Math.round((Date.now() - new Date(draft.startedAt)) / 60000) : 0;
    finish = {
      durationMin: elapsed >= 10 ? elapsed : totalMinutes(draft.items) || draft.minutes,
      rpe: null, kneePainAfter: null, trainer: !!draft.trainer, comment: '',
    };
    overlay.innerHTML = finishSheet(); showOverlay();
  },
  'fin-rpe': (b) => { finish.rpe = +b.dataset.v; overlay.innerHTML = finishSheet(); },
  'fin-pain': (b) => { finish.kneePainAfter = +b.dataset.v; overlay.innerHTML = finishSheet(); },
  'fin-trainer': (b) => { finish.trainer = b.dataset.v === '1'; overlay.innerHTML = finishSheet(); },
  save() {
    const w = { ...draft, ...finish, durationMin: num(finish.durationMin) || 0, status: 'done', finishedAt: new Date().toISOString() };
    db.saveWorkout(w);
    draft = null; db.clearDraft(); closeOverlay();
    go(`#/history/${w.id}`);
  },
  'del-workout'(b) {
    if (!confirm('Delete this workout for good?')) return;
    db.deleteWorkout(b.dataset.v); go('#/history');
  },

  units: (b) => { settings.units = b.dataset.v; db.saveSettings(settings); render(); },
  equip(b) {
    const k = b.dataset.v;
    settings.equipment = settings.equipment.includes(k) ? settings.equipment.filter(x => x !== k) : [...settings.equipment, k];
    db.saveSettings(settings); render();
  },
  export() {
    const blob = new Blob([JSON.stringify(db.exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `courtlab-backup-${dayKey(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  import: () => document.getElementById('import-file').click(),
  reset() {
    if (!confirm('Erase ALL workouts and settings on this phone? Export a backup first if you want to keep them.')) return;
    if (!confirm('Last check: erase everything?')) return;
    db.resetAll(); settings = db.getSettings(); draft = null; go('#/');
  },
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && ACTIONS[b.dataset.act]) { e.preventDefault(); ACTIONS[b.dataset.act](b); }
});

// Typing into inputs: update the data right away (no redraw, so the keyboard stays open).
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.search != null) { pickerQuery = el.value; document.getElementById('picker-list').innerHTML = pickerList(); return; }
  if (el.dataset.fin) { finish[el.dataset.fin] = el.value; return; }
  const it = findItem(el.dataset.uid);
  if (!it) return;
  if (el.dataset.tgt) {
    it[el.dataset.tgt] = num(el.value) ?? 0;
  } else if (el.dataset.log) {
    ensureLog(it);
    const rec = el.dataset.set != null ? it.log.sets[+el.dataset.set] : it.log;
    const k = el.dataset.log;
    rec[k] = k === 'kg' ? U.readWeight(el.value, units()) : k === 'distM' ? U.readDist(el.value, units()) : num(el.value);
    // Typing weight or reps in one set copies it to the later sets you haven't finished yet.
    if (el.dataset.set != null && (k === 'kg' || k === 'reps')) {
      it.log.sets.forEach((s, j) => {
        if (j <= +el.dataset.set || s.done) return;
        s[k] = rec[k];
        const box = document.querySelector(`[data-uid="${it.uid}"][data-log="${k}"][data-set="${j}"]`);
        if (box) box.value = el.value;
      });
    }
  }
  saveDraft();
});

// Plan changes redraw when you leave the box (so the time total updates).
document.addEventListener('change', e => {
  if (e.target.dataset.tgt) { if (e.target.dataset.tgt === 'sets' && mode === 'log') ensureLog(findItem(e.target.dataset.uid)); render(); }
  if (e.target.id === 'import-file' && e.target.files[0]) {
    e.target.files[0].text().then(t => {
      try {
        db.importAll(JSON.parse(t)); settings = db.getSettings();
        alert('Backup imported.'); render();
      } catch (err) { alert(`Could not import: ${err.message}`); }
    });
  }
});

// =====================================================================
// ROUTER
// =====================================================================
function render() {
  const [tab, id] = (location.hash.replace('#/', '') || 'home').split('/');
  const screens = {
    home: homeView,
    workout: workoutView,
    history: () => (id ? historyDetail(id) : historyView()),
    settings: settingsView,
  };
  view.innerHTML = (screens[tab] || homeView)();
  const active = tab === 'workout' ? 'home' : tab;
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === active));
}

window.addEventListener('hashchange', () => { closeOverlay(); render(); scrollTo(0, 0); });
render();
