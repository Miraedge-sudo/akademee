/**
 * FeesAssignmentPage — Admin page for assigning fees to classes for an academic year.
 *
 * Features:
 *  - Select academic year
 *  - Select class
 *  - View all available fees with assignment status (already assigned / not assigned)
 *  - Toggle fees on/off for the selected class + year
 *  - Bulk assign
 *
 * Route: /dashboard/fees/assign
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiDollarSign,
  FiUsers,
  FiRefreshCw,
  FiCheck,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { getFees, assignFeesToClass } from "../../../core/api/feeService";
import { getClasses } from "../../../core/api/classService";
import { getAcademicYears } from "../../../core/api/academicYearService";
import { getClassAssignedFees } from "../../../core/api/feeCalculationService";

function hexToRgba(hex, alpha) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
  return `rgba(8,80,65,${alpha})`;
}

export default function FeesAssignmentPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const isFr = i18n.language === "fr";
  const pc = "#085041";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [allFees, setAllFees] = useState([]);
  const [assignedFeeIds, setAssignedFeeIds] = useState(new Set());
  const [selectedFeeIds, setSelectedFeeIds] = useState(new Set());
  const [classStudents, setClassStudents] = useState(0);

  // ── Load initial data ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [yearsData, classesData, feesData] = await Promise.all([
          getAcademicYears().catch(() => ({ years: [] })),
          getClasses({ limit: 200 }).catch(() => ({ classes: [] })),
          getFees({ limit: 500 }).catch(() => ({ fees: [] })),
        ]);

        const years = Array.isArray(yearsData) ? yearsData : yearsData?.years || [];
        const cls = Array.isArray(classesData) ? classesData : classesData?.classes || [];
        const fees = Array.isArray(feesData) ? feesData : feesData?.fees || [];

        setAcademicYears(years);
        setClasses(cls);
        setAllFees(fees);

        // Auto-select current year
        const currentYear = years.find((y) => y.isCurrent);
        if (currentYear) setSelectedYearId(currentYear.id);
      } catch {
        toast.error(isFr ? "Échec du chargement" : "Failed to load data");
      }
      setLoading(false);
    }
    load();
  }, [isFr]);

  // ── When class or year changes, load assigned fees ──
  useEffect(() => {
    if (!selectedClassId) {
      setAssignedFeeIds(new Set());
      setSelectedFeeIds(new Set());
      setClassStudents(0);
      return;
    }

    async function loadAssigned() {
      try {
        const assigned = await getClassAssignedFees(selectedClassId, selectedYearId || undefined);
        const assignedSet = new Set(assigned.map((a) => a.feeId));
        setAssignedFeeIds(assignedSet);
        // Pre-select already assigned fees
        setSelectedFeeIds(new Set(assignedSet));

        // Get student count from the class
        const cls = classes.find((c) => c.id === selectedClassId);
        setClassStudents(cls?.studentCount || cls?.studentCount || 0);
      } catch {
        setAssignedFeeIds(new Set());
        setSelectedFeeIds(new Set());
      }
    }
    loadAssigned();
  }, [selectedClassId, selectedYearId, classes]);

  // ── Toggle a fee selection ──
  const toggleFee = (feeId) => {
    setSelectedFeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(feeId)) {
        next.delete(feeId);
      } else {
        next.add(feeId);
      }
      return next;
    });
  };

  // ── Select/deselect all ──
  const selectAll = () => {
    setSelectedFeeIds(new Set(allFees.map((f) => f.id)));
  };
  const deselectAll = () => {
    setSelectedFeeIds(new Set());
  };

  // ── Save assignments ──
  const handleSave = async () => {
    if (!selectedClassId) {
      return toast.error(isFr ? "Veuillez sélectionner une classe" : "Please select a class");
    }
    if (selectedFeeIds.size === 0) {
      return toast.error(isFr ? "Sélectionnez au moins un frais" : "Select at least one fee");
    }

    setSubmitting(true);
    try {
      const result = await assignFeesToClass({
        classId: selectedClassId,
        feeIds: Array.from(selectedFeeIds),
        academicYearId: selectedYearId || undefined,
      });
      const count = Array.isArray(result) ? result.length : 0;
      toast.success(
        isFr
          ? `${count} frais assignés à la classe avec succès !`
          : `${count} fees assigned to the class successfully!`
      );
      // Reload assigned fees
      const assigned = await getClassAssignedFees(selectedClassId, selectedYearId || undefined);
      setAssignedFeeIds(new Set(assigned.map((a) => a.feeId)));
      setSelectedFeeIds(new Set(assigned.map((a) => a.feeId)));
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Échec de l'assignation" : "Failed to assign fees"));
    }
    setSubmitting(false);
  };

  const totalAssigned = allFees.filter((f) => assignedFeeIds.has(f.id)).length;
  const totalSelected = selectedFeeIds.size;
  const totalAmount = allFees.filter((f) => selectedFeeIds.has(f.id)).reduce((s, f) => s + Number(f.amount || 0), 0);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes faFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fa-fade { animation: faFadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/fees")}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FiUsers className="w-5 h-5" style={{ color: pc }} />
                <h1 className="text-xl font-bold text-gray-900">
                  {isFr ? "Assignation des frais" : "Fee Assignment"}
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {isFr
                  ? "Attribuer des frais de scolarité aux classes par année académique"
                  : "Assign school fees to classes by academic year"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Selecteurs */}
        <div className="fa-fade bg-white rounded-xl border border-gray-200 p-5 shadow-sm" style={{ animationDelay: "0.02s" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academic Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isFr ? "Année académique" : "Academic Year"}
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  <option value="">{isFr ? "Toutes les années" : "All years"}</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name || y.label}{y.isCurrent ? ` (${isFr ? "Actuelle" : "Current"})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isFr ? "Classe" : "Class"}
              </label>
              <div className="relative">
                <FiBook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  <option value="">{isFr ? "Sélectionner une classe..." : "Select a class..."}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.studentCount > 0 ? ` (${c.studentCount} ${isFr ? "élèves" : "students"})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats + Actions */}
        {selectedClassId && (
          <div className="fa-fade flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: "0.04s" }}>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {isFr ? "Classe" : "Class"}: <strong className="text-gray-800">{selectedClass?.name}</strong>
                {classStudents > 0 && (
                  <span className="ml-2">
                    · {classStudents} {isFr ? "élève(s)" : "student(s)"}
                  </span>
                )}
              </div>
              {academicYears.find((y) => y.id === selectedYearId) && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: hexToRgba(pc, 0.08), color: pc }}>
                  {academicYears.find((y) => y.id === selectedYearId)?.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
                {isFr ? "Tout sélectionner" : "Select all"}
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
                {isFr ? "Tout désélectionner" : "Deselect all"}
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || selectedFeeIds.size === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: pc }}
              >
                {submitting ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiCheck className="w-4 h-4" />
                )}
                {submitting
                  ? (isFr ? "Assignation..." : "Assigning...")
                  : (isFr
                      ? `Assigner (${totalSelected} frais${totalSelected > 1 ? "" : ""})`
                      : `Assign (${totalSelected} fee${totalSelected > 1 ? "s" : ""})`)}
              </button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        {selectedClassId && allFees.length > 0 && (
          <div className="fa-fade grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: "0.05s" }}>
            {[
              { label: isFr ? "Total frais" : "Total Fees", value: allFees.length, color: "#3B82F6" },
              { label: isFr ? "Déjà assignés" : "Already Assigned", value: totalAssigned, color: pc },
              { label: isFr ? "Sélectionnés" : "Selected", value: totalSelected, color: "#8B5CF6" },
              { label: isFr ? "Montant sélectionné" : "Selected Amount", value: `${totalAmount.toLocaleString('en')} FCFA`, color: "#F59E0B" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{stat.label}</div>
                <div className="text-[18px] font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <FiRefreshCw className="w-6 h-6 animate-spin" style={{ color: pc }} />
          </div>
        )}

        {/* Fee grid */}
        {!loading && selectedClassId && (
          <div className="fa-fade" style={{ animationDelay: "0.06s" }}>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <div className="w-10 text-center">
                  <FiCheckCircle className="w-4 h-4 mx-auto" />
                </div>
                <div className="flex-1 min-w-0">{isFr ? "Nom du frais" : "Fee Name"}</div>
                <div className="w-28 text-right">{isFr ? "Montant" : "Amount"}</div>
                <div className="w-28 text-center">{isFr ? "Statut" : "Status"}</div>
              </div>

              {allFees.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <FiDollarSign className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {isFr ? "Aucun frais disponible. Créez d'abord des frais." : "No fees available. Create fees first."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {allFees.map((fee, idx) => {
                    const isAssigned = assignedFeeIds.has(fee.id);
                    const isSelected = selectedFeeIds.has(fee.id);
                    const changed = isSelected !== isAssigned;

                    return (
                      <div
                        key={fee.id}
                        className={`fa-fade flex items-center gap-4 px-4 md:px-6 py-3.5 transition-colors cursor-pointer hover:bg-gray-50 ${
                          isSelected ? "bg-teal-50/30" : ""
                        } ${changed ? "border-l-2" : ""}`}
                        style={{ borderLeftColor: changed ? pc : "transparent", animationDelay: `${0.07 + idx * 0.02}s` }}
                        onClick={() => toggleFee(fee.id)}
                      >
                        {/* Checkbox */}
                        <div className="w-10 flex justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFee(fee.id)}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            style={{ accentColor: pc }}
                          />
                        </div>

                        {/* Name + Description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{fee.name}</span>
                            {changed && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: hexToRgba(pc, 0.1),
                                  color: pc,
                                }}
                              >
                                {isSelected ? (isFr ? "Nouveau" : "New") : (isFr ? "Retiré" : "Removed")}
                              </span>
                            )}
                          </div>
                          {fee.description && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{fee.description}</div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="w-28 text-right">
                          <span className="text-sm font-bold" style={{ color: pc }}>
                            {Number(fee.amount).toLocaleString("en")} FCFA
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="w-28 flex justify-center">
                          {isAssigned ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                              <FiCheckCircle className="w-3 h-3" />
                              {isFr ? "Assigné" : "Assigned"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                              <FiXCircle className="w-3 h-3" />
                              {isFr ? "Non assigné" : "Not assigned"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state — no class selected */}
        {!loading && !selectedClassId && (
          <div className="fa-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: "0.06s" }}>
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5 border-2 border-dashed border-gray-200">
              <FiUsers className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
              {isFr ? "Sélectionnez une classe" : "Select a class"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {isFr
                ? "Choisissez une classe et une année académique pour gérer les frais qui lui sont attribués."
                : "Choose a class and academic year to manage its assigned fees."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
