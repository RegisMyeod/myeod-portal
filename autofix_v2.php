<?php
/**
 * ============================================================================
 * MyEOD - AUTO-FIX Script v2 (CORRIGÉ)
 * 
 * CORRECTION IMPORTANTE :
 * - FR : legal.html?lang=fr (avec bonnes ancres FR)
 * - EN : legal.html?lang=en (avec bonnes ancres EN)
 * 
 * Ce script ajoute un JavaScript qui détecte la langue et bascule automatiquement
 * les liens du footer entre FR et EN
 * 
 * ============================================================================
 */

// Afficher les erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Obtenir le répertoire courant
$dir = dirname(__FILE__);
$success = 0;
$failed = 0;
$messages = [];

// Fonction pour corriger un fichier
function fixFile($filePath, $isAccessPage = false) {
    global $success, $failed, $messages;
    
    if (!file_exists($filePath)) {
        $failed++;
        $messages[] = "❌ Fichier non trouvé : " . basename($filePath);
        return false;
    }
    
    // Lire le contenu
    $content = file_get_contents($filePath);
    if ($content === false) {
        $failed++;
        $messages[] = "❌ Erreur de lecture : " . basename($filePath);
        return false;
    }
    
    $original = $content;
    
    // ========== CORRECTIONS ==========
    
    if ($isAccessPage) {
        // Pages d'accès
        $content = str_replace(
            'https://myexpertondemand.com/protection-donnees.html',
            'https://myexpertondemand.com/mentions-legales-impressum.html#protection-donnees',
            $content
        );
        $content = str_replace(
            'https://myexpertondemand.com/cookies.html#preferences',
            'https://myexpertondemand.com/mentions-legales-impressum.html#preferences',
            $content
        );
        $content = str_replace(
            'https://myexpertondemand.com/conditions-generales.html',
            'https://myexpertondemand.com/mentions-legales-impressum.html#conditions-generales',
            $content
        );
        $content = str_replace(
            'https://myexpertondemand.com/reclamation-mediation.html',
            'https://myexpertondemand.com/mentions-legales-impressum.html#reclamation-mediation',
            $content
        );
        $content = str_replace(
            'https://myexpertondemand.com/contact.html',
            'https://myexpertondemand.com/mentions-legales-impressum.html#contact',
            $content
        );
    } else {
        // Pages de service - Version FRANÇAISE pour maintenant
        // On ajoute un script qui bascule les liens EN si ?lang=en
        
        // 1. Remplacer #cookies par #preferences
        $content = str_replace(
            'href="legal.html#cookies"',
            'href="legal.html?lang=fr#preferences" data-lang-en="legal.html?lang=en#cookies"',
            $content
        );
        
        // 2. Ajouter ?lang=fr aux autres ancres et ajouter les équivalents EN
        $content = str_replace(
            'href="legal.html#mentions-legales"',
            'href="legal.html?lang=fr#mentions-legales-impressum" data-lang-en="legal.html?lang=en#legal-notice-impressum"',
            $content
        );
        $content = str_replace(
            'href="legal.html#conditions"',
            'href="legal.html?lang=fr#conditions-generales" data-lang-en="legal.html?lang=en#terms-of-use"',
            $content
        );
        $content = str_replace(
            'href="legal.html#reclamation"',
            'href="legal.html?lang=fr#reclamation-mediation" data-lang-en="legal.html?lang=en#complaints-mediation"',
            $content
        );
        
        // 3. Ajouter ?lang=fr à toutes les autres ancres existantes
        $content = str_replace(
            'href="legal.html#mentions-legales-impressum"',
            'href="legal.html?lang=fr#mentions-legales-impressum" data-lang-en="legal.html?lang=en#legal-notice-impressum"',
            $content
        );
        $content = str_replace(
            'href="legal.html#protection-donnees"',
            'href="legal.html?lang=fr#protection-donnees" data-lang-en="legal.html?lang=en#data-protection"',
            $content
        );
        $content = str_replace(
            'href="legal.html#conditions-generales"',
            'href="legal.html?lang=fr#conditions-generales" data-lang-en="legal.html?lang=en#terms-of-use"',
            $content
        );
        $content = str_replace(
            'href="legal.html#reclamation-mediation"',
            'href="legal.html?lang=fr#reclamation-mediation" data-lang-en="legal.html?lang=en#complaints-mediation"',
            $content
        );
        $content = str_replace(
            'href="legal.html#contact"',
            'href="legal.html?lang=fr#contact" data-lang-en="legal.html?lang=en#contact-en"',
            $content
        );
        $content = str_replace(
            'href="legal.html#preferences"',
            'href="legal.html?lang=fr#preferences" data-lang-en="legal.html?lang=en#cookies"',
            $content
        );
        
        // 4. Ajouter le script de bascule de langue si pas déjà là
        if (strpos($content, 'data-lang-switcher') === false) {
            $langScript = <<<'LANGSCRIPT'
<script id="legal-lang-switcher" data-lang-switcher>
(function() {
  // Basculer les liens legal.html selon la langue
  function updateLegalLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'fr';
    
    // Trouver tous les liens vers legal.html
    const legalLinks = document.querySelectorAll('a[href*="legal.html"]');
    legalLinks.forEach(link => {
      if (lang === 'en' && link.dataset.langEn) {
        // Utiliser le lien anglais si disponible
        link.href = link.dataset.langEn;
      } else if (lang === 'fr') {
        // Rester sur le lien français
        link.href = link.getAttribute('href').split(' ')[0];
      }
    });
  }
  
  // Exécuter au chargement
  updateLegalLinks();
  
  // Rééxécuter si la langue change
  window.addEventListener('load', updateLegalLinks);
})();
</script>
LANGSCRIPT;
            // Ajouter le script avant la fermeture du body
            $content = str_replace('</body>', $langScript . '\n</body>', $content);
        }
    }
    
    // Vérifier qu'il y a eu des changements
    if ($content === $original) {
        $messages[] = "ℹ️ Aucun changement : " . basename($filePath);
        return true;
    }
    
    // Créer une sauvegarde
    $backup = $filePath . '.backup.' . time();
    if (!copy($filePath, $backup)) {
        $failed++;
        $messages[] = "❌ Sauvegarde échouée : " . basename($filePath);
        return false;
    }
    
    // Écrire le fichier
    if (file_put_contents($filePath, $content) === false) {
        $failed++;
        $messages[] = "❌ Écriture échouée : " . basename($filePath);
        return false;
    }
    
    $success++;
    $messages[] = "✅ " . basename($filePath) . " corrigé (sauvegarde : " . basename($backup) . ")";
    return true;
}

