import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiGrid,
} from "react-icons/fi";
import toast from "react-hot-toast";

const MOCK_API = "http://localhost:3001";

export default function SeriesManagementPage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchSeries = () => {
    setLoading(true);
    fetch(`${MOCK_API}/systemSeries`)
      .then((r) => r.json())
      .then((data) => {
        setSeries(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchSeries(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`${MOCK_API}/systemSeries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSeries((prev) => [...prev, saved]);
        setNewName("");
        toast.success(isFr ? "Série ajoutée" : "Series added");
      }
    } catch { toast.error(isFr ? "Erreur" : "Error"); }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`${MOCK_API}/systemSeries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSeries((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
        setEditingId(null);
        setEditName("");
        toast.success(isFr ? "Série modifiée" : "Series updated");
      }
    } catch { toast.error(isFr ? "Erreur" : "Error"); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${MOCK_API}/systemSeries/${id}`, { method: "DELETE" });
      setSeries((prev) => prev.filter((s) => s.id !== id));
      toast.success(isFr ? "Série supprimée" : "Series deleted");
    } catch { toast.error(isFr ? "Erreur" : "Error"); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Séries & Filières" : "Series & Filières"}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr
              ? "Définissez les séries, filières ou streams (Science, Arts, Série C…)"
              : "Define series, filières or streams (Science, Arts, Série C…)"}
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="flex items-center gap-2.5 mb-5 p-3 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={isFr ? "Nom (ex: Science, Série C...)" : "Name (e.g. Science, Série C...)"}
          className="flex-1 h-[40px] px-3 border border-surface-200 dark:border-surface-600 rounded-lg text-sm outline-none focus:border-primary-600 bg-transparent text-surface-800 dark:text-surface-100"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="inline-flex items-center gap-1.5 h-[40px] px-4 rounded-lg bg-primary-900 text-white text-sm font-bold hover:bg-primary-700 transition-all disabled:opacity-50"
        >
          <FiPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
          {isFr ? "Ajouter" : "Add"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14">
            <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-[60px] h-[60px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
              <FiGrid className="w-6 h-6 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-500">
              {isFr ? "Aucune série définie" : "No series defined"}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {isFr ? "Ajoutez votre première série ci-dessus" : "Add your first series above"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400 w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">
                    {isFr ? "Nom" : "Name"}
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider uppercase text-surface-400">
                    {isFr ? "Actions" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {series.map((s, index) => {
                  const isEditing = editingId === s.id;
                  return (
                    <tr
                      key={s.id}
                      className="group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-bold text-surface-400">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-[34px] px-2.5 border border-surface-200 dark:border-surface-600 rounded-lg text-sm outline-none focus:border-primary-600 bg-transparent text-surface-800 dark:text-surface-100 w-full max-w-[200px]"
                              onKeyDown={(e) => e.key === "Enter" && handleEdit(s.id)}
                              autoFocus
                            />
                            <button
                              onClick={() => handleEdit(s.id)}
                              className="w-7 h-7 rounded-md bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-all"
                            >
                              <FiCheck className="w-3 h-3" strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditName(""); }}
                              className="w-7 h-7 rounded-md border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
                            >
                              <FiX className="w-3 h-3 text-surface-400" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold px-2.5 py-0.5 rounded-full border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50 text-surface-800 dark:text-surface-100">
                            {s.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingId(s.id); setEditName(s.name); }}
                            className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all"
                            title={isFr ? "Modifier" : "Edit"}
                          >
                            <FiEdit2 className="w-3 h-3 text-primary-700" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
                            title={isFr ? "Supprimer" : "Delete"}
                          >
                            <FiTrash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
