# Pure Racing FX — FFB Lab | Pack Odoo V1

## Contenu
- `index.html` : page d'accueil FFB Lab
- `calculateur-ffb.html` : calculateur
- `comparateur-ffb.html` : comparateur
- `test-piste-ffb.html` : validation sur piste
- `notice-ffb.html` : notice
- `codes-integration-odoo.md` : extraits iframe à coller dans Odoo

## Publication conseillée
1. Tester `index.html` localement. Les liens internes entre les quatre modules sont relatifs : conserver tous les HTML au même niveau.
2. Créer un dépôt **public** GitHub Pages distinct du plugin C# (par exemple `PureRacingFFBLabWeb`).
3. Importer les cinq fichiers HTML à la racine du dépôt et activer GitHub Pages dans Settings > Pages > Deploy from a branch (main, /root).
4. Vérifier l'URL réelle de GitHub Pages avant de la copier dans les iframes. Si l'iframe est bloquée par une politique d'intégration, utiliser un lien ouvrant l'outil dans un nouvel onglet.
5. Dans Odoo Online, créer les pages `/ffb-lab`, `/ffb-calculateur`, `/ffb-comparateur`, `/ffb-validation`, `/ffb-notice`. Ajouter un bloc d'intégration HTML si l'éditeur le permet et y coller le code iframe correspondant.
6. Publier d'abord une page de test non référencée, puis tester sur mobile et ordinateur.

## Remarques
- Odoo Online ne permet pas de déployer librement un module serveur personnalisé. Les outils restent des pages HTML statiques hébergées ailleurs.
- L'iframe affiche le contenu distant, elle ne le copie pas dans Odoo.
- Les fichiers HTML des quatre modules sont repris des versions précédemment fournies, **sans audit fonctionnel exhaustif ni recalibrage des formules**. Ne pas présenter les valeurs estimées comme des mesures réelles.
- Aucun serveur SimHub n'est inclus. Le module Analyzer reste séparé.
- L'hébergement GitHub Pages ne doit pas contenir de données privées ou de clés secrètes.
