import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiClock,
} from "react-icons/fi";
import toast from "react-hot-toast";

const MOCK_API = "http://localhost:3001";

export default function SequencesPage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [sequences, setSequences] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameFr, setNewNameFr] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNameFr, setEditNameFr] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${MOCK_API}/sequences`).then((r) => r.json()),
      fetch(`${MOCK_API}/periods`).then((r) => r.json()),
    ]).then(([s, p]) => {
      setSequences(s || []);
      setPeriods(p || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (periodFilter === "all") return sequences;
    return sequences.filter((s) => s.periodId === periodFilter);
  }, [sequences, periodFilter]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => (a.number || 0) - (b.number || 0)),
  [filtered]);

  const getPeriod = (id) => periods.find((p) => p.id === id);

  const handleAdd = async () => {
    if (!newName.trim() || !newStart || !newEnd || periodFilter === "all") {
      toast.error(isFr ? "Remplissez tous les champs" : "Fill all fields");
      return;
    }
    const maxNum = sequences
      .filter((s) => s.periodId === periodFilter)
      .reduce((m, s) => Math.max(m, s.number || 0), 0);
    try {
      await fetch(`${MOCK_API}/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodId: periodFilter,
          name: newName.trim(),
          nameFr: newNameFr.trim() || newName.trim(),
          number: maxNum + 1,
          startDate: newStart,
          endDate: newEnd,
        }),
      });
      fetchData();
      setNewName(""); setNewNameFr(""); setNewStart(""); setNewEnd("");
      setShowAdd(false);
      toast.success(isFr ? "Séquence ajoutée" : "Sequence added");
    } catch { toast.error(isFr ? "Erreur" : "Error"); }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditName(s.name || "");
    setEditNameFr(s.nameFr || "");
    setEditStart(s.startDate || "");
    setEditEnd(s.endDate || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName(""); setEditNameFr(""); setEditStart(""); setEditEnd("");
  };

  const handleEdit = async (id) => {
    if (!editName.trim() || !editStart || !editEnd) {
      toast.error(isFr ? "Remplissez tous les champs" : "Fill all fields");
      return;
    }
    try {
      const res = await fetch(`${MOCK_API}/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          nameFr: editNameFr.trim() || editName.trim(),
          startDate: editStart,
          endDate: editEnd,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSequences((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
        cancelEdit();
        toast.success(isFr ? "Séquence modifiée" : "Sequence updated");
      }
    } catch { toast.error(isFr ? "Erreur" : "Error"); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${MOCK_API}/sequences/${id}`, { method: "DELETE" });
      setSequences((prev) => prev.filter((s) => s.id !== id));
      toast.success(isFr ? "Séquence supprimée" : "Sequence deleted");
    } catch { toast.error(isFr ? "Erreur" : "Error"); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Séquences" : "Sequences"}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr
              ? "Gérez les séquences d'évaluation pour chaque période"
              : "Manage evaluation sequences for each period"}
          </p>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button
          onClick={() => { setPeriodFilter("all"); setShowAdd(false); }}
          className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all ${
            periodFilter === "all"
              ? "bg-primary-600 text-white border-primary-600 shadow-sm"
              : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400"
          }`}
        >
          {isFr ? "Toutes" : "All"}
        </button>
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => { setPeriodFilter(p.id); setShowAdd(false); }}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all ${
              periodFilter === p.id
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Add */}
      {periodFilter !== "all" && !showAdd && (
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-4 mb-5 rounded-lg bg-primary-900 text-white text-sm font-bold hover:bg-primary-700 transition-all">
          <FiPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
          {isFr ? "Ajouter une séquence" : "Add sequence"}
        </button>
      )}

      {showAdd && (
        <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div>
            <label className="block text-[10px] font-semibold text-surface-500 mb-1">{isFr ? "Nom EN" : "Name EN"}</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Sequence 1" className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-surface-500 mb-1">{isFr ? "Nom FR" : "Name FR"}</label>
            <input value={newNameFr} onChange={(e) => setNewNameFr(e.target.value)}
              placeholder="Séquence 1" className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-surface-500 mb-1">{isFr ? "Début" : "Start"}</label>
            <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)}
              className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-surface-500 mb-1">{isFr ? "Fin" : "End"}</label>
            <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
              className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600" />
          </div>
          <button onClick={handleAdd}
            className="h-10 px-4 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-all">
            <FiCheck className="w-3.5 h-3.5 inline mr-1" />{isFr ? "Créer" : "Create"}
          </button>
          <button onClick={() => setShowAdd(false)}
            className="h-10 px-3 rounded-lg border border-surface-200 text-surface-500 text-xs hover:bg-surface-50 transition-all">
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><div className="w-8 h-8 rounded-full border-4 border-surface-200 border-t-primary-600 animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-14">
            <FiClock className="w-8 h-8 text-surface-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-surface-500">{isFr ? "Aucune séquence" : "No sequences"}</p>
            {periodFilter !== "all" && (
              <button onClick={() => setShowAdd(true)} className="mt-3 text-xs font-semibold text-primary-600 hover:underline">{isFr ? "Ajouter" : "Add"} →</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Nom" : "Name"}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Période" : "Period"}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Dates" : "Dates"}</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Actions" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const period = getPeriod(s.periodId);
                  const isEditing = editingId === s.id;
                  return (
                    <tr key={s.id} className="group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors">
                      <td className="px-4 py-3 text-[13px] font-bold text-surface-400">{s.number || i + 1}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="h-8 px-2 rounded-md border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 w-full max-w-[140px]"
                              placeholder="Sequence 1" />
                            <input value={editNameFr} onChange={(e) => setEditNameFr(e.target.value)}
                              className="h-8 px-2 rounded-md border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 w-full max-w-[140px]"
                              placeholder="Séquence 1" />
                          </div>
                        ) : (
                          <>
                            <span className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">{s.name}</span>
                            {s.nameFr && <span className="text-[11px] text-surface-400 ml-2">({s.nameFr})</span>}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-surface-500">{period?.name || `Period #${s.periodId}`}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                              className="h-8 px-2 rounded-md border border-surface-200 dark:border-surface-600 text-xs bg-transparent outline-none focus:border-primary-600 w-[130px]" />
                            <span className="text-surface-300">–</span>
                            <input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                              className="h-8 px-2 rounded-md border border-surface-200 dark:border-surface-600 text-xs bg-transparent outline-none focus:border-primary-600 w-[130px]" />
                          </div>
                        ) : (
                          <span className="text-[13px] text-surface-500">
                            {new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(s.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(s.id)}
                              className="w-7 h-7 rounded-md bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-all">
                              <FiCheck className="w-3 h-3" strokeWidth={3} />
                            </button>
                            <button onClick={cancelEdit}
                              className="w-7 h-7 rounded-md border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-all">
                              <FiX className="w-3 h-3 text-surface-400" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => startEdit(s)}
                              className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all"
                              title={isFr ? "Modifier" : "Edit"}>
                              <FiEdit2 className="w-3 h-3 text-primary-700" />
                            </button>
                            <button onClick={() => handleDelete(s.id)}
                              className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
                              title={isFr ? "Supprimer" : "Delete"}>
                              <FiTrash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )}
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
