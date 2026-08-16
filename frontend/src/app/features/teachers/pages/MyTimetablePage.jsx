/**
 * MyTimetablePage — « Mon emploi du temps » (enseignant).
 *
 * Affiche la grille hebdomadaire de l'enseignant connecté, telle que publiée
 * par l'administration : classes, matières, créneaux, salles. Lecture seule.
 *
 * Données : GET /api/timetable/grid?teacherId=...&academicYearId=...
 * Route : /dashboard/my-timetable
 */
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FiCalendar,
  FiClock,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiAlertCircle,
} from "react-icons/fi";
import { YearContext } from "../../../core/context/YearContext";
import { useAuth } from "../../../core/hooks/useAuth";
import { getGrid } from "../../../core/api/timetableService";
import TimetableGrid from "../../timetable/components/TimetableGrid";

export default function MyTimetablePage() {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const { user } = useAuth();
  const { selectedYearId: academicYearId } = useContext(YearContext);

  // L'enseignant connecté (user.id == teacher_id dans les cours)
  const teacherId = user?.id;

  const gridQuery = useQuery({
    queryKey: ["timetable", "myGrid", teacherId || "none", academicYearId || "all"],
    queryFn: () => getGrid({ ...(academicYearId ? { academicYearId } : {}), teacherId }),
    enabled: !!teacherId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const gridData = gridQuery.data;
  const periods = useMemo(() => gridData?.periods || [], [gridData]);
  const entries = useMemo(() => gridData?.entries || [], [gridData]);

  // ── Filtre par classe ──
  // « all » = grille globale (toutes les classes de l'enseignant) ; sinon on
  // n'affiche que les cours de la classe sélectionnée.
  const [classFilter, setClassFilter] = useState("all");

  const classOptions = useMemo(() => {
    const m = new Map();
    entries.forEach((e) => {
      if (e.classId && e.className) m.set(e.classId, e.className);
    });
    return [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const filteredEntries = useMemo(
    () => (classFilter === "all" ? entries : entries.filter((e) => e.classId === classFilter)),
    [entries, classFilter]
  );

  // Statistiques hebdomadaires (sur la sélection affichée)
  const stats = useMemo(() => {
    const subjects = new Set(filteredEntries.map((e) => e.subjectId));
    const classes = new Set(filteredEntries.map((e) => e.classId));
    const days = new Set(filteredEntries.map((e) => e.day));
    return {
      lessons: filteredEntries.length,
      subjects: subjects.size,
      classes: classes.size,
      days: days.size,
    };
  }, [filteredEntries]);

  const loading = gridQuery.isPending && !!teacherId;
  const hasPeriods = periods.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-fadeIn">
      {/* ── En-tête ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full bg-primary-600 animate-scaleIn" />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Mon emploi du temps" : "My Timetable"}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr
              ? "Votre grille hebdomadaire publiée par l'administration — classes, matières et horaires"
              : "Your weekly grid as published by the administration — classes, subjects and times"}
          </p>
        </div>
      </div>

      {/* ── Statistiques ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: FiClock, label: isFr ? "cours / semaine" : "lessons / week", value: stats.lessons },
          { icon: FiBookOpen, label: isFr ? "matières" : "subjects", value: stats.subjects },
          { icon: FiUsers, label: isFr ? "classes" : "classes", value: stats.classes },
          { icon: FiCalendar, label: isFr ? "jours" : "days", value: stats.days },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
              <s.icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[18px] font-bold text-surface-900 dark:text-surface-100 leading-none">
                {s.value}
              </div>
              <div className="text-[10.5px] uppercase tracking-wide text-surface-400 font-semibold mt-1 truncate">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grille hebdomadaire (lecture seule) ── */}
      <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-surface-100 dark:border-surface-700 flex flex-wrap items-center gap-3">
          <div className="mr-auto min-w-0">
            <h2 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">
              {isFr ? "Grille hebdomadaire" : "Weekly grid"}
            </h2>
            <p className="text-[11.5px] text-surface-400">
              {classFilter !== "all"
                ? isFr
                  ? `Cours de la classe ${classOptions.find((c) => c.id === classFilter)?.name || ""} — lecture seule`
                  : `Lessons for ${classOptions.find((c) => c.id === classFilter)?.name || ""} — read-only`
                : isFr
                  ? "Lecture seule — les modifications sont faites par l'administration"
                  : "Read-only — changes are made by the administration"}
            </p>
          </div>

          {/* Filtre par classe */}
          {classOptions.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setClassFilter("all")}
                className={`h-8 px-3 rounded-lg text-[12px] font-semibold border transition-all whitespace-nowrap ${
                  classFilter === "all"
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                    : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:text-primary-600"
                }`}
              >
                {isFr ? "Toutes" : "All"}
              </button>
              {classOptions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClassFilter(c.id)}
                  className={`h-8 px-3 rounded-lg text-[12px] font-semibold border transition-all whitespace-nowrap ${
                    classFilter === c.id
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                      : "bg-white dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:text-primary-600"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
              <p className="text-sm text-surface-400 animate-pulse">
                {isFr ? "Chargement de votre emploi du temps…" : "Loading your timetable…"}
              </p>
            </div>
          ) : !hasPeriods ? (
            <div className="text-center py-14 animate-fadeIn">
              <div className="w-[64px] h-[64px] rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-7 h-7 text-surface-400" />
              </div>
              <p className="text-sm font-semibold text-surface-500">
                {isFr ? "Aucun créneau défini pour cette année" : "No periods defined for this year"}
              </p>
              <p className="text-xs text-surface-400 mt-1.5 max-w-sm mx-auto">
                {isFr
                  ? "L'administration n'a pas encore configuré les créneaux de la semaine"
                  : "The administration has not set up the weekly periods yet"}
              </p>
            </div>
          ) : (
            <>
              {stats.lessons === 0 && (
                <div className="mb-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/15 p-3.5 flex items-center gap-2 text-[12.5px] text-amber-700 dark:text-amber-300">
                  <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                  {isFr
                    ? "Aucun cours publié pour le moment — votre emploi du temps apparaîtra ici dès que l'administration l'aura publié."
                    : "No lessons published yet — your timetable will appear here once the administration publishes it."}
                </div>
              )}
              <TimetableGrid
                periods={periods}
                entries={filteredEntries}
                editable={false}
                lang={isFr ? "fr" : "en"}
                showClassName={classFilter === "all"}
              />
              <div className="mt-3 flex items-center gap-2 text-[11px] text-surface-400">
                <FiLayers className="w-3.5 h-3.5 flex-shrink-0" />
                {isFr
                  ? "Lecture seule — toute modification est faite par l'administration."
                  : "Read-only — any change is made by the administration."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
