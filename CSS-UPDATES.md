# 🎨 Mise à jour CSS — Décalage du panel

## Problème signalé
Le bloc tableau (hero-panel) se superposait au titre "Des services opérationnels..." sur la page services.html

## Solution appliquée

### Changement dans `styles-shared.css` (ligne 269)

**AVANT :**
```css
.hero{
  min-height:calc(100vh - 76px);
  display:grid;
  grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);
  align-items:center;
  gap:4rem;           ← Espace insuffisant
  padding:5rem 0;
}
```

**APRÈS :**
```css
.hero{
  min-height:calc(100vh - 76px);
  display:grid;
  grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr);
  align-items:center;
  gap:5rem;           ← Augmenté de 4rem à 5rem (+25%)
  padding:5rem 0;
  margin-right:2rem;  ← Décalage supplémentaire
}
```

## Changements détaillés

| Propriété | Avant | Après | Effet |
|-----------|-------|-------|-------|
| `gap` | 4rem | 5rem | +1rem d'espace horizontal |
| `grid-template-columns` (col1) | 1.05fr | 1.1fr | Légèrement plus d'espace au titre |
| `grid-template-columns` (col2) | minmax(320px,.95fr) | minmax(340px,.9fr) | Panel plus large |
| `margin-right` | — | 2rem | Décalage vers la droite |

## Résultat
✅ Le panel est décalé vers la droite  
✅ Pas de superposition avec le titre  
✅ Mieux équilibré visuellement  

## Fichiers affectés
- `styles-shared.css` — CSS partagé (utilisé par toutes les pages)

**Note :** Seule la page `services.html` a un hero avec ce layout. Les pages services détails n'utilisent pas cette structure.

## Responsive
Le responsive reste intact :
- **< 1100px :** Le hero passe en colonne simple (pas de superposition possible)
- **< 900px :** Adaptation complète mobile
- **< 640px :** Adaptations mobiles optimisées

---

**Status** : ✅ Changement appliqué et testé
