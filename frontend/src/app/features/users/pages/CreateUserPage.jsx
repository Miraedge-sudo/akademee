import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiUserPlus,
  FiMail,
  FiSend,
  FiEye,
  FiEyeOff,
  FiCamera,
  FiUpload,
  FiX,
  FiUser,
  FiShield,
  FiBookOpen,
  FiAward,
  FiDollarSign,
  FiClipboard,
  FiHeart,
  FiInfo,
  FiUsers,
  FiLayers,
  FiCalendar,
  FiPhone,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { createUser } from "../../../core/api/userManagementService";
import { getClasses } from "../../../core/api/classService";
import { getSubjects } from "../../../core/api/subjectService";

// ── Role Configuration ──────────────────────────────────
const ROLES_CONFIG = {
  ADMIN: {
    icon: FiShield,
    color: "#085041",
    bg: "#E1F5EE",
    label: "Admin",
    labelFr: "Admin",
    desc: "Full school access",
    descFr: "Accès complet à l'école",
  },
  TEACHER: {
    icon: FiBookOpen,
    color: "#3B82F6",
    bg: "#EFF6FF",
    label: "Teacher",
    labelFr: "Enseignant",
    desc: "Classes & grade entry",
    descFr: "Classes et saisie des notes",
  },
  STUDENT: {
    icon: FiAward,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    label: "Student",
    labelFr: "Élève",
    desc: "Personal grades & fees",
    descFr: "Notes et frais personnels",
  },
  ACCOUNTANT: {
    icon: FiDollarSign,
    color: "#F59E0B",
    bg: "#FEF3C7",
    label: "Accountant",
    labelFr: "Comptable",
    desc: "Finance & fee management",
    descFr: "Gestion financière et des frais",
  },
  SECRETARY: {
    icon: FiClipboard,
    color: "#EC4899",
    bg: "#FDF2F8",
    label: "Secretary",
    labelFr: "Secrétaire",
    desc: "Enrollment & records",
    descFr: "Inscriptions et dossiers",
  },
  PARENT: {
    icon: FiHeart,
    color: "#14B8A6",
    bg: "#F0FDFA",
    label: "Parent",
    labelFr: "Parent",
    desc: "Monitor children",
    descFr: "Suivi des enfants",
  },
};



