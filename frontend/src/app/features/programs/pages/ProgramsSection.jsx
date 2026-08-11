import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiAward,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";
import toast from "react-hot-toast";
import universityService from "../../../core/api/universityService";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

const PROGRAMS_META = {
  licence: {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.licence",
    description: "Licence (Bac+3) · Bachelor degree",
    descriptionFr: "Licence (Bac+3) · Bachelor",
    cycle: "LICENCE",
  },
  master: {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.master",
    description: "Master (Bac+5) · Advanced degree",
    descriptionFr: "Master (Bac+5) · Diplôme avancé",
    cycle: "MASTER",
  },
  doctorate: {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.doctorate",
    description: "Doctorat (Bac+8) · PhD",
    descriptionFr: "Doctorat (Bac+8) · PhD",
    cycle: "DOCTORATE",
  },
};

const CYCLE_LABELS = {
  LICENCE: { en: "Licence", fr: "Licence" },
  MASTER: { en: "Master", fr: "Master" },
  DOCTORATE: { en: "Doctorate", fr: "Doctorat" },
};

const LANGUAGE_LABELS = {
  FR: "Français",
  EN: "English",
  BILINGUAL: "Bilingue",
};

const EMPTY_FORM = {
  faculty_id: "",
  department_id: "",
  name: "",
  name_fr: "",
  code: "",
  cycle: "LICENCE",
  duration_years: 3,
  credits_total: "",
  language: "FR",
  is_active: true,
};

