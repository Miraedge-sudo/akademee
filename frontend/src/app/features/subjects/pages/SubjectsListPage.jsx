import { useState, useEffect, useCallback, useContext } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../../core/api/subjectService";
import { YearContext } from "../../../core/context/YearContext";
import { FiBook } from "react-icons/fi";
import {
  Button,
  Card,
  Drawer,
  Input,
  Modal,
  Badge,
  EmptyState,
  Table,
  PageHeader,
  Skeleton,
} from "../../../components";

export default function SubjectsListPage() {
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const { selectedYearId } = useContext(YearContext);

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", coefficient: 1 });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSubjects = useCallback(async () => {
    const filter = selectedYearId ? { academicYearId: selectedYearId } : {};
    try {
      setLoading(true);
      setError(null);
      const data = await getSubjects({ ...filter });
      setSubjects(Array.isArray(data) ? data : data?.subjects || data?.rows || []);
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setError(lang === "fr" ? "Erreur lors du chargement des matières" : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [lang, selectedYearId]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  // ── Open drawer for create ──
  const openCreateDrawer = () => {
    setEditingSubject(null);
    setFormData({ name: "", code: "", coefficient: 1 });
    setFormErrors({});
    setDrawerOpen(true);
  };

  // ── Open drawer for edit ──
  const openEditDrawer = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || "",
      code: subject.code || "",
      coefficient: subject.coefficient ?? 1,
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  // ── Validate form ──
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = lang === "fr" ? "Le nom est requis" : "Name is required";
    }
    const coeff = Number(formData.coefficient);
    if (coeff < 1 || coeff > 10 || isNaN(coeff)) {
      errors.coefficient = lang === "fr" ? "Le coefficient doit être entre 1 et 10" : "Coefficient must be between 1 and 10";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Save subject ──
  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        coefficient: Number(formData.coefficient),
      };

      if (editingSubject) {
        await updateSubject(editingSubject.id, payload);
        toast.success(lang === "fr" ? "Matière mise à jour" : "Subject updated");
      } else {
        await createSubject(payload);
        toast.success(lang === "fr" ? "Matière créée" : "Subject created");
      }

      setDrawerOpen(false);
      loadSubjects();
    } catch (err) {
      const msg = err?.response?.data?.message || (lang === "fr" ? "Erreur lors de l'enregistrement" : "Failed to save subject");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete subject ──
  const openDeleteModal = (subject) => {
    setDeletingSubject(subject);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;
    setDeleting(true);
    try {
      await deleteSubject(deletingSubject.id);
      toast.success(lang === "fr" ? "Matière supprimée" : "Subject deleted");
      setDeleteModalOpen(false);
      setDeletingSubject(null);
      loadSubjects();
    } catch (err) {
      const msg = err?.response?.data?.message || (lang === "fr" ? "Erreur lors de la suppression" : "Failed to delete subject");
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Table columns ──
  const columns = [
    {
      key: "name",
      label: lang === "fr" ? "Matière" : "Subject",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold flex-shrink-0">
            {val.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-surface-800 dark:text-surface-100">
              {val}
            </div>
            {row.code && (
              <div className="text-xs text-surface-400">{row.code}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "code",
      label: lang === "fr" ? "Code" : "Code",
      width: 120,
      render: (val) => (
        <span className="text-sm text-surface-500 dark:text-surface-400 font-mono">
          {val || "—"}
        </span>
      ),
    },
    {
      key: "coefficient",
      label: lang === "fr" ? "Coefficient" : "Coefficient",
      width: 120,
      sortable: true,
      render: (val) => (
        <Badge variant="outline" scheme="info">
          x{val ?? 1}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: lang === "fr" ? "Statut" : "Status",
      width: 100,
      render: (val) => (
        <Badge status={val !== false ? "active" : "inactive"}>
          {val !== false
            ? lang === "fr" ? "Actif" : "Active"
            : lang === "fr" ? "Inactif" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 100,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); openEditDrawer(row); }}
          >
            {lang === "fr" ? "Modifier" : "Edit"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={(e) => { e.stopPropagation(); openDeleteModal(row); }}
          >
            {lang === "fr" ? "Suppr." : "Del"}
          </Button>
        </div>
      ),
    },
  ];

  // ── Content ──
  if (error && !loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          icon={<FiBook className="w-6 h-6" />}
          title={lang === "fr" ? "Matières" : "Subjects"}
          subtitle={lang === "fr" ? "Gérer les matières enseignées" : "Manage your subjects"}
        />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button variant="primary" onClick={loadSubjects}>
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
        icon={<FiBook className="w-6 h-6" />}
        title={lang === "fr" ? "Matières" : "Subjects"}
        subtitle={lang === "fr" ? "Gérer les matières enseignées dans votre établissement" : "Manage subjects taught in your school"}
      />

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton variant="table" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<FiBook className="w-8 h-8" />}
              title={lang === "fr" ? "Aucune matière" : "No subjects"}
              subtitle={
                lang === "fr"
                  ? "Commencez par ajouter des matières comme Mathématiques, Français, Anglais..."
                  : "Start by adding subjects like Mathematics, French, English..."
              }
              action={
                <Button variant="primary" onClick={openCreateDrawer}>
                  {lang === "fr" ? "+ Ajouter une matière" : "+ Add Subject"}
                </Button>
              }
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={subjects}
            searchable
            searchPlaceholder={lang === "fr" ? "Rechercher une matière..." : "Search subjects..."}
            emptyMessage={lang === "fr" ? "Aucune matière trouvée" : "No subjects found"}
            onRowClick={(row) => openEditDrawer(row)}
            headerExtra={
              <Button variant="primary" size="sm" onClick={openCreateDrawer}>
                {lang === "fr" ? "+ Nouvelle" : "+ New"}
              </Button>
            }
          />
        )}
      </Card>

      {/* Create/Edit Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          editingSubject
            ? lang === "fr"
              ? `Modifier ${editingSubject.name}`
              : `Edit ${editingSubject.name}`
            : lang === "fr"
              ? "Nouvelle matière"
              : "New Subject"
        }
        size="sm"
      >
        <div className="space-y-5">
          <Input
            label={lang === "fr" ? "Nom de la matière" : "Subject Name"}
            placeholder={
              lang === "fr"
                ? "Ex: Mathématiques, Français..."
                : "E.g.: Mathematics, French..."
            }
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            autoFocus
          />

          <Input
            label={lang === "fr" ? "Code (optionnel)" : "Code (optional)"}
            placeholder={
              lang === "fr" ? "Ex: MATH, FR, ANG..." : "E.g.: MATH, FR, ENG..."
            }
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            hint={
              lang === "fr"
                ? "Code abrégé pour identifier la matière"
                : "Short code to identify the subject"
            }
          />

          <Input
            label={lang === "fr" ? "Coefficient" : "Coefficient"}
            type="number"
            min={1}
            max={10}
            value={formData.coefficient}
            onChange={(e) =>
              setFormData({ ...formData, coefficient: e.target.value })
            }
            error={formErrors.coefficient}
            hint={
              lang === "fr"
                ? "Entre 1 et 10 (défaut: 1)"
                : "Between 1 and 10 (default: 1)"
            }
          />

          <div className="flex gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button
              variant="secondary"
              onClick={() => setDrawerOpen(false)}
              fullWidth
            >
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              fullWidth
            >
              {editingSubject
                ? lang === "fr" ? "Mettre à jour" : "Update"
                : lang === "fr" ? "Créer" : "Create"}
            </Button>
          </div>
        </div>
      </Drawer>

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
            ? `Êtes-vous sûr de vouloir supprimer la matière "${deletingSubject?.name}" ? Cette action est irréversible.`
            : `Are you sure you want to delete "${deletingSubject?.name}"? This action cannot be undone.`}
        </p>
      </Modal>
    </div>
  );
}
