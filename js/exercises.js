// The exercise library. The generator only picks from this list.
//
// Each exercise says:
//   slots   which "job" it can fill in a workout (e.g. 'squat', 'jump-vertical')
//   equip   everything it needs (all of it must be in Settings > Equipment)
//   impact  knee load from pounding/jumping: 0 none, 1 low, 2 high
//           Knee pain 3+ allows only 0–1. Knee pain 6+ allows only 0.
//   kind    how it's logged: reps, sprint, time, run, bike, swim, shots
//
// To add an exercise, copy a line and change it. Keep ids unique and never
// rename an id once you've logged it (progress history is linked by id).

export const EQUIPMENT = {
  bw: 'Bodyweight',
  db: 'Dumbbells (5–50 lb)',
  bench: 'Flat bench',
  tonal: 'Tonal',
  court: 'Home court',
  ball: 'Basketball',
  pool: 'Pool',
  bike: 'Bike',
  outdoor: 'Outdoor running',
};

export const FOCUSES = {
  strength:     { name: 'Strength',          desc: 'Legs, push, pull' },
  plyo:         { name: 'Vertical / Plyo',   desc: 'Jumps & explosiveness' },
  speed:        { name: 'Speed & Agility',   desc: 'Sprints, cuts, footwork' },
  running:      { name: 'Running',           desc: 'Easy, tempo, intervals' },
  conditioning: { name: 'Conditioning',      desc: 'Engine & game fitness' },
  skills:       { name: 'Basketball Skills', desc: 'Handles, shooting, finishing' },
  swimbike:     { name: 'Swim / Bike',       desc: 'Low-impact endurance' },
  recovery:     { name: 'Recovery',          desc: 'Mobility & easy movement' },
};

export const SHOT_TYPES = { three: '3PT', mid: 'Mid-range', ft: 'Free throws', finish: 'Finishing', close: 'Form/close' };

// Small helpers so each exercise fits on one line.
const reps = (id, name, slots, equip, impact, sets, n, rest, cue, more = {}) =>
  ({ id, name, slots, equip, impact, kind: 'reps', sets, reps: n, rest, cue, ...more });
const sprint = (id, name, slots, equip, impact, sets, distM, rest, cue) =>
  ({ id, name, slots, equip, impact, kind: 'sprint', sets, distM, rest, cue });
const time = (id, name, slots, equip, impact, min, cue, more = {}) =>
  ({ id, name, slots, equip, impact, kind: 'time', min, cue, ...more });
const cardio = (kind, id, name, slots, equip, impact, min, cue, more = {}) =>
  ({ id, name, slots, equip, impact, kind, min, cue, ...more });
const shots = (id, name, slots, equip, impact, attempts, min, shotType, cue) =>
  ({ id, name, slots, equip, impact, kind: 'shots', attempts, min, shotType, cue });

const SIDE = { side: true };
const SEC = { repUnit: 'sec' };

