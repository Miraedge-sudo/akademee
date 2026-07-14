import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import { useAuth } from "../../../core/hooks/useAuth";
import { useEducationalSystems } from "../../../core/context/EducationalSystemContext";
import {
  FiCalendar,
  FiBookOpen,
  FiLayers,
  FiClock,
  FiArrowRight,
  FiEye,
  FiSettings,
  FiPlus,
  FiArchive,
  FiHome,
  FiLogOut,
  FiEdit3,
  FiX,
  FiCheck,
} from "react-icons/fi";
import toast from "react-hot-toast";

// ── Mock server URL ──
const MOCK_API = "http://localhost:3001";

// ── Transform raw year data from API to display format ──
function transformYear(raw) {
  const status = raw.status || "future";
  const isActive = status === "active";
  const isArchive = status === "archive";

  const config = {
    active: {
      accentFrom: "#085041", accentTo: "#5DCAA5",
      icon: FiCalendar, iconBg: "#E1F5EE", iconColor: "#085041",
      badgeLabel: "Active", footerLabel: "Year progress",
      footerAction: "Full access", footerActionIcon: FiArrowRight, footerActionColor: "#085041",
    },
    archive: {
      accentFrom: "#F59E0B", accentTo: "#FCD34D",
      icon: FiArchive, iconBg: "rgba(245,158,11,0.09)", iconColor: "#F59E0B",
      badgeLabel: "Completed", footerLabel: "Pass rate",
      footerAction: "View only", footerActionIcon: FiEye, footerActionColor: "#F59E0B",
    },
    future: {
      accentFrom: "#3B82F6", accentTo: "#93C5FD",
      icon: FiEdit3, iconBg: "rgba(59,130,246,0.08)", iconColor: "#3B82F6",
      badgeLabel: "Planned", footerLabel: "Setup mode",
      footerAction: "Configure", footerActionIcon: FiSettings, footerActionColor: "#3B82F6",
    },
  };

  const c = config[status] || config.future;
  return {
    ...raw,
    ...c,
    footerPct: isArchive ? (raw.passRate || 0) : (isActive ? 35 : 0),
    currentSequence: isActive ? 2 : null,
  };
}



