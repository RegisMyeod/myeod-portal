/**
 * SUPABASE SQL — Créer table password_reset_requests
 * 
 * À exécuter dans: Supabase Dashboard → SQL Editor
 * Copier le contenu ci-dessous et exécuter
 */

-- Créer la table password_reset_requests
CREATE TABLE public.password_reset_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Créer index sur user_id et status pour optimiser les requêtes
CREATE INDEX idx_password_reset_requests_user_id ON public.password_reset_requests(user_id);
CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests(status);
CREATE INDEX idx_password_reset_requests_created_at ON public.password_reset_requests(created_at DESC);

-- Activer Row Level Security
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Policy : les utilisateurs ne peuvent voir que leurs propres demandes
CREATE POLICY "Users can view their own password reset requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy : les utilisateurs ne peuvent créer que leurs propres demandes
CREATE POLICY "Users can create their own password reset requests"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy : Christelle & admin peuvent voir/mettre à jour toutes les demandes
-- (À adapter selon votre UUID admin dans Supabase)
CREATE POLICY "Admin can view and update all requests"
  ON public.password_reset_requests
  FOR ALL
  USING (auth.uid() IN (
    'f18c5942-c0b8-4ef7-8e2c-f2f5a50690f4'  -- Christelle Cantrainne (CHC)
  ));

-- Commenter les lignes ci-dessous si vous avez un système de rôles admin
-- CREATE POLICY "Only admin can update status"
--   ON public.password_reset_requests
--   FOR UPDATE
--   USING (auth.uid() IN (SELECT user_id FROM auth.users WHERE email LIKE '%@admin.%'))
--   WITH CHECK (auth.uid() IN (SELECT user_id FROM auth.users WHERE email LIKE '%@admin.%'));

COMMENT ON TABLE public.password_reset_requests IS 'Demandes de réinitialisation de mot de passe créées via le formulaire forgot-password.html';
COMMENT ON COLUMN public.password_reset_requests.user_id IS 'UUID de l''utilisateur qui a demandé la réinitialisation';
COMMENT ON COLUMN public.password_reset_requests.user_email IS 'Email de l''utilisateur (dénormalisé pour faciliter les recherches)';
COMMENT ON COLUMN public.password_reset_requests.reason IS 'Raison optionnelle donnée par l''utilisateur';
COMMENT ON COLUMN public.password_reset_requests.status IS 'État de la demande: pending, completed, ou rejected';

-- Afficher les demandes en attente
-- SELECT * FROM public.password_reset_requests WHERE status = 'pending' ORDER BY created_at DESC;
