# 🔐 FONCTIONNALITÉ — Mot de passe oublié

## ✅ Implémentation complète

### Pages créées (4 fichiers)

**Français :**
- ✅ **forgot-password.html** — Formulaire "Mot de passe oublié" (email)
- ✅ **reset-password.html** — Formulaire "Nouveau mot de passe"

**Anglais :**
- ✅ **forgot-password-en.html** — Forgot Password form (email)
- ✅ **reset-password-en.html** — New password form

---

## 🔄 Flow utilisateur

### Scénario : "J'ai oublié mon mot de passe"

```
1. Utilisateur sur acces-collaborateurs.html
   ↓
2. Clique "Mot de passe oublié ?"
   ↓
3. Arrive sur forgot-password.html
   ↓
4. Entre son email → clique "Envoyer le lien"
   ↓
5. Supabase envoie email avec lien de réinitialisation
   ↓
6. Utilisateur clique le lien dans l'email
   ↓
7. Redirigé vers reset-password.html
   ↓
8. Entre nouveau mot de passe + confirmation
   ↓
9. Clique "Mettre à jour le mot de passe"
   ↓
10. Mot de passe mis à jour ✅
    Redirigé vers acces-collaborateurs.html
```

---

## 🔗 Liens implémentés

### Dans acces-collaborateurs.html (FR)
```html
<a href="forgot-password.html">Mot de passe oublié ?</a>
```

### Dans collaborator-access.html (EN)
```html
<a href="forgot-password-en.html">Forgot password?</a>
```

---

## 📨 Configuration Supabase nécessaire

Pour que le flux fonctionne, vérifiez dans **Supabase Dashboard → Authentication** :

1. **Email Templates** → **Password Reset**
   - Doit contenir un lien vers : `{{ .SiteURL }}/reset-password.html?token={{ .Token }}&type=recovery`
   - Ou avec paramètre `lang=en` pour anglais

2. **SMTP Configuration** (si emails custom)
   - Vérifier que les emails de réinitialisation sont envoyés

---

## 🔐 Sécurité implémentée

✅ Validation email (required, type=email)  
✅ Validation mot de passe (min 8 caractères)  
✅ Confirmation mot de passe (doit correspondre)  
✅ Messages d'erreur clairs  
✅ Bouton désactivé pendant traitement  
✅ Tokens Supabase (sécurisés par défaut)  

---

## 🧪 Tests localement

```bash
1. http://localhost/acces-collaborateurs.html
2. Cliquer "Mot de passe oublié ?"
3. Voir le formulaire forgot-password.html
4. Entrer un email existant dans Supabase
5. Cliquer "Envoyer le lien"
6. Vérifier que message de succès s'affiche
7. (En vrai) Regarder l'email reçu de Supabase
8. (Simulation) Aller manuellement à reset-password.html
9. Entrer nouveau mot de passe
10. Cliquer "Mettre à jour"
11. Redirection vers login
```

---

## 📦 Fichiers à déployer sur OVH

```
✅ auth.js (MISE À JOUR — contient nouvelles fonctions)
✅ forgot-password.html (NOUVEAU)
✅ forgot-password-en.html (NOUVEAU)
✅ reset-password.html (NOUVEAU)
✅ reset-password-en.html (NOUVEAU)
✅ acces-collaborateurs.html (MISE À JOUR — ajout lien)
✅ collaborator-access.html (MISE À JOUR — ajout lien)
```

---

## 🚀 Déploiement

1. Télécharger auth.js (mis à jour)
2. Télécharger 4 pages forgot/reset
3. Télécharger 2 pages accès (mises à jour)
4. Vider cache navigateur
5. Tester le flow complet

---

## 📝 Fonctionnalités dans auth.js

```javascript
// Nouvelles fonctions ajoutées :
- sendPasswordResetEmail(email)
- handleForgotPasswordSubmit(event, lang)
- updatePassword(newPassword)
- handleResetPasswordSubmit(event, lang)
```

---

## 🟢 Status : FORMULAIRE "MOT DE PASSE OUBLIÉ" COMPLET

Prêt pour déploiement sur OVH ! 🚀

