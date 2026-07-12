import { useState } from "react";
import { submitEnrolmentInquiry } from "../../../core/api/enrolmentService";

/**
 * Reusable enrolment inquiry form for public website templates.
 *
 * @param {{
 *   schoolId?: string,
 *   variant?: 'dark'|'light'|'premium',
 *   primaryColor?: string,
 *   onSuccess?: () => void,
 *   className?: string,
 * }} props
 *
 * The parent template is responsible for the outer container, heading, and description.
 * This component handles form logic, validation, submission, and success/error states.
 */
export default function EnrollmentForm({
  variant = "light",
  primaryColor = "#085041",
  className = "",
}) {
  const lang = navigator.language?.startsWith("fr") ? "fr" : "en";
  const isFr = lang === "fr";

  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    studentName: "",
    studentAge: "",
    grade: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const GRADES = isFr
    ? [
        { value: "", label: "Sélectionnez un niveau" },
        { value: "form1", label: "Form 1 (6e)" },
        { value: "form2", label: "Form 2 (5e)" },
        { value: "form3", label: "Form 3 (4e)" },
        { value: "form4", label: "Form 4 (3e)" },
        { value: "form5", label: "Form 5 (2nde)" },
        { value: "lower6", label: "Lower Sixth (1ère)" },
        { value: "upper6", label: "Upper Sixth (Tle)" },
        { value: "other", label: "Autre" },
      ]
    : [
        { value: "", label: "Select a grade" },
        { value: "form1", label: "Form 1" },
        { value: "form2", label: "Form 2" },
        { value: "form3", label: "Form 3" },
        { value: "form4", label: "Form 4" },
        { value: "form5", label: "Form 5" },
        { value: "lower6", label: "Lower Sixth" },
        { value: "upper6", label: "Upper Sixth" },
        { value: "other", label: "Other" },
      ];

  const validate = () => {
    const errs = {};
    if (!formData.parentName.trim()) {
      errs.parentName = isFr ? "Le nom du parent est requis" : "Parent name is required";
    }
    if (!formData.parentEmail.trim()) {
      errs.parentEmail = isFr ? "L'email est requis" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      errs.parentEmail = isFr ? "Email invalide" : "Invalid email";
    }
    if (!formData.studentName.trim()) {
      errs.studentName = isFr ? "Le nom de l'élève est requis" : "Student name is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await submitEnrolmentInquiry({
        parentName: formData.parentName.trim(),
        parentEmail: formData.parentEmail.trim().toLowerCase(),
        parentPhone: formData.parentPhone.trim() || undefined,
        studentName: formData.studentName.trim(),
        studentAge: formData.studentAge.trim() || undefined,
        grade: formData.grade || undefined,
        message: formData.message.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (isFr
          ? "Une erreur est survenue. Veuillez réessayer."
          : "An error occurred. Please try again.");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    borderRadius: variant === "premium" ? "2px" : "0.75rem",
    border: `1.5px solid ${variant === "dark" ? "rgba(255,255,255,0.12)" : "#d0ccc4"}`,
    background: variant === "dark"
      ? "rgba(255,255,255,0.05)"
      : variant === "premium"
        ? "#fcfaf7"
        : "#fff",
    color: variant === "dark" ? "#fff" : "#1a1a1a",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "0.375rem",
    color: variant === "dark" ? "rgba(255,255,255,0.5)" : "#6a6a6a",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  };

  const FocusStyle = `:focus { border-color: ${primaryColor}; box-shadow: 0 0 0 3px ${primaryColor}20; }`;

  if (submitted) {
    return (
      <div className={`text-center ${className}`}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: `${primaryColor}15` }}
        >
          <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: variant === "dark" ? "#fff" : "#1a1a1a" }}
        >
          {isFr ? "Demande envoyée !" : "Application Submitted!"}
        </h3>
        <p
          className="text-sm leading-relaxed max-w-md mx-auto"
          style={{ color: variant === "dark" ? "rgba(255,255,255,0.5)" : "#6a6a6a" }}
        >
          {isFr
            ? "Merci pour votre intérêt ! Notre équipe vous contactera dans les plus brefs délais pour discuter des prochaines étapes."
            : "Thank you for your interest! Our admissions team will contact you shortly to discuss the next steps."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <style>{FocusStyle}</style>

      {submitError && (
        <div
          className="text-sm p-3 rounded-lg mb-4"
          style={{
            background: variant === "dark" ? "rgba(239,68,68,0.15)" : "#fef2f2",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Parent Name */}
        <div className="sm:col-span-2">
          <label style={labelStyle}>
            {isFr ? "Nom du parent / tuteur" : "Parent / Guardian Name"} *
          </label>
          <input
            type="text"
            value={formData.parentName}
            onChange={(e) => handleChange("parentName", e.target.value)}
            placeholder={isFr ? "Ex: Jean Dupont" : "E.g.: John Doe"}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.parentName
                ? "#ef4444"
                : variant === "dark" ? "rgba(255,255,255,0.12)" : "#d0ccc4";
              e.target.style.boxShadow = "none";
            }}
          />
          {errors.parentName && (
            <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.parentName}</p>
          )}
        </div>

        {/* Parent Email */}
        <div>
          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            value={formData.parentEmail}
            onChange={(e) => handleChange("parentEmail", e.target.value)}
            placeholder="exemple@email.com"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.parentEmail
                ? "#ef4444"
                : variant === "dark" ? "rgba(255,255,255,0.12)" : "#d0ccc4";
              e.target.style.boxShadow = "none";
            }}
          />
          {errors.parentEmail && (
            <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.parentEmail}</p>
          )}
        </div>

        {/* Parent Phone */}
        <div>
          <label style={labelStyle}>
            {isFr ? "Téléphone" : "Phone"} <span style={{ color: variant === "dark" ? "rgba(255,255,255,0.3)" : "#aaa" }}>({isFr ? "optionnel" : "optional"})</span>
          </label>
          <input
            type="tel"
            value={formData.parentPhone}
            onChange={(e) => handleChange("parentPhone", e.target.value)}
            placeholder="+237 6XX XXX XXX"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = variant === "dark" ? "rgba(255,255,255,0.12)" : "#d0ccc4";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Student Name */}
        <div className="sm:col-span-2">
          <label style={labelStyle}>
            {isFr ? "Nom de l'élève" : "Student Name"} *
          </label>
          <input
            type="text"
            value={formData.studentName}
            onChange={(e) => handleChange("studentName", e.target.value)}
            placeholder={isFr ? "Ex: Marie Dupont" : "E.g.: Jane Doe"}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.studentName
                ? "#ef4444"
                : variant === "dark" ? "rgba(255,255,255,0.12)" : "#d0ccc4";
              e.target.style.boxShadow = "none";
            }}
          />
          {errors.studentName && (
            <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.studentName}</p>
          )}
        </div>

        {/* Student Age */}
        <div>
          <label style={labelStyle}>
            {isFr ? "Âge" : "Age"} <span style={{ color: variant === "dark" ? "rgba(255,255,255,0.3)" : "#aaa" }}>({isFr ? "optionnel" : "optional"})</span>
          </label>
          <input
            type="text"
            value={formData.studentAge}
            onChange={(e) => handleChange("studentAge", e.target.value)}
            placeholder={isFr ? "Ex: 14 ans" : "E.g.: 14 years"}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = variant === "dark" ? "rgba(255,255,255,0.12)" : "#d0ccc4";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Grade */}
        <div>
          <label style={labelStyle}>
            {isFr ? "Niveau souhaité" : "Grade"}
          </label>
          <select
            value={formData.grade}
            onChange={(e) => handleChange("grade", e.target.value)}
            style={{
              ...inputStyle,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${variant === "dark" ? "ffffff" : "1a1a1a"}40' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              paddingRight: "2rem",
            }}
          >
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}
                style={{ background: variant === "dark" ? "#1a1a1a" : "#fff", color: variant === "dark" ? "#fff" : "#1a1a1a" }}
              >
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label style={labelStyle}>
            {isFr ? "Message" : "Message"} <span style={{ color: variant === "dark" ? "rgba(255,255,255,0.3)" : "#aaa" }}>({isFr ? "optionnel" : "optional"})</span>
          </label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            placeholder={
              isFr
                ? "Questions particulières ou informations complémentaires..."
                : "Any specific questions or additional information..."
            }
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "80px",
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = variant === "dark" ? "rgba(255,255,255,0.12)" : "#d0ccc4";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          marginTop: "1.25rem",
          padding: "0.875rem 1.5rem",
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "#fff",
          background: primaryColor,
          border: "none",
          borderRadius: variant === "premium" ? "2px" : "0.75rem",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
        onMouseEnter={(e) => {
          if (!submitting) e.target.style.filter = "brightness(1.1)";
        }}
        onMouseLeave={(e) => {
          if (!submitting) e.target.style.filter = "none";
        }}
      >
        {submitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
              <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" opacity="0.75" />
            </svg>
            {isFr ? "Envoi en cours..." : "Submitting..."}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
            </svg>
            {isFr ? "Envoyer ma demande" : "Submit Application"}
          </>
        )}
      </button>

      <p
        className="text-[11px] text-center mt-3"
        style={{ color: variant === "dark" ? "rgba(255,255,255,0.25)" : "#aaa" }}
      >
        {isFr
          ? "Nous respectons votre vie privée. Vos données ne seront pas partagées."
          : "We respect your privacy. Your data will not be shared."}
      </p>
    </form>
  );
}
