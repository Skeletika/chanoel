import React, { useState, useEffect } from 'react';
import usePWAInstall from '../../hooks/usePWAInstall';

// Clé sessionStorage : empêche le re-affichage dans la même session
const SHOWN_KEY = 'pwa_ios_tutorial_shown';

/**
 * IOSTutorialModal
 *
 * Modal d'aide à l'ajout à l'écran d'accueil, spécifique à iOS Safari.
 * iOS ne fournit aucune API native pour déclencher une installation PWA.
 * On guide donc l'utilisateur manuellement avec des instructions visuelles.
 *
 * Comportement :
 * - Affiché uniquement sur iOS Safari (détecté via User-Agent)
 * - Seulement si l'app n'est PAS déjà installée (mode standalone)
 * - Apparaît une seule fois par session (sessionStorage)
 * - Délai de 3 secondes pour ne pas être intrusif
 * - Flèche animée pointant vers le bas vers le bouton Partager natif d'iOS
 */
const IOSTutorialModal = () => {
    const { isIOS, isAlreadyInstalled } = usePWAInstall();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Si ce n'est pas iOS, ou si déjà installé, ou si déjà affiché cette session → rien
        const alreadyShown = sessionStorage.getItem(SHOWN_KEY) === 'true';

        if (isIOS && !isAlreadyInstalled && !alreadyShown) {
            // Délai de 3 secondes pour laisser la page charger et ne pas être intrusif
            const timer = setTimeout(() => {
                setVisible(true);
                sessionStorage.setItem(SHOWN_KEY, 'true');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isIOS, isAlreadyInstalled]);

    /** Ferme le modal */
    const handleClose = () => setVisible(false);

    if (!visible) return null;

    return (
        <>
            {/* Fond assombri (backdrop) */}
            <div
                className="pwa-ios-backdrop"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal principal */}
            <div
                className="pwa-ios-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ios-tutorial-title"
            >
                {/* En-tête */}
                <div className="pwa-ios-modal-header">
                    <img src="/icon-512.png" alt="Ideal" width="52" height="52" className="pwa-ios-icon" />
                    <h2 id="ios-tutorial-title" className="pwa-ios-title">
                        Installer Ideal
                    </h2>
                    <p className="pwa-ios-subtitle">
                        Ajoute l&apos;app à ton écran d&apos;accueil pour un accès rapide
                    </p>
                </div>

                {/* Étapes du tutoriel */}
                <ol className="pwa-ios-steps">
                    <li className="pwa-ios-step">
                        <span className="pwa-ios-step-num">1</span>
                        <div className="pwa-ios-step-content">
                            <span className="pwa-ios-step-icon" aria-hidden="true">
                                {/* Icône Partager iOS (rectangle avec flèche vers le haut) */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                            </span>
                            <span>Appuie sur <strong>Partager</strong> dans Safari</span>
                        </div>
                    </li>

                    <li className="pwa-ios-step">
                        <span className="pwa-ios-step-num">2</span>
                        <div className="pwa-ios-step-content">
                            <span className="pwa-ios-step-icon" aria-hidden="true">
                                {/* Icône + dans un carré */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="3" />
                                    <line x1="12" y1="8" x2="12" y2="16" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                            </span>
                            <span>Sélectionne <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong></span>
                        </div>
                    </li>

                    <li className="pwa-ios-step">
                        <span className="pwa-ios-step-num">3</span>
                        <div className="pwa-ios-step-content">
                            <span className="pwa-ios-step-icon" aria-hidden="true">✓</span>
                            <span>Appuie sur <strong>Ajouter</strong> en haut à droite</span>
                        </div>
                    </li>
                </ol>

                {/* Flèche animée pointant vers la barre Safari */}
                <div className="pwa-ios-arrow-container" aria-hidden="true">
                    <div className="pwa-ios-arrow">↓</div>
                    <p className="pwa-ios-arrow-label">Bouton Partager en bas de Safari</p>
                </div>

                {/* Bouton de fermeture */}
                <button
                    className="pwa-ios-btn-close"
                    onClick={handleClose}
                    aria-label="Fermer les instructions d'installation"
                >
                    Compris !
                </button>
            </div>
        </>
    );
};

export default IOSTutorialModal;
