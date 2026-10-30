/* =====================================================================
   Pure Racing FX — FFB Lab : modèle de calibration partagé
   Source unique des hypothèses. Le comparateur est l'outil de calibration ;
   le calculateur réutilise ces fonctions au lieu d'avoir sa propre formule.
   ===================================================================== */
(function (root) {
  'use strict';

  /* Hypothèses de calibration (repères communautaires, non validés pour LMU) */
  const LIMITS = {
    G: { min: 0.30, max: 0.60 },        // sortie spécifique visée : Nm de base par Nm de voiture
    margin: { min: 0.10, max: 0.60 },   // marge avant écrêtage visée
    marginTarget: 0.20,                 // valeur préférée (hors vibreurs) : laisse la place aux pics des vibreurs en attaque
                                        // (essai LMU Spa, Mercedes LMGT3, oct. 2026 : 24 % hors vibreurs -> pic 90 %, écrêtage 0,2 %)
    acPeak: { min: 0.75, max: 0.90 }    // AC : pic de force visé (fraction de la pleine échelle)
  };

  /* C : couple réellement disponible à la base */
  function baseTorque(A, T, B) { return Math.min(A, T) * B; }

  /* E : couple voiture qui donne 100 % du signal.
     LMU : hypothèse « STC = couple disponible » → 1 Nm voiture = 1 Nm base à 100 %. */
  function lmuEq(STC, s, m) { return STC / (s * m); }
  function lmuStrength(STC, m, E) { return STC / (E * m); }

  /* Évaluation d'un réglage connu (C, E, H) */
  function evaluate(C, Eq, H) {
    const G = C / Eq, J = G * H, K = C - J;
    return { C, Eq, G, J, K, L: K / C };
  }
  function evaluatePeak(C, P) {           // AC : pic mesuré P
    const J = P * C, K = C - J;
    return { C, J, K, L: 1 - P, G: NaN };
  }

  /* Fenêtre de E respectant à la fois la sortie spécifique et la marge */
  function windowE(C, H) {
    const M = C / LIMITS.G.max, N = C / LIMITS.G.min;
    const lo = Math.max(M, H / (1 - LIMITS.margin.min));
    const hi = Math.min(N, H / (1 - LIMITS.margin.max));
    return { M, N, lo, hi, ok: lo <= hi };
  }

  /* LMU : recommandation de Force Feedback Strength (fraction, plafonnée à 100 %).
     pick = valeur visant la marge préférée (marginTarget, 20 %), ramenée dans la fenêtre du comparateur.
     feasible = false si aucune valeur ≤ 100 % ne respecte la fenêtre :
     la cible ne peut pas être atteinte avec ces hypothèses (à vérifier en télémétrie),
     ce qui n'implique pas automatiquement de modifier le driver. */
  function lmuRecommend(C, STC, m, H) {
    const w = windowE(C, H);
    const sMin = lmuStrength(STC, m, w.hi), sMax = lmuStrength(STC, m, w.lo);
    const target = lmuStrength(STC, m, H / (1 - LIMITS.marginTarget));
    const feasible = w.ok && sMin <= 1;
    let pick;
    if (feasible) pick = Math.min(1, Math.max(sMin, Math.min(sMax, target)));
    else pick = Math.min(1, target);
    const res = evaluate(C, lmuEq(STC, pick, m), H);
    return { window: w, sMin, sMax: Math.min(1, sMax), target, pick, feasible, capped: target > 1, ...res };
  }

  /* AC : fenêtre de gain à partir d'un pic mesuré P au gain g */
  function acGainWindow(g, P) {
    return { lo: g * LIMITS.acPeak.min / P, hi: g * LIMITS.acPeak.max / P };
  }

  /* Verdicts communs */
  function statusG(G) {
    if (!Number.isFinite(G)) return ['neutral', '–'];
    if (G > LIMITS.G.max) return ['bad', 'Force élevée : risque de lutter avec le volant'];
    if (G < LIMITS.G.min) return ['warn', 'Plage dynamique faible : détails peu perceptibles'];
    return ['ok', 'Dans la bonne plage (30-60 %)'];
  }
  function statusL(L) {
    if (!Number.isFinite(L)) return ['neutral', '–'];
    if (L < 0) return ['bad', 'Écrêtage : détails perdus'];
    if (L <= LIMITS.margin.min) return ['risk', 'Risque d\'écrêtage aux limites'];
    if (L > LIMITS.margin.max) return ['warn', 'Marge excessive : résolution réduite'];
    return ['ok', 'Marge correcte'];
  }

  /* Couples de direction max indicatifs (hors vibreurs). Seules les GT3 sont mesurées dans LMU ; les autres sont des estimations. */
  const CARS = [["GT3 / LMGT3 moteur central (mesuré LMU)",12,12.5],["GT3 / LMGT3 moteur avant (mesuré LMU)",14,15],["Hypercar / LMDh / GTP",10,16],["GT4",12,18],["Porsche 911 Cup (992)",18,20],["Formula 3",14,20]];

  /* =====================================================================
     Calculateur : données des marques et des jeux, référence validée et
     calcul des réglages de départ. Partagés par le calculateur et le
     comparateur (« Mon réglage » face à la proposition).
     ===================================================================== */
  const Calc = (function () {
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const FFBModel = { lmuRecommend, evaluate, lmuEq };
    const BRANDS = {
      simagic:{name:'Simagic', soft:'SimPro Manager', strength:'Force Feedback (puissance globale)', strengthUnit:'pct',
        models:[['Alpha EVO Sport',9],['Alpha Mini',10],['Alpha EVO',12],['Alpha',15],['Alpha EVO Pro',18],['Alpha U',23]],
        params:[
          {k:'D', name:'Mechanical Damper (amortissement)', f:x=>x, max:50, typ:[4,20]},
          {k:'F', name:'Mechanical Friction', f:x=>x, max:20, typ:[0,6]},
          {k:'I', name:'Mechanical Inertia (inertie)', f:x=>x, max:40, typ:[0,20]}],
        extras:[['Vitesse de rotation de la roue (WRS)','0 au départ · 3 max, Damper au-dessus'],['Smoothing (lissage)','1 (2 à 3 si le FFB grésille)'],['FFB Detail','0'],['Other Effects · Mechanical Spring, Center Damper','0 %'],['Other Effects · Game Spring, Damper, Friction, Inertia','100 (neutre)']]},
      moza:{name:'Moza', soft:'Pit House', strength:'Maximum Output Torque Limit', strengthUnit:'pct',
        models:[['R3',3.9],['R5',5.5],['R9',9],['R12',12],['R16',16],['R21',21],['R25 Ultra',25]],
        params:[
          {k:'D', name:'Wheel Damper', f:x=>x, max:60, typ:[5,35]},
          {k:'F', name:'Wheel Friction', f:x=>10+4*x, max:60, typ:[10,25]},
          {k:'I', name:'Natural Inertia', f:x=>100+5*x, max:250, typ:[100,170], unit:'%', note:'100 % = neutre'}],
        extras:[['Game Force Feedback Intensity','100 %'],['Road Sensitivity','3 à 5'],['Hands-Off Protection','Off sur LMU'],['Maximum Wheel Speed','par défaut']]},
      fanatec:{name:'Fanatec', soft:'Fanatec App / menu tuning', strength:'FFB (mode Peak)', strengthUnit:'pct',
        models:[['CSL DD (5 Nm)',5],['CSL DD Boost (8 Nm)',8],['ClubSport DD',15],['ClubSport DD+',18],['Podium DD1',20],['Podium DD2',25]],
        params:[
          {k:'D', name:'NDP (Natural Damper)', f:x=>x, max:100, typ:[5,25], unit:''},
          {k:'F', name:'NFR (Natural Friction)', f:x=>2.5*x, max:100, typ:[0,10], unit:''},
          {k:'I', name:'NIN (Natural Inertia)', f:x=>0.8*x, max:100, typ:[0,20], unit:''}],
        extras:[['INT (interpolation)','2 (DD1/DD2) · 0 à 1 (ClubSport DD)'],['FEI','100'],['FOR / SPR / DPR','100'],['SEN','Auto']]},
      simucube:{name:'Simucube', soft:'Simucube Tuner', strength:'Overall Strength', strengthUnit:'pct',
        models:[['Simucube 2 Sport',17],['Simucube 2 Pro',25],['Simucube 2 Ultimate',32]],
        params:[
          {k:'D', name:'Damping', f:x=>0.6*x, max:40, typ:[3,15]},
          {k:'F', name:'Friction', f:x=>1.5*x, max:20, typ:[0,5]},
          {k:'I', name:'Inertia', f:x=>0.4*x, max:20, typ:[0,6]}],
        extras:[['Reconstruction Filter','1 à 3'],['Static Force Reduction','Off'],['Slew Rate Limit','Off']]},
      asetek:{name:'Asetek', soft:'RaceHub', strength:'Overall Force', strengthUnit:'nm',
        models:[['Initium',5.5],['La Prima',12],['La Prima+',16],['Forte',18],['Invicta',27]],
        params:[
          {k:'D', name:'Damping', f:x=>0.6*x, max:40, typ:[0,15]},
          {k:'F', name:'Friction', f:x=>4*x, max:40, typ:[0,15]},
          {k:'I', name:'Inertia', f:x=>0.3*x, max:10, typ:[0,5], unit:'', note:'échelle 0 à 10'}],
        extras:[['Anti-Oscillation','0 % (monter si oscillation)'],['Torque Behavior Prediction','0 à 1'],['High Frequency Limit','No Limit']]}
    };

    const GAMES = {
      lmu:{name:'Le Mans Ultimate / rFactor 2', kD:1.0, kI:1.0, kF:1.0},
      ac:{name:'Assetto Corsa', kD:1.0, kI:1.0, kF:1.0},
      ace:{name:'Assetto Corsa EVO', kD:0.4, kI:0.7, kF:1.0}
    };

    const PREFS = {light:10, normal:14, strong:18}; // couple de saturation (Nm)
    const TAU = 11.8;                                // constante de la courbe (Nm)

    // Référence validée sur piste (AC, Spa, WRS 0, oct. 2026) : Alpha Mini 10 Nm, GT Neo 1,1 kg / 300 mm -> Damper 7, Friction 2, Inertie 4.
    // Les filtres suivent le couple ressenti visé (Tfeel), égal au plafond de référence de ce montage.
    // Plafond « Normale » recalé à 9,4 Nm (oct. 2026) sur deux essais LMU à Spa, driver 100 %, en attaque :
    // GT3 à 14 Nm -> 54 %, LMP2 à 12,3 Nm -> 56 % validés, soit ≈ 7,5 Nm au pic avec 20 % de marge.
    // (8 Nm auparavant : 48 % proposés pour la LMP2, niveau ≈ 70 % sous la fenêtre 75-90 % de l'Analyzer.)
    // v : changer la version écarte les références enregistrées par les navigateurs.
    const REF_DEFAULT = {base:10, T:9.4, m:1.1, dia:300, D:7, F:2, I:4, k:0.70, v:3};

    function inertia(m, diaMm, k){ const r = diaMm/2000; return k*m*r*r; } // kg·m²
    function curveT(B, Tmax){ return Tmax*(1-Math.exp(-B/TAU)); }

    function compute(s){
      const ref = s.ref;
      // Plafond de couple indicatif : courbe saturée, recalée pour que la référence tombe juste en "Normale"
      const scale = ref.T / curveT(ref.base, PREFS.normal);
      const Tmax = PREFS[s.pref]*scale;
      let T = curveT(s.B, Tmax);
      const limited = !s.full && T >= s.B;
      const Tpref = Math.min(T, s.B);          // plafond correspondant à la « Force souhaitée »
      T = s.full ? s.B : Tpref;               // driver à 100 % : toute la base, la force souhaitée se règle en jeu
      const pct = Math.round(T/s.B*100);
      const Tfeel = s.full ? Tpref : T;       // couple ressenti visé : sert aussi aux filtres (même ressenti, mêmes filtres)

      const Iw = inertia(s.m, s.dia, s.k);
      const Iref = inertia(ref.m, ref.dia, ref.k);
      const tq = Tfeel/ref.T, iq = Iw/Iref;
      const g = GAMES[s.game];

      // Équivalents à l'échelle Simagic
      const D = clamp(ref.D*Math.sqrt(tq*iq)*g.kD, 0, 45);
      const I = clamp(ref.I*Math.sqrt(tq/iq)*g.kI, 0, 35);
      const F = clamp(ref.F*g.kF, 0, 15);

      // Indice de réactivité : couple / inertie du volant seul, relatif à la référence (avant compensation driver)
      const osc = (T/Iw)/(ref.T/Iref); // indicateur de réactivité, PAS un risque mesuré

      // LMU / rF2 : hypothèses et recommandation reprises du comparateur (ffb-model.js), source unique.
      const C = s.B*pct/100;                      // couple délivré au % driver arrondi
      const STC = Math.round(C*2)/2;              // hypothèse : STC = couple disponible
      let lmu = FFBModel.lmuRecommend(C, STC, 1, s.H);
      let prefApplied = false, prefClamped = false;
      if(s.full){
        // Driver à 100 % : la « Force souhaitée » s'applique à la force en jeu. On vise le même pic au volant
        // que le réglage driver réduit (même ressenti), en gardant toute la base comme réserve pour les chocs.
        const pPref = Math.round(Tpref/s.B*100), Cp = s.B*pPref/100, STCp = Math.round(Cp*2)/2;
        const want = FFBModel.lmuRecommend(Cp, STCp, 1, s.H).J / s.H;   // force en jeu (m = 1) donnant ce pic
        let pick = want;
        if(lmu.feasible){ pick = clamp(want, lmu.sMin, lmu.sMax); prefClamped = Math.abs(pick-want) > 0.005; }
        pick = Math.min(1, pick);
        lmu = Object.assign({}, lmu, FFBModel.evaluate(C, FFBModel.lmuEq(STC, pick, 1), s.H), {pick, prefTarget: want});
        prefApplied = true;
      }
      const strength = lmu.pick, peak = lmu.J;
      return {T, Tmax, Tpref, Tfeel, pct, limited, Iw, Iref, D, F, I, osc, C, STC, lmu, strength, peak, prefApplied, prefClamped};
    }

    /* Réglages du driver dans les unités de la marque (équivalents Simagic -> marque) */
    function brandValues(brandKey, r) {
      const b = BRANDS[brandKey];
      return b.params.map(p => {
        const raw = p.k === 'D' ? r.D : p.k === 'F' ? r.F : r.I;
        const v = Math.round(clamp(p.f(raw), 0, p.max));
        return { p, v, inTyp: v >= p.typ[0] && v <= p.typ[1] };
      });
    }
    return { BRANDS, GAMES, PREFS, TAU, REF_DEFAULT, inertia, curveT, compute, brandValues };
  })();

  root.FFBModel = { LIMITS, CARS, baseTorque, lmuEq, lmuStrength, evaluate, evaluatePeak, windowE, lmuRecommend, acGainWindow, statusG, statusL, Calc };
})(typeof window !== 'undefined' ? window : globalThis);