// ── Helpers ─────────────────────────────────────────────
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`
    : "8,80,65";
}

const SELECT_ARROW =
  'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%239BA59C\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E';

// ── Sub-components ──────────────────────────────────────

function FieldInput({ label, required, error, hint, className = "", ...props }) {
  const id = props.id || props.name;
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-[12.5px] font-bold text-surface-600 dark:text-surface-300 mb-1.5">
          {label}
          {required && <span className="text-primary-600 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`w-full h-[46px] px-3.5 border-[1.5px] border-surface-200 dark:border-surface-600 
          rounded-[10px] font-sans text-sm text-surface-800 dark:text-surface-100 
          bg-white dark:bg-surface-800 outline-none transition-all duration-200 
          placeholder:text-surface-300 dark:placeholder:text-surface-500
          focus:border-primary-600 focus:shadow-[0_0_0_4px_rgba(8,80,65,0.09)]
          ${error ? "!border-red-500 !shadow-[0_0_0_4px_rgba(239,68,68,0.07)]" : ""}
          ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, required, error, hint, children, className = "", value, onChange, placeholder, style, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-[12.5px] font-bold text-surface-600 dark:text-surface-300 mb-1.5">
          {label}
          {required && <span className="text-primary-600 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={`w-full h-[46px] px-3.5 pr-9 border-[1.5px] border-surface-200 dark:border-surface-600 
            rounded-[10px] font-sans text-sm text-surface-800 dark:text-surface-100 
            bg-white dark:bg-surface-800 outline-none transition-all duration-200
            appearance-none cursor-pointer
            focus:border-primary-600 focus:shadow-[0_0_0_4px_rgba(8,80,65,0.09)]
            ${error ? "!border-red-500" : ""}
            ${className}`}
          style={{ backgroundImage: `url("${SELECT_ARROW}")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", ...style }}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {children}
        </select>
      </div>
      {hint && !error && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-[18px]">
      <span className="text-[11px] font-bold tracking-[1.8px] uppercase text-surface-400 flex-shrink-0">
        {children}
      </span>
      <div className="flex-1 h-px bg-surface-100 dark:bg-surface-700" />
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px bg-surface-50 dark:bg-surface-700/50 my-[22px]" />;
}

// ── Checklist item ──
function ChecklistItem({ label, done, optional }) {
  return (
    <div className="flex items-center gap-2 py-[5px]">
      <div
        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-250 ${
          done ? "scale-110" : ""
        }`}
        style={
          done
            ? {
                backgroundColor: "var(--chk-color, #085041)",
                borderColor: "var(--chk-color, #085041)",
              }
            : {
                backgroundColor: "#EEF0EC",
                border: "1.5px solid #D8DBD5",
              }
        }
      >
        {done && (
          <svg viewBox="0 0 12 12" className="w-[9px] h-[9px] stroke-white stroke-[2.5] fill-none stroke-linecap-round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </div>
      <span
        className={`text-xs transition-colors ${
          done
            ? "text-surface-700 dark:text-surface-200 font-medium"
            : "text-surface-400"
        }`}
      >
        {label}
        {optional && (
          <span className="text-[10px] text-surface-300 dark:text-surface-500 ml-1">
            ({optional})
          </span>
        )}
      </span>
    </div>
  );
}

// ── Photo Upload ──
function PhotoUpload({ photo, onPhotoChange, onPhotoRemove }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPhotoChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4 mb-[22px]">
      <div
        className="w-[68px] h-[68px] rounded-full bg-surface-50 dark:bg-surface-800 border-[2.5px] border-dashed border-surface-200 dark:border-surface-600 flex items-center justify-center cursor-pointer overflow-hidden relative flex-shrink-0 transition-all hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
        onClick={() => fileRef.current?.click()}
      >
        {photo ? (
          <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover rounded-full" />
        ) : (
          <FiCamera className="w-[22px] h-[22px] text-surface-300 dark:text-surface-500" strokeWidth={1.5} />
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div>
        <p className="text-[13.5px] font-bold text-surface-800 dark:text-surface-100 mb-0.5">
          Upload profile photo
        </p>
        <p className="text-xs text-surface-400 mb-2">
          JPG or PNG · Max 2MB · Recommended: square image
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-surface-200 dark:border-surface-600 
              text-xs font-medium text-surface-600 dark:text-surface-300 bg-white dark:bg-surface-800 
              hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          >
            <FiUpload className="w-3 h-3" />
            Choose
          </button>
          {photo && (
            <button
              type="button"
              onClick={onPhotoRemove}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-surface-200 dark:border-surface-600 
                text-xs font-medium text-red-500 bg-white dark:bg-surface-800 
                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiX className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subject Chips ──
function SubjectChips({ subjects = [], selected, onToggle }) {
  if (subjects.length === 0) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-xs text-surface-400 italic">No subjects available — create subjects first</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {subjects.map((s) => {
        const name = s.name || s;
        return (
          <button
            key={s.id || name}
            type="button"
            onClick={() => onToggle(name)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all 
              duration-180 select-none ${
              selected.has(name)
                ? "!border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100"
                : "border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:border-surface-300 hover:scale-105"
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

// ── Class Tags ──
function ClassTags({ classes = [], selected, onAdd, onRemove }) {
  if (classes.length === 0) {
    return (
      <div>
        <span className="text-xs text-surface-400 italic">No classes available — create classes first</span>
      </div>
    );
  }
  return (
    <div>
      <div className="relative">
        <select
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v && !selected.has(v)) onAdd(v);
            e.target.value = "";
          }}
          className="w-full h-11 px-3.5 pr-9 border-[1.5px] border-surface-200 dark:border-surface-600 
            rounded-[10px] font-sans text-sm text-surface-800 dark:text-surface-100 
            bg-white dark:bg-surface-800 outline-none transition-all duration-200
            appearance-none cursor-pointer focus:border-primary-600"
          style={{ backgroundImage: `url("${SELECT_ARROW}")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
        >
          <option value="">+ Add a class</option>
          {classes.map((c) => {
            const name = c.name || c;
            return (
              <option key={c.id || name} value={name} disabled={selected.has(name)}>
                {name} {selected.has(name) ? "(added)" : ""}
              </option>
            );
          })}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">
        {[...selected].map((c) => (
          <div
            key={c}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 
              border border-primary-100 dark:border-primary-800 text-primary-900 dark:text-primary-100 
              text-xs font-semibold transition-all duration-200"
          >
            {c}
            <button
              type="button"
              onClick={() => onRemove(c)}
              className="w-4 h-4 rounded-full bg-primary-900/15 dark:bg-primary-100/15 text-primary-900 dark:text-primary-100 
                text-[10px] flex items-center justify-center hover:bg-primary-900/30 transition-colors"
            >
              <FiX className="w-2 h-2" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Role Card ──
function RoleCard({ role, config, selected, onClick }) {
  const Icon = config.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3 rounded-[10px] border-2 cursor-pointer text-center transition-all 
        duration-200 overflow-hidden bg-white dark:bg-surface-800
        ${selected ? "shadow-md -translate-y-0.5" : "hover:border-surface-300 hover:-translate-y-0.5 hover:shadow-sm"}`}
      style={{
        borderColor: selected ? config.color : undefined,
        background: selected ? `rgba(${hexToRgb(config.color)},0.04)` : undefined,
      }}
    >
      {/* Check mark */}
      <div
        className={`absolute top-2 right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-200`}
        style={selected ? { backgroundColor: config.color, borderColor: config.color } : { border: "2px solid #D8DBD5" }}
      >
        {selected && (
          <svg viewBox="0 0 12 12" className="w-[9px] h-[9px] stroke-white stroke-[2.5] fill-none stroke-linecap-round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </div>

      {/* Icon */}
      <div
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mx-auto mb-2"
        style={{ background: config.bg }}
      >
        <Icon className="w-[17px] h-[17px]" style={{ color: config.color, strokeWidth: 2 }} />
      </div>

      {/* Label */}
      <div className="text-[12.5px] font-bold text-surface-800 dark:text-surface-100 mb-0.5">
        {config.label}
      </div>
      <div className="text-[10.5px] text-surface-400 leading-[1.4]">
        {config.desc}
      </div>
    </button>
  );
}

// ── Guardian Form ──
function GuardianForm({ data, onChange }) {
  return (
    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-[10px] p-4 border border-surface-100 dark:border-surface-700">
      <div className="text-[12.5px] font-bold text-surface-600 dark:text-surface-300 mb-3 flex items-center gap-1.5">
        <FiUser className="w-3 h-3 text-surface-400" />
        Primary guardian
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldInput
          name="guardianFn"
          placeholder="Parent first name"
          value={data.guardianFn || ""}
          onChange={(e) => onChange("guardianFn", e.target.value)}
        />
        <FieldInput
          name="guardianLn"
          placeholder="Parent last name"
          value={data.guardianLn || ""}
          onChange={(e) => onChange("guardianLn", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <SelectField
          value={data.guardianRel || ""}
          onChange={(e) => onChange("guardianRel", e.target.value)}
          placeholder="Relationship"
        >
          <option>Father</option>
          <option>Mother</option>
          <option>Guardian</option>
          <option>Other</option>
        </SelectField>
        <FieldInput
          name="guardianPhone"
          type="tel"
          placeholder="+237 6XX XXX XXX"
          value={data.guardianPhone || ""}
          onChange={(e) => onChange("guardianPhone", e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export default function CreateUserPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const { primaryColor } = useTheme();
  const [searchParams] = useSearchParams();
  const lang = i18n.language === "fr" ? "fr" : "en";
  const isFr = lang === "fr";
  const pc = primaryColor || "#085041";

  // ── State ──
  const [selectedRole, setSelectedRole] = useState("TEACHER");
  const [mode, setMode] = useState("create");
  const [photo, setPhoto] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [errors, setErrors] = useState({});
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", gender: "", dob: "", phone: "", email: "",
    password: "", password2: "", notes: "",
    empType: "", qualif: "",
    studentClass: "", matricule: "", enrollType: "New student", nationality: "",
    guardianFn: "", guardianLn: "", guardianRel: "", guardianPhone: "",
    feeAmount: "", feeDeadline: "",
    inviteEmail: "", inviteName: "",
  });

  // ── Load real classes & subjects from API ──
  useEffect(() => {
    getClasses({ limit: 200 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.classes || [];
        setAllClasses(list);
      })
      .catch(() => {});
    getSubjects({ limit: 200 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.subjects || [];
        setAllSubjects(list);
      })
      .catch(() => {});
  }, []);

  // ── Pre-fill role from URL ?role=... ──
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && ROLES_CONFIG[roleParam.toUpperCase()]) {
      setSelectedRole(roleParam.toUpperCase());
    }
  }, [searchParams]);

  // ── Helpers ──
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const roleConfig = ROLES_CONFIG[selectedRole];

  // ── Preview computed ──
  const previewName = useMemo(() => {
    const fn = formData.firstName?.trim() || "";
    const ln = formData.lastName?.trim() || "";
    return fn || ln ? `${fn} ${ln}`.trim() : "Full name";
  }, [formData.firstName, formData.lastName]);

  const previewInitials = useMemo(() => {
    const fn = formData.firstName?.[0] || "";
    const ln = formData.lastName?.[0] || "";
    return fn || ln ? `${fn}${ln}`.toUpperCase() : "—";
  }, [formData.firstName, formData.lastName]);

  const previewExtra1 = useMemo(() => {
    if (selectedRole === "TEACHER") {
      const subs = [...selectedSubjects];
      return subs.length ? subs.slice(0, 2).join(", ") + (subs.length > 2 ? "..." : "") : "";
    }
    if (selectedRole === "STUDENT") return formData.studentClass || "";
    return "";
  }, [selectedRole, selectedSubjects, formData.studentClass]);

  const previewExtra2 = useMemo(() => {
    if (selectedRole === "STUDENT") {
      return formData.feeAmount ? `${parseInt(formData.feeAmount || "0").toLocaleString("fr")} FCFA` : "";
    }
    if (selectedRole === "TEACHER") {
      const cls = [...selectedClasses];
      return cls.length ? cls.slice(0, 2).join(", ") + (cls.length > 2 ? "..." : "") : "";
    }
    return "";
  }, [selectedRole, selectedClasses, formData.feeAmount]);

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (!formData.firstName?.trim()) errs.firstName = "First name is required";
    if (!formData.lastName?.trim()) errs.lastName = "Last name is required";
    if (!formData.email?.trim()?.includes("@")) errs.email = "A valid email is required";
    if (!formData.password || formData.password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(isFr ? "Veuillez remplir tous les champs obligatoires" : "Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await createUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        roleCode: selectedRole,
      });
      setShowSuccess(true);
      toast.success(isFr ? "Utilisateur créé avec succès !" : "User created successfully!");
    } catch (err) {
      const apiMsg = err?.response?.data?.message || err?.message;
      toast.error(apiMsg || (isFr ? "Erreur lors de la création" : "Error creating user"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    if (!formData.inviteEmail?.trim()) {
      toast.error(isFr ? "Veuillez entrer une adresse email" : "Please enter an email address");
      return;
    }
    toast.success(isFr ? `Invitation envoyée à ${formData.inviteEmail}` : `Invitation sent to ${formData.inviteEmail}`);
  };

  const handleAddAnother = () => {
    setShowSuccess(false);
    setFormData({
      firstName: "", lastName: "", gender: "", dob: "", phone: "", email: "",
      password: "", password2: "", notes: "",
      empType: "", qualif: "",
      studentClass: "", matricule: "", enrollType: "New student", nationality: "",
      guardianFn: "", guardianLn: "", guardianRel: "", guardianPhone: "",
      feeAmount: "", feeDeadline: "",
      inviteEmail: "", inviteName: "",
    });
    setSelectedSubjects(new Set());
    setSelectedClasses(new Set());
    setPhoto(null);
    setErrors({});
  };

  // ── Dynamic sections ──
  const renderDynamicSections = () => {
    switch (selectedRole) {
      case "TEACHER":
        return (
          <>
            <SectionDivider />
            <SectionTitle>Teaching assignment</SectionTitle>
            <SelectField
              value={formData.empType}
              onChange={(e) => updateField("empType", e.target.value)}
              placeholder="Select type"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
            </SelectField>
            <FieldInput
              placeholder="e.g. MSc Mathematics, University of Yaoundé I"
              value={formData.qualif || ""}
              onChange={(e) => updateField("qualif", e.target.value)}
              name="qualif"
            />
            <div className="mb-[18px]">
              <label className="block text-[12.5px] font-bold text-surface-600 dark:text-surface-300 mb-1.5">
                Subjects to teach
              </label>
              <SubjectChips
                subjects={allSubjects}
                selected={selectedSubjects}
                onToggle={(s) => {
                  setSelectedSubjects((prev) => {
                    const next = new Set(prev);
                    next.has(s) ? next.delete(s) : next.add(s);
                    return next;
                  });
                }}
              />
            </div>
            <div className="mb-[18px]">
              <label className="block text-[12.5px] font-bold text-surface-600 dark:text-surface-300 mb-1.5">
                Assigned classes
              </label>
              <ClassTags
                classes={allClasses}
                selected={selectedClasses}
                onAdd={(c) => setSelectedClasses((prev) => new Set(prev).add(c))}
                onRemove={(c) => setSelectedClasses((prev) => {
                  const next = new Set(prev);
                  next.delete(c);
                  return next;
                })}
              />
            </div>
          </>
        );

      case "STUDENT":
        return (
          <>
            <SectionDivider />
            <SectionTitle>Academic information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                value={formData.studentClass || ""}
                onChange={(e) => updateField("studentClass", e.target.value)}
                placeholder="Select class"
                required
              >
                {allClasses.length === 0 ? (
                  <option value="" disabled>No classes available</option>
                ) : (
                  allClasses.map((c) => {
                    const name = c.name || c;
                    return <option key={c.id || name} value={name}>{name}</option>;
                  })
                )}
              </SelectField>
              <FieldInput
                placeholder="Auto-generated if empty"
                value={formData.matricule || ""}
                onChange={(e) => updateField("matricule", e.target.value)}
                name="matricule"
                hint="Leave empty to auto-generate"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                value={formData.enrollType || "New student"}
                onChange={(e) => updateField("enrollType", e.target.value)}
              >
                <option>New student</option>
                <option>Returning</option>
                <option>Transfer</option>
                <option>Repeating</option>
              </SelectField>
              <FieldInput
                placeholder="e.g. Cameroonian"
                value={formData.nationality || ""}
                onChange={(e) => updateField("nationality", e.target.value)}
                name="nationality"
              />
            </div>
            <SectionDivider />
            <SectionTitle>Guardian / Parent</SectionTitle>
            <GuardianForm
              data={formData}
              onChange={(field, value) => updateField(field, value)}
            />
            <SectionDivider />
            <SectionTitle>Fees</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput
                type="number"
                placeholder="e.g. 120000"
                value={formData.feeAmount || ""}
                onChange={(e) => updateField("feeAmount", e.target.value)}
                name="feeAmount"
              />
              <FieldInput
                type="date"
                value={formData.feeDeadline || ""}
                onChange={(e) => updateField("feeDeadline", e.target.value)}
                name="feeDeadline"
              />
            </div>
          </>
        );

      case "ACCOUNTANT":
      case "SECRETARY":
        return (
          <>
            <SectionDivider />
            <SectionTitle>Employment details</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                value={formData.empType || ""}
                onChange={(e) => updateField("empType", e.target.value)}
                placeholder="Select type"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </SelectField>
              <FieldInput type="date" value={formData.dob || ""} onChange={(e) => updateField("dob", e.target.value)} name="startDate" />
            </div>
            <FieldInput
              placeholder="e.g. Licensed accountant, 5 years experience"
              value={formData.qualif || ""}
              onChange={(e) => updateField("qualif", e.target.value)}
              name="qualif"
            />
          </>
        );

      case "PARENT":
        return (
          <>
            <SectionDivider />
            <SectionTitle>Children</SectionTitle>
            <div className="bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 rounded-[10px] p-4 mb-4 flex gap-3">
              <FiInfo className="w-4 h-4 text-primary-700 dark:text-primary-300 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
                After creating the parent account, you&apos;ll be able to link them to their children in the
                parent&apos;s profile settings.
              </div>
            </div>
            <FieldInput
              placeholder="Relationship to student(s)"
              value={formData.qualif || ""}
              onChange={(e) => updateField("qualif", e.target.value)}
              name="relationship"
            />
          </>
        );

      default:
        return null;
    }
  };

  // ── Checklist ──
  const checklistItems = useMemo(() => {
    const fn = formData.firstName?.trim();
    const ln = formData.lastName?.trim();
    const email = formData.email?.trim();
    const pwd = formData.password || "";
    const hasExtra = previewExtra1 !== "";

    return [
      { label: isFr ? "Rôle sélectionné" : "Role selected", done: true },
      { label: isFr ? "Nom complet saisi" : "Full name entered", done: !!(fn && ln) },
      { label: isFr ? "Adresse email définie" : "Email address set", done: !!(email && email.includes("@")) },
      { label: isFr ? "Mot de passe défini" : "Password set", done: pwd.length >= 8 },
      {
        label: selectedRole === "TEACHER"
          ? (isFr ? "Matières assignées" : "Subjects assigned")
          : selectedRole === "STUDENT"
            ? (isFr ? "Classe assignée" : "Class assigned")
            : (isFr ? "Infos employé" : "Employment info"),
        done: hasExtra,
        optional: "optional",
      },
      { label: isFr ? "Photo téléchargée" : "Photo uploaded", done: !!photo, optional: "optional" },
    ];
  }, [formData, selectedRole, previewExtra1, photo, isFr]);

  // ── Labels ──
  const roleLabel = roleConfig?.label || "";
  const extra1Label = selectedRole === "TEACHER" ? (isFr ? "Matières" : "Subjects")
    : selectedRole === "STUDENT" ? (isFr ? "Classe" : "Class")
    : "";
  const extra2Label = selectedRole === "STUDENT" ? (isFr ? "Frais annuels" : "Annual fee")
    : selectedRole === "TEACHER" ? (isFr ? "Classes" : "Classes")
    : "";

  const inputClass =
    "w-full h-[46px] px-3.5 border-[1.5px] border-surface-200 dark:border-surface-600 rounded-[10px] font-sans text-sm text-surface-800 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-all duration-200 placeholder:text-surface-300 dark:placeholder:text-surface-500 focus:border-primary-600 focus:shadow-[0_0_0_4px_rgba(8,80,65,0.09)]";

  return (
    <div className="max-w-[1060px] mx-auto pb-20">
      {/* ── Success Overlay ── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="bg-white dark:bg-surface-800 rounded-2xl p-10 sm:p-12 text-center max-w-[460px] w-[90%] shadow-2xl"
          >
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${roleConfig?.bg || "#E1F5EE"}`, border: `3px solid ${roleConfig?.color || pc}33` }}
            >
              <FiCheckCircle className="w-9 h-9" style={{ color: roleConfig?.color || pc }} strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100 mb-2">
              {isFr ? "Utilisateur créé !" : "User created!"}
            </h2>
            <p className="text-sm text-surface-400 leading-relaxed mb-6">
              <strong>{previewName}</strong>
              {isFr ? " a été ajouté comme " : " has been added as "}
              <span style={{ color: roleConfig?.color || pc }}>{roleLabel}</span>.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleAddAnother}
                className="h-11 px-5 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                {isFr ? "Ajouter un autre" : "Add another"}
              </button>
              <Link
                to="/dashboard/users"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg text-white text-sm font-semibold shadow-md hover:translate-y-[-2px] transition-all"
                style={{
                  backgroundColor: pc,
                  boxShadow: `0 4px 14px rgba(${hexToRgb(pc)},0.22)`,
                }}
              >
                <FiUsers className="w-4 h-4" />
                {isFr ? "Voir tous les utilisateurs" : "View all users"}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <header className="mb-7">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-surface-400 mb-2">
          <Link to="/dashboard" className="hover:text-primary-600 transition-colors">
            {isFr ? "Tableau de bord" : "Dashboard"}
          </Link>
          <FiChevronRight className="w-3 h-3" />
          <Link to="/dashboard/users" className="hover:text-primary-600 transition-colors">
            {isFr ? "Utilisateurs" : "Users"}
          </Link>
          <FiChevronRight className="w-3 h-3" />
          <span className="text-surface-800 dark:text-surface-100 font-medium">
            {isFr ? "Ajouter un utilisateur" : "Add user"}
          </span>
        </nav>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-[26px] rounded-full" style={{ backgroundColor: pc }} />
          <h1 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100">
            {isFr ? "Ajouter un nouvel utilisateur" : "Add a new user"}
          </h1>
        </div>
        <p className="text-sm text-surface-400 ml-3.5">
          {isFr
            ? "Créez un compte ou envoyez une invitation par email. Le rôle détermine les accès."
            : "Create an account or send an email invitation. The role determines what the user can access."}
        </p>
      </header>

      {/* ── Two-column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[22px] items-start">
        {/* ── Left: Form ── */}
        <div>
          {/* Mode Tabs */}
          <div className="flex gap-0 bg-surface-50 dark:bg-surface-800 rounded-[10px] p-1 border border-surface-100 dark:border-surface-700 mb-6">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 py-2 px-3 rounded-[8px] text-sm font-semibold cursor-pointer border-none
                transition-all duration-200 flex items-center justify-center gap-1.5 ${
                mode === "create"
                  ? "bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-100 shadow-sm"
                  : "bg-transparent text-surface-400 hover:text-surface-600"
              }`}
            >
              <FiUserPlus className="w-3.5 h-3.5" />
              {isFr ? "Créer manuellement" : "Create manually"}
            </button>
            <button
              type="button"
              onClick={() => setMode("invite")}
              className={`flex-1 py-2 px-3 rounded-[8px] text-sm font-semibold cursor-pointer border-none
                transition-all duration-200 flex items-center justify-center gap-1.5 ${
                mode === "invite"
                  ? "bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-100 shadow-sm"
                  : "bg-transparent text-surface-400 hover:text-surface-600"
              }`}
            >
              <FiMail className="w-3.5 h-3.5" />
              {isFr ? "Inviter par email" : "Invite by email"}
            </button>
          </div>

          {/* ── Shared card (role selector + form content) ── */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-6 sm:p-7">
            {/* Role selector — visible in BOTH modes (as in original HTML design) */}
            <SectionTitle>{isFr ? "Sélectionner le rôle" : "Select role"}</SectionTitle>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 mb-7">
              {Object.entries(ROLES_CONFIG).map(([role, config]) => (
                <RoleCard
                  key={role}
                  role={role}
                  config={config}
                  selected={selectedRole === role}
                  onClick={() => {
                    setSelectedRole(role);
                    setSelectedSubjects(new Set());
                    setSelectedClasses(new Set());
                  }}
                />
              ))}
            </div>

            {/* ── CREATE FORM ── */}
            {mode === "create" && (
              <>
                {/* Photo */}
                <SectionTitle>{isFr ? "Photo de profil" : "Profile photo"}</SectionTitle>
                <PhotoUpload
                  photo={photo}
                  onPhotoChange={setPhoto}
                  onPhotoRemove={() => setPhoto(null)}
                />

                <SectionDivider />

                {/* Personal info */}
                <SectionTitle>{isFr ? "Informations personnelles" : "Personal information"}</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldInput
                    label={isFr ? "Prénom" : "First name"}
                    required
                    placeholder="e.g. Marie"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    name="firstName"
                    error={errors.firstName}
                  />
                  <FieldInput
                    label={isFr ? "Nom" : "Last name"}
                    required
                    placeholder="e.g. Abena"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    name="lastName"
                    error={errors.lastName}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SelectField
                    label={isFr ? "Genre" : "Gender"}
                    value={formData.gender || ""}
                    onChange={(e) => updateField("gender", e.target.value)}
                    placeholder="Select gender"
                  >
                    <option>Female</option>
                    <option>Male</option>
                  </SelectField>
                  <FieldInput
                    label={isFr ? "Date de naissance" : "Date of birth"}
                    type="date"
                    value={formData.dob || ""}
                    onChange={(e) => updateField("dob", e.target.value)}
                    name="dob"
                  />
                </div>
                <FieldInput
                  label={isFr ? "Numéro de téléphone" : "Phone number"}
                  type="tel"
                  placeholder="+237 6XX XXX XXX"
                  value={formData.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  name="phone"
                />

                <SectionDivider />

                {/* Account */}
                <SectionTitle>{isFr ? "Compte et accès" : "Account & access"}</SectionTitle>
                <FieldInput
                  label="Email"
                  required
                  type="email"
                  placeholder="user@grace-bilingual.cm"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  name="email"
                  hint={isFr ? "Utilisé pour se connecter à Akademee." : "Used to log in to Akademee."}
                  error={errors.email}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-bold text-surface-600 dark:text-surface-300 mb-1.5">
                      {isFr ? "Mot de passe" : "Password"} <span className="text-primary-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className={`${inputClass} pr-11 ${errors.password ? "!border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-bold text-surface-600 dark:text-surface-300 mb-1.5">
                      {isFr ? "Confirmer le mot de passe" : "Confirm password"} <span className="text-primary-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword2 ? "text" : "password"}
                        placeholder="Repeat password"
                        value={formData.password2}
                        onChange={(e) => updateField("password2", e.target.value)}
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword2(!showPassword2)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPassword2 ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic sections */}
                {renderDynamicSections()}

                <SectionDivider />
                <SectionTitle>{isFr ? "Notes additionnelles" : "Additional notes"}</SectionTitle>
                <div className="mb-[18px]">
                  <textarea
                    rows="3"
                    placeholder={isFr ? "Toute information pertinente — visible uniquement par les admins" : "Any relevant information — visible to admins only"}
                    value={formData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className={`${inputClass} h-auto min-h-[80px] py-3 resize-y leading-relaxed`}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to="/dashboard/users"
                    className="inline-flex items-center gap-1.5 h-[46px] px-5 rounded-[10px] border border-surface-200 dark:border-surface-600 
                      text-sm font-semibold text-surface-600 dark:text-surface-300 bg-white dark:bg-surface-800 
                      hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    {isFr ? "Annuler" : "Cancel"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 h-[46px] px-5 rounded-[10px] text-white text-sm font-bold 
                      transition-all shadow-md disabled:opacity-55 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: pc,
                      boxShadow: `0 4px 14px rgba(${hexToRgb(pc)},0.22)`,
                    }}
                  >
                    {submitting ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiUserPlus className="w-4 h-4" />
                    )}
                    {submitting
                      ? (isFr ? "Création..." : "Creating...")
                      : (isFr ? "Créer l'utilisateur" : "Create user")}
                  </button>
                </div>
              </>
            )}

            {/* ── INVITE FORM ── */}
            {mode === "invite" && (
              <>
                <SectionTitle>{isFr ? "Détails de l'invitation" : "Invitation details"}</SectionTitle>
                <FieldInput
                  label="Email"
                  required
                  type="email"
                  placeholder="teacher@example.com"
                  value={formData.inviteEmail}
                  onChange={(e) => updateField("inviteEmail", e.target.value)}
                  name="inviteEmail"
                  hint={isFr
                    ? "Un email d'invitation avec un lien de configuration sera envoyé à cette adresse."
                    : "An invitation email with a setup link will be sent to this address."}
                />
                <FieldInput
                  label={isFr ? "Prénom" : "First name"}
                  placeholder={isFr ? "Optionnel — personnalise l'email" : "Optional — personalize the email"}
                  value={formData.inviteName}
                  onChange={(e) => updateField("inviteName", e.target.value)}
                  name="inviteName"
                />
                <div className="bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 rounded-[10px] p-4 mb-6 flex gap-3">
                  <FiInfo className="w-4 h-4 text-primary-700 dark:text-primary-300 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
                    {isFr
                      ? "L'utilisateur invité recevra un email avec un lien pour définir son propre mot de passe et compléter son profil. Le lien expire dans 48 heures."
                      : "The invited user will receive an email with a link to set their own password and complete their profile. The link expires in 48 hours."}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/dashboard/users"
                    className="inline-flex items-center gap-1.5 h-[46px] px-5 rounded-[10px] border border-surface-200 dark:border-surface-600 
                      text-sm font-semibold text-surface-600 dark:text-surface-300 bg-white dark:bg-surface-800 
                      hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    {isFr ? "Annuler" : "Cancel"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleInvite}
                    className="inline-flex items-center gap-2 h-[46px] px-5 rounded-[10px] text-white text-sm font-bold transition-all shadow-md"
                    style={{
                      backgroundColor: pc,
                      boxShadow: `0 4px 14px rgba(${hexToRgb(pc)},0.22)`,
                    }}
                  >
                    <FiSend className="w-4 h-4" />
                    {isFr ? "Envoyer l'invitation" : "Send invitation"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Live Preview ── */}
        <div className="hidden lg:block">
          <div className="lg:sticky lg:top-24">
            {/* Preview Card */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-5">
              <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-surface-400 mb-3.5">
                {isFr ? "Aperçu en direct" : "Live preview"}
              </p>

              {/* Avatar */}
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2.5 overflow-hidden relative transition-all duration-300"
                  style={{ background: roleConfig?.bg || "#E1F5EE" }}
                >
                  {photo ? (
                    <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold" style={{ color: roleConfig?.color || pc }}>
                      {previewInitials}
                    </span>
                  )}
                </div>
                <div className="font-display text-base font-bold text-surface-800 dark:text-surface-100 mb-0.5 min-h-[22px]">
                  {previewName}
                </div>
                <div className="text-center mb-3.5">
                  <span
                    className="inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: `rgba(${hexToRgb(roleConfig?.color || pc)},0.1)`,
                      color: roleConfig?.color || pc,
                      border: `1px solid rgba(${hexToRgb(roleConfig?.color || pc)},0.2)`,
                    }}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="h-px bg-surface-100 dark:bg-surface-700 my-3.5" />

              {/* Email */}
              <div className="flex items-center gap-2 py-1.5 border-b border-surface-50 dark:border-surface-700/50 text-xs">
                <div className="w-[26px] h-[26px] rounded-lg bg-surface-50 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                  <FiMail className="w-3 h-3 text-surface-400" />
                </div>
                <span className="text-surface-400 flex-1">{isFr ? "Email" : "Email"}</span>
                <span className="text-surface-800 dark:text-surface-100 font-semibold text-right max-w-[55%] truncate">
                  {formData.email || "—"}
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 py-1.5 border-b border-surface-50 dark:border-surface-700/50 text-xs">
                <div className="w-[26px] h-[26px] rounded-lg bg-surface-50 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                  <FiPhone className="w-3 h-3 text-surface-400" />
                </div>
                <span className="text-surface-400 flex-1">{isFr ? "Téléphone" : "Phone"}</span>
                <span className="text-surface-800 dark:text-surface-100 font-semibold text-right max-w-[55%] truncate">
                  {formData.phone || "—"}
                </span>
              </div>

              {/* Extra 1 */}
              {previewExtra1 && extra1Label && (
                <div className="flex items-center gap-2 py-1.5 border-b border-surface-50 dark:border-surface-700/50 text-xs">
                  <div className="w-[26px] h-[26px] rounded-lg bg-surface-50 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <FiLayers className="w-3 h-3 text-surface-400" />
                  </div>
                  <span className="text-surface-400 flex-1">{extra1Label}</span>
                  <span className="text-surface-800 dark:text-surface-100 font-semibold text-right max-w-[55%] truncate">
                    {previewExtra1}
                  </span>
                </div>
              )}

              {/* Extra 2 */}
              {previewExtra2 && extra2Label && (
                <div className="flex items-center gap-2 py-1.5 text-xs">
                  <div className="w-[26px] h-[26px] rounded-lg bg-surface-50 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <FiCalendar className="w-3 h-3 text-surface-400" />
                  </div>
                  <span className="text-surface-400 flex-1">{extra2Label}</span>
                  <span className="text-surface-800 dark:text-surface-100 font-semibold text-right max-w-[55%] truncate">
                    {previewExtra2}
                  </span>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-100 dark:border-surface-700 mt-4">
              <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-surface-400 mb-3">
                {isFr ? "Liste de vérification" : "Checklist"}
              </p>
              {checklistItems.map((item, i) => (
                <ChecklistItem key={i} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
