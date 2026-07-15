import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import { useAuth } from "../../../core/hooks/useAuth";
import {
  getOnboardingData,
  saveOnboardingData,
  uploadMedia,
} from "../../../core/api/websiteService";
import akademeeLogo from "../../../../assets/Logo.png";
import { ThemeContext } from "../../../core/context/ThemeContext";
import { useEducationalSystems } from "../../../core/context/EducationalSystemContext";
import toast from "react-hot-toast";

const TEMPLATE_VISIBLE_STEPS = {
  bold: [1, 2, 3, 4, 5, 6, 7, 8],
  playful: [1, 2, 3, 4, 5, 6, 7, 8],
  premium: [1, 2, 3, 4, 5, 6, 7, 8],
};

const COLOR_PRESETS = [
  "#085041",
  "#1E40AF",
  "#7C3AED",
  "#B91C1C",
  "#B45309",
  "#0F766E",
  "#1D4ED8",
  "#047857",
  "#9D174D",
  "#374151",
];

const CLASS_PRESETS = {
  anglophone: [
    {
      level: "Junior",
      name: "Form 1 & 2",
      desc: "Middle school foundation",
      age: "Ages 12–14",
    },
    {
      level: "Junior",
      name: "Form 3",
      desc: "Pre-GCE introduction",
      age: "Ages 14–15",
    },
    {
      level: "Senior",
      name: "Form 4 & 5",
      desc: "GCE O-Level preparation",
      age: "Ages 15–17",
    },
    {
      level: "Senior",
      name: "Lower Sixth",
      desc: "GCE A-Level year 1",
      age: "Ages 17–18",
    },
    {
      level: "Senior",
      name: "Upper Sixth",
      desc: "GCE A-Level year 2",
      age: "Ages 18–19",
    },
  ],
  anglophone_technical: [
    {
      level: "Technical",
      name: "Form 1 & 2",
      desc: "Foundation in technical & general subjects",
      age: "Ages 12–14",
    },
    {
      level: "Technical",
      name: "Form 3",
      desc: "Introduction to technical streams",
      age: "Ages 14–15",
    },
    {
      level: "Technical",
      name: "Form 4 & 5",
      desc: "Technical & vocational GCE O-Level",
      age: "Ages 15–17",
    },
    {
      level: "Technical",
      name: "Lower Sixth Tech",
      desc: "Advanced technical A-Level entry",
      age: "Ages 17–18",
    },
    {
      level: "Technical",
      name: "Upper Sixth Tech",
      desc: "Advanced technical A-Level exams",
      age: "Ages 18–19",
    },
  ],
  francophone: [
    {
      level: "Primaire",
      name: "6e",
      desc: "Entrée au collège — programme général",
      age: "Âges 11–12",
    },
    {
      level: "Collège",
      name: "5e & 4e",
      desc: "Cycle d'observation et approfondissement",
      age: "Âges 12–14",
    },
    {
      level: "Collège",
      name: "3e",
      desc: "Préparation au BEPC",
      age: "Âges 14–15",
    },
    {
      level: "Lycée",
      name: "Seconde",
      desc: "Entrée au lycée — tronc commun",
      age: "Âges 15–16",
    },
    {
      level: "Lycée",
      name: "Première",
      desc: "Début du cycle Bac",
      age: "Âges 16–17",
    },
    {
      level: "Lycée",
      name: "Terminale",
      desc: "Préparation au Baccalauréat",
      age: "Âges 17–18",
    },
  ],
  francophone_technique: [
    {
      level: "Collège Tech",
      name: "6e & 5e",
      desc: "Initiation aux matières techniques",
      age: "Âges 11–13",
    },
    {
      level: "Collège Tech",
      name: "4e & 3e",
      desc: "Approfondissement technique & BEPC",
      age: "Âges 13–15",
    },
    {
      level: "Lycée Tech",
      name: "Seconde STT/STI",
      desc: "Filière technologique",
      age: "Âges 15–16",
    },
    {
      level: "Lycée Tech",
      name: "Première STT/STI",
      desc: "Spécialisation technique",
      age: "Âges 16–17",
    },
    {
      level: "Lycée Tech",
      name: "Terminale STT/STI",
      desc: "Préparation au Bac Technique",
      age: "Âges 17–18",
    },
  ],
  international: [
    {
      level: "Primary",
      name: "Year 1–3",
      desc: "Early years foundational learning",
      age: "Ages 5–8",
    },
    {
      level: "Primary",
      name: "Year 4–6",
      desc: "Upper primary core subjects",
      age: "Ages 8–11",
    },
    {
      level: "Secondary",
      name: "Year 7–9",
      desc: "Lower secondary exploration",
      age: "Ages 11–14",
    },
    {
      level: "Secondary",
      name: "Year 10–11",
      desc: "IGCSE preparation & exams",
      age: "Ages 14–16",
    },
    {
      level: "Sixth Form",
      name: "Year 12–13",
      desc: "A-Level / IB Diploma",
      age: "Ages 16–18",
    },
  ],
};

