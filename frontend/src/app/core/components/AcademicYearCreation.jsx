import { useState } from 'react';
import { useEducationalSystems } from '../context/EducationalSystemContext';

const SYSTEM_PERIODS = {
  anglo_general: [
    { name: 'Term 1', type: 'term', sortOrder: 1 },
    { name: 'Term 2', type: 'term', sortOrder: 2 },
    { name: 'Term 3', type: 'term', sortOrder: 3 }
  ],
  anglo_tech: [
    { name: 'Term 1', type: 'term', sortOrder: 1 },
    { name: 'Term 2', type: 'term', sortOrder: 2 },
    { name: 'Term 3', type: 'term', sortOrder: 3 }
  ],
  franco_general: [
    { name: 'Semestre 1', type: 'semester', sortOrder: 1 },
    { name: 'Semestre 2', type: 'semester', sortOrder: 2 }
  ],
  franco_tech: [
    { name: 'Semestre 1', type: 'semester', sortOrder: 1 },
    { name: 'Semestre 2', type: 'semester', sortOrder: 2 }
  ],
  university: [
    { name: 'Semestre 1', type: 'semester', sortOrder: 1 },
    { name: 'Semestre 2', type: 'semester', sortOrder: 2 }
  ]
};

const SYSTEM_NAMES = {
  anglo_general: 'Anglophone Général',
  anglo_tech: 'Anglophone Technique',
  franco_general: 'Francophone Général',
  franco_tech: 'Francophone Technique',
  university: 'Université LMD'
};

export default function AcademicYearCreation({ onCancel, onSuccess }) {
  const { selectedSystems } = useEducationalSystems();
  
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedYearSystems, setSelectedYearSystems] = useState([]);
  const [autoGeneratePeriods, setAutoGeneratePeriods] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSystem = (systemId) => {
    setSelectedYearSystems(prev =>
      prev.includes(systemId)
        ? prev.filter(s => s !== systemId)
        : [...prev, systemId]
    );
  };

  const getGeneratedPeriods = () => {
    if (!autoGeneratePeriods) return [];
    
    const periods = [];
    selectedYearSystems.forEach(systemId => {
      const systemPeriods = SYSTEM_PERIODS[systemId] || [];
      systemPeriods.forEach(period => {
        periods.push({
          ...period,
          educationalSystem: systemId
        });
      });
    });
    
    return periods.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!yearName || !startDate || !endDate) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedYearSystems.length === 0) {
      setError('Veuillez sélectionner au moins un système éducatif');
      return;
    }

    setLoading(true);

    try {
      const academicYearData = {
        name: yearName,
        startDate,
        endDate,
        educationalSystems: selectedYearSystems
      };

      const periods = autoGeneratePeriods ? getGeneratedPeriods() : [];

      // Appel API backend (à implémenter)
      // const response = await createAcademicYear(academicYearData, periods);
      
      console.log('Academic Year Data:', academicYearData);
      console.log('Generated Periods:', periods);

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Créer une Année Académique</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Informations de Base</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'année *
              </label>
              <input
                type="text"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                placeholder="Ex: 2024-2025"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sélection des systèmes */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Systèmes Éducatifs</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez les systèmes éducatifs pour cette année académique
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedSystems.map((systemId) => {
              const isSelected = selectedYearSystems.includes(systemId);
              return (
                <button
                  key={systemId}
                  type="button"
                  onClick={() => toggleSystem(systemId)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{SYSTEM_NAMES[systemId]}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSystem(systemId)}
                      className="w-5 h-5"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Périodes automatiques */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Périodes</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoGeneratePeriods}
                onChange={(e) => setAutoGeneratePeriods(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm">Générer automatiquement</span>
            </label>
          </div>

          {autoGeneratePeriods && selectedYearSystems.length > 0 ? (
            <div className="space-y-3">
              {selectedYearSystems.map((systemId) => (
                <div key={systemId} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{SYSTEM_NAMES[systemId]}</h3>
                  <div className="flex flex-wrap gap-2">
                    {SYSTEM_PERIODS[systemId]?.map((period) => (
                      <span
                        key={period.name}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {period.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {autoGeneratePeriods
                ? 'Sélectionnez des systèmes pour voir les périodes générées'
                : 'Vous pourrez ajouter des périodes manuellement après la création'}
          </p>
        )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer l\'année académique'}
          </button>
        </div>
      </form>
    </div>
  );
}
