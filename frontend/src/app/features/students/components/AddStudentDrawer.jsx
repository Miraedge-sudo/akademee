import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createStudent } from "../../../core/api/studentService";
import { FiX, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function AddStudentDrawer({ isOpen, onClose, onSuccess }) {
  const { i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    className: "",
    classId: "",
    dateOfBirth: "",
    gender: "male",
    studentNumber: "",
    status: "active",
    feeStatus: "pending",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation côté client
    if (!formData.firstName.trim()) {
      setError(
        lang === "fr" ? "Le prénom est requis" : "First name is required",
      );
      setLoading(false);
      return;
    }
    if (!formData.lastName.trim()) {
      setError(lang === "fr" ? "Le nom est requis" : "Last name is required");
      setLoading(false);
      return;
    }
    if (!formData.className.trim()) {
      setError(lang === "fr" ? "La classe est requise" : "Class is required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        className: formData.className.trim(),
        classId: formData.classId || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        studentNumber: formData.studentNumber.trim() || null,
        status: formData.status,
        feeStatus: formData.feeStatus,
      };

      await createStudent(payload);
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Error creating student:", err);
      setError(
        err.response?.data?.message ||
          (lang === "fr"
            ? "Erreur lors de la création de l'étudiant"
            : "Error creating student"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      className: "",
      classId: "",
      dateOfBirth: "",
      gender: "male",
      studentNumber: "",
      status: "active",
      feeStatus: "pending",
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="relative bg-white dark:bg-surface-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">
                {lang === "fr" ? "Nouvel étudiant" : "New Student"}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                {lang === "fr"
                  ? "Remplissez les informations pour enregistrer un nouvel étudiant"
                  : "Fill in the information to register a new student"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-surface-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-4">
              {lang === "fr"
                ? "Informations personnelles"
                : "Personal Information"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Prénom *" : "First Name *"}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={lang === "fr" ? "Jean" : "John"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Nom *" : "Last Name *"}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={lang === "fr" ? "Dupont" : "Doe"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Date de naissance" : "Date of Birth"}
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Genre" : "Gender"}
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="male">
                    {lang === "fr" ? "Masculin" : "Male"}
                  </option>
                  <option value="female">
                    {lang === "fr" ? "Féminin" : "Female"}
                  </option>
                  <option value="other">
                    {lang === "fr" ? "Autre" : "Other"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-4">
              {lang === "fr"
                ? "Informations de contact"
                : "Contact Information"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Email" : "Email"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="jean.dupont@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Téléphone" : "Phone"}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-4">
              {lang === "fr"
                ? "Informations académiques"
                : "Academic Information"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Classe *" : "Class *"}
                </label>
                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={lang === "fr" ? "Form 1A" : "Form 1A"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Numéro étudiant" : "Student Number"}
                </label>
                <input
                  type="text"
                  name="studentNumber"
                  value={formData.studentNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="STU-000001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Statut" : "Status"}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="active">
                    {lang === "fr" ? "Actif" : "Active"}
                  </option>
                  <option value="inactive">
                    {lang === "fr" ? "Inactif" : "Inactive"}
                  </option>
                  <option value="graduated">
                    {lang === "fr" ? "Diplômé" : "Graduated"}
                  </option>
                  <option value="transferred">
                    {lang === "fr" ? "Transféré" : "Transferred"}
                  </option>
                  <option value="suspended">
                    {lang === "fr" ? "Suspendu" : "Suspended"}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {lang === "fr" ? "Statut des frais" : "Fee Status"}
                </label>
                <select
                  name="feeStatus"
                  value={formData.feeStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pending">
                    {lang === "fr" ? "En attente" : "Pending"}
                  </option>
                  <option value="partial">
                    {lang === "fr" ? "Partiel" : "Partial"}
                  </option>
                  <option value="paid">
                    {lang === "fr" ? "Payé" : "Paid"}
                  </option>
                  <option value="overdue">
                    {lang === "fr" ? "En retard" : "Overdue"}
                  </option>
                  <option value="unpaid">
                    {lang === "fr" ? "Non payé" : "Unpaid"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {lang === "fr" ? "Annuler" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin h-4 w-4" />
                  {lang === "fr" ? "Création..." : "Creating..."}
                </>
              ) : lang === "fr" ? (
                "Créer l'étudiant"
              ) : (
                "Create Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