export const LIBRARY = [
  // ---------- Warm-ups ----------
  time('warm-dynamic', 'Dynamic warm-up', ['warm-general'], ['bw'], 0, 8, 'Leg swings, walking lunges with a twist, hip openers, glute bridges, arm circles.'),
  time('warm-bike', 'Easy bike spin', ['warm-general'], ['bike'], 0, 8, 'Easy pace. You should be able to talk the whole time.'),
  time('warm-landing', 'Landing drills', ['warm-landing'], ['bw'], 1, 5, 'Drop into a quiet athletic landing: hips back, knees track over toes. 3×5 drop-and-stick, then 2×10 small pogo hops.'),
  time('warm-sprint-drills', 'Sprint drills', ['warm-sprint'], ['bw'], 1, 6, 'A-march, A-skip, B-skip, high knees, butt kicks: 2× 20 m each. Finish with 2 easy build-ups.'),
  time('warm-walk-jog', 'Brisk walk into easy jog', ['warm-run'], ['outdoor'], 2, 8, '3 min brisk walk, 5 min very easy jog. Knee check: if pain goes above 3, stop and switch to the bike.'),
  time('warm-handles', 'Ball-handling warm-up', ['warm-handles'], ['ball'], 0, 6, 'Pound dribbles, crossovers, between the legs, behind the back. Both hands, eyes up.'),
  cardio('swim', 'warm-swim', 'Easy warm-up swim', ['warm-swim'], ['pool'], 0, 5, 'Relaxed, long strokes.', { laps: 2 }),

  // ---------- Cool-downs ----------
  time('cool-mobility', 'Mobility cool-down', ['cool'], ['bw'], 0, 6, 'Couch stretch, calf stretch, hamstring floss, figure-4 glute stretch: 30–45 s each side.'),
  time('cool-knee', 'Knee-friendly cool-down', ['cool'], ['bw'], 0, 6, '2 min easy walk, quad + calf stretch, 2× 30 s wall sit at a pain-free depth, slow breathing.'),

  // ---------- Strength: squat ----------
  reps('goblet-squat', 'Goblet squat', ['squat'], ['db'], 0, 4, 8, 90, 'Hold one dumbbell at your chest. Sit between your heels, chest tall.'),
  reps('db-front-squat', 'DB front squat', ['squat'], ['db'], 0, 4, 6, 120, 'Dumbbells on shoulders. Drive up fast.'),
  reps('db-box-squat', 'DB box squat to bench', ['squat'], ['db', 'bench'], 0, 4, 8, 90, 'Sit back to the bench, pause, stand explosively. Easy on the knees.'),
  reps('tonal-front-squat', 'Tonal front squat', ['squat'], ['tonal'], 0, 4, 6, 120, 'Use when you want more load than the dumbbells give you.'),

  // ---------- Strength: hinge ----------
  reps('db-rdl', 'DB Romanian deadlift', ['hinge'], ['db'], 0, 4, 8, 90, 'Soft knees, push hips back until you feel your hamstrings, then stand tall.'),
  reps('db-deadlift', 'DB deadlift', ['hinge'], ['db'], 0, 4, 6, 120, 'Dumbbells at your sides, flat back, push the floor away.'),
  reps('db-hip-thrust', 'DB hip thrust on bench', ['hinge'], ['db', 'bench'], 0, 3, 10, 90, 'Upper back on the bench, dumbbell on hips. Squeeze glutes hard at the top.'),
  reps('tonal-deadlift', 'Tonal deadlift', ['hinge'], ['tonal'], 0, 4, 6, 120, 'Use when you want more load than the dumbbells give you.'),

  // ---------- Strength: push ----------
  reps('db-bench', 'DB bench press', ['push'], ['db', 'bench'], 0, 4, 8, 90, 'Shoulder blades pinned back, control down, press fast.'),
  reps('pushup', 'Push-ups', ['push'], ['bw'], 0, 3, 15, 60, 'Body in one straight line. Add a pause at the bottom when 15 feels easy.'),
  reps('db-floor-press', 'DB floor press', ['push'], ['db'], 0, 3, 10, 75, 'Elbows touch the floor, pause, press.'),
  reps('tonal-bench', 'Tonal bench press', ['push'], ['tonal', 'bench'], 0, 4, 6, 120, 'Heavier pressing day.'),

  // ---------- Strength: pull ----------
  reps('db-row', 'One-arm DB row', ['pull'], ['db', 'bench'], 0, 4, 10, 75, 'Hand and knee on bench. Pull the dumbbell to your hip.', SIDE),
  reps('db-bent-row', 'Bent-over DB row', ['pull'], ['db'], 0, 3, 10, 75, 'Hinge forward, flat back, row both dumbbells.'),
  reps('tonal-lat-pulldown', 'Tonal lat pulldown', ['pull'], ['tonal'], 0, 3, 10, 75, 'Pull elbows down to your ribs.'),
  reps('tonal-seated-row', 'Tonal seated row', ['pull'], ['tonal'], 0, 3, 10, 75, 'Tall chest, squeeze shoulder blades.'),

  // ---------- Strength: single leg ----------
  reps('bulgarian', 'Bulgarian split squat', ['single-leg'], ['db', 'bench'], 0, 3, 8, 90, 'Back foot on bench. Lean slightly forward. Stop short of any knee pain.', SIDE),
  reps('reverse-lunge', 'DB reverse lunge', ['single-leg'], ['db'], 0, 3, 8, 75, 'Step back, not forward. Gentler on the knees.', SIDE),
  reps('step-up', 'DB step-up onto bench', ['single-leg'], ['db', 'bench'], 0, 3, 8, 75, 'Drive through the whole front foot. Do not push off the back leg.', SIDE),
  reps('lateral-lunge', 'DB lateral lunge', ['single-leg'], ['db'], 0, 3, 8, 75, 'Big step sideways, sit into the hip. Great for guard footwork.', SIDE),
  reps('sl-rdl', 'Single-leg RDL', ['single-leg', 'hinge'], ['db'], 0, 3, 8, 75, 'Slow and balanced. Hips stay square.', SIDE),

  // ---------- Strength: shoulders / arms ----------
  reps('db-ohp', 'DB shoulder press', ['shoulders'], ['db'], 0, 3, 8, 90, 'Standing or seated. Ribs down, press straight up.'),
  reps('kneeling-press', 'Half-kneeling one-arm press', ['shoulders'], ['db'], 0, 3, 8, 75, 'Squeeze the glute of the down knee.', SIDE),
  reps('lateral-raise', 'DB lateral raise', ['shoulders'], ['db'], 0, 3, 12, 60, 'Light weight, lead with elbows.'),
  reps('db-curl', 'DB curl', ['arms'], ['db'], 0, 3, 10, 60, 'No swinging.'),
  reps('hammer-curl', 'Hammer curl', ['arms'], ['db'], 0, 3, 10, 60, 'Thumbs up the whole time.'),
  reps('oh-triceps', 'Overhead DB triceps extension', ['arms'], ['db'], 0, 3, 12, 60, 'Elbows point forward.'),

  // ---------- Core ----------
  reps('dead-bug', 'Dead bug', ['core'], ['bw'], 0, 3, 10, 45, 'Low back glued to the floor.', SIDE),
  reps('side-plank', 'Side plank', ['core'], ['bw'], 0, 3, 30, 45, 'Straight line from head to feet.', { ...SIDE, ...SEC }),
  reps('hollow-hold', 'Hollow hold', ['core'], ['bw'], 0, 3, 30, 45, 'Low back down, arms overhead.', SEC),
  reps('suitcase-carry', 'Suitcase carry', ['core'], ['db'], 0, 3, 40, 60, 'Heavy dumbbell in one hand, walk tall without leaning.', { ...SIDE, repUnit: 'm' }),
  reps('tonal-pallof', 'Tonal Pallof press', ['core'], ['tonal'], 0, 3, 10, 45, 'Press out and resist the twist.', SIDE),

  // ---------- Calves & knee care (prehab) ----------
  reps('sl-calf-raise', 'Single-leg calf raise', ['calves', 'knee-care'], ['db'], 0, 3, 12, 45, 'Full range, 2 s up, 2 s down. Strong calves protect the knees.', SIDE),
  reps('tib-raise', 'Tibialis raise', ['calves', 'knee-care'], ['bw'], 0, 3, 20, 45, 'Back against a wall, heels out, lift your toes.'),
  reps('wall-sit', 'Wall sit (pain-free depth)', ['knee-care'], ['bw'], 0, 4, 45, 60, 'Holds like this often calm sore knees. Only go as deep as feels okay.', SEC),
  reps('step-down', 'Slow step-down off bench', ['knee-care', 'single-leg'], ['bench'], 0, 3, 8, 60, 'Lower for 3 s, tap the heel, knee tracks over the middle toe.', SIDE),
  reps('sl-glute-bridge', 'Single-leg glute bridge', ['knee-care', 'hinge'], ['bw'], 0, 3, 10, 45, 'Strong hips take stress off the knees.', SIDE),
  reps('copenhagen', 'Copenhagen side plank (bench)', ['knee-care', 'core'], ['bench'], 0, 3, 20, 45, 'Top leg on bench. Build inner-thigh strength for cuts.', { ...SIDE, ...SEC }),

  // ---------- Plyometrics / vertical ----------
  reps('cmj', 'Countermovement jump', ['jump-vertical'], ['bw'], 2, 4, 4, 75, 'Max effort every rep, stick a quiet landing. Quality over quantity.'),
  reps('approach-jump', 'Approach jump (touch high)', ['jump-vertical'], ['court'], 2, 4, 3, 90, '2–3 step approach like a dunk attempt. Full rest between jumps.'),
  reps('db-jump-squat', 'Light DB jump squat', ['jump-vertical'], ['db'], 2, 3, 5, 90, '10–15 lb dumbbells only. Land soft, reset each rep.'),
  reps('pool-vert', 'Pool vertical jumps', ['jump-vertical'], ['pool'], 1, 4, 6, 60, 'Chest-deep water. Explode up. Water softens the landing.'),
  reps('sl-hop-stick', 'Single-leg hop and stick', ['jump-single'], ['bw'], 2, 3, 4, 60, 'Small hop forward, hold the landing for 2 s.', SIDE),
  reps('skater-hops', 'Lateral skater hops', ['jump-single'], ['bw'], 2, 3, 5, 60, 'Bound sideways, stick each landing. Guard-specific power.', SIDE),
  reps('pool-sl-hops', 'Pool single-leg hops', ['jump-single'], ['pool'], 1, 3, 6, 45, 'Waist-to-chest-deep water.', SIDE),
  reps('broad-jump', 'Broad jump (stick)', ['jump-horizontal'], ['bw'], 2, 4, 3, 75, 'Swing arms, jump far, stick it. Walk back.'),
  reps('pool-tuck', 'Pool tuck jumps', ['jump-horizontal', 'reactive'], ['pool'], 1, 3, 8, 45, 'Knees to chest, land soft.'),
  reps('pogo', 'Pogo hops', ['reactive'], ['bw'], 2, 3, 15, 60, 'Stiff ankles, quick off the ground. Skip if knees ache.'),
  reps('depth-drop', 'Depth drop to stick (from bench)', ['reactive'], ['bench'], 2, 3, 4, 75, 'Step off, land in a quiet athletic stance. Builds landing strength.'),
  reps('explosive-pushup', 'Explosive push-ups', ['power-upper'], ['bw'], 0, 4, 5, 75, 'Push hard enough that your hands leave the floor.'),
  reps('db-push-press', 'DB push press', ['power-upper'], ['db'], 0, 4, 5, 90, 'Small dip, drive with legs, press overhead.'),
  reps('db-high-pull', 'DB high pull', ['power-upper'], ['db'], 0, 3, 6, 75, 'Explode from the hips, elbows high.'),

  // ---------- Speed & agility ----------
  sprint('accel-20', 'Acceleration sprints', ['accel'], ['outdoor'], 2, 6, 20, 75, 'From a 2-point start. Lean, push, full speed. Walk back.'),
  sprint('falling-start', 'Falling starts', ['accel'], ['court'], 2, 5, 10, 60, 'Lean until you fall forward, then explode.'),
  reps('bike-sprint-10', 'Bike sprints (all-out)', ['accel', 'engine'], ['bike'], 0, 8, 10, 50, 'All-out pedaling. Zero knee pounding.', SEC),
  sprint('pool-sprint', 'Pool sprints', ['accel', 'max-speed'], ['pool'], 0, 6, 25, 60, 'Half a length, max effort.'),
  sprint('flying-20', 'Flying 20s', ['max-speed'], ['outdoor'], 2, 4, 20, 150, '20 m build-up, then 20 m at top speed. Full rest.'),
  reps('bike-flying', 'Bike flying sprints', ['max-speed'], ['bike'], 0, 6, 20, 90, 'Build for 10 s, then 20 s at top speed.', SEC),
  sprint('shuttle-5105', '5-10-5 shuttle', ['agility'], ['court'], 2, 5, 20, 60, 'Low hips at each turn. This is a benchmark you will test later.'),
  reps('def-slides', 'Defensive slide drill', ['agility'], ['court'], 1, 5, 20, 40, 'Lane-to-lane slides, stay low, do not cross your feet.', SEC),
  reps('closeout-slide', 'Closeout and slide', ['agility'], ['court'], 1, 4, 6, 45, 'Sprint, chop feet, closeout with hands high, slide two steps.'),
  reps('pool-shuffle', 'Pool lateral shuffles', ['agility'], ['pool'], 0, 4, 30, 30, 'Chest-deep water, quick feet.', SEC),
  sprint('decel', 'Sprint-to-stop drill', ['decel'], ['court'], 2, 5, 10, 45, 'Sprint, stop in 2 steps, hold the athletic stance.'),
  reps('snap-down', 'Snap-downs', ['decel'], ['bw'], 1, 3, 6, 45, 'Arms swing down fast, land in a stable athletic stance.'),

  // ---------- Running (the generator sets the minutes) ----------
  cardio('run', 'run-easy', 'Easy run', ['run'], ['outdoor'], 2, 30, 'Conversational pace the whole way.', { maxMin: 40 }),
  cardio('run', 'run-walk', 'Run–walk', ['run'], ['outdoor'], 2, 25, 'Run 4 min, walk 1 min. Repeat. Kind to sore knees.', { maxMin: 30 }),
  cardio('run', 'run-tempo', 'Tempo run', ['run'], ['outdoor'], 2, 30, '10 min easy, then 3× 6 min comfortably hard with 2 min easy jog between.', { maxMin: 35 }),
  cardio('run', 'run-intervals', 'Mile-pace intervals', ['run'], ['outdoor'], 2, 30, '10 min easy, then 6× 400 m at goal mile pace with 2 min walk/jog between.', { maxMin: 30 }),

  // ---------- Conditioning ----------
  cardio('bike', 'bike-intervals', 'Bike intervals', ['engine'], ['bike'], 0, 16, '1 min hard / 1 min easy.', { maxMin: 24 }),
  cardio('swim', 'swim-intervals-cond', 'Swim intervals', ['engine'], ['pool'], 0, 16, 'Hard 50 m (1 lap), rest 45 s. Repeat.', { laps: 8, maxMin: 24 }),
  sprint('court-sprints', 'Baseline-to-baseline sprints', ['engine'], ['court'], 2, 8, 28, 45, 'Down and back counts as one. Game-speed conditioning.'),
  time('db-complex', 'DB complex', ['circuit'], ['db'], 0, 10, '6 reps each without setting the dumbbells down: RDL → row → hang clean → press → squat. 5 rounds, 90 s rest.'),
  time('bw-circuit', 'Bodyweight circuit', ['circuit'], ['bw'], 1, 10, '40 s on / 20 s off: push-ups, reverse lunges, mountain climbers, plank. 3 rounds.'),
  time('tonal-hiit', 'Tonal conditioning circuit', ['circuit'], ['tonal'], 0, 12, 'Pick a short Tonal HIIT or circuit program.'),
  time('slide-sprint-finisher', 'Slide + sprint finisher', ['circuit'], ['court'], 2, 8, 'Slide lane-to-lane ×4, sprint to half court, back-pedal. 6 rounds, 60 s rest.'),

  // ---------- Basketball skills ----------
  time('handles-stationary', 'Stationary ball-handling series', ['handle'], ['ball'], 0, 10, 'Crossovers, between legs, behind back, combos. 30 s each, both hands, eyes up.'),
  time('two-ball', 'Two-ball dribbling', ['handle'], ['ball'], 0, 8, 'Same-time and alternating pounds, then crossovers. Needs two balls.'),
  time('full-court-handles', 'Change-of-pace dribbling', ['handle'], ['ball', 'court'], 1, 8, 'Hesi, in-and-out, retreat dribble. Go slow-fast-slow, sell the change of speed.'),
  time('guard-moves', 'Guard moves into pull-up', ['moves'], ['ball', 'court'], 1, 10, 'Hesitation, crossover, in-and-out into a one-dribble pull-up. Game speed.'),
  time('pnr-reads', 'Pick-and-roll reads', ['moves'], ['ball', 'court'], 1, 10, 'Chair as the screener. Reject, use, split, snake. Finish each with a shot.'),
  time('wall-passing', 'Live-dribble passing', ['moves'], ['ball'], 0, 6, 'Dribble and pass off a wall: one-hand push, skip, pocket pass.'),
  shots('mikan', 'Mikan drill + reverse layups', ['finish'], ['ball', 'court'], 1, 30, 6, 'finish', 'Alternate sides, both hands. Soft touch.'),
  shots('euro-floater', 'Euro step and floater finishes', ['finish'], ['ball', 'court'], 2, 30, 8, 'finish', 'Off the dribble from the wing and top.'),
  shots('power-layup', 'Two-foot power finishes', ['finish'], ['ball', 'court'], 2, 20, 6, 'finish', 'Jump stop, chin the ball, finish strong through contact.'),
  shots('catch-shoot-3', 'Catch-and-shoot threes', ['shoot-3'], ['ball', 'court'], 1, 50, 12, 'three', 'Toss to yourself, hop into the shot. Rotate around the arc.'),
  shots('dribble-3', 'Off-the-dribble threes', ['shoot-3'], ['ball', 'court'], 1, 40, 12, 'three', 'One- or two-dribble pull-ups. Guard shot.'),
  shots('pullup-mid', 'Pull-up jumpers (elbows)', ['shoot-mid'], ['ball', 'court'], 1, 40, 10, 'mid', 'Attack, stop on a dime, rise straight up.'),
  shots('form-shooting', 'Form shooting', ['shoot-mid'], ['ball', 'court'], 0, 30, 6, 'close', 'One hand, close range. Perfect arc and follow-through.'),
  shots('ft-sets', 'Free throws (sets of 10)', ['shoot-ft'], ['ball', 'court'], 0, 50, 10, 'ft', 'Same routine every shot.'),
  shots('ft-tired', 'Free throws when tired', ['shoot-ft'], ['ball', 'court'], 1, 20, 6, 'ft', 'Sprint baseline-and-back, then 2 free throws. Like a game.'),

  // ---------- Swim / bike ----------
  cardio('swim', 'swim-steady', 'Steady swim', ['swim', 'easy-cardio'], ['pool'], 0, 20, 'Smooth, even pace. Rest at the wall when needed.', { laps: 10, maxMin: 30 }),
  cardio('swim', 'swim-intervals', 'Swim intervals', ['swim'], ['pool'], 0, 20, '50 m (1 lap) at a strong pace, 30 s rest. Repeat.', { laps: 10, maxMin: 30 }),
  time('pool-run', 'Deep-water pool running', ['swim', 'easy-cardio'], ['pool'], 0, 20, 'Run motion in deep water. Running fitness with zero impact.', { maxMin: 40 }),
  cardio('bike', 'bike-steady', 'Steady bike ride', ['bike', 'easy-cardio'], ['bike'], 0, 40, 'Zone 2: steady and conversational.', { maxMin: 90 }),
  cardio('bike', 'bike-tempo', 'Bike tempo ride', ['bike'], ['bike'], 0, 30, '10 min easy, then 2× 10 min comfortably hard.', { maxMin: 45 }),

  // ---------- Recovery ----------
  time('mobility-flow', 'Full-body mobility flow', ['mobility'], ['bw'], 0, 15, "World's greatest stretch, 90/90 hips, cat-cow, thoracic rotations, deep squat hold.", { maxMin: 30 }),
  time('hip-ankle', 'Hip & ankle mobility', ['mobility'], ['bw'], 0, 10, 'Knee-to-wall ankle rocks, 90/90 switches, hip flexor stretch.'),
  time('core-breathing', 'Easy core + breathing', ['mobility'], ['bw'], 0, 8, 'Dead bugs, bird dogs, 2 min slow nose breathing.'),
  time('walk', 'Easy walk', ['easy-cardio'], ['outdoor'], 0, 20, 'Relaxed pace. Fresh air counts.', { maxMin: 45 }),
];

export const byId = id => LIBRARY.find(e => e.id === id);
