# 🔐 RESTAURATION SUPABASE & ACCÈS COLLABORATEURS

## ✅ Fichiers créés

### 1️⃣ Configuration & Authentification
- ✅ **supabase-client.js** — Configuration du client Supabase
- ✅ **auth.js** — Gestion authentification (login, logout, vérification rôles)

### 2️⃣ Pages d'accès collaborateurs
- ✅ **acces-collaborateurs.html** (FR) — Page login collaborateurs français
- ✅ **collaborator-access.html** (EN) — Page login collaborateurs anglais

---

## 🔑 Credentials Supabase

```
URL: https://kewhxzitwdrnpsnzlihn.supabase.co
Anon Key: sb_publishable_owbl6MuPlOfMYAOPMxQ8Hg_deQuxLWi
```

---

## 📋 Restauration des accès pour l'équipe

**Utilisateurs à restaurer :**
- 🔴 **PPI** — Pascal Piquemal (Senior Surveyor & GIS)
- 🔴 **RMO** — Régis Mortier (Founder & BD Lead)
- 🔴 **JMA** — Jean-Marie Alliez (PMT & Survey Rep)
- 🔴 **CCA** — Christelle Cantrainne (DAF & Admin)

### Étapes dans Supabase Dashboard

#### 1. Vérifier la table `user_roles`

```sql
-- Exécuter dans Supabase SQL Editor
SELECT id, email, raw_user_meta_data FROM auth.users;

-- Vérifier les rôles
SELECT user_id, role FROM public.user_roles;
```

#### 2. Créer ou restaurer les utilisateurs

```sql
-- Si la table n'existe pas :
CREATE TABLE public.user_roles (
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ajouter les rôles (remplacer UUIDs par vrais IDs)
INSERT INTO public.user_roles (user_id, role) VALUES
  ('uuid_ppi', 'COLLABORATEUR'),
  ('uuid_rmo', 'COLLABORATEUR'),
  ('uuid_jma', 'COLLABORATEUR'),
  ('uuid_cca', 'COLLABORATEUR');
```

#### 3. Vérifier les RLS policies

```sql
-- S'assurer que user_roles est accessible en lecture
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy : les utilisateurs peuvent voir leur propre rôle
CREATE POLICY "Users can read own role" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);
```

---

## 🔗 Intégration dans index.html

Les liens d'accès collaborateurs dans index.html pointent vers :
```html
<a href="acces-collaborateurs.html" 
   data-i18n-href-fr="acces-collaborateurs.html" 
   data-i18n-href-en="collaborator-access.html">
  Collaborateurs
</a>
```

✅ Ces liens sont déjà dans index.html avec le système i18n

---

## 🚀 Déploiement sur OVH

### Fichiers à télécharger

```
✅ supabase-client.js (ESSENTIEL)
✅ auth.js (ESSENTIEL)
✅ acces-collaborateurs.html (ESSENTIEL)
✅ collaborator-access.html (ESSENTIEL)
✅ i18n.js (existant, à vérifier présent)
✅ styles-shared.css (existant)
```

### Ordre de déploiement

1. Télécharger `supabase-client.js`
2. Télécharger `auth.js`
3. Télécharger `acces-collaborateurs.html`
4. Télécharger `collaborator-access.html`
5. Vider cache navigateur
6. Tester : cliquer "Accès collaborateurs" depuis index.html

---

## 🧪 Tests après déploiement

### Test 1 : Navigation
```
1. Ouvrir https://myexpertondemand.com/
2. Cliquer sur "Accès collaborateurs" ou "Collaborator Access"
3. Doit afficher la page de login
```

### Test 2 : Formulaire
```
1. Vérifier que le formulaire s'affiche
2. Essayer email/password invalides → message d'erreur
3. Entrer credentials valides → redirection vers dashboard
```

### Test 3 : Commutateur de langue
```
1. Sur acces-collaborateurs.html (FR)
2. Cliquer "FR / EN" → doit aller à collaborator-access.html (EN)
3. Cliquer "EN / FR" → doit revenir à acces-collaborateurs.html (FR)
```

---

## 🔐 Sécurité - Checklist

- [ ] Vérifier que `supabase-client.js` charge correctement
- [ ] Vérifier que `auth.js` gère les erreurs correctement
- [ ] Tester avec des credentials invalides (devrait afficher erreur)
- [ ] Vérifier que les rôles sont correctement assignés
- [ ] Tester la redirection si pas authentifié
- [ ] Vérifier les CORS si appel depuis OVH vers Supabase

---

## 💾 Sauvegarde Supabase

Avant toute modification, **exporter vos données** :

1. Supabase Dashboard → Backups
2. Settings → Database Backups → Create backup
3. Exporter les tables en SQL

---

## 🟢 Status : PRÊT POUR DÉPLOIEMENT

Tous les fichiers d'authentification sont créés et testables localement.

Pour finaliser, restaurez les utilisateurs dans Supabase Dashboard selon les étapes ci-dessus.

