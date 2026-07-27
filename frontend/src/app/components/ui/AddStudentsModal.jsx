import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/hooks/useTheme";
import { getStudents } from "../../core/api/studentService";
import { enrollStudent } from "../../core/api/classService";
import {
  FiX, FiSearch, FiCheck, FiLoader, FiUser, FiPlus,
} from "react-icons/fi";
import toast from "react-hot-toast";

function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) {
    return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  }
  return `rgba(8, 80, 65, ${alpha})`;
}

export default function AddStudentsModal({ isOpen, onClose, classId, className, existingStudentIds = [], onSuccess }) {
  const { t, i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";

  // ── State ──
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);

  // ── Load students ──
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      setSearch("");
      setSelectedIds(new Set());
      setEnrolledCount(0);
      try {
        const data = await getStudents({ limit: 500 });
        const list = Array.isArray(data) ? data : (data?.students || []);
        setAllStudents(list);
      } catch (err) {
        console.error("Failed to load students:", err);
        setAllStudents([]);
      }
      setLoading(false);
    };
    load();
  }, [isOpen]);

  // ── Filtered students (exclude already enrolled) ──
  const availableStudents = useMemo(() => {
    const excludeSet = new Set(existingStudentIds.map(String));
    return allStudents.filter((s) => !excludeSet.has(String(s.id)));
  }, [allStudents, existingStudentIds]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return availableStudents;
    const q = search.toLowerCase();
    return availableStudents.filter((s) =>
      `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase().includes(q) ||
      (s.studentNumber || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  }, [availableStudents, search]);

  // ── Select / Deselect ──
  const toggleStudent = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = filteredStudents.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // ── Enroll selected students ──
  const handleEnroll = async () => {
    if (selectedIds.size === 0) {
      toast.error(isFr ? "Sélectionnez au moins un élève" : "Select at least one student");
      return;
    }
    setEnrolling(true);
    let success = 0;
    let errors = 0;
    const ids = Array.from(selectedIds);

    for (let i = 0; i < ids.length; i++) {
      try {
        await enrollStudent(classId, { studentId: ids[i] });
        success++;
        setEnrolledCount(i + 1);
      } catch (err) {
        const msg = err?.response?.data?.message || "";
        if (msg.includes("already enrolled")) {
          success++; // count as success, they're already in
        } else {
          errors++;
          console.error(`Failed to enroll student ${ids[i]}:`, err);
        }
      }
    }

    setEnrolling(false);

    if (success > 0) {
      toast.success(
        isFr
          ? `${success} élève${success > 1 ? "s" : ""} ajouté${success > 1 ? "s" : ""} à la classe`
          : `${success} student${success > 1 ? "s" : ""} added to class`
      );
      onSuccess?.(success);
      onClose();
    }
    if (errors > 0) {
      toast.error(
        isFr
          ? `${errors} élève${errors > 1 ? "s" : ""} n\'ont pas pu être ajouté${errors > 1 ? "s" : ""}`
          : `${errors} student${errors > 1 ? "s" : ""} could not be added`
      );
    }
  };

  // ── Escape key ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.id));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[600px] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden animate-scaleIn max-h-[85vh] flex flex-col">
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(pc, 0.08) }}>
              <FiUser className="w-5 h-5" style={{ color: pc }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Ajouter des élèves" : "Add Students"}
              </h2>
              <p className="text-xs text-surface-400">
                {isFr
                  ? `Sélectionnez des élèves à ajouter à « ${className} »`
                  : `Select students to add to "${className}"`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <FiX className="w-4 h-4 text-surface-400" />
          </button>
        </div>

        {/* ── Search ── */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex items-center gap-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-lg px-3 h-10">
            <FiSearch className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isFr ? "Rechercher un élève..." : "Search student..."}
              className="flex-1 border-none outline-none text-xs bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-400"
              autoFocus
            />
            {availableStudents.length > 0 && (
              <span className="text-[10px] text-surface-400 font-medium flex-shrink-0">
                {filteredStudents.length} / {availableStudents.length}
              </span>
            )}
          </div>
        </div>

        {/* ── Student List ── */}
        <div className="flex-1 overflow-y-auto px-6 py-2 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <FiLoader className="w-6 h-6 animate-spin" style={{ color: pc }} />
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="text-center py-16">
              <FiUser className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-surface-500">
                {isFr ? "Aucun élève disponible" : "No students available"}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                {isFr
                  ? "Tous les élèves sont déjà inscrits dans cette classe"
                  : "All students are already enrolled in this class"}
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <FiSearch className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-surface-500">
                {isFr ? "Aucun résultat" : "No results"}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                {isFr ? "Essayez un autre terme de recherche" : "Try a different search term"}
              </p>
            </div>
          ) : (
            <div>
              {/* Select all toggle */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2.5 px-1 py-2 text-[11px] font-semibold text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors w-full"
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    allFilteredSelected
                      ? "scale-110"
                      : "border-surface-300 dark:border-surface-500"
                  }`}
                  style={allFilteredSelected ? { backgroundColor: pc, borderColor: pc } : undefined}
                >
                  {allFilteredSelected && <FiCheck className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                {allFilteredSelected
                  ? (isFr ? "Tout désélectionner" : "Deselect all")
                  : (isFr ? "Tout sélectionner" : "Select all")}
                <span className="text-[10px] text-surface-400">({filteredStudents.length})</span>
              </button>

              <div className="space-y-0.5 mt-1">
                {filteredStudents.map((s) => {
                  const isSelected = selectedIds.has(s.id);
                  const initials = ((s.firstName?.[0] || "") + (s.lastName?.[0] || "")).toUpperCase() || "?";
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/15"
                          : "border-transparent hover:border-surface-200 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800/50"
                      }`}
                      style={isSelected ? { borderColor: hexToRgba(pc, 0.3) } : undefined}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isSelected
                            ? "scale-100"
                            : "border-surface-300 dark:border-surface-500"
                        }`}
                        style={isSelected ? { backgroundColor: pc, borderColor: pc } : undefined}
                      >
                        {isSelected && <FiCheck className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: hexToRgba(pc, 0.08),
                          color: pc,
                          border: `1.5px solid ${hexToRgba(pc, 0.15)}`,
                        }}
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-surface-800 dark:text-surface-100 truncate">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-surface-400">
                          {s.studentNumber && <span>{s.studentNumber}</span>}
                          {s.currentClass || s.className ? (
                            <>
                              {s.studentNumber && <span>·</span>}
                              <span className="truncate">{s.currentClass || s.className}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Already enrolled badge (shouldn't happen since we filter) */}
                      {existingStudentIds.includes(String(s.id)) && (
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-700 flex-shrink-0">
                          {isFr ? "Inscrit" : "Enrolled"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-surface-500">
              {selectedIds.size > 0 ? (
                isFr
                  ? `${selectedIds.size} élève${selectedIds.size > 1 ? "s" : ""} sélectionné${selectedIds.size > 1 ? "s" : ""}`
                  : `${selectedIds.size} student${selectedIds.size > 1 ? "s" : ""} selected`
              ) : (
                <span className="text-surface-400">
                  {isFr ? "Aucun élève sélectionné" : "No student selected"}
                </span>
              )}
              {enrolling && enrolledCount > 0 && (
                <span className="ml-2 text-primary-600">
                  {isFr ? `Inscription ${enrolledCount}/${selectedIds.size}...` : `Enrolling ${enrolledCount}/${selectedIds.size}...`}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="h-[42px] px-5 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
              >
                {isFr ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={handleEnroll}
                disabled={selectedIds.size === 0 || enrolling}
                className="h-[42px] px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-55 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{ backgroundColor: pc, boxShadow: `0 4px 14px ${hexToRgba(pc, 0.3)}` }}
              >
                {enrolling ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {isFr ? "Inscription..." : "Enrolling..."}
                  </>
                ) : (
                  <>
                    <FiPlus className="w-4 h-4" />
                    {isFr
                      ? `Ajouter ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""}`
                      : `Add ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
