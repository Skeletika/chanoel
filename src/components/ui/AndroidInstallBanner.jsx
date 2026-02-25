import React, { useState, useEffect } from 'react';
import usePWAInstall from '../../hooks/usePWAInstall';

// Clé sessionStorage : fermeture définitive dans la session en cours
const DISMISSED_KEY = 'pwa_android_banner_dismissed';

/**
 * AndroidInstallBanner
 *
 * Bannière discrète en bas d'écran, visible uniquement sur Android
 * quand l'événement `beforeinstallprompt` est disponible.
 *
 * Comportement :
 * - Apparaît via une animation slide-up depuis le bas
 * - Bouton principal : déclenche le prompt natif d'installation
 * - Bouton ✕ : ferme la bannière pour toute la session (sessionStorage)
 * - Disparaît automatiquement après installation confirmée
 */
const AndroidInstallBanner = () => {
    const { isAndroid, isAlreadyInstalled, canInstallAndroid, showInstallPrompt } = usePWAInstall();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // On vérifie si l'utilisateur a déjà fermé la bannière dans cette session
        const dismissed = sessionStorage.getItem(DISMISSED_KEY) === 'true';

        if (isAndroid && canInstallAndroid && !isAlreadyInstalled && !dismissed) {
            // Petit délai pour ne pas apparaître brutalement au chargement
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [isAndroid, canInstallAndroid, isAlreadyInstalled]);

    /**
     * Gère le clic sur le bouton d'installation.
     * Déclenche le prompt natif Android puis masque la bannière.
     */
    const handleInstall = async () => {
        await showInstallPrompt();
        setVisible(false);
    };

    /**
     * Gère la fermeture manuelle (bouton ✕).
     * Mémorise le choix en sessionStorage pour éviter la répétition.
     */
    const handleDismiss = () => {
        sessionStorage.setItem(DISMISSED_KEY, 'true');
        setVisible(false);
    };

    // Ne rien rendre si les conditions ne sont pas réunies
    if (!visible) return null;

    return (
        <div className="pwa-android-banner" role="alert" aria-live="polite">
            {/* Icône de l'app */}
            <div className="pwa-banner-icon">
                <img src="/icon-512.png" alt="Icône Ideal" width="44" height="44" />
            </div>

            {/* Texte de la bannière */}
            <div className="pwa-banner-content">
                <p className="pwa-banner-title">Installer l&apos;application</p>
                <p className="pwa-banner-subtitle">Accède à Ideal directement depuis ton écran d&apos;accueil</p>
            </div>

            {/* Actions */}
            <div className="pwa-banner-actions">
                <button
                    className="pwa-banner-btn-install"
                    onClick={handleInstall}
                    aria-label="Ajouter Ideal à l'écran d'accueil"
                >
                    Installer
                </button>

                <button
                    className="pwa-banner-btn-close"
                    onClick={handleDismiss}
                    aria-label="Fermer la proposition d'installation"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default AndroidInstallBanner;
