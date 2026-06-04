# 🎯 ACTION ITEMS — MyEOD Portal Services

## ✅ FAIT — Ce qui a été livré

### Fichiers HTML (6 pages)
- ✅ `services.html` — Page vitrine avec 5 services cliquables
- ✅ `service-bridge.html` — BRiDGE
- ✅ `service-visual-intelligence.html` — Visual Intelligence
- ✅ `service-staffing-augmente.html` — Staffing Augmenté
- ✅ `service-marque-blanche.html` — Marque Blanche
- ✅ `service-medias-reportages.html` — Médias & Reportages

### CSS (1 fichier)
- ✅ `styles-shared.css` — CSS centralisé avec chemins `fonts/MazzardM-*.woff2`

### Polices (dossier fonts/)
- ✅ 16 fichiers Mazzard M (448 KB)
- ✅ Tous les poids et styles (Thin, Light, Regular, Medium, Bold, Black, etc.)

### Branding
- ✅ Logo MyEOD complet intégré dans tous les headers
- ✅ Typographie MazzardM configurée
- ✅ Couleurs IC (noir, gris, or) appliquées

### Documentation
- ✅ 7 fichiers MD/TXT expliquant l'intégration

---

## 🚀 À FAIRE — Déploiement OVH (immédiat)

### ÉTAPE 1 : Préparation locale (5 min)
```bash
# Sur votre ordi, créer dossier de déploiement
mkdir myeod-deploy
cd myeod-deploy

# Télécharger depuis /outputs/ :
# - 6 fichiers .html
# - styles-shared.css
# - Dossier fonts/ (entièrement)
```

### ÉTAPE 2 : Déploiement OVH via FTP (10 min)
```
Connexion FTP → myexpertondemand.com/

Télécharger :
  ✓ services.html
  ✓ service-bridge.html
  ✓ service-visual-intelligence.html
  ✓ service-staffing-augmente.html
  ✓ service-marque-blanche.html
  ✓ service-medias-reportages.html
  ✓ styles-shared.css
  ✓ Dossier fonts/ (créer s'il n'existe pas)
    → Télécharger 16 fichiers .woff2 dedans
```

### ÉTAPE 3 : Vérification post-déploiement (10 min)
```bash
# Test 1 : Accéder aux pages
https://myexpertondemand.com/services.html
→ Doit afficher : Services MyEOD, 5 offres cliquables, logo en haut

# Test 2 : DevTools (F12)
→ Console : Chercher erreurs 404
→ Network : Vérifier fonts chargées (fonts/MazzardM-*.woff2)
→ Elements : Inspecter texte → Doit afficher MazzardM (pas Arial)

# Test 3 : Navigation
→ Cliquer sur une offre (ex. BRiDGE)
→ Vérifier affichage page détail
→ Cliquer bouton ← (retour)
→ Doit revenir à services.html

# Test 4 : Logo
→ Cliquer logo MyEOD
→ Doit retourner à index.html
```

---

## 📋 CHECKLIST Déploiement

```
AVANT de télécharger sur OVH :
☐ Fichiers téléchargés depuis /outputs/
☐ Dossier fonts/ créé localement avec tous les .woff2
☐ Aucune modification des fichiers (juste copier-coller)

PENDANT le déploiement OVH :
☐ Créer/vérifier dossier fonts/ à la racine
☐ Télécharger 6 .html à la racine
☐ Télécharger styles-shared.css à la racine
☐ Télécharger 16 fichiers .woff2 dans fonts/
☐ Vérifier permissions lecture sur tous les fichiers

APRÈS le déploiement :
☐ Tester services.html dans le navigateur
☐ Vérifier pas d'erreur 404 (F12 → Console)
☐ Vérifier polices MazzardM chargées
☐ Tester navigation entre pages
☐ Vérifier logo cliquable (retour index.html)
☐ Tester responsive (mobile/tablet)
```

---

## ⏭️ PHASES FUTURES

### Phase 2 — Branding Alizé (Prochaine)
- Intégrer charte graphique complète (couleurs, déclinaisons logo)
- Modifier styles-shared.css avec branding Alizé
- Ajouter images/illustrations si besoin

### Phase 3 — Bilingue FR/EN
- Activer système i18n (data-i18n)
- Traduire contenu anglais
- Ajouter toggle langue

### Phase 4 — Pages Client/Collaborateurs
- Créer acces-client.html (authentification Supabase)
- Créer acces-collaborateurs.html (dashboard IT)
- Intégrer rôles utilisateurs

### Phase 5 — Legal
- Créer legal.html (mentions légales, politique données, cookies, etc.)
- Lier depuis footer

---

## 🎯 KPI Suivi

### À tester après déploiement :

```
✓ Temps chargement page : < 2s
✓ Polices MazzardM : 100% chargées
✓ Logo visible : Tous les headers
✓ Navigation : 5 liens services fonctionnels
✓ Responsive : OK mobile 375px, tablet 768px, desktop 1200px
✓ Erreurs 404 : 0 (fonts, images, CSS)
✓ Accessibility : Labels aria-label présents
```

---

## 📞 Points de Contact

### Si problème :

**Erreur 404 sur fonts :**
- Vérifier que dossier `fonts/` existe à la racine
- Vérifier que 16 fichiers .woff2 y sont dedans
- Vérifier permissions lecture (644 ou similaire)

**Polices ne s'affichent pas :**
- Vider cache navigateur (Ctrl+Shift+Del)
- F12 → Network → Vérifier status des fonts (200, pas 404)
- Vérifier CSS chargé correctement

**Navigation cassée :**
- Vérifier que tous les 6 .html sont à la racine
- Vérifier que styles-shared.css est chargé (F12 → Network)
- Vérifier chemins relatifs (onclick, href)

---

## 📊 Taille fichiers de référence

```
services.html                    25 KB
service-bridge.html              20 KB
service-visual-intelligence.html 19 KB
service-staffing-augmente.html   18 KB
service-marque-blanche.html      18 KB
service-medias-reportages.html   19 KB
styles-shared.css                15 KB
MazzardM-*.woff2 (16 fichiers)  448 KB
─────────────────────────────
TOTAL                           ~600 KB
```

**Temps chargement estimé :**
- CSS + HTML : < 500 ms
- Fonts WOFF2 : < 1500 ms (async)
- **Total** : < 2 secondes

---

## 🎉 À la fin

Une fois déployé, vous aurez :

✅ **6 pages services** complètement harmonisées
✅ **Navigation fluide** (services → détails → retour)
✅ **Branding MyEOD** unifié (logo, typographie)
✅ **Polices Mazzard M** toutes variantes chargées
✅ **Responsive design** (mobile, tablet, desktop)
✅ **Production ready** (~600 KB, < 2s chargement)

---

## 📝 Notes finales

- **Pas de modification requise** — Tous les fichiers sont prêts à l'emploi
- **Structure modulaire** — CSS centralisé pour évolution facile Phase 2
- **Évolutif** — Prêt pour bilingue, client portail, etc.
- **Performant** — WOFF2 compressé, CSS minifié

**Status** : 🟢 **PRÊT POUR GO**

Besoin d'aide pour le déploiement OVH ? J'y suis 🚀

---

*Document créé : 2026-06-04*
*Pour : Régis Mortier — MyEOD*
*Fichiers : /mnt/user-data/outputs/*