// ========== CORRECTION DES FICHIERS ==========

// Pages de service
$serviceFiles = [
    'services.html',
    'service-bridge.html',
    'service-marque-blanche.html',
    'service-medias-reportages.html',
    'service-staffing-augmente.html',
    'service-visual-intelligence.html'
];

foreach ($serviceFiles as $file) {
    fixFile($dir . '/' . $file, false);
}

// Pages d'accès
$accessFiles = [
    'acces-client.html',
    'acces-collaborateurs.html'
];

foreach ($accessFiles as $file) {
    fixFile($dir . '/' . $file, true);
}

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyEOD - Réparation Automatique v2</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 600px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
        }
        
        .badge {
            display: inline-block;
            background: #ffc107;
            color: #333;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-top: 10px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .result {
            margin-bottom: 30px;
        }
        
        .result h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.3em;
        }
        
        .messages {
            list-style: none;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .messages li {
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #333;
        }
        
        .messages li:last-child {
            border-bottom: none;
        }
        
        .summary {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            padding: 20px;
            border-radius: 8px;
            border-left: 5px solid #28a745;
            margin-top: 30px;
        }
        
        .summary h3 {
            color: #155724;
            margin-bottom: 10px;
        }
        
        .summary p {
            color: #155724;
            margin: 5px 0;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        .next-steps {
            background: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            border-left: 5px solid #ffc107;
            margin-top: 30px;
        }
        
        .next-steps h3 {
            color: #856404;
            margin-bottom: 10px;
        }
        
        .next-steps ol {
            color: #856404;
            margin-left: 20px;
        }
        
        .next-steps li {
            margin: 5px 0;
        }
        
        .new-feature {
            background: #d1ecf1;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #0c5460;
            margin-top: 20px;
            color: #0c5460;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 MyEOD</h1>
            <p>Réparation Automatique des Footers</p>
            <span class="badge">✨ Version 2 - FR + EN</span>
        </div>
        
        <div class="content">
            <div class="result">
                <h2>📊 Résultats de la Réparation</h2>
                <ul class="messages">
                    <?php foreach ($messages as $msg): ?>
                        <li><?php echo htmlspecialchars($msg); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            
            <div class="summary">
                <h3>✅ Résumé Final</h3>
                <p><strong><?php echo $success; ?> fichiers corrigés</strong></p>
                <p><strong><?php echo $failed; ?> erreurs</strong></p>
                <?php if ($failed === 0 && $success > 0): ?>
                    <p style="margin-top: 10px; font-weight: bold;">🎉 SUCCÈS ! Tous les fichiers ont été réparés !</p>
                <?php endif; ?>
            </div>
            
            <div class="new-feature">
                <strong>✨ NOUVEAU en v2 :</strong> Un script JavaScript détecte automatiquement la langue et bascule les liens du footer entre FR et EN !
            </div>
            
            <?php if ($success > 0): ?>
            <div class="next-steps">
                <h3>🧪 Étapes Suivantes</h3>
                <ol>
                    <li>Testez FR : https://myexpertondemand.com/services.html → Cookies → Français ✓</li>
                    <li>Testez EN : https://myexpertondemand.com/services.html?lang=en → Cookies → Anglais ✓</li>
                    <li>Les liens doivent aussi basculer automatiquement (?lang=en au lieu de ?lang=fr)</li>
                    <li>Supprimez ce fichier (autofix.php) du serveur</li>
                    <li>Les fichiers .backup peuvent aussi être supprimés</li>
                </ol>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="footer">
            ✅ Réparation automatique v2 terminée<br>
            Vous pouvez maintenant supprimer ce fichier (autofix.php) du serveur
        </div>
    </div>
</body>
</html>
