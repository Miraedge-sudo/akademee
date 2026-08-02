import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiGitBranch,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiTag,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import universityService from "../../../core/api/universityService";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

const STATUS_LABELS = {
  PLANNED: { en: "Planned", fr: "Planifié" },
  IN_PROGRESS: { en: "In progress", fr: "En cours" },
  COMPLETED: { en: "Completed", fr: "Terminé" },
  ON_HOLD: { en: "On hold", fr: "En pause" },
  CANCELLED: { en: "Cancelled", fr: "Annulé" },
};

const STATUS_BADGE = {
  PLANNED: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
  IN_PROGRESS: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  COMPLETED: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  ON_HOLD: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  CANCELLED: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
};

const EMPTY_FORM = {
  faculty_id: "",
  department_id: "",
  title: "",
  title_fr: "",
  status: "PLANNED",
  start_date: "",
  end_date: "",
  funding_source: "",
  budget: "",
  principal_investigator: "",
  investigators: "",
  summary: "",
  keywords: "",
  is_published: false,
};

function toArray(str) {
  return (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromArray(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}

export default function ResearchPage() {
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [projects, setProjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    universityService.faculties
      .list({ limit: 100 })
      .then(({ items }) => setFaculties(items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    universityService.departments
      .list({ limit: 100, faculty_id: facultyFilter })
      .then(({ items }) => setDepartments(items))
      .catch(() => setDepartments([]));
  }, [facultyFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    universityService.research
      .list({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: statusFilter,
        faculty_id: facultyFilter,
        department_id: departmentFilter,
        is_published: publishedFilter,
      })
      .then(({ items, pagination: pg }) => {
        setProjects(items);
        setPagination(pg);
      })
      .catch(() => toast.error(isFr ? "Erreur de chargement" : "Failed to load projects"))
      .finally(() => setLoading(false));
  }, [page, pagination.limit, debouncedSearch, statusFilter, facultyFilter, departmentFilter, publishedFilter, isFr]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, facultyFilter, departmentFilter, publishedFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, faculty_id: facultyFilter, department_id: departmentFilter });
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({
      faculty_id: project.facultyId || "",
      department_id: project.departmentId || "",
      title: project.title || "",
      title_fr: project.titleFr || "",
      status: project.status || "PLANNED",
      start_date: project.startDate ? project.startDate.slice(0, 10) : "",
      end_date: project.endDate ? project.endDate.slice(0, 10) : "",
      funding_source: project.fundingSource || "",
      budget: project.budget ?? "",
      principal_investigator: project.principalInvestigator || "",
      investigators: fromArray(project.investigators),
      summary: project.summary || "",
      keywords: fromArray(project.keywords),
      is_published: Boolean(project.isPublished),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(isFr ? "Le titre est requis" : "Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      faculty_id: form.faculty_id || null,
      department_id: form.department_id || null,
      budget: form.budget ? Number(form.budget) : null,
      investigators: toArray(form.investigators),
      keywords: toArray(form.keywords),
      is_published: Boolean(form.is_published),
    };
    try {
      if (editing) {
        const updated = await universityService.research.updateById(editing.id, payload);
        setProjects((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p)));
        toast.success(isFr ? "Projet mis à jour" : "Project updated");
      } else {
        const created = await universityService.research.create(payload);
        setProjects((prev) => [created, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        toast.success(isFr ? "Projet créé" : "Project created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || (isFr ? "Erreur d'enregistrement" : "Failed to save project"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await universityService.research.delete(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
      toast.success(isFr ? "Projet supprimé" : "Project deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Suppression impossible" : "Failed to delete project"));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const facultyOptions = faculties.map((f) => ({ value: f.id, label: f.name }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const statusOptions = Object.keys(STATUS_LABELS).map((s) => ({ value: s, label: STATUS_LABELS[s][isFr ? "fr" : "en"] }));
  const publishedOptions = [
    { value: "", label: isFr ? "Tous" : "All" },
    { value: "true", label: isFr ? "Publié" : "Published" },
    { value: "false", label: isFr ? "Brouillon" : "Draft" },
  ];

  const formatBudget = (budget) => {
    if (budget === null || budget === undefined || budget === "") return null;
    return new Intl.NumberFormat(isFr ? "fr-FR" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(budget);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {t("research.title", isFr ? "Projets de recherche" : "Research Projects")}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr ? "Projets de recherche & subventions" : "Research projects & grants"}
          </p>
        </div>
        <Button icon={<FiPlus />} onClick={openCreate}>
          {isFr ? "Nouveau projet" : "New project"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFr ? "Rechercher un projet…" : "Search projects…"}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-surface-200 dark:border-surface-600 text-sm outline-none focus:border-primary-600 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <FiX className="w-3.5 h-3.5 text-surface-400" />
            </button>
          )}
        </div>
        <div className="sm:w-44">
          <Select
            placeholder={isFr ? "Tous statuts" : "All statuses"}
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="sm:w-52">
          <Select
            placeholder={isFr ? "Toutes facultés" : "All faculties"}
            options={facultyOptions}
            value={facultyFilter}
            onChange={(e) => { setFacultyFilter(e.target.value); setDepartmentFilter(""); }}
          />
        </div>
        <div className="sm:w-44">
          <Select
            placeholder={isFr ? "Publié" : "Visibility"}
            options={publishedOptions}
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="w-[64px] h-[64px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
            <FiGitBranch className="w-7 h-7 text-surface-400" />
          </div>
          <p className="text-sm font-semibold text-surface-500">
            {debouncedSearch || statusFilter || facultyFilter
              ? (isFr ? "Aucun projet ne correspond" : "No projects match")
              : (isFr ? "Aucun projet enregistré" : "No research projects yet")}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {isFr ? "Lancez votre premier projet de recherche" : "Start your first research project"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_BADGE[project.status] || "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300"}`}>
                      {STATUS_LABELS[project.status]?.[isFr ? "fr" : "en"] || project.status}
                    </span>
                    {project.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        <FiCheckCircle className="w-3 h-3" /> {isFr ? "Publié" : "Published"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400">
                        {isFr ? "Brouillon" : "Draft"}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-bold text-surface-800 dark:text-surface-100 leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-surface-400 mt-0.5 line-clamp-1">
                    {project.facultyName}
                    {project.facultyName && project.departmentName ? " · " : ""}
                    {project.departmentName}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(project)}
                    className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all"
                    title={isFr ? "Modifier" : "Edit"}
                  >
                    <FiEdit2 className="w-3.5 h-3.5 text-primary-700" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(project)}
                    className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
                    title={isFr ? "Supprimer" : "Delete"}
                  >
                    <FiTrash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              {(project.summary || project.keywords?.length > 0) && (
                <p className="text-[13px] text-surface-600 dark:text-surface-300 mt-2.5 leading-relaxed line-clamp-2">
                  {project.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[12px] text-surface-500 dark:text-surface-400">
                {project.principalInvestigator && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiUser className="w-3.5 h-3.5 text-surface-400" />
                    {project.principalInvestigator}
                  </span>
                )}
                {project.investigators?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiGitBranch className="w-3.5 h-3.5 text-surface-400" />
                    {project.investigators.length} {isFr ? "chercheur(s)" : "researcher(s)"}
                  </span>
                )}
                {project.fundingSource && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiTag className="w-3.5 h-3.5 text-surface-400" />
                    {project.fundingSource}
                  </span>
                )}
                {project.budget !== null && project.budget !== undefined && project.budget !== "" && (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatBudget(project.budget)}
                  </span>
                )}
                {project.startDate && (
                  <span>
                    {project.startDate.slice(0, 10)}
                    {project.endDate ? ` → ${project.endDate.slice(0, 10)}` : ""}
                  </span>
                )}
              </div>

              {project.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {project.keywords.map((kw, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-[11px] text-surface-500 dark:text-surface-400">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.total > pagination.limit && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-surface-400">
            {isFr ? `Page ${page} sur ${totalPages}` : `Page ${page} of ${totalPages}`}
            {" · "}
            {pagination.total} {isFr ? "résultat(s)" : "result(s)"}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              <FiChevronLeft className="w-4 h-4 text-surface-500" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              <FiChevronRight className="w-4 h-4 text-surface-500" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? (isFr ? "Modifier le projet" : "Edit project") : (isFr ? "Nouveau projet de recherche" : "New research project")}
        size="xl"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              {editing ? (isFr ? "Enregistrer" : "Save") : (isFr ? "Créer" : "Create")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label={isFr ? "Titre du projet" : "Project title"} value={form.title} onChange={setField("title")} placeholder={isFr ? "Intelligence artificielle en éducation" : "AI in Education"} />
          </div>
          <Input label={isFr ? "Titre (FR)" : "Title (FR)"} value={form.title_fr} onChange={setField("title_fr")} placeholder={isFr ? "AI in Education" : "Intelligence artificielle en éducation"} />
          <Select
            label={isFr ? "Statut" : "Status"}
            options={statusOptions}
            value={form.status}
            onChange={setField("status")}
          />
          <Select
            label={isFr ? "Faculté" : "Faculty"}
            placeholder={isFr ? "Aucune" : "None"}
            options={facultyOptions}
            value={form.faculty_id}
            onChange={(e) => { setForm((f) => ({ ...f, faculty_id: e.target.value, department_id: "" })); }}
          />
          <Select
            label={isFr ? "Département" : "Department"}
            placeholder={isFr ? "Aucun" : "None"}
            options={departmentOptions}
            value={form.department_id}
            onChange={setField("department_id")}
          />
          <Input label={isFr ? "Date de début" : "Start date"} type="date" value={form.start_date} onChange={setField("start_date")} />
          <Input label={isFr ? "Date de fin" : "End date"} type="date" value={form.end_date} onChange={setField("end_date")} />
          <Input label={isFr ? "Source de financement" : "Funding source"} value={form.funding_source} onChange={setField("funding_source")} placeholder="CNRST, PNUD, …" />
          <Input label={isFr ? "Budget (USD)" : "Budget (USD)"} type="number" min="0" value={form.budget} onChange={setField("budget")} />
          <Input label={isFr ? "Chercheur principal" : "Principal investigator"} value={form.principal_investigator} onChange={setField("principal_investigator")} />
          <Input label={isFr ? "Chercheurs (séparés par virgules)" : "Investigators (comma-separated)"} value={form.investigators} onChange={setField("investigators")} />
          <div className="sm:col-span-2">
            <Input label={isFr ? "Mots-clés (séparés par virgules)" : "Keywords (comma-separated)"} value={form.keywords} onChange={setField("keywords")} placeholder={isFr ? "IA, éducation, machine learning" : "AI, education, machine learning"} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
              {isFr ? "Résumé" : "Summary"}
            </label>
            <textarea
              value={form.summary}
              onChange={setField("summary")}
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 focus:ring-[3.5px] focus:ring-primary-600/10 transition-all resize-none"
              placeholder={isFr ? "Brève description du projet…" : "Brief description of the project…"}
            />
          </div>
        </div>
        <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(form.is_published)}
            onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
            className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-600/30"
          />
          <span className="text-sm text-surface-700 dark:text-surface-200">
            {isFr ? "Visible sur le site public" : "Visible on public website"}
          </span>
        </label>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={isFr ? "Supprimer le projet ?" : "Delete project?"}
        message={isFr
          ? `Voulez-vous vraiment supprimer "${deleteTarget?.title}" ? Les publications liées seront conservées.`
          : `Are you sure you want to delete "${deleteTarget?.title}"? Linked publications will be kept.`}
        confirmLabel={isFr ? "Supprimer" : "Delete"}
        cancelLabel={isFr ? "Annuler" : "Cancel"}
      />
    </div>
  );
}
