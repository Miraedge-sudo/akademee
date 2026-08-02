import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiExternalLink,
  FiBookmark,
  FiEye,
} from "react-icons/fi";
import toast from "react-hot-toast";
import universityService from "../../../core/api/universityService";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

const TYPE_LABELS = {
  JOURNAL_ARTICLE: { en: "Journal article", fr: "Article de revue" },
  CONFERENCE_PAPER: { en: "Conference paper", fr: "Communication" },
  THESIS: { en: "Thesis", fr: "Thèse" },
  BOOK: { en: "Book", fr: "Ouvrage" },
  BOOK_CHAPTER: { en: "Book chapter", fr: "Chapitre d'ouvrage" },
  REPORT: { en: "Report", fr: "Rapport" },
  OTHER: { en: "Other", fr: "Autre" },
};

const TYPE_BADGE = {
  JOURNAL_ARTICLE: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  CONFERENCE_PAPER: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  THESIS: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  BOOK: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  BOOK_CHAPTER: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
  REPORT: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  OTHER: "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
};

const EMPTY_FORM = {
  research_project_id: "",
  faculty_id: "",
  department_id: "",
  title: "",
  title_fr: "",
  type: "JOURNAL_ARTICLE",
  authors: "",
  journal_name: "",
  publisher: "",
  doi: "",
  issn: "",
  isbn: "",
  publication_date: "",
  volume: "",
  issue: "",
  pages: "",
  abstract: "",
  keywords: "",
  url: "",
  citation: "",
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

export default function PublicationsPage() {
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [publications, setPublications] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
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
    universityService.research
      .list({ limit: 100 })
      .then(({ items }) => setProjects(items))
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

  const fetchPublications = useCallback(() => {
    setLoading(true);
    universityService.publications
      .list({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        type: typeFilter,
        year: yearFilter,
        faculty_id: facultyFilter,
        department_id: departmentFilter,
      })
      .then(({ items, pagination: pg }) => {
        setPublications(items);
        setPagination(pg);
      })
      .catch(() => toast.error(isFr ? "Erreur de chargement" : "Failed to load publications"))
      .finally(() => setLoading(false));
  }, [page, pagination.limit, debouncedSearch, typeFilter, yearFilter, facultyFilter, departmentFilter, isFr]);

  useEffect(() => { fetchPublications(); }, [fetchPublications]);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, yearFilter, facultyFilter, departmentFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, faculty_id: facultyFilter, department_id: departmentFilter });
    setModalOpen(true);
  };

  const openEdit = (pub) => {
    setEditing(pub);
    setForm({
      research_project_id: pub.researchProjectId || "",
      faculty_id: pub.facultyId || "",
      department_id: pub.departmentId || "",
      title: pub.title || "",
      title_fr: pub.titleFr || "",
      type: pub.type || "JOURNAL_ARTICLE",
      authors: fromArray(pub.authors),
      journal_name: pub.journalName || "",
      publisher: pub.publisher || "",
      doi: pub.doi || "",
      issn: pub.issn || "",
      isbn: pub.isbn || "",
      publication_date: pub.publicationDate ? pub.publicationDate.slice(0, 10) : "",
      volume: pub.volume || "",
      issue: pub.issue || "",
      pages: pub.pages || "",
      abstract: pub.abstract || "",
      keywords: fromArray(pub.keywords),
      url: pub.url || "",
      citation: pub.citation || "",
      is_published: Boolean(pub.isPublished),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(isFr ? "Le titre est requis" : "Title is required");
      return;
    }
    if (!form.authors.trim()) {
      toast.error(isFr ? "Ajoutez au moins un auteur" : "Add at least one author");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      research_project_id: form.research_project_id || null,
      faculty_id: form.faculty_id || null,
      department_id: form.department_id || null,
      authors: toArray(form.authors),
      keywords: toArray(form.keywords),
      is_published: Boolean(form.is_published),
    };
    try {
      if (editing) {
        const updated = await universityService.publications.updateById(editing.id, payload);
        setPublications((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p)));
        toast.success(isFr ? "Publication mise à jour" : "Publication updated");
      } else {
        const created = await universityService.publications.create(payload);
        setPublications((prev) => [created, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        toast.success(isFr ? "Publication ajoutée" : "Publication added");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || (isFr ? "Erreur d'enregistrement" : "Failed to save publication"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await universityService.publications.delete(deleteTarget.id);
      setPublications((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
      toast.success(isFr ? "Publication supprimée" : "Publication deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Suppression impossible" : "Failed to delete publication"));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const facultyOptions = faculties.map((f) => ({ value: f.id, label: f.name }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.title }));
  const typeOptions = Object.keys(TYPE_LABELS).map((ty) => ({ value: ty, label: TYPE_LABELS[ty][isFr ? "fr" : "en"] }));
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2000; y--) years.push(y);

  const formatYear = (date) => (date ? date.slice(0, 10) : null);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {t("publications.title", isFr ? "Publications" : "Publications")}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr ? "Revues, articles & thèses" : "Journals, papers & theses"}
          </p>
        </div>
        <Button icon={<FiPlus />} onClick={openCreate}>
          {isFr ? "Ajouter une publication" : "Add publication"}
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
            placeholder={isFr ? "Rechercher une publication…" : "Search publications…"}
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
        <div className="sm:w-52">
          <Select
            placeholder={isFr ? "Tous types" : "All types"}
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
        <div className="sm:w-32">
          <Select
            placeholder={isFr ? "Année" : "Year"}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
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
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
        </div>
      ) : publications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="w-[64px] h-[64px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
            <FiFileText className="w-7 h-7 text-surface-400" />
          </div>
          <p className="text-sm font-semibold text-surface-500">
            {debouncedSearch || typeFilter || yearFilter
              ? (isFr ? "Aucune publication ne correspond" : "No publications match")
              : (isFr ? "Aucune publication enregistrée" : "No publications yet")}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {isFr ? "Ajoutez votre première publication" : "Add your first publication"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${TYPE_BADGE[pub.type] || TYPE_BADGE.OTHER}`}>
                      {TYPE_LABELS[pub.type]?.[isFr ? "fr" : "en"] || pub.type}
                    </span>
                    {pub.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        <FiEye className="w-3 h-3" /> {isFr ? "Publiée" : "Published"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400">
                        {isFr ? "Brouillon" : "Draft"}
                      </span>
                    )}
                    {formatYear(pub.publicationDate) && (
                      <span className="text-[11px] text-surface-400">
                        {formatYear(pub.publicationDate)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-bold text-surface-800 dark:text-surface-100 leading-snug">
                    {pub.title}
                  </h3>
                  {pub.authors?.length > 0 && (
                    <p className="text-[13px] text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <FiUsers className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                      {pub.authors.join(", ")}
                    </p>
                  )}
                  {(pub.journalName || pub.publisher) && (
                    <p className="text-xs text-surface-400 mt-0.5 italic">
                      {pub.journalName}
                      {pub.journalName && pub.publisher ? " · " : ""}
                      {pub.publisher}
                      {pub.volume && ` · vol. ${pub.volume}`}
                      {pub.issue && `, no. ${pub.issue}`}
                      {pub.pages && `, pp. ${pub.pages}`}
                    </p>
                  )}
                  {pub.researchProjectTitle && (
                    <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1">
                      <FiBookmark className="w-3 h-3" />
                      {pub.researchProjectTitle}
                    </p>
                  )}
                  {pub.abstract && (
                    <p className="text-[13px] text-surface-600 dark:text-surface-300 mt-2 leading-relaxed line-clamp-2">
                      {pub.abstract}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {pub.doi && (
                    <a
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all"
                      title="DOI"
                    >
                      <FiExternalLink className="w-3.5 h-3.5 text-primary-700" />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(pub)}
                    className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all"
                    title={isFr ? "Modifier" : "Edit"}
                  >
                    <FiEdit2 className="w-3.5 h-3.5 text-primary-700" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(pub)}
                    className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
                    title={isFr ? "Supprimer" : "Delete"}
                  >
                    <FiTrash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              {pub.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {pub.keywords.map((kw, idx) => (
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
        title={editing ? (isFr ? "Modifier la publication" : "Edit publication") : (isFr ? "Nouvelle publication" : "New publication")}
        size="full"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              {editing ? (isFr ? "Enregistrer" : "Save") : (isFr ? "Ajouter" : "Add")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label={isFr ? "Titre de la publication" : "Publication title"} value={form.title} onChange={setField("title")} placeholder={isFr ? "Deep Learning pour l'analyse d'images" : "Deep Learning for image analysis"} />
          </div>
          <Input label={isFr ? "Titre (FR)" : "Title (FR)"} value={form.title_fr} onChange={setField("title_fr")} placeholder={isFr ? "Deep Learning for image analysis" : "Deep Learning pour l'analyse d'images"} />
          <div className="sm:col-span-2">
            <Input label={isFr ? "Auteurs (séparés par virgules)" : "Authors (comma-separated)"} value={form.authors} onChange={setField("authors")} placeholder="A. Benali, M. Dupont, …" />
          </div>
          <Select
            label={isFr ? "Type" : "Type"}
            options={typeOptions}
            value={form.type}
            onChange={setField("type")}
          />
          <Select
            label={isFr ? "Projet de recherche lié" : "Linked research project"}
            placeholder={isFr ? "Aucun" : "None"}
            options={projectOptions}
            value={form.research_project_id}
            onChange={setField("research_project_id")}
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
          <Input label={isFr ? "Revue / Journal" : "Journal"} value={form.journal_name} onChange={setField("journal_name")} placeholder="Nature, IEEE, …" />
          <Input label={isFr ? "Éditeur" : "Publisher"} value={form.publisher} onChange={setField("publisher")} />
          <Input label={isFr ? "Date de publication" : "Publication date"} type="date" value={form.publication_date} onChange={setField("publication_date")} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Volume" value={form.volume} onChange={setField("volume")} />
            <Input label="N°" value={form.issue} onChange={setField("issue")} />
            <Input label={isFr ? "Pages" : "Pages"} value={form.pages} onChange={setField("pages")} placeholder="1–20" />
          </div>
          <Input label="DOI" value={form.doi} onChange={setField("doi")} placeholder="10.1000/xyz123" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ISSN" value={form.issn} onChange={setField("issn")} />
            <Input label="ISBN" value={form.isbn} onChange={setField("isbn")} />
          </div>
          <div className="sm:col-span-2">
            <Input label={isFr ? "URL" : "URL"} value={form.url} onChange={setField("url")} placeholder="https://…" />
          </div>
          <div className="sm:col-span-2">
            <Input label={isFr ? "Mots-clés (séparés par virgules)" : "Keywords (comma-separated)"} value={form.keywords} onChange={setField("keywords")} placeholder={isFr ? "IA, vision, deep learning" : "AI, vision, deep learning"} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
              {isFr ? "Résumé" : "Abstract"}
            </label>
            <textarea
              value={form.abstract}
              onChange={setField("abstract")}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 focus:ring-[3.5px] focus:ring-primary-600/10 transition-all resize-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
              {isFr ? "Citation (optionnel)" : "Citation (optional)"}
            </label>
            <textarea
              value={form.citation}
              onChange={setField("citation")}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 focus:ring-[3.5px] focus:ring-primary-600/10 transition-all resize-none"
              placeholder="APA, MLA, …"
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
        title={isFr ? "Supprimer la publication ?" : "Delete publication?"}
        message={isFr
          ? `Voulez-vous vraiment supprimer "${deleteTarget?.title}" ?`
          : `Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel={isFr ? "Supprimer" : "Delete"}
        cancelLabel={isFr ? "Annuler" : "Cancel"}
      />
    </div>
  );
}
