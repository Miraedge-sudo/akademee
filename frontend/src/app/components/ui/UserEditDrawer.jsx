import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/hooks/useTheme";
import { useEducationalSystems } from "../../core/context/EducationalSystemContext";
import toast from "react-hot-toast";
import { updateStudent, createStudent } from "../../core/api/studentService";
import { updateUser, createUser } from "../../core/api/userManagementService";
import { getClasses } from "../../core/api/classService";
import { getSubjects } from "../../core/api/subjectService";
import { FiX, FiCheck, FiLoader, FiInfo } from "react-icons/fi";

// ── Role-specific config ────────────────────────────────
const ROLE_SECTIONS = {
  STUDENT: ["identity", "contact", "academic", "guardian", "fees"],
  TEACHER: ["identity", "contact", "teaching"],
  ADMIN: ["identity", "contact"],
  ACCOUNTANT: ["identity", "contact", "employment"],
  SECRETARY: ["identity", "contact", "employment"],
  PARENT: ["identity", "contact", "children"],
};

// ── Inline form components ──────────────────────────────

function FieldInput({ label, required, error, className = "", ...props }) {
  const id = props.id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[12.5px] font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`w-full h-[42px] px-3.5 rounded-lg border text-[13px] transition-all duration-200
          outline-none
          ${error
            ? "border-red-400 bg-red-50/50 dark:bg-red-900/10 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 hover:border-surface-300 dark:hover:border-surface-500"
          }
          placeholder:text-surface-400 dark:placeholder:text-surface-500
          ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function SelectField({ label, required, error, children, className = "", value, onChange, placeholder }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[12.5px] font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={`w-full h-[42px] px-3.5 pr-9 rounded-lg text-[13px] transition-all duration-200
            outline-none appearance-none cursor-pointer
            ${error
              ? "border-red-400 bg-red-50/50 dark:bg-red-900/10 text-red-900 dark:text-red-100"
              : "border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 hover:border-surface-300 dark:hover:border-surface-500"
            }
            ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-0.5 h-4 rounded-full bg-primary-500" />
      <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase text-surface-500 dark:text-surface-400">
        {children}
      </span>
    </div>
  );
}

