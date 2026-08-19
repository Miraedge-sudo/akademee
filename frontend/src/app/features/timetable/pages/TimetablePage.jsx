import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { YearContext } from "../../../core/context/YearContext";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiRefreshCw,
  FiSave,
  FiAlertTriangle,
  FiSettings,
  FiUsers,
  FiSearch,
  FiBookOpen,
  FiLayers,
  FiTrash2,
  FiCheckCircle,
  FiZap,
} from "react-icons/fi";
import { getClasses } from "../../../core/api/classService";
import { getSubjects, getClassSubjects } from "../../../core/api/subjectService";
import { getUsers } from "../../../core/api/userManagementService";
import { getGrid, getRooms, getEntries, getPeriods, createPeriods, replaceClassEntries } from "../../../core/api/timetableService";
import { getErrorMessage } from "../../../core/utils/errorHandler";
import Button from "../../../components/ui/Button";
import TimetableGrid from "../components/TimetableGrid";
import LessonModal from "../components/LessonModal";
import PeriodSetupModal from "../components/PeriodSetupModal";
import RoomsModal from "../components/RoomsModal";
import { getSubjectColor } from "../utils/subjectColors";

const VIEWS = [
  { key: "class", labelFr: "Classe", labelEn: "Class", icon: FiUsers },
  { key: "teacher", labelFr: "Enseignant", labelEn: "Teacher", icon: FiClock },
  { key: "room", labelFr: "Salle", labelEn: "Room", icon: FiMapPin },
];

// ── Métadonnées rarement modifiées → cache long (évite le spinner au retour) ──
const META_OPTIONS = { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 };

const nameOf = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || u?.email || "—";
const idOf = (c) => c?.class_id || c?.id;
const tidOf = (t) => t?.user_id || t?.id;
const sidOf = (s) => s?.subject_id || s?.id;

/** Regroupe les classes par cycle (1er / 2nd) à partir du nom ou du niveau. */
function groupByCycle(classes) {
  const first = [];
  const second = [];
  const other = [];
  classes.forEach((c) => {
    const name = String(c.name || "");
    const level = String(c.level_name || "");
    const joined = `${name} ${level}`.toLowerCase();
    if (/^(6|5|4|3)\u00e8me|form [1-5]|first cycle|premier cycle|1er cycle|college|coll\u00e8ge|form\s*[1-5]\b/.test(joined)) first.push(c);
    else if (/2nde|seconde|premiere|1\u00e8re|terminale|lower sixth|upper sixth|form [6-7]|second cycle|2nd cycle|lycee|lyc\u00e9e/.test(joined)) second.push(c);
    else other.push(c);
  });
  const groups = [];
  if (first.length) groups.push({ key: "first", labelFr: "1er cycle", labelEn: "First cycle", classes: first });
  if (second.length) groups.push({ key: "second", labelFr: "2nd cycle", labelEn: "Second cycle", classes: second });
  if (other.length) groups.push({ key: "other", labelFr: "Autres", labelEn: "Others", classes: other });
  return groups;
}

const DAY_NAMES = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

