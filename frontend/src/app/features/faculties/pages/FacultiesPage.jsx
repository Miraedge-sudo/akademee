import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiHome,
  FiUsers,
  FiAward,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import universityService from "../../../core/api/universityService";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

const EMPTY_FORM = {
  name: "",
  name_fr: "",
  code: "",
  dean_name: "",
  email: "",
  phone: "",
  building: "",
  established_year: "",
  is_active: true,
};

export default function FacultiesPage() {
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";

  const [faculties, setFaculties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchFaculties = useCallback(() => {
    setLoading(true);
    universityService.faculties
      .list({ page, limit: pagination.limit, search: debouncedSearch })
      .then(({ items, pagination: pg }) => {
        setFaculties(items);
        setPagination(pg);
      })
      .catch(() => toast.error(isFr ? "Erreur de chargement" : "Failed to load faculties"))
      .finally(() => setLoading(false));
  }, [page, pagination.limit, debouncedSearch, isFr]);

  useEffect(() => { fetchFaculties(); }, [fetchFaculties]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (faculty) => {
    setEditing(faculty);
    setForm({
      name: faculty.name || "",
      name_fr: faculty.nameFr || "",
      code: faculty.code || "",
      dean_name: faculty.deanName || "",
      email: faculty.email || "",
      phone: faculty.phone || "",
      building: faculty.building || "",
      established_year: faculty.establishedYear || "",
      is_active: faculty.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error(isFr ? "Nom et code requis" : "Name and code are required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      established_year: form.established_year ? Number(form.established_year) : null,
      is_active: Boolean(form.is_active),
    };
    try {
      if (editing) {
        const updated = await universityService.faculties.updateById(editing.id, payload);
        setFaculties((prev) => prev.map((f) => (f.id === editing.id ? { ...f, ...updated } : f)));
        toast.success(isFr ? "Faculté modifiée" : "Faculty updated");
      } else {
        const created = await universityService.faculties.create(payload);
        setFaculties((prev) => [created, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        toast.success(isFr ? "Faculté créée" : "Faculty created");
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message;
      toast.error(msg || (isFr ? "Erreur d'enregistrement" : "Failed to save faculty"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await universityService.faculties.delete(deleteTarget.id);
      setFaculties((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
      toast.success(isFr ? "Faculté supprimée" : "Faculty deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Suppression impossible" : "Failed to delete faculty"));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {t("faculties.title", "Faculties")}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr ? "Gestion des facultés de l'université" : "Manage university faculties"}
          </p>
        </div>
        <Button icon={<FiPlus />} onClick={openCreate}>
          {isFr ? "Ajouter une faculté" : "Add faculty"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isFr ? "Rechercher une faculté…" : "Search faculties…"}
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

      {/* Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
          </div>
        ) : faculties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-[64px] h-[64px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
              <FiHome className="w-7 h-7 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-500">
              {debouncedSearch
                ? (isFr ? "Aucune faculté ne correspond" : "No faculties match")
                : (isFr ? "Aucune faculté enregistrée" : "No faculties yet")}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {isFr ? "Ajoutez votre première faculté" : "Add your first faculty"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Nom</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">Doyen</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Départements</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Programmes</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400">Statut</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider uppercase text-surface-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((faculty) => (
                  <tr
                    key={faculty.id}
                    className="group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[14px] font-semibold text-surface-800 dark:text-surface-100">
                        {faculty.name}
                      </p>
                      {faculty.nameFr && (
                        <p className="text-xs text-surface-400 mt-0.5">{faculty.nameFr}</p>
                      )}
                      {faculty.establishedYear && (
                        <p className="text-[11px] text-surface-400 flex items-center gap-1 mt-1">
                          <FiCalendar className="w-3 h-3" /> {faculty.establishedYear}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold text-primary-700 dark:text-primary-300">
                        {faculty.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-surface-600 dark:text-surface-300">
                        {faculty.deanName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-surface-700 dark:text-surface-200">
                        <FiUsers className="w-3.5 h-3.5 text-surface-400" />
                        {faculty.departmentsCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-surface-700 dark:text-surface-200">
                        <FiAward className="w-3.5 h-3.5 text-surface-400" />
                        {faculty.programsCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          faculty.isActive
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-surface-100 dark:bg-surface-700 text-surface-500"
                        }`}
                      >
                        {faculty.isActive ? (isFr ? "Actif" : "Active") : (isFr ? "Inactif" : "Inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(faculty)}
                          className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-105 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all"
                          title={isFr ? "Modifier" : "Edit"}
                        >
                          <FiEdit2 className="w-3 h-3 text-primary-700" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(faculty)}
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
        title={editing ? (isFr ? "Modifier la faculté" : "Edit faculty") : (isFr ? "Nouvelle faculté" : "New faculty")}
        size="lg"
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
          <Input label={isFr ? "Nom (FR)" : "Name"} value={form.name} onChange={setField("name")} placeholder={isFr ? "Faculté des Sciences" : "Faculty of Sciences"} />
          <Input label={isFr ? "Nom (EN)" : "Name (EN)"} value={form.name_fr} onChange={setField("name_fr")} placeholder={isFr ? "Faculty of Sciences" : "Faculté des Sciences"} />
          <Input label="Code" value={form.code} onChange={setField("code")} placeholder="FST" />
          <Input label={isFr ? "Doyen" : "Dean"} value={form.dean_name} onChange={setField("dean_name")} placeholder={isFr ? "Nom du doyen" : "Dean name"} />
          <Input label="Email" type="email" value={form.email} onChange={setField("email")} placeholder="decanat@uni.edu" />
          <Input label={isFr ? "Téléphone" : "Phone"} value={form.phone} onChange={setField("phone")} placeholder="+237 ..." />
          <Input label={isFr ? "Bâtiment" : "Building"} value={form.building} onChange={setField("building")} placeholder={isFr ? "Bâtiment A" : "Building A"} />
          <Input label={isFr ? "Année de création" : "Established year"} type="number" value={form.established_year} onChange={setField("established_year")} placeholder="1995" />
        </div>
        <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(form.is_active)}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-600/30"
          />
          <span className="text-sm text-surface-700 dark:text-surface-200">
            {isFr ? "Faculté active" : "Active faculty"}
          </span>
        </label>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={isFr ? "Supprimer la faculté ?" : "Delete faculty?"}
        message={isFr
          ? `Voulez-vous vraiment supprimer "${deleteTarget?.name}" ?`
          : `Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel={isFr ? "Supprimer" : "Delete"}
        cancelLabel={isFr ? "Annuler" : "Cancel"}
      />
    </div>
  );
}
