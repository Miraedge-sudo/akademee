import { useState, useEffect } from 'react';
import { useEducationalSystems } from '../context/EducationalSystemContext';

export const useSystemConfig = (systemId) => {
  const { schoolConfig, updateSystemConfig, resetSystemToDefault } = useEducationalSystems();
  const [defaultConfig, setDefaultConfig] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isCustomized, setIsCustomized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDefaultConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/educationalSystems/${systemId}`);
        if (!response.ok) throw new Error('Failed to fetch default config');
        const data = await response.json();
        setDefaultConfig(data.defaultConfig);
      } catch (err) {
        setError(err.message);
        console.error('Error loading default config:', err);
      } finally {
        setLoading(false);
      }
    };

    if (systemId) {
      fetchDefaultConfig();
    }
  }, [systemId]);

  useEffect(() => {
    const schoolSystemConfig = schoolConfig?.[systemId];
    
    if (schoolSystemConfig) {
      setCurrentConfig(schoolSystemConfig);
      setIsCustomized(schoolSystemConfig.isCustomized || false);
    } else if (defaultConfig) {
      setCurrentConfig(defaultConfig);
      setIsCustomized(false);
    }
  }, [schoolConfig, defaultConfig, systemId]);

  const updateConfig = async (newConfig) => {
    try {
      const updatedConfig = {
        ...currentConfig,
        ...newConfig,
        isCustomized: true,
        customizedAt: new Date().toISOString()
      };
      
      setCurrentConfig(updatedConfig);
      setIsCustomized(true);
      
      await updateSystemConfig(systemId, updatedConfig);
    } catch (err) {
      setError(err.message);
      console.error('Error updating config:', err);
      throw err;
    }
  };

  const resetToDefault = async () => {
    try {
      if (!defaultConfig) return;
      
      setCurrentConfig(defaultConfig);
      setIsCustomized(false);
      
      await resetSystemToDefault(systemId);
    } catch (err) {
      setError(err.message);
      console.error('Error resetting config:', err);
      throw err;
    }
  };

  const updateLevels = async (levels) => {
    await updateConfig({ levels });
  };

  const updateSeries = async (series) => {
    await updateConfig({ series });
  };

  const updateFilieres = async (filieres) => {
    await updateConfig({ filieres });
  };

  const updateStreams = async (streams) => {
    await updateConfig({ streams });
  };

  const updateSubjectTypes = async (subjectTypes) => {
    await updateConfig({ subjectTypes });
  };

  const updateUETypes = async (ueTypes) => {
    await updateConfig({ ueTypes });
  };

  const updateCoefficientRange = async (range) => {
    await updateConfig({ coefficientRange: range });
  };

  const updateECTSRange = async (range) => {
    await updateConfig({ ectsRange: range });
  };

  const updatePeriods = async (periods) => {
    await updateConfig({ periods });
  };

  const updateExamTypes = async (examTypes) => {
    await updateConfig({ examTypes });
  };

  const addLevel = async (level) => {
    const currentLevels = currentConfig?.levels || [];
    if (!currentLevels.includes(level)) {
      await updateLevels([...currentLevels, level]);
    }
  };

  const removeLevel = async (level) => {
    const currentLevels = currentConfig?.levels || [];
    await updateLevels(currentLevels.filter(l => l !== level));
  };

  const addSeries = async (series) => {
    const currentSeries = currentConfig?.series || [];
    if (!currentSeries.includes(series)) {
      await updateSeries([...currentSeries, series]);
    }
  };

  const removeSeries = async (series) => {
    const currentSeries = currentConfig?.series || [];
    await updateSeries(currentSeries.filter(s => s !== series));
  };

  const addFiliere = async (filiere) => {
    const currentFilieres = currentConfig?.filieres || [];
    if (!currentFilieres.includes(filiere)) {
      await updateFilieres([...currentFilieres, filiere]);
    }
  };

  const removeFiliere = async (filiere) => {
    const currentFilieres = currentConfig?.filieres || [];
    await updateFilieres(currentFilieres.filter(f => f !== filiere));
  };

  const getDifferencesFromDefault = () => {
    if (!defaultConfig || !currentConfig) return null;
    
    const differences = {};
    
    const compareArrays = (arr1, arr2) => {
      if (!arr1 || !arr2) return { different: true };
      const added = arr2.filter(x => !arr1.includes(x));
      const removed = arr1.filter(x => !arr2.includes(x));
      return { different: added.length > 0 || removed.length > 0, added, removed };
    };
    
    const compareObjects = (obj1, obj2) => {
      if (!obj1 || !obj2) return { different: true };
      const keys = [...new Set([...Object.keys(obj1), ...Object.keys(obj2)])];
      const changes = {};
      keys.forEach(key => {
        if (obj1[key] !== obj2[key]) {
          changes[key] = { from: obj1[key], to: obj2[key] };
        }
      });
      return { different: Object.keys(changes).length > 0, changes };
    };
    
    if (currentConfig.levels) {
      const diff = compareArrays(defaultConfig.levels, currentConfig.levels);
      if (diff.different) differences.levels = diff;
    }
    
    if (currentConfig.series) {
      const diff = compareArrays(defaultConfig.series, currentConfig.series);
      if (diff.different) differences.series = diff;
    }
    
    if (currentConfig.filieres) {
      const diff = compareArrays(defaultConfig.filieres, currentConfig.filieres);
      if (diff.different) differences.filieres = diff;
    }
    
    if (currentConfig.streams) {
      const diff = compareArrays(defaultConfig.streams, currentConfig.streams);
      if (diff.different) differences.streams = diff;
    }
    
    if (currentConfig.coefficientRange) {
      const diff = compareObjects(defaultConfig.coefficientRange, currentConfig.coefficientRange);
      if (diff.different) differences.coefficientRange = diff;
    }
    
    if (currentConfig.ectsRange) {
      const diff = compareObjects(defaultConfig.ectsRange, currentConfig.ectsRange);
      if (diff.different) differences.ectsRange = diff;
    }
    
    return Object.keys(differences).length > 0 ? differences : null;
  };

  return {
    config: currentConfig,
    defaultConfig,
    isCustomized,
    loading,
    error,
    updateConfig,
    resetToDefault,
    updateLevels,
    updateSeries,
    updateFilieres,
    updateStreams,
    updateSubjectTypes,
    updateUETypes,
    updateCoefficientRange,
    updateECTSRange,
    updatePeriods,
    updateExamTypes,
    addLevel,
    removeLevel,
    addSeries,
    removeSeries,
    addFiliere,
    removeFiliere,
    getDifferencesFromDefault
  };
};
