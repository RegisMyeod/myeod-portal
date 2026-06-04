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
 * Envoyer lien réinitialisation mot de passe
 */
async function sendPasswordResetEmail(email) {
  try {
    const { data, error } = await window.MyEODAuth.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });
    
    if (error) {
      console.error('Erreur reset password:', error.message);
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Email de réinitialisation envoyé' };
  } catch (err) {
    console.error('Erreur sendPasswordResetEmail:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Gérer la soumission du formulaire "Mot de passe oublié"
 */
async function handleForgotPasswordSubmit(event, lang = 'fr') {
  event.preventDefault();
  
  const emailInput = document.getElementById('email');
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const messageEl = document.getElementById('reset-message');
  
  if (!emailInput) {
    console.error('Champ email non trouvé');
    return;
  }
  
  const email = emailInput.value.trim();
  
  if (!email) {
    const msg = lang === 'fr' 
      ? 'Veuillez entrer votre adresse email'
      : 'Please enter your email address';
    showLoginError(msg);
    return;
  }
  
  // Désactiver le bouton
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = lang === 'fr' ? 'Envoi en cours...' : 'Sending...';
  }
  
  hideLoginError();
  if (messageEl) messageEl.style.display = 'none';
  
  const result = await sendPasswordResetEmail(email);
  
  if (result.success) {
    // Afficher message de succès
    if (messageEl) {
      messageEl.textContent = lang === 'fr'
        ? 'Un email de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception.'
        : 'A password reset email has been sent to your email address. Please check your inbox.';
      messageEl.style.display = 'block';
      messageEl.style.background = '#f0fdf4';
      messageEl.style.borderColor = '#86efac';
      messageEl.style.color = '#166534';
    }
    
    // Vider le champ
    emailInput.value = '';
  } else {
    showLoginError(result.error);
  }
  
  // Réactiver le bouton
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = lang === 'fr' ? 'Envoyer le lien' : 'Send link';
  }
}

/**
 * Réinitialiser le mot de passe avec le token
 */
async function updatePassword(newPassword) {
  try {
    const { data, error } = await window.MyEODAuth.supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Erreur update password:', error.message);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Erreur updatePassword:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Gérer la soumission du formulaire "Nouveau mot de passe"
 */
async function handleResetPasswordSubmit(event, lang = 'fr') {
  event.preventDefault();
  
  const passwordInput = document.getElementById('new-password');
  const confirmInput = document.getElementById('confirm-password');
  const submitBtn = event.target.querySelector('button[type="submit"]');
  
  if (!passwordInput || !confirmInput) {
    console.error('Champs de mot de passe non trouvés');
    return;
  }
  
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  
  if (!password || !confirm) {
    const msg = lang === 'fr'
      ? 'Veuillez remplir tous les champs'
      : 'Please fill in all fields';
    showLoginError(msg);
    return;
  }
  
  if (password !== confirm) {
    const msg = lang === 'fr'
      ? 'Les mots de passe ne correspondent pas'
      : 'Passwords do not match';
    showLoginError(msg);
    return;
  }
  
  if (password.length < 8) {
    const msg = lang === 'fr'
      ? 'Le mot de passe doit contenir au moins 8 caractères'
      : 'Password must be at least 8 characters long';
    showLoginError(msg);
    return;
  }
  
  // Désactiver le bouton
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = lang === 'fr' ? 'Mise à jour...' : 'Updating...';
  }
  
  hideLoginError();
  
  const result = await updatePassword(password);
  
  if (result.success) {
    // Rediriger vers page de connexion
    setTimeout(() => {
      const redirectPage = lang === 'fr' 
        ? 'acces-collaborateurs.html'
        : 'collaborator-access.html';
      window.location.href = redirectPage;
    }, 1500);
  } else {
    showLoginError(result.error);
    
    // Réactiver le bouton
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = lang === 'fr' ? 'Mettre à jour le mot de passe' : 'Update password';
    }
  }
}

/**
 * Initialiser la page de login au chargement
 */
document.addEventListener('DOMContentLoaded', async function() {
  // Vérifier si déjà authentifié
  await redirectIfAlreadyLoggedIn();
  
  // Attacher l'événement du formulaire login si présent
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      const lang = document.documentElement.lang || 'fr';
      handleLoginSubmit(e, lang);
    });
  }
  
  // Attacher l'événement du formulaire "mot de passe oublié" si présent
  const forgotForm = document.getElementById('forgot-password-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', function(e) {
      const lang = document.documentElement.lang || 'fr';
      handleForgotPasswordSubmit(e, lang);
    });
  }
  
  // Attacher l'événement du formulaire "réinitialiser mot de passe" si présent
  const resetForm = document.getElementById('reset-password-form');
  if (resetForm) {
    resetForm.addEventListener('submit', function(e) {
      const lang = document.documentElement.lang || 'fr';
      handleResetPasswordSubmit(e, lang);
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
  redirectIfAlreadyLoggedIn,
  sendPasswordResetEmail,
  handleForgotPasswordSubmit,
  updatePassword,
  handleResetPasswordSubmit
};
