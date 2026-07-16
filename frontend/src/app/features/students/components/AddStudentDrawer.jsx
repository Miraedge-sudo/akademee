import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createStudent, updateStudent } from "../../../core/api/studentService";
import { getClasses } from "../../../core/api/classService";
import { Drawer, Input, Select, Button } from "../../../components";

const STATUS_OPTIONS = [
  { value: "active", labelKey: "Actif", labelEn: "Active" },
  { value: "inactive", labelKey: "Inactif", labelEn: "Inactive" },
  { value: "graduated", labelKey: "Diplômé", labelEn: "Graduated" },
  { value: "transferred", labelKey: "Transféré", labelEn: "Transferred" },
  { value: "suspended", labelKey: "Suspendu", labelEn: "Suspended" },
];

const GENDER_OPTIONS = [
  { value: "male", labelKey: "Masculin", labelEn: "Male" },
  { value: "female", labelKey: "Féminin", labelEn: "Female" },
];

export default function AddStudentDrawer({ isOpen, onClose, onSuccess, student }) {
  const { i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const isEditing = Boolean(student);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "",
    gender: "male",
    className: "",
    classId: "",
    studentNumber: "",
    status: "active",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);

  // Load classes list
  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        phone: student.phone || "",
        password: "",
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
        gender: student.gender || "male",
        className: student.className || "",
        classId: student.classId || "",
        studentNumber: student.studentNumber || "",
        status: student.status || "active",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        dateOfBirth: "",
        gender: "male",
        className: "",
        classId: "",
        studentNumber: "",
        status: "active",
      });
    }
    setErrors({});
  }, [student, isOpen]);

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      const list = Array.isArray(data) ? data : data?.classes || data?.rows || [];
      setClasses(list);
    } catch (err) {
      console.error("Failed to load classes:", err);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim())
      errs.firstName = lang === "fr" ? "Le prénom est requis" : "First name is required";
    if (!formData.lastName.trim())
      errs.lastName = lang === "fr" ? "Le nom est requis" : "Last name is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      errs.email = lang === "fr" ? "Email invalide" : "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field) => (e) => {
    const value = e.target ? e.target.value : e;
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // When classId changes, auto-fill className from the class list
      if (field === "classId" && value) {
        const selected = classes.find((c) => c.id === value);
        if (selected) {
          updated.className = selected.name;
        }
      }
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        password: formData.password || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        className: formData.className || null,
        classId: formData.classId || null,
        studentNumber: formData.studentNumber.trim() || null,
        status: formData.status,
      };

      if (isEditing) {
        await updateStudent(student.id, payload);
        toast.success(lang === "fr" ? "Élève mis à jour" : "Student updated");
      } else {
        await createStudent(payload);
        toast.success(lang === "fr" ? "Élève créé" : "Student created");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message ||
        (lang === "fr" ? "Erreur lors de l'enregistrement" : "Failed to save student");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const statusOptions = STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: lang === "fr" ? o.labelKey : o.labelEn,
  }));

  const genderOptions = GENDER_OPTIONS.map((o) => ({
    value: o.value,
    label: lang === "fr" ? o.labelKey : o.labelEn,
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? lang === "fr"
            ? `Modifier ${formData.firstName} ${formData.lastName}`
            : `Edit ${formData.firstName} ${formData.lastName}`
          : lang === "fr"
            ? "Nouvel élève"
            : "New Student"
      }
      size="md"
    >
      <div className="space-y-5">
        {/* Section identité */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
            {lang === "fr" ? "Identité" : "Identity"}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={lang === "fr" ? "Prénom *" : "First Name *"}
              placeholder={lang === "fr" ? "Ex: Jean" : "Ex: John"}
              value={formData.firstName}
              onChange={handleChange("firstName")}
              error={errors.firstName}
              autoFocus
            />
            <Input
              label={lang === "fr" ? "Nom *" : "Last Name *"}
              placeholder={lang === "fr" ? "Ex: Dupont" : "Ex: Doe"}
              value={formData.lastName}
              onChange={handleChange("lastName")}
              error={errors.lastName}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input
              label={lang === "fr" ? "Date de naissance" : "Date of Birth"}
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange("dateOfBirth")}
            />
            <Select
              label={lang === "fr" ? "Genre" : "Gender"}
              value={formData.gender}
              onChange={handleChange("gender")}
              options={genderOptions}
            />
          </div>
        </div>

        {/* Section contact */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
            {lang === "fr" ? "Contact & Connexion" : "Contact & Login"}
          </h4>
          <Input
            label="Email"
            type="email"
            placeholder="exemple@email.com"
            value={formData.email}
            onChange={handleChange("email")}
            error={errors.email}
          />
          <div className="mt-4">
            <Input
              label={lang === "fr" ? "Téléphone" : "Phone"}
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={formData.phone}
              onChange={handleChange("phone")}
            />
          </div>
          <div className="mt-4">
            <Input
              label={lang === "fr" ? "Mot de passe" : "Password"}
              type="password"
              placeholder={isEditing ? (lang === "fr" ? "Laisser vide pour conserver" : "Leave blank to keep current") : (lang === "fr" ? "Minimum 6 caractères" : "Minimum 6 characters")}
              value={formData.password}
              onChange={handleChange("password")}
            />
            {isEditing && (
              <p className="text-[11px] text-surface-400 mt-1.5">
                {lang === "fr"
                  ? "Laissez vide pour conserver le mot de passe actuel"
                  : "Leave blank to keep the current password"}
              </p>
            )}
          </div>
        </div>

        {/* Section académique */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
            {lang === "fr" ? "Académique" : "Academic"}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={lang === "fr" ? "Classe" : "Class"}
              value={formData.classId}
              onChange={handleChange("classId")}
              options={classOptions}
              placeholder={lang === "fr" ? "Sélectionner une classe" : "Select a class"}
            />
            <Input
              label={lang === "fr" ? "Numéro étudiant" : "Student Number"}
              placeholder={lang === "fr" ? "Optionnel" : "Optional"}
              value={formData.studentNumber}
              onChange={handleChange("studentNumber")}
            />
          </div>
          <div className="mt-4">
            <Select
              label={lang === "fr" ? "Statut" : "Status"}
              value={formData.status}
              onChange={handleChange("status")}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
          <Button variant="secondary" onClick={onClose} fullWidth>
            {lang === "fr" ? "Annuler" : "Cancel"}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving} fullWidth>
            {isEditing
              ? lang === "fr" ? "Mettre à jour" : "Update"
              : lang === "fr" ? "Créer l'élève" : "Create Student"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
