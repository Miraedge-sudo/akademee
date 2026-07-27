import { useState, useEffect, useCallback } from "react";

/**
 * useNetworkStatus — surveille l'état de la connexion navigateur
 *
 * Retourne :
 *  - isOnline     : booléen — vraie connexion Internet ?
 *  - wasOffline   : booléen — a déjà été hors ligne depuis le montage ?
 *  - lastOnlineAt : Date    — dernière fois qu'on était en ligne
 *  - retry        : () => void — force un rechargement
 */
export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState(
    navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
    };
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  return { isOnline, wasOffline, lastOnlineAt, retry };
}
