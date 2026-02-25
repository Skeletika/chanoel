import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import usePWAInstall from '../../hooks/usePWAInstall';

// ─────────────────────────────────────────────────────────
//  CONTEXTE — permet à n'importe quelle page d'ouvrir le modal
// ─────────────────────────────────────────────────────────

const IOSTutorialContext = createContext(null);

/**
 * Hook permettant aux composants enfants d'ouvrir le tutoriel iOS.
 * Usage : const { openIOSTutorial } = useIOSTutorial();
 */
export const useIOSTutorial = () => {
    const ctx = useContext(IOSTutorialContext);
    if (!ctx) throw new Error('useIOSTutorial doit être utilisé dans IOSTutorialModal');
    return ctx;
};

// Clé sessionStorage : empêche le re-affichage automatique dans la même session
const SHOWN_KEY = 'pwa_ios_tutorial_shown';

// ─────────────────────────────────────────────────────────
//  COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────

/**
 * IOSTutorialModal
 *
 * Modal d'aide à l'ajout à l'écran d'accueil, spécifique à iOS Safari.
 * iOS ne fournit aucune API native — on guide l'utilisateur visuellement.
 *
 * Ce composant expose également un contexte `IOSTutorialContext`
 * pour permettre à Login, Onboarding et Dashboard de rouvrir le modal
 * via le hook `useIOSTutorial()`.
 *
 * Comportement automatique :
 * - Uniquement sur iOS Safari (détection User-Agent)
 * - Seulement si l'app n'est PAS déjà installée
 * - Délai de 3s, une seule fois par session (sessionStorage)
 *
 * Comportement manuel :
 * - N'importe quelle page peut appeler openIOSTutorial()
 */
const IOSTutorialModal = ({ children }) => {
    const { isIOS, isAlreadyInstalled } = usePWAInstall();
    const [visible, setVisible] = useState(false);

    // ── Affichage automatique au chargement (une seule fois par session) ──
    useEffect(() => {
        const alreadyShown = sessionStorage.getItem(SHOWN_KEY) === 'true';

        if (isIOS && !isAlreadyInstalled && !alreadyShown) {
            const timer = setTimeout(() => {
                setVisible(true);
                sessionStorage.setItem(SHOWN_KEY, 'true');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isIOS, isAlreadyInstalled]);

    /**
     * Ouvre le modal manuellement depuis n'importe quelle page.
     * Ignore la condition sessionStorage (l'utilisateur a demandé explicitement).
     * Ne s'ouvre que sur iOS et si l'app n'est pas installée.
     */
    const openIOSTutorial = useCallback(() => {
        if (isIOS && !isAlreadyInstalled) {
            setVisible(true);
        }
    }, [isIOS, isAlreadyInstalled]);

    /** Ferme le modal */
    const handleClose = () => setVisible(false);

    return (
        <IOSTutorialContext.Provider value={{ openIOSTutorial, isIOS, isAlreadyInstalled }}>
            {/* Contenu de l'app (slots enfants, utilisé dans App.jsx) */}
            {children}

            {/* ── Modal iOS ── */}
            {visible && (
                <>
                    {/* Fond assombri cliquable */}
                    <div
                        className="pwa-ios-backdrop"
                        onClick={handleClose}
                        aria-hidden="true"
                    />

                    {/* Modal centré */}
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
                                        {/* Icône Partager iOS */}
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

                        {/* Flèche animée pointant vers la barre Safari en bas */}
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
            )}
        </IOSTutorialContext.Provider>
    );
};

export default IOSTutorialModal;