const TEMPLATE_PREVIEWS = {
  bold: {
    name: "Bold",
    desc: "Dark mode, large typography, glassmorphism, scroll animations — modern & immersive",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect
          x="2"
          y="2"
          width="44"
          height="32"
          rx="3"
          className="fill-[#0a0a0a]"
          strokeWidth="1.5"
          stroke="#333"
        />
        <rect
          x="6"
          y="6"
          width="36"
          height="6"
          rx="1.5"
          className="fill-white/10"
        />
        <rect
          x="6"
          y="14"
          width="20"
          height="10"
          rx="1.5"
          className="fill-emerald-800/30"
        />
        <rect
          x="28"
          y="14"
          width="14"
          height="3"
          rx="1"
          className="fill-white/10"
        />
        <rect
          x="28"
          y="18.5"
          width="10"
          height="2"
          rx="1"
          className="fill-white/8"
        />
        <rect
          x="6"
          y="26"
          width="36"
          height="1.5"
          rx="0.75"
          className="fill-white/8"
        />
        <rect
          x="6"
          y="29"
          width="8"
          height="4"
          rx="1"
          className="fill-white/10"
        />
        <rect
          x="16"
          y="29"
          width="8"
          height="4"
          rx="1"
          className="fill-white/10"
        />
        <rect
          x="26"
          y="29"
          width="8"
          height="4"
          rx="1"
          className="fill-white/10"
        />
        <rect
          x="36"
          y="29"
          width="6"
          height="4"
          rx="1"
          className="fill-white/10"
        />
      </svg>
    ),
  },
  playful: {
    name: "Playful",
    desc: "Bright colors, rounded shapes, floating elements, gradient accents — fun & engaging",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect
          x="2"
          y="2"
          width="44"
          height="32"
          rx="8"
          className="fill-amber-50 dark:fill-surface-800"
          strokeWidth="1.5"
          stroke="#e8e4de"
        />
        <rect
          x="6"
          y="6"
          width="24"
          height="5"
          rx="4"
          className="fill-emerald-200/50 dark:fill-emerald-900/30"
        />
        <circle cx="34" cy="8.5" r="7" className="fill-emerald-400/20" />
        <rect
          x="6"
          y="13"
          width="36"
          height="8"
          rx="4"
          className="fill-emerald-100/40 dark:fill-emerald-900/20"
        />
        <rect
          x="12"
          y="15"
          width="24"
          height="2"
          rx="1"
          className="fill-emerald-300/30"
        />
        <rect
          x="20"
          y="18.5"
          width="8"
          height="1.5"
          rx="0.75"
          className="fill-emerald-300/30"
        />
        <rect
          x="6"
          y="23"
          width="8"
          height="4"
          rx="3"
          className="fill-emerald-200/50"
        />
        <rect
          x="16"
          y="23"
          width="8"
          height="4"
          rx="3"
          className="fill-emerald-200/50"
        />
        <rect
          x="26"
          y="23"
          width="8"
          height="4"
          rx="3"
          className="fill-emerald-200/50"
        />
        <rect
          x="36"
          y="23"
          width="6"
          height="4"
          rx="3"
          className="fill-emerald-200/50"
        />
      </svg>
    ),
  },
  premium: {
    name: "Premium",
    desc: "Serif typography, muted earth tones, elegant transitions, asymmetric layouts — refined & trusted",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect
          x="2"
          y="2"
          width="44"
          height="32"
          rx="2"
          className="fill-amber-50 dark:fill-surface-800"
          strokeWidth="1.5"
          stroke="#d8d4ce"
        />
        <rect
          x="6"
          y="5"
          width="14"
          height="3"
          rx="1"
          className="fill-emerald-800/30 dark:fill-emerald-400/30"
        />
        <rect
          x="6"
          y="9.5"
          width="36"
          height="10"
          rx="1"
          className="fill-amber-100/50 dark:fill-amber-900/20"
          strokeWidth="0.5"
          stroke="#e8e4de"
        />
        <rect
          x="10"
          y="12"
          width="28"
          height="2"
          rx="0.5"
          className="fill-surface-300 dark:fill-surface-600"
        />
        <rect
          x="14"
          y="15.5"
          width="20"
          height="1.5"
          rx="0.5"
          className="fill-surface-300 dark:fill-surface-600"
        />
        <rect
          x="6"
          y="21.5"
          width="36"
          height="1"
          rx="0.5"
          className="fill-stone-200 dark:fill-surface-700"
        />
        <rect
          x="6"
          y="24.5"
          width="10"
          height="5"
          rx="1"
          className="fill-amber-200/50 dark:fill-amber-800/30"
          strokeWidth="0.5"
          stroke="#e8e4de"
        />
        <rect
          x="18"
          y="24.5"
          width="10"
          height="5"
          rx="1"
          className="fill-amber-200/50 dark:fill-amber-800/30"
          strokeWidth="0.5"
          stroke="#e8e4de"
        />
        <rect
          x="30"
          y="24.5"
          width="10"
          height="5"
          rx="1"
          className="fill-amber-200/50 dark:fill-amber-800/30"
          strokeWidth="0.5"
          stroke="#e8e4de"
        />
      </svg>
    ),
  },
};

const REQUIRED_PUBLISH_FIELDS = [
  { key: "schoolName", label: "School name", step: 1 },
  { key: "tagline", label: "Tagline", step: 4 },
  { key: "description", label: "School description", step: 4 },
  { key: "heroImageUrl", label: "Hero image", step: 4 },
  { key: "email", label: "Email address", step: 3 },
  { key: "phone", label: "Phone number", step: 3 },
  { key: "address", label: "Street address", step: 3 },
  { key: "city", label: "City", step: 3 },
  { key: "region", label: "Region", step: 3 },
  { key: "educationalSystems", label: "Educational systems", step: 5 },
];

const SYSTEM_STYLES = {
  Anglophone: {
    dot: "bg-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  Francophone: {
    dot: "bg-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  "Anglophone Technical": {
    dot: "bg-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    border: "border-cyan-500",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  "Francophone Technical": {
    dot: "bg-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
  },
  University: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
};

const RequiredFieldLabel = ({ label }) => (
  <div className="flex items-center gap-1.5">
    <span className="block text-xs font-medium text-surface-600 dark:text-surface-300">
      {label}
    </span>
    <span className="text-[11px] font-semibold text-red-500">*</span>
  </div>
);

