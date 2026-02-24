/**
 * Utility functions for color manipulation
 */

// Convert Hex to HSL
export const hexToHsl = (hex) => {
    if (!hex || typeof hex !== 'string') return null;

    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

// Convert HSL to Hex
export const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * NEW APPROACH: Adapter les couleurs en fonction du thème
 * Sans inverser agressivement. On garde la cohérence.
 */

// Adapter une couleur pour le light mode (garder la cohérence visuelle)
const adaptColorForLight = (hex, type = 'normal') => {
    const hsl = hexToHsl(hex);
    if (!hsl) return hex;

    let newL;

    if (type === 'brand') {
        // Couleurs de marque (primary, accent): Garder le même hue/sat, adapter luminosité
        // En light mode, on veut que ce soit lisible mais pas trop saturé
        newL = 45; // Couleur sombre mais toujours visible
    } else if (type === 'text') {
        // Texte: doit être sombre en light mode
        newL = 20; // Très sombre
    } else if (type === 'textMuted') {
        // Texte atténué: gris moyen
        newL = 50;
    } else if (type === 'border') {
        // Bordures: léger gris
        newL = 85;
    } else if (type === 'bg') {
        // Background: très clair
        newL = 97;
    } else if (type === 'surface') {
        // Surface: clair mais distinguable du bg
        newL = 93;
    }

    return hslToHex(hsl.h, hsl.s, newL);
};

// Adapter une couleur pour le dark mode (défaut)
const adaptColorForDark = (hex, type = 'normal') => {
    const hsl = hexToHsl(hex);
    if (!hsl) return hex;

    let newL;

    if (type === 'brand') {
        // Couleurs de marque: Garder vivant en dark mode
        newL = 65; // Lumineux et visible
    } else if (type === 'text') {
        // Texte: très clair en dark mode
        newL = 95;
    } else if (type === 'textMuted') {
        // Texte atténué: gris clair
        newL = 70;
    } else if (type === 'border') {
        // Bordures: gris foncé
        newL = 25;
    } else if (type === 'bg') {
        // Background: très sombre
        newL = 10;
    } else if (type === 'surface') {
        // Surface: sombre mais différent du bg
        newL = 16;
    }

    return hslToHex(hsl.h, hsl.s, newL);
};

// Main function: adapter une palette au thème
export const adaptPaletteToTheme = (basePalette, theme) => {
    if (!basePalette) return null;

    const adaptColor = theme === 'dark' ? adaptColorForDark : adaptColorForLight;

    return {
        bg: adaptColor(basePalette.bg || '#1a1a1a', 'bg'),
        surface: adaptColor(basePalette.surface || '#2a2a2a', 'surface'),
        text: adaptColor(basePalette.text || '#ffffff', 'text'),
        textMuted: adaptColor(basePalette.textMuted || '#a0a0a0', 'textMuted'),
        border: adaptColor(basePalette.border || '#3a3a3a', 'border'),
        primary: adaptColor(basePalette.primary || '#ff6b6b', 'brand'),
        accent: adaptColor(basePalette.accent || '#ff6b6b', 'brand')
    };
};

// Backward compatibility (kept for old code)
export const generateOppositePalette = (palette) => {
    return adaptPaletteToTheme(palette, 'light');
};
