/**
 * auth.js
 * Gestion de l'authentification pour collaborateurs MyEOD
 */

/**
 * Login collaborateur avec email/password
 */
async function loginCollaborateur(email, password) {
  try {
    const { data, error } = await window.MyEODAuth.supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.error('Erreur login:', error.message);
      return { success: false, error: error.message };
    }
    
    // Vérifier que l'utilisateur a le rôle COLLABORATEUR
    const role = await window.MyEODAuth.getUserRole(data.user.id);
    
    if (role !== 'COLLABORATEUR') {
      // Déconnecter et afficher erreur
      await window.MyEODAuth.logout();
      return { 
        success: false, 
        error: 'Accès refusé. Votre compte n\'a pas les permissions collaborateur.' 
      };
    }
    
    return { success: true, user: data.user };
  } catch (err) {
    console.error('Erreur loginCollaborateur:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Login collaborateur avec email/password (EN)
 */
async function loginCollaborator(email, password) {
  return loginCollaborateur(email, password);
}

/**
 * Afficher message d'erreur dans le formulaire
 */
function showLoginError(message, elementId = 'login-error') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/**
 * Cacher message d'erreur
 */
function hideLoginError(elementId = 'login-error') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

/**
 * Gérer la soumission du formulaire de login
 */
async function handleLoginSubmit(event, lang = 'fr') {
  event.preventDefault();
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = event.target.querySelector('button[type="submit"]');
  
  if (!emailInput || !passwordInput) {
    console.error('Champs de formulaire non trouvés');
    return;
  }
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    const msg = lang === 'fr' 
      ? 'Veuillez remplir tous les champs'
      : 'Please fill in all fields';
    showLoginError(msg);
    return;
  }
  
  // Désactiver le bouton pendant le traitement
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = lang === 'fr' ? 'Connexion...' : 'Logging in...';
  }
  
  hideLoginError();
  
  const result = lang === 'fr' 
    ? await loginCollaborateur(email, password)
    : await loginCollaborator(email, password);
  
  if (result.success) {
    // Redirection vers le dashboard collaborateur
    window.location.href = lang === 'fr' 
      ? 'dashboard-collaborateurs.html'
      : 'collaborator-dashboard.html';
  } else {
    showLoginError(result.error);
    
    // Réactiver le bouton
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = lang === 'fr' ? 'Se connecter' : 'Sign in';
    }
  }
}

/**
 * Redirection automatique si déjà connecté
 */
async function redirectIfAlreadyLoggedIn(redirectTo = 'dashboard-collaborateurs.html') {
  const isAuth = await window.MyEODAuth.isCollaboratorAuthenticated();
  
  if (isAuth) {
    window.location.href = redirectTo;
  }
}

/**
 * Initialiser la page de login au chargement
 */
document.addEventListener('DOMContentLoaded', async function() {
  // Vérifier si déjà authentifié
  await redirectIfAlreadyLoggedIn();
  
  // Attacher l'événement du formulaire si présent
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      const lang = document.documentElement.lang || 'fr';
      handleLoginSubmit(e, lang);
    });
  }
});

// Exporter pour utilisation
window.MyEODLogin = {
  loginCollaborateur,
  loginCollaborator,
  showLoginError,
  hideLoginError,
  handleLoginSubmit,
  redirectIfAlreadyLoggedIn
};
