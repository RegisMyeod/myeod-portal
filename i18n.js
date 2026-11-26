/**
 * i18n.js - Gestion du commutateur de langue
 * Bascule entre la page FR (page.html) et sa jumelle EN (page-en.html).
 */

function toggleLanguage() {
  try {
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    const target = /-en\.html$/.test(pageName)
      ? pageName.replace(/-en\.html$/, '.html')
      : pageName.replace(/\.html$/, '-en.html');
    if (target !== pageName) window.location.href = target + window.location.hash;
  } catch (error) {
    console.error('Erreur toggleLanguage:', error);
  }
}

window.myeodSwitchLanguage = toggleLanguage;
