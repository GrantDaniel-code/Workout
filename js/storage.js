// Saving and loading. Data lives in this browser's localStorage on the phone.
// Nothing is sent anywhere. Use Settings > Export to make a backup file.

const KEYS = {
  settings: 'cl.settings',
  workouts: 'cl.workouts', // finished workouts, newest last
  draft: 'cl.draft',       // the workout being planned or logged right now
};

export const ALL_EQUIPMENT = ['bw', 'db', 'bench', 'tonal', 'court', 'ball', 'pool', 'bike', 'outdoor'];

export const DEFAULT_SETTINGS = {
  units: 'imperial',
  equipment: [...ALL_EQUIPMENT],
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    alert('Could not save. Your phone storage may be full or private browsing may be on.');
    throw err;
  }
}

export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) });
export const saveSettings = s => write(KEYS.settings, s);

export const getWorkouts = () => read(KEYS.workouts, []);
export const getWorkout = id => getWorkouts().find(w => w.id === id);

export function saveWorkout(w) {
  const all = getWorkouts().filter(x => x.id !== w.id);
  all.push(w);
  all.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  write(KEYS.workouts, all);
}

export const deleteWorkout = id => write(KEYS.workouts, getWorkouts().filter(w => w.id !== id));

export const getDraft = () => read(KEYS.draft, null);
export const saveDraft = d => write(KEYS.draft, d);
export const clearDraft = () => localStorage.removeItem(KEYS.draft);

// The most recent logged weight (kg) for an exercise, so the next workout starts there.
export function lastWeightFor(exId) {
  const all = getWorkouts();
  for (let i = all.length - 1; i >= 0; i--) {
    const item = all[i].items.find(it => it.exId === exId && it.log?.sets);
    if (!item) continue;
    const weights = item.log.sets.filter(s => s.done && s.kg).map(s => s.kg);
    if (weights.length) return Math.max(...weights);
  }
  return null;
}

export function exportAll() {
  return { app: 'courtlab', version: 1, exportedAt: new Date().toISOString(), settings: getSettings(), workouts: getWorkouts() };
}

export function importAll(data) {
  if (!data || data.app !== 'courtlab' || !Array.isArray(data.workouts)) throw new Error('Not a Court Lab backup file');
  write(KEYS.settings, data.settings || DEFAULT_SETTINGS);
  write(KEYS.workouts, data.workouts);
}

export function resetAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
