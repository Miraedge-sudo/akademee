import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deleteAcademicYear,
  getTerms,
  createTerm,
  deleteTerm,
} from "../../../core/api/academicYearService";
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
import { FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";

export default function AcademicYearsPage() {
  const { i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    year: "",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingYear, setDeletingYear] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Terms state — expanded view for each year
  const [expandedYearId, setExpandedYearId] = useState(null);
  const [terms, setTerms] = useState([]);
  const [termsLoading, setTermsLoading] = useState(false);

  // Terms creation
  const [termFormOpen, setTermFormOpen] = useState(false);
  const [termData, setTermData] = useState({
    name: "",
    academicYearId: "",
    startDate: "",
    endDate: "",
  });
  const [termSaving, setTermSaving] = useState(false);

  const loadYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAcademicYears();
      const list = Array.isArray(data) ? data : data?.years || data?.rows || [];
      setYears(list);
    } catch (err) {
      console.error("Failed to load academic years:", err);
      setError(
        lang === "fr"
          ? "Erreur lors du chargement des années"
          : "Failed to load academic years"
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  // ── Load terms for a year ──
  const loadTerms = async (yearId) => {
    setTermsLoading(true);
    try {
      const data = await getTerms({ academicYearId: yearId });
      const list = Array.isArray(data) ? data : data?.terms || data?.rows || [];
      setTerms(list);
      setExpandedYearId(yearId);
    } catch (err) {
      console.error("Failed to load terms:", err);
      toast.error(lang === "fr" ? "Erreur de chargement des trimestres" : "Failed to load terms");
    } finally {
      setTermsLoading(false);
    }
  };

  // ── Drawer handlers ──
  const openCreateDrawer = () => {
    setEditingYear(null);
    setFormData({ year: "", startDate: "", endDate: "" });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (year) => {
    setEditingYear(year);
    setFormData({
      year: year.year || year.name || "",
      startDate: year.startDate ? year.startDate.split("T")[0] : "",
      endDate: year.endDate ? year.endDate.split("T")[0] : "",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.year.trim())
      errs.year = lang === "fr" ? "Le nom est requis" : "Year name is required";
    if (!formData.startDate)
      errs.startDate = lang === "fr" ? "La date de début est requise" : "Start date is required";
    if (!formData.endDate)
      errs.endDate = lang === "fr" ? "La date de fin est requise" : "End date is required";
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate)
      errs.endDate = lang === "fr" ? "La date de fin doit être après la date de début" : "End date must be after start date";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        year: formData.year.trim(),
        name: formData.year.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      if (editingYear) {
        await updateAcademicYear(editingYear.id, payload);
        toast.success(lang === "fr" ? "Année mise à jour" : "Year updated");
      } else {
        await createAcademicYear(payload);
        toast.success(lang === "fr" ? "Année créée" : "Year created");
      }

      setDrawerOpen(false);
      loadYears();
    } catch (err) {
      const msg = err?.response?.data?.message ||
        (lang === "fr" ? "Erreur lors de l'enregistrement" : "Failed to save year");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Activate year ──
  const handleActivate = async (year) => {
    try {
      await activateAcademicYear(year.id);
      toast.success(lang === "fr" ? "Année activée" : "Year activated");
      loadYears();
    } catch (err) {
      const msg = err?.response?.data?.message ||
        (lang === "fr" ? "Erreur lors de l'activation" : "Failed to activate year");
      toast.error(msg);
    }
  };

  // ── Delete year ──
  const openDeleteModal = (year) => {
    setDeletingYear(year);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingYear) return;
    setDeleting(true);
    try {
      await deleteAcademicYear(deletingYear.id);
      toast.success(lang === "fr" ? "Année supprimée" : "Year deleted");
      setDeleteModalOpen(false);
      setDeletingYear(null);
      loadYears();
    } catch (err) {
      const msg = err?.response?.data?.message ||
        (lang === "fr" ? "Erreur lors de la suppression" : "Failed to delete year");
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Term handlers ──
  const openTermForm = (yearId) => {
    setTermData({
      name: "",
      academicYearId: yearId,
      startDate: "",
      endDate: "",
    });
    setTermFormOpen(true);
  };

  const handleCreateTerm = async () => {
    if (!termData.name.trim() || !termData.startDate || !termData.endDate) {
      toast.error(lang === "fr" ? "Tous les champs sont requis" : "All fields are required");
      return;
    }
    setTermSaving(true);
    try {
      await createTerm({
        name: termData.name.trim(),
        academicYearId: termData.academicYearId,
        startDate: termData.startDate,
        endDate: termData.endDate,
      });
      toast.success(lang === "fr" ? "Trimestre créé" : "Term created");
      setTermFormOpen(false);
      loadTerms(termData.academicYearId);
    } catch (err) {
      const msg = err?.response?.data?.message ||
        (lang === "fr" ? "Erreur" : "Failed to create term");
      toast.error(msg);
    } finally {
      setTermSaving(false);
    }
  };

  const handleDeleteTerm = async (termId) => {
    try {
      await deleteTerm(termId);
      toast.success(lang === "fr" ? "Trimestre supprimé" : "Term deleted");
      setTerms((prev) => prev.filter((t) => t.id !== termId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

  // ── Table columns ──
  const columns = [
    {
      key: "name",
      label: lang === "fr" ? "Année" : "Year",
      sortable: true,
      render: (_, row) => {
        const name = row.year || row.name || "";
        const isCurrent = row.isCurrent || row.is_active;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold flex-shrink-0">
              {name.slice(0, 2)}
            </div>
            <div>
              <div className="font-medium text-surface-800 dark:text-surface-100">
                {name}
              </div>
              <div className="text-xs text-surface-400">
                {row.startDate ? new Date(row.startDate).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : ""}
                {" — "}
                {row.endDate ? new Date(row.endDate).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : ""}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "isCurrent",
      label: lang === "fr" ? "Statut" : "Status",
      width: 120,
      render: (val) => (
        <Badge status={val ? "active" : "inactive"}>
          {val
            ? lang === "fr" ? "En cours" : "Current"
            : lang === "fr" ? "Passée" : "Past"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 180,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDrawer(row)}
          >
            {lang === "fr" ? "Modifier" : "Edit"}
          </Button>
          {!row.isCurrent && !row.is_active && (
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600"
              onClick={() => handleActivate(row)}
            >
              {lang === "fr" ? "Activer" : "Activate"}
            </Button>
          )}
          {!row.isCurrent && !row.is_active && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500"
              onClick={() => openDeleteModal(row)}
            >
              {lang === "fr" ? "Suppr." : "Del"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ──
  if (error && !loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          icon={<FiCalendar className="w-6 h-6" />}
          title={lang === "fr" ? "Années académiques" : "Academic Years"}
        />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button variant="primary" onClick={loadYears}>
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
        icon={<FiCalendar className="w-6 h-6" />}
        title={lang === "fr" ? "Années académiques" : "Academic Years"}
        subtitle={
          lang === "fr"
            ? "Gérer les années scolaires et leurs trimestres"
            : "Manage school years and their terms"
        }
      />

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton variant="table" />
          </div>
        ) : years.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<FiCalendar className="w-8 h-8" />}
              title={lang === "fr" ? "Aucune année" : "No academic years"}
              subtitle={
                lang === "fr"
                  ? "Créez la première année scolaire pour commencer"
                  : "Create the first academic year to get started"
              }
              action={
                <Button variant="primary" onClick={openCreateDrawer}>
                  {lang === "fr" ? "+ Créer une année" : "+ Create Year"}
                </Button>
              }
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={years}
            searchable
            searchPlaceholder={
              lang === "fr" ? "Rechercher une année..." : "Search years..."
            }
            emptyMessage={
              lang === "fr" ? "Aucune année trouvée" : "No years found"
            }
            onRowClick={(row) => {
              if (expandedYearId === row.id) {
                setExpandedYearId(null);
              } else {
                loadTerms(row.id);
              }
            }}
            headerExtra={
              <Button variant="primary" size="sm" onClick={openCreateDrawer}>
                {lang === "fr" ? "+ Nouvelle" : "+ New"}
              </Button>
            }
          />
        )}
      </Card>

      {/* ── Expanded Terms Section ── */}
      {expandedYearId && (
        <Card className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
              {lang === "fr" ? "Trimestres / Périodes" : "Terms / Periods"}
            </h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<FiPlus className="w-3.5 h-3.5" />}
              onClick={() => openTermForm(expandedYearId)}
            >
              {lang === "fr" ? "Ajouter" : "Add"}
            </Button>
          </div>

          {termsLoading ? (
            <Skeleton variant="text" />
          ) : terms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-surface-400">
                {lang === "fr"
                  ? "Aucun trimestre. Ajoutez le premier trimestre (ex: Term 1, 1er Trimestre)."
                  : "No terms yet. Add the first term (e.g. Term 1)."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {terms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700"
                >
                  <div>
                    <div className="text-sm font-medium text-surface-800 dark:text-surface-100">
                      {term.name}
                    </div>
                    <div className="text-xs text-surface-400 mt-0.5">
                      {term.startDate
                        ? new Date(term.startDate).toLocaleDateString(
                            lang === "fr" ? "fr-FR" : "en-US"
                          )
                        : ""}
                      {" → "}
                      {term.endDate
                        ? new Date(term.endDate).toLocaleDateString(
                            lang === "fr" ? "fr-FR" : "en-US"
                          )
                        : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTerm(term.id)}
                    className="p-1.5 text-surface-400 hover:text-red-500 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Term Creation Drawer ── */}
      <Drawer
        isOpen={termFormOpen}
        onClose={() => setTermFormOpen(false)}
        title={lang === "fr" ? "Nouveau trimestre" : "New Term"}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={lang === "fr" ? "Nom du trimestre" : "Term Name"}
            placeholder={lang === "fr" ? "Ex: Term 1, 1er Trimestre" : "E.g.: Term 1"}
            value={termData.name}
            onChange={(e) => setTermData({ ...termData, name: e.target.value })}
            autoFocus
          />
          <Input
            label={lang === "fr" ? "Date de début" : "Start Date"}
            type="date"
            value={termData.startDate}
            onChange={(e) => setTermData({ ...termData, startDate: e.target.value })}
          />
          <Input
            label={lang === "fr" ? "Date de fin" : "End Date"}
            type="date"
            value={termData.endDate}
            onChange={(e) => setTermData({ ...termData, endDate: e.target.value })}
          />
          <div className="flex gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button variant="secondary" onClick={() => setTermFormOpen(false)} fullWidth>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button variant="primary" onClick={handleCreateTerm} loading={termSaving} fullWidth>
              {lang === "fr" ? "Créer" : "Create"}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── Year Create/Edit Drawer ── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          editingYear
            ? lang === "fr"
              ? `Modifier ${editingYear.year || editingYear.name}`
              : `Edit ${editingYear.year || editingYear.name}`
            : lang === "fr"
              ? "Nouvelle année"
              : "New Academic Year"
        }
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={lang === "fr" ? "Année" : "Year"}
            placeholder={lang === "fr" ? "Ex: 2024-2025" : "E.g.: 2024-2025"}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            error={formErrors.year}
            autoFocus
          />
          <Input
            label={lang === "fr" ? "Date de début" : "Start Date"}
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            error={formErrors.startDate}
          />
          <Input
            label={lang === "fr" ? "Date de fin" : "End Date"}
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            error={formErrors.endDate}
          />
          <div className="flex gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)} fullWidth>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving} fullWidth>
              {editingYear
                ? lang === "fr" ? "Mettre à jour" : "Update"
                : lang === "fr" ? "Créer" : "Create"}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={lang === "fr" ? "Confirmer la suppression" : "Confirm Deletion"}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} fullWidth>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting} fullWidth>
              {lang === "fr" ? "Supprimer" : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-surface-600 dark:text-surface-300">
          {lang === "fr"
            ? `Supprimer l'année ${deletingYear?.year || deletingYear?.name} ? Cette action est irréversible.`
            : `Delete ${deletingYear?.year || deletingYear?.name}? This cannot be undone.`}
        </p>
      </Modal>
    </div>
  );
}
