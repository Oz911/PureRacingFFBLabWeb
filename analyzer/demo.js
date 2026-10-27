/* Pure Racing FX — FFB Analyzer : mode démonstration.
   Remplace l'API du plugin SimHub par un simulateur, avec les mêmes règles de calcul que le plugin
   (seuil 98 %, hystérésis 3 points, événement ≥ 40 ms, vitesse mini 10 km/h, marge = 1 − pic,
   fenêtre de gain 0,75/pic à 0,90/pic). Aucune donnée n'est mesurée. */
(function () {
  'use strict';
  window.PFA_DEMO = true;

  const HZ = 60, THR = 0.98, REL = 0.95, MIN_EVT = 0.040, LAP_S = 40;
  // Virages de Spa (position sur le tour, largeur, charge) : la charge FFB monte dans les appuis
  const CORNERS = [[.03, .012, .55], [.10, .020, .95], [.17, .015, .70], [.25, .010, .45], [.33, .030, 1.02],
                   [.42, .018, .80], [.50, .025, .90], [.58, .012, .60], [.66, .035, 1.08], [.76, .020, .85],
                   [.86, .015, .75], [.95, .010, .50]];
  // Scénario : la force en jeu est trop haute, le pilote la baisse après deux tours, puis la session recommence
  const GAINS = [0.85, 0.85, 0.62, 0.62, 0.62];

  let t = 0, lapIdx = 0, gainIdx = 0, rate = HZ;
  let hist = [], peakQ = [], laps = [], events = [];
  let inClip = false, clipStart = 0, clipPeak = 0, clipPos = 0;
  let lap = newLap(1), sess = { meas: 0, clip: 0, ev: 0, peak: 0 };
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function newLap(n) { return { lap: n, meas: 0, clip: 0, ev: 0, peak: 0, vals: [] }; }

  function load(pos) {
    let v = 0.18;
    for (const [c, w, a] of CORNERS) {
      let d = Math.abs(pos - c); d = Math.min(d, 1 - d);
      v += a * Math.exp(-Math.pow(d / w, 2));
    }
    return v;
  }

  function step() {
    const dt = 1 / HZ; t += dt;
    const pos = (t % LAP_S) / LAP_S;
    const g = GAINS[gainIdx];
    const kerb = (pos > .325 && pos < .34) || (pos > .655 && pos < .67) ? 0.12 * Math.sin(t * 90) : 0;
    let v = (load(pos) + 0.04 * Math.sin(t * 23) + 0.025 * (rnd() - .5) + kerb) * g;
    v = Math.max(0, Math.min(1, v));                       // le jeu sature à 100 %
    const sign = Math.sin(pos * Math.PI * 14) >= 0 ? 1 : -1;
    const f = v * sign, a = v;

    hist.push([t, f]); while (hist.length && t - hist[0][0] > 10) hist.shift();
    peakQ.push([t, a]); while (peakQ.length && t - peakQ[0][0] > 3) peakQ.shift();

    lap.meas += dt; sess.meas += dt; lap.vals.push(a);
    if (a > lap.peak) lap.peak = a; if (a > sess.peak) sess.peak = a;
    if (a >= THR) { lap.clip += dt; sess.clip += dt; }
    if (!inClip && a >= THR) { inClip = true; clipStart = t; clipPeak = a; clipPos = pos; }
    else if (inClip) {
      if (a > clipPeak) clipPeak = a;
      if (a < REL) {
        inClip = false;
        if (t - clipStart >= MIN_EVT) { lap.ev++; sess.ev++; events.push({ lap: lap.lap, duration_ms: (t - clipStart) * 1000, peak: clipPeak, track_pct: clipPos }); }
      }
    }

    // fin de tour
    if (Math.floor(t / LAP_S) > lapIdx) {
      lapIdx++;
      const s = lap.vals.slice().sort((x, y) => x - y);
      const p99 = s[Math.min(s.length - 1, Math.ceil(.99 * s.length) - 1)];
      const clipPct = lap.clip / lap.meas, margin = 1 - lap.peak;
      const status = clipPct > .01 || margin < 0 ? 'Clipping' : margin <= .10 ? 'Risk' : margin > .60 ? 'Excessive' : 'Ok';
      laps.push({ lap: lap.lap, time: 137 + rnd() * 2.5 - (lap.lap === 1 ? -3 : 0), clip_pct: clipPct, events: lap.ev, peak: lap.peak, p99: p99, margin: margin, status: status });
      gainIdx++;
      if (gainIdx >= GAINS.length) reset(); else lap = newLap(lap.lap + 1);
    }
  }

  function reset() {
    gainIdx = 0; laps = []; events = []; hist = []; peakQ = [];
    lap = newLap(1); sess = { meas: 0, clip: 0, ev: 0, peak: 0 }; inClip = false;
  }

  // Avance rapide au chargement : un tour complet est déjà dans le tableau
  for (let i = 0; i < HZ * LAP_S * 1.35; i++) step();
  setInterval(() => { for (let i = 0; i < 4; i++) step(); }, 4000 / HZ);

  function live() {
    const last = hist.length ? hist[hist.length - 1] : [t, 0];
    const lastLap = laps.length ? laps[laps.length - 1] : null;
    const stride = Math.max(1, Math.ceil(hist.length / 240));
    const ht = [], hv = [];
    for (let i = 0; i < hist.length; i += stride) {
      let best = i; for (let j = i; j < Math.min(hist.length, i + stride); j++) if (Math.abs(hist[j][1]) > Math.abs(hist[best][1])) best = j;
      ht.push(hist[best][0] - last[0]); hv.push(hist[best][1]);
    }
    return {
      version: '1.0.0', game: 'Le Mans Ultimate · Ferrari 296 LMGT3 · Spa', source_ok: true, source: 'démonstration',
      unit: 'normalized', full_scale: 1, raw: last[1], signal: last[1],
      peak_window: peakQ.reduce((m, x) => Math.max(m, x[1]), 0), clipping: inClip, threshold: THR,
      lap: lap.lap, lap_clip_pct: lap.meas ? lap.clip / lap.meas : 0, lap_clip_events: lap.ev, lap_peak: lap.peak,
      session_clip_pct: sess.meas ? sess.clip / sess.meas : 0, session_clip_events: sess.ev, session_peak: sess.peak,
      gain_lo: lastLap ? .75 / lastLap.peak : null, gain_hi: lastLap ? .90 / lastLap.peak : null,
      recording: true, session_id: 'demo', rate_hz: rate, history: { t: ht, v: hv }, laps: laps.slice(-30), events: events.slice(-15)
    };
  }

  const SESSIONS = [
    { id: 'demo-3', started: '2026-10-26T21:14:00', game: 'Le Mans Ultimate', car: 'Ferrari 296 LMGT3', track: 'Spa-Francorchamps', complete: true, totals: { laps: 12, clip_pct: .0021, peak: .99 } },
    { id: 'demo-2', started: '2026-10-25T18:40:00', game: 'Assetto Corsa', car: 'Porsche 911 GT3 R', track: 'Nürburgring GP', complete: true, totals: { laps: 9, clip_pct: .0184, peak: 1 } },
    { id: 'demo-1', started: '2026-10-24T20:05:00', game: 'rFactor 2', car: 'BMW M4 GT3', track: 'Monza', complete: true, totals: { laps: 15, clip_pct: 0, peak: .86 } }
  ];

  function csv() {
    const rows = ['temps_s;tour;position_piste_pct;vitesse_kmh;valeur_brute;signal_pct;ecretage;repere'];
    for (let i = 0; i < 600; i++) {
      const p = i / 600, v = Math.min(1, load(p) * .9);
      rows.push([(i / HZ).toFixed(3).replace('.', ','), 1, (p * 100).toFixed(2).replace('.', ','), '182,0', v.toFixed(4).replace('.', ','), (v * 100).toFixed(2).replace('.', ','), v >= THR ? 1 : 0, ''].join(';'));
    }
    return '﻿' + rows.join('\r\n');
  }

  const realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url, opts) {
    const u = String(url);
    const json = o => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    if (u.indexOf('api/live') === 0) return json(live());
    if (u.indexOf('api/sessions') === 0) return json(SESSIONS);
    return realFetch ? realFetch(url, opts) : Promise.reject(new Error('fetch indisponible'));
  };

  // Liens CSV de l'onglet Sessions : fichier d'exemple généré dans le navigateur
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href*="api/session/csv"]');
    if (!a) return;
    e.preventDefault();
    const url = URL.createObjectURL(new Blob([csv()], { type: 'text/csv;charset=utf-8' }));
    const l = document.createElement('a'); l.href = url; l.download = 'session-demo.csv'; document.body.appendChild(l); l.click(); l.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
