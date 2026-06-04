/**
 * supabase-client.js
 * Configuration et initialisation du client Supabase pour MyEOD
 * 
 * Credentials :
 * - Project URL: https://kewhxzitwdrnpsnzlihn.supabase.co
 * - Anon Key: sb_publishable_owbl6MuPlOfMYAOPMxQ8Hg_deQuxLWi
 */

// Initialiser Supabase
const SUPABASE_URL = 'https://kewhxzitwdrnpsnzlihn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_owbl6MuPlOfMYAOPMxQ8Hg_deQuxLWi';

// Créer client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Vérifier la session utilisateur actuelle
 */
async function checkAuthSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erreur vérification session:', error);
      return null;
    }
    
    return session;
  } catch (err) {
    console.error('Erreur checkAuthSession:', err);
    return null;
  }
}

/**
 * Obtenir l'utilisateur actuel
 */
async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erreur getCurrentUser:', error);
      return null;
    }
    
    return user;
  } catch (err) {
    console.error('Erreur getCurrentUser:', err);
    return null;
  }
}

/**
 * Obtenir le rôle de l'utilisateur (via RLS ou custom claims)
 */
async function getUserRole(userId) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.warn('Aucun rôle trouvé pour cet utilisateur');
      return null;
    }
    
    return data?.role || null;
  } catch (err) {
    console.error('Erreur getUserRole:', err);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur est authentifié ET a le rôle COLLABORATEUR
 */
async function isCollaboratorAuthenticated() {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  const role = await getUserRole(user.id);
  return role === 'COLLABORATEUR';
}

/**
 * Vérifier si l'utilisateur est authentifié ET a le rôle CLIENT
 */
async function isClientAuthenticated() {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  const role = await getUserRole(user.id);
  return role === 'CLIENT';
}

/**
 * Listener sur les changements d'authentification
 */
function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Se déconnecter
 */
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erreur logout:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erreur logout:', err);
    return false;
  }
}

/**
 * Protéger une page (redirection si pas authentifié)
 */
async function protectPageByRole(requiredRole) {
  const user = await getCurrentUser();
  
  if (!user) {
    // Rediriger vers index.html
    window.location.href = 'index.html';
    return false;
  }
  
  if (requiredRole) {
    const role = await getUserRole(user.id);
    
    if (role !== requiredRole) {
      // Rediriger vers index.html si rôle insuffisant
      window.location.href = 'index.html';
      return false;
    }
  }
  
  return true;
}

// Exporter pour utilisation
window.MyEODAuth = {
  supabase,
  checkAuthSession,
  getCurrentUser,
  getUserRole,
  isCollaboratorAuthenticated,
  isClientAuthenticated,
  onAuthStateChange,
  logout,
  protectPageByRole
};
