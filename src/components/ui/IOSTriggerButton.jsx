import React from 'react';
import { useIOSTutorial } from './IOSTutorialModal';

/**
 * IOSTriggerButton
 *
 * Petit texte cliquable qui propose à l'utilisateur iOS de
 * rouvrir le tutoriel d'installation à l'écran d'accueil.
 *
 * Rendu nul automatiquement sur :
 *  - Desktop
 *  - Android
 *  - Si l'app est déjà installée (mode standalone)
 *
 * Usage :
 *   import IOSTriggerButton from '../components/ui/IOSTriggerButton';
 *   <IOSTriggerButton />
 */
const IOSTriggerButton = () => {
    const { openIOSTutorial, isIOS, isAlreadyInstalled } = useIOSTutorial();

    // Ne rien afficher si pas iOS ou déjà installé
    if (!isIOS || isAlreadyInstalled) return null;

    return (
        <button
            className="pwa-ios-trigger"
            onClick={openIOSTutorial}
            aria-label="Afficher le tutoriel d'installation sur l'écran d'accueil"
        >
            <span className="pwa-ios-trigger-icon" aria-hidden="true">📲</span>
            Ajouter à l&apos;écran d&apos;accueil
        </button>
    );
};

export default IOSTriggerButton;
