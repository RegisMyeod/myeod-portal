/**
 * i18n.js - Gestion du commutateur de langue
 * Permet de basculer entre FR et EN sur les pages services
 */

function toggleLanguage() {
  try {
    const current = document.getElementById('lang-current').textContent.trim();
    const pageName = window.location.pathname.split('/').pop();
    
    if (current === 'FR') {
      // Basculer vers EN
      const enPage = pageName.replace('.html', '-en.html');
      if (enPage !== pageName) {
        window.location.href = enPage;
      }
    } else {
      // Basculer vers FR
      const frPage = pageName.replace('-en.html', '.html');
      if (frPage !== pageName) {
        window.location.href = frPage;
      }
    }
  } catch (error) {
    console.error('Erreur toggleLanguage:', error);
  }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    // S'assurer que le bouton est cliquable
    langBtn.addEventListener('click', toggleLanguage);
  }
});
