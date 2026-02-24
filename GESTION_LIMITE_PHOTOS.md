# 📸 Limite de Photos - Gestion de la Permission

## 🎯 Système de Limite

### Configuration Défaut
- **Limite par défaut** : 25 photos par couple
- **Permission spéciale** : Illimité si `unlimited_photos = TRUE`

### État du Système

```
┌─────────────────────────────────────┐
│ Couple 1                            │
├─────────────────────────────────────┤
│ unlimited_photos = FALSE (défaut)   │
│ Limite = 25 photos                  │
│ Photos actuelles = 15/25 ✅         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Couple VIP                          │
├─────────────────────────────────────┤
│ unlimited_photos = TRUE             │
│ Limite = ∞ (illimité)               │
│ Photos actuelles = 350+ ✅          │
└─────────────────────────────────────┘
```

---

## 🗄️ Base de Données

### 1. Migration SQL

Exécutez le fichier : [add_photo_limit.sql](add_photo_limit.sql)

Ce qui sera créé:
```sql
ALTER TABLE couples ADD COLUMN unlimited_photos BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_couples_unlimited ON couples(unlimited_photos);
```

### 2. Colonne Ajoutée

| Colonne | Type | Défaut | Description |
|---------|------|--------|-------------|
| `unlimited_photos` | BOOLEAN | FALSE | Active l'upload illimité pour ce couple |

---

## 👨‍💼 Gestion des Permissions

### Pour Accorder l'Accès Illimité

#### Via Supabase Dashboard

1. Ouvrir **Supabase Console**
2. Aller à **Table "couples"**
3. Trouver le couple concerné
4. Modifier `unlimited_photos` → **TRUE**
5. Sauvegarder ✅

#### Via SQL (Recommandé)

```sql
-- Donner accès illimité à un couple spécifique
UPDATE couples 
SET unlimited_photos = TRUE 
WHERE id = 'UUID_DU_COUPLE';

-- Vérifier la modification
SELECT id, name, unlimited_photos FROM couples WHERE id = 'UUID_DU_COUPLE';
```

#### Via SQL (Multiples couples)

```sql
-- Donner accès à plusieurs couples
UPDATE couples 
SET unlimited_photos = TRUE 
WHERE id IN ('uuid1', 'uuid2', 'uuid3');
```

### Pour Retirer l'Accès Illimité

```sql
-- Revenir à la limite de 25 photos
UPDATE couples 
SET unlimited_photos = FALSE 
WHERE id = 'UUID_DU_COUPLE';
```

### Lister les Couples avec Accès Illimité

```sql
-- Voir tous les couples VIP
SELECT id, name, unlimited_photos FROM couples 
WHERE unlimited_photos = TRUE;
```

---

## 📱 Interface Utilisateur

### Couple avec Limite (défaut)

```
[+ Ajouter une photo (12/25)]
```
- Compteur visible
- Bouton actif tant que < 25 photos
- Bouton grisé si limite atteinte

### Couple avec Accès Illimité

```
[+ Ajouter une photo]
```
- Aucun compteur
- Bouton toujours actif
- Peut uploader sans limite

### Message d'Erreur (Limite Atteinte)

```
┌─────────────────────────────┐
│ Limite de photos atteinte   │
│                             │
│ Vous avez atteint la limite │
│ de 25 photos pour ce couple │
│                             │
│ 📸 Supprimez des photos ou  │
│ contactez un administrateur │
│ pour obtenir l'accès        │
│ illimité.                   │
│                             │
│ [Fermer]                    │
└─────────────────────────────┘
```

---

## 🔧 Code Frontend

### États du Composant

```javascript
const [coupleConfig, setCoupleConfig] = useState(null);
const [showLimitAlert, setShowLimitAlert] = useState(false);
const PHOTO_LIMIT = 25;
```

### Récupération de la Config

