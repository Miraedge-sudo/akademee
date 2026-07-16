import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiClock,
  FiSearch,
  FiLock,
  FiUnlock,
  FiPlay,
  FiSquare,
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

// ── Status config ──
const STATUS = {
  EN_ATTENTE: {
    label: { en: "Pending", fr: "En attente" },
    color: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    actions: ["open"],
  },
  OUVERTE: {
    label: { en: "Open", fr: "Ouverte" },
    color: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    actions: ["close", "lock"],
  },
  FERMEE: {
    label: { en: "Closed", fr: "Fermée" },
    color: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
    },
    actions: ["open", "lock"],
  },
  VERROUILLEE: {
    label: { en: "Locked", fr: "Verrouillée" },
    color: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-800",
      text: "text-purple-600 dark:text-purple-400",
      dot: "bg-purple-500",
    },
    actions: ["unlock"],
  },
};

const ROW_ANIMATION = "animate-fadeInUp";

export default function SequencesPage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const t = (key, fallback) =>
    isFr ? STATUS[key]?.label?.fr : STATUS[key]?.label?.en || fallback;

  const [sequences, setSequences] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);

  // Add form state
  const [newLibelle, setNewLibelle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editLibelle, setEditLibelle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Chargement initial ──
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

  // ── Chargement des séquences ──
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

  // ── Filtrage & tri ──
  const filtered = useMemo(() => {
    let list = [...sequences];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          (s.libelle || "").toLowerCase().includes(q) ||
          (s.statut || "")
            .toLowerCase()
            .includes(q)
      );
    }
    return list.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  }, [sequences, searchQuery]);

  const getPeriode = (id) =>
    periodes.find((p) => String(p.id) === String(id));

  // ── CRUD ──
  const handleAdd = async () => {
    if (!newLibelle.trim() || !newStart || !newEnd || selectedPeriodeId === "all") {
      toast.error(isFr ? "Remplissez tous les champs" : "Fill all fields");
      return;
    }
    if (new Date(newEnd) <= new Date(newStart)) {
      toast.error(
        isFr
          ? "La date de fin doit être après la date de début"
          : "End date must be after start date"
      );
      return;
    }
    setAdding(true);
    try {
      await sequencesService.create({
        libelle: newLibelle.trim(),
        periodeId: selectedPeriodeId,
        dateDebutSaisie: newStart,
        dateFinSaisie: newEnd,
      });
      await loadSequences(selectedPeriodeId);
      setNewLibelle("");
      setNewStart("");
      setNewEnd("");
      setShowAdd(false);
      toast.success(isFr ? "Séquence ajoutée" : "Sequence added");
    } catch {
      toast.error(isFr ? "Erreur lors de la création" : "Error creating sequence");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditLibelle(s.libelle || "");
    setEditStart(s.dateDebutSaisie ? s.dateDebutSaisie.slice(0, 10) : "");
    setEditEnd(s.dateFinSaisie ? s.dateFinSaisie.slice(0, 10) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLibelle("");
    setEditStart("");
    setEditEnd("");
  };

  const handleEdit = async (id) => {
    if (!editLibelle.trim() || !editStart || !editEnd) {
      toast.error(isFr ? "Remplissez tous les champs" : "Fill all fields");
      return;
    }
    if (new Date(editEnd) <= new Date(editStart)) {
      toast.error(
        isFr
          ? "La date de fin doit être après la date de début"
          : "End date must be after start date"
      );
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

  const handleDeleteClick = (seq) => {
    setConfirmDelete(seq);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeleting(id);
    setConfirmDelete(null);
    try {
      await sequencesService.delete(id);
      setSequences((prev) => prev.filter((s) => s.id !== id));
      toast.success(isFr ? "Séquence supprimée" : "Sequence deleted");
    } catch {
      toast.error(isFr ? "Erreur lors de la suppression" : "Error deleting sequence");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  // ── Status management ──
  const handleStatus = async (id, action) => {
    setStatusLoading(`${id}_${action}`);
    try {
      const fn = {
        open: sequencesService.open,
        close: sequencesService.close,
        lock: sequencesService.lock,
        unlock: sequencesService.unlock,
      }[action];
      if (!fn) return;
      await fn(id);
      await loadSequences(selectedPeriodeId);
      const actionLabel = {
        open: isFr ? "ouverte" : "opened",
        close: isFr ? "fermée" : "closed",
        lock: isFr ? "verrouillée" : "locked",
        unlock: isFr ? "déverrouillée" : "unlocked",
      }[action];
      toast.success(
        isFr
          ? `Séquence ${actionLabel}`
          : `Sequence ${actionLabel}`
      );
    } catch {
      toast.error(isFr ? "Erreur lors du changement de statut" : "Error changing status");
    } finally {
      setStatusLoading(null);
    }
  };

  // ── Close delete modal on Escape ──
  useEffect(() => {
    if (!confirmDelete) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleDeleteCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDelete]);

  // ── Helpers ──
  const fmtDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const currentPeriode = periodes.find(
    (p) => String(p.id) === String(selectedPeriodeId)
  );

  // ── Status action icons ──
  const statusActionIcon = (action) => {
    switch (action) {
      case "open":
        return <FiPlay className="w-3 h-3" />;
      case "close":
        return <FiSquare className="w-3 h-3" />;
      case "lock":
        return <FiLock className="w-3 h-3" />;
      case "unlock":
        return <FiUnlock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const statusActionLabel = (action) => {
    switch (action) {
      case "open":
        return isFr ? "Ouvrir" : "Open";
      case "close":
        return isFr ? "Fermer" : "Close";
      case "lock":
        return isFr ? "Verrouiller" : "Lock";
      case "unlock":
        return isFr ? "Déverrouiller" : "Unlock";
      default:
        return action;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600 animate-scaleIn" />
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
        {!loading && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-surface-400 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-full">
            <FiClock className="w-3 h-3" />
            {filtered.length} / {sequences.length}
          </span>
        )}
      </div>

      {/* ── Search & Period filter row ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isFr
                ? "Rechercher une séquence…"
                : "Search sequences…"
            }
            className="w-full h-[40px] pl-9 pr-8 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <FiX className="w-3 h-3 text-surface-400" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Period filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setSelectedPeriodeId("all");
              setShowAdd(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all duration-200 ${
              selectedPeriodeId === "all"
                ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:text-primary-600"
            }`}
          >
            {isFr ? "Toutes" : "All"}
          </button>
          {periodes.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPeriodeId(p.id);
                setShowAdd(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all duration-200 ${
                selectedPeriodeId === p.id
                  ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                  : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:text-primary-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Add button / form ── */}
      {selectedPeriodeId !== "all" && !showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-4 mb-5 rounded-xl bg-primary-900 text-white text-sm font-bold hover:bg-primary-700 active:scale-[0.97] transition-all duration-200 shadow-sm shadow-primary-900/20"
        >
          <FiPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
          {isFr ? "Ajouter une séquence" : "Add sequence"}
        </button>
      )}

      {showAdd && (
        <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm animate-fadeInUp">
          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-surface-400 mb-1.5">
              {isFr ? "Libellé" : "Label"}
            </label>
            <input
              value={newLibelle}
              onChange={(e) => setNewLibelle(e.target.value)}
              placeholder={isFr ? "Ex: Séquence 1" : "e.g. Sequence 1"}
              className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 transition-all duration-200 w-full min-w-[140px]"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-surface-400 mb-1.5">
              {isFr ? "Début" : "Start"}
            </label>
            <input
              type="date"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 transition-all duration-200 w-full min-w-[140px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-surface-400 mb-1.5">
              {isFr ? "Fin" : "End"}
            </label>
            <input
              type="date"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 transition-all duration-200 w-full min-w-[140px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="h-10 px-4 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center gap-1.5"
            >
              {adding ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <FiCheck className="w-3.5 h-3.5" strokeWidth={3} />
              )}
              {isFr ? "Créer" : "Create"}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setNewLibelle("");
                setNewStart("");
                setNewEnd("");
              }}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-surface-200 dark:border-surface-600 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
            <p className="text-sm text-surface-400 animate-pulse">
              {isFr ? "Chargement…" : "Loading…"}
            </p>
          </div>
        ) : filtered.length === 0 && searchQuery ? (
          <div className="text-center py-16 animate-fadeIn">
            <div className="w-[64px] h-[64px] rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-7 h-7 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-500">
              {isFr
                ? `Aucune séquence ne correspond à "${searchQuery}"`
                : `No sequences match "${searchQuery}"`}
            </p>
            <p className="text-xs text-surface-400 mt-1.5">
              {isFr
                ? "Essayez un autre terme de recherche"
                : "Try a different search term"}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 animate-fadeIn">
            <div className="w-[64px] h-[64px] rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
              <FiClock className="w-7 h-7 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-500">
              {isFr ? "Aucune séquence" : "No sequences"}
            </p>
            {selectedPeriodeId !== "all" ? (
              <>
                <p className="text-xs text-surface-400 mt-1.5">
                  {isFr
                    ? "Ajoutez votre première séquence"
                    : "Add your first sequence"}
                </p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 active:scale-95 transition-all duration-150"
                >
                  <FiPlus className="w-3 h-3" strokeWidth={2.5} />
                  {isFr ? "Ajouter une séquence" : "Add sequence"}
                </button>
              </>
            ) : (
              <p className="text-xs text-surface-400 mt-1.5">
                {isFr
                  ? "Sélectionnez une période"
                  : "Select a period"}
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <Th>#</Th>
                  <Th>{isFr ? "Libellé" : "Label"}</Th>
                  <Th>{isFr ? "Période" : "Period"}</Th>
                  <Th>{isFr ? "Dates" : "Dates"}</Th>
                  <Th>{isFr ? "Statut" : "Status"}</Th>
                  <Th className="text-right">{isFr ? "Actions" : "Actions"}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const periode = getPeriode(s.periodeId);
                  const isEditing = editingId === s.id;
                  const isDeleting = deleting === s.id;
                  const st = STATUS[s.statut] || STATUS.EN_ATTENTE;
                  return (
                    <tr
                      key={s.id}
                      className={`group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-all duration-150 ${ROW_ANIMATION}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <td className="px-4 py-3 text-[13px] font-bold text-surface-400">
                        {s.ordre || i + 1}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editLibelle}
                            onChange={(e) => setEditLibelle(e.target.value)}
                            className="h-8 px-2.5 rounded-md border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 w-full max-w-[180px] transition-all duration-200"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleEdit(s.id)
                            }
                            autoFocus
                          />
                        ) : (
                          <span className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">
                            {s.libelle}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-surface-500 bg-surface-100 dark:bg-surface-700/50 px-2 py-0.5 rounded-full">
                          {periode?.label || `#${s.periodeId}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="h-8 px-2 rounded-md border border-surface-200 dark:border-surface-600 text-xs bg-transparent outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 w-[125px] transition-all duration-200"
                            />
                            <span className="text-surface-300">–</span>
                            <input
                              type="date"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="h-8 px-2 rounded-md border border-surface-200 dark:border-surface-600 text-xs bg-transparent outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 w-[125px] transition-all duration-200"
                            />
                          </div>
                        ) : (
                          <span className="text-[13px] text-surface-500 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {fmtDate(s.dateDebutSaisie)}
                            </span>
                            <span className="mx-1.5 text-surface-300">→</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {fmtDate(s.dateFinSaisie)}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all duration-300 ${st.color.bg} ${st.color.border} ${st.color.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${st.color.dot} animate-pulse-slow`}
                          />
                          {t(s.statut, s.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(s.id)}
                              className="w-7 h-7 rounded-md bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 active:scale-90 transition-all duration-150"
                            >
                              <FiCheck className="w-3 h-3" strokeWidth={3} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="w-7 h-7 rounded-md border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-90 transition-all duration-150"
                            >
                              <FiX className="w-3 h-3 text-surface-400" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {/* Status actions */}
                            <div className="flex items-center gap-0.5 mr-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              {STATUS[s.statut]?.actions?.map((action) => {
                                const isLoading =
                                  statusLoading === `${s.id}_${action}`;
                                return (
                                  <button
                                    key={action}
                                    onClick={() =>
                                      handleStatus(s.id, action)
                                    }
                                    disabled={isLoading}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all duration-150 active:scale-90 disabled:opacity-50 ${
                                      action === "open"
                                        ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                                        : action === "close"
                                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800"
                                        : action === "lock"
                                        ? "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                                        : action === "unlock"
                                        ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                                        : "text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-600"
                                    }`}
                                    title={statusActionLabel(action)}
                                  >
                                    {isLoading ? (
                                      <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    ) : (
                                      statusActionIcon(action)
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Edit/Delete */}
                            <button
                              onClick={() => startEdit(s)}
                              className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-sm active:scale-90 transition-all duration-150"
                              title={isFr ? "Modifier" : "Edit"}
                            >
                              <FiEdit2 className="w-3 h-3 text-primary-700" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(s)}
                              disabled={isDeleting}
                              className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm active:scale-90 disabled:opacity-50 transition-all duration-150"
                              title={isFr ? "Supprimer" : "Delete"}
                            >
                              {isDeleting ? (
                                <span className="w-3 h-3 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" />
                              ) : (
                                <FiTrash2 className="w-3 h-3 text-red-500" />
                              )}
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

      {/* ── Summary footer ── */}
      {!loading && filtered.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-[12px] text-surface-400 px-1">
          <span>
            {isFr
              ? `${filtered.length} séquence${
                  filtered.length > 1 ? "s" : ""
                }`
              : `${filtered.length} sequence${
                  filtered.length > 1 ? "s" : ""
                }`}
          </span>
          {selectedPeriodeId !== "all" && currentPeriode && (
            <span className="font-medium text-surface-500">
              {currentPeriode.label}
            </span>
          )}
        </div>
      )}
      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fadeInOnly"
          onClick={handleDeleteCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 w-full max-w-sm p-6 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <FiTrash2 className="w-5 h-5 text-red-500" />
            </div>

            {/* Title */}
            <h3 className="text-center text-[17px] font-bold text-surface-800 dark:text-surface-100 mb-2">
              {isFr ? "Supprimer la séquence" : "Delete sequence"}
            </h3>

            {/* Description */}
            <p className="text-center text-[13px] text-surface-500 mb-1">
              {isFr
                ? `Êtes-vous sûr de vouloir supprimer la séquence « ${confirmDelete.libelle} » ?`
                : `Are you sure you want to delete the sequence "${confirmDelete.libelle}"?`}
            </p>
            <p className="text-center text-[12px] text-surface-400 mb-6">
              {isFr
                ? "Cette action est irréversible."
                : "This action cannot be undone."}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 h-10 rounded-xl border border-surface-200 dark:border-surface-600 text-[13px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 active:scale-[0.97] transition-all duration-150"
              >
                {isFr ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting === confirmDelete.id}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 inline-flex items-center justify-center gap-1.5"
              >
                {deleting === confirmDelete.id ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <FiTrash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                )}
                {isFr ? "Supprimer" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400 ${className}`}
    >
      {children}
    </th>
  );
}
