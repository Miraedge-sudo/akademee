import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getClasses } from "../../../core/api/classService";
import { getSubjects } from "../../../core/api/subjectService";
import {
  getClassSubjectsByClass,
  assignSubjectToClass,
  removeSubjectFromClass,
} from "../../../core/api/classSubjectService";
import {
  Button,
  Card,
  PageHeader,
  Badge,
  Skeleton,
  EmptyState,
  Select,
} from "../../../components";
import { FiBook, FiPlus, FiTrash2, FiCheck } from "react-icons/fi";

export default function ClassSubjectsPage() {
  const { i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [classes, setClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected class
  const [selectedClassId, setSelectedClassId] = useState("");
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);

  // Add subject state
  const [addingSubjectId, setAddingSubjectId] = useState("");
  const [adding, setAdding] = useState(false);

  // Removing state
  const [removingId, setRemovingId] = useState(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesData, subjectsData] = await Promise.all([
        getClasses({ limit: 200 }),
        getSubjects({ limit: 200 }),
      ]);
      const clsList = Array.isArray(classesData) ? classesData : classesData?.classes || classesData?.rows || [];
      const subList = Array.isArray(subjectsData) ? subjectsData : subjectsData?.subjects || subjectsData?.rows || [];
      setClasses(clsList);
      setAllSubjects(subList);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(
        lang === "fr"
          ? "Erreur lors du chargement"
          : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load assigned subjects when class changes
  const loadAssigned = useCallback(async (classId) => {
    if (!classId) {
      setAssignedSubjects([]);
      return;
    }
    setAssignedLoading(true);
    try {
      const data = await getClassSubjectsByClass(classId);
      const list = Array.isArray(data) ? data : data?.assignments || data?.subjects || data?.rows || [];
      setAssignedSubjects(list);
    } catch (err) {
      console.error("Failed to load assigned subjects:", err);
      toast.error(
        lang === "fr"
          ? "Erreur de chargement des matières"
          : "Failed to load subjects"
      );
      setAssignedSubjects([]);
    } finally {
      setAssignedLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadAssigned(selectedClassId);
  }, [selectedClassId, loadAssigned]);

  // Get unassigned subjects (to show in dropdown)
  const assignedSubjectIds = assignedSubjects.map((s) => s.subjectId || s.subject_id);
  const unassignedSubjects = allSubjects.filter(
    (s) => !assignedSubjectIds.includes(s.id || s.subject_id)
  );

  // Handle adding a subject
  const handleAddSubject = async () => {
    if (!addingSubjectId || !selectedClassId) return;
    setAdding(true);
    try {
      await assignSubjectToClass({
        classId: selectedClassId,
        subjectId: addingSubjectId,
      });
      toast.success(lang === "fr" ? "Matière assignée" : "Subject assigned");
      setAddingSubjectId("");
      loadAssigned(selectedClassId);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (lang === "fr" ? "Erreur" : "Failed to assign subject");
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  // Handle removing a subject
  const handleRemoveSubject = async (assignment) => {
    const id = assignment.id || assignment.class_subject_id;
    if (!id) return;
    setRemovingId(id);
    try {
      await removeSubjectFromClass(id);
      toast.success(lang === "fr" ? "Matière retirée" : "Subject removed");
      loadAssigned(selectedClassId);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          (lang === "fr" ? "Erreur" : "Failed to remove subject")
      );
    } finally {
      setRemovingId(null);
    }
  };

  // Class options for select
  const classOptions = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  // Subject options for add dropdown
  const subjectOptions = unassignedSubjects.map((s) => ({
    value: s.id || s.subject_id,
    label: `${s.name}${s.code ? ` (${s.code})` : ""}`,
  }));

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    if (!subjectId) return "—";
    const sub = allSubjects.find((s) => (s.id || s.subject_id) === subjectId);
    return sub?.name || subjectId.slice(0, 8);
  };

  // Selected class name
  const selectedClassName =
    classes.find((c) => c.id === selectedClassId)?.name || "";

  // ── Render ──
  if (error && !loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          icon={<FiBook className="w-6 h-6" />}
          title={lang === "fr" ? "Matières par classe" : "Subjects by Class"}
          subtitle={
            lang === "fr"
              ? "Assigner les matières aux classes"
              : "Assign subjects to classes"
          }
        />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button variant="primary" onClick={loadInitialData}>
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
        icon={<FiBook className="w-6 h-6" />}
        title={lang === "fr" ? "Matières par classe" : "Subjects by Class"}
        subtitle={
          lang === "fr"
            ? "Sélectionnez une classe pour gérer ses matières"
            : "Select a class to manage its subjects"
        }
      />

      {/* Class selector */}
      <Card>
        {loading ? (
          <div className="space-y-3 p-2">
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={<FiBook className="w-8 h-8" />}
            title={
              lang === "fr" ? "Aucune classe" : "No classes yet"
            }
            subtitle={
              lang === "fr"
                ? "Créez d'abord des classes et des matières"
                : "Create classes and subjects first"
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Class selector */}
            <div className="max-w-md">
              <Select
                label={lang === "fr" ? "Choisir une classe" : "Select a class"}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                options={classOptions}
                placeholder={
                  lang === "fr"
                    ? "Sélectionnez une classe..."
                    : "Select a class..."
                }
              />
            </div>

            {selectedClassId && (
              <>
                {/* Assigned subjects */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                      {lang === "fr"
                        ? `Matières de ${selectedClassName}`
                        : `Subjects for ${selectedClassName}`}
                    </h3>
                    <Badge status="info">
                      {assignedSubjects.length}{" "}
                      {lang === "fr" ? "matière(s)" : "subject(s)"}
                    </Badge>
                  </div>

                  {assignedLoading ? (
                    <div className="space-y-2">
                      <Skeleton variant="text" />
                      <Skeleton variant="text" />
                      <Skeleton variant="text" />
                    </div>
                  ) : assignedSubjects.length === 0 ? (
                    <div className="text-center py-8 bg-surface-50 dark:bg-surface-900 rounded-lg border border-dashed border-surface-200 dark:border-surface-700">
                      <p className="text-sm text-surface-400">
                        {lang === "fr"
                          ? "Aucune matière assignée à cette classe"
                          : "No subjects assigned to this class"}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-50 dark:bg-surface-900">
                            <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                              {lang === "fr" ? "Matière" : "Subject"}
                            </th>
                            <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-100 dark:border-surface-700">
                              {lang === "fr" ? "Coefficient" : "Coefficient"}
                            </th>
                            <th className="text-right py-2.5 px-4 border-b border-surface-100 dark:border-surface-700"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedSubjects.map((assignment) => {
                            const id = assignment.id || assignment.class_subject_id;
                            const name = assignment.subjectName || assignment.subject_name || getSubjectName(assignment.subjectId) || "—";
                            const coeff = assignment.coefficient ?? 1;
                            return (
                              <tr
                                key={id}
                                className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
                              >
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="font-medium text-surface-800 dark:text-surface-100">
                                      {name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4">
                                  <Badge variant="outline">x{coeff}</Badge>
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <button
                                    onClick={() => handleRemoveSubject(assignment)}
                                    disabled={removingId === id}
                                    className="p-1.5 text-surface-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Add subject */}
                {unassignedSubjects.length > 0 && (
                  <div className="flex items-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-700">
                    <div className="flex-1">
                      <Select
                        label={
                          lang === "fr"
                            ? "Ajouter une matière"
                            : "Add a subject"
                        }
                        value={addingSubjectId}
                        onChange={(e) => setAddingSubjectId(e.target.value)}
                        options={subjectOptions}
                        placeholder={
                          lang === "fr"
                            ? "Choisir une matière..."
                            : "Choose a subject..."
                        }
                      />
                    </div>
                    <Button
                      variant="primary"
                      icon={<FiPlus className="w-4 h-4" />}
                      disabled={!addingSubjectId}
                      loading={adding}
                      onClick={handleAddSubject}
                    >
                      {lang === "fr" ? "Assigner" : "Assign"}
                    </Button>
                  </div>
                )}

                {unassignedSubjects.length === 0 && allSubjects.length > 0 && (
                  <div className="pt-4 border-t border-surface-100 dark:border-surface-700">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <FiCheck className="w-4 h-4" />
                      {lang === "fr"
                        ? "Toutes les matières sont déjà assignées à cette classe"
                        : "All subjects are already assigned to this class"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
