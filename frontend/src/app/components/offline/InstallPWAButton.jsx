import { useState, useEffect } from "react";
import {
  FiDownload as Download,
  FiSmartphone as Smartphone,
  FiX as X,
} from "react-icons/fi";

/**
 * InstallPWAButton — Bouton "Installer l'application"
 *
 * Écoute l'événement `beforeinstallprompt` (Chrome, Edge, Samsung)
 * et affiche un bouton pour installer le PWA sur l'écran d'accueil.
 *
 * Affiche aussi un message d'aide pour iOS (Safari) qui ne supporte
 * pas beforeinstallprompt nativement.
 */
export default function InstallPWAButton() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    // ── Détecter si déjà installée (affichage standalone = PWA installée) ──
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // ── beforeinstallprompt (Chrome, Edge, Samsung) ──
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };

    // ── appinstalled (déclenché après installation réussie) ──
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // ── Déclencher l'installation ──
  const handleInstall = async () => {
    if (!installEvent) return;
    try {
      installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === "accepted") {
        setInstalled(true);
        setInstallEvent(null);
      }
    } catch (err) {
      console.warn("[PWA] Install prompt failed:", err);
    }
  };

  // ── Déjà installée → rien à afficher ──
  if (installed) return null;

  // ── Détection iOS Safari (pas de beforeinstallprompt) ──
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      {/* Bouton principal — visible si beforeinstallprompt disponible */}
      {installEvent && (
        <button
          onClick={handleInstall}
          className="w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          title="Installer l'application"
        >
          <Download size={18} />
        </button>
      )}

      {/* iOS: bouton alternatif + popup d'aide */}
      {isIOS && !installEvent && (
        <>
          <button
            onClick={() => setShowIOSHelp(true)}
            className="w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            title="Installer sur iPhone/iPad"
          >
            <Smartphone size={18} />
          </button>

          {showIOSHelp && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setShowIOSHelp(false)}
            >
              <div
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-100 dark:border-surface-700 p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Smartphone size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                        Installer sur iPhone/iPad
                      </h3>
                      <p className="text-xs text-surface-400 mt-0.5">
                        Ajoutez Akademee à votre écran d&apos;accueil
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowIOSHelp(false)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <ol className="space-y-3 text-[13px]">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-[11px] font-bold text-surface-500 flex-shrink-0">1</span>
                    <span className="text-surface-600 dark:text-surface-300">
                      Appuyez sur le bouton <strong>Partager</strong> <span className="text-lg">⎙</span> en bas du navigateur Safari
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-[11px] font-bold text-surface-500 flex-shrink-0">2</span>
                    <span className="text-surface-600 dark:text-surface-300">
                      Faites défiler et appuyez sur <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-[11px] font-bold text-surface-500 flex-shrink-0">3</span>
                    <span className="text-surface-600 dark:text-surface-300">
                      Appuyez sur <strong>&quot;Ajouter&quot;</strong> en haut à droite
                    </span>
                  </li>
                </ol>

                <div className="mt-5 pt-4 border-t border-surface-100 dark:border-surface-700">
                  <p className="text-xs text-surface-400 leading-relaxed">
                    Une fois installée, l&apos;application s&apos;ouvrira en plein écran sans barre de navigation,
                    comme une application native.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
