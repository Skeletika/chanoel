import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { generateOppositePalette } from '../lib/colors';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Default Dark Palette (Reference)
const DEFAULT_DARK_PALETTE = {
    bg: '#1a1a1a',
    surface: '#2a2a2a',
    text: '#ffffff',
    textMuted: '#a0a0a0',
    primary: '#ff6b6b',
    accent: '#ff6b6b',
    border: '#3a3a3a'
};

export const ThemeProvider = ({ children }) => {
    // 1. Theme Mode (Dark/Light)
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    // 2. Reference Palette (From DB)
    const [referencePalette, setReferencePalette] = useState(null);

    // 2b. Override Palette (For temporary previews in SettingsModal)
    const [overridePalette, setOverridePalette] = useState(null);

    // 3. Toggle Function
    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    };

    // 4. Compute Active Colors based on Theme & Reference/Override
    const activeColors = useMemo(() => {
        // Priority: Override > Reference > Default
        const basePalette = overridePalette || referencePalette || DEFAULT_DARK_PALETTE;

        if (theme === 'dark') {
            return basePalette;
        } else {
            // Light Mode: Generate opposite palette from the base
            return generateOppositePalette(basePalette);
        }
    }, [theme, referencePalette, overridePalette]);

    // 5. Apply CSS Variables
    useEffect(() => {
        const root = document.documentElement;

        // Set Data Attribute
        root.setAttribute('data-theme', theme);

        // Apply Variables
        if (activeColors) {
            Object.entries(activeColors).forEach(([key, value]) => {
                // Remove existing manually set properties to ensure clean state if needed
                // But setProperty overwrites, so it's fine.
                // Key format: 'textMuted' -> '--color-text-muted'
                const cssVar = `--color-${key.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`;
                root.style.setProperty(cssVar, value);
            });
        }
    }, [theme, activeColors]);

    // 6. Helpers
    const getReferenceColors = () => referencePalette || DEFAULT_DARK_PALETTE;

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            setReferencePalette,
            setOverridePalette,
            getReferenceColors
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
