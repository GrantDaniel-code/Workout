// The rules that build a workout from: focus, minutes available, knee pain, equipment.

import { LIBRARY, byId } from './exercises.js';

// For each focus:
//   warmup  slots filled first
//   main    slots filled in order until the time runs out
//   cap     the most minutes of hard work, however long the session is
//           (recovery first: long sessions get extra knee care/mobility, not more volume)
//   extra   slots used to fill leftover time
//   cool    add a cool-down at the end
const TEMPLATES = {
  strength:     { warmup: ['warm-general'], main: [], cap: 50, extra: ['knee-care', 'mobility'], cool: true }, // lifts come from SPLITS below
  plyo:         { warmup: ['warm-general', 'warm-landing'], main: ['jump-vertical', 'jump-single', 'jump-horizontal', 'reactive', 'power-upper', 'single-leg', 'core'], cap: 45, extra: ['knee-care', 'mobility'], cool: true },
  speed:        { warmup: ['warm-general', 'warm-sprint'], main: ['accel', 'agility', 'max-speed', 'decel', 'core'], cap: 40, extra: ['knee-care', 'mobility'], cool: true },
  running:      { warmup: ['warm-run'], main: ['run'], cap: 40, extra: ['knee-care', 'mobility'], cool: true },
  conditioning: { warmup: ['warm-general'], main: ['engine', 'circuit', 'engine'], cap: 40, extra: ['core', 'mobility'], cool: true },
  skills:       { warmup: ['warm-handles'], main: ['handle', 'shoot-3', 'moves', 'shoot-mid', 'finish', 'shoot-ft', 'handle', 'shoot-3', 'moves', 'finish'], cap: 110, extra: ['mobility'], cool: true },
  swimbike:     { warmup: [], main: ['swim', 'bike'], cap: 110, extra: ['mobility'], cool: true },
  recovery:     { warmup: [], main: ['easy-cardio', 'mobility', 'mobility'], cap: 120, extra: ['mobility', 'easy-cardio'], cool: false },
};

// ---- Lifting split: Chest → Back → Legs → Arms, every day ends with core + cardio ----
// The order keeps the same muscles apart (triceps on chest day, biceps on back day).
export const SPLIT_ORDER = ['chest', 'back', 'legs', 'arms'];
export const SPLITS = {
  chest: { name: 'Chest', desc: 'Chest, shoulders, triceps', lifts: ['chest', 'chest', 'shoulders', 'chest-acc', 'triceps', 'chest-acc'] },
  back:  { name: 'Back',  desc: 'Back, rear delts, biceps',  lifts: ['back', 'back', 'back-acc', 'biceps', 'back-acc', 'back'] },
  legs:  { name: 'Legs',  desc: 'Squat, hinge, single-leg',  lifts: ['squat', 'hinge', 'single-leg', 'calves', 'knee-care', 'single-leg'] },
  arms:  { name: 'Arms',  desc: 'Biceps, triceps, shoulders', lifts: ['biceps', 'triceps', 'shoulders', 'biceps', 'triceps', 'forearms'] },
};

// Which split is up next: the one you trained longest ago (never = first).
// With sore knees (3+), legs day waits and the next upper-body day goes first.
export function nextSplit(workouts, kneePain = 0) {
  const last = {};
  for (const w of workouts) if (w.split) last[w.split] = w.finishedAt;
  const order = [...SPLIT_ORDER].sort((a, b) => (last[a] || '').localeCompare(last[b] || ''));
  if (kneePain >= 3 && order[0] === 'legs') return { split: order[1], legsDelayed: true };
  return { split: order[0], legsDelayed: false };
}

const JUMPY = ['running', 'plyo', 'speed', 'conditioning', 'skills'];
const DOCTOR = { level: 'info', text: 'Your knees hurt often. It is worth getting them checked by a doctor or physio so the plan can match what they find.' };

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);

// Rough minutes an exercise takes, including rest.
export function estMinutes(it) {
  if (it.kind === 'reps') {
    const work = it.repUnit === 'sec' ? it.reps * (it.side ? 2 : 1) : 40 * (it.side ? 1.6 : 1);
    return Math.round((it.sets * (work + it.rest)) / 60 + 1);
  }
  if (it.kind === 'sprint') return Math.round((it.sets * (10 + it.rest)) / 60 + 1);
  return it.min || 0;
}

