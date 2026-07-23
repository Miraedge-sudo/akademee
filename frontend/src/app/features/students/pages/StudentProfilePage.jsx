import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import { getStudentById } from "../../../core/api/studentService";
import UserEditDrawer from "../../../components/ui/UserEditDrawer";
import {
  FiUser, FiUsers, FiDollarSign, FiBook, FiCalendar,
  FiPhone, FiMail, FiClock, FiEdit2, FiArrowLeft, FiHash,
  FiChevronRight, FiBookOpen, FiCreditCard, FiCheckCircle,
  FiGlobe, FiTrendingUp, FiAward, FiActivity, FiUserCheck
} from "react-icons/fi";

// ── Helper: hex → rgba ──
function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) {
    return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  }
  // Fallback — extract RGB from a hex like #085041
  const fallback = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec("#085041");
  if (fallback) {
    return `rgba(${parseInt(fallback[1], 16)}, ${parseInt(fallback[2], 16)}, ${parseInt(fallback[3], 16)}, ${alpha})`;
  }
  return `rgba(0, 0, 0, ${alpha})`;
}

// ── Reusable info row ──
function InfoRow({ icon, label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
      <span className="flex items-center gap-2 text-[13px] text-surface-500 dark:text-surface-400">
        {icon && <span className="text-surface-400 dark:text-surface-500 w-4 h-4 flex-shrink-0">{icon}</span>}
        {label}
      </span>
      <span className={`text-[13px] font-semibold text-surface-800 dark:text-surface-100 text-right ml-4 ${accent || ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Stat card ──
function StatCard({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: hexToRgba(color || "#085041", 0.08) }}
      >
        <span style={{ color: color || "#085041" }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[18px] font-bold text-surface-900 dark:text-surface-100 leading-tight">{value}</p>
        <p className="text-[11px] text-surface-400 truncate">{label}</p>
      </div>
    </div>
  );
}

// ── Contact chip ──
function ContactChip({ icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
      <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        <span className="text-primary-600 dark:text-primary-400">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
        <p className="text-[13px] font-medium text-surface-800 dark:text-surface-100 truncate">{value || "—"}</p>
      </div>
    </div>
  );

  if (href && value) {
    return <a href={href} className="block">{content}</a>;
  }
  return content;
}

export default function StudentProfilePage() {
  const { i18n } = useTranslation("common");
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { primaryColor } = useTheme();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const isFr = lang === "fr";
  const pc = primaryColor || "#085041";

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadStudent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentById(id);
      setStudent(data);
    } catch (err) {
      console.error("Failed to load student:", err);
      setError(isFr ? "Élève introuvable" : "Student not found");
    } finally {
      setLoading(false);
    }
  }, [id, isFr]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  // ── Auto-open drawer if ?edit=true ──
  useEffect(() => {
    if (!loading && student && searchParams.get("edit") === "true") {
      setDrawerOpen(true);
      // Clean the URL — remove ?edit=true
      setSearchParams({}, { replace: true });
    }
  }, [loading, student, searchParams, setSearchParams]);

  const handleUpdated = () => {
    loadStudent();
  };

  // ── Derived values ──
  const initials = useMemo(() =>
    ((student?.firstName?.[0] || "") + (student?.lastName?.[0] || "")).toUpperCase(),
    [student]
  );

  const fullName = useMemo(() =>
    `${student?.firstName || ""} ${student?.lastName || ""}`.trim(),
    [student]
  );

  const feeConfig = useMemo(() => {
    const status = student?.feeStatus;
    if (status === "paid") return { color: "#1D9E75", bg: "rgba(29,158,117,0.08)", label: isFr ? "Payé" : "Paid" };
    if (status === "partial") return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", label: isFr ? "Partiel" : "Partial" };
    return { color: "#EF4444", bg: "rgba(239,68,68,0.08)", label: isFr ? "En attente" : "Pending" };
  }, [student, isFr]);

  const statusConfig = useMemo(() => {
    const st = student?.status;
    if (st === "active") return { color: "#1D9E75", bg: "#E8F5EF", label: isFr ? "Actif" : "Active" };
    return { color: "#9BA59C", bg: "#F0F1EE", label: isFr ? "Inactif" : "Inactive" };
  }, [student, isFr]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Skeleton Header */}
        <div className="animate-pulse mb-6">
          <div className="h-4 w-48 bg-surface-200 dark:bg-surface-700 rounded mb-4" />
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-white/10 rounded" />
                <div className="h-4 w-24 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" />
            ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !student) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <FiUser className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
            {isFr ? "Profil introuvable" : "Profile not found"}
          </h2>
          <p className="text-sm text-surface-400 mb-6 max-w-md">
            {error || (isFr ? "Cet étudiant n'existe pas ou a été supprimé." : "This student does not exist or has been deleted.")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={loadStudent}
              className="h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: "#085041" }}
            >
              {isFr ? "Réessayer" : "Retry"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="h-10 px-5 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all"
            >
              {isFr ? "← Retour" : "← Back"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ──
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-12">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400 mb-5">
        <button onClick={() => navigate(-1)} className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <FiArrowLeft className="w-3.5 h-3.5" />
          {isFr ? "Retour" : "Back"}
        </button>
        <FiChevronRight className="w-3 h-3" />
        <span className="text-surface-700 dark:text-surface-300 font-medium truncate max-w-[200px]">{fullName}</span>
      </nav>

      {/* ── Hero Card ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 mb-6 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/[0.02] rounded-full translate-y-1/2" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold ring-4 ring-white/20">
              {initials}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: pc, backgroundColor: student.status === "active" ? "#1D9E75" : "#9BA59C" }}
              style={{ backgroundColor: student.status === "active" ? "#1D9E75" : "#9BA59C" }}
            >
              {student.status === "active" ? (
                <FiCheckCircle className="w-3 h-3 text-white" />
              ) : (
                <FiClock className="w-2.5 h-2.5 text-white" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-white/70">
                {student.className || (isFr ? "Non assigné" : "Not assigned")}
              </span>
              {student.studentNumber && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-sm text-white/70 font-mono">{student.studentNumber}</span>
                </>
              )}
              <span className="text-white/30">·</span>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: statusConfig.bg, color: statusConfig.color }}
              >
                {statusConfig.label}
              </span>
              {student.educationalSystem && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80">
                    {student.educationalSystem}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-all backdrop-blur-sm"
            >
              <FiEdit2 className="w-4 h-4" />
              {isFr ? "Modifier" : "Edit"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white/10 text-white/70 text-sm font-medium hover:bg-white/20 hover:text-white transition-all"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isFr ? "Retour" : "Back"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
          <p className="text-lg font-bold text-white">{student.className ? "1" : "—"}</p>
            <p className="text-[11px] text-white/60">{isFr ? "Classe" : "Class"}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{student.studentNumber ? student.studentNumber.slice(-4) : "—"}</p>
            <p className="text-[11px] text-white/60">{isFr ? "Matricule" : "ID"}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white" style={{ color: feeConfig.color }}>
              {feeConfig.label}
            </p>
            <p className="text-[11px] text-white/60">{isFr ? "Frais" : "Fees"}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{student.gender === "male" ? (isFr ? "M" : "M") : student.gender === "female" ? (isFr ? "F" : "F") : "—"}</p>
            <p className="text-[11px] text-white/60">{isFr ? "Genre" : "Gender"}</p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="lg:col-span-1 space-y-4">
          {/* Personal Info Card */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <FiUser className="w-3.5 h-3.5" />
                {isFr ? "Informations personnelles" : "Personal Info"}
              </h3>
            </div>
            <div className="p-4 space-y-0.5">
              <InfoRow
                icon={<FiUserCheck className="w-3.5 h-3.5" />}
                label={isFr ? "Statut" : "Status"}
                value={
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: statusConfig.bg, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                }
              />
              {student.gender && (
                <InfoRow
                  icon={<FiUsers className="w-3.5 h-3.5" />}
                  label={isFr ? "Genre" : "Gender"}
                  value={
                    student.gender === "male"
                      ? isFr ? "Masculin" : "Male"
                      : student.gender === "female"
                        ? isFr ? "Féminin" : "Female"
                        : student.gender
                  }
                />
              )}
              <InfoRow
                icon={<FiCalendar className="w-3.5 h-3.5" />}
                label={isFr ? "Date de naissance" : "Date of Birth"}
                value={student.dateOfBirth
                  ? new Date(student.dateOfBirth).toLocaleDateString(isFr ? "fr-FR" : "en-US")
                  : <span className="text-surface-300 italic">{isFr ? "Non renseignée" : "Not set"}</span>
                }
              />
              {student.nationality && (
                <InfoRow
                  icon={<FiGlobe className="w-3.5 h-3.5" />}
                  label={isFr ? "Nationalité" : "Nationality"}
                  value={student.nationality}
                />
              )}
            </div>
          </div>

          {/* Financial Status Card */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <FiCreditCard className="w-3.5 h-3.5" />
                {isFr ? "Situation financière" : "Financial Status"}
              </h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: feeConfig.bg }}>
                <span className="text-[13px] font-medium text-surface-600 dark:text-surface-300">
                  {isFr ? "Statut des frais" : "Fee Status"}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: `${feeConfig.color}18`, color: feeConfig.color }}
                >
                  <FiDollarSign className="w-3 h-3" />
                  {feeConfig.label}
                </span>
              </div>
              <button
                onClick={() => navigate(`/dashboard/students/${student.id}/fees`)}
                className="w-full mt-3 h-10 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all flex items-center justify-center gap-2"
              >
                <FiTrendingUp className="w-3.5 h-3.5" />
                {isFr ? "Voir les détails" : "View details"}
              </button>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <FiMail className="w-3.5 h-3.5" />
                {isFr ? "Compte" : "Account"}
              </h3>
            </div>
            <div className="p-4 space-y-0.5">
              <InfoRow
                icon={<FiMail className="w-3.5 h-3.5" />}
                label="Email"
                value={student.email || "—"}
              />
              <InfoRow
                icon={<FiPhone className="w-3.5 h-3.5" />}
                label={isFr ? "Téléphone" : "Phone"}
                value={student.phone || "—"}
              />
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact Information */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <FiPhone className="w-3.5 h-3.5" />
                {isFr ? "Coordonnées" : "Contact Information"}
              </h3>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ContactChip
                  icon={<FiMail className="w-4 h-4" />}
                  label="Email"
                  value={student.email}
                  href={student.email ? `mailto:${student.email}` : null}
                />
                <ContactChip
                  icon={<FiPhone className="w-4 h-4" />}
                  label={isFr ? "Téléphone" : "Phone"}
                  value={student.phone}
                  href={student.phone ? `tel:${student.phone}` : null}
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <FiBookOpen className="w-3.5 h-3.5" />
                {isFr ? "Informations académiques" : "Academic Information"}
              </h3>
            </div>
            <div className="p-4 space-y-0.5">
              <InfoRow
                icon={<FiBook className="w-3.5 h-3.5" />}
                label={isFr ? "Classe" : "Class"}
                value={
                  <span className="font-bold">{student.className || "—"}</span>
                }
              />
              <InfoRow
                icon={<FiHash className="w-3.5 h-3.5" />}
                label={isFr ? "Numéro étudiant" : "Student Number"}
                value={student.studentNumber || "—"}
              />
              <InfoRow
                icon={<FiAward className="w-3.5 h-3.5" />}
                label={isFr ? "Système éducatif" : "Educational System"}
                value={
                  student.educationalSystem ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(139,92,246,0.08)", color: "#8B5CF6" }}>
                      {student.educationalSystem}
                    </span>
                  ) : "—"
                }
              />
              <InfoRow
                icon={<FiCalendar className="w-3.5 h-3.5" />}
                label={isFr ? "Date d'inscription" : "Enrollment Date"}
                value={
                  student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString(isFr ? "fr-FR" : "en-US")
                    : "—"
                }
              />
              <InfoRow
                icon={<FiActivity className="w-3.5 h-3.5" />}
                label={isFr ? "Redoublant" : "Repeater"}
                value={isFr ? "Non" : "No"}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<FiBook className="w-4 h-4" />}
              label={isFr ? "Matières" : "Subjects"}
              value={student.className ? "—" : "—"}
              color="#3B82F6"
            />
            <StatCard
              icon={<FiUsers className="w-4 h-4" />}
              label={isFr ? "Camarades" : "Classmates"}
              value="—"
              color="#8B5CF6"
            />
            <StatCard
              icon={<FiTrendingUp className="w-4 h-4" />}
              label={isFr ? "Moyenne" : "Average"}
              value="—"
              color="#1D9E75"
            />
            <StatCard
              icon={<FiClock className="w-4 h-4" />}
              label={isFr ? "Présences" : "Attendance"}
              value="—"
              color="#F59E0B"
            />
          </div>

          {/* Placeholder for future sections */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="px-5 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
                <FiActivity className="w-5 h-5 text-surface-400" />
              </div>
              <p className="text-[13px] text-surface-400 max-w-sm mx-auto leading-relaxed">
                {isFr
                  ? "Les sections Notes, Présences et Bulletins seront disponibles après la configuration complète"
                  : "Grades, Attendance and Report Cards sections will be available after full setup"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <UserEditDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleUpdated}
        user={student}
        role="STUDENT"
      />
    </div>
  );
}
