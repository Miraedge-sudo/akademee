import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getStudents, deleteStudent } from "../../../core/api/studentService";
import { YearContext } from "../../../core/context/YearContext";
import AddStudentDrawer from "../components/AddStudentDrawer";
import { FiUsers } from "react-icons/fi";
import {
  Button,
  Card,
  Modal,
  Badge,
  EmptyState,
  Table,
  PageHeader,
  Skeleton,
} from "../../../components";

export default function StudentsListPage() {
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";
  const navigate = useNavigate();

  const { selectedYearId } = useContext(YearContext);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = useCallback(async () => {
    const filter = selectedYearId ? { academicYearId: selectedYearId } : {};
    try {
      setLoading(true);
      setError(null);
      const data = await getStudents({ ...filter });
      const list = Array.isArray(data) ? data : data?.students || data?.rows || [];
      setStudents(list);
    } catch (err) {
      console.error("Failed to load students:", err);
      setError(
        lang === "fr"
          ? "Erreur lors du chargement des élèves"
          : "Failed to load students"
      );
    } finally {
      setLoading(false);
    }
  }, [lang, yearFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ── Drawer handlers ──
  const openCreateDrawer = () => {
    setEditingStudent(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (student) => {
    setEditingStudent(student);
    setDrawerOpen(true);
  };

  const handleDrawerSuccess = () => {
    loadStudents();
  };

  // ── Delete handler ──
  const openDeleteModal = (student) => {
    setDeletingStudent(student);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      await deleteStudent(deletingStudent.id);
      toast.success(lang === "fr" ? "Élève supprimé" : "Student deleted");
      setDeleteModalOpen(false);
      setDeletingStudent(null);
      loadStudents();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (lang === "fr"
          ? "Erreur lors de la suppression"
          : "Failed to delete student");
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Table columns ──
  const columns = [
    {
      key: "name",
      label: lang === "fr" ? "Élève" : "Student",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold flex-shrink-0">
            {((row.firstName?.[0] || "") + (row.lastName?.[0] || "")).toUpperCase() || "?"}
          </div>
          <div>
            <div className="font-medium text-surface-800 dark:text-surface-100">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-surface-400">
              {row.studentNumber || row.matricule || `#${row.id?.slice(0, 8)}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "className",
      label: lang === "fr" ? "Classe" : "Class",
      width: 160,
      sortable: true,
      render: (val) => (
        <span className="text-sm text-surface-600 dark:text-surface-400">
          {val || "—"}
        </span>
      ),
    },
    {
      key: "gender",
      label: lang === "fr" ? "Genre" : "Gender",
      width: 90,
      render: (val) => (
        <span className="text-sm text-surface-500 dark:text-surface-400">
          {val === "male"
            ? lang === "fr" ? "M" : "M"
            : val === "female"
              ? lang === "fr" ? "F" : "F"
              : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: lang === "fr" ? "Statut" : "Status",
      width: 100,
      render: (val) => (
        <Badge status={val === "active" ? "active" : "inactive"}>
          {val === "active"
            ? lang === "fr" ? "Actif" : "Active"
            : val === "inactive"
              ? lang === "fr" ? "Inactif" : "Inactive"
              : val || "—"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 100,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDrawer(row)}
          >
            {lang === "fr" ? "Modifier" : "Edit"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={() => openDeleteModal(row)}
          >
            {lang === "fr" ? "Suppr." : "Del"}
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ──
  if (error && !loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          icon={<FiUsers className="w-6 h-6" />}
          title={lang === "fr" ? "Élèves" : "Students"}
          subtitle={lang === "fr" ? "Gérer les élèves inscrits" : "Manage enrolled students"}
        />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button variant="primary" onClick={loadStudents}>
              {lang === "fr" ? "Réessayer" : "Retry"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        icon={<FiUsers className="w-6 h-6" />}
        title={lang === "fr" ? "Élèves" : "Students"}
        subtitle={
          lang === "fr"
            ? "Gérer les élèves inscrits dans l'établissement"
            : "Manage students enrolled in your school"
        }
      />

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton variant="table" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<FiUsers className="w-8 h-8" />}
              title={lang === "fr" ? "Aucun élève" : "No students yet"}
              subtitle={
                lang === "fr"
                  ? "Commencez par ajouter votre premier élève"
                  : "Start by adding your first student"
              }
              action={
                <Button variant="primary" onClick={openCreateDrawer}>
                  {lang === "fr" ? "+ Ajouter un élève" : "+ Add Student"}
                </Button>
              }
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={students}
            searchable
            searchPlaceholder={
              lang === "fr"
                ? "Rechercher un élève..."
                : "Search students..."
            }
            emptyMessage={
              lang === "fr"
                ? "Aucun élève trouvé"
                : "No students found"
            }
            onRowClick={(row) => navigate(`/dashboard/students/${row.id}`)}
            headerExtra={
              <Button variant="primary" size="sm" onClick={openCreateDrawer}>
                {lang === "fr" ? "+ Nouveau" : "+ New"}
              </Button>
            }
          />
        )}
      </Card>

      {/* Create / Edit Drawer */}
      <AddStudentDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingStudent(null);
        }}
        onSuccess={handleDrawerSuccess}
        student={editingStudent}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={lang === "fr" ? "Confirmer la suppression" : "Confirm Deletion"}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              fullWidth
            >
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              fullWidth
            >
              {lang === "fr" ? "Supprimer" : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-surface-600 dark:text-surface-300">
          {lang === "fr"
            ? `Êtes-vous sûr de vouloir supprimer ${deletingStudent?.firstName} ${deletingStudent?.lastName} ? Cette action est irréversible.`
            : `Are you sure you want to delete ${deletingStudent?.firstName} ${deletingStudent?.lastName}? This action cannot be undone.`}
        </p>
      </Modal>
    </div>
  );
}
