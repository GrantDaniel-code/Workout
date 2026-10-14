# Personal Workout App

A personal web app that generates workouts for me and lets me log and track them. It must open well on my phone.

## Working agreements (read first)
- I'm new to coding: explain things simply, avoid jargon, and keep the project easy to run (one command to start).
- Build the smallest working version first (generate a workout + log it), then add features one at a time.
- Commit to Git after each working step.
- Never write code that pushes through pain. Safety rules (see "Knee pain") override every other goal.

## About me
- Basketball player transitioning from forward to guard. I train on my own and with two different trainers.
- Goals: more explosiveness and vertical jump (I want to dunk), speed, strength, a faster mile, better shooting and ball handling, and eventually building endurance for triathlons.
- I care about recovery and injury prevention more than just piling on volume.
- I like tracking progress against benchmarks and seeing my consistency visually.

## Weekly schedule
- Basketball: 5x per week
- Weightlifting: 5x per week
- Running: about 4x per week (target)
- Workouts range from 45 minutes to 2 hours
- That's a heavy load, so the app must manage total weekly stress, not just plan each workout on its own.

## Starting benchmarks
| Benchmark | Starting value | Notes |
|---|---|---|
| Bench press | ~185 lb | Old number, needs a retest |
| Dumbbell curls | 20–35 lb | Working weights |
| Squat | 100 lb | |
| Deadlift | 100 lb | |
| DB shoulder press | 40s each hand | |
| Vertical jump | ~30 in | Goal: dunk |
| Mile | 7:00–7:30 | Goal: bring this down |
| Longest run | 10K | Felt okay |
| Longest swim | 15 laps of a 50 m pool | |
| 3-pt shooting (workouts) | ~70% | |
| Free throws | ~90% | |
| 100 m time | Not tested | App should prompt me to test and log |
| Shuttle/agility time | Not tested | App should prompt me to test and log |
| Max bike distance | Not tested | App should prompt me to test and log |

## Knee pain (important)
- My knees often hurt when I run. The app should never push through pain.
- Pain/soreness check-in before runs and jumping workouts.
- Offer lower-impact options (bike, swim, pool work) when my knees are sore.
- Build running volume up gradually.

## Equipment
- Home gym: dumbbells (~5–50 lb), a Tonal, a flat bench
- Home basketball court (plastic tile surface) and a home pool
- Can run and bike outdoors
- The generator must only use equipment I own.

## Features
1. **Workout generator**: builds workouts from my focus for the day (strength, plyometrics/vertical, speed, running, conditioning, basketball skills, swim/bike, recovery/mobility), how much time I have (45 min–2 hr), and my equipment.
2. **Weekly planning**: fits basketball, lifting, and running into one week; balances hard and easy days; avoids heavy legs or jumping right before or after hard running days; lets me mark trainer-session days.
3. **Logging**: sets, reps, weight, time, distance, and shots made/attempted by spot. Quick to use on my phone right after a workout.
4. **Progress tracking**: charts for lifts, mile time, vertical, shooting percentages, and the benchmarks above.
5. **Consistency tracker**: calendar or streak grid of training days, like a scoreboard.
6. **Check-ins**: how I felt, soreness (especially knees), and sleep, so the plan suggests easier days when I'm worn down.

## Design
- Bold, athletic, scoreboard-style look. Clean, dark mode, works great on a phone.

## Decisions (2026-10-14)
- **Phone only.** All data lives on the phone (browser storage). No accounts, no server, no sync. Settings has Export/Import as a backup.
- **The app builds workouts completely for me**, and I can edit everything: swap, remove, add, reorder exercises, change sets/reps/weight/time.
- Generation is **rules-based** (built-in exercise library + rules), not AI. AI can be added later.
- **Prefer bodyweight and dumbbells** whenever possible; use the Tonal only when it's clearly the better tool.
- Squat and deadlift numbers are **working weights**, not maxes. I have no way to max them, so never prompt for squat/deadlift max tests. Bench is a "flex" number: track it, but don't build plans around it.
- **No GitHub account yet.** For now the app runs from my Mac and opens on my phone over home Wi-Fi. Hosting comes later (step 8).
- **Trainer sessions have no fixed days.** I mark a session as "trainer" when I log it.
- **All 5 basketball sessions are skill work** (moderate stress, not games).
- **Shooting is tracked by shot type** (threes, mid-range, free throws, finishing), not by court spot.
- **Knees have not been checked by a doctor.** Gently recommend getting them checked when pain shows up.
- **Knee rules:** 0–10 pain scale before every workout. Pain 3+ → runs and jumps swap to bike/pool/low-impact. Pain 6+ → recovery only. During a workout, stop if pain goes above 3.
- **Units: both imperial and metric**, switchable in Settings. Data is stored in metric (kg, meters, seconds) and converted for display.

## Tech stack
- Node.js is not installed on my Mac, so the app uses **no build tools**: plain HTML, CSS, and JavaScript modules.
- Data storage: `localStorage` in the phone's browser (see `js/storage.js`).
- To run it: double-click `start.command` (or run `python3 serve.py`). It prints a link to open on my phone. Python 3 comes with macOS.
- Files:
  - `index.html`: page shell, `css/styles.css`: the scoreboard theme
  - `js/app.js`: screens and buttons
  - `js/exercises.js`: the exercise library (equipment, knee impact, default sets/reps)
  - `js/generator.js`: the rules that build a workout
  - `js/storage.js`: saving/loading data, `js/units.js`: lb/kg and mi/km conversion

## Build plan
0. Setup: project files, Git, dark scoreboard home screen, open on phone over Wi-Fi.
1. Smallest working version: generate a workout (focus + time + knee check), edit it, log it, see history.
2. Full check-ins: how I feel, soreness, sleep → suggests easier days.
3. More logging polish: faster entry, shot types summary.
4. Benchmarks: starting numbers loaded; prompts to test 100 m, shuttle/agility, max bike distance.
5. Progress charts: lifts, mile, vertical, shooting %.
6. Consistency scoreboard: calendar streak grid, weekly totals.
7. Weekly planner: daily stress score, trainer days, hard/easy balance, no heavy legs/jumps next to hard runs, gradual running build.
8. Go live: hosting + "Add to Home Screen" app install.
9. Later: triathlon endurance blocks, optional AI workouts, sync.

## Project status
- 2026-10-14: Steps 0 and 1 done (generate → edit → log → history, knee rules, units, export/import). Next: step 2, full check-ins.
