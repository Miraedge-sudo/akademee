import { createContext, useContext, useState, useEffect } from "react";
import api, { getAccessToken } from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

const EducationalSystemContext = createContext();

export const EducationalSystemProvider = ({ children }) => {
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [schoolConfig, setSchoolConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger la configuration de l'école depuis le backend
  useEffect(() => {
    const fetchSchoolConfig = async () => {
      // Si l'utilisateur n'est pas authentifié (pas de token), on saute l'appel API
      // pour éviter que l'intercepteur axios 401 nous redirige vers /login
      if (!getAccessToken()) {
        setSchoolConfig({});
        setSelectedSystems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(API_ENDPOINTS.SCHOOLS.ONBOARDING);
        const data = response.data?.data || {};
        setSelectedSystems(data.educationalSystems || []);
        setSchoolConfig(data.systemConfigurations || {});
      } catch (err) {
        console.warn("EducationalSystem: could not load config from backend");
        setSchoolConfig({});
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolConfig();
  }, []);

  // Mettre à jour les systèmes sélectionnés
  const updateSelectedSystems = async (systems) => {
    try {
      setSelectedSystems(systems);

      const response = await api.put(API_ENDPOINTS.SCHOOLS.ONBOARDING, {
        educationalSystems: systems,
      });

      const data = response.data?.data || {};
      setSchoolConfig(data.systemConfigurations || {});
    } catch (err) {
      console.warn("EducationalSystem: could not update systems on backend");
      setError(err.message);
    }
  };

  // Mettre à jour la configuration d'un système spécifique
  const updateSystemConfig = async (systemId, config) => {
    try {
      const updatedConfig = {
        ...schoolConfig,
        [systemId]: {
          ...schoolConfig?.[systemId],
          ...config,
          isCustomized: true,
          customizedAt: new Date().toISOString(),
        },
      };

      setSchoolConfig(updatedConfig);

      await api.put(API_ENDPOINTS.SCHOOLS.ONBOARDING, {
        systemConfigurations: updatedConfig,
      });
    } catch (err) {
      console.warn("EducationalSystem: could not update system config on backend");
      setError(err.message);
    }
  };

  // Réinitialiser un système à sa configuration par défaut
  const resetSystemToDefault = async (systemId) => {
    try {
      if (!schoolConfig?.[systemId]) {
        console.warn("No existing config to reset for", systemId);
        return;
      }

      const updatedConfig = {
        ...schoolConfig,
        [systemId]: {
          isCustomized: false,
        },
      };

      setSchoolConfig(updatedConfig);

      await api.put(API_ENDPOINTS.SCHOOLS.ONBOARDING, {
        systemConfigurations: updatedConfig,
      });
    } catch (err) {
      console.warn("EducationalSystem: could not reset system config on backend");
      setError(err.message);
    }
  };

  const value = {
    selectedSystems,
    schoolConfig,
    loading,
    error,
    updateSelectedSystems,
    updateSystemConfig,
    resetSystemToDefault,
    systemsInitialized: !loading && schoolConfig !== null,
  };

  return (
    <EducationalSystemContext.Provider value={value}>
      {children}
    </EducationalSystemContext.Provider>
  );
};

export const useEducationalSystems = () => {
  const context = useContext(EducationalSystemContext);
  if (!context) {
    throw new Error(
      "useEducationalSystems must be used within EducationalSystemProvider",
    );
  }
  return context;
};
