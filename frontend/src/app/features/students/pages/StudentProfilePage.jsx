import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getStudentById } from "../../../core/api/studentService";
import AddStudentDrawer from "../components/AddStudentDrawer";
import { FiUser, FiUsers } from "react-icons/fi";
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

  return (
    <div className="max-w-5xl mx-auto">
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
        <div className="lg:col-span-1">
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
              <div className="mt-3">
                <Badge status={student.status === "active" ? "active" : "inactive"} size="md">
                  {student.status === "active"
                    ? lang === "fr" ? "Actif" : "Active"
                    : student.status === "inactive"
                      ? lang === "fr" ? "Inactif" : "Inactive"
                      : student.status || "—"}
                </Badge>
              </div>

              <div className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-700">
                <Button
                  variant="primary"
                  onClick={() => setDrawerOpen(true)}
                  fullWidth
                >
                  {lang === "fr" ? "Modifier le profil" : "Edit Profile"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/dashboard/students")}
                  fullWidth
                  className="mt-2"
                >
                  {lang === "fr" ? "← Retour à la liste" : "← Back to list"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Status card */}
          <Card className="mt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-500">{lang === "fr" ? "Statut" : "Status"}</span>
                <Badge status={student.status === "active" ? "active" : "inactive"}>
                  {student.status === "active"
                    ? lang === "fr" ? "Actif" : "Active"
                    : student.status || "—"}
                </Badge>
              </div>
              {student.gender && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-500">{lang === "fr" ? "Genre" : "Gender"}</span>
                  <span className="text-sm text-surface-700 dark:text-surface-200">
                    {student.gender === "male"
                      ? lang === "fr" ? "Masculin" : "Male"
                      : student.gender === "female"
                        ? lang === "fr" ? "Féminin" : "Female"
                        : student.gender}
                  </span>
                </div>
              )}
              {student.dateOfBirth && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-surface-500">{lang === "fr" ? "Né(e) le" : "DOB"}</span>
                  <span className="text-sm text-surface-700 dark:text-surface-200">
                    {new Date(student.dateOfBirth).toLocaleDateString(
                      lang === "fr" ? "fr-FR" : "en-US"
                    )}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column — Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact info */}
          <Card title={lang === "fr" ? "Contact" : "Contact Information"}>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500">Email</span>
                <span className="text-sm text-surface-700 dark:text-surface-200">
                  {student.email || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500">{lang === "fr" ? "Téléphone" : "Phone"}</span>
                <span className="text-sm text-surface-700 dark:text-surface-200">
                  {student.phone || "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Academic info */}
          <Card title={lang === "fr" ? "Informations académiques" : "Academic Information"}>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500">{lang === "fr" ? "Classe" : "Class"}</span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  {student.className || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800">
                <span className="text-sm text-surface-500">{lang === "fr" ? "Date d'inscription" : "Enrollment Date"}</span>
                <span className="text-sm text-surface-700 dark:text-surface-200">
                  {student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString(
                        lang === "fr" ? "fr-FR" : "en-US"
                      )
                    : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Coming soon — Tabs for related data */}
          <Card>
            <div className="py-4 text-center">
              <p className="text-sm text-surface-400">
                {lang === "fr"
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