export default function TimetablePage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const queryClient = useQueryClient();

  const [view, setView] = useState("class");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  // Recherches (rails)
  const [classQuery, setClassQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [teacherQuery, setTeacherQuery] = useState("");

  // Édition locale (classe) : brouillon + enregistrement
  const [draft, setDraft] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  // Modales
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [roomsModalOpen, setRoomsModalOpen] = useState(false);
  const [lessonModal, setLessonModal] = useState({ open: false, mode: "add", period: null, entry: null });

  // Glisser-déposer : matière traînée depuis le rail droit
  const [draggedSubjectId, setDraggedSubjectId] = useState(null);

  // Année académique sélectionnée (YearContext)
  const { selectedYearId: academicYearId } = useContext(YearContext);

  // ── Queries (métadonnées mises en cache) ──
  const classesQuery = useQuery({
    queryKey: ["timetable", "classes", academicYearId || "all"],
    queryFn: () => getClasses(academicYearId ? { academicYearId } : {}),
    ...META_OPTIONS,
  });
  const subjectsQuery = useQuery({
    queryKey: ["timetable", "subjects"],
    queryFn: () => getSubjects(),
    ...META_OPTIONS,
  });
  const teachersQuery = useQuery({
    queryKey: ["timetable", "teachers"],
    queryFn: () => getUsers({ role: "teacher", limit: 500 }),
    ...META_OPTIONS,
  });
  const roomsQuery = useQuery({
    queryKey: ["timetable", "rooms"],
    queryFn: () => getRooms(),
    ...META_OPTIONS,
  });

  // Créneaux de l'année (pour le compteur rempli/total du rail classes)
  const yearPeriodsQuery = useQuery({
    queryKey: ["timetable", "yearPeriods", academicYearId || "all"],
    queryFn: () => getPeriods(academicYearId ? { academicYearId } : {}),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Matières assignées à la classe sélectionnée (rail droit — coefficients)
  const classSubjectsQuery = useQuery({
    queryKey: ["timetable", "classSubjects", selectedClassId || "none"],
    queryFn: () => getClassSubjects(selectedClassId),
    enabled: !!selectedClassId && view === "class",
    ...META_OPTIONS,
  });

  // Tous les cours de l'année (pour la charge des enseignants + matière du rail)
  const allEntriesQuery = useQuery({
    queryKey: ["timetable", "allEntries", academicYearId || "all"],
    queryFn: () => getEntries({ ...(academicYearId ? { academicYearId } : {}) }),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const classes = useMemo(() => {
    const list = Array.isArray(classesQuery.data) ? classesQuery.data : classesQuery.data?.classes || [];
    return list;
  }, [classesQuery.data]);
  const subjects = Array.isArray(subjectsQuery.data) ? subjectsQuery.data : subjectsQuery.data?.subjects || [];
  const teachers = useMemo(() => {
    const list = Array.isArray(teachersQuery.data) ? teachersQuery.data : teachersQuery.data?.users || [];
    return list;
  }, [teachersQuery.data]);
  const rooms = Array.isArray(roomsQuery.data) ? roomsQuery.data : [];

  const allEntries = useMemo(() => {
    const d = allEntriesQuery.data;
    return Array.isArray(d) ? d : d?.entries || [];
  }, [allEntriesQuery.data]);

  const entityId = view === "class" ? selectedClassId : view === "teacher" ? selectedTeacherId : selectedRoomId;
  const gridQuery = useQuery({
    queryKey: ["timetable", "grid", academicYearId || "all", view, entityId || "none"],
    queryFn: () =>
      getGrid({
        ...(academicYearId ? { academicYearId } : {}),
        ...(view === "class" && selectedClassId ? { classId: selectedClassId } : {}),
        ...(view === "teacher" && selectedTeacherId ? { teacherId: selectedTeacherId } : {}),
        ...(view === "room" && selectedRoomId ? { roomId: selectedRoomId } : {}),
      }),
    enabled: !!entityId,
    // La grille ne change qu'à l'édition → on évite de re-fetch à chaque retour
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ── Sélection automatique : première classe disponible ──
  useEffect(() => {
    if (!entityId && classes.length > 0 && view === "class") {
      setSelectedClassId(idOf(classes[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, view]);

  // Références stables : évite la boucle setState (Maximum update depth exceeded)
  // quand gridQuery.data est undefined (nouveau []/{} à chaque render sinon)
  const gridData = gridQuery.data;
  const periods = useMemo(() => gridData?.periods || [], [gridData]);
  const serverEntries = useMemo(() => gridData?.entries || [], [gridData]);

  // Synchronise le brouillon quand la grille serveur change (si rien d'édité)
  useEffect(() => {
    if (!dirty) setDraft(serverEntries);
  }, [serverEntries, dirty]);

  // Reset de l'état d'édition quand on change de vue / classe.
  // NB: on ne vide PAS le brouillon ici — l'effet de synchronisation
  // ci-dessus le ré-aligne sur la grille serveur de la nouvelle entité
  // (setDraft([]) ici écraserait des données déjà fraîches servies par
  // le cache React Query et laisserait la grille vide sans refresh).
  useEffect(() => {
    setDirty(false);
    setConflicts([]);
  }, [view, selectedClassId, selectedTeacherId, selectedRoomId]);

  const conflictPeriodIds = useMemo(() => new Set(conflicts.map((c) => c.periodId)), [conflicts]);

  // La page est immédiatement utilisable : seul le tableau attend ses données
  const gridLoading = gridQuery.isPending && !!entityId;

  const hasPeriods = periods.length > 0;

  // ── Rails : classes par cycle ──
  const classGroups = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    const filtered = classes.filter((c) => !q || String(c.name || "").toLowerCase().includes(q));
    return groupByCycle(filtered);
  }, [classes, classQuery]);

  // Créneaux de la semaine (pour le compteur rempli/total du rail)
  const yearPeriods = useMemo(() => {
    const d = yearPeriodsQuery.data;
    return Array.isArray(d) ? d : d?.periods || [];
  }, [yearPeriodsQuery.data]);

  // Nombre de créneaux par classe dans la grille
  const filledByClass = useMemo(() => {
    const m = {};
    allEntries.forEach((e) => {
      if (e.classId) m[e.classId] = (m[e.classId] || 0) + 1;
    });
    return m;
  }, [allEntries]);

  const weeklyTotal = yearPeriods.length > 0 ? yearPeriods.filter((p) => !p.isBreak).length : periods.filter((p) => !p.isBreak).length;
  const filledCount = serverEntries.length;
  const totalSlots = periods.filter((p) => !p.isBreak).length;

  // Conflits d'enseignants dans la grille affichée (deux cours même créneau)
  const conflictCount = useMemo(() => {
    const seen = new Set();
    let n = 0;
    serverEntries.forEach((e) => {
      const key = `${e.teacherId}:${e.periodId}`;
      if (seen.has(key)) n++;
      seen.add(key);
    });
    return n;
  }, [serverEntries]);

  // Matières présentes dans la grille affichée (vue enseignant / salle)
  const gridSubjectIds = useMemo(() => new Set(serverEntries.map((e) => e.subjectId)), [serverEntries]);

  // Vue classe → matières assignées à la classe (avec coefficients) ;
  // autres vues → matières présentes dans la grille affichée
  const classSubjectList = useMemo(() => {
    const d = classSubjectsQuery.data;
    return Array.isArray(d) ? d : d?.subjects || [];
  }, [classSubjectsQuery.data]);

  const railSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (view === "class") {
      return classSubjectList
        .filter((s) => !q || String(s.subjectName || s.name || "").toLowerCase().includes(q))
        .sort((a, b) => (a.coefficient || 0) - (b.coefficient || 0));
    }
    return subjects
      .filter((s) => gridSubjectIds.has(sidOf(s)))
      .filter((s) => !q || String(s.name || "").toLowerCase().includes(q));
  }, [view, classSubjectList, subjects, gridSubjectIds, subjectQuery]);

  // Charge des enseignants (nb de cours sur l'année)
  const teacherLoad = useMemo(() => {
    const m = {};
    allEntries.forEach((e) => {
      if (e.teacherId) m[e.teacherId] = (m[e.teacherId] || 0) + 1;
    });
    return m;
  }, [allEntries]);

  // Matière principale d'un enseignant (via les cours qu'il donne)
  const teacherSubjectMap = useMemo(() => {
    const m = {};
    allEntries.forEach((e) => {
      if (e.teacherId && e.subjectName && !m[e.teacherId]) m[e.teacherId] = e.subjectName;
    });
    return m;
  }, [allEntries]);

  const railTeachers = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    return teachers
      .filter((t) => !q || nameOf(t).toLowerCase().includes(q))
      .map((t) => ({
        ...t,
        load: teacherLoad[tidOf(t)] || 0,
        subjectName: teacherSubjectMap[tidOf(t)] || null,
      }))
      .sort((a, b) => b.load - a.load);
  }, [teachers, teacherQuery, teacherLoad, teacherSubjectMap]);

  // ── Actions ──
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["timetable"] });

  const openAddLesson = (period, subjectId) =>
    setLessonModal({ open: true, mode: "add", period, entry: subjectId ? { subjectId } : null });
  const openEditLesson = (entry) => setLessonModal({ open: true, mode: "edit", period: null, entry });

  const enrichEntry = (data) => {
    const period = periods.find((p) => p.id === data.periodId) || {};
    const subject = subjects.find((s) => sidOf(s) === data.subjectId);
    const teacher = teachers.find((t) => tidOf(t) === data.teacherId);
    const room = rooms.find((r) => r.id === data.roomId);
    return {
      ...data,
      subjectName: subject?.name || "—",
      teacherName: nameOf(teacher),
      roomName: room?.name || null,
      day: period.day,
      startTime: period.startTime,
      endTime: period.endTime,
    };
  };

  const handleLessonSave = ({ subjectId, teacherId, roomId }) => {
    const period = lessonModal.period;
    if (lessonModal.mode === "add" && period) {
      const entry = enrichEntry({
        id: `local-${Date.now()}`,
        subjectId,
        teacherId,
        roomId: roomId || null,
        periodId: period.id,
      });
      setDraft((prev) => [...prev, entry]);
      toast.success(isFr ? "Cours ajouté — pensez à enregistrer" : "Lesson added — remember to save");
    } else if (lessonModal.mode === "edit" && lessonModal.entry) {
      const id = lessonModal.entry.id;
      setDraft((prev) => prev.map((e) => (e.id === id ? enrichEntry({ ...e, subjectId, teacherId, roomId: roomId || null }) : e)));
      toast.success(isFr ? "Cours modifié — pensez à enregistrer" : "Lesson updated — remember to save");
    }
    setDirty(true);
    setConflicts([]);
    setLessonModal({ open: false, mode: "add", period: null, entry: null });
  };

  const handleLessonDelete = () => {
    if (lessonModal.mode !== "edit" || !lessonModal.entry) return;
    const id = lessonModal.entry.id;
    setDraft((prev) => prev.filter((e) => e.id !== id));
    setDirty(true);
    setConflicts([]);
    toast.success(isFr ? "Cours supprimé — pensez à enregistrer" : "Lesson deleted — remember to save");
    setLessonModal({ open: false, mode: "add", period: null, entry: null });
  };

  // Crée les créneaux par défaut en un clic (preset francophone / anglophone)
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const handleCreateDefaultPeriods = async () => {
    if (!academicYearId) {
      toast.error(isFr ? "Sélectionnez une année scolaire d'abord" : "Select an academic year first");
      return;
    }
    setCreatingDefaults(true);
    try {
      const isTerm = !isFr;
      const periods = (isTerm
        ? [
            { name: "Period 1", startTime: "07:30", endTime: "08:25", isBreak: false },
            { name: "Period 2", startTime: "08:25", endTime: "09:20", isBreak: false },
            { name: "Period 3", startTime: "09:20", endTime: "10:15", isBreak: false },
            { name: "Break", startTime: "10:15", endTime: "10:35", isBreak: true },
            { name: "Period 4", startTime: "10:35", endTime: "11:30", isBreak: false },
            { name: "Period 5", startTime: "11:30", endTime: "12:25", isBreak: false },
            { name: "Period 6", startTime: "12:25", endTime: "13:20", isBreak: false },
            { name: "Period 7", startTime: "13:50", endTime: "14:45", isBreak: false },
          ]
        : [
            { name: "Période 1", startTime: "07:30", endTime: "08:25", isBreak: false },
            { name: "Période 2", startTime: "08:25", endTime: "09:20", isBreak: false },
            { name: "Période 3", startTime: "09:20", endTime: "10:15", isBreak: false },
            { name: "Récréation", startTime: "10:15", endTime: "10:35", isBreak: true },
            { name: "Période 4", startTime: "10:35", endTime: "11:30", isBreak: false },
            { name: "Période 5", startTime: "11:30", endTime: "12:25", isBreak: false },
            { name: "Période 6", startTime: "12:25", endTime: "13:20", isBreak: false },
          ]
      ).flatMap((s, idx) =>
        (isTerm ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]).map((day) => ({ ...s, day, sortOrder: idx + 1 }))
      );
      await createPeriods({ academicYearId, periods });
      refresh();
      toast.success(
        isFr ? `${periods.length} créneaux créés par défaut ✅` : `${periods.length} default periods created ✅`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, isFr ? "Impossible de créer les créneaux" : "Could not create periods"));
    } finally {
      setCreatingDefaults(false);
    }
  };

  const handleSave = async ({ publish = false } = {}) => {
    if (!selectedClassId) return;
    setSaving(true);
    setConflicts([]);
    try {
      const entries = draft.map((e) => ({
        subjectId: e.subjectId,
        teacherId: e.teacherId,
        roomId: e.roomId || null,
        periodId: e.periodId,
      }));
      // notify: true uniquement pour « Publier » → le backend prévient les
      // enseignants de la classe que leur emploi du temps est à jour.
      const result = await replaceClassEntries(selectedClassId, { academicYearId, entries, notify: !!publish });
      setDraft(result.entries || []);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      toast.success(publish ? (isFr ? "Emploi du temps publié ✅" : "Timetable published ✅") : (isFr ? "Emploi du temps enregistré ✅" : "Timetable saved ✅"));
      if (publish) setPublishing(false);
    } catch (err) {
      const details = err.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        setConflicts(details);
        toast.error(isFr ? `${details.length} conflit(s) détecté(s)` : `${details.length} conflict(s) detected`);
      } else {
        toast.error(getErrorMessage(err, isFr ? "Impossible d'enregistrer" : "Could not save"));
      }
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleClearGrid = () => {
    if (view !== "class") return;
    setDraft([]);
    setDirty(true);
    setConflicts([]);
    toast.success(isFr ? "Grille vidée — pensez à enregistrer" : "Grid cleared — remember to save");
  };

  const handlePublish = () => {
    if (conflictCount > 0) {
      toast.error(isFr ? `${conflictCount} conflit(s) à résoudre avant publication` : `${conflictCount} conflict(s) to resolve before publishing`);
      return;
    }
    setPublishing(true);
    handleSave({ publish: true });
  };

  const selectedClassName = classes.find((c) => idOf(c) === selectedClassId)?.name;
  const selectedTeacherName = nameOf(teachers.find((t) => tidOf(t) === selectedTeacherId));
  const selectedRoomName = rooms.find((r) => r.id === selectedRoomId)?.name;

  const activeLabel =
    view === "class"
      ? selectedClassName
      : view === "teacher"
        ? selectedTeacherName
        : selectedRoomName;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-fadeIn">
      {/* ── En-tête ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600 animate-scaleIn" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Emploi du temps" : "Timetable"}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr
              ? "Constituez la grille hebdomadaire de chaque classe — les vues enseignant et salle se mettent à jour automatiquement"
              : "Build each class weekly grid — teacher & room views update automatically"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={refresh} title={isFr ? "Actualiser" : "Refresh"} className="whitespace-nowrap">
            <FiRefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setRoomsModalOpen(true)} className="whitespace-nowrap">
            <FiMapPin className="w-3.5 h-3.5" /> {isFr ? "Salles" : "Rooms"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPeriodModalOpen(true)} className="whitespace-nowrap">
            <FiSettings className="w-3.5 h-3.5" /> {isFr ? "Créneaux" : "Periods"}
          </Button>
        </div>
      </div>

      {/* ── Layout 3 colonnes (inspiré du design) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-4 items-stretch">
        {/* ═══ Rail gauche : classes ═══ */}
        <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl p-3 lg:max-h-[calc(100vh-240px)] lg:sticky lg:top-24 overflow-hidden flex flex-col">
          <div className="px-1 pb-2">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-surface-400 mb-2 px-2">
              {isFr ? "Classes" : "Classes"}
            </h3>
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                value={classQuery}
                onChange={(e) => setClassQuery(e.target.value)}
                placeholder={isFr ? "Rechercher…" : "Search…"}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-[12.5px] outline-none focus:border-primary-500 text-surface-800 dark:text-surface-100 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-4">
            {classesQuery.isPending && (
              <div className="space-y-2 px-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-9 rounded-lg bg-surface-100 dark:bg-surface-700/60 animate-pulse" />
                ))}
              </div>
            )}
            {!classesQuery.isPending && classGroups.length === 0 && (
              <p className="text-[12px] text-surface-400 text-center py-6">
                {isFr ? "Aucune classe" : "No classes"}
              </p>
            )}
            {classGroups.map((g) => (
              <div key={g.key}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary-600/80 dark:text-primary-400/80 px-2 mb-1">
                  {isFr ? g.labelFr : g.labelEn}
                </div>
                <div className="space-y-0.5">
                  {g.classes.map((c) => {
                    const active = idOf(c) === selectedClassId && view === "class";
                    return (
                      <button
                        key={idOf(c)}
                        onClick={() => {
                          setView("class");
                          setSelectedClassId(idOf(c));
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 text-left border ${
                          active
                            ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                            : "text-surface-600 dark:text-surface-300 border-transparent hover:bg-surface-100 dark:hover:bg-surface-800"
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className={`text-[10px] font-mono ${active ? "text-white/80" : "text-surface-400"}`}>
                          {filledByClass[idOf(c)] || 0}/{weeklyTotal}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Centre : grille ═══ */}
        <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl overflow-hidden flex flex-col min-w-0">
          {/* Vue + actions */}
          <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 border-b border-surface-100 dark:border-surface-700">
            {/* Sélecteur de vue — contrôle segmenté compact : reste groupé, ne s'étire pas */}
            <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-surface-100 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600 shrink-0">
              {VIEWS.map((v) => {
                const Icon = v.icon;
                const active = view === v.key;
                return (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-all duration-200 ${
                      active
                        ? "bg-primary-600 text-white shadow-sm shadow-primary-600/20"
                        : "text-surface-500 dark:text-surface-300 hover:text-primary-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {isFr ? v.labelFr : v.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {view === "class" && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleClearGrid} disabled={!dirty && filledCount === 0} title={isFr ? "Vider la grille" : "Clear grid"} className="whitespace-nowrap">
                    <FiTrash2 className="w-3.5 h-3.5" /> {isFr ? "Vider" : "Clear"}
                  </Button>
                  <Button size="sm" onClick={() => handleSave()} loading={saving} className="whitespace-nowrap">
                    <FiSave className="w-3.5 h-3.5" /> {isFr ? "Brouillon" : "Draft"}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handlePublish} loading={publishing} className="whitespace-nowrap">
                    <FiCheckCircle className="w-3.5 h-3.5" /> {isFr ? "Publier" : "Publish"}
                  </Button>
                </>
              )}
              {view !== "class" && (
                <span className="text-[11px] text-surface-400 whitespace-nowrap">{isFr ? "Lecture seule" : "Read-only"}</span>
              )}
            </div>
          </div>

          {/* Titre du centre */}
          <div className="px-4 pt-3 pb-1">
            <h2 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 truncate">
              {activeLabel || (isFr ? "Sélectionnez un élément" : "Select an item")}
            </h2>
            <p className="text-[11.5px] text-surface-400">
              {view === "class"
                ? isFr ? "Cliquez sur une case vide pour ajouter un cours" : "Click an empty slot to add a lesson"
                : view === "teacher"
                  ? isFr ? "Grille de l'enseignant sélectionné" : "Selected teacher's grid"
                  : isFr ? "Grille de la salle sélectionnée" : "Selected room's grid"}
            </p>
          </div>

          {/* Sélecteur d'entité */}
          <div className="px-4 py-2 max-w-sm">
            {view === "class" ? (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-[13px] text-surface-800 dark:text-surface-100 outline-none focus:border-primary-500 transition-colors"
              >
                {classes.map((c) => (
                  <option key={idOf(c)} value={idOf(c)}>{c.name}</option>
                ))}
              </select>
            ) : view === "teacher" ? (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-[13px] text-surface-800 dark:text-surface-100 outline-none focus:border-primary-500 transition-colors"
              >
                {teachers.map((t) => (
                  <option key={tidOf(t)} value={tidOf(t)}>{nameOf(t)}</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-[13px] text-surface-800 dark:text-surface-100 outline-none focus:border-primary-500 transition-colors"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Bandeau de conflits */}
          {conflicts.length > 0 && (
            <div className="animate-fadeInUp mx-4 mb-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/15 p-3.5">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-[12.5px] mb-1.5">
                <FiAlertTriangle className="w-4 h-4" />
                {isFr ? "Conflits détectés — corrigez puis réenregistrez" : "Conflicts detected — fix them then save again"}
              </div>
              <ul className="space-y-1">
                {conflicts.map((c, i) => (
                  <li key={i} className="text-[12px] text-red-700 dark:text-red-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    {c.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Indicateur de modifications */}
          {view === "class" && dirty && !conflicts.length && (
            <div className="mx-4 mb-2 flex items-center gap-2 text-[12px] font-semibold text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {isFr ? "Modifications non enregistrées" : "Unsaved changes"}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 p-4">
            {gridLoading ? (
              <div className="flex flex-col items-center py-14 gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
                <p className="text-sm text-surface-400 animate-pulse">
                  {isFr ? "Chargement de la grille…" : "Loading grid…"}
                </p>
              </div>
            ) : !entityId ? (
              <div className="text-center py-14 animate-fadeIn">
                <div className="w-[64px] h-[64px] rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="w-7 h-7 text-surface-400" />
                </div>
                <p className="text-sm font-semibold text-surface-500">
                  {isFr ? "Sélectionnez un élément" : "Select an item"}
                </p>
              </div>
            ) : !hasPeriods ? (
              <div className="text-center py-14 animate-fadeIn">
                <div className="w-[64px] h-[64px] rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                  <FiClock className="w-7 h-7 text-surface-400" />
                </div>
                <p className="text-sm font-semibold text-surface-500">
                  {isFr ? "Aucun créneau défini" : "No periods defined"}
                </p>
                <p className="text-xs text-surface-400 mt-1.5 max-w-sm mx-auto">
                  {isFr
                    ? "Définissez d'abord les créneaux de la semaine pour pouvoir construire l'emploi du temps"
                    : "First define the weekly periods to start building the timetable"}
                </p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    onClick={handleCreateDefaultPeriods}
                    disabled={creatingDefaults}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[12px] font-bold text-white shadow-sm shadow-primary-600/20 transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#085041" }}
                  >
                    <FiZap className="w-3.5 h-3.5" />
                    {creatingDefaults
                      ? isFr ? "Création…" : "Creating…"
                      : isFr ? "Créer les créneaux par défaut" : "Create default periods"}
                  </button>
                  <button
                    onClick={() => setPeriodModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 active:scale-95 transition-all duration-150"
                  >
                    <FiSettings className="w-3 h-3" strokeWidth={2.5} />
                    {isFr ? "Personnaliser les créneaux" : "Customize periods"}
                  </button>
                </div>
              </div>
            ) : (
              <TimetableGrid
                periods={periods}
                entries={view === "class" ? draft : serverEntries}
                editable={view === "class"}
                lang={isFr ? "fr" : "en"}
                conflictPeriodIds={conflictPeriodIds}
                showClassName={view === "teacher"}
                onCellClick={view === "class" ? openAddLesson : undefined}
                onLessonClick={view === "class" ? openEditLesson : undefined}
                onDropSubject={
                  view === "class"
                    ? (period, subjectId) => {
                        setDraggedSubjectId(null);
                        openAddLesson(period, subjectId);
                      }
                    : undefined
                }
              />
            )}
          </div>
        </div>

        {/* ═══ Rail droit : matières + enseignants ═══ */}
        <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl p-3 lg:max-h-[calc(100vh-240px)] lg:sticky lg:top-24 overflow-hidden flex flex-col space-y-5">
          {/* Matières */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-surface-400">
                {isFr ? "Matières — glisser-déposer" : "Subjects — drag & drop"}
              </h3>
              <span className="text-[10px] font-mono text-surface-400">{railSubjects.length}</span>
            </div>
            {view === "class" && hasPeriods && (
              <p className="text-[10.5px] text-surface-400 px-2 mb-2 leading-snug">
                {isFr
                  ? "Glissez une matière sur une case pour l'assigner."
                  : "Drag a subject onto a slot to assign it."}
              </p>
            )}
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
                placeholder={isFr ? "Rechercher…" : "Search…"}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-[12.5px] outline-none focus:border-primary-500 text-surface-800 dark:text-surface-100 transition-colors"
              />
            </div>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-0.5">
              {view === "class" && classSubjectsQuery.isPending ? (
                <div className="space-y-1.5 px-1 py-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-9 rounded-lg bg-surface-100 dark:bg-surface-700/60 animate-pulse" />
                  ))}
                </div>
              ) : view === "class" && !selectedClassId ? (
                <p className="text-[11.5px] text-surface-400 px-2 py-4 text-center leading-relaxed">
                  {isFr ? "Sélectionnez une classe pour voir ses matières" : "Select a class to see its subjects"}
                </p>
              ) : view !== "class" && (!entityId || !hasPeriods) ? (
                <p className="text-[11.5px] text-surface-400 px-2 py-4 text-center leading-relaxed">
                  {isFr ? "Sélectionnez un élément pour voir ses matières" : "Select an item to see its subjects"}
                </p>
              ) : railSubjects.length === 0 ? (
                <p className="text-[11.5px] text-surface-400 px-2 py-4 text-center">
                  {view === "class"
                    ? isFr ? "Aucune matière assignée à cette classe" : "No subjects assigned to this class"
                    : isFr ? "Aucune matière dans la grille" : "No subjects in the grid"}
                </p>
              ) : (
                railSubjects.map((s) => {
                  const subjId = s.subjectId || sidOf(s);
                  const subjName = s.subjectName || s.name;
                  const color = getSubjectColor(subjId, subjName);
                  const isClassView = view === "class";
                  return (
                    <div
                      key={subjId}
                      draggable={view === "class" && !!hasPeriods}
                      onDragStart={(e) => {
                        setDraggedSubjectId(subjId);
                        e.dataTransfer.effectAllowed = "copy";
                        e.dataTransfer.setData("text/plain", subjId);
                      }}
                      onDragEnd={() => setDraggedSubjectId(null)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800 transition-all ${
                        view === "class" && hasPeriods ? "cursor-grab active:cursor-grabbing hover:border-primary-300 hover:shadow-sm" : ""
                      } ${draggedSubjectId === subjId ? "opacity-40" : ""}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color.solid }} />
                      <span className="text-[12.5px] font-semibold text-surface-800 dark:text-surface-100 truncate flex-1">{subjName}</span>
                      {isClassView ? (
                        <span className="text-[9.5px] font-mono text-surface-400">
                          {isFr ? "Coef" : "Coef"} {s.coefficient ?? "—"}
                        </span>
                      ) : (
                        s.code && <span className="text-[9.5px] font-mono text-surface-400 uppercase">{s.code}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Enseignants + charge */}
          <div className="border-t border-surface-100 dark:border-surface-700 pt-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-surface-400">
                {isFr ? "Charge des enseignants" : "Teacher load"}
              </h3>
              <span className="text-[10px] font-mono text-surface-400">{railTeachers.length}</span>
            </div>
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                value={teacherQuery}
                onChange={(e) => setTeacherQuery(e.target.value)}
                placeholder={isFr ? "Rechercher…" : "Search…"}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-[12.5px] outline-none focus:border-primary-500 text-surface-800 dark:text-surface-100 transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-2">
              {allEntriesQuery.isPending && (
                <div className="space-y-2 px-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-11 rounded-lg bg-surface-100 dark:bg-surface-700/60 animate-pulse" />
                  ))}
                </div>
              )}
              {!allEntriesQuery.isPending && railTeachers.length === 0 && (
                <p className="text-[11.5px] text-surface-400 px-2 py-4 text-center">
                  {isFr ? "Aucun enseignant" : "No teachers"}
                </p>
              )}
              {railTeachers.map((t) => {
                const pct = Math.min(100, Math.round((t.load / 28) * 100));
                const barColor = pct >= 100 ? "#E2574C" : pct >= 80 ? "#D9A62E" : "#2F9E6E";
                return (
                  <button
                    key={tidOf(t)}
                    onClick={() => {
                      setView("teacher");
                      setSelectedTeacherId(tidOf(t));
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg border text-left transition-all ${
                      view === "teacher" && selectedTeacherId === tidOf(t)
                        ? "border-primary-500 bg-primary-50/60 dark:bg-primary-900/20"
                        : "border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-primary-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-surface-800 dark:text-surface-100 truncate">{nameOf(t)}</span>
                      <span className="text-[10px] font-mono text-surface-400 flex-shrink-0">{t.load}h</span>
                    </div>
                    {t.subjectName && (
                      <div className="text-[10.5px] text-surface-400 truncate mt-0.5">· {t.subjectName}</div>
                    )}
                    <div className="mt-1.5 h-1 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre de statut ── */}
      <div className="mt-4 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3 text-[12px] text-surface-500">
        <div className="flex items-center gap-5 flex-wrap">
          <span className="flex items-center gap-1.5">
            <FiLayers size={12} className="text-surface-400" />
            <b className="text-surface-800 dark:text-surface-100 font-mono">{filledCount}</b>
            {isFr ? "créneaux remplis" : "slots filled"}
          </span>
          <span className="flex items-center gap-1.5">
            <FiCalendar size={12} className="text-surface-400" />
            <b className="text-surface-800 dark:text-surface-100 font-mono">{totalSlots}</b>
            {isFr ? "créneaux au total" : "total slots"}
          </span>
          <span className={`flex items-center gap-1.5 ${conflictCount > 0 ? "text-red-500" : ""}`}>
            <FiAlertTriangle size={12} className={conflictCount > 0 ? "text-red-500" : "text-surface-400"} />
            <b className={`font-mono ${conflictCount > 0 ? "text-red-500" : "text-surface-800 dark:text-surface-100"}`}>{conflictCount}</b>
            {isFr ? "conflits d'enseignants" : "teacher conflicts"}
          </span>
          <span className="flex items-center gap-1.5">
            <FiBookOpen size={12} className="text-surface-400" />
            <b className="text-surface-800 dark:text-surface-100 font-mono">{railSubjects.length}</b>
            {isFr ? "matières" : "subjects"}
          </span>
          <span className="flex items-center gap-1.5">
            <FiUsers size={12} className="text-surface-400" />
            <b className="text-surface-800 dark:text-surface-100 font-mono">{railTeachers.length}</b>
            {isFr ? "enseignants" : "teachers"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
          <span>
            {view === "class" && dirty
              ? isFr ? "Brouillon non enregistré" : "Draft not saved"
              : isFr ? "Grille enregistrée" : "Grid saved"}
          </span>
        </div>
      </div>

      {/* ── Modales ── */}
      <LessonModal
        isOpen={lessonModal.open}
        onClose={() => setLessonModal({ open: false, mode: "add", period: null, entry: null })}
        mode={lessonModal.mode}
        period={lessonModal.period}
        entry={lessonModal.entry}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        entries={allEntries}
        currentClassId={selectedClassId}
        onSave={handleLessonSave}
        onDelete={handleLessonDelete}
      />

      <PeriodSetupModal
        isOpen={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
        academicYearId={academicYearId}
        periods={yearPeriods}
        onSaved={refresh}
      />

      <RoomsModal
        isOpen={roomsModalOpen}
        onClose={() => setRoomsModalOpen(false)}
        rooms={rooms}
        onChanged={refresh}
      />
    </div>
  );
}
