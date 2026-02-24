# ✅ Checklist de Validation - Système de Thème

## 📋 Avant de Tester

- [ ] Code refactorisé déployé
- [ ] Base de données synchronisée
- [ ] Navigateur cache vidé (F12 → Application → Clear)
- [ ] Couple avec accès à la BD créé

---

## 🧪 Test 1: Couleurs Par Défaut (Mode Dark)

**Objectif**: Vérifier que les couleurs par défaut s'affichent correctement en dark mode

### Étapes
1. [ ] Ouvrir l'application en mode dark (normal)
2. [ ] Vérifier l'interface est sombre:
   - [ ] Arrière-plan très foncé (presque noir)
   - [ ] Texte très blanc/clair
   - [ ] Couleur primaire rouge/rose visible
3. [ ] Ouvrir `Paramètres` (engrenage)
4. [ ] Vérifier section "Personnalisation des Couleurs"
   - [ ] Couleur Principale: Un rouge vigoureux (ex: #FF6B6B)
   - [ ] Couleur d'Accent: Visible
   - [ ] Fondale Principal: Très sombre

### ✅ Résultat Attendu
- L'interface est confortable à lire en dark mode
- Les couleurs sont vivantes et lisibles
- Pas de texte blanc sur fond blanc
- Bouton "Enregistrer" visible

---

## 🧪 Test 2: Toggle Dark → Light

**Objectif**: Vérifier que les couleurs s'adaptent intelligemment en light mode

### Étapes
1. [ ] Depuis Paramètres, cliquer le bouton ☀️ (en haut à droite)
2. [ ] Vérifier l'interface devient claire:
   - [ ] Arrière-plan très clair (presque blanc)
   - [ ] Texte très sombre (presque noir)
   - [ ] Couleur primaire visible mais plus sombre
3. [ ] **Important**: Les couleurs NE doivent PAS être simplement inversées
   - [ ] Couleur primaire: Pas ultra-saturée, lisible
   - [ ] Bordures: Gris clair, pas blanches
   - [ ] Texte: Très sombre, facile à lire
4. [ ] Vérifier section "Personnalisation des Couleurs"
   - [ ] Les inputs couleur affichent les MÊMES valeurs hex
   - [ ] L'aperçu montre les couleurs adaptées pour light
   - [ ] Pas de changement d'une couleur à l'autre

### ✅ Résultat Attendu
- L'interface est claire et lisible
- Les couleurs de l'utilisateur conservent leur essence
- Aucune perte de données / reset accidentel
- `localStorage.theme = 'light'`

---

## 🧪 Test 3: Toggle Light → Dark

**Objectif**: Retour au dark mode, vérifier cohérence

### Étapes
1. [ ] Cliquer le bouton 🌙 (pour revenir au dark)
2. [ ] Vérifier l'interface redevient sombre:
   - [ ] Matches à nouveau le Test 1
   - [ ] Couleurs lumineuses
   - [ ] Lisibilité excellente
3. [ ] Vérifier les inputs couleur:
   - [ ] Mêmes valeurs hex qu'avant le toggle light
   - [ ] Pas de changement lors du toggle

### ✅ Résultat Attendu
- Comportement cyclique: Dark → Light → Dark fonctionne parfaitement
- Les valeurs hex ne changent JAMAIS (juste l'adaptation visuelle)
- Au minimum 3 toggles successifs doivent fonctionner sans problème

---

## 🧪 Test 4: Personalization en Temps Réel

**Objectif**: Vérifier que le prévisualization live fonctionne

### Étapes
1. [ ] Aller à Paramètres (mode dark)
2. [ ] Cliquer sur le sélecteur de couleur pour "Couleur Principale"
3. [ ] Choisir une couleur (ex: bleu #0066FF)
4. [ ] **Immédiatement** vérifier:
   - [ ] La couleur dans l'input hex change: ✅
   - [ ] **L'aperçu sur la page change en temps réel**: ✅
   - [ ] Les boutons/éléments primaires changent de couleur: ✅
   - [ ] Pas de délai notable
5. [ ] Changer 2-3 couleurs:
   - [ ] Accent
   - [ ] Surface
   - [ ] Texte
6. [ ] Pour chaque changement, vérifier l'aperçu live

### ✅ Résultat Attendu
- **Live preview** fonctionne pour chaque couleur
- Aucun délai visible
- L'UI se met à jour au fil de la saisie
- All color pickers work smoothly

---

## 🧪 Test 5: Sauvegarde des Couleurs

**Objectif**: Vérifier que les couleurs personnalisées se sauvegardent

### Étapes
1. [ ] Avec des couleurs personnalisées visibles en aperçu
2. [ ] Cliquer le bouton 💾 "Enregistrer"
3. [ ] Vérifier:
   - [ ] Aucune erreur console (F12)
   - [ ] Aperçu revient à la normale (setOverridePalette(null))
   - [ ] Bouton "Enregistrer" change d'état brièvement (optionnel)
4. [ ] Fermer les Paramètres (X ou click outside)
5. [ ] Rouvrir les Paramètres

### ✅ Résultat Attendu
- Les couleurs personnalisées persistent
- Mêmes valeurs hex dans les inputs
- Pas de reset au défaut
- localStorage contient `theme_config`

---

## 🧪 Test 6: Réinitialisation des Couleurs

**Objectif**: Vérifier que le reset fonctionne

### Étapes
1. [ ] Avec des couleurs personnalisées
2. [ ] Cliquer le bouton ↻ "Réinitialiser"
3. [ ] Vérifier prompt: "Êtes-vous sûr..."
4. [ ] Confirmer
5. [ ] Vérifier:
   - [ ] Les inputs couleur reviennent au défaut
   - [ ] L'aperçu change aux couleurs par défaut
   - [ ] `theme_config` en BD devient `NULL`
6. [ ] Reload page

### ✅ Résultat Attendu
- Les couleurs reviennent aux defaults du système
- Pas de trace des anciennes couleurs
- Couple peut relancer la customization
- Page reload affiche les defaults

---

## 🧪 Test 7: Persistance Après Reload

**Objectif**: Vérifier que les colors persisten après page reload

### Étapes
1. [ ] Personnaliser les couleurs:
   - [ ] Primaire: Bleu (#0066FF)
   - [ ] Accent: Rose (#FF33CC)
2. [ ] Cliquer "Enregistrer"
3. [ ] Attendre confirmation
4. [ ] **Faire un reload complet**: `Ctrl+R` ou `F5`
5. [ ] Vérifier après reload:
   - [ ] Interface affiche les colores bleues/roses
   - [ ] Ouvrir Paramètres → Les inputs montrent les mêmes hex
   - [ ] Dark/Light toggle fonctionne avec les couleurs sauvegardées

### ✅ Résultat Attendu
- **Persistence complète**
- Les couleurs sont chargées depuis la BD
- Aucune perte de données
- Couleurs visibles immédiatement après reload

---

## 🧪 Test 8: Cohérence Entre Thèmes

**Objectif**: Vérifier que les couleurs conservent lisibilité dans les deux thèmes

### Étapes
1. [ ] Personnaliser avec des couleurs métalliques:
   - [ ] Primaire: Or (#FFD700)
   - [ ] Accent: Bronze (#CD7F32)
2. [ ] Enregistrer
3. [ ] En dark mode:
   - [ ] [ ] Or visible et lumineux
   - [ ] [ ] Bronze lisible
4. [ ] Toggle light mode:
   - [ ] [ ] Or toujours lisible (mais moins brillant)
   - [ ] [ ] Bronze composé contre blanc
5. [ ] Répéter avec d'autres couleurs exotiques

### ✅ Résultat Attendu
- TOUTES les couleurs restent lisibles dans les deux thèmes
- Hue et saturation conservés (couleur reste reconnaissable)
- Pas d'inversion brutale
- Adaptations intelligentes par type

---

## 🧪 Test 9: Mode Multipartenaires (Optional)

**Objectif**: Vérifier que chaque couple a ses propres couleurs

### Étapes (Si 2 comptes partenaires disponibles)
1. [ ] Couple A: Personnaliser couleurs → Bleu
2. [ ] Couple A: Enregistrer
3. [ ] Switch vers Couple B
4. [ ] Couple B: Voir les couleurs par défaut (pas bleues)
5. [ ] Couple B: Personnaliser différentes couleurs → Rose
6. [ ] Couple B: Enregistrer
7. [ ] Switch retour à Couple A
8. [ ] Vérifier: Couleurs bleues sont de retour

### ✅ Résultat Attendu
- Chaque couple a sa propre `theme_config`
- Pas de mélange de couleurs entre couples
- Chaque couple retrouve ses couleurs

---

## 🧪 Test 10: Tests Edge Cases

### Cas 1: Couleur très claire personnalisée
- [ ] Primaire: Presque blanc (#EEEEEE)
- Vérifier: Lisible en dark (texte blanc?)? Lisible en light (texte noir sur blanc)?

### Cas 2: Couleur très sombre personnalisée
- [ ] Primaire: Presque noir (#111111)
- Vérifier: Lisible en dark? Lisible en light?

### Cas 3: Couleur très saturée
- [ ] Primaire: Magenta ultra-saturé (#FF00FF)
- Vérifier: Pas de brûlure visuelle?

### Cas 4: Couleur désaturée
- [ ] Primaire: Gris (#888888)
- Vérifier: Pas d'invisibilité?

### ✅ Résultat Attendu
- Toutes les couleurs d'entrée produisent des résultats lisibles
- Le système est robust aux entrées extrêmes

---

## 📊 Résumé Final

| Test | Statut | Notes |
|------|--------|-------|
| 1. Default Dark | ☐ OK / ☐ KO | |
| 2. Dark → Light | ☐ OK / ☐ KO | |
| 3. Light → Dark | ☐ OK / ☐ KO | |
| 4. Live Preview | ☐ OK / ☐ KO | |
| 5. Save Colors | ☐ OK / ☐ KO | |
| 6. Reset | ☐ OK / ☐ KO | |
| 7. Persistence | ☐ OK / ☐ KO | |
| 8. Coherence | ☐ OK / ☐ KO | |
| 9. Multicouple | ☐ OK / ☐ KO | |
| 10. Edge Cases | ☐ OK / ☐ KO | |

---

## 🐛 Troubleshooting

### Problème: Les couleurs ne changent pas au toggle
**Solution**: 
1. Ouvrir Console (F12)
2. Exécuter: `console.log(localStorage.getItem('theme'))`
3. Vérifier: Should toggle entre 'dark' et 'light'
4. SI pas de changement → `toggleTheme()` ne fonctionne pas

### Problème: Live preview ne fonctionne pas
**Solution**:
1. Vérifier que l'input utilise `handleColorChange()`
2. Vérifier que `setOverridePalette` est définie
3. Vérifier qu'aucune erreur console

### Problème: Les couleurs ne se sauvegardent pas
**Solution**:
1. Vérifier que `updateCouple()` retourne une promesse
2. Vérifier que la BD accepte le JSON `theme_config`
3. Vérifier que `theme_config` n'est pas NULL par défaut

### Problème: Reset ne fonctionne pas
**Solution**:
1. Vérifier que le prompt s'affiche
2. Vérifier que `updateCouple({ theme_config: null })` s'exécute
3. Check network tab pour confirmer la requête

---

**Guide de Validation Complet - v1.0** ✨
Documentation mise à jour: 24 février 2026