// ── Create Year Modal ──
function CreateYearModal({ open, onClose, onCreated }) {
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const { selectedSystems } = useEducationalSystems();
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    sequences: 3,
  });
  const [submitting, setSubmitting] = useState(false);

  // Determine status based on dates
  const status = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (start >= now) return "future";
    if (end >= now && start < now) return "current";
    return "past"; // past — should be blocked
  }, [form.startDate, form.endDate]);

  // Min date = today (no past years)
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Auto-generate year name from dates
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate).getFullYear();
      const e = new Date(form.endDate).getFullYear();
      if (s && e && s !== e) {
        update("name", `${s} – ${e}`);
      }
    }
  }, [form.startDate, form.endDate]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error(isFr ? "Veuillez remplir tous les champs" : "Please fill all fields");
      return;
    }

    // Block past years
    if (status === "past") {
      toast.error(isFr ? "Vous ne pouvez pas créer une année scolaire dans le passé" : "You cannot create an academic year in the past");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const isActive = status === "current";
    const yearConfig = {
      id: `y${Date.now()}`,
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      sequences: form.sequences,
      isCurrent: isActive,
      students: 0, teachers: 0, classes: 0, passRate: null,
      status: isActive ? "active" : "future",
      accentFrom: isActive ? "#085041" : "#3B82F6",
      accentTo: isActive ? "#5DCAA5" : "#93C5FD",
      icon: isActive ? FiCalendar : FiEdit3,
      iconBg: isActive ? "#E1F5EE" : "rgba(59,130,246,0.08)",
      iconColor: isActive ? "#085041" : "#3B82F6",
      badgeLabel: isActive ? (isFr ? "Active" : "Active") : (isFr ? "Planifiée" : "Planned"),
      footerLabel: isActive ? (isFr ? "Progression" : "Year progress") : (isFr ? "Mode configuration" : "Setup mode"),
      footerPct: isActive ? 0 : 0,
      footerAction: isActive ? (isFr ? "Accès complet" : "Full access") : (isFr ? "Configurer" : "Configure"),
      footerActionIcon: isActive ? FiArrowRight : FiSettings,
      footerActionColor: isActive ? "#085041" : "#3B82F6",
    };

    // Save to mock server
    try {
      const payload = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        sequences: form.sequences,
        isCurrent: isActive,
        students: 0, teachers: 0, classes: 0, passRate: null,
        status: isActive ? "active" : "future",
      };
      const res = await fetch(`${MOCK_API}/academicYears`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        onCreated(transformYear(saved));
      } else {
        onCreated(transformYear({ ...payload, id: `y${Date.now()}` }));
      }
    } catch {
      onCreated(transformYear({ ...yearConfig, id: `y${Date.now()}` }));
    }

    setSubmitting(false);
    onClose();
    toast.success(isFr ? "Année scolaire créée !" : "Academic year created!");
    setForm({ name: "", startDate: "", endDate: "", sequences: 3 });
  };

  const inputClass = "w-full h-[46px] px-3.5 border-[1.5px] border-surface-200 dark:border-surface-600 rounded-[10px] font-sans text-sm text-surface-800 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-all duration-200 focus:border-primary-600";

  // Map system codes to display labels
  const systemLabels = {
    anglophone_general: "Anglophone General",
    francophone_general: "Francophone General",
    anglophone_technical: "Anglophone Technical",
    francophone_technical: "Francophone Technical",
    university: "University LMD",
  };

  const systemColors = {
    anglophone_general: "bg-teal-50 text-teal-900 border-teal-100",
    francophone_general: "bg-amber-50 text-amber-800 border-amber-200",
    anglophone_technical: "bg-cyan-50 text-cyan-800 border-cyan-200",
    francophone_technical: "bg-purple-50 text-purple-800 border-purple-200",
    university: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };

  const systemDots = {
    anglophone_general: "bg-teal-600",
    francophone_general: "bg-amber-500",
    anglophone_technical: "bg-cyan-500",
    francophone_technical: "bg-purple-500",
    university: "bg-emerald-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative w-full max-w-[480px] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-primary-900 dark:text-primary-100" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100">
                {isFr ? "Nouvelle année scolaire" : "New Academic Year"}
              </h2>
              <p className="text-xs text-surface-400">
                {isFr
                  ? "Créez une année scolaire pour l'année à venir"
                  : "Create an academic year for the upcoming period"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <FiX className="w-4 h-4 text-surface-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Year name */}
          <div>
            <label className="block text-[13px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
              {isFr ? "Nom de l'année" : "Year name"}
              <span className="text-xs text-surface-400 font-normal ml-1">({isFr ? "auto-généré" : "auto-generated"})</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="2025 – 2026"
              className={inputClass}
            />
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
                {isFr ? "Date de début" : "Start date"}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                min={todayStr}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
                {isFr ? "Date de fin" : "End date"}
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                min={form.startDate || todayStr}
                className={inputClass}
              />
            </div>
          </div>

          {/* Status indicator */}
          {status && (
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm ${
                status === "past"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                  : status === "current"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "past" ? "bg-red-500" : status === "current" ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
              {status === "past"
                ? (isFr ? "⚠️ Impossible — année dans le passé" : "⚠️ Cannot create — year is in the past")
                : status === "current"
                  ? (isFr ? "✓ Année en cours — sera active immédiatement" : "✓ Current year — will be active immediately")
                  : (isFr ? "→ Année future — sera en mode planification" : "→ Future year — will be in setup mode")}
            </div>
          )}

          {/* Sequences */}
          <div>
            <label className="block text-[13px] font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
              {isFr ? "Nombre de séquences/trimestres" : "Number of sequences/terms"}
            </label>
            <div className="flex gap-2">
              {[2, 3, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update("sequences", n)}
                  className={`flex-1 h-[46px] rounded-[10px] text-sm font-semibold border-[1.5px] transition-all ${
                    form.sequences === n
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                      : "border-surface-200 dark:border-surface-600 text-surface-500 hover:border-primary-400 bg-white dark:bg-surface-800"
                  }`}
                >
                  {n}
                  <span className="block text-[9px] font-normal opacity-70">
                    {n === 2 ? (isFr ? "sem." : "sem.") : n === 3 ? (isFr ? "trim." : "terms") : (isFr ? "séqu." : "seq.")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Systems info badge */}
          {selectedSystems && selectedSystems.length > 0 && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
              <FiBookOpen className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 mb-1.5">
                  {isFr ? "Systèmes éducatifs de l'école" : "School educational systems"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSystems.map((sys) => {
                    const label = systemLabels[sys] || sys;
                    const colorClass = systemColors[sys] || "bg-surface-100 text-surface-600 border-surface-200";
                    const dotClass = systemDots[sys] || "bg-surface-400";
                    return (
                      <span
                        key={sys}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colorClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <button
            onClick={onClose}
            className="h-[44px] px-5 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
          >
            {isFr ? "Annuler" : "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || status === "past"}
            className="inline-flex items-center gap-2 h-[44px] px-6 rounded-xl bg-primary-900 text-white text-sm font-bold hover:bg-primary-700 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {isFr ? "Création..." : "Creating..."}
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" strokeWidth={2.5} />
                {isFr ? "Créer l'année" : "Create year"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function YearCard({ year, selected, onSelect }) {
  const Icon = year.icon;
  const labelColor = year.status === "future" ? year.iconColor : undefined;
  const selBorderColor = year.status === "active" ? "#085041" : year.status === "archive" ? "#F59E0B" : "#3B82F6";

  return (
    <div
      onClick={() => onSelect(year)}
      className={`relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-250 
        bg-white dark:bg-surface-800
        ${selected ? "shadow-lg -translate-y-1" : "shadow-sm hover:shadow-md hover:-translate-y-0.5"}`}
      style={{
        borderColor: selected ? selBorderColor : "#EEF0EC",
        boxShadow: selected
          ? `0 12px 40px rgba(${year.status === "active" ? "8,80,65" : year.status === "archive" ? "245,158,11" : "59,130,246"},0.15)`
          : undefined,
      }}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute top-0 left-[-100%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Accent bar */}
      <div
        className="h-[5px] w-full"
        style={{ background: `linear-gradient(90deg, ${year.accentFrom}, ${year.accentTo})` }}
      />

      {/* Body */}
      <div className="p-5 sm:p-[22px]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: Icon + Info */}
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-250"
              style={{ background: year.iconBg }}
            >
              <Icon className="w-[22px] h-[22px]" style={{ color: year.iconColor, strokeWidth: 1.8 }} />
            </div>
            <div>
              <div
                className="font-display text-[22px] font-bold leading-tight mb-1"
                style={{ color: labelColor || "#1A1F1B" }}
              >
                {year.name}
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-xs text-surface-400">
                  <FiBookOpen className="w-3 h-3" />
                  {year.system}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-surface-400">
                  <FiLayers className="w-3 h-3" />
                  {year.sequences} sequences
                </span>
                <span className="flex items-center gap-1.5 text-xs text-surface-400">
                  <FiClock className="w-3 h-3" />
                  {new Date(year.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} –{" "}
                  {new Date(year.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border"
                  style={{
                    background: year.status === "active" ? "rgba(8,80,65,0.08)" : year.status === "archive" ? "rgba(245,158,11,0.09)" : "rgba(59,130,246,0.08)",
                    color: year.iconColor,
                    borderColor: year.status === "active" ? "rgba(8,80,65,0.2)" : year.status === "archive" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.18)",
                  }}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full"
                    style={{
                      backgroundColor: year.status === "active" ? "#1D9E75" : year.status === "archive" ? "#F59E0B" : "#3B82F6",
                    }}
                  />
                  {year.badgeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Stats + Radio */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-3 sm:gap-5">
              {year.status === "future" ? (
                <>
                  <div className="text-center px-3 sm:px-4 py-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-100 dark:border-surface-700 min-w-[56px]">
                    <div className="text-lg font-extrabold text-surface-300 leading-none mb-0.5">—</div>
                    <div className="text-[10px] text-surface-400 font-medium">Students</div>
                  </div>
                  <div className="text-center px-3 sm:px-4 py-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-100 dark:border-surface-700 min-w-[56px]">
                    <div className="text-lg font-extrabold text-surface-300 leading-none mb-0.5">—</div>
                    <div className="text-[10px] text-surface-400 font-medium">Teachers</div>
                  </div>
                  <div className="text-center px-3 sm:px-4 py-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-100 dark:border-surface-700 min-w-[56px]">
                    <div className="text-lg font-extrabold text-surface-300 leading-none mb-0.5">—</div>
                    <div className="text-[10px] text-surface-400 font-medium">Classes</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center px-3 sm:px-4 py-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-100 dark:border-surface-700 min-w-[56px]">
                    <div className="text-lg font-extrabold text-surface-800 dark:text-surface-100 leading-none mb-0.5">{year.students}</div>
                    <div className="text-[10px] text-surface-400 font-medium">Students</div>
                  </div>
                  <div className="text-center px-3 sm:px-4 py-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-100 dark:border-surface-700 min-w-[56px]">
                    <div className="text-lg font-extrabold text-surface-800 dark:text-surface-100 leading-none mb-0.5">{year.teachers}</div>
                    <div className="text-[10px] text-surface-400 font-medium">Teachers</div>
                  </div>
                  <div className="text-center px-3 sm:px-4 py-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-100 dark:border-surface-700 min-w-[56px]">
                    <div className="text-lg font-extrabold text-surface-800 dark:text-surface-100 leading-none mb-0.5">{year.classes}</div>
                    <div className="text-[10px] text-surface-400 font-medium">Classes</div>
                  </div>
                </>
              )}
            </div>

            {/* Radio button */}
            <div
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-250 self-center ${
                selected ? "scale-110" : ""
              }`}
              style={
                selected
                  ? {
                      backgroundColor: year.status === "active" ? "#085041" : year.status === "archive" ? "#F59E0B" : "#3B82F6",
                      borderColor: year.status === "active" ? "#085041" : year.status === "archive" ? "#F59E0B" : "#3B82F6",
                    }
                  : { border: "2px solid #D8DBD5" }
              }
            >
              <div
                className={`w-[8px] h-[8px] rounded-full bg-white transition-all duration-200 ${
                  selected ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 sm:px-[22px] py-3 border-t border-surface-50 dark:border-surface-700/50 bg-surface-50 dark:bg-surface-800/30 flex items-center justify-between">
        <div className="flex-1 max-w-[300px]">
          <div className="flex justify-between mb-1">
            <span className="text-[11.5px] font-semibold text-surface-500">{year.footerLabel}</span>
            {year.status === "active" && (
              <span className="text-[11.5px] font-bold" style={{ color: year.iconColor }}>
                {year.footerPct}%
              </span>
            )}
            {year.status === "archive" && (
              <span className="text-[11.5px] font-bold" style={{ color: year.iconColor }}>
                {year.passRate}%
              </span>
            )}
          </div>              <div className="h-[5px] bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${year.footerPct}%`,
                    background: `linear-gradient(90deg, ${year.accentFrom}, ${year.accentTo})`,
                    transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: year.footerActionColor }}
        >
          <year.footerActionIcon className="w-3 h-3" />
          {year.footerAction}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export default function AcademicYearsPage() {
  const { i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const isFr = lang === "fr";
  const pc = primaryColor || "#085041";

  const [years, setYears] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load years from mock server
  useEffect(() => {
    fetch(`${MOCK_API}/academicYears`)
      .then((res) => res.json())
      .then((data) => {
        const transformed = (data || []).map(transformYear);
        setYears(transformed);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const selectedYear = years.find((y) => y.id === selectedId);

  // Group years by status
  const { activeYears, archiveYears, futureYears } = useMemo(() => {
    return {
      activeYears: years.filter((y) => y.status === "active"),
      archiveYears: years.filter((y) => y.status === "archive"),
      futureYears: years.filter((y) => y.status === "future"),
    };
  }, [years]);

  const handleSelect = (year) => {
    setSelectedId(year.id);
  };

  const handleEnter = () => {
    if (!selectedYear) {
      toast.error(isFr ? "Veuillez sélectionner une année" : "Please select a year");
      return;
    }

    setEntering(true);
    const status = selectedYear.status;
    const messages = {
      active: [isFr ? "Entrée dans l'année..." : "Entering academic year...", isFr ? "Chargement du tableau de bord" : "Loading your dashboard"],
      archive: [isFr ? "Chargement des archives..." : "Loading archive...", isFr ? "Mode lecture seule" : "Read-only mode"],
      future: [isFr ? "Ouverture du mode planification..." : "Opening planning mode...", isFr ? "Chargement de la configuration" : "Loading setup"],
    };
    const [msg, sub] = messages[status] || messages.active;

    setTimeout(() => {
      setEntering(false);
      toast.success(isFr ? "Redirection vers le tableau de bord" : "Redirecting to dashboard");
      navigate("/dashboard");
    }, 1800);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleYearCreated = (newYear) => {
    setYears((prev) => [newYear, ...prev]);
  };

  const schoolInitials = (user?.schoolName || "SC")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
          <div className="text-sm font-semibold text-surface-500">
            {isFr ? "Chargement des années académiques..." : "Loading academic years..."}
          </div>
          <div className="text-xs text-surface-400">
            {isFr ? "Préparation de votre espace de travail" : "Preparing your workspace"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col">
      {/* ── Loading overlay ── */}
      {entering && (
        <div className="fixed inset-0 bg-surface-50/90 dark:bg-surface-900/90 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
          <div className="w-[52px] h-[52px] rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
          <div className="text-sm font-semibold text-surface-500">
            {selectedYear?.status === "active"
              ? isFr ? "Entrée dans l'année..." : "Entering academic year..."
              : selectedYear?.status === "archive"
                ? isFr ? "Chargement des archives..." : "Loading archive..."
                : isFr ? "Ouverture du mode planification..." : "Opening planning mode..."}
          </div>
          <div className="text-xs text-surface-400">
            {selectedYear?.status === "active"
              ? isFr ? "Chargement de votre tableau de bord" : "Loading your dashboard"
              : selectedYear?.status === "archive"
                ? isFr ? "Mode lecture seule" : "Read-only mode"
                : isFr ? "Chargement de la configuration" : "Loading setup"}
          </div>
        </div>
      )}

      {/* ── Top Nav ── */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-[18px] bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-primary-900 flex items-center justify-center">
            <FiHome className="w-[17px] h-[17px] text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-surface-800 dark:text-surface-100">
            Akademee
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-100 dark:border-primary-800 flex items-center justify-center text-[11px] font-extrabold text-primary-900 dark:text-primary-100">
              {schoolInitials}
            </div>
            <div className="hidden sm:block">
              <div className="text-[13.5px] font-bold text-surface-800 dark:text-surface-100">
                {user?.schoolName || "Grace Bilingual Academy"}
              </div>
              <div className="text-[11.5px] text-surface-400">
                {user?.subdomain ? `${user.subdomain}.akademee.cm` : "school.akademee.cm"}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 bg-transparent border-none cursor-pointer px-3 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-all"
        >
          <FiLogOut className="w-3.5 h-3.5" />
          {isFr ? "Sortir" : "Sign out"}
        </button>
      </nav>

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden px-6 sm:px-10 py-[52px] text-center"
        style={{
          background: `linear-gradient(135deg, ${pc} 0%, #0a6650 60%, #0F6E56 100%)`,
          backgroundSize: "200% 200%",
        }}
      >
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-[600px] mx-auto">
          <div className="text-xs font-semibold tracking-[2px] uppercase text-white/55 mb-2.5">
            {isFr ? "Bon retour" : "Welcome back"}
          </div>
          <h1 className="font-display text-[clamp(24px,4vw,38px)] font-bold text-white leading-tight mb-2">
            {isFr
              ? "Sélectionnez l'année scolaire<br/>dans laquelle vous voulez travailler"
              : "Select the academic year<br/>you want to work in"}
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            {isFr
              ? "Choisissez l'année en cours pour gérer votre école, ou sélectionnez une année passée pour consulter les archives."
              : "Choose the current year to manage your school, or select a past year to consult archived data."}
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 max-w-[800px] w-full mx-auto px-4 sm:px-6 py-10 pb-20">
        {/* Archive notice */}
        {selectedYear?.status === "archive" && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.18)] text-sm text-surface-600 dark:text-surface-300 mb-4">
            <FiArchive className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            <span>
              {isFr
                ? `Vous êtes sur le point d'entrer dans ${selectedYear.name} en mode lecture seule. Vous pourrez consulter les notes, rapports et dossiers, mais pas faire de modifications.`
                : `You are about to enter ${selectedYear.name} in read-only mode. You will be able to view grades, reports and records, but not make any changes.`}
            </span>
          </div>
        )}

        {/* Active years */}
        {activeYears.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-surface-400">
                {isFr ? "Année en cours" : "Current year"}
              </span>
            </div>
            {activeYears.map((year) => (
              <YearCard key={year.id} year={year} selected={selectedId === year.id} onSelect={handleSelect} />
            ))}
          </>
        )}

        {/* Archive years */}
        {archiveYears.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-7 mb-4">
              <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-surface-400">
                {isFr ? "Années passées — Archives" : "Past years — Archives"}
              </span>
              <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2.5 py-0.5 rounded-full font-semibold">
                {isFr ? "Lecture seule" : "Read-only"}
              </span>
            </div>
            {archiveYears.map((year) => (
              <YearCard key={year.id} year={year} selected={selectedId === year.id} onSelect={handleSelect} />
            ))}
          </>
        )}

        {/* Future years */}
        {futureYears.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-7 mb-4">
              <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-surface-400">
                {isFr ? "Année à venir" : "Upcoming year"}
              </span>
            </div>
            {futureYears.map((year) => (
              <YearCard key={year.id} year={year} selected={selectedId === year.id} onSelect={handleSelect} />
            ))}
          </>
        )}

        {/* Submit area */}
        <div
          className="sticky bottom-0 mt-8 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6 pb-8 flex items-center justify-center gap-3"
          style={{
            background: `linear-gradient(to top, var(--color-surface-50, #F7F8F6) 60%, transparent)`,
          }}
        >
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 h-[52px] px-7 rounded-xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-600 
              text-sm font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all"
          >
            <FiPlus className="w-4 h-4" strokeWidth={2.5} />
            {isFr ? "Nouvelle année" : "New academic year"}
          </button>
          <button
            onClick={handleEnter}
            disabled={!selectedYear}
            className="inline-flex items-center gap-2 h-[52px] px-7 rounded-xl text-white text-[15px] font-bold 
              transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedYear?.status === "archive" ? "#F59E0B" : selectedYear?.status === "future" ? "#3B82F6" : pc,
              boxShadow: selectedYear
                ? `0 6px 20px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)`
                : undefined,
            }}
          >
            <FiArrowRight className="w-4 h-4" strokeWidth={2.5} />
            {!selectedYear
              ? isFr ? "Sélectionnez une année" : "Select a year to continue"
              : selectedYear.status === "active"
                ? isFr ? `Entrer ${selectedYear.name}` : `Enter ${selectedYear.name}`
                : selectedYear.status === "archive"
                  ? isFr ? `Consulter ${selectedYear.name}` : `View ${selectedYear.name}`
                  : isFr ? `Configurer ${selectedYear.name}` : `Configure ${selectedYear.name}`}
          </button>
        </div>
      </div>

      {/* Create Year Modal */}
      <CreateYearModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleYearCreated}
      />
    </div>
  );
}