```javascript
const fetchCoupleConfig = async () => {
    const { data } = await supabase
        .from('couples')
        .select('unlimited_photos')
        .eq('id', coupleData.couple.id)
        .single();
    
    setCoupleConfig(data);
};
```

### Vérification de la Limite

```javascript
// Dans handleAddPhoto
if (!coupleConfig?.unlimited_photos && photos.length >= PHOTO_LIMIT) {
    setShowLimitAlert(true);
    return; // Ne pas uploader
}
```

### Affichage du Compteur

```javascript
// Si limite, afficher le compteur
{!coupleConfig?.unlimited_photos && (
    <span>(photos.length}/{PHOTO_LIMIT})</span>
)}
```

---

## 📊 Scénarios

### Scénario 1 : Couple Standard

```
1. Couple crée un profil
2. unlimited_photos = FALSE (défaut)
3. Utilisateur voit: "Ajouter une photo (0/25)"
4. Après 25 uploads, bouton désactivé
5. Message: "Limite atteinte"
```

### Scénario 2 : Couple Premium

```
1. Admin: UPDATE couples SET unlimited_photos = TRUE WHERE id = '...'
2. Utilisateur voit: "Ajouter une photo" (sans compteur)
3. Peut uploader 50, 100, 500+ photos
4. Pas de limite
```

### Scénario 3 : Upgrade Couple

```
1. Couple atteint 25 photos
2. Contacte admin: "Je veux plus"
3. Admin: UPDATE ... SET unlimited_photos = TRUE
4. Reload page
5. Utilisateur peut uploader illimité
6. Compteur disparaît
```

---

## 🔍 Monitoring

### Voir l'État de Tous les Couples

```sql
SELECT 
    name,
    unlimited_photos,
    (SELECT COUNT(*) FROM photos WHERE couple_id = couples.id) as photo_count
FROM couples
ORDER BY photo_count DESC;
```

### Voir les Couples Proches de la Limite

```sql
SELECT 
    couples.id,
    couples.name,
    COUNT(photos.id) as photos,
    unlimited_photos
FROM couples
LEFT JOIN photos ON photos.couple_id = couples.id
WHERE unlimited_photos = FALSE
GROUP BY couples.id, couples.name, unlimited_photos
HAVING COUNT(photos.id) >= 20
ORDER BY COUNT(photos.id) DESC;
```

### Statistiques Globales

```sql
SELECT
    CASE 
        WHEN unlimited_photos THEN 'Illimité'
        ELSE 'Limité (25)'
    END as plan,
    COUNT(*) as nombre_couples,
    ROUND(AVG((SELECT COUNT(*) FROM photos WHERE couple_id = couples.id))::numeric, 2) as moyenne_photos
FROM couples
GROUP BY unlimited_photos;
```

---

## ⚙️ Configuration à Modifier

### Changer la Limite de 25 à autre

Dans [GalleryModule.jsx](src/components/modules/GalleryModule.jsx) :

```javascript
const PHOTO_LIMIT = 25; // ← Modifier ici (ex: 50, 100, etc)
```

---

## 🚀 Déploiement

### Checklist

- [ ] Migration SQL exécutée (`add_photo_limit.sql`)
- [ ] Colonne `unlimited_photos` existe en BD
- [ ] App redémarrée après déploiement
- [ ] Tester avec un couple limité (< 25 photos)
- [ ] Tester avec limite atteinte (error message apparaît)
- [ ] Accorder accès illimité à 1 couple test
- [ ] Vérifier que le compteur disparaît et limite supprimée

---

## 📋 Résumé

| Aspect | Détail |
|--------|--------|
| **Défaut** | 25 photos / couple |
| **Permission Spéciale** | `unlimited_photos = TRUE` en BD |
| **Gestion** | SQL ou Supabase Dashboard |
| **Indicateur UI** | Compteur (5/25) si limité |
| **Alerte** | Modal si limite atteinte |
| **Désactivation** | Bouton grisé à 25 photos |

---

**Prêt à gérer vos couples VIP ! 👑**
