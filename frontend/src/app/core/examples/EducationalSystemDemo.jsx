import { useState } from "react";
import {
  EducationalSystemProvider,
  useEducationalSystems,
} from "../context/EducationalSystemContext";
import { useSystemAccess } from "../hooks/useSystemAccess";
import SystemGate from "../components/SystemGate";
import SystemConfigPage from "../components/SystemConfigPage";

// Exemple 1: Page de sélection des systèmes éducatifs
const SystemSelectionPage = () => {
  const { selectedSystems, updateSelectedSystems } = useEducationalSystems();
  const { loading } = useEducationalSystems();

  const availableSystems = [
    {
      id: "anglo_general",
      name: "Anglophone Général",
      description: "GCE O/A Level",
    },
    {
      id: "anglo_tech",
      name: "Anglophone Technique",
      description: "GCE Technical",
    },
    {
      id: "franco_general",
      name: "Francophone Général",
      description: "BEPC, Probatoire, Bac",
    },
    {
      id: "franco_tech",
      name: "Francophone Technique",
      description: "CAP, BEP, Bac Tech",
    },
    {
      id: "university",
      name: "Université LMD",
      description: "Licence-Master-Doctorat",
    },
  ];

  const handleToggleSystem = async (systemId) => {
    const newSystems = selectedSystems.includes(systemId)
      ? selectedSystems.filter((s) => s !== systemId)
      : [...selectedSystems, systemId];

    await updateSelectedSystems(newSystems);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Sélection des Systèmes Éducatifs
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableSystems.map((system) => (
          <div
            key={system.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedSystems.includes(system.id)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => handleToggleSystem(system.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{system.name}</h3>
              <input
                type="checkbox"
                checked={selectedSystems.includes(system.id)}
                onChange={() => handleToggleSystem(system.id)}
                className="w-5 h-5"
              />
            </div>
            <p className="text-sm text-gray-600">{system.description}</p>
          </div>
        ))}
      </div>

      {selectedSystems.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Veuillez sélectionner au moins un système éducatif
          </p>
        </div>
      )}
    </div>
  );
};

// Exemple 2: Page de gestion académique avec affichage conditionnel
const AcademicManagementPage = () => {
  const {
    hasSystem,
    getAvailableLevels,
    getAvailableSeries,
    hasPracticalEvaluations,
    hasSequences,
    hasCA,
  } = useSystemAccess();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestion Académique</h1>

      {/* Section visible pour tous les systèmes */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Niveaux Disponibles</h2>
        <div className="flex flex-wrap gap-2">
          {getAvailableLevels().map((level) => (
            <span
              key={level}
              className="bg-blue-100 px-3 py-1 rounded-full text-sm"
            >
              {level}
            </span>
          ))}
        </div>
      </div>

      {/* Section visible seulement pour Francophone Général */}
      <SystemGate allowedSystems={["franco_general"]}>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Séries Francophones</h2>
          <div className="flex flex-wrap gap-2">
            {getAvailableSeries().map((series) => (
              <span
                key={series}
                className="bg-green-100 px-3 py-1 rounded-full text-sm"
              >
                {series}
              </span>
            ))}
          </div>
        </div>
      </SystemGate>

      {/* Section visible seulement pour systèmes techniques */}
      <SystemGate
        allowedSystems={["anglo_tech", "franco_tech"]}
        fallback={
          <div className="p-4 text-gray-500">
            Module non disponible pour votre système
          </div>
        }
      >
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Évaluations Pratiques</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={hasPracticalEvaluations()}
              />
              <span>Activer les évaluations pratiques</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Notes théorie/pratique séparées</span>
            </label>
          </div>
        </div>
      </SystemGate>

      {/* Section visible seulement pour Anglophone */}
      <SystemGate allowedSystems={["anglo_general", "anglo_tech"]}>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Séquences (Anglophone)</h2>
          <p className="text-sm text-gray-600">
            {hasSequences()
              ? "Système avec séquences activées (2 séquences par term)"
              : "Séquences non activées"}
          </p>
        </div>
      </SystemGate>

      {/* Section visible seulement pour Francophone */}
      <SystemGate allowedSystems={["franco_general", "franco_tech"]}>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Contrôles Continus (Francophone)
          </h2>
          <p className="text-sm text-gray-600">
            {hasCA()
              ? "Système avec CA activés (2 CA par semestre)"
              : "CA non activés"}
          </p>
        </div>
      </SystemGate>

      {/* Section visible seulement pour Université */}
      <SystemGate allowedSystems={["university"]}>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Système LMD</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Crédits ECTS</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>TP/TD séparés</span>
            </label>
          </div>
        </div>
      </SystemGate>
    </div>
  );
};

// Exemple 3: Page de configuration par système
const SystemConfigurationPage = () => {
  const { selectedSystems } = useEducationalSystems();

  const systemNames = {
    anglo_general: "Anglophone Général",
    anglo_tech: "Anglophone Technique",
    franco_general: "Francophone Général",
    franco_tech: "Francophone Technique",
    university: "Université LMD",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuration des Systèmes</h1>

      {selectedSystems.length === 0 ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Veuillez d'abord sélectionner des systèmes éducatifs
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {selectedSystems.map((systemId) => (
            <SystemConfigPage
              key={systemId}
              systemId={systemId}
              systemName={systemNames[systemId]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Composant principal de démo
const EducationalSystemDemo = () => {
  const [activeTab, setActiveTab] = useState("selection");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("selection")}
              className={`px-4 py-2 ${activeTab === "selection" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
            >
              Sélection Systèmes
            </button>
            <button
              onClick={() => setActiveTab("management")}
              className={`px-4 py-2 ${activeTab === "management" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
            >
              Gestion Académique
            </button>
            <button
              onClick={() => setActiveTab("configuration")}
              className={`px-4 py-2 ${activeTab === "configuration" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
            >
              Configuration
            </button>
          </div>
        </div>
      </nav>

      <div className="py-8">
        {activeTab === "selection" && <SystemSelectionPage />}
        {activeTab === "management" && <AcademicManagementPage />}
        {activeTab === "configuration" && <SystemConfigurationPage />}
      </div>
    </div>
  );
};

// Wrapper avec le provider
const EducationalSystemDemoWrapper = () => {
  return (
    <EducationalSystemProvider>
      <EducationalSystemDemo />
    </EducationalSystemProvider>
  );
};

export default EducationalSystemDemoWrapper;
