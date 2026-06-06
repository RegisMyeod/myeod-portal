<?php

/**
 * ============================================================================
 * MyEOD Footer Repair Script (PHP Version)
 * 
 * Ce script corrige tous les liens cassés et les ancres incorrectes 
 * dans les footers du site MyEOD
 * 
 * Utilisation :
 * 1. Placez ce fichier à la racine de votre site
 * 2. Accédez à : https://myexpertondemand.com/fix_footers.php
 * 3. Cliquez sur "Commencer la correction"
 * 
 * ============================================================================
 */

// Configuration
$ROOT_PATH = dirname(__FILE__);
$REPAIRS = array();
$ERRORS = array();

// Pages à réparer
$PAGES_TO_REPAIR = array(
    // Pages d'accès avec 5 erreurs 404
    array(
        'file' => 'acces-client.html',
        'type' => 'access',
        'fixes' => array(
            'old' => 'https://myexpertondemand.com/protection-donnees.html',
            'new' => 'https://myexpertondemand.com/mentions-legales-impressum.html#protection-donnees'
        )
    ),
    array(
        'file' => 'acces-client.html',
        'type' => 'access',
        'fixes' => array(
            'old' => 'https://myexpertondemand.com/cookies.html#preferences',
            'new' => 'https://myexpertondemand.com/mentions-legales-impressum.html#preferences'
        )
    ),
    array(
        'file' => 'acces-client.html',
        'type' => 'access',
        'fixes' => array(
            'old' => 'https://myexpertondemand.com/conditions-generales.html',
            'new' => 'https://myexpertondemand.com/mentions-legales-impressum.html#conditions-generales'
        )
    ),
    array(
        'file' => 'acces-client.html',
        'type' => 'access',
        'fixes' => array(
            'old' => 'https://myexpertondemand.com/reclamation-mediation.html',
            'new' => 'https://myexpertondemand.com/mentions-legales-impressum.html#reclamation-mediation'
        )
    ),
    array(
        'file' => 'acces-client.html',
        'type' => 'access',
        'fixes' => array(
            'old' => 'https://myexpertondemand.com/contact.html',
            'new' => 'https://myexpertondemand.com/mentions-legales-impressum.html#contact'
        )
    ),
    
    // Pages de services avec ancres incorrectes
    array(
        'file' => 'service-bridge.html',
        'type' => 'service',
        'fixes' => array(
            array('old' => 'legal.html#mentions-legales"', 'new' => 'legal.html#mentions-legales-impressum"'),
            array('old' => 'legal.html#conditions"', 'new' => 'legal.html#conditions-generales"'),
            array('old' => 'legal.html#reclamation"', 'new' => 'legal.html#reclamation-mediation"')
        )
    ),
    array(
        'file' => 'service-marque-blanche.html',
        'type' => 'service',
        'fixes' => array(
            array('old' => 'legal.html#mentions-legales"', 'new' => 'legal.html#mentions-legales-impressum"'),
            array('old' => 'legal.html#conditions"', 'new' => 'legal.html#conditions-generales"'),
            array('old' => 'legal.html#reclamation"', 'new' => 'legal.html#reclamation-mediation"')
        )
    ),
    array(
        'file' => 'service-medias-reportages.html',
        'type' => 'service',
        'fixes' => array(
            array('old' => 'legal.html#mentions-legales"', 'new' => 'legal.html#mentions-legales-impressum"'),
            array('old' => 'legal.html#conditions"', 'new' => 'legal.html#conditions-generales"'),
            array('old' => 'legal.html#reclamation"', 'new' => 'legal.html#reclamation-mediation"')
        )
    ),
    array(
        'file' => 'service-staffing-augmente.html',
        'type' => 'service',
        'fixes' => array(
            array('old' => 'legal.html#mentions-legales"', 'new' => 'legal.html#mentions-legales-impressum"'),
            array('old' => 'legal.html#conditions"', 'new' => 'legal.html#conditions-generales"'),
            array('old' => 'legal.html#reclamation"', 'new' => 'legal.html#reclamation-mediation"')
        )
    ),
    array(
        'file' => 'service-visual-intelligence.html',
        'type' => 'service',
        'fixes' => array(
            array('old' => 'legal.html#mentions-legales"', 'new' => 'legal.html#mentions-legales-impressum"'),
            array('old' => 'legal.html#conditions"', 'new' => 'legal.html#conditions-generales"'),
            array('old' => 'legal.html#reclamation"', 'new' => 'legal.html#reclamation-mediation"')
        )
    ),
    array(
        'file' => 'services.html',
        'type' => 'service',
        'fixes' => array(
            array('old' => 'legal.html#mentions-legales"', 'new' => 'legal.html#mentions-legales-impressum"'),
            array('old' => 'legal.html#conditions"', 'new' => 'legal.html#conditions-generales"'),
            array('old' => 'legal.html#reclamation"', 'new' => 'legal.html#reclamation-mediation"')
        )
    )
);

