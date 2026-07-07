import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getStudents } from "../../../core/api/studentService";
import AddStudentDrawer from "../components/AddStudentDrawer";
import { FiPlus, FiUsers, FiLoader } from "react-icons/fi";

export default function StudentsListPage() {
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudents();
      setStudents(data.students || []);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentCreated = () => {
    loadStudents();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t("students.title", "Students")}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang === "fr" ? "Gérer les élèves" : "Manage students"}
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          {lang === "fr" ? "Ajouter un étudiant" : "Add Student"}
        </button>
      </div>

      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin h-8 w-8 text-primary-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
              <FiUsers className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
              {lang === "fr" ? "Aucun étudiant" : "No students yet"}
            </h3>
            <p className="text-sm text-surface-400 max-w-md mb-4">
              {lang === "fr"
                ? "Commencez par ajouter votre premier étudiant."
                : "Start by adding your first student."}
            </p>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {lang === "fr" ? "Ajouter un étudiant" : "Add Student"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
                    {lang === "fr" ? "Nom" : "Name"}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
                    {lang === "fr" ? "Classe" : "Class"}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
                    {lang === "fr" ? "Statut" : "Status"}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
                    {lang === "fr" ? "Frais" : "Fees"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-900/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-semibold">
                          {student.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-800 dark:text-surface-100">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-surface-500">
                            {student.studentNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-600 dark:text-surface-400">
                      {student.className}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          student.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          student.feeStatus === "paid"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : student.feeStatus === "pending"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {student.feeStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddStudentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleStudentCreated}
      />
    </div>
  );
}
