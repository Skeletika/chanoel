# 🎨 Système de Thème Dark/Light - Refactorisé

## 🎯 Amélioration Apportée

Le système d'inversion de couleurs a été **complètement refactorisé** pour mieux préserver les couleurs du couple lors du changement entre thèmes dark et light.

### ❌ Avant (Problème)
- Inversion brutale de luminosité (HSL L: 0-100%)
- Les couleurs du couple devaient s'adapter mal
- Difficile de garder une cohérence visuelle
- Bouton soleil/lune inversait mal les couleurs

### ✅ Après (Solution)
- **Adaptation intelligente** selon le type de couleur
- Couleurs de marque conservent leurs hues et saturations
- Interface (bg/surface/text) adaptée pour lisibilité
- Cohérence visuelle garantie dans les deux thèmes

---

## 🔧 Architecture Nouvelle

### Fichier: `src/lib/colors.js`

#### **Fonction 1: `adaptColorForDark(hex, type)`**
```javascript
// Adapter une couleur pour le dark mode
adaptColorForDark(hex, type) → adaptation spécifique au dark mode
```

| Type | Luminosité | Résultat |
|------|-----------|----------|
| `brand` | 65% | Couleur primaire visible |
| `text` | 95% | Texte très clair |
| `bg` | 10% | Arrière-plan très sombre |
| `surface` | 16% | Surfaces plus claires que bg |
| `border` | 25% | Bordures grises |

#### **Fonction 2: `adaptColorForLight(hex, type)`**
```javascript
// Adapter une couleur pour le light mode
adaptColorForLight(hex, type) → adaptation spécifique au light mode
```

| Type | Luminosité | Résultat |
|------|-----------|----------|
| `brand` | 45% | Couleur primaire contrastée |
| `text` | 20% | Texte très sombre |
| `bg` | 97% | Arrière-plan très clair |
| `surface` | 93% | Surfaces plus sombres que bg |
| `border` | 85% | Bordures grises clair |

#### **Fonction 3: `adaptPaletteToTheme(basePalette, theme)`**
```javascript
// Adapter toute la palette au thème
adaptPaletteToTheme(basePalette, 'dark' | 'light') → palette complète
```

---

## 📦 Flux de Données

```
Couple Crée une Couleur Personnalisée
         ↓
    #FF6B6B (rouge rose)
         ↓
    ✓ Enregistrée en BD (theme_config)
         ↓
    CoupleContext charge theme_config
         ↓
    ThemeContext reçoit via setReferencePalette()
         ↓
    ┌─────────────────────────────────┐
    │ User toggleTheme               │
    │ (Sun/Moon Button)              │
    └─────────────────────────────────┘
         ↓
    theme = 'dark' | 'light'
         ↓
    adaptPaletteToTheme(basePalette, theme)
         ↓
    Couleurs appliquées en CSS variables
         ↓
    UI Mise à jour avec bonne lisibilité
```

---

## 🎨 Exemples Concrets

### Exemple 1: Couleur Primaire Rouge (#FF6B6B)

#### Dark Mode
```
Input:  #FF6B6B
       ├─ Hue: 0° (rouge)
       ├─ Saturation: 100%
       └─ Lightness: 60%

Output: #FF4444 (hue=0, sat=100, light=65%)
        → Rouge lumineux, visible en dark mode
```

#### Light Mode
```
Input:  #FF6B6B
       ├─ Hue: 0° (rouge)
       ├─ Saturation: 100%
       └─ Lightness: 60%

Output: #BB2222 (hue=0, sat=100, light=45%)
        → Rouge sombre, contrastant en light mode
```

### Exemple 2: Arrière-plan

#### Dark Mode (Couple stocke: #1a1a1a)
```
Adapté à: #1a1a1a (light=10%)
→ Très sombre, parfait pour dark mode
```

#### Light Mode (Même couleur stockée)
```
Adapté à: #f5f5f5 (light=97%)
→ Très clair, parfait pour light mode
```

---

## 🎮 Interface Utilisateur

### 1. Paramètres → Personnalisation des Couleurs

```
┌─────────────────────────────────────┐
│ Personnalisation des Couleurs       │
├─────────────────────────────────────┤
│ Couleur Principale:                 │
│ [▓ picker] [#FF6B6B text input]    │
│                                     │
│ Couleur d'Accent:                   │
│ [▓ picker] [#FF6B6B text input]    │
│                                     │
│ Couleur de Surface:                 │
│ [▓ picker] [#1E293B text input]    │
│ ...                                 │
│                                     │
│ [💾 Enregistrer] [↻ Réinitialiser]│
└─────────────────────────────────────┘
```

### 2. Aperçu en Temps Réel

- En modifiant une couleur, l'aperçu change **immédiatement**
- Les changements s'appliquent via `setOverridePalette()`
- En cliquant "Enregistrer", les couleurs sont sauvegardées en BD

### 3. Bouton Soleil/Lune (Dark/Light Toggle)

```
À côté des paramètres:
☀️ (en dark mode) → bascule vers light mode
🌙 (en light mode) → bascule vers dark mode
```