export const totalMinutes = items => items.reduce((n, it) => n + estMinutes(it), 0);

// Turn a library exercise into a workout item (a copy that can be edited and logged).
export function makeItem(ex, section) {
  const it = { uid: uid(), exId: ex.id, name: ex.name, section, kind: ex.kind, impact: ex.impact, cue: ex.cue };
  for (const k of ['sets', 'reps', 'repUnit', 'side', 'rest', 'distM', 'min', 'laps', 'attempts', 'shotType', 'maxMin']) {
    if (ex[k] != null) it[k] = ex[k];
  }
  if (ex.kind === 'reps') it.load = ex.equip.includes('tonal') ? 'tonal' : ex.equip.includes('db') ? 'db' : 'bw';
  return it;
}

// Set a stretchable item (run, ride, swim...) to a number of minutes.
function scaleTo(it, min) {
  it.min = Math.max(5, Math.min(it.maxMin, Math.round(min / 5) * 5));
  if (it.kind === 'swim') it.laps = Math.max(2, Math.round(it.min / 2)); // ~2 min per 50 m lap incl. rest
}

const fits = (ex, maxImpact, equipment) => ex.impact <= maxImpact && ex.equip.every(q => equipment.includes(q));

// Bodyweight and dumbbells first: only use the Tonal when nothing else does the job.
const preferFree = list => {
  const free = list.filter(e => !e.equip.includes('tonal'));
  return free.length ? free : list;
};

// Random pick (Tonal options are less likely; used for swaps so you can still reach them).
function weightedPick(list) {
  if (!list.length) return null;
  const w = list.map(e => (e.equip.includes('tonal') ? 1 : 3));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) if ((r -= w[i]) < 0) return list[i];
  return list[list.length - 1];
}

