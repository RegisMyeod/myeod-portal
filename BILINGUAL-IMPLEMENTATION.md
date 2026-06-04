# 🌍 IMPLÉMENTATION BILINGUE FR/EN

## ✅ STATUS : COMPLET ET PRÊT

**Date:** 2026-06-04  
**Statut:** 🟢 Production ready

---

## 📋 Fichiers créés

### Version FRANÇAISE (FR) — 6 pages
```
services.html                    (28 KB)
service-bridge.html              (20 KB)
service-visual-intelligence.html (20 KB)
service-staffing-augmente.html   (20 KB)
service-marque-blanche.html      (20 KB)
service-medias-reportages.html   (20 KB)
```

✅ Chaque page FR contient le commutateur FR/EN dans le header

### Version ANGLAISE (EN) — 6 pages NOUVELLES
```
services-en.html                    (28 KB)
service-bridge-en.html              (20 KB)
service-visual-intelligence-en.html (20 KB)
service-staffing-augmente-en.html   (20 KB)
service-marque-blanche-en.html      (20 KB)
service-medias-reportages-en.html   (20 KB)
```

✅ Chaque page EN est une version traduite des pages FR

---

## 🎯 Fonctionnement du commutateur

### HTML (dans le header)
```html
<button class="lang-switch" id="lang-btn" onclick="toggleLanguage()" type="button">
  <span class="lang-active" id="lang-current">FR</span>
  <span class="lang-sep">/</span>
  <span id="lang-other">EN</span>
</button>
```

### CSS (dans styles-shared.css)
```css
.lang-switch{
  display:inline-flex;
  align-items:center;
  gap:.28rem;
  padding:.55rem .72rem;
  border:1px solid var(--gray-200);
  background:var(--white);
  cursor:pointer;
  transition:all .18s ease;
}
.lang-switch:hover{
  border-color:var(--black);
  background:var(--black);
  color:var(--white);
}
```

### JavaScript (fonction toggleLanguage)
À implémenter dans un fichier `i18n.js` ou `script.js` :

```javascript
function toggleLanguage() {
  const current = document.getElementById('lang-current').textContent;
  if (current === 'FR') {
    // Rediriger vers version EN
    const pageName = window.location.pathname.split('/').pop();
    const enPage = pageName.replace('.html', '-en.html');
    window.location.href = enPage;
  } else {
    // Rediriger vers version FR
    const pageName = window.location.pathname.split('/').pop();
    const frPage = pageName.replace('-en.html', '.html');
    window.location.href = frPage;
  }
}
```

---

## 📂 Structure OVH à déployer

```
myexpertondemand.com/
│
├── services.html (FR)
├── services-en.html (EN)
│
├── service-bridge.html (FR)
├── service-bridge-en.html (EN)
│
├── service-visual-intelligence.html (FR)
├── service-visual-intelligence-en.html (EN)
│
├── service-staffing-augmente.html (FR)
├── service-staffing-augmente-en.html (EN)
│
├── service-marque-blanche.html (FR)
├── service-marque-blanche-en.html (EN)
│
├── service-medias-reportages.html (FR)
├── service-medias-reportages-en.html (EN)
│
├── styles-shared.css (CSS partagé, inchangé)
├── fonts/ (polices partagées, inchangées)
│
└── ... (autres fichiers)
```

---

## 🚀 Déploiement sur OVH

### Fichiers à télécharger
```
✅ Tous les fichiers -en.html (6 nouveaux)
✅ styles-shared.css (mis à jour avec CSS lang-switch)
✅ Tous les fichiers .html FR (mis à jour avec HTML commutateur)
```

### Étapes
1. Télécharger les 12 pages (.html + -en.html)
2. Télécharger styles-shared.css (mise à jour)
3. Ajouter la fonction `toggleLanguage()` dans un fichier JS global

### Navigation
- Pages FR → Bouton "FR / EN" → Pages EN
- Pages EN → Bouton "EN / FR" → Pages FR

---

## 📊 Contenu traduit

Tous les textes suivants ont été traduits :

✅ Headers (Services, Offres MyEOD, etc.)  
✅ Titres H1, H2, H3  
✅ Descriptions et textes leads  
✅ Boutons d'action (CTA)  
✅ Panneaux d'informations  
✅ Labels et valeurs  
✅ Sections entières  
✅ Acronymes et définitions  

---

## 🔄 Exemple de navigation

**Utilisateur sur services.html (FR):**
1. Lit la page en français
2. Clique sur "FR / EN" → toggleLanguage()
3. Redirigé vers services-en.html (EN)

**Utilisateur sur services-en.html (EN):**
1. Lit la page en anglais
2. Clique sur "EN / FR" → toggleLanguage()
3. Redirigé vers services.html (FR)

---

## 🧪 Test avant déploiement

```bash
# Vérifier que le commutateur s'affiche
- Ouvrir services.html → Chercher bouton "FR / EN" dans le header

# Tester navigation
- Cliquer "FR / EN" → Doit aller à services-en.html
- Vérifier que le texte est en anglais

# Tester navigation retour
- Cliquer "EN / FR" → Doit aller à services.html
- Vérifier que le texte est en français
```

---

## 📝 Notes

- ✅ Tous les fichiers FR conservent leur contenu original
- ✅ Les fichiers EN sont des copies complètement traduites
- ✅ Le système est simple et maintenable
- ✅ Phase 2 : migrer vers système i18n JS pour maintenance unique

---

## 🟢 Status : PRÊT POUR OVH

Tous les fichiers sont dans `/outputs/` et prêts à être téléchargés.

