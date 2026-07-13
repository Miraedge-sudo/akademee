import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBookOpen,
  FiAward,
  FiAlertTriangle,
  FiCalendar,
  FiGrid,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { createAcademicYear } from "../../../core/api/academicYearService";
import toast from "react-hot-toast";

const TERM_PRESETS = {
  anglophone: [
    {
      num: 1,
      name: "First Term",
      color: "#085041",
      light: "#E1F5EE",
      seqs: ["Sequence 1", "Sequence 2"],
    },
    {
      num: 2,
      name: "Second Term",
      color: "#3B82F6",
      light: "#EFF6FF",
      seqs: ["Sequence 3", "Sequence 4"],
    },
    {
      num: 3,
      name: "Third Term",
      color: "#8B5CF6",
      light: "#F5F3FF",
      seqs: ["Sequence 5", "Sequence 6"],
    },
  ],
  francophone: [
    {
      num: 1,
      name: "Premier Semestre",
      color: "#085041",
      light: "#E1F5EE",
      seqs: ["Composition 1", "CA 1", "Composition 2"],
    },
    {
      num: 2,
      name: "Deuxième Semestre",
      color: "#3B82F6",
      light: "#EFF6FF",
      seqs: ["Composition 3", "CA 2", "Composition 4"],
    },
  ],
};

