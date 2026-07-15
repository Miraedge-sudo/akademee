import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiClock,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../../core/api/axios";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import { sequencesService } from "../../../core/api/sequencesService";

// ── Récupération des périodes depuis l'API v1 ──
async function fetchPeriodes() {
  const response = await api.get(API_ENDPOINTS.V1.PERIODES);
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

export default function SequencesPage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [sequences, setSequences] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newLibelle, setNewLibelle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLibelle, setEditLibelle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Chargement initial des périodes + auto-sélection de la 1ère
  useEffect(() => {
    fetchPeriodes()
      .then((data) => {
        setPeriodes(data);
        if (data.length > 0 && selectedPeriodeId === "all") {
          setSelectedPeriodeId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Chargement des séquences quand la période sélectionnée change
  const loadSequences = useCallback(async (periodeId) => {
    if (!periodeId || periodeId === "all") {
      setSequences([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await sequencesService.getByPeriodeId(periodeId);
      setSequences(data);
    } catch {
      setSequences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSequences(selectedPeriodeId);
  }, [selectedPeriodeId, loadSequences]);

  // Tri par ordre
  const sorted = useMemo(() =>
    [...sequences].sort((a, b) => a.ordre - b.ordre),
  [sequences]);

  const handleAdd = async () => {
    if (!newLibelle.trim() || !newStart || !newEnd || selectedPeriodeId === "all") {
      toast.error(isFr ? "Remplissez tous les champs" : "Fill all fields");
      return;
    }
    try {
      await sequencesService.create({
        libelle: newLibelle.trim(),
        periodeId: Number(selectedPeriodeId),
        dateDebutSaisie: newStart,
        dateFinSaisie: newEnd,
      });
      await loadSequences(selectedPeriodeId);
      setNewLibelle(""); setNewStart(""); setNewEnd("");
      setShowAdd(false);
      toast.success(isFr ? "Séquence ajoutée" : "Sequence added");
    } catch {
      toast.error(isFr ? "Erreur lors de la création" : "Error creating sequence");
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditLibelle(s.libelle || "");
    setEditStart(s.dateDebutSaisie || "");
    setEditEnd(s.dateFinSaisie || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLibelle(""); setEditStart(""); setEditEnd("");
  };

  const handleEdit = async (id) => {
    if (!editLibelle.trim() || !editStart || !editEnd) {
      toast.error(isFr ? "Remplissez tous les champs" : "Fill all fields");
      return;
    }
    try {
      await sequencesService.update(id, {
        libelle: editLibelle.trim(),
        dateDebutSaisie: editStart,
        dateFinSaisie: editEnd,
      });
      await loadSequences(selectedPeriodeId);
      cancelEdit();
      toast.success(isFr ? "Séquence modifiée" : "Sequence updated");
    } catch {
      toast.error(isFr ? "Erreur lors de la modification" : "Error updating sequence");
    }
  };

  const handleDelete = async (id) => {
    try {
      await sequencesService.delete(id);
      setSequences((prev) => prev.filter((s) => s.id !== id));
      toast.success(isFr ? "Séquence supprimée" : "Sequence deleted");
    } catch {
      toast.error(isFr ? "Erreur lors de la suppression" : "Error deleting sequence");
    }
  };

  // Couleurs & libellés pour le statut
  const statutConfig = {
    EN_ATTENTE: { label: isFr ? "En attente" : "Pending", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" },
    OUVERTE: { label: isFr ? "Ouverte" : "Open", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" },
    FERMEE: { label: isFr ? "Fermée" : "Closed", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" },
    VERROUILLEE: { label: isFr ? "Verrouillée" : "Locked", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400" },
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
              ? "Gérez les séquences d'évaluation pour chaque période pédagogique"
              : "Manage evaluation sequences for each academic period"}
          </p>
        </div>
      </div>

      {/* Filtre par période */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button
          onClick={() => { setSelectedPeriodeId("all"); setShowAdd(false); }}
          className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all ${
            selectedPeriodeId === "all"
              ? "bg-primary-600 text-white border-primary-600 shadow-sm"
              : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400"
          }`}
        >
          {isFr ? "Toutes" : "All"}
        </button>
        {periodes.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedPeriodeId(p.id); setShowAdd(false); }}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all ${
              selectedPeriodeId === p.id
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Bouton Ajouter */}
      {selectedPeriodeId !== "all" && !showAdd && (
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-4 mb-5 rounded-lg bg-primary-900 text-white text-sm font-bold hover:bg-primary-700 transition-all">
          <FiPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
          {isFr ? "Ajouter une séquence" : "Add sequence"}
        </button>
      )}

      {/* Formulaire d'ajout */}
      {showAdd && (
        <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div>
            <label className="block text-[10px] font-semibold text-surface-500 mb-1">{isFr ? "Libellé" : "Label"}</label>
            <input value={newLibelle} onChange={(e) => setNewLibelle(e.target.value)}
              placeholder={isFr ? "Séquence 1" : "Sequence 1"}
              className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600" />
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

      {/* Tableau */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><div className="w-8 h-8 rounded-full border-4 border-surface-200 border-t-primary-600 animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-14">
            <FiClock className="w-8 h-8 text-surface-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-surface-500">{isFr ? "Aucune séquence" : "No sequences"}</p>
            {selectedPeriodeId !== "all" && (
              <button onClick={() => setShowAdd(true)} className="mt-3 text-xs font-semibold text-primary-600 hover:underline">{isFr ? "Ajouter" : "Add"} →</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Libellé" : "Label"}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Période" : "Period"}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Dates" : "Dates"}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Statut" : "Status"}</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider uppercase text-surface-400">{isFr ? "Actions" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const periode = periodes.find((p) => Number(p.id) === Number(s.periodeId));
                  const isEditing = editingId === s.id;
                  const st = statutConfig[s.statut] || statutConfig.EN_ATTENTE;
                  return (
                    <tr key={s.id} className="group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors">
                      <td className="px-4 py-3 text-[13px] font-bold text-surface-400">{s.ordre || i + 1}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <input value={editLibelle} onChange={(e) => setEditLibelle(e.target.value)}
                              className="h-8 px-2 rounded-md border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 w-full max-w-[180px]"
                              placeholder={isFr ? "Séquence 1" : "Sequence 1"} />
                          </div>
                        ) : (
                          <span className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">{s.libelle}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-surface-500">{periode?.label || `Période #${s.periodeId}`}</td>
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
                            {s.dateDebutSaisie
                              ? new Date(s.dateDebutSaisie).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : "—"} – {s.dateFinSaisie
                                ? new Date(s.dateFinSaisie).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            s.statut === "OUVERTE" ? "bg-emerald-500" :
                            s.statut === "FERMEE" ? "bg-red-500" :
                            s.statut === "VERROUILLEE" ? "bg-purple-500" :
                            "bg-amber-500"
                          }`} />
                          {st.label}
                        </span>
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
