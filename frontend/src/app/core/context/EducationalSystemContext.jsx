import { createContext, useContext, useState, useEffect } from "react";

const EducationalSystemContext = createContext();

export const EducationalSystemProvider = ({ children }) => {
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [schoolConfig, setSchoolConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger la configuration de l'école au montage
  useEffect(() => {
    const fetchSchoolConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/school");
        if (!response.ok) throw new Error("Failed to fetch school config");
        const data = await response.json();
        setSelectedSystems(data.educationalSystems || []);
        setSchoolConfig(data.systemConfigurations || {});
      } catch (err) {
        setError(err.message);
        console.error("Error loading school config:", err);
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

      // Mettre à jour le JSON server
      const response = await fetch("http://localhost:3000/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ educationalSystems: systems }),
      });

      if (!response.ok) throw new Error("Failed to update systems");

      const data = await response.json();
      setSchoolConfig(data.systemConfigurations || {});
    } catch (err) {
      console.error("Error updating systems:", err);
      setError(err.message);
    }
  };

  // Mettre à jour la configuration d'un système spécifique
  const updateSystemConfig = async (systemId, config) => {
    try {
      const updatedConfig = {
        ...schoolConfig,
        [systemId]: {
          ...schoolConfig[systemId],
          ...config,
          isCustomized: true,
          customizedAt: new Date().toISOString(),
        },
      };

      setSchoolConfig(updatedConfig);

      const response = await fetch("http://localhost:3000/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemConfigurations: updatedConfig }),
      });

      if (!response.ok) throw new Error("Failed to update system config");
    } catch (err) {
      console.error("Error updating system config:", err);
      setError(err.message);
    }
  };

  // Réinitialiser un système à sa configuration par défaut
  const resetSystemToDefault = async (systemId) => {
    try {
      // Récupérer la config par défaut
      const response = await fetch(
        `http://localhost:3000/educationalSystems/${systemId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch default config");
      const systemData = await response.json();

      const defaultConfig = systemData.defaultConfig;

      const updatedConfig = {
        ...schoolConfig,
        [systemId]: {
          ...defaultConfig,
          isCustomized: false,
        },
      };

      setSchoolConfig(updatedConfig);

      const patchResponse = await fetch("http://localhost:3000/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemConfigurations: updatedConfig }),
      });

      if (!patchResponse.ok) throw new Error("Failed to reset system config");
    } catch (err) {
      console.error("Error resetting system config:", err);
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