function SubjectChips({ subjects = [], selected, onToggle }) {
  if (!subjects.length) {
    return <span className="text-[12px] text-surface-400 italic">No subjects available</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {subjects.map((s) => {
        const name = s.name || s;
        return (
          <button
            key={s.id || name}
            type="button"
            onClick={() => onToggle(name)}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all select-none ${
              selected.has(name)
                ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100"
                : "border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:border-surface-300"
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

// ── Role label helper ──
const ROLE_LABELS = {
  STUDENT: { fr: "Élève", en: "Student" },
  TEACHER: { fr: "Enseignant", en: "Teacher" },
  ADMIN: { fr: "Admin", en: "Admin" },
  ACCOUNTANT: { fr: "Comptable", en: "Accountant" },
  SECRETARY: { fr: "Secrétaire", en: "Secretary" },
  PARENT: { fr: "Parent", en: "Parent" },
};

// ── Status & gender options ──
const STATUS_OPTIONS = [
  { value: "active", fr: "Actif", en: "Active" },
  { value: "inactive", fr: "Inactif", en: "Inactive" },
];
const GENDER_OPTIONS = [
  { value: "male", fr: "Masculin", en: "Male" },
  { value: "female", fr: "Féminin", en: "Female" },
];

// ── Main Component ──────────────────────────────────────
export default function UserEditDrawer({ isOpen, onClose, onSuccess, user, role }) {
  const { i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const { selectedSystems } = useEducationalSystems();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const isFr = lang === "fr";
  const pc = primaryColor || "#085041";

  const isEditing = Boolean(user);
  const roleCode = role || user?.role || "TEACHER";
  const roleLabel = ROLE_LABELS[roleCode] || { fr: "Utilisateur", en: "User" };

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    gender: "male", dateOfBirth: "",
    // Student-specific
    classId: "", studentNumber: "", status: "active",
    educationalSystem: "",
    guardianFn: "", guardianLn: "", guardianRel: "", guardianPhone: "",
    feeAmount: "", feeDeadline: "",
    // Teacher-specific
    empType: "", qualif: "",
  });
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  // Load classes and subjects on open
  const loadClasses = async () => {
    try {
      const data = await getClasses({ limit: 200 });
      const list = Array.isArray(data) ? data : data?.classes || [];
      setClasses(list);
    } catch { /* ignore */ }
  };
  const loadSubjects = async () => {
    try {
      const data = await getSubjects({ limit: 200 });
      const list = Array.isArray(data) ? data : data?.subjects || [];
      setAllSubjects(list);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isOpen) {
      loadClasses();
      if (roleCode === "TEACHER") loadSubjects();
    }
  }, [isOpen, roleCode]);

  // Populate form when editing
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        gender: user.gender || "male",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        classId: user.classId || "",
        studentNumber: user.studentNumber || "",
        status: user.status || "active",
        educationalSystem: user.educationalSystem || "",
        guardianFn: user.guardianFn || "",
        guardianLn: user.guardianLn || "",
        guardianRel: user.guardianRel || "",
        guardianPhone: user.guardianPhone || "",
        feeAmount: user.feeAmount || "",
        feeDeadline: user.feeDeadline || "",
        empType: user.empType || "",
        qualif: user.qualif || "",
      });
      if (user.subjects) setSelectedSubjects(new Set(user.subjects));
    } else {
      setFormData({
        firstName: "", lastName: "", email: "", phone: "", password: "",
        gender: "male", dateOfBirth: "",
        classId: "", studentNumber: "", status: "active",
        educationalSystem: "",
        guardianFn: "", guardianLn: "", guardianRel: "", guardianPhone: "",
        feeAmount: "", feeDeadline: "",
        empType: "", qualif: "",
      });
      setSelectedSubjects(new Set());
    }
    setErrors({});
  }, [user, isOpen, roleCode]);

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = isFr ? "Le prénom est requis" : "First name is required";
    if (!formData.lastName.trim()) errs.lastName = isFr ? "Le nom est requis" : "Last name is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errs.email = isFr ? "Email invalide" : "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field) => (e) => {
    const value = e.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (roleCode === "STUDENT") {
        const payload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          password: formData.password || null,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || null,
          classId: formData.classId || null,
          className: classes.find((c) => c.id === formData.classId)?.name || null,
          studentNumber: formData.studentNumber.trim() || null,
          status: formData.status,
          educationalSystem: formData.educationalSystem || null,
        };
        if (isEditing) {
          await updateStudent(user.id, payload);
          toast.success(isFr ? "Élève mis à jour" : "Student updated");
        } else {
          await createStudent(payload);
          toast.success(isFr ? "Élève créé" : "Student created");
        }
      } else {
        const payload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          password: formData.password || null,
          roleCode,
        };
        if (isEditing) {
          await updateUser(user.id, payload);
          toast.success(isFr ? "Utilisateur mis à jour" : "User updated");
        } else {
          await createUser(payload);
          toast.success(isFr ? "Utilisateur créé" : "User created");
        }
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || (isFr ? "Erreur" : "Error");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Close on Escape ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = ((formData.firstName?.[0] || "") + (formData.lastName?.[0] || "")).toUpperCase() || "—";
  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || (isFr ? "Nouvel" : "New");
  const title = isEditing
    ? (isFr ? `Modifier ${fullName}` : `Edit ${fullName}`)
    : (isFr ? `Nouvel ${roleLabel.fr}` : `New ${roleLabel.en}`);

  const renderDynamicSections = () => {
    const sections = ROLE_SECTIONS[roleCode] || ["identity", "contact"];

    return sections.map((section) => {
      switch (section) {
        case "identity":
          return (
            <div key="identity">
              <SectionHeading>{isFr ? "Identité" : "Identity"}</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput label={isFr ? "Prénom" : "First Name"} required placeholder="e.g. Marie"
                  value={formData.firstName} onChange={handleChange("firstName")} error={errors.firstName} autoFocus />
                <FieldInput label={isFr ? "Nom" : "Last Name"} required placeholder="e.g. Abena"
                  value={formData.lastName} onChange={handleChange("lastName")} error={errors.lastName} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <SelectField label={isFr ? "Genre" : "Gender"} value={formData.gender} onChange={handleChange("gender")}>
                  {GENDER_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{isFr ? o.fr : o.en}</option>))}
                </SelectField>
                {(roleCode === "STUDENT" || roleCode === "TEACHER") && (
                  <FieldInput label={isFr ? "Date de naissance" : "Date of Birth"} type="date"
                    value={formData.dateOfBirth} onChange={handleChange("dateOfBirth")} />
                )}
              </div>
            </div>
          );

        case "contact":
          return (
            <div key="contact">
              <SectionHeading>{isFr ? "Contact & Connexion" : "Contact & Login"}</SectionHeading>
              <div className="space-y-3">
                <FieldInput label="Email" type="email" placeholder="user@email.com"
                  value={formData.email} onChange={handleChange("email")} error={errors.email} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldInput label={isFr ? "Téléphone" : "Phone"} type="tel" placeholder="+237 6XX XXX XXX"
                    value={formData.phone} onChange={handleChange("phone")} />
                  <FieldInput label={isFr ? "Mot de passe" : "Password"} type="password"
                    placeholder={isEditing ? (isFr ? "Laisser vide" : "Leave blank") : (isFr ? "Min. 8 car." : "Min. 8 chars")}
                    value={formData.password} onChange={handleChange("password")} />
                </div>
                {isEditing && (
                  <p className="text-[11px] text-surface-400 -mt-1.5">
                    {isFr ? "Laissez vide pour conserver l'actuel" : "Leave blank to keep current password"}
                  </p>
                )}
              </div>
            </div>
          );

        case "academic":
          return (
            <div key="academic">
              <SectionHeading>{isFr ? "Académique" : "Academic"}</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField label={isFr ? "Système éducatif" : "Educational System"} value={formData.educationalSystem}
                  onChange={handleChange("educationalSystem")} placeholder={isFr ? "Sélectionner" : "Select"}>
                  <option value="">{isFr ? "Aucun" : "None"}</option>
                  {selectedSystems.map((sys) => (<option key={sys} value={sys}>{sys}</option>))}
                </SelectField>
                <SelectField label={isFr ? "Classe" : "Class"} value={formData.classId}
                  onChange={handleChange("classId")} placeholder={isFr ? "Sélectionner" : "Select class"}>
                  {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </SelectField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <FieldInput label={isFr ? "Numéro étudiant" : "Student Number"} placeholder={isFr ? "Optionnel" : "Optional"}
                  value={formData.studentNumber} onChange={handleChange("studentNumber")} />
                <SelectField label={isFr ? "Statut" : "Status"} value={formData.status} onChange={handleChange("status")}>
                  {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{isFr ? o.fr : o.en}</option>))}
                </SelectField>
              </div>
            </div>
          );

        case "guardian":
          return (
            <div key="guardian">
              <SectionHeading>{isFr ? "Parent / Tuteur" : "Guardian"}</SectionHeading>
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-100 dark:border-surface-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldInput placeholder={isFr ? "Prénom du parent" : "Parent first name"}
                    value={formData.guardianFn} onChange={handleChange("guardianFn")} />
                  <FieldInput placeholder={isFr ? "Nom du parent" : "Parent last name"}
                    value={formData.guardianLn} onChange={handleChange("guardianLn")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <SelectField value={formData.guardianRel} onChange={handleChange("guardianRel")} placeholder={isFr ? "Lien" : "Relationship"}>
                    <option>Father</option><option>Mother</option><option>Guardian</option><option>Other</option>
                  </SelectField>
                  <FieldInput type="tel" placeholder="+237 6XX XXX XXX"
                    value={formData.guardianPhone} onChange={handleChange("guardianPhone")} />
                </div>
              </div>
            </div>
          );

        case "fees":
          return (
            <div key="fees">
              <SectionHeading>{isFr ? "Frais" : "Fees"}</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput type="number" placeholder={isFr ? "e.g. 120000" : "e.g. 120000"}
                  value={formData.feeAmount} onChange={handleChange("feeAmount")} />
                <FieldInput type="date" value={formData.feeDeadline} onChange={handleChange("feeDeadline")} />
              </div>
            </div>
          );

        case "teaching":
          return (
            <div key="teaching">
              <SectionHeading>{isFr ? "Enseignement" : "Teaching"}</SectionHeading>
              <SelectField value={formData.empType} onChange={handleChange("empType")} placeholder={isFr ? "Type" : "Type"}>
                <option>Full-time</option><option>Part-time</option><option>Contract</option>
              </SelectField>
              <div className="mt-3">
                <FieldInput placeholder={isFr ? "e.g. MSc Mathématiques" : "e.g. MSc Mathematics"}
                  value={formData.qualif} onChange={handleChange("qualif")} />
              </div>
              <div className="mt-4">
                <label className="block text-[12.5px] font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                  {isFr ? "Matières" : "Subjects"}
                </label>
                <SubjectChips subjects={allSubjects} selected={selectedSubjects}
                  onToggle={(s) => setSelectedSubjects((prev) => {
                    const next = new Set(prev);
                    next.has(s) ? next.delete(s) : next.add(s);
                    return next;
                  })} />
              </div>
            </div>
          );

        case "employment":
          return (
            <div key="employment">
              <SectionHeading>{isFr ? "Emploi" : "Employment"}</SectionHeading>
              <SelectField value={formData.empType} onChange={handleChange("empType")} placeholder={isFr ? "Type" : "Type"}>
                <option>Full-time</option><option>Part-time</option><option>Contract</option>
              </SelectField>
              <div className="mt-3">
                <FieldInput placeholder={isFr ? "Qualifications" : "Qualifications"}
                  value={formData.qualif} onChange={handleChange("qualif")} />
              </div>
            </div>
          );

        case "children":
          return (
            <div key="children">
              <SectionHeading>{isFr ? "Enfants" : "Children"}</SectionHeading>
              <div className="bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 rounded-xl p-4 flex gap-3">
                <FiInfo className="w-4 h-4 text-primary-700 dark:text-primary-300 flex-shrink-0 mt-0.5" />
                <div className="text-[12px] text-surface-600 dark:text-surface-400 leading-relaxed">
                  {isFr
                    ? "Après la création, vous pourrez lier les enfants dans les paramètres du parent."
                    : "After creation, you can link children in the parent's settings."}
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-surface-800
        shadow-2xl border-l border-surface-200 dark:border-surface-700 flex flex-col z-10 animate-slideInRight"
      >
        {/* ── Header ── */}
        <div className="relative flex-shrink-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-4"
          style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
        >
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center
              text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <FiX className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white text-base font-bold ring-2 ring-white/20 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-white truncate">{fullName || title}</h2>
              <p className="text-[12px] text-white/70">
                {isEditing
                  ? (isFr ? `Modifier ${roleLabel.fr}` : `Edit ${roleLabel.en}`)
                  : (isFr ? `Créer un ${roleLabel.fr}` : `Create ${roleLabel.en}`)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {renderDynamicSections()}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 h-[44px] rounded-xl border-2 border-surface-200 dark:border-surface-600
                text-surface-600 dark:text-surface-300 text-[13px] font-semibold
                hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
            >
              {isFr ? "Annuler" : "Cancel"}
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 h-[44px] rounded-xl text-white text-[13px] font-bold
                transition-all shadow-md disabled:opacity-55 disabled:cursor-not-allowed
                hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: pc, boxShadow: `0 4px 14px ${pc}38` }}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <FiLoader className="w-4 h-4 animate-spin" />
                  {isFr ? "Enregistrement..." : "Saving..."}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FiCheck className="w-4 h-4" />
                  {isEditing ? (isFr ? "Mettre à jour" : "Update") : (isFr ? "Créer" : "Create")}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
