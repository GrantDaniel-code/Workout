// Court Lab: screens and navigation.

const view = document.getElementById('view');

document.getElementById('today').textContent = new Date()
  .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  .toUpperCase();

const routes = {
  home: () => `
    <div class="h1">Game Day</div>
    <p class="sub">Your training scoreboard.</p>
    <div class="scoreboard">
      <div class="score"><div class="num">0</div><div class="lbl">Workouts</div></div>
      <div class="score"><div class="num">0</div><div class="lbl">Streak</div></div>
      <div class="score"><div class="num">0</div><div class="lbl">This week</div></div>
    </div>
    <div class="empty"><div class="big">Tip-off soon</div>Workout generator coming in step 1.</div>`,
  history: () => `<div class="h1">History</div><div class="empty">No workouts yet.</div>`,
  settings: () => `<div class="h1">Settings</div><div class="empty">Coming soon.</div>`,
};

function render() {
  const tab = (location.hash.replace('#/', '') || 'home').split('/')[0];
  view.innerHTML = (routes[tab] || routes.home)();
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
}

window.addEventListener('hashchange', render);
render();
