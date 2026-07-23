import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getStudentById } from "../../../core/api/studentService";
import AddStudentDrawer from "../components/AddStudentDrawer";
import { FiUser, FiUsers, FiDollarSign, FiMapPin, FiBook, FiCalendar, FiPhone, FiMail, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";
import {
  Button,
  Card,
  Badge,
  Spinner,
  Skeleton,
  PageHeader,
  Tabs,
  EmptyState,
} from "../../../components";

export default function StudentProfilePage() {
  const { t, i18n } = useTranslation("common");
  const { id } = useParams();
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";

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
      setError(
        lang === "fr"
          ? "Élève introuvable"
          : "Student not found"
      );
    } finally {
      setLoading(false);
    }
  }, [id, lang]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleUpdated = () => {
    loadStudent();
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          icon={<FiUser className="w-6 h-6" />}
          title="..."
          subtitle={lang === "fr" ? "Chargement..." : "Loading..."}
        />
        <div className="space-y-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !student) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          icon={<FiUser className="w-6 h-6" />}
          title={lang === "fr" ? "Profil" : "Profile"}
          subtitle={lang === "fr" ? "Détails de l'élève" : "Student details"}
        />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-red-500 mb-4">{error || "Student not found"}</p>
            <div className="flex gap-3">
              <Button variant="primary" onClick={loadStudent}>
                {lang === "fr" ? "Réessayer" : "Retry"}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/dashboard/students")}>
                {lang === "fr" ? "Retour" : "Back"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Success state ──
  const initials = ((student.firstName?.[0] || "") + (student.lastName?.[0] || "")).toUpperCase();
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
  const isFr = lang === "fr";

  const feeBadgeColor = student.feeStatus === "paid" ? "bg-green-100 text-green-700" :
    student.feeStatus === "partial" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  const feeBadgeLabel = student.feeStatus === "paid" ? (isFr ? "Payé" : "Paid") :
    student.feeStatus === "partial" ? (isFr ? "Partiel" : "Partial") :
    student.feeStatus === "pending" ? (isFr ? "En attente" : "Pending") :
    (student.feeStatus || "—");

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header avec retour */}
      <PageHeader
        icon={initials || <FiUser className="w-6 h-6" />}
        title={fullName}
        subtitle={
          student.className
            ? `${student.className} ${student.studentNumber ? `· ${student.studentNumber}` : ""}`
            : student.studentNumber || ""
        }
        color="#085041"
      />

      {/* Info card + Edit button */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Student identity */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold mx-auto mb-4">
                {initials || <FiUser className="w-6 h-6" />}
              </div>
              <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">
                {fullName}
              </h2>
              <p className="text-sm text-surface-400 mt-1">
                {student.studentNumber || `#${student.id?.slice(0, 8)}`}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge status={student.status === "active" ? "active" : "inactive"} size="md">
                  {student.status === "active"
                    ? isFr ? "Actif" : "Active"
                    : student.status === "inactive"
                      ? isFr ? "Inactif" : "Inactive"
                      : student.status || "—"}
                </Badge>
                {student.feeStatus && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${feeBadgeColor}`}>
                    <FiDollarSign className="w-3 h-3" />
                    {feeBadgeLabel}
                  </span>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-700">
                <Button
                  variant="primary"
                  onClick={() => setDrawerOpen(true)}
                  fullWidth
                >
                  {isFr ? "Modifier le profil" : "Edit Profile"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/dashboard/students")}
                  fullWidth
                  className="mt-2"
                >
                  {isFr ? "← Retour à la liste" : "← Back to list"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Info */}
          <Card>
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                {isFr ? "Informations personnelles" : "Personal Info"}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-400">{isFr ? "Statut" : "Status"}</span>
                <Badge status={student.status === "active" ? "active" : "inactive"}>
                  {student.status === "active"
                    ? isFr ? "Actif" : "Active"
                    : student.status || "—"}
                </Badge>
              </div>
              {student.gender && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-400">{isFr ? "Genre" : "Gender"}</span>
                  <span className="text-sm text-surface-700 dark:text-surface-200 font-medium">
                    {student.gender === "male"
                      ? isFr ? "Masculin" : "Male"
                      : student.gender === "female"
                        ? isFr ? "Féminin" : "Female"
                        : student.gender}
                  </span>
                </div>
              )}
              {student.dateOfBirth && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-400">{isFr ? "Né(e) le" : "Date of birth"}</span>
                  <span className="text-sm text-surface-700 dark:text-surface-200 font-medium">
                    {new Date(student.dateOfBirth).toLocaleDateString(
                      isFr ? "fr-FR" : "en-US"
                    )}
                  </span>
                </div>
              )}
              {student.nationality && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-400">{isFr ? "Nationalité" : "Nationality"}</span>
                  <span className="text-sm text-surface-700 dark:text-surface-200 font-medium">
                    {student.nationality}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Financial Status Card */}
          <Card>
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider flex items-center gap-1.5">
                <FiDollarSign className="w-3 h-3" />
                {isFr ? "Situation financière" : "Financial Status"}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-400">{isFr ? "Statut des frais" : "Fee Status"}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${feeBadgeColor}`}>
                  {feeBadgeLabel}
                </span>
              </div>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/dashboard/students/${student.id}/fees`)}
                  fullWidth
                  size="sm"
                >
                  {isFr ? "Voir les détails" : "View details"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column — Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact info */}
          <Card title={isFr ? "Contact" : "Contact Information"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <FiMail className="w-4 h-4 text-surface-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">{isFr ? "Email" : "Email"}</p>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-200 break-all">
                    {student.email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <FiPhone className="w-4 h-4 text-surface-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">{isFr ? "Téléphone" : "Phone"}</p>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                    {student.phone || "—"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Academic info */}
          <Card title={isFr ? "Informations académiques" : "Academic Information"}>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500 flex items-center gap-2">
                  <FiBook className="w-3.5 h-3.5 text-surface-400" />
                  {isFr ? "Classe" : "Class"}
                </span>
                <span className="text-sm font-bold text-surface-700 dark:text-surface-200">
                  {student.className || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500 flex items-center gap-2">
                  <FiMapPin className="w-3.5 h-3.5 text-surface-400" />
                  {isFr ? "Numéro étudiant" : "Student Number"}
                </span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  {student.studentNumber || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500 flex items-center gap-2">
                  <FiBook className="w-3.5 h-3.5 text-surface-400" />
                  {isFr ? "Système éducatif" : "Educational System"}
                </span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  {student.educationalSystem || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500 flex items-center gap-2">
                  <FiCalendar className="w-3.5 h-3.5 text-surface-400" />
                  {isFr ? "Date d'inscription" : "Enrollment Date"}
                </span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  {student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString(
                        isFr ? "fr-FR" : "en-US"
                      )
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500 flex items-center gap-2">
                  <FiClock className="w-3.5 h-3.5 text-surface-400" />
                  {isFr ? "Redoublant" : "Repeater"}
                </span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  {isFr ? "Non" : "No"}
                </span>
              </div>
            </div>
          </Card>

          {/* Notes, Présences, Frais tabs placeholder */}
          <Card>
            <div className="py-4 text-center">
              <p className="text-sm text-surface-400">
                {isFr
                  ? "Les sections Notes, Présences et Frais seront disponibles après la configuration complète"
                  : "Grades, Attendance and Fees sections will be available after full setup"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Drawer */}
      <AddStudentDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleUpdated}
        student={student}
      />
    </div>
  );
}