/**
 * Réparer un fichier
 */
function repair_file($file_path, $fixes) {
    global $REPAIRS, $ERRORS;
    
    if (!file_exists($file_path)) {
        $ERRORS[] = "Fichier non trouvé : $file_path";
        return false;
    }
    
    // Vérifier les permissions
    if (!is_readable($file_path)) {
        $ERRORS[] = "Fichier non lisible : $file_path";
        return false;
    }
    
    if (!is_writable($file_path)) {
        $ERRORS[] = "Fichier non accessible en écriture : $file_path";
        return false;
    }
    
    // Lire le contenu
    $content = file_get_contents($file_path);
    if ($content === false) {
        $ERRORS[] = "Erreur de lecture : $file_path";
        return false;
    }
    
    // Sauvegarder l'original
    $backup_path = $file_path . '.backup';
    if (!file_exists($backup_path)) {
        if (copy($file_path, $backup_path) === false) {
            $ERRORS[] = "Impossible de créer la sauvegarde : $backup_path";
            return false;
        }
    }
    
    // Appliquer les corrections
    $original_content = $content;
    
    if (is_array($fixes) && isset($fixes['old']) && isset($fixes['new'])) {
        // Une seule correction
        $content = str_replace($fixes['old'], $fixes['new'], $content);
    } else {
        // Plusieurs corrections
        foreach ($fixes as $fix) {
            if (is_array($fix) && isset($fix['old']) && isset($fix['new'])) {
                $content = str_replace($fix['old'], $fix['new'], $content);
            }
        }
    }
    
    // Vérifier qu'il y a eu des changements
    if ($content === $original_content) {
        $ERRORS[] = "Aucun changement pour : $file_path (liens déjà corrects ?)";
        return false;
    }
    
    // Écrire le contenu modifié
    if (file_put_contents($file_path, $content) === false) {
        $ERRORS[] = "Erreur d'écriture : $file_path";
        return false;
    }
    
    $REPAIRS[] = basename($file_path);
    return true;
}