export function generate({ focus, minutes, kneePain, equipment, split = 'chest', legsDelayed = false }) {
  const notes = [];
  let f = focus;
  let maxImpact = 2;
  let allow = () => true;

  // ---- Knee rules: these always win ----
  if (kneePain >= 6) {
    f = 'recovery';
    maxImpact = 0;
    notes.push({ level: 'bad', text: `Knee pain ${kneePain}/10: today is recovery only. No running or jumping.` }, DOCTOR);
  } else if (kneePain >= 3) {
    maxImpact = 1;
    if (f === 'running') f = 'swimbike';
    notes.push({ level: 'warn', text: `Knee pain ${kneePain}/10: running and hard jumping were swapped for low-impact options.` }, DOCTOR);
  } else if (kneePain >= 1 && JUMPY.includes(f)) {
    if (f === 'running') allow = ex => !ex.slots.includes('run') || ['run-easy', 'run-walk'].includes(ex.id);
    notes.push({ level: 'info', text: 'Knees a little sore: keep it easy. Stop and switch to the bike or pool if pain goes above 3.' });
  }
  if (f === 'running') {
    notes.push({ level: 'info', text: 'Running time is capped at 30–40 min while you build up gradually. The weekly planner (coming later) will raise it slowly.' });
  }

  const T = TEMPLATES[f];
  const used = new Set();
  const pick = slot => {
    const ex = weightedPick(preferFree(LIBRARY.filter(e => e.slots.includes(slot) && !used.has(e.id) && fits(e, maxImpact, equipment) && allow(e))));
    if (ex) used.add(ex.id);
    return ex;
  };

  const warmup = T.warmup.map(s => pick(s)).filter(Boolean).map(ex => makeItem(ex, 'warmup'));
  const coolEx = T.cool ? pick('cool') : null;
  const cool = coolEx ? [makeItem(coolEx, 'cooldown')] : [];
  const budget = minutes - totalMinutes(warmup) - totalMinutes(cool);
  const mainBudget = Math.min(budget, T.cap);

  // Fill slots in order until the time runs out.
  const fill = (slots, limit) => {
    const out = [];
    let n = 0;
    for (const sl of slots) {
      if (out.length && n >= limit - 4) break;
      const ex = pick(sl);
      if (!ex) continue;
      const it = makeItem(ex, 'main');
      const m = it.maxMin ? 10 : estMinutes(it);
      if (out.length >= 2 && n + m > limit + 3) { used.delete(ex.id); continue; }
      out.push(it);
      n += m;
    }
    return out;
  };

  let main;
  if (f === 'strength') {
    // Core and a cardio finisher are always included, then lifts fill the rest.
    const core = [pick('core'), minutes >= 75 && pick('core')].filter(Boolean).map(ex => makeItem(ex, 'main'));
    const finCap = split === 'legs' ? 0 : maxImpact; // no pounding after legs
    const finEx = weightedPick(LIBRARY.filter(e => e.slots.includes('finisher') && !used.has(e.id) && fits(e, finCap, equipment)));
    const fin = finEx ? [makeItem(finEx, 'main')] : [];
    if (finEx) used.add(finEx.id);
    fin.filter(it => it.maxMin).forEach(it => scaleTo(it, minutes <= 45 ? 5 : minutes <= 75 ? 10 : 15));
    const liftBudget = Math.min(budget - totalMinutes(core) - totalMinutes(fin), T.cap);
    main = [...fill(SPLITS[split].lifts, liftBudget), ...core, ...fin];
    if (legsDelayed) notes.push({ level: 'warn', text: 'Legs were up next, but your knees are sore, so legs day waits. Upper body today.' });
    else if (split === 'legs' && kneePain >= 3) notes.push({ level: 'warn', text: 'Legs day with sore knees: stay in a pain-free range, and skip any exercise that hurts.' });
  } else {
    let slots = T.main;
    if (f === 'swimbike') slots = minutes >= 75 ? ['swim', 'bike'] : [Math.random() < 0.5 ? 'swim' : 'bike'];
    main = fill(slots, mainBudget);
    // Stretch runs/rides/swims to fill the main time.
    const stretchy = main.filter(it => it.maxMin);
    if (stretchy.length) {
      const fixedMin = totalMinutes(main.filter(it => !it.maxMin));
      stretchy.forEach(it => scaleTo(it, (mainBudget - fixedMin) / stretchy.length));
    }
  }
  let usedMin = totalMinutes(main);

  // ---- Leftover time: knee care and mobility, not more hard work ----
  let extra = budget - usedMin;
  const extraSlots = [...T.extra, ...T.extra, ...T.extra].slice(0, 5);
  for (const s of extraSlots) {
    if (extra < 6) break;
    const ex = pick(s);
    if (!ex) continue;
    const it = makeItem(ex, 'main');
    if (it.maxMin) scaleTo(it, Math.min(extra, it.maxMin));
    const m = estMinutes(it);
    if (m > extra + 2) continue;
    main.push(it);
    extra -= m;
  }
  if (budget > T.cap + 5) {
    notes.push({ level: 'info', text: 'Hard work is capped for this focus. Extra time went to knee care and mobility, not more volume.' });
  }

  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    focus: f,
    split: f === 'strength' ? split : null,
    requestedFocus: focus,
    minutes,
    kneePain,
    maxImpact,
    notes,
    items: [...warmup, ...main, ...cool],
    status: 'planned',
  };
}

// A blank session for trainer days or anything custom.
export function blankWorkout() {
  return {
    id: uid(), createdAt: new Date().toISOString(), focus: 'custom', requestedFocus: 'custom',
    minutes: 60, kneePain: null, maxImpact: 2, notes: [], items: [], status: 'planned', trainer: false,
  };
}

// Another exercise that does the same job (same slot), respecting knee rules and equipment.
export function swapFor(item, workout, equipment) {
  const slots = byId(item.exId)?.slots || [];
  const taken = new Set(workout.items.map(i => i.exId));
  const ex = weightedPick(LIBRARY.filter(e =>
    !taken.has(e.id) && e.slots.some(s => slots.includes(s)) && fits(e, workout.maxImpact, equipment)));
  if (!ex) return null;
  const it = makeItem(ex, item.section);
  if (it.maxMin && item.min) scaleTo(it, item.min);
  return it;
}

// Everything that can be added by hand to this workout.
export const addable = (workout, equipment) =>
  LIBRARY.filter(e => fits(e, workout.maxImpact, equipment) && !e.slots.some(s => s.startsWith('warm-') || s === 'cool'));
