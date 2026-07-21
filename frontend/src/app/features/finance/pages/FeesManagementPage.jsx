/**
 * FeesManagementPage — Admin CRUD for fee structures.
 *
 * Features:
 *  - List all fees with search
 *  - Create fee (modal form)
 *  - Edit fee (modal form)
 *  - Delete fee (confirmation modal)
 *  - Assign fees to class (modal)
 *
 * Route: /dashboard/fees
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiXCircle,
  FiUsers,
} from "react-icons/fi";
import { getFees, createFee, updateFee, deleteFee, assignFeesToClass } from "../../../core/api/feeService";
import { getClasses } from "../../../core/api/classService";

const INITIAL_FORM = {
  name: "",
  amount: "",
  description: "",
};

function hexToRgba(hex, alpha) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
  return `rgba(8,80,65,${alpha})`;
}

function FormModal({ isOpen, onClose, onSubmit, initialData, loading, t }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        amount: initialData.amount?.toString() || "",
        description: initialData.description || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error(t("fees.nameRequired") || "Le nom est requis");
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error(t("fees.amountRequired") || "Le montant doit être supérieur à 0");
    onSubmit({
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      description: form.description.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl" style={{ background: hexToRgba("#085041", 0.1) }}>
              {isEditing ? <FiEdit2 className="w-5 h-5 m-2.5" style={{ color: "#085041" }} /> : <FiPlus className="w-5 h-5 m-2.5" style={{ color: "#085041" }} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? (t("fees.editTitle") || "Modifier le frais") : (t("fees.newTitle") || "Nouveau frais")}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? (t("fees.editDesc") || "Modifier les détails du frais") : (t("fees.newDesc") || "Définir un nouveau frais de scolarité")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors">
            <FiXCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("fees.nameField") || "Nom du frais *"}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
              placeholder={t("fees.namePlaceholder") || "Ex: Frais de scolarité 2025-2026"}
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("fees.amountField") || "Montant *"}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="500"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
                placeholder={t("fees.amountPlaceholder") || "Ex: 250000"}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">FCFA</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("fees.descriptionField") || "Description"}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm resize-y"
              placeholder={t("fees.descriptionPlaceholder") || "Description optionnelle du frais..."}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer">
              {t("actions.cancel") || "Annuler"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer inline-flex items-center gap-2"
              style={{ background: "#085041" }}
            >
              {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : isEditing ? <FiEdit2 className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
              {isEditing ? (t("actions.save") || "Enregistrer") : (t("fees.createBtn") || "Créer le frais")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ isOpen, onClose, onConfirm, loading, feeName, t }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FiTrash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t("fees.deleteTitle") || "Supprimer le frais"}</h3>
          <p className="text-sm text-gray-500 mb-1">
            {t("fees.deleteDesc") || "Êtes-vous sûr de vouloir supprimer ce frais ? Cette action est irréversible."}
          </p>
          <p className="text-sm font-medium text-gray-700 mb-6">&ldquo;{feeName}&rdquo;</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer">
              {t("actions.cancel") || "Annuler"}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiTrash2 className="w-4 h-4" />}
              {t("fees.deleteBtn") || "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ isOpen, onClose, onSubmit, loading, fees, t }) {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedFeeIds, setSelectedFeeIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      getClasses({ limit: 200 })
        .then((data) => setClasses(data?.classes || []))
        .catch(() => setClasses([]));
      setSelectedClassId("");
      setSelectedFeeIds([]);
    }
  }, [isOpen]);

  const toggleFee = (feeId) => {
    setSelectedFeeIds((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClassId) return toast.error(t("fees.selectClassRequired") || "Veuillez sélectionner une classe");
    if (selectedFeeIds.length === 0) return toast.error(t("fees.selectFeesRequired") || "Veuillez sélectionner au moins un frais");
    onSubmit({ classId: selectedClassId, feeIds: selectedFeeIds });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba("#085041", 0.1) }}>
              <FiUsers className="w-5 h-5" style={{ color: "#085041" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("fees.assignTitle") || "Assigner les frais"}</h2>
              <p className="text-sm text-gray-500">{t("fees.assignDesc") || "Attribuer des frais à une classe"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors">
            <FiXCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("fees.selectClass") || "Sélectionner une classe *"}</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
            >
              <option value="">{t("fees.classPlaceholder") || "Choisir une classe..."}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("fees.selectFees") || "Sélectionner les frais *"}</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2">
              {fees.map((fee) => {
                const isSelected = selectedFeeIds.includes(fee.id);
                return (
                  <label
                    key={fee.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-teal-50 border border-teal-200" : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFee(fee.id)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-700 focus:ring-teal-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{fee.name}</div>
                      <div className="text-xs text-gray-500">{Number(fee.amount).toLocaleString('en')} FCFA</div>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#085041" }}>
                      {Number(fee.amount).toLocaleString('en')} FCFA
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer">
              {t("actions.cancel") || "Annuler"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer inline-flex items-center gap-2"
              style={{ background: "#085041" }}
            >
              {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiUsers className="w-4 h-4" />}
              {t("fees.assignBtn") || "Assigner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeesManagementPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const isFr = i18n.language === "fr";

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showAssign, setShowAssign] = useState(false);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFees({ limit: 500 });
      setFees(data?.fees || []);
    } catch {
      toast.error(isFr ? "Échec du chargement des frais" : "Failed to load fees");
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [isFr]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await createFee(data);
      toast.success(isFr ? "Frais créé avec succès !" : "Fee created successfully!");
      setShowForm(false);
      fetchFees();
    } catch {
      toast.error(isFr ? "Échec de la création" : "Failed to create fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    if (!editItem) return;
    setSubmitting(true);
    try {
      await updateFee(editItem.id, data);
      toast.success(isFr ? "Frais mis à jour !" : "Fee updated!");
      setEditItem(null);
      setShowForm(false);
      fetchFees();
    } catch {
      toast.error(isFr ? "Échec de la mise à jour" : "Failed to update fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      await deleteFee(deleteItem.id);
      toast.success(isFr ? "Frais supprimé !" : "Fee deleted!");
      setDeleteItem(null);
      fetchFees();
    } catch {
      toast.error(isFr ? "Échec de la suppression" : "Failed to delete fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (data) => {
    setSubmitting(true);
    try {
      await assignFeesToClass(data);
      toast.success(isFr ? "Frais assignés à la classe !" : "Fees assigned to class!");
      setShowAssign(false);
    } catch {
      toast.error(isFr ? "Échec de l'assignation" : "Failed to assign fees");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = fees.filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fmFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fm-fade { animation: fmFadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-5 h-5" style={{ color: "#085041" }} />
                  <h1 className="text-xl font-bold text-gray-900">{isFr ? "Gestion des frais" : "Fee Management"}</h1>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isFr ? "Créer, modifier et gérer les frais de scolarité" : "Create, edit and manage school fees"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAssign(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <FiUsers className="w-4 h-4" />
                {isFr ? "Assigner" : "Assign"}
              </button>
              <button
                onClick={() => { setEditItem(null); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm"
                style={{ background: "#085041" }}
              >
                <FiPlus className="w-4 h-4" />
                {isFr ? "Nouveau frais" : "New Fee"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isFr ? "Rechercher un frais..." : "Search fees..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
              />
            </div>
            <button
              onClick={fetchFees}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats cards */}
        {!loading && fees.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: isFr ? "Total frais" : "Total Fees", value: fees.length, color: "#3B82F6" },
              { label: isFr ? "Montant total" : "Total Amount", value: `${fees.reduce((s, f) => s + Number(f.amount || 0), 0).toLocaleString('en')} FCFA`, color: "#085041" },
              { label: isFr ? "Moyenne" : "Average", value: `${Math.round(fees.reduce((s, f) => s + Number(f.amount || 0), 0) / fees.length).toLocaleString('en')} FCFA`, color: "#8B5CF6" },
              { label: isFr ? "Filtrés" : "Filtered", value: filtered.length, color: "#F59E0B" },
            ].map((stat, idx) => (
              <div key={idx} className="fm-fade bg-white rounded-xl border border-gray-200 p-4 shadow-sm" style={{ animationDelay: `${0.02 * idx}s` }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{stat.label}</div>
                <div className="text-[18px] font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Fees list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FiRefreshCw className="w-6 h-6 animate-spin" style={{ color: "#085041" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {search ? (isFr ? "Aucun résultat" : "No results") : (isFr ? "Aucun frais" : "No fees")}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {search
                  ? (isFr ? "Aucun frais ne correspond à votre recherche" : "No fees match your search")
                  : (isFr ? "Créez votre premier frais de scolarité" : "Create your first school fee")}
              </p>
              {!search && (
                <button
                  onClick={() => { setEditItem(null); setShowForm(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer"
                  style={{ background: "#085041" }}
                >
                  <FiPlus className="w-4 h-4" />
                  {isFr ? "Créer un frais" : "Create Fee"}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Header */}
              <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex-1 min-w-0">{isFr ? "Nom" : "Name"}</div>
                <div className="w-32 text-right">{isFr ? "Montant" : "Amount"}</div>
                <div className="w-28 text-right">{isFr ? "Créé le" : "Created"}</div>
                <div className="w-24 text-right">{isFr ? "Actions" : "Actions"}</div>
              </div>

              {filtered.map((fee, idx) => (
                <div
                  key={fee.id}
                  className="fm-fade flex flex-col md:flex-row md:items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
                  style={{ animationDelay: `${0.03 * idx}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{fee.name}</h4>
                    {fee.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{fee.description}</p>
                    )}
                  </div>

                  <div className="flex md:hidden items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: hexToRgba("#085041", 0.08), color: "#085041" }}>
                      {Number(fee.amount).toLocaleString('en')} FCFA
                    </span>
                  </div>

                  <div className="hidden md:block w-32 text-right">
                    <span className="text-sm font-bold" style={{ color: "#085041" }}>
                      {Number(fee.amount).toLocaleString('en')} FCFA
                    </span>
                  </div>

                  <div className="hidden md:block w-28 text-right">
                    <span className="text-xs text-gray-500">
                      {fee.createdAt ? new Date(fee.createdAt).toLocaleDateString(isFr ? "fr-FR" : "en-US") : "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 md:justify-end md:w-24">
                    <button
                      onClick={() => { setEditItem(fee); setShowForm(true); }}
                      className="w-9 h-9 rounded-lg hover:bg-teal-50 flex items-center justify-center transition-colors cursor-pointer"
                      style={{ color: "#085041" }}
                      title={isFr ? "Modifier" : "Edit"}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteItem(fee)}
                      className="w-9 h-9 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                      title={isFr ? "Supprimer" : "Delete"}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSubmit={editItem ? handleUpdate : handleCreate}
        initialData={editItem}
        loading={submitting}
        t={t}
      />
      <DeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={submitting}
        feeName={deleteItem?.name || ""}
        t={t}
      />
      <AssignModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onSubmit={handleAssign}
        loading={submitting}
        fees={fees}
        t={t}
      />
    </div>
  );
}