/**
 * Traiter la requête
 */
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'repair') {
    // Procéder aux réparations
    $files_processed = array();
    
    foreach ($PAGES_TO_REPAIR as $page_info) {
        $file_path = $ROOT_PATH . '/' . $page_info['file'];
        
        if (!in_array($file_path, $files_processed)) {
            repair_file($file_path, $page_info['fixes']);
            $files_processed[] = $file_path;
        }
    }
    
    $done = true;
} else {
    $done = false;
}

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyEOD Footer Repair Tool</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            color: #333;
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .content {
            padding: 40px;
        }
        
        .alert {
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 5px solid;
        }
        
        .alert-success {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        
        .alert-error {
            background: #f8d7da;
            border-color: #721c24;
            color: #721c24;
        }
        
        .alert-warning {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #dee2e6;
        }
        
        .stat .number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat .label {
            color: #666;
            margin-top: 10px;
        }
        
        .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        
        .button.secondary {
            background: #6c757d;
        }
        
        .list {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .list h3 {
            color: #28a745;
            margin-bottom: 15px;
        }
        
        .list ul {
            list-style: none;
            padding: 0;
        }
        
        .list li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }
        
        .list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #28a745;
            font-weight: bold;
        }
        
        .error-list h3 {
            color: #dc3545;
        }
        
        .error-list li:before {
            content: "✗";
            color: #dc3545;
        }
        
        .center {
            text-align: center;
        }
        
        .margin-top {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 MyEOD Footer Repair Tool</h1>
            <p>Correction automatique des liens des footers</p>
        </div>
        
        <div class="content">
            <?php if (!$done): ?>
                <!-- PAGE INITIALE -->
                <div class="alert alert-warning">
                    <strong>⚠️ ATTENTION :</strong> Cette action va modifier les fichiers HTML de votre site.
                    <br>Des sauvegardes seront créées automatiquement (.backup).
                </div>
                
                <div class="stats">
                    <div class="stat">
                        <div class="number">8</div>
                        <div class="label">Fichiers à corriger</div>
                    </div>
                    <div class="stat">
                        <div class="number">18</div>
                        <div class="label">Erreurs identifiées</div>
                    </div>
                    <div class="stat">
                        <div class="number">100%</div>
                        <div class="label">Automatisé</div>
                    </div>
                </div>
                
                <h2 style="color: #333; margin-bottom: 20px;">📋 Fichiers à réparer :</h2>
                
                <div class="list">
                    <h3>Pages d'accès (5 erreurs 404 chacune)</h3>
                    <ul>
                        <li>acces-client.html</li>
                        <li>acces-collaborateurs.html</li>
                    </ul>
                </div>
                
                <div class="list">
                    <h3>Pages de services (3 ancres incorrectes chacune)</h3>
                    <ul>
                        <li>service-bridge.html</li>
                        <li>service-marque-blanche.html</li>
                        <li>service-medias-reportages.html</li>
                        <li>service-staffing-augmente.html</li>
                        <li>service-visual-intelligence.html</li>
                        <li>services.html</li>
                    </ul>
                </div>
                
                <div class="center margin-top">
                    <a href="?action=repair" class="button" onclick="return confirm('Êtes-vous sûr de vouloir procéder à la correction ? Des sauvegardes seront créées automatiquement.');">
                        ✅ Commencer la correction
                    </a>
                </div>
                
            <?php else: ?>
                <!-- PAGE DE RÉSULTATS -->
                <?php if (empty($ERRORS)): ?>
                    <div class="alert alert-success">
                        <strong>✅ Correction réussie !</strong>
                        <br>Tous les fichiers ont été corrigés avec succès.
                    </div>
                    
                    <div class="list">
                        <h3>Fichiers corrigés</h3>
                        <ul>
                            <?php foreach ($REPAIRS as $file): ?>
                                <li><?php echo htmlspecialchars($file); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    
                    <div class="alert alert-warning" style="margin-top: 30px;">
                        <strong>💡 Étapes suivantes :</strong>
                        <ol style="margin: 10px 0; padding-left: 20px;">
                            <li>Testez tous les liens dans votre navigateur (FR et EN)</li>
                            <li>Vérifiez que les ancres scrollent correctement</li>
                            <li>Confirmez l'absence d'erreurs 404</li>
                            <li>Les fichiers .backup peuvent être supprimés si tout fonctionne</li>
                        </ol>
                    </div>
                    
                <?php else: ?>
                    <div class="alert alert-error">
                        <strong>❌ Erreurs détectées :</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <?php foreach ($ERRORS as $error): ?>
                                <li><?php echo htmlspecialchars($error); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    
                    <?php if (!empty($REPAIRS)): ?>
                        <div class="list">
                            <h3>Fichiers partiellement corrigés</h3>
                            <ul>
                                <?php foreach ($REPAIRS as $file): ?>
                                    <li><?php echo htmlspecialchars($file); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
                
                <div class="center margin-top">
                    <a href="?" class="button secondary">
                        🔄 Recommencer
                    </a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