/** Sub-component rendering quick class preset buttons based on selected educational systems */
const PresetButtons = ({ systems, onSelect }) => {
  const presets = [];
  if (systems.length === 0 || systems.includes("Anglophone")) {
    presets.push({
      key: "anglophone",
      label: "Anglophone General",
      subtitle: "GCE (Form 1–Upper Sixth)",
    });
    presets.push({
      key: "anglophone_technical",
      label: "Anglophone Technical",
      subtitle: "GCE Technical",
    });
  }
  if (systems.includes("Francophone")) {
    presets.push({
      key: "francophone",
      label: "Francophone G\u00e9n\u00e9ral",
      subtitle: "6e–Terminale",
    });
    presets.push({
      key: "francophone_technique",
      label: "Francophone Technique",
      subtitle: "6e–Terminale STT/STI",
    });
  }
  if (
    systems.includes("International") ||
    (systems.length === 0 &&
      !systems.includes("Francophone") &&
      !systems.includes("Anglophone"))
  ) {
    presets.push({
      key: "international",
      label: "International",
      subtitle: "IGCSE / A-Level / IB",
    });
  }
  if (presets.length === 0) return null;
  return (
    <div className="mb-5 space-y-2">
      <p className="text-xs text-surface-500 font-medium">
        Quick presets — pick one based on your system:
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelect(p.key)}
            className="px-4 py-2.5 rounded-lg text-[12px] font-medium border border-dashed border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex flex-col items-start"
          >
            <span>{p.label}</span>
            <span className="text-[10px] text-surface-400 mt-0.5">
              {p.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSettingsMode = searchParams.get("mode") === "settings";
  const { t } = useTranslation("onboarding");
  const { user } = useAuth();
  const { updatePrimaryColor } = useContext(ThemeContext);
  const { updateSelectedSystems } = useEducationalSystems();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newValue, setNewValue] = useState("");
  const [aboutCaptionInput, setAboutCaptionInput] = useState("");
  const [uploading, setUploading] = useState({
    logo: false,
    hero: false,
    hero2: false,
    about: false,
    gallery: false,
  });
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);
  const hero2InputRef = useRef(null);
  const aboutInputRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const galleryInputRef = useRef(null);

  const [data, setData] = useState({
    schoolName: "",
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    heroImageUrl2: "",
    templateCode: "bold",
    websiteStats: { studentsEnrolled: "", teachers: "", classes: "" },
    websiteValues: [],
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    educationalSystems: [],
    examType: "GCE",
    examPassRate: "",
    ranking: "",
    rankingCity: "",
    yearFounded: "",
    classesConfig: [],
    aboutPhotos: [],
    gallery: [],
    websitePublished: false,
  });
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await getOnboardingData();
      setData({
        schoolName: result.schoolName || user?.schoolName || "",
        tagline: result.tagline || "",
        description: result.websiteDescription || "",
        primaryColor: result.primaryColor || "#085041",
        logoUrl: result.logoUrl || "",
        heroImageUrl: result.heroImageUrl || "",
        heroImageUrl2: result.heroImageUrl2 || "",
        templateCode: result.templateCode || "bold",
        websiteStats: {
          studentsEnrolled:
            result.websiteStats?.studentsEnrolled?.toString() || "",
          teachers: result.websiteStats?.teachers?.toString() || "",
          classes: result.websiteStats?.classes?.toString() || "",
        },
        websiteValues: Array.isArray(result.websiteValues)
          ? result.websiteValues
          : [],
        email: result.email || "",
        phone: result.phone || "",
        address: result.address || "",
        city: result.city || "",
        region: result.region || "",
        educationalSystems: normalizeEducationalSystemsForView(
          result.educationalSystems || [],
        ),
        examType: result.examType || "GCE",
        examPassRate: result.examPassRate || "",
        ranking: result.ranking || "",
        rankingCity: result.rankingCity || "",
        yearFounded: result.yearFounded || "",
        classesConfig: result.classesConfig || [],
        aboutPhotos: result.aboutPhotos || [],
        gallery: Array.isArray(result.gallery) ? result.gallery : [],
        websitePublished: result.websitePublished || false,
      });
      setOriginalData(result);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  const handleColorChange = (hex) => {
    setData((prev) => ({ ...prev, primaryColor: hex }));
  };

  const handleStatChange = (field, value) => {
    setData((prev) => ({
      ...prev,
      websiteStats: { ...prev.websiteStats, [field]: value },
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, logo: true }));
    setError("");
    try {
      const result = await uploadMedia(file, "logo");
      if (result?.logoUrl || result?.url) {
        setData((prev) => ({ ...prev, logoUrl: result.logoUrl || result.url }));
        toast.success("Logo uploaded successfully");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Error uploading logo";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading((prev) => ({ ...prev, logo: false }));
    }
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, hero: true }));
    setError("");
    try {
      const result = await uploadMedia(file, "hero");
      if (result?.heroImageUrl || result?.url) {
        setData((prev) => ({
          ...prev,
          heroImageUrl: result.heroImageUrl || result.url,
        }));
        toast.success("Cover image uploaded");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error uploading cover image";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading((prev) => ({ ...prev, hero: false }));
    }
  };

  const handleHero2Upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, hero2: true }));
    setError("");
    try {
      const result = await uploadMedia(file, "hero");
      if (result?.url) {
        setData((prev) => ({ ...prev, heroImageUrl2: result.url }));
        toast.success("Secondary image uploaded");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error uploading secondary hero image";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading((prev) => ({ ...prev, hero2: false }));
    }
  };

  const handleAboutPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading((prev) => ({ ...prev, about: true }));
    setError("");
    try {
      const uploadPromises = files.map((file) => uploadMedia(file, "about"));
      const responses = await Promise.all(uploadPromises);
      setData((prev) => ({
        ...prev,
        aboutPhotos: [
          ...(prev.aboutPhotos || []),
          ...responses.map((r) => ({
            id: r.id,
            url: r.url,
            caption: aboutCaptionInput || "",
          })),
        ],
      }));
      setAboutCaptionInput("");
      toast.success(`${responses.length} photo(s) added to About section`);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error uploading about photo";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading((prev) => ({ ...prev, about: false }));
      e.target.value = "";
    }
  };

  const removeAboutPhoto = (idx) => {
    setData((prev) => ({
      ...prev,
      aboutPhotos: prev.aboutPhotos.filter((_, i) => i !== idx),
    }));
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, gallery: true }));
    setError("");
    try {
      const response = await uploadMedia(file, "gallery");
      setData((prev) => ({
        ...prev,
        gallery: [
          ...(prev.gallery || []),
          { id: response.id || Date.now(), url: response.url, caption: "" },
        ],
      }));
      toast.success("Gallery photo uploaded");
    } catch (err) {
      const msg = "Failed to upload photo";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading((prev) => ({ ...prev, gallery: false }));
    }
  };

  const removeGalleryPhoto = (idx) => {
    setData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx),
    }));
  };

  const handleEducationalSystemToggle = (system) => {
    setData((prev) => {
      const exists = prev.educationalSystems.includes(system);
      return {
        ...prev,
        educationalSystems: exists
          ? prev.educationalSystems.filter((s) => s !== system)
          : [...prev.educationalSystems, system],
      };
    });
  };

  const handleAddValue = () => {
    const val = newValue.trim();
    if (!val) return;
    setData((prev) => ({
      ...prev,
      websiteValues: [...prev.websiteValues, val],
    }));
    setNewValue("");
  };

  const handleRemoveValue = (index) => {
    setData((prev) => ({
      ...prev,
      websiteValues: prev.websiteValues.filter((_, i) => i !== index),
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddValue();
    }
  };

  const addClassConfig = () => {
    setData((prev) => ({
      ...prev,
      classesConfig: [
        ...prev.classesConfig,
        { level: "", name: "", desc: "", age: "" },
      ],
    }));
  };

  const updateClassConfig = (idx, field, value) => {
    setData((prev) => {
      const updated = [...prev.classesConfig];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, classesConfig: updated };
    });
  };

  const removeClassConfig = (idx) => {
    setData((prev) => ({
      ...prev,
      classesConfig: prev.classesConfig.filter((_, i) => i !== idx),
    }));
  };

  const useClassPresets = (presetKey) => {
    const presets = CLASS_PRESETS[presetKey] || CLASS_PRESETS.anglophone;
    setData((prev) => ({ ...prev, classesConfig: presets }));
  };

  const normalizeEducationalSystemsForPayload = (systems) => {
    const codeMap = {
      Anglophone: "anglophone_general",
      Francophone: "francophone_general",
      "Anglophone Technical": "anglophone_technical",
      "Francophone Technical": "francophone_technical",
      University: "university",
      Bilingual: "university",
      International: "university",
      anglophone: "anglophone_general",
      francophone: "francophone_general",
      anglophone_general: "anglophone_general",
      francophone_general: "francophone_general",
      anglophone_technical: "anglophone_technical",
      francophone_technical: "francophone_technical",
      university: "university",
    };

    if (!Array.isArray(systems)) return [];
    return Array.from(
      new Set(
        systems
          .filter(Boolean)
          .map((value) => String(value).trim())
          .map((value) => codeMap[value] || value)
          .filter(Boolean),
      ),
    );
  };

  const normalizeEducationalSystemsForView = (systems) => {
    const labelMap = {
      anglophone_general: "Anglophone",
      francophone_general: "Francophone",
      anglophone_technical: "Anglophone Technical",
      francophone_technical: "Francophone Technical",
      university: "International",
    };

    if (!Array.isArray(systems)) return [];
    return systems
      .filter(Boolean)
      .map((value) => String(value).trim())
      .map((value) => labelMap[value] || value);
  };

  const buildPayload = (publish) => {
    let primaryColor = data.primaryColor;
    if (!primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      primaryColor = "#085041";
    }
    return {
      schoolName: data.schoolName,
      tagline: data.tagline,
      websiteDescription: data.description,
      primaryColor,
      templateCode: data.templateCode,
      websiteStats: {
        studentsEnrolled: parseInt(data.websiteStats.studentsEnrolled) || 0,
        teachers: parseInt(data.websiteStats.teachers) || 0,
        classes: parseInt(data.websiteStats.classes) || 0,
      },
      websiteValues: Array.isArray(data.websiteValues)
        ? data.websiteValues
        : [],
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      region: data.region,
      educationalSystems: normalizeEducationalSystemsForPayload(
        data.educationalSystems,
      ),
      examType: data.examType,
      examPassRate: data.examPassRate,
      ranking: data.ranking,
      rankingCity: data.rankingCity,
      yearFounded: data.yearFounded,
      classesConfig: data.classesConfig,
      aboutPhotos: data.aboutPhotos,
      heroImageUrl2: data.heroImageUrl2,
      gallery: data.gallery,
      websitePublished: publish ? true : data.websitePublished,
      onboardingCompleted: true,
    };
  };

  const applyPrimaryColor = (primaryColor) => {
    localStorage.setItem("akademee-primary-color", primaryColor);
    document.documentElement.style.setProperty("--primary-color", primaryColor);
    updatePrimaryColor(primaryColor);
  };

  // Save and go to next step (onboarding mode) or just save (settings mode)
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = buildPayload(false);

    try {
      const response = await saveOnboardingData(payload);
      if (response.success) {
        applyPrimaryColor(payload.primaryColor);
        setOriginalData(response.data || payload);
        // Sync educational systems with the context so Sidebar updates immediately
        const normalizedSystemCodes = normalizeEducationalSystemsForPayload(
          data.educationalSystems,
        );
        updateSelectedSystems(normalizedSystemCodes);
        if (isSettingsMode) {
          setSuccess(t("review.saved", "Configuration saved successfully"));
          toast.success(t("review.saved", "Configuration saved successfully"));
        } else {
          toast.success("Step saved!");
          nextStep();
        }
      } else {
        const msg = response.message || "Error saving configuration";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error saving configuration";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Publish + redirect to live site (onboarding mode only)
  const handlePublishAndGoLive = async () => {
    setSaving(true);
    setError("");

    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      const firstMissingStep = missing[0]?.step || 1;
      setStep(firstMissingStep);
      const msg = `Please complete the required fields before publishing: ${missing.map((field) => field.label).join(", ")}.`;
      setError(msg);
      toast.error(msg);
      setSaving(false);
      return;
    }

    const payload = buildPayload(true);

    try {
      const response = await saveOnboardingData(payload);
      if (response.success) {
        applyPrimaryColor(payload.primaryColor);
        // Sync educational systems with context
        const normalizedSystemCodes = normalizeEducationalSystemsForPayload(
          data.educationalSystems,
        );
        updateSelectedSystems(normalizedSystemCodes);
        toast.success("Website published! 🎉");
        setTimeout(() => {
          window.location.href = "/onboarding/academic-year";
        }, 800);
      } else {
        const msg = response.message || "Error saving configuration";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error saving configuration";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    setStep((s) => {
      const allowed =
        TEMPLATE_VISIBLE_STEPS[data.templateCode] ||
        TEMPLATE_VISIBLE_STEPS.bold;
      const currentIdx = allowed.indexOf(s);
      return currentIdx < allowed.length - 1 ? allowed[currentIdx + 1] : s;
    });
  };
  const prevStep = () => {
    setStep((s) => {
      const allowed =
        TEMPLATE_VISIBLE_STEPS[data.templateCode] ||
        TEMPLATE_VISIBLE_STEPS.bold;
      const currentIdx = allowed.indexOf(s);
      return currentIdx > 0 ? allowed[currentIdx - 1] : s;
    });
  };
  const skip = () => {
    const allowed =
      TEMPLATE_VISIBLE_STEPS[data.templateCode] || TEMPLATE_VISIBLE_STEPS.bold;
    const last = allowed[allowed.length - 1];
    if (step < last) {
      setStep((s) => {
        const idx = allowed.indexOf(s);
        return idx < allowed.length - 1 ? allowed[idx + 1] : s;
      });
    } else {
      navigate("/dashboard");
    }
  };

  const STEP_KEYS = {
    1: "identity",
    2: "template",
    3: "contact",
    4: "content",
    5: "academic",
    6: "classes",
    7: "review",
    8: "publish",
  };
  const visibleSteps =
    TEMPLATE_VISIBLE_STEPS[data.templateCode] || TEMPLATE_VISIBLE_STEPS.bold;
  const totalVisibleSteps = visibleSteps.length;

  const hasChanges = originalData
    ? JSON.stringify({
        tagline: data.tagline,
        description: data.description,
        primaryColor: data.primaryColor,
        templateCode: data.templateCode,
        logoUrl: data.logoUrl,
        heroImageUrl: data.heroImageUrl,
        websiteStats: data.websiteStats,
        websiteValues: data.websiteValues,
        websitePublished: data.websitePublished,
      }) !==
      JSON.stringify({
        tagline: originalData.tagline || "",
        description: originalData.websiteDescription || "",
        primaryColor: originalData.primaryColor || "#085041",
        templateCode: originalData.templateCode || "bold",
        logoUrl: originalData.logoUrl || "",
        heroImageUrl: originalData.heroImageUrl || "",
        websiteStats: {
          studentsEnrolled:
            originalData.websiteStats?.studentsEnrolled?.toString() || "",
          teachers: originalData.websiteStats?.teachers?.toString() || "",
          classes: originalData.websiteStats?.classes?.toString() || "",
        },
        websiteValues: originalData.websiteValues || [],
        websitePublished: originalData.websitePublished || false,
      })
    : false;

  const pc = data.primaryColor;
  const initials = (user?.schoolName || "SC")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const getMissingRequiredFields = () =>
    REQUIRED_PUBLISH_FIELDS.filter(({ key }) => {
      if (key === "educationalSystems") {
        return (
          !Array.isArray(data.educationalSystems) ||
          data.educationalSystems.length === 0
        );
      }
      return !String(data[key] || "").trim();
    });

  const missingRequiredFields = getMissingRequiredFields();

  const StepErr = () =>
    error ? (
      <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-4 h-4 flex-shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        {error}
      </div>
    ) : null;

  const StepSuccess = () =>
    success ? (
      <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-4 h-4 flex-shrink-0"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        {success}
      </div>
    ) : null;

  const NavButtons = () => (
    <div className="flex gap-2.5">
      <button
        onClick={prevStep}
        className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-3.5 h-3.5"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t("back", "Back")}
      </button>
      <button
        onClick={nextStep}
        className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
        style={{ backgroundColor: pc }}
      >
        {t("continue", "Continue")}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
          <p className="text-sm text-surface-400">{t("Loading...")}</p>
        </div>
      </div>
    );
  }

  const renderStepContent = () => (
    <div
      className={`flex-1 overflow-y-auto ${isSettingsMode ? "px-0" : "px-4 sm:px-6 lg:px-10 py-6 sm:py-9 max-w-[640px] mx-auto w-full"}`}
    >
      <StepErr />
      <StepSuccess />
      {missingRequiredFields.length > 0 && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <div className="font-semibold">Required before publishing</div>
          <div className="mt-1">
            Please complete these fields to publish your website:{" "}
            {missingRequiredFields.map((field) => field.label).join(", ")}.
          </div>
        </div>
      )}

      {/* ── STEP 1 — Identity ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              {t("steps.logo.title", "School identity")}
            </p>
            <div className="mb-5">
              <label className="block mb-1.5">
                <RequiredFieldLabel label="School name" />
              </label>
              <input
                name="schoolName"
                type="text"
                value={data.schoolName}
                onChange={handleChange}
                placeholder="e.g. Grace Bilingual Academy"
                className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
              />
            </div>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              {t("logo.heading", "Your school logo")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
              {t(
                "logo.subtitle",
                "Upload your logo, or we'll generate one from your school's initials.",
              )}
            </p>
            <div className="flex items-center gap-5">
              <label
                htmlFor="onb-logo-upload"
                className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                style={{
                  backgroundColor: data.logoUrl ? "transparent" : pc + "15",
                }}
              >
                {data.logoUrl ? (
                  <img
                    src={data.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="font-display text-2xl font-bold"
                    style={{ color: pc }}
                  >
                    {initials}
                  </span>
                )}
                <input
                  ref={logoInputRef}
                  id="onb-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading.logo}
                  className="h-9 px-4 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading.logo
                    ? t("logo.uploading", "Uploading...")
                    : t("logo.cta", "Upload logo")}
                </button>
                {data.logoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setData((prev) => ({ ...prev, logoUrl: "" }))
                    }
                    className="h-9 px-4 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {t("Remove")}
                  </button>
                )}
                <p className="text-[11px] text-surface-400">
                  {t("logo.specs", "PNG, JPG or SVG · Max 2MB")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("content.colorLabel", "School primary colour")}
            </h2>
            <p className="text-xs text-surface-400 mb-4">
              This colour will be used for buttons, links, and accents across
              your website.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex items-center gap-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-lg px-3.5 py-2.5">
                <label
                  htmlFor="onb-color-picker"
                  className="w-8 h-8 rounded-lg cursor-pointer flex-shrink-0 border border-white/20"
                  style={{ backgroundColor: pc }}
                />
                <input
                  id="onb-color-picker"
                  type="color"
                  value={pc}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200 font-mono min-w-[4.5rem]">
                  {pc}
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => handleColorChange(hex)}
                    className={`w-7 h-7 rounded-full flex-shrink-0 transition-all hover:scale-110 ${
                      pc.toLowerCase() === hex.toLowerCase()
                        ? "ring-2 ring-offset-2 ring-surface-800 dark:ring-surface-200 dark:ring-offset-surface-900 scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-surface-400 leading-relaxed">
              {t(
                "logo.hint",
                "No logo yet? We'll use your school's initials and chosen colour as a placeholder.",
              )}
            </p>
          </div>

          {isSettingsMode ? (
            <div className="flex gap-2.5">
              <button
                onClick={() => navigate("/dashboard")}
                className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-3.5 h-3.5"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                {t("backToDashboard", "Back to Dashboard")}
              </button>
              <button
                onClick={nextStep}
                className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: pc }}
              >
                {t("continue", "Continue")}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={nextStep}
              className="w-full h-[46px] text-white text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              style={{ backgroundColor: pc }}
            >
              {t("continue", "Continue")}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[17px] h-[17px]"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── STEP 2 — Template ── */}
      {step === 2 && (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <p
            className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
            style={{ color: pc }}
          >
            Template
          </p>
          <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
            Choose your template
          </h1>
          <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
            Pick a design for your campus website. You can change this anytime.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {Object.entries(TEMPLATE_PREVIEWS).map(([code, template]) => {
              const selected = data.templateCode === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() =>
                    setData((prev) => ({ ...prev, templateCode: code }))
                  }
                  className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/15 shadow-sm"
                      : "border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-750"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-700">
                    {template.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                      {template.name}
                    </div>
                    <div className="text-xs text-surface-400 mt-0.5 leading-relaxed">
                      {template.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <NavButtons />
        </div>
      )}

      {/* ── STEP 3 — Contact ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              {t("steps.contact.title", "Contact info")}
            </p>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              {t("contact.heading", "How can people reach you?")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
              Your contact details will appear on your campus website.
            </p>
            <div className="mb-5">
              <label className="block mb-1.5">
                <RequiredFieldLabel label="Email address" />
              </label>
              <input
                name="email"
                type="email"
                value={data.email}
                onChange={handleChange}
                placeholder="info@yourschool.cm"
                className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1.5">
                <RequiredFieldLabel label="Phone number" />
              </label>
              <input
                name="phone"
                type="tel"
                value={data.phone}
                onChange={handleChange}
                placeholder="+237 6XX XXX XXX"
                className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1.5">
                <RequiredFieldLabel label="Street address" />
              </label>
              <textarea
                name="address"
                rows={2}
                value={data.address}
                onChange={handleChange}
                placeholder="123 Education Avenue"
                className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  City
                </label>
                <input
                  name="city"
                  type="text"
                  value={data.city}
                  onChange={handleChange}
                  placeholder="Douala"
                  className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
              <div>
                <label className="block mb-1.5">
                  <RequiredFieldLabel label="Region" />
                </label>
                <input
                  name="region"
                  type="text"
                  value={data.region}
                  onChange={handleChange}
                  placeholder="Littoral"
                  className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
            </div>
          </div>
          <NavButtons />
        </div>
      )}

      {/* ── STEP 4 — Content ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              {t("steps.hero.title", "Content")}
            </p>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              {t("content.heading", "Present your school")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
              {t(
                "content.subtitle",
                "Choose your brand colour and tell visitors about your school.",
              )}
            </p>

            <div className="mb-5">
              <label className="block mb-1.5">
                <RequiredFieldLabel
                  label={t("content.taglineLabel", "Tagline / Slogan")}
                />
              </label>
              <input
                name="tagline"
                type="text"
                value={data.tagline}
                onChange={handleChange}
                placeholder={t(
                  "content.taglinePlaceholder",
                  "Shaping the leaders of tomorrow, today.",
                )}
                maxLength={80}
                className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
              />
              <p className="text-[11px] text-surface-400 mt-1 text-right">
                {data.tagline.length}/80
              </p>
            </div>

            <div className="mb-5">
              <label className="block mb-1.5">
                <RequiredFieldLabel
                  label={t("content.descLabel", "School description")}
                />
              </label>
              <textarea
                name="description"
                rows={4}
                value={data.description}
                onChange={handleChange}
                placeholder={t(
                  "content.descPlaceholder",
                  "Tell families what makes your school special...",
                )}
                className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors resize-none"
              />
            </div>

            {/* Hero image */}
            <div className="mb-5">
              <label className="block mb-1.5">
                <RequiredFieldLabel label={t("hero.heading", "Cover image")} />
              </label>
              <p className="text-[11px] text-surface-400 mb-3">
                {t("hero.specs", "Recommended 1920×800px · Max 5MB")}
              </p>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="onb-hero-upload"
                  className="flex-shrink-0 w-36 aspect-[21/9] rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                >
                  {data.heroImageUrl ? (
                    <img
                      src={data.heroImageUrl}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 p-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="w-5 h-5 text-surface-400"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[10px] text-surface-400 text-center">
                        {uploading.hero
                          ? t("hero.uploading", "Uploading...")
                          : t("hero.cta", "Add hero photo")}
                      </span>
                    </div>
                  )}
                  <input
                    ref={heroInputRef}
                    id="onb-hero-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleHeroUpload}
                    className="hidden"
                  />
                </label>
                {data.heroImageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setData((prev) => ({ ...prev, heroImageUrl: "" }))
                    }
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    {t("Remove")}
                  </button>
                )}
              </div>
            </div>

            {/* Secondary hero image */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                Secondary hero image
              </label>
              <p className="text-[11px] text-surface-400 mb-3">
                Optional background image used behind the main hero.
              </p>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="onb-hero2-upload"
                  className="flex-shrink-0 w-28 aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                >
                  {data.heroImageUrl2 ? (
                    <img
                      src={data.heroImageUrl2}
                      alt="Hero 2"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 p-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="w-5 h-5 text-surface-400"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[10px] text-surface-400 text-center">
                        {uploading.hero2 ? "Uploading..." : "Add image"}
                      </span>
                    </div>
                  )}
                  <input
                    ref={hero2InputRef}
                    id="onb-hero2-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleHero2Upload}
                    className="hidden"
                  />
                </label>
                {data.heroImageUrl2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setData((prev) => ({ ...prev, heroImageUrl2: "" }))
                    }
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* About photos */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                About us photos
              </label>
              <p className="text-[11px] text-surface-400 mb-3">
                Photos for the About section.
              </p>
              <div className="flex items-center gap-3 mb-3">
                <label
                  htmlFor="onb-about-upload"
                  className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                >
                  {uploading.about ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-surface-300 border-t-surface-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="w-5 h-5 text-surface-400"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[9px] text-surface-400">Add</span>
                    </div>
                  )}
                  <input
                    ref={aboutInputRef}
                    id="onb-about-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAboutPhotoUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={aboutCaptionInput}
                  onChange={(e) => setAboutCaptionInput(e.target.value)}
                  placeholder="Optional caption..."
                  className="flex-1 h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
                />
              </div>
              {data.aboutPhotos && data.aboutPhotos.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {data.aboutPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.caption || "About"}
                        className="w-20 h-20 object-cover rounded-lg border border-surface-200 dark:border-surface-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeAboutPhoto(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                      >
                        ×
                      </button>
                      {photo.caption && (
                        <p className="text-[10px] text-surface-400 mt-0.5 truncate max-w-[80px]">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Values */}
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                School values
              </label>
              <p className="text-[11px] text-surface-400 mb-3">
                Core values that define your school's mission.
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Excellence, Integrity..."
                  className="flex-1 h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddValue}
                  disabled={!newValue.trim()}
                  className="h-10 px-4 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed text-surface-700 dark:text-surface-200 text-sm font-medium rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              {data.websiteValues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.websiteValues.map((val, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-full text-sm text-surface-700 dark:text-surface-200"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="w-3.5 h-3.5 text-primary-600"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {val}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(i)}
                        className="text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="w-3.5 h-3.5"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <NavButtons />
        </div>
      )}

      {/* ── STEP 5 — Academic + Stats ── */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              School statistics
            </p>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              Key numbers
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-5">
              Display key numbers on your website to impress visitors.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  Students enrolled
                </label>
                <input
                  type="number"
                  value={data.websiteStats.studentsEnrolled}
                  onChange={(e) =>
                    handleStatChange("studentsEnrolled", e.target.value)
                  }
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  Teachers
                </label>
                <input
                  type="number"
                  value={data.websiteStats.teachers}
                  onChange={(e) => handleStatChange("teachers", e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  Classes
                </label>
                <input
                  type="number"
                  value={data.websiteStats.classes}
                  onChange={(e) => handleStatChange("classes", e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              Academic info
            </p>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              Academic credentials & achievements
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
              Showcase your school's academic strengths on your website.
            </p>

            <div className="mb-5">
              <label className="block mb-2">
                <RequiredFieldLabel label="Educational systems" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "Anglophone",
                    label: "Anglophone General",
                    desc: "GCE O-Level & A-Level",
                  },
                  {
                    id: "Francophone",
                    label: "Francophone General",
                    desc: "BEPC, Probatoire & Baccalauréat",
                  },
                  {
                    id: "Anglophone Technical",
                    label: "Anglophone Technical",
                    desc: "TVEE IL & AL",
                  },
                  {
                    id: "Francophone Technical",
                    label: "Francophone Technical",
                    desc: "CAP, Brevet & Bac Technique",
                  },
                  {
                    id: "University",
                    label: "University LMD",
                    desc: "Licence, Master, Doctorate",
                  },
                ].map((sys) => {
                  const selected = data.educationalSystems.includes(sys.id);
                  const colors = SYSTEM_STYLES[sys.id];
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => handleEducationalSystemToggle(sys.id)}
                      className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                        selected
                          ? `${colors.border} ${colors.bg}`
                          : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Colored dot */}
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
                            selected ? colors.dot : "bg-surface-300 dark:bg-surface-600"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${
                            selected ? colors.text : "text-surface-700 dark:text-surface-200"
                          }`}>
                            {sys.label}
                          </div>
                          <div className="text-xs text-surface-400 mt-0.5">
                            {sys.desc}
                          </div>
                        </div>
                        {selected && (
                          <div className={`w-5 h-5 rounded-full ${colors.dot} flex items-center justify-center flex-shrink-0`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                Year founded
              </label>
              <input
                name="yearFounded"
                type="text"
                value={data.yearFounded}
                onChange={handleChange}
                placeholder="e.g. 1998"
                maxLength={4}
                className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors max-w-[200px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  Exam type
                </label>
                <select
                  value={data.examType}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, examType: e.target.value }))
                  }
                  className="w-full h-11 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors"
                >
                  <option value="GCE">GCE</option>
                  <option value="Bacc">Baccalauréat</option>
                  <option value="Licence">Licence</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  Pass rate (%)
                </label>
                <input
                  name="examPassRate"
                  type="text"
                  value={data.examPassRate}
                  onChange={handleChange}
                  placeholder="e.g. 94"
                  className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  Ranking
                </label>
                <input
                  name="ranking"
                  type="text"
                  value={data.ranking}
                  onChange={handleChange}
                  placeholder="e.g. Top 5"
                  className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  City
                </label>
                <input
                  name="rankingCity"
                  type="text"
                  value={data.rankingCity}
                  onChange={handleChange}
                  placeholder="e.g. Douala"
                  className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
            </div>
          </div>
          <NavButtons />
        </div>
      )}

      {/* ── STEP 6 — Classes + Gallery ── */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              Classes
            </p>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              Your school's class structure
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-5">
              Define the levels, streams, and classes offered at your school.
            </p>
            {data.classesConfig.length === 0 && (
              <PresetButtons
                systems={data.educationalSystems || []}
                onSelect={useClassPresets}
              />
            )}
            {data.classesConfig.length > 0 && (
              <div className="space-y-3 mb-5">
                {data.classesConfig.map((cls, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-800/50"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                        Class {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeClassConfig(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mb-2">
                      <input
                        type="text"
                        value={cls.level || ""}
                        onChange={(e) =>
                          updateClassConfig(idx, "level", e.target.value)
                        }
                        placeholder="Level (e.g. Junior)"
                        className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors"
                      />
                      <input
                        type="text"
                        value={cls.name || ""}
                        onChange={(e) =>
                          updateClassConfig(idx, "name", e.target.value)
                        }
                        placeholder="Name (e.g. Form 1 & 2)"
                        className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={cls.desc || ""}
                        onChange={(e) =>
                          updateClassConfig(idx, "desc", e.target.value)
                        }
                        placeholder="Description"
                        className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors"
                      />
                      <input
                        type="text"
                        value={cls.age || ""}
                        onChange={(e) =>
                          updateClassConfig(idx, "age", e.target.value)
                        }
                        placeholder="Age (e.g. Ages 12–13)"
                        className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addClassConfig}
              className="w-full h-11 px-4 rounded-lg border-2 border-dashed border-surface-200 dark:border-surface-600 text-surface-500 dark:text-surface-400 text-sm font-medium hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 mb-6"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-4 h-4"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add a class / level
            </button>

            {/* Gallery */}
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                Gallery photos
              </label>
              <p className="text-[11px] text-surface-400 mb-3">
                Photos for the Life at our school section.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleGalleryUpload(e)}
                className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-surface-100 dark:file:bg-surface-700 file:text-surface-700 dark:file:text-surface-200 hover:file:bg-surface-200 dark:hover:file:bg-surface-600"
              />
              {data.gallery && data.gallery.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {data.gallery.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryPhoto(idx)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="w-4 h-4"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <NavButtons />
        </div>
      )}

      {/* ── STEP 7 — Review ── */}
      {step === 7 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              {t("steps.review.title", "Review")}
            </p>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              {t("review.heading", "Your site is ready 🎉")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
              {t(
                "review.subtitle",
                "Review your details before going live. You can edit everything later.",
              )}
            </p>
            <div
              className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
              style={{ borderLeftWidth: "4px", borderLeftColor: pc }}
            >
              <div className="p-5 bg-white dark:bg-surface-800">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="text-surface-500">Logo</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {data.logoUrl ? "Uploaded" : "Using initials"}
                  </div>
                  <div className="text-surface-500">Cover image</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {data.heroImageUrl ? "Uploaded" : "Not set"}
                  </div>
                  <div className="text-surface-500">Tagline</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium truncate">
                    {data.tagline || "—"}
                  </div>
                  <div className="text-surface-500">Stats</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {data.websiteStats.studentsEnrolled
                      ? `${data.websiteStats.studentsEnrolled} students · ${data.websiteStats.teachers || "0"} teachers · ${data.websiteStats.classes || "0"} classes`
                      : "—"}
                  </div>
                  <div className="text-surface-500">Values</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {data.websiteValues.length > 0
                      ? `${data.websiteValues.length} value${data.websiteValues.length > 1 ? "s" : ""}`
                      : "—"}
                  </div>
                  <div className="text-surface-500">Template</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {TEMPLATE_PREVIEWS[data.templateCode]?.name ||
                      data.templateCode}
                  </div>
                  <div className="text-surface-500">Contact</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {data.email || data.phone ? "Provided" : "Not set"}
                  </div>
                  {data.websitePublished && (
                    <>
                      <div className="text-surface-500">Status</div>
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Published
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-0.5">
                You can edit everything later
              </p>
              <p className="text-sm text-surface-400">
                Go to Settings → Campus Website to add stats, values, gallery
                photos, and more.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={prevStep}
              className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-3.5 h-3.5"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {t("back", "Back")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: pc }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("review.saving", "Saving...")}
                </span>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t("review.submit", "Continue to preview")}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 8 — Preview & Publish ── */}
      {step === 8 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <p
              className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: pc }}
            >
              {t("steps.publish.title", "Preview & publish")}
            </p>
            <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              Preview your campus website
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-5">
              Take a look at your site below. When you're happy, click "Publish"
              to make it live.
            </p>

            {/* Preview card */}
            <div
              className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
              style={{ borderLeftWidth: "4px", borderLeftColor: pc }}
            >
              <div
                className="relative h-[200px] flex items-end overflow-hidden"
                style={{
                  background: data.heroImageUrl
                    ? `url(${data.heroImageUrl}) center/cover`
                    : `linear-gradient(135deg, ${pc}, ${pc}88)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="relative z-10 p-6 flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white/30"
                    style={{
                      background: data.logoUrl
                        ? `url(${data.logoUrl}) center/cover`
                        : pc,
                    }}
                  >
                    {!data.logoUrl && (
                      <span className="w-full h-full flex items-center justify-center font-display font-bold text-lg text-white">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-white drop-shadow-sm">
                      {user?.schoolName || "Your School"}
                    </div>
                    {data.tagline && (
                      <div className="text-sm text-white/80 mt-0.5 drop-shadow-sm">
                        {data.tagline}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-5 bg-white dark:bg-surface-800">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="text-surface-500">Template</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {TEMPLATE_PREVIEWS[data.templateCode]?.name ||
                      data.templateCode}
                  </div>
                  <div className="text-surface-500">Stats</div>
                  <div className="text-surface-800 dark:text-surface-100 font-medium">
                    {data.websiteStats.studentsEnrolled
                      ? `${data.websiteStats.studentsEnrolled} students · ${data.websiteStats.teachers || "0"} teachers`
                      : "—"}
                  </div>
                  {data.description && (
                    <>
                      <div className="text-surface-500">Description</div>
                      <div className="text-surface-800 dark:text-surface-100 line-clamp-2">
                        {data.description}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isSettingsMode ? (
              <>
                {/* Publish toggle for settings mode */}
                <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
                        Publish Website
                      </h2>
                      <p className="text-xs text-surface-400">
                        Make your campus website visible to the public.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="websitePublished"
                        checked={data.websitePublished}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-200 dark:bg-surface-600 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                </div>

                {/* Preview link for settings mode */}
                {user?.subdomain && (
                  <a
                    href={`/site?subdomain=${user.subdomain}${data.websitePublished ? "" : "&preview=1"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-11 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="w-4 h-4"
                    >
                      {data.websitePublished ? (
                        <>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                    {data.websitePublished ? "Preview site" : "Preview draft"}
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-surface-400 text-center mt-4 flex items-center justify-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                You can edit everything later in Settings → Campus Website
              </p>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={prevStep}
              className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-3.5 h-3.5"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {t("back", "Back")}
            </button>
            <button
              onClick={handlePublishAndGoLive}
              disabled={saving}
              className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: pc }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Publishing...
                </span>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="w-4 h-4"
                  >
                    <path d="M22 2 11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  Publish my site
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════
  // ONBOARDING MODE — Full wizard with sidebar
  // ══════════════════════════════════════════
  if (!isSettingsMode) {
    return (
      <div className="flex min-h-screen bg-surface-50 dark:bg-surface-900">
        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-[280px] flex-shrink-0 sticky top-0 h-screen px-8 py-9 transition-colors duration-300"
          style={{ backgroundColor: pc }}
        >
          <div className="flex items-center gap-2.5 mb-10">
            <img
              src={akademeeLogo}
              alt="Akademee"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display text-lg text-white/90">Akademee</span>
          </div>
          <div className="mb-8">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-white/45 mb-2">
              {t("firstTimeSetup", "First time setup")}
            </p>
            <h2 className="font-display text-[22px] text-white leading-snug">
              {t("welcomeTitle1", "Let's build your")}
              <br />
              <em className="italic text-white/55">
                {t("welcomeTitle2", "campus website.")}
              </em>
            </h2>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            {visibleSteps.map((s) => {
              const isActive = step === s;
              const isDone = step > s;
              const stepKey = STEP_KEYS[s];
              return (
                <div
                  key={s}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  }}
                >
                  <div
                    className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border-2 transition-all ${
                      isDone
                        ? "bg-white/20 border-white/35 text-white"
                        : isActive
                          ? "bg-white border-white"
                          : "bg-transparent border-white/20 text-white/35"
                    }`}
                    style={isActive ? { color: pc } : {}}
                  >
                    {isDone ? "✓" : s}
                  </div>
                  <div>
                    <div
                      className={`text-[13px] font-medium ${isActive ? "text-white" : isDone ? "text-white/65" : "text-white/35"}`}
                    >
                      {{
                        1: "School identity",
                        2: "About & content",
                        3: "Contact info",
                        4: "Content",
                        5: "Academic info",
                        6: "Class structure",
                        7: "Review",
                        8: "Preview & publish",
                      }[s] || s}
                    </div>
                    <div className="text-[11px] text-white/25">
                      {t(`steps.${stepKey}.desc`, "")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11.5px] text-white/22 leading-relaxed mt-auto">
            {t(
              "editLaterNote",
              "You can edit all of this later in Settings → Campus Website",
            )}
          </p>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 lg:px-10 h-[58px] bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
            <div className="flex-1 max-w-[280px]">
              <div className="flex justify-between text-xs text-surface-400 mb-1.5">
                <span>
                  {t("stepLabel", "Step")} {step} {t("of", "of")}{" "}
                  {totalVisibleSteps}
                </span>
                <span>
                  {totalVisibleSteps > 0
                    ? Math.round(
                        ((visibleSteps.indexOf(step) + 1) / totalVisibleSteps) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-1 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${totalVisibleSteps > 0 ? Math.round(((visibleSteps.indexOf(step) + 1) / totalVisibleSteps) * 100) : 0}%`,
                    backgroundColor: pc,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeLangToggles />
              <button
                onClick={skip}
                className="text-[13px] text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 px-3 py-1.5 rounded-md transition-colors"
              >
                {step < totalVisibleSteps
                  ? `${t("skipForNow", "Skip for now")} →`
                  : t("skipForNow", "Skip for now")}
              </button>
            </div>
          </div>

          {/* Mobile step indicator — visible below lg breakpoint */}
          <div className="lg:hidden flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
            {visibleSteps.map((s) => {
              const isActive = step === s;
              const isDone = step > s;
              return (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isDone
                        ? "bg-primary-500"
                        : isActive
                          ? "bg-primary-600 w-3 h-3"
                          : "bg-surface-300 dark:bg-surface-600"
                    }`}
                  />
                  {s < totalVisibleSteps && (
                    <div
                      className={`w-6 h-[2px] transition-colors duration-300 ${
                        isDone
                          ? "bg-primary-300"
                          : "bg-surface-200 dark:bg-surface-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
            <span className="text-[10px] text-surface-400 ml-2 font-medium">
              {step}/{totalVisibleSteps}
            </span>
          </div>

          {renderStepContent()}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SETTINGS MODE — Admin panel with tabs
  // ══════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t("websiteSettings.title", "Site Vitrine — Configuration")}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {t(
              "websiteSettings.subtitle",
              "Configure your school's public website — logo, colours, content & more",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Step tabs */}
          <div className="flex border-b border-surface-200 dark:border-surface-700 overflow-x-auto scrollbar-none">
            {visibleSteps.map((s) => {
              const tabKey = STEP_KEYS[s];
              return (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    step === s
                      ? "border-primary-600 text-primary-700 dark:text-primary-400"
                      : step > s
                        ? "border-transparent text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                  }`}
                >
                  {s}.{" "}
                  {{
                    1: "Identity",
                    2: "Content",
                    3: "Contact",
                    4: "Content",
                    5: "Academics",
                    6: "Classes",
                    7: "Review",
                    8: "Publish",
                  }[s] || s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      {renderStepContent()}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 mt-8 -mx-6 px-6 py-4 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <p className="text-xs text-surface-400">
          {hasChanges
            ? t("websiteSettings.unsaved", "You have unsaved changes")
            : t("websiteSettings.allSaved", "All changes saved")}
        </p>
        <div className="flex items-center gap-3">
          {user?.subdomain && (
            <a
              href={`/site?subdomain=${user.subdomain}${data.websitePublished ? "" : "&preview=1"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3.5 border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-4 h-4"
              >
                {data.websitePublished ? (
                  <>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
              {data.websitePublished ? "Preview" : "Preview draft"}
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="h-10 px-5 bg-primary-900 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