export default function ProgramsSection() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const isFr = i18n.language === "fr";

  const programSlug = location.pathname.replace("/dashboard/programs/", "");
  const meta = PROGRAMS_META[programSlug] || {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.title",
    description: "LMD Programs",
    descriptionFr: "Programmes LMD",
    cycle: "",
  };
  const defaultCycle = meta.cycle || "";

  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cycleFilter, setCycleFilter] = useState(defaultCycle);
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

  const fetchPrograms = useCallback(() => {
    setLoading(true);
    universityService.programs
      .list({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        cycle: cycleFilter,
        faculty_id: facultyFilter,
        department_id: departmentFilter,
      })
      .then(({ items, pagination: pg }) => {
        setPrograms(items);
        setPagination(pg);
      })
      .catch(() => toast.error(isFr ? "Erreur de chargement" : "Failed to load programs"))
      .finally(() => setLoading(false));
  }, [page, pagination.limit, debouncedSearch, cycleFilter, facultyFilter, departmentFilter, isFr]);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  useEffect(() => { setPage(1); }, [debouncedSearch, cycleFilter, facultyFilter, departmentFilter]);

  useEffect(() => {
    setCycleFilter(defaultCycle);
    setPage(1);
  }, [defaultCycle]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, cycle: cycleFilter || "LICENCE", faculty_id: facultyFilter, department_id: departmentFilter });
    setModalOpen(true);
  };

  const openEdit = (program) => {
    setEditing(program);
    setForm({
      faculty_id: program.facultyId || "",
      department_id: program.departmentId || "",
      name: program.name || "",
      name_fr: program.nameFr || "",
      code: program.code || "",
      cycle: program.cycle || "LICENCE",
      duration_years: program.durationYears || 3,
      credits_total: program.creditsTotal ?? "",
      language: program.language || "FR",
      is_active: program.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.cycle) {
      toast.error(isFr ? "Nom, code et cycle requis" : "Name, code and cycle are required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      duration_years: Number(form.duration_years) || 3,
      credits_total: form.credits_total ? Number(form.credits_total) : null,
      is_active: Boolean(form.is_active),
    };
    try {
      if (editing) {
        const updated = await universityService.programs.updateById(editing.id, payload);
        setPrograms((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p)));
        toast.success(isFr ? "Programme modifié" : "Program updated");
      } else {
        const created = await universityService.programs.create(payload);
        setPrograms((prev) => [created, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        toast.success(isFr ? "Programme créé" : "Program created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || (isFr ? "Erreur d'enregistrement" : "Failed to save program"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await universityService.programs.delete(deleteTarget.id);
      setPrograms((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
      toast.success(isFr ? "Programme supprimé" : "Program deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Suppression impossible" : "Failed to delete program"));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const facultyOptions = faculties.map((f) => ({ value: f.id, label: f.name }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const cycleOptions = Object.keys(CYCLE_LABELS).map((c) => ({ value: c, label: CYCLE_LABELS[c][isFr ? "fr" : "en"] }));

  const cycleBadge = (cycle) => {
    const color = cycle === "LICENCE"
      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
      : cycle === "MASTER"
        ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
        : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
    return color;
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {t(meta.titleKey, programSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr ? meta.descriptionFr : meta.description}
          </p>
        </div>
        <Button icon={<FiPlus />} onClick={openCreate}>
          {isFr ? "Ajouter un programme" : "Add program"}
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
            placeholder={isFr ? "Rechercher un programme…" : "Search programs…"}
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
            placeholder={isFr ? "Tous cycles" : "All cycles"}
            options={cycleOptions}
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
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
        <div className="sm:w-52">
          <Select
            placeholder={isFr ? "Tous départements" : "All departments"}
            options={departmentOptions}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-[64px] h-[64px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
              <FiAward className="w-7 h-7 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-500">
              {debouncedSearch || cycleFilter || facultyFilter
                ? (isFr ? "Aucun programme ne correspond" : "No programs match")
                : (isFr ? "Aucun programme enregistré" : "No programs yet")}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {isFr ? "Ajoutez votre premier programme LMD" : "Add your first LMD program"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Nom</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Cycle</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Département</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Durée</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Crédits</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Langue</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider uppercase text-surface-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr
                    key={program.id}
                    className="group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">
                        {program.name}
                      </p>
                      <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold text-primary-700 dark:text-primary-300">
                        {program.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${cycleBadge(program.cycle)}`}>
                        {CYCLE_LABELS[program.cycle]?.[isFr ? "fr" : "en"] || program.cycle}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-surface-600 dark:text-surface-300">
                        {program.departmentName || (program.facultyName ? `${program.facultyName} (fac.)` : "—")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-surface-700 dark:text-surface-200">
                        <FiClock className="w-3.5 h-3.5 text-surface-400" />
                        {program.durationYears} {isFr ? "ans" : "yrs"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[13px] text-surface-700 dark:text-surface-200">
                        {program.creditsTotal ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[13px] text-surface-600 dark:text-surface-300">
                        {LANGUAGE_LABELS[program.language] || program.language}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(program)}
                          className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all"
                          title={isFr ? "Modifier" : "Edit"}
                        >
                          <FiEdit2 className="w-3 h-3 text-primary-700" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(program)}
                          className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
                          title={isFr ? "Supprimer" : "Delete"}
                        >
                          <FiTrash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        title={editing ? (isFr ? "Modifier le programme" : "Edit program") : (isFr ? "Nouveau programme" : "New program")}
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
            <Input label={isFr ? "Nom (EN)" : "Name (EN)"} value={form.name} onChange={setField("name")} placeholder="BSc Computer Science" />
          </div>
          <Input label={isFr ? "Nom (FR)" : "Name (FR)"} value={form.name_fr} onChange={setField("name_fr")} placeholder="Licence Informatique" />
          <Input label="Code" value={form.code} onChange={setField("code")} placeholder="LIC-INFO" />
          <Select
            label="Cycle"
            options={cycleOptions}
            value={form.cycle}
            onChange={setField("cycle")}
          />
          <Select
            label={isFr ? "Langue" : "Language"}
            options={Object.keys(LANGUAGE_LABELS).map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))}
            value={form.language}
            onChange={setField("language")}
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
          <Input label={isFr ? "Durée (années)" : "Duration (years)"} type="number" min="1" max="10" value={form.duration_years} onChange={setField("duration_years")} />
          <Input label={isFr ? "Crédits totaux" : "Total credits"} type="number" min="0" value={form.credits_total} onChange={setField("credits_total")} placeholder="180" />
        </div>
        <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(form.is_active)}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-600/30"
          />
          <span className="text-sm text-surface-700 dark:text-surface-200">
            {isFr ? "Programme actif" : "Active program"}
          </span>
        </label>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={isFr ? "Supprimer le programme ?" : "Delete program?"}
        message={isFr
          ? `Voulez-vous vraiment supprimer "${deleteTarget?.name}" ?`
          : `Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel={isFr ? "Supprimer" : "Delete"}
        cancelLabel={isFr ? "Annuler" : "Cancel"}
      />
    </div>
  );
}
