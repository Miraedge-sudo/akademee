import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import { getSubjectColor } from "../utils/subjectColors";

/**
 * Modal d'ajout / édition d'un cours dans un créneau.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   mode: 'add'|'edit',
 *   period?: object|null,   // créneau (add)
 *   entry?: object|null,    // cours existant (edit)
 *   subjects: Array,
 *   teachers: Array,
 *   rooms: Array,
 *   entries?: Array,          // tous les cours de l'année (vérification de conflits)
 *   currentClassId?: string,  // classe en cours d'édition (pour exclure ses propres cours)
 *   onSave: (data: { subjectId, teacherId, roomId }) => void,
 *   onDelete?: () => void,
 * }} props
 */
export default function LessonModal({
  isOpen,
  onClose,
  mode = "add",
  period = null,
  entry = null,
  subjects = [],
  teachers = [],
  rooms = [],
  entries = [],
  currentClassId = null,
  onSave,
  onDelete,
}) {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSubjectId(entry?.subjectId || "");
      setTeacherId(entry?.teacherId || "");
      setRoomId(entry?.roomId || "");
      setError("");
    }
  }, [isOpen, entry]);

  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: s.subject_id || s.id, label: s.name })),
    [subjects]
  );
  const teacherOptions = useMemo(
    () =>
      teachers.map((t) => ({
        value: t.user_id || t.id,
        label: [t.first_name, t.last_name].filter(Boolean).join(" ").trim() || t.email || "—",
      })),
    [teachers]
  );
  const roomOptions = useMemo(
    () => rooms.map((r) => ({ value: r.id, label: `${r.name}${r.capacity ? ` (${r.capacity})` : ""}` })),
    [rooms]
  );

  // ── Vérification de conflits au moment du choix (avant enregistrement) ──
  // Un enseignant / une salle ne peut pas être sur deux classes au même créneau.
  // On exclut la classe en cours d'édition (ses cours seront remplacés à la
  // sauvegarde) et le cours en cours d'édition lui-même.
  const busyInfo = useMemo(() => {
    if (!period) return { teacher: null, room: null };
    const conflict = (e) =>
      e &&
      e.classId !== currentClassId &&
      e.id !== entry?.id;
    const teacher = entries.find((e) => conflict(e) && e.teacherId === teacherId && e.periodId === period.id) || null;
    const room = roomId
      ? entries.find((e) => conflict(e) && e.roomId === roomId && e.periodId === period.id) || null
      : null;
    return { teacher, room };
  }, [entries, period, teacherId, roomId, currentClassId, entry?.id]);

  const busyTeacher = busyInfo.teacher;
  const busyRoom = busyInfo.room;

  if (!isOpen) return null;

  const title =
    mode === "edit"
      ? isFr ? "Modifier le cours" : "Edit lesson"
      : isFr ? "Ajouter un cours" : "Add lesson";

  const subtitle =
    period && (isFr
      ? `${period.name} · ${period.day} — ${String(period.startTime).slice(0, 5)}–${String(period.endTime).slice(0, 5)}`
      : `${period.name} · Day ${period.day} — ${String(period.startTime).slice(0, 5)}–${String(period.endTime).slice(0, 5)}`);

  const handleSubmit = () => {
    if (!subjectId) return setError(isFr ? "Choisissez une matière" : "Please choose a subject");
    if (!teacherId) return setError(isFr ? "Choisissez un enseignant" : "Please choose a teacher");
    if (busyTeacher) {
      return setError(
        isFr
          ? `Cet enseignant donne déjà cours dans une autre classe (${busyTeacher.className || "?"}) à ce créneau. Choisissez un autre enseignant.`
          : `This teacher is already teaching in another class (${busyTeacher.className || "?"}) at this period. Choose another teacher.`
      );
    }
    if (busyRoom) {
      return setError(
        isFr
          ? `Cette salle est déjà utilisée par une autre classe (${busyRoom.className || "?"}) à ce créneau. Choisissez une autre salle.`
          : `This room is already used by another class (${busyRoom.className || "?"}) at this period. Choose another room.`
      );
    }
    onSave({ subjectId, teacherId, roomId: roomId || null });
  };

  const previewSubject = subjects.find((s) => (s.subject_id || s.id) === subjectId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div>
            {mode === "edit" && onDelete && (
              <Button variant="danger" onClick={onDelete} size="sm">
                {isFr ? "Supprimer" : "Delete"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={onClose} size="sm">
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} size="sm">
              {isFr ? "Enregistrer" : "Save"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {period && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 px-3 py-2.5">
            <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-surface-600 dark:text-surface-300">{subtitle}</span>
          </div>
        )}

        {previewSubject && (
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getSubjectColor(previewSubject.subject_id || previewSubject.id, previewSubject.name).solid }}
            />
            <span className="text-[11px] font-semibold text-surface-500 dark:text-surface-400">
              {isFr ? "Couleur de la matière" : "Subject color"}
            </span>
          </div>
        )}

        <Select
          label={isFr ? "Matière *" : "Subject *"}
          placeholder={isFr ? "Choisir une matière…" : "Choose a subject…"}
          value={subjectId}
          options={subjectOptions}
          onChange={(e) => setSubjectId(e.target.value)}
        />

        <Select
          label={isFr ? "Enseignant *" : "Teacher *"}
          placeholder={isFr ? "Choisir un enseignant…" : "Choose a teacher…"}
          value={teacherId}
          options={teacherOptions}
          onChange={(e) => setTeacherId(e.target.value)}
        />

        {busyTeacher && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-3 py-2.5 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
            <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {isFr
                ? `⚠ Cet enseignant donne déjà cours dans la classe ${busyTeacher.className || "?"} à ce créneau. La sauvegarde sera refusée.`
                : `⚠ This teacher is already teaching in class ${busyTeacher.className || "?"} at this period. Saving will be rejected.`}
            </span>
          </div>
        )}

        {busyRoom && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-3 py-2.5 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
            <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {isFr
                ? `⚠ Cette salle est déjà utilisée par la classe ${busyRoom.className || "?"} à ce créneau. La sauvegarde sera refusée.`
                : `⚠ This room is already used by class ${busyRoom.className || "?"} at this period. Saving will be rejected.`}
            </span>
          </div>
        )}

        <Select
          label={isFr ? "Salle (optionnel)" : "Room (optional)"}
          placeholder={isFr ? "Aucune salle" : "No room"}
          value={roomId || ""}
          options={roomOptions}
          onChange={(e) => setRoomId(e.target.value)}
        />

        {error && (
          <p className="text-[12px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
