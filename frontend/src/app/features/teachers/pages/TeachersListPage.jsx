import { useState, useEffect, useCallback, useContext } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../../core/api/userManagementService";
import { YearContext } from "../../../core/context/YearContext";
import { getRoles } from "../../../core/api/roleService";
import { FiUsers } from "react-icons/fi";
import {
  Button,
  Card,
  Drawer,
  Input,
  Select,
  Modal,
  Badge,
  EmptyState,
  Table,
  PageHeader,
  Skeleton,
} from "../../../components";

export default function TeachersListPage() {
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const { selectedYearId } = useContext(YearContext);

  const [teachers, setTeachers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "teacher",
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTeachers = useCallback(async () => {
    const filter = selectedYearId ? { academicYearId: selectedYearId } : {};
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers({ ...filter, role: "teacher", limit: 100 });
      setTeachers(Array.isArray(data) ? data : data?.users || data?.rows || []);
    } catch (err) {
      console.error("Failed to load teachers:", err);
      setError(
        lang === "fr"
          ? "Erreur lors du chargement des enseignants"
          : "Failed to load teachers"
      );
    } finally {
      setLoading(false);
    }
  }, [lang, yearFilter]);

  const loadRoles = useCallback(async () => {
    try {
      const data = await getRoles();
      setRoles(Array.isArray(data) ? data : data?.roles || []);
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
    loadRoles();
  }, [loadTeachers, loadRoles]);

  // ── Open drawer for create ──
  const openCreateDrawer = () => {
    setEditingTeacher(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: "teacher",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  // ── Open drawer for edit ──
  const openEditDrawer = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      password: "",
      phone: teacher.phone || "",
      role: teacher.role || teacher.roles?.[0] || "teacher",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  // ── Validate form ──
  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) {
      errors.firstName =
        lang === "fr" ? "Le prénom est requis" : "First name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName =
        lang === "fr" ? "Le nom est requis" : "Last name is required";
    }
    if (!formData.email.trim()) {
      errors.email =
        lang === "fr" ? "L'email est requis" : "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email =
        lang === "fr" ? "Email invalide" : "Invalid email";
    }
    if (!editingTeacher && !formData.password) {
      errors.password =
        lang === "fr"
          ? "Le mot de passe est requis (min. 8 caractères)"
          : "Password is required (min. 8 characters)";
    } else if (formData.password && formData.password.length < 8) {
      errors.password =
        lang === "fr"
          ? "Le mot de passe doit avoir au moins 8 caractères"
          : "Password must be at least 8 characters";
    }
    if (!formData.role) {
      errors.role =
        lang === "fr" ? "Le rôle est requis" : "Role is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Save teacher ──
  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
      };

      if (editingTeacher) {
        // Only send password if it was changed
        if (formData.password) payload.password = formData.password;
        await updateUser(editingTeacher.id, payload);
        toast.success(
          lang === "fr" ? "Enseignant mis à jour" : "Teacher updated"
        );
      } else {
        payload.password = formData.password;
        await createUser(payload);
        toast.success(
          lang === "fr" ? "Enseignant créé" : "Teacher created"
        );
      }

      setDrawerOpen(false);
      loadTeachers();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (lang === "fr"
          ? "Erreur lors de l'enregistrement"
          : "Failed to save teacher");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Deactivate teacher ──
  const openDeleteModal = (teacher) => {
    setDeletingTeacher(teacher);
    setDeleteModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (!deletingTeacher) return;
    setDeleting(true);
    try {
      await deleteUser(deletingTeacher.id);
      toast.success(
        lang === "fr"
          ? "Enseignant désactivé"
          : "Teacher deactivated"
      );
      setDeleteModalOpen(false);
      setDeletingTeacher(null);
      loadTeachers();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (lang === "fr"
          ? "Erreur lors de la désactivation"
          : "Failed to deactivate teacher");
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Role options ──
  const roleOptions = [
    { value: "teacher", label: lang === "fr" ? "Enseignant" : "Teacher" },
    { value: "admin", label: lang === "fr" ? "Administrateur" : "Admin" },
    { value: "accountant", label: lang === "fr" ? "Comptable" : "Accountant" },
    ...(roles.length > 0
      ? roles.map((r) => ({
          value: r.code || r.name,
          label: r.name || r.code,
        }))
      : []),
  ];

  // ── Get display role ──
  const getDisplayRole = (teacher) => {
    const role = teacher.role || teacher.roles?.[0] || "";
    const r = roleOptions.find(
      (o) => o.value === role || o.value === role.toLowerCase()
    );
    return r?.label || role;
  };

  // ── Table columns ──
  const columns = [
    {
      key: "name",
      label: lang === "fr" ? "Enseignant" : "Teacher",
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
            <div className="text-xs text-surface-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: lang === "fr" ? "Téléphone" : "Phone",
      width: 140,
      render: (val) => (
        <span className="text-sm text-surface-500 dark:text-surface-400">
          {val || "—"}
        </span>
      ),
    },
    {
      key: "role",
      label: lang === "fr" ? "Rôle" : "Role",
      width: 130,
      render: (_, row) => (
        <Badge variant="dot" status={row.role || row.roles?.[0] || "teacher"}>
          {getDisplayRole(row)}
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
            onClick={(e) => {
              e.stopPropagation();
              openEditDrawer(row);
            }}
          >
            {lang === "fr" ? "Modifier" : "Edit"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(row);
            }}
          >
            {lang === "fr" ? "Désac." : "Deact."}
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
          title={lang === "fr" ? "Enseignants" : "Teachers"}
          subtitle={
            lang === "fr"
              ? "Gérer le corps enseignant"
              : "Manage your teaching staff"
          }
        />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button variant="primary" onClick={loadTeachers}>
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
        title={lang === "fr" ? "Enseignants" : "Teachers"}
        subtitle={
          lang === "fr"
            ? "Gérer le corps enseignant de votre établissement"
            : "Manage your school's teaching staff"
        }
      />

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton variant="table" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<FiUsers className="w-8 h-8" />}
              title={
                lang === "fr"
                  ? "Aucun enseignant"
                  : "No teachers yet"
              }
              subtitle={
                lang === "fr"
                  ? "Ajoutez des enseignants pour commencer à gérer les classes et matières"
                  : "Add teachers to start managing classes and subjects"
              }
              action={
                <Button variant="primary" onClick={openCreateDrawer}>
                  {lang === "fr"
                    ? "+ Ajouter un enseignant"
                    : "+ Add Teacher"}
                </Button>
              }
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={teachers}
            searchable
            searchPlaceholder={
              lang === "fr"
                ? "Rechercher un enseignant..."
                : "Search teachers..."
            }
            emptyMessage={
              lang === "fr"
                ? "Aucun enseignant trouvé"
                : "No teachers found"
            }
            onRowClick={(row) => openEditDrawer(row)}
            headerExtra={
              <Button variant="primary" size="sm" onClick={openCreateDrawer}>
                {lang === "fr" ? "+ Nouveau" : "+ New"}
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
          editingTeacher
            ? lang === "fr"
              ? `Modifier ${editingTeacher.firstName} ${editingTeacher.lastName}`
              : `Edit ${editingTeacher.firstName} ${editingTeacher.lastName}`
            : lang === "fr"
              ? "Nouvel enseignant"
              : "New Teacher"
        }
        size="md"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={lang === "fr" ? "Prénom" : "First Name"}
              placeholder={lang === "fr" ? "Ex: Jean" : "E.g.: John"}
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              error={formErrors.firstName}
              autoFocus
            />
            <Input
              label={lang === "fr" ? "Nom" : "Last Name"}
              placeholder={lang === "fr" ? "Ex: Dupont" : "E.g.: Doe"}
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              error={formErrors.lastName}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="exemple@email.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={formErrors.email}
          />

          <Input
            label={lang === "fr" ? "Téléphone (optionnel)" : "Phone (optional)"}
            type="tel"
            placeholder="+237 6XX XXX XXX"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <Input
            label={
              editingTeacher
                ? lang === "fr"
                  ? "Nouveau mot de passe (laisser vide pour conserver)"
                  : "New password (leave blank to keep current)"
                : lang === "fr"
                  ? "Mot de passe"
                  : "Password"
            }
            type="password"
            placeholder={
              editingTeacher ? "••••••••" : lang === "fr"
                ? "Minimum 8 caractères"
                : "Minimum 8 characters"
            }
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={formErrors.password}
          />

          <Select
            label={lang === "fr" ? "Rôle" : "Role"}
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            options={roleOptions}
            error={formErrors.role}
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
              {editingTeacher
                ? lang === "fr"
                  ? "Mettre à jour"
                  : "Update"
                : lang === "fr"
                  ? "Créer"
                  : "Create"}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={
          lang === "fr"
            ? "Confirmer la désactivation"
            : "Confirm Deactivation"
        }
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
              onClick={handleDeactivate}
              loading={deleting}
              fullWidth
            >
              {lang === "fr" ? "Désactiver" : "Deactivate"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-surface-600 dark:text-surface-300">
          {lang === "fr"
            ? `Êtes-vous sûr de vouloir désactiver ${deletingTeacher?.firstName} ${deletingTeacher?.lastName} ? Il/elle ne pourra plus se connecter.`
            : `Are you sure you want to deactivate ${deletingTeacher?.firstName} ${deletingTeacher?.lastName}? They will no longer be able to log in.`}
        </p>
      </Modal>
    </div>
  );
}
