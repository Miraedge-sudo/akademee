import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiCalendar,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getTerms,
  createTerm,
  updateTerm,
  deleteTerm,
  getAcademicYears,
} from "../../../core/api/academicYearService";

// ── Animations ──
const ROW_ANIMATION = "animate-fadeInUp";

export default function PeriodsPage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [periods, setPeriods] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      getTerms().then((d) => d?.periods || d || []),
      getAcademicYears().then((d) => d?.years || d || []),
    ])
      .then(([p, y]) => {
        setPeriods(p || []);
        setYears(y || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Filtered & sorted data ──
  const filtered = useMemo(() => {
    let list = periods;
    if (yearFilter !== "all") {
      list = list.filter((p) => p.academicYearId === yearFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          (p.nameFr || "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (a.sortOrder || a.order || 0) - (b.sortOrder || b.order || 0));
  }, [periods, yearFilter, searchQuery]);

  const getYear = (id) => years.find((y) => y.id === id);

  // ── CRUD ──
  const handleAdd = async () => {
    if (!newName.trim() || !newStart || !newEnd || yearFilter === "all") {
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
    const maxOrder = periods
      .filter((p) => p.academicYearId === yearFilter)
      .reduce((m, p) => Math.max(m, p.sortOrder || p.order || 0), 0);
    try {
      await createTerm({
        academicYearId: yearFilter,
        name: newName.trim(),
        type: "term",
        startDate: newStart,
        endDate: newEnd,
        sortOrder: maxOrder + 1,
      });
      fetchData();
      setNewName("");
      setNewStart("");
      setNewEnd("");
      setShowAdd(false);
      toast.success(isFr ? "Période ajoutée" : "Period added");
    } catch {
      toast.error(isFr ? "Erreur lors de la création" : "Error creating period");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name || "");
    setEditStart(p.startDate ? p.startDate.slice(0, 10) : "");
    setEditEnd(p.endDate ? p.endDate.slice(0, 10) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditStart("");
    setEditEnd("");
  };

  const handleEdit = async (id) => {
    if (!editName.trim() || !editStart || !editEnd) {
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
      await updateTerm(id, {
        name: editName.trim(),
        startDate: editStart,
        endDate: editEnd,
      });
      fetchData();
      cancelEdit();
      toast.success(isFr ? "Période modifiée" : "Period updated");
    } catch {
      toast.error(isFr ? "Erreur lors de la modification" : "Error updating period");
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteTerm(id);
      setPeriods((prev) => prev.filter((p) => p.id !== id));
      toast.success(isFr ? "Période supprimée" : "Period deleted");
    } catch {
      toast.error(isFr ? "Erreur lors de la suppression" : "Error deleting period");
    } finally {
      setDeleting(null);
    }
  };

  // ── Format date helper ──
  const fmtDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const activeYear = years.find((y) => y.id === yearFilter);

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600 animate-scaleIn" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Périodes" : "Periods"}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr
              ? "Gérez les termes et trimestres pour chaque année scolaire"
              : "Manage terms and trimesters for each academic year"}
          </p>
        </div>
        {!loading && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-surface-400 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-full">
            <FiCalendar className="w-3 h-3" />
            {filtered.length} / {periods.length}
          </span>
        )}
      </div>

      {/* ── Search & Year filter row ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFr ? "Rechercher une période…" : "Search periods…"}
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

        {/* Year filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setYearFilter("all");
              setShowAdd(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all duration-200 ${
              yearFilter === "all"
                ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:text-primary-600"
            }`}
          >
            {isFr ? "Toutes" : "All"}
          </button>
          {years.map((y) => (
            <button
              key={y.id}
              onClick={() => {
                setYearFilter(y.id);
                setShowAdd(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all duration-200 ${
                yearFilter === y.id
                  ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                  : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:text-primary-600"
              }`}
            >
              {y.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Add button / form ── */}
      {yearFilter !== "all" && !showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-4 mb-5 rounded-xl bg-primary-900 text-white text-sm font-bold hover:bg-primary-700 active:scale-[0.97] transition-all duration-200 shadow-sm shadow-primary-900/20"
        >
          <FiPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
          {isFr ? "Ajouter une période" : "Add period"}
        </button>
      )}

      {showAdd && (
        <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm animate-fadeInUp">
          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-surface-400 mb-1.5">
              {isFr ? "Nom" : "Name"}
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isFr ? "Ex: Term 1" : "e.g. Term 1"}
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
                setNewName("");
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
          <NoResults
            icon={FiSearch}
            message={
              isFr
                ? `Aucune période ne correspond à "${searchQuery}"`
                : `No periods match "${searchQuery}"`
            }
            sub={isFr ? "Essayez un autre terme" : "Try a different search term"}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title={isFr ? "Aucune période" : "No periods"}
            action={
              yearFilter !== "all"
                ? () => setShowAdd(true)
                : undefined
            }
            actionLabel={isFr ? "Ajouter une période" : "Add period"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <Th>{isFr ? "Ordre" : "Order"}</Th>
                  <Th>{isFr ? "Nom" : "Name"}</Th>
                  <Th>{isFr ? "Année" : "Year"}</Th>
                  <Th>{isFr ? "Dates" : "Dates"}</Th>
                  <Th className="text-right">{isFr ? "Actions" : "Actions"}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const year = getYear(p.academicYearId);
                  const isEditing = editingId === p.id;
                  const isDeleting = deleting === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-all duration-150 ${ROW_ANIMATION}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <td className="px-4 py-3 text-[13px] font-bold text-surface-400">
                        {p.sortOrder || p.order || i + 1}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 px-2.5 rounded-md border border-surface-200 dark:border-surface-600 text-sm bg-transparent outline-none focus:border-primary-600 dark:focus:border-primary-400 text-surface-800 dark:text-surface-100 w-full max-w-[160px] transition-all duration-200"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleEdit(p.id)
                            }
                            autoFocus
                          />
                        ) : (
                          <span className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">
                            {p.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-surface-500 bg-surface-100 dark:bg-surface-700/50 px-2 py-0.5 rounded-full">
                          {year?.name || "—"}
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
                              {fmtDate(p.startDate)}
                            </span>
                            <span className="mx-1.5 text-surface-300">→</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {fmtDate(p.endDate)}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(p.id)}
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
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={() => startEdit(p)}
                              className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-sm active:scale-90 transition-all duration-150"
                              title={isFr ? "Modifier" : "Edit"}
                            >
                              <FiEdit2 className="w-3 h-3 text-primary-700" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
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
              ? `${filtered.length} période${
                  filtered.length > 1 ? "s" : ""
                } sur ${periods.length}`
              : `${filtered.length} of ${periods.length} period${
                  periods.length > 1 ? "s" : ""
                }`}
          </span>
          {yearFilter !== "all" && activeYear && (
            <span className="font-medium text-surface-500">
              {activeYear.name}
            </span>
          )}
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

function NoResults({ icon: Icon, message, sub }) {
  return (
    <div className="text-center py-16 animate-fadeIn">
      <div className="w-[64px] h-[64px] rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-surface-400" />
      </div>
      <p className="text-sm font-semibold text-surface-500">{message}</p>
      <p className="text-xs text-surface-400 mt-1.5">{sub}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, action, actionLabel }) {
  return (
    <div className="text-center py-16 animate-fadeIn">
      <div className="w-[64px] h-[64px] rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-surface-400" />
      </div>
      <p className="text-sm font-semibold text-surface-500">{title}</p>
      <p className="text-xs text-surface-400 mt-1.5">
        {action
          ? "Cliquez ci-dessous pour ajouter"
          : "Sélectionnez une année scolaire"}
      </p>
      {action && (
        <button
          onClick={action}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 active:scale-95 transition-all duration-150"
        >
          <FiPlus className="w-3 h-3" strokeWidth={2.5} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