Quand vous cliquez le bouton:
1. `theme` change (dark ↔ light)
2. `adaptPaletteToTheme()` est appelée
3. Toutes les couleurs CSS vars sont mises à jour
4. L'UI se transforme en gardant cohérence

---

## 💾 Sauvegarde et Chargement

### Sauvegarde des Couleurs

```javascript
// Dans SettingsModal.jsx, bouton "Enregistrer":
await updateCouple({ theme_config: customColors });
```

Cela sauvegarde:
```json
{
  "primary": "#FF6B6B",
  "accent": "#FF6B6B",
  "surface": "#1E293B",
  "bg": "#0F172A",
  "text": "#FFFFFF",
  "textMuted": "#94A3B8",
  "border": "#334155"
}
```

### Chargement des Couleurs

À chaque reload (ou login):
1. CoupleContext charge `coupleData.theme_config` de la BD
2. Appelle `setReferencePalette(theme_config)`
3. ThemeContext utilise cette référence
4. Selon le thème actuel (localStorage), adapte les couleurs

---

## 📱 Comportement Attendu

### Scénario 1: Nouveau Couple (Sans Config)

1. **DB**: `theme_config = NULL`
2. **Chargement**: Utilise `DEFAULT_DARK_PALETTE` (palette par défaut)
3. **Dark Mode**: Affiche la palette par défaut adaptée pour dark
4. **Light Mode**: Adapte les couleurs par défaut pour light
5. **Utilisateur configure**: Couleurs custom enregistrées

### Scénario 2: Couple avec Config Personnalisée

1. **DB**: `theme_config = {primary: "#FF6B6B", ...}`
2. **Chargement**: `setReferencePalette({primary: "#FF6B6B", ...})`
3. **Dark Mode**: Affiche les couleurs adaptées pour dark
4. **Light Mode**: Adapte les mêmes couleurs pour light
5. **Couleurs restent cohérentes dans les deux thèmes** ✅

### Scénario 3: Changement de Thème

1. Utilisateur clique ☀️ (en dark mode)
2. `toggleTheme()` → `setTheme('light')`
3. `localStorage.setItem('theme', 'light')`
4. `adaptPaletteToTheme()` re-appelée avec `theme='light'`
5. CSS vars mises à jour
6. UI se transforme avec nouvelles couleurs

---

## 🔍 Troubleshooting

### Problème: Les couleurs changent mal entre dark/light

**Cause**: Le `referencePalette` n'a pas été chargé correctement

**Solution**: Vérifier que `CoupleContext` appelle bien `setReferencePalette()`

```javascript
// Dans CoupleContext.jsx:
setReferencePalette(fetchedCouple.theme_config);
```

### Problème: Aperçu ne change pas quand je modifie une couleur

**Cause**: Vous utilisez `setCustomColors()` au lieu de `handleColorChange()`

**Solution**: Utiliser `handleColorChange()` qui appelle aussi `setOverridePalette()`

```javascript
// ✅ Correct
onChange={(e) => handleColorChange('primary', e.target.value)}

// ❌ Incorrect (pas d'aperçu live)
onChange={(e) => setCustomColors({...customColors, primary: e.target.value})}
```

### Problème: Les couleurs reviennent au défaut après page reload

**Cause**: Les couleurs n'ont peut-être pas été sauvegardées

**Solution**: Cliquer "Enregistrer" avant de recharger

---

## 🧪 Tester le Système

### Test 1: Dark Mode Default

1. Créer un nouveau couple
2. Vérifier: Interface sombre (bg sombre, texte clair)
3. Pas de config custom → Utilise defaults

### Test 2: Light Mode Default

1. Même couple, cliquer ☀️
2. Vérifier: Interface claire (bg clair, texte sombre)
3. Couleurs sont adaptées intelligemment

### Test 3: Couleur Personnalisée

1. Paramètres → Couleur Principale
2. Choisir un rouge (#FF6B6B)
3. Vérifier: Rouge visible en dark mode
4. Cliquer ☀️ → Vérifier: Rouge sombre visible en light mode
5. Cliquer 🌙 → Retour au rouge lumineux

### Test 4: Sauvegarde/Reset

1. Modifier plusieurs couleurs
2. Cliquer "Enregistrer"
3. Reload page → Couleurs doivent persister
4. Cliquer "Réinitialiser"
5. Reset aux defaults

---

## 📊 Résumé des Améliorations

| Aspect | Avant | Après |
|--------|-------|-------|
| **Inversion** | Brutale (100-L) | Intelligente par type |
| **Couleurs marque** | Mal invertées | Cohérentes |
| **Lisibilité** | Problèmes parfois | Garantie |
| **Aperçu live** | Incomplet | Complet et fluide |
| **Thème user** | Inversé mal | Adapté parfaitement |

---

## 🚀 Prochaines Étapes

1. **Tester** le changement dark/light avec vos couleurs personnalisées
2. **Vérifier** que la lisibilité est bonne dans les deux thèmes
3. **Reporter** tout problème ou couleur mal adaptée
4. **Profiter** d'un système de thème cohérent et beau ! 🎉

---

**Système de Thème Refactorisé - 24 février 2026** ✨
