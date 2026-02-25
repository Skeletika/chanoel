import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────
//  UTILITAIRES DE DÉTECTION D'ENVIRONNEMENT
// ─────────────────────────────────────────────────────────

/**
 * Détecte si l'utilisateur est sur un appareil Android.
 * On vérifie l'User-Agent en excluant Windows Phone.
 */
const detectAndroid = () => {
  const ua = navigator.userAgent || '';
  return /android/i.test(ua) && !/windows phone/i.test(ua);
};

/**
 * Détecte si l'utilisateur est sur iOS (iPhone/iPad/iPod)
 * ET sur Safari (seul navigateur iOS permettant l'ajout à l'écran d'accueil).
 * Chrome iOS (CriOS) ne supporte pas cette fonctionnalité.
 */
const detectIOS = () => {
  const ua = navigator.userAgent || '';
  const isIOSDevice = /iphone|ipad|ipod/i.test(ua);
  const isChromiumOnIOS = /CriOS/i.test(ua) || /FxiOS/i.test(ua);
  return isIOSDevice && !isChromiumOnIOS;
};

/**
 * Détecte si l'app s'exécute déjà en mode standalone (installée).
 * - Standard Web API : display-mode = standalone
 * - Propriété Safari iOS : window.navigator.standalone
 */
const detectStandalone = () => {
  const matchesStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const safariStandalone = window.navigator.standalone === true;
  return matchesStandalone || safariStandalone;
};

// ─────────────────────────────────────────────────────────
//  HOOK PRINCIPAL
// ─────────────────────────────────────────────────────────

/**
 * usePWAInstall
 *
 * Gère l'intégralité de la logique d'installation PWA :
 *  - Détection de la plateforme (Android / iOS / Desktop)
 *  - Détection de l'état d'installation (standalone ou non)
 *  - Capture de l'événement `beforeinstallprompt` (Android/Chrome)
 *  - Écoute de `appinstalled` pour savoir quand l'app a été installée
 *
 * @returns {{
 *   isAndroid: boolean,
 *   isIOS: boolean,
 *   isDesktop: boolean,
 *   isAlreadyInstalled: boolean,
 *   canInstallAndroid: boolean,
 *   showInstallPrompt: () => Promise<void>,
 * }}
 */
const usePWAInstall = () => {
  // ── Détection de la plateforme (stable, calculée une seule fois) ──
  const android = detectAndroid();
  const ios = detectIOS();
  const desktop = !android && !ios;

  // ── État d'installation ──
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(detectStandalone());

  // ── Disponibilité du prompt Android ──
  // `true` uniquement quand l'event beforeinstallprompt a été capturé
  const [canInstallAndroid, setCanInstallAndroid] = useState(false);

  // Référence vers l'event beforeinstallprompt (ne doit pas déclencher de re-render)
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // ── 1. Écoute de beforeinstallprompt (Android/Chrome uniquement) ──
    const handleBeforeInstallPrompt = (event) => {
      // Empêche l'affichage automatique de la mini-info-bar du navigateur
      event.preventDefault();

      // Stocke l'événement pour le déclencher manuellement plus tard
      deferredPromptRef.current = event;
      setCanInstallAndroid(true);

      console.log('[PWA] Event beforeinstallprompt capturé — installation disponible');
    };

    // ── 2. Écoute de appinstalled ──
    const handleAppInstalled = () => {
      // L'utilisateur vient d'installer l'app
      deferredPromptRef.current = null;
      setCanInstallAndroid(false);
      setIsAlreadyInstalled(true);

      console.log('[PWA] App installée avec succès sur l\'écran d\'accueil');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Déclenche manuellement le prompt d'installation natif Android/Chrome.
   * À appeler suite à un geste utilisateur (clic sur bouton).
   */
  const showInstallPrompt = useCallback(async () => {
    const prompt = deferredPromptRef.current;

    if (!prompt) {
      console.warn('[PWA] showInstallPrompt appelé sans prompt disponible');
      return;
    }

    // Affiche le prompt natif du navigateur
    await prompt.prompt();

    // Attend la réponse de l'utilisateur
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] Utilisateur a accepté l\'installation');
    } else {
      console.log('[PWA] Utilisateur a refusé l\'installation');
    }

    // L'event ne peut être utilisé qu'une seule fois — on le réinitialise
    deferredPromptRef.current = null;
    setCanInstallAndroid(false);
  }, []);

  return {
    /** true si l'appareil est Android */
    isAndroid: android,
    /** true si l'appareil est iOS Safari (seul navigateur permettant l'ajout à l'écran d'accueil) */
    isIOS: ios,
    /** true si Desktop (aucune proposition ne doit être affichée) */
    isDesktop: desktop,
    /** true si l'app est déjà installée (mode standalone) */
    isAlreadyInstalled,
    /** true si l'event beforeinstallprompt est disponible (Android uniquement) */
    canInstallAndroid,
    /** Déclenche le prompt natif d'installation Android */
    showInstallPrompt,
  };
};

export default usePWAInstall;
