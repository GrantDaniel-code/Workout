// Unit conversion. Everything is SAVED in metric (kg, meters, seconds)
// and converted to the unit system picked in Settings only for display.

const KG_PER_LB = 0.45359237;
const M_PER_MI = 1609.344;
const M_PER_YD = 0.9144;

const roundHalf = n => Math.round(n * 2) / 2;

export const weightUnit = sys => (sys === 'metric' ? 'kg' : 'lb');
export const distUnit = sys => (sys === 'metric' ? 'km' : 'mi');

// kg -> number shown on screen (rounded to the nearest 0.5)
export function showWeight(kg, sys) {
  if (kg == null || kg === '') return '';
  return roundHalf(sys === 'metric' ? kg : kg / KG_PER_LB);
}

// number typed on screen -> kg
export function readWeight(value, sys) {
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return sys === 'metric' ? n : n * KG_PER_LB;
}

// meters -> miles or km (for runs and rides)
export function showDist(m, sys) {
  if (m == null || m === '') return '';
  const n = sys === 'metric' ? m / 1000 : m / M_PER_MI;
  return Math.round(n * 100) / 100;
}

// miles or km typed on screen -> meters
export function readDist(value, sys) {
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return sys === 'metric' ? n * 1000 : n * M_PER_MI;
}

// Short distances like sprints: "20 m" or "22 yd"
export function shortDist(m, sys) {
  if (sys === 'metric') return `${m} m`;
  return `${Math.round(m / M_PER_YD)} yd`;
}

// seconds -> "7:05" or "1:02:30"
export function formatTime(sec) {
  if (sec == null || isNaN(sec)) return '';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// Pace per mile or km, e.g. "8:12 /mi"
export function formatPace(sec, m, sys) {
  if (!sec || !m) return '';
  const per = sys === 'metric' ? 1000 : M_PER_MI;
  return `${formatTime(sec / (m / per))} /${distUnit(sys)}`;
}
