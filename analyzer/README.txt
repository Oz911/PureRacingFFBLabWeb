PURE RACING FX — FFB ANALYZER · PAGE DE DÉMONSTRATION
=====================================================

Page web du module FFB Analyzer de Pit Box, en mode démonstration, aux couleurs du site
(gris anthracite, noir, rouge Pure Racing). Intégrée dans la page du module : site/ffb-analyzer.html.

index.html : la page servie par le module (src/PureRacingFx/Modules/FfbAnalyzer/web/index.html du dépôt
PureRacingFx, version du 17/11/2026), avec la charte du site en surcouche et le bandeau « Démonstration ».
app.js et data.js : copies du module (dans app.js, seules trois couleurs de dessin passent du bleu au gris/blanc). demo.js remplace l'API du module par un simulateur qui tourne
dans le navigateur, avec les mêmes règles de calcul (seuil 98 %, niveau de référence = 99,5e centile,
verdict par part d'écrêtage, tours avec incident exclus).

Scénario : Spa en LMU, trois tours. 1 : tête-à-queue, tour exclu. 2 : force en jeu à 72 %, écrêtage excessif
et conseil de baisse. 3 : force baissée à 56 %, réglage correct. Tours de 20 s, cycle complet d'environ 80 s.

Pour mettre à jour : recopier index.html, app.js et data.js du module, puis réappliquer la surcouche de style
(bloc « Charte du site » à la fin du <style>), le bandeau de démo et les scripts demo.js / hauteur.
Aucune donnée n'est mesurée ni envoyée.
