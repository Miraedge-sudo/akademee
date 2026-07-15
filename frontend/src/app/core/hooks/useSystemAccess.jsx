import { useEducationalSystems } from '../context/EducationalSystemContext';

export const useSystemAccess = () => {
  const { selectedSystems, schoolConfig } = useEducationalSystems();

  const hasSystem = (system) => {
    return selectedSystems.includes(system);
  };

  const hasAnySystem = (systems) => {
    return systems.some(sys => hasSystem(sys));
  };

  const hasAllSystems = (systems) => {
    return systems.every(sys => hasSystem(sys));
  };

  const getConfig = (system) => {
    return schoolConfig?.[system] || null;
  };

  const getAvailableLevels = () => {
    return selectedSystems.flatMap(sys => 
      getConfig(sys)?.levels || []
    );
  };

  const getAvailableSeries = () => {
    return selectedSystems.flatMap(sys => 
      getConfig(sys)?.series || []
    );
  };

  const getAvailableFilieres = () => {
    return selectedSystems.flatMap(sys => 
      getConfig(sys)?.filieres || []
    );
  };

  const getAvailableStreams = () => {
    return selectedSystems.flatMap(sys => 
      getConfig(sys)?.streams || []
    );
  };

  const getAvailableSubjectTypes = () => {
    return selectedSystems.flatMap(sys => 
      getConfig(sys)?.subjectTypes || []
    );
  };

  const getAvailableUETypes = () => {
    return selectedSystems.flatMap(sys => 
      getConfig(sys)?.ueTypes || []
    );
  };

  const getCoefficientRange = (system) => {
    return getConfig(system)?.coefficientRange || { min: 1, max: 10 };
  };

  const getECTSRange = () => {
    return getConfig('university')?.ectsRange || { min: 1, max: 6 };
  };

  const hasPracticalEvaluations = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.hasPractical === true
    );
  };

  const hasSeparatePracticalGrades = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.separatePracticalGrades === true
    );
  };

  const hasSequences = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.sequences === true
    );
  };

  const hasCA = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.ca === true
    );
  };

  const hasComposition = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.hasComposition === true
    );
  };

  const hasCC = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.hasCC === true
    );
  };

  const hasInternships = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.hasInternships === true
    );
  };

  const isCreditsBased = () => {
    return selectedSystems.some(sys => 
      getConfig(sys)?.evaluationStructure?.creditsBased === true
    );
  };

  const getExamTypes = () => {
    return selectedSystems.flatMap(sys => 
      getConfig(sys)?.examTypes || []
    );
  };

  const getPeriodStructure = () => {
    const structures = selectedSystems.map(sys => {
      const config = getConfig(sys);
      if (!config) return null;
      
      if (config.evaluationStructure?.terms) {
        return {
          system: sys,
          type: 'terms',
          count: config.evaluationStructure.terms,
          sequencesPerTerm: config.evaluationStructure.sequencesPerTerm
        };
      }
      
      if (config.evaluationStructure?.semesters) {
        return {
          system: sys,
          type: 'semesters',
          count: config.evaluationStructure.semesters,
          caPerSemester: config.evaluationStructure.caPerSemester
        };
      }
      
      return null;
    }).filter(Boolean);
    
    return structures;
  };

  return {
    selectedSystems,
    hasSystem,
    hasAnySystem,
    hasAllSystems,
    getConfig,
    getAvailableLevels,
    getAvailableSeries,
    getAvailableFilieres,
    getAvailableStreams,
    getAvailableSubjectTypes,
    getAvailableUETypes,
    getCoefficientRange,
    getECTSRange,
    hasPracticalEvaluations,
    hasSeparatePracticalGrades,
    hasSequences,
    hasCA,
    hasComposition,
    hasCC,
    hasInternships,
    isCreditsBased,
    getExamTypes,
    getPeriodStructure
  };
};
