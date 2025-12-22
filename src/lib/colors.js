/**
 * Utility functions for color manipulation
 */

// Convert Hex to HSL
export const hexToHsl = (hex) => {
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

// Main Inversion Function
// Assumes input color is from the DARK theme palette
export const getOppositeColor = (hex, type = 'bg') => {
    const hsl = hexToHsl(hex);
    if (!hsl) return hex;

    let newL;

    // Logic specifically for inverting DARK -> LIGHT
    if (type === 'bg' || type === 'surface') {
        // If it's a dark background (low L), we want a light background (high L)
        // L: 10 -> 95, L: 20 -> 90
        newL = 100 - (hsl.l * 0.9); // Simple linear inversion usually works well
        if (newL < 80) newL = 96; // Force it to be light enough for a background
    } else if (type === 'text') {
        // If it's light text (high L), we want dark text (low L)
        newL = 100 - hsl.l;
        if (newL > 30) newL = 15; // Force it to be dark enough for readability
    } else if (type === 'border') {
         newL = 100 - hsl.l;
         // Borders need to be visible but subtle
         if (newL > 85) newL = 85; 
         if (newL < 15) newL = 30;
    } else {
        // Primary, Accent, etc.
        // We often want to keep the same 'vibe' but readable on light.
        // Usually just inverting lightness isn't enough, we might want to keep it somewhat saturated.
        // Let's try simple inversion first, but clamped.
        newL = 60; // Standard vivid color lightness
        // Actually, let's just keep the hue and set a standard lightness for Light Mode colors?
        // Or invert relative to 50%?
        // Let's try: 100 - L
        newL = 100 - hsl.l;
    }

    return hslToHex(hsl.h, hsl.s, newL);
};

export const generateOppositePalette = (palette) => {
    if (!palette) return null;
    return {
        bg: getOppositeColor(palette.bg, 'bg'),
        surface: getOppositeColor(palette.surface, 'surface'),
        text: getOppositeColor(palette.text, 'text'),
        textMuted: getOppositeColor(palette.textMuted, 'text'), // Treat muted as text
        border: getOppositeColor(palette.border, 'border'),
        primary: getOppositeColor(palette.primary, 'brand'),
        accent: getOppositeColor(palette.accent, 'brand')
    };
};
