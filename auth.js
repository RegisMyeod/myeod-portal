/**
 * MyEOD Authentication Handler
 * Gère les formulaires de login, logout, et vérification des rôles
 */

// ============================================================================
// HANDLE LOGIN FORM SUBMISSION
// ============================================================================

async function handleLoginSubmit(event) {
  event.preventDefault();
  
  // Get form elements
  const form = event.target;
  const emailInput = form.querySelector('input[type="email"]');
  const passwordInput = form.querySelector('input[type="password"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorElement = form.querySelector('[data-error], .login-error, #login-error');
  
  const email = emailInput?.value?.trim() || '';
  const password = passwordInput?.value || '';
  
  // Validate inputs
  if (!email || !password) {
    if (errorElement) {
      errorElement.textContent = 'Veuillez entrer votre email et mot de passe.';
      errorElement.style.display = 'block';
    }
    return false;
  }
  
  // Disable submit button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion en cours...';
  }
  
  // Clear error
  if (errorElement) {
    errorElement.style.display = 'none';
  }
  
  try {
    // Check if MyEODAuth is available
    if (!window.MyEODAuth || !window.MyEODAuth.signInWithPassword) {
      throw new Error('Authentification Supabase non disponible');
    }
    
    // Attempt login
    const loginResult = await window.MyEODAuth.signInWithPassword(email, password);
    
    if (!loginResult.success) {
      throw new Error(loginResult.error || 'Identifiants invalides');
    }
    
    const user = loginResult.user;
    console.log('[Auth] Login successful for user:', user.email);
    
    // Get user role
    const role = await window.MyEODAuth.getUserRole(user.id);
    console.log('[Auth] User role:', role);
    
    // Check role
    if (role !== 'COLLABORATEUR') {
      await window.MyEODAuth.logout();
      throw new Error('Accès refusé. Votre compte n\'a pas les permissions collaborateur.');
    }
    
    // Store language preference
    const lang = document.documentElement.lang || 'fr';
    try {
      sessionStorage.setItem('myeod_lang', lang);
    } catch (e) {
      console.warn('[Auth] Could not save language preference');
    }
    
    // Redirect to dashboard
    const dashboardUrl = lang === 'fr' 
      ? 'dashboard-collaborateurs.html'
      : 'collaborator-dashboard.html';
    
    console.log('[Auth] Redirecting to:', dashboardUrl);
    window.location.href = dashboardUrl;
    
  } catch (err) {
    console.error('[Auth] Login error:', err);
    
    if (errorElement) {
      // Determine user-friendly error message
      let errorMsg = 'Erreur de connexion';
      
      if (err.message.includes('Invalid login credentials') || err.message.includes('Incorrect')) {
        errorMsg = 'Email ou mot de passe incorrect.';
      } else if (err.message.includes('permissions collaborateur')) {
        errorMsg = err.message;
      } else if (err.message.includes('Supabase')) {
        errorMsg = 'Service d\'authentification indisponible. Veuillez réessayer.';
      } else {
        errorMsg = err.message || 'Erreur de connexion. Veuillez réessayer.';
      }
      
      errorElement.textContent = errorMsg;
      errorElement.style.display = 'block';
    }
  } finally {
    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
    }
  }
  
  return false;
}

// ============================================================================
// HANDLE FORGOT PASSWORD
// ============================================================================

async function handleForgotPassword(event) {
  event?.preventDefault();
  
  const emailInput = document.querySelector('input[data-forgot-email], #forgot-email');
  const email = emailInput?.value?.trim() || '';
  
  if (!email) {
    alert('Veuillez entrer votre email.');
    return false;
  }
  
  if (!window.MyEODAuth || !window.MyEODAuth.requestPasswordReset) {
    alert('Service d\'authentification indisponible.');
    return false;
  }
  
  try {
    const result = await window.MyEODAuth.requestPasswordReset(email);
    
    if (result.success) {
      alert('Un email de réinitialisation a été envoyé à ' + email);
      return true;
    } else {
      alert('Erreur: ' + (result.error || 'Impossible d\'envoyer l\'email'));
      return false;
    }
  } catch (err) {
    console.error('[Auth] Password reset error:', err);
    alert('Erreur de réinitialisation: ' + err.message);
    return false;
  }
}

// ============================================================================
// HANDLE LOGOUT
// ============================================================================

async function handleLogout(event) {
  event?.preventDefault();
  
  if (!window.MyEODAuth || !window.MyEODAuth.logout) {
    window.location.href = 'acces-collaborateurs.html';
    return;
  }
  
  try {
    const result = await window.MyEODAuth.logout();
    console.log('[Auth] Logout successful');
    
    // Clear session
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('[Auth] Could not clear session storage');
    }
    
    // Redirect to login
    window.location.href = 'acces-collaborateurs.html';
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    window.location.href = 'acces-collaborateurs.html';
  }
}

// ============================================================================
// CHECK AUTHENTICATION ON PAGE LOAD
// ============================================================================

async function checkAuthOnPageLoad() {
  try {
    if (!window.MyEODAuth || !window.MyEODAuth.getCurrentUser) {
      console.warn('[Auth] MyEODAuth not available');
      return false;
    }
    
    const user = await window.MyEODAuth.getCurrentUser();
    
    if (user) {
      console.log('[Auth] User already authenticated:', user.email);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[Auth] Error checking authentication:', err);
    return false;
  }
}

// ============================================================================
// INITIALIZE AUTHENTICATION LISTENERS
// ============================================================================

function initAuthListeners() {
  // Attach form handlers when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.querySelector('form[data-form="login"], #login-form, form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
      console.log('[Auth] Login form listener attached');
    }
    
    // Logout buttons
    document.querySelectorAll('[data-action="logout"], .btn-logout').forEach(btn => {
      btn.addEventListener('click', handleLogout);
    });
    
    // Forgot password
    const forgotLink = document.querySelector('[data-action="forgot-password"], #forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        handleForgotPassword();
      });
    }
    
    // Watch for auth changes
    if (window.MyEODAuth && window.MyEODAuth.onAuthStateChange) {
      window.MyEODAuth.onAuthStateChange((event, session) => {
        console.log('[Auth] Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out, redirecting to login');
          window.location.href = 'acces-collaborateurs.html';
        }
      });
    }
  });
}

// ============================================================================
// INITIALIZE ON SCRIPT LOAD
// ============================================================================

console.log('[Auth] auth.js loaded');
initAuthListeners();
