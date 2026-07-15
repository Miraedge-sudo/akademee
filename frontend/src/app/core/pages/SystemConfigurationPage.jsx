import { useState } from 'react';
import { useEducationalSystems } from '../context/EducationalSystemContext';
import SystemConfigPage from '../components/SystemConfigPage';

const SYSTEM_NAMES = {
  anglophone_general: 'Anglophone Général',
  anglophone_technical: 'Anglophone Technique',
  francophone_general: 'Francophone Général',
  francophone_technical: 'Francophone Technique',
  university: 'Université LMD'
};

const SYSTEM_COLORS = {
  anglophone_general: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-500", dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
  anglophone_technical: { bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-500", dot: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300" },
  francophone_general: { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-500", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  francophone_technical: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-500", dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-300" },
  university: { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-500", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
};

export default function SystemConfigurationPage() {
  const { selectedSystems } = useEducationalSystems();
  const [activeSystem, setActiveSystem] = useState(null);

  if (selectedSystems.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Aucun système éducatif sélectionné. Veuillez d'abord sélectionner des systèmes dans les paramètres.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeSystem) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Configuration des Systèmes Éducatifs</h1>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Sélectionnez un système pour modifier sa configuration (niveaux, séries, filières, coefficients, etc.)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedSystems.map((systemId) => {
            const colors = SYSTEM_COLORS[systemId] || { dot: "bg-primary-500", border: "border-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20", text: "text-primary-700 dark:text-primary-300" };
            return (
              <button
                key={systemId}
                onClick={() => setActiveSystem(systemId)}
                className={`relative p-6 bg-white dark:bg-surface-800 border-2 rounded-xl hover:shadow-lg transition-all text-left group ${
                  colors.border.replace('border-', 'hover:border-')
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
                  <h3 className={`font-semibold text-lg ${colors.text}`}>
                    {SYSTEM_NAMES[systemId] || systemId}
                  </h3>
                </div>
                <p className="text-sm text-surface-400 ml-6">
                  Cliquez pour configurer
                </p>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`w-4 h-4 ${colors.text}`}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-6 border-b bg-white">
        <button
          onClick={() => setActiveSystem(null)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Retour à la liste des systèmes
        </button>
        <h1 className="text-2xl font-bold">
          {SYSTEM_NAMES[activeSystem] || activeSystem}
        </h1>
      </div>
      <SystemConfigPage 
        systemId={activeSystem}
        systemName={SYSTEM_NAMES[activeSystem] || activeSystem}
      />
    </div>
  );
}