export default function AcademicYearSetup({ onComplete, onBack, schoolData }) {
  const { i18n } = useTranslation("onboarding");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [currentSystem, setCurrentSystem] = useState("anglophone");
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [terms, setTerms] = useState([]);
  const [expandedTerms, setExpandedTerms] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const setDefaults = useCallback(() => {
    const now = new Date();
    const yr = now.getFullYear();
    setFormData({
      name: `${yr} – ${yr + 1}`,
      startDate: `${yr}-09-01`,
      endDate: `${yr + 1}-06-30`,
    });
  }, []);

  const buildTermCards = useCallback(() => {
    const preset = TERM_PRESETS[currentSystem] || TERM_PRESETS.anglophone;
    setTerms(
      preset.map((term) => ({
        ...term,
        startDate: "",
        endDate: "",
        sequences: term.seqs.map((seq) => ({
          name: seq,
          startDate: "",
          endDate: "",
        })),
      })),
    );
  }, [currentSystem]);

  useEffect(() => {
    setDefaults();
  }, [setDefaults]);

  useEffect(() => {
    buildTermCards();
  }, [buildTermCards]);

  const handleSystemChange = (system) => {
    setCurrentSystem(system);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleTermDateChange = (termIndex, field, value) => {
    setTerms((prev) => {
      const updated = [...prev];
      updated[termIndex] = { ...updated[termIndex], [field]: value };
      return updated;
    });
  };

  const handleSequenceDateChange = (termIndex, seqIndex, field, value) => {
    setTerms((prev) => {
      const updated = [...prev];
      updated[termIndex].sequences[seqIndex] = {
        ...updated[termIndex].sequences[seqIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const toggleTerm = (termNum) => {
    setExpandedTerms((prev) => ({
      ...prev,
      [termNum]: !prev[termNum],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = lang === "fr" ? "Le nom est requis" : "Year name is required";
    }
    if (!formData.startDate) {
      errs.startDate =
        lang === "fr"
          ? "La date de début est requise"
          : "Start date is required";
    }
    if (!formData.endDate) {
      errs.endDate =
        lang === "fr" ? "La date de fin est requise" : "End date is required";
    }
    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      errs.endDate =
        lang === "fr"
          ? "La date de fin doit être après la date de début"
          : "End date must be after start date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        year: formData.name.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        system: currentSystem,
      };

      await createAcademicYear(payload);
      setShowSuccess(true);

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (lang === "fr"
          ? "Erreur lors de la création"
          : "Failed to create academic year");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = () => {
    if (!formData.startDate || !formData.endDate) return "— months";
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const months = Math.max(
      0,
      Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)),
    );
    return `${months} months`;
  };

  const getTermPreview = (term) => {
    if (!term.startDate || !term.endDate) return "Dates not set";
    const fmt = (d) =>
      new Date(d).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    return `${fmt(term.startDate)} → ${fmt(term.endDate)}`;
  };

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Left Panel */}
      <aside className="w-80 flex-shrink-0 bg-gradient-to-br from-teal-900 via-teal-700 to-teal-600 flex flex-col p-9 hidden lg:flex">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-serif text-xl text-white font-semibold">
            Akademee
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-0">
          {/* Done steps */}
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-start gap-4 mb-6 relative">
              <div className="absolute left-4 top-9 w-0.5 h-full bg-white/35" />
              <div className="w-9 h-9 rounded-full bg-white/90 text-teal-900 flex items-center justify-center font-bold text-sm z-10">
                <FiCheck className="w-4 h-4" />
              </div>
              <div className="pt-1 pb-7">
                <div className="text-sm font-bold text-white/90 mb-0.5">
                  {step === 1
                    ? "School identity"
                    : step === 2
                      ? "Branding & website"
                      : "Admin account"}
                </div>
                <div className="text-xs text-white/45 leading-relaxed">
                  {step === 1
                    ? "Name, subdomain, city"
                    : step === 2
                      ? "Logo, colors, template"
                      : "Login credentials set"}
                </div>
              </div>
            </div>
          ))}

          {/* Active step */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-white text-teal-900 flex items-center justify-center font-bold text-sm shadow-lg shadow-white/20">
              4
            </div>
            <div className="pt-1">
              <div className="text-sm font-bold text-white mb-0.5">
                Academic year
              </div>
              <div className="text-xs text-white/60 leading-relaxed">
                Configure your first school year
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/30 leading-relaxed pt-5 border-t border-white/8">
          Without an academic year, your team won't be able to enroll students,
          enter grades or generate reports. This takes less than 2 minutes.
        </div>
      </aside>

      {/* Right Panel */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 text-sm text-surface-400">
            <span className="font-semibold text-surface-900 dark:text-surface-100">
              {schoolData?.schoolName || "Your School"}
            </span>
            <span>·</span>
            <span>Setup step 4 of 4</span>
          </div>
          <div className="flex-1 max-w-72 mx-6">
            <div className="text-xs text-surface-400 font-medium mb-1.5">
              Almost there — final step
            </div>
            <div className="h-1 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-900 to-teal-600 rounded-full transition-all duration-500"
                style={{ width: "85%" }}
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 bg-none border-none text-sm text-surface-400 cursor-pointer font-sans p-2 rounded-lg transition-colors hover:bg-surface-100 dark:hover:bg-surface-700">
            <FiCalendar className="w-3.5 h-3.5" />
            Save & continue later
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex justify-center p-5">
          <div className="w-full max-w-2xl">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">
                Final step
              </div>
              <h1 className="font-serif text-3xl font-bold text-surface-900 dark:text-surface-100 leading-tight mb-2">
                Create your first academic year
              </h1>
              <p className="text-sm text-surface-400 leading-relaxed mb-9 max-w-lg">
                This will be the year your teachers and students work in by
                default. You can create additional years later and switch
                between them at any time.
              </p>

              {/* Warning Banner */}
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl mb-6">
                <FiAlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                  <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                    Required to access the platform.
                  </strong>{" "}
                  Without an academic year, your staff and students cannot log
                  in or access any feature. You will be able to create more
                  years later.
                </div>
              </div>

              {/* Year Name */}
              <div className="mb-5.5">
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5">
                  Academic year name{" "}
                  <span className="text-teal-600 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full h-12 px-4 border rounded-xl font-sans text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none transition-all ${errors.name ? "border-red-500 ring-4 ring-red-500/10" : "border-surface-100 dark:border-surface-700 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"}`}
                  placeholder="e.g. 2025 – 2026"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
                <div className="text-xs text-surface-400 mt-1.5 leading-relaxed">
                  This name will appear on all reports, grade sheets and
                  bulletin headers.
                </div>
                {errors.name && (
                  <div className="text-xs text-red-500 mt-1">{errors.name}</div>
                )}
              </div>

              {/* School System */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5">
                  School system <span className="text-teal-600 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Anglophone Card */}
                  <div
                    className={`border-2 rounded-xl p-4.5 cursor-pointer transition-all bg-white dark:bg-surface-800 text-left ${currentSystem === "anglophone" ? "border-teal-600 bg-teal-50 dark:bg-teal-900/20 shadow-lg shadow-teal-900/12 -translate-y-0.5" : "border-surface-100 dark:border-surface-700 hover:border-surface-200 dark:hover:border-surface-600 hover:-translate-y-0.5 hover:shadow-md"}`}
                    onClick={() => handleSystemChange("anglophone")}
                  >
                    <div
                      className="w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center mb-3 transition-all"
                      style={{
                        borderColor:
                          currentSystem === "anglophone"
                            ? "#085041"
                            : "#d8dbd5",
                        backgroundColor:
                          currentSystem === "anglophone"
                            ? "#085041"
                            : "transparent",
                      }}
                    >
                      {currentSystem === "anglophone" && (
                        <FiCheck className="w-2.75 h-2.75 text-white stroke-[2.5]" />
                      )}
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2.5"
                      style={{
                        backgroundColor:
                          currentSystem === "anglophone"
                            ? "#E1F5EE"
                            : "rgba(59,130,246,0.08)",
                      }}
                    >
                      <FiBookOpen
                        className="w-4.5 h-4.5"
                        style={{
                          color:
                            currentSystem === "anglophone"
                              ? "#085041"
                              : "#3B82F6",
                        }}
                      />
                    </div>
                    <div className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-1">
                      Anglophone
                    </div>
                    <div className="text-xs text-surface-400 leading-relaxed mb-2">
                      3 Terms × 2 Sequences = 6 sequences per year. GCE O/A
                      Level aligned.
                    </div>
                    <div
                      className="inline-flex text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          currentSystem === "anglophone"
                            ? "#E1F5EE"
                            : "rgba(59,130,246,0.08)",
                        color:
                          currentSystem === "anglophone"
                            ? "#085041"
                            : "#3B82F6",
                      }}
                    >
                      6 sequences
                    </div>
                  </div>

                  {/* Francophone Card */}
                  <div
                    className={`border-2 rounded-xl p-4.5 cursor-pointer transition-all bg-white dark:bg-surface-800 text-left ${currentSystem === "francophone" ? "border-teal-600 bg-teal-50 dark:bg-teal-900/20 shadow-lg shadow-teal-900/12 -translate-y-0.5" : "border-surface-100 dark:border-surface-700 hover:border-surface-200 dark:hover:border-surface-600 hover:-translate-y-0.5 hover:shadow-md"}`}
                    onClick={() => handleSystemChange("francophone")}
                  >
                    <div
                      className="w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center mb-3 transition-all"
                      style={{
                        borderColor:
                          currentSystem === "francophone"
                            ? "#085041"
                            : "#d8dbd5",
                        backgroundColor:
                          currentSystem === "francophone"
                            ? "#085041"
                            : "transparent",
                      }}
                    >
                      {currentSystem === "francophone" && (
                        <FiCheck className="w-2.75 h-2.75 text-white stroke-[2.5]" />
                      )}
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2.5"
                      style={{ backgroundColor: "rgba(59,130,246,0.08)" }}
                    >
                      <FiAward className="w-4.5 h-4.5 text-blue-500" />
                    </div>
                    <div className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-1">
                      Francophone
                    </div>
                    <div className="text-xs text-surface-400 leading-relaxed mb-2">
                      2 Semestres × 3 Compositions/CA = 6 évaluations par an.
                      Baccalauréat.
                    </div>
                    <div
                      className="inline-flex text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(59,130,246,0.08)",
                        color: "#3B82F6",
                      }}
                    >
                      2 semestres
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3.5 mb-7">
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5">
                    Start date <span className="text-teal-600 ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full h-12 px-4 border rounded-xl font-sans text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none transition-all ${errors.startDate ? "border-red-500 ring-4 ring-red-500/10" : "border-surface-100 dark:border-surface-700 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"}`}
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                  />
                  {errors.startDate && (
                    <div className="text-xs text-red-500 mt-1">
                      {errors.startDate}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5">
                    End date <span className="text-teal-600 ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full h-12 px-4 border rounded-xl font-sans text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none transition-all ${errors.endDate ? "border-red-500 ring-4 ring-red-500/10" : "border-surface-100 dark:border-surface-700 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"}`}
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                  />
                  {errors.endDate && (
                    <div className="text-xs text-red-500 mt-1">
                      {errors.endDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-surface-900 dark:bg-surface-800 rounded-2xl p-6 mb-7 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                    <div>
                      <div className="font-serif text-2xl font-bold text-white mb-1.5">
                        {formData.name || "— – —"}
                      </div>
                      <div className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-5">
                        {currentSystem === "anglophone"
                          ? "ANGLOPHONE SYSTEM · 6 SEQUENCES"
                          : "FRANCOPHONE SYSTEM · 2 SEMESTRES"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-0.5">
                        Duration
                      </div>
                      <div className="text-base font-extrabold text-white/80">
                        {getDuration()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-2">
                    Academic periods
                  </div>
                  <div className="flex gap-0.5 mb-1">
                    {terms.map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden"
                      >
                        <div
                          className="h-full rounded-full bg-teal-400"
                          style={{ width: "33%" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {terms.map((term, i) => (
                      <div
                        key={i}
                        className="flex-1 text-[9.5px] font-semibold text-white/30 uppercase tracking-wider"
                      >
                        {currentSystem === "anglophone"
                          ? `Term ${i + 1}`
                          : `Sem. ${i + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Terms Configuration */}
              <div className="mb-7">
                <div className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-1">
                  Term dates{" "}
                  <span className="text-sm font-normal text-surface-400">
                    (optional — you can set these later)
                  </span>
                </div>
                <div className="text-xs text-surface-400 mb-4.5 leading-relaxed">
                  Configure the start and end date of each term and its
                  sequences. This is used for attendance reports and the
                  academic calendar.
                </div>

                {terms.map((term) => (
                  <div
                    key={term.num}
                    className={`border-1.5 rounded-2xl overflow-hidden mb-3 transition-all ${expandedTerms[term.num] ? "border-surface-200 dark:border-surface-600 shadow-sm" : "border-surface-100 dark:border-surface-700"}`}
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer bg-surface-50 dark:bg-surface-900 transition-colors"
                      onClick={() => toggleTerm(term.num)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold"
                          style={{
                            backgroundColor: term.light,
                            color: term.color,
                          }}
                        >
                          {term.num}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-surface-900 dark:text-surface-100">
                            {term.name}
                          </div>
                          <div className="text-xs text-surface-400">
                            {getTermPreview(term)}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-7 h-7 rounded-full bg-white border flex items-center justify-center transition-all ${expandedTerms[term.num] ? "bg-teal-50 border-teal-200" : "border-surface-200 dark:border-surface-600"}`}
                      >
                        <FiArrowLeft
                          className={`w-3 h-3 text-surface-400 transition-transform ${expandedTerms[term.num] ? "rotate-90" : ""}`}
                        />
                      </div>
                    </div>

                    {expandedTerms[term.num] && (
                      <div className="p-4.5 border-t border-surface-100 dark:border-surface-700 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-3 mb-4.5">
                          <div>
                            <label className="text-xs font-bold text-surface-500 block mb-1.5">
                              Start date
                            </label>
                            <input
                              type="date"
                              className="w-full h-10.5 px-4 border rounded-lg font-sans text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none border-surface-100 dark:border-surface-700 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all"
                              value={term.startDate}
                              onChange={(e) =>
                                handleTermDateChange(
                                  term.num - 1,
                                  "startDate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-surface-500 block mb-1.5">
                              End date
                            </label>
                            <input
                              type="date"
                              className="w-full h-10.5 px-4 border rounded-lg font-sans text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none border-surface-100 dark:border-surface-700 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all"
                              value={term.endDate}
                              onChange={(e) =>
                                handleTermDateChange(
                                  term.num - 1,
                                  "endDate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="text-xs font-bold tracking-wider uppercase text-surface-400 mb-3">
                          {currentSystem === "anglophone"
                            ? "Sequences"
                            : "Évaluations"}
                        </div>
                        {term.sequences.map((seq, seqIdx) => (
                          <div
                            key={seqIdx}
                            className={`grid grid-cols-2 gap-3 mb-2.5 pb-2.5 ${seqIdx < term.sequences.length - 1 ? "border-b border-surface-50 dark:border-surface-800" : ""}`}
                          >
                            <div>
                              <label
                                className="text-xs font-semibold block mb-1.5"
                                style={{ color: term.color }}
                              >
                                {seq.name} — Start
                              </label>
                              <input
                                type="date"
                                className="w-full h-9.5 px-4 border rounded-lg font-sans text-xs bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none border-surface-100 dark:border-surface-700 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all"
                                value={seq.startDate}
                                onChange={(e) =>
                                  handleSequenceDateChange(
                                    term.num - 1,
                                    seqIdx,
                                    "startDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label
                                className="text-xs font-semibold block mb-1.5"
                                style={{ color: term.color }}
                              >
                                {seq.name} — End
                              </label>
                              <input
                                type="date"
                                className="w-full h-9.5 px-4 border rounded-lg font-sans text-xs bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none border-surface-100 dark:border-surface-700 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all"
                                value={seq.endDate}
                                onChange={(e) =>
                                  handleSequenceDateChange(
                                    term.num - 1,
                                    seqIdx,
                                    "endDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="h-px bg-surface-100 dark:bg-surface-700 my-7" />

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  className="flex items-center gap-2 h-12 px-6 rounded-xl font-sans text-sm font-bold cursor-pointer border-none transition-all bg-white text-surface-700 border border-surface-200 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700 dark:hover:bg-surface-700"
                  onClick={onBack}
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  className="flex items-center gap-2 h-12 px-6 rounded-xl font-sans text-sm font-bold cursor-pointer border-none transition-all bg-teal-900 text-white shadow-lg shadow-teal-900/22 hover:bg-teal-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Finish setup & go to dashboard
                      <FiArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-surface-800 rounded-[28px] p-12 text-center max-w-md w-[90%] animate-in zoom-in-95 duration-400">
            <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-900/20 border-3 border-teal-100 dark:border-teal-900/30 flex items-center justify-center mx-auto mb-5">
              <FiCheck className="w-10 h-10 text-teal-900 dark:text-teal-400 stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              Your campus is ready!
            </h2>
            <p className="text-sm text-surface-400 leading-relaxed mb-1">
              Academic year created successfully.
            </p>
            <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30 rounded-full px-4.5 py-2 my-4 text-sm font-bold text-teal-900 dark:text-teal-400">
              <FiCalendar className="w-3.5 h-3.5" />
              {formData.name}
            </div>
            <p className="text-sm text-surface-400 mb-7">
              You can now enroll students, assign teachers, and start managing
              your school.
            </p>
            <button className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-sans text-sm font-bold cursor-pointer border-none transition-all bg-teal-900 text-white shadow-lg shadow-teal-900/22 hover:bg-teal-700 hover:-translate-y-0.5">
              <FiGrid className="w-3.5 h-3.5" />
              Go to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
