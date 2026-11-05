# Codes iframe pour les pages Odoo

Remplacer `VOTRE-COMPTE` et `VOTRE-DEPOT` par le compte et le dépôt GitHub Pages publiés.

La hauteur est indicative et doit être adaptée selon les écrans.

## Menu conseillé

Le FFB Lab est un parcours en 4 étapes ; toutes les pages ont la même barre d'étapes (`ffb-nav.js`).

- Menu **FFB Lab** -> `/mon-reglage-ffb` (entrée du parcours)
- Sous-menu « Outils » : Calculateur (`/ffb-calculateur`), Notice (`/notice-ffb`)
- Comparateur (`/comparateur-ffb`) et Validation sur piste (`/test-piste-ffb`) : pages du parcours, accessibles par la barre d'étapes (inutile de les mettre au menu).

## 00 — Mon réglage (page Odoo : /mon-reglage-ffb)

Point de départ du parcours : matériel, réglages actuels et mesures du FFB Analyzer.

```html
<iframe src="https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/mon-reglage-ffb.html" title="Pure Racing FX — Mon réglage" loading="lazy" style="display:block;width:100%;height:1500px;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

## 01 — Calculateur FFB

```html
<iframe src="https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/calculateur-ffb.html" title="Pure Racing FX — Calculateur FFB" loading="lazy" style="display:block;width:100%;height:1450px;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

## 02 — Comparateur FFB

```html
<iframe src="https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/comparateur-ffb.html" title="Pure Racing FX — Comparateur FFB" loading="lazy" style="display:block;width:100%;height:1450px;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

## 03 — Validation sur piste

```html
<iframe src="https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/test-piste-ffb.html" title="Pure Racing FX — Validation sur piste" loading="lazy" style="display:block;width:100%;height:1450px;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

## 04 — FFB Analyzer (maquette)

```html
<iframe src="https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/analyzer/index.html" title="Pure Racing FX — FFB Analyzer" loading="lazy" style="display:block;width:100%;height:1300px;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

## 05 — Notice technique (page Odoo : /notice-ffb)

```html
<iframe src="https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/notice-ffb.html" title="Pure Racing FX — Notice technique" loading="lazy" style="display:block;width:100%;height:1900px;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

## 06 — Pure Racing Engineer, démo (page Odoo : /pure-racing-engineer)

Démo interactive du module Engineer de Pit Box : la vraie page du module, avec deux sessions LMU réelles à Spa
(pilote anonymisé), calculées à l'avance par Engineer (`engineer/demo-data.json`). Pour la mettre à jour, la
régénérer depuis le dépôt PureRacingFx (page `src/PureRacingFx/Modules/Engineer/Page/index.html`).

```html
<iframe src="https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/engineer/index.html" title="Pure Racing Engineer — Démo" loading="lazy" style="display:block;width:100%;height:1400px;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```


## 07 — Pit Box, démo de navigation (page Odoo au choix)

Captures réelles de Pit Box (accueil + 6 modules). Visite automatique : le curseur clique sur chaque module ;
le visiteur peut cliquer lui-même sur le menu de gauche, sur l'accueil ou sur les boutons sous l'image
(la visite reprend après 10 s sans clic). Images : `pitbox-demo/*.jpg` (à remplacer par de nouvelles captures
1670 × 902 si l'interface change).

```html
<iframe src="https://oz911.github.io/PureRacingFFBLabWeb/pitbox-demo/" title="Pit Box — Démo" loading="lazy" style="display:block;width:100%;aspect-ratio:1670/960;border:0;background:#070e2a" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```


## 08 — Les modules sur un volant (page d'accueil, fond blanc)

Photo d'un vrai volant (fournie par Pat) ; chaque élément présente un module : écran + LED = Dash,
bouton radio gauche = Spotter, bouton radio droit = Engineer, poignée gauche = FFB Lab et poignée droite =
FFB Analyzer (le volant tourne), molette ENGINE (vibre), molette MOTION (bouge), sélecteur central = Pit Box.
Survol = fiche du module ; clic = page du module sur pureracing-fx.odoo.com (liens dans `LIENS`, en haut du
script de `modules-hub/index.html`). Barre des 8 icônes sous le volant. Badge « BIENTÔT » du Spotter :
retirer `soon:true` et renseigner son lien à sa sortie. Hauteur plus grande sur téléphone (bloc `<style>`).

```html
<style>.prfx-volant{display:block;width:100%;height:600px;border:0;background:#fff}@media (max-width:600px){.prfx-volant{height:900px}}</style>
<iframe class="prfx-volant" src="https://oz911.github.io/PureRacingFFBLabWeb/modules-hub/" title="Pure Racing — modules Pit Box" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```
