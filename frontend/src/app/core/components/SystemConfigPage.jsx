import { useState } from "react";
import { useSystemConfig } from "../hooks/useSystemConfig";
import SystemGate from "./SystemGate";

const SystemConfigPage = ({ systemId, systemName }) => {
  const {
    config,
    isCustomized,
    loading,
    error,
    addLevel,
    removeLevel,
    addSeries,
    removeSeries,
    addFiliere,
    removeFiliere,
    resetToDefault,
    getDifferencesFromDefault,
  } = useSystemConfig(systemId);

  const [newLevel, setNewLevel] = useState("");
  const [newSeries, setNewSeries] = useState("");
  const [newFiliere, setNewFiliere] = useState("");

  if (loading) {
    return <div className="p-6">Chargement de la configuration...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Erreur: {error}</div>;
  }

  if (!config) {
    return (
      <div className="p-6">Aucune configuration trouvée pour {systemName}</div>
    );
  }

  const differences = getDifferencesFromDefault();

  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (newLevel.trim()) {
      try {
        await addLevel(newLevel.trim());
        setNewLevel("");
      } catch (err) {
        alert("Erreur lors de l'ajout du niveau");
      }
    }
  };

  const handleAddSeries = async (e) => {
    e.preventDefault();
    if (newSeries.trim()) {
      try {
        await addSeries(newSeries.trim());
        setNewSeries("");
      } catch (err) {
        alert("Erreur lors de l'ajout de la série");
      }
    }
  };

  const handleAddFiliere = async (e) => {
    e.preventDefault();
    if (newFiliere.trim()) {
      try {
        await addFiliere(newFiliere.trim());
        setNewFiliere("");
      } catch (err) {
        alert("Erreur lors de l'ajout de la filière");
      }
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir réinitialiser aux valeurs par défaut? Toutes vos personnalisations seront perdues.",
      )
    ) {
      try {
        await resetToDefault();
      } catch (err) {
        alert("Erreur lors de la réinitialisation");
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuration - {systemName}</h1>
        {isCustomized && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Réinitialiser aux valeurs par défaut
          </button>
        )}
      </div>

      {isCustomized && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Configuration personnalisée - Diffère des standards camerounais
              </p>
              {differences && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-yellow-800">
                    Voir les différences
                  </summary>
                  <ul className="mt-2 text-xs text-yellow-600 list-disc list-inside">
                    {differences.levels && (
                      <li>
                        Niveaux: +{differences.levels.added?.join(", ")} / -
                        {differences.levels.removed?.join(", ")}
                      </li>
                    )}
                    {differences.series && (
                      <li>
                        Séries: +{differences.series.added?.join(", ")} / -
                        {differences.series.removed?.join(", ")}
                      </li>
                    )}
                    {differences.filieres && (
                      <li>
                        Filières: +{differences.filieres.added?.join(", ")} / -
                        {differences.filieres.removed?.join(", ")}
                      </li>
                    )}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Niveaux */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Niveaux</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {config.levels?.map((level) => (
            <div
              key={level}
              className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full"
            >
              <span className="text-sm">{level}</span>
              <button
                onClick={() => removeLevel(level)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddLevel} className="flex gap-2">
          <input
            type="text"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
            placeholder="Nouveau niveau..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Ajouter
          </button>
        </form>
      </div>

      {/* Séries (Francophone Général) */}
      <SystemGate allowedSystems={["franco_general"]}>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Séries</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {config.series?.map((series) => (
              <div
                key={series}
                className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full"
              >
                <span className="text-sm">{series}</span>
                <button
                  onClick={() => removeSeries(series)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddSeries} className="flex gap-2">
            <input
              type="text"
              value={newSeries}
              onChange={(e) => setNewSeries(e.target.value)}
              placeholder="Nouvelle série..."
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              + Ajouter
            </button>
          </form>
        </div>
      </SystemGate>

      {/* Filières (Francophone Technique) */}
      <SystemGate allowedSystems={["franco_tech"]}>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filières Techniques</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {config.filieres?.map((filiere) => (
              <div
                key={filiere}
                className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full"
              >
                <span className="text-sm">{filiere}</span>
                <button
                  onClick={() => removeFiliere(filiere)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddFiliere} className="flex gap-2">
            <input
              type="text"
              value={newFiliere}
              onChange={(e) => setNewFiliere(e.target.value)}
              placeholder="Nouvelle filière..."
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              + Ajouter
            </button>
          </form>
        </div>
      </SystemGate>

      {/* Coefficient Range */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Plage de Coefficients</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum
            </label>
            <input
              type="number"
              defaultValue={config.coefficientRange?.min}
              disabled={!isCustomized}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum
            </label>
            <input
              type="number"
              defaultValue={config.coefficientRange?.max}
              disabled={!isCustomized}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Periods */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Périodes</h2>
        <div className="flex flex-wrap gap-2">
          {config.periods?.map((period) => (
            <div key={period} className="bg-gray-100 px-3 py-1 rounded">
              <span className="text-sm">{period}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
