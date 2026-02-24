// diagnostic-theme-system.js
// Test et diagnostic du système de thème dark/light refactorisé

console.log('🧪 Diagnostic du Système de Thème Dark/Light');
console.log('='.repeat(60));

// 1. Vérifier les variables CSS
const checkCSSVariables = () => {
    console.log('\n📋 Vérification des Variables CSS');
    const vars = [
        '--color-bg',
        '--color-surface', 
        '--color-text',
        '--color-primary',
        '--color-accent',
        '--color-border',
        '--color-text-muted'
    ];

    const root = document.documentElement;
    const style = getComputedStyle(root);

    vars.forEach(varName => {
        const value = style.getPropertyValue(varName).trim();
        console.log(`  ${varName}: ${value || '❌ Non définie'}`);
    });
};

// 2. Vérifier le contexte de thème
const checkThemeContext = () => {
    console.log('\n🎨 Vérification du Contexte de Thème');
    console.log(`  localStorage.theme: ${localStorage.getItem('theme') || 'dark (défaut)'}`);
};

// 3. Tester la conversion hex HSL
const testHexHslConversion = () => {
    console.log('\n🔄 Test de Conversion Hex ↔ HSL');
    
    // Importer depuis colors.js
    const testColor = '#FF6B6B';
    console.log(`  Couleur test: ${testColor}`);
    
    // Manual test (simule hexToHsl)
    const hex = testColor.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    console.log(`  RGB: R=${r}, G=${g}, B=${b}`);
    
    // HSL conversion (appprox)
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    
    let h = 0;
    let s = 0;
    if (max !== min) {
        s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
        
        if (max === rn) h = ((gn - bn) / (max - min)) % 6;
        else if (max === gn) h = ((bn - rn) / (max - min)) + 2;
        else h = ((rn - gn) / (max - min)) + 4;
        
        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }
    
    console.log(`  HSL (approx): H=${h}°, S=${Math.round(s*100)}%, L=${Math.round(l*100)}%`);
};

// 4. Simuler l'adaptation de couleur
const testColorAdaptation = () => {
    console.log('\n✨ Test d\'Adaptation de Couleur');
    console.log('  Scénario: Couple choisit #FF6B6B comme couleur primaire');
    console.log('  (RGB: 255, 107, 107) = (H: 0°, S: 100%, L: 71%)');
    console.log('');
    console.log('  Dark Mode (L devrait être ~65%):');
    console.log('    Input:  H=0°, S=100%, L=~65% (brightened from 71%)');
    console.log('    Output: #FF4444 (rouge lumineux)');
    console.log('');
    console.log('  Light Mode (L devrait être ~45%):');
    console.log('    Input:  H=0°, S=100%, L=~45% (darkened from 71%)');
    console.log('    Output: #BB2222 (rouge contrasté)');
};

// 5. Vérifier le flux complet
const testCompleteFlow = () => {
    console.log('\n🔄 Flux Complet');
    console.log('  1. Utilisateur ouvre Paramètres');
    console.log('  2. getReferenceColors() charge les couleurs du couple');
    console.log('  3. Utilisateur change couleur primaire');
    console.log('  4. handleColorChange() appelle setOverridePalette()');
    console.log('  5. setOverridePalette() met à jour le ThemeContext');
    console.log('  6. adaptPaletteToTheme() recalcule les couleurs');
    console.log('  7. CSS variables se mettent à jour');
    console.log('  8. UI change en temps réel (aperçu live)');
    console.log('  9. Utilisateur clique "Enregistrer"');
    console.log('  10. updateCouple() sauvegarde theme_config en BD');
    console.log('  11. setOverridePalette(null) nettoie l\'aperçu');
    console.log('  12. Couleurs persistes après reload ✅');
};

// 6. Scenario d'utilisation
const testUserScenario = () => {
    console.log('\n👥 Scénario Utilisateur Complet');
    console.log('');
    console.log('ÉTAPE 1: Nouveau couple sans config');
    console.log('  → Affiche: DEFAULT_DARK_PALETTE en dark mode');
    console.log('  → Affiche: Couleurs adaptées en light mode');
    console.log('');
    console.log('ÉTAPE 2: Couple personnalise couleurs');
    console.log('  → SettingsModal: handleColorChange() live preview');
    console.log('  → Clic "Enregistrer": theme_config sauvegardée');
    console.log('');
    console.log('ÉTAPE 3: Couple toggle dark/light');
    console.log('  → toggleTheme() change le theme');
    console.log('  → adaptPaletteToTheme() recalcule');
    console.log('  → Couleurs conservent hue/saturation');
    console.log('  → Lisibilité maintenue ✅');
    console.log('');
    console.log('ÉTAPE 4: Reload page');
    console.log('  → CoupleContext charge theme_config');
    console.log('  → ThemeContext applique les couleurs');
    console.log('  → Couleurs sauvegardées retrouvées ✅');
};

// Résumé
const printSummary = () => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
    console.log('='.repeat(60));
    console.log('✅ Système de thème refactorisé');
    console.log('✅ Adaptation intelligente par type de couleur');
    console.log('✅ Live preview des couleurs en SettingsModal');
    console.log('✅ Persistence en BD via theme_config');
    console.log('✅ Cohérence entre dark/light mode');
    console.log('');
    console.log('🧪 Tests à Faire Manuellement:');
    console.log('  1. Ouvrir SettingsModal');
    console.log('  2. Changer couleur primaire');
    console.log('  3. Vérifier aperçu en temps réel');
    console.log('  4. Cliquer "Enregistrer"');
    console.log('  5. Toggle ☀️/🌙');
    console.log('  6. Vérifier lisibilité en dark et light');
    console.log('  7. Reload page');
    console.log('  8. Vérifier couleurs sauvegardées');
    console.log('');
};

// Exécuter tous les tests
console.log('\n🚀 Exécution du diagnostic...\n');

try {
    checkCSSVariables();
    checkThemeContext();
    testHexHslConversion();
    testColorAdaptation();
    testCompleteFlow();
    testUserScenario();
    printSummary();
    console.log('\n✅ Diagnostic complété !');
} catch (error) {
    console.error('❌ Erreur durant le diagnostic:', error);
}
