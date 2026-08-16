import { useMemo, useState } from "react";
import { FiPlus, FiClock, FiCoffee, FiAlertTriangle } from "react-icons/fi";
import { getSubjectColor } from "../utils/subjectColors";

const DAYS = [
  { id: 1, fr: "Lundi", en: "Monday", shortFr: "Lun", shortEn: "Mon" },
  { id: 2, fr: "Mardi", en: "Tuesday", shortFr: "Mar", shortEn: "Tue" },
  { id: 3, fr: "Mercredi", en: "Wednesday", shortFr: "Mer", shortEn: "Wed" },
  { id: 4, fr: "Jeudi", en: "Thursday", shortFr: "Jeu", shortEn: "Thu" },
  { id: 5, fr: "Vendredi", en: "Friday", shortFr: "Ven", shortEn: "Fri" },
  { id: 6, fr: "Samedi", en: "Saturday", shortFr: "Sam", shortEn: "Sat" },
];

const fmtTime = (t) => (t ? String(t).slice(0, 5) : "");
const periodKey = (p) => `${p.startTime}-${p.endTime}`;

/**
 * Table hebdomadaire de l'emploi du temps.
 * Lignes = créneaux (triés par heure), colonnes = jours (Lun → Sam).
 * Le clic sur une cellule vide ouvre l'ajout ; le clic sur un cours ouvre l'édition.
 *
 * @param {{
 *   periods: Array,
 *   entries: Array,
 *   editable?: boolean,
 *   lang?: 'fr'|'en',
 *   conflictPeriodIds?: Set<string>,
 *   showClassName?: boolean, // affiche la classe au lieu du nom de l'enseignant
 *   onCellClick?: (period) => void,
 *   onLessonClick?: (entry) => void,
 *   onDropSubject?: (period, subjectId) => void,
 * }} props
 */
export default function TimetableGrid({
  periods,
  entries,
  editable = true,
  lang = "fr",
  conflictPeriodIds = new Set(),
  showClassName = false,
  onCellClick,
  onLessonClick,
  onDropSubject,
}) {
  const [dragOver, setDragOver] = useState(null);
  const isFr = lang === "fr";

  // Une entrée max par créneau (contraintes backend)
  const byPeriod = useMemo(() => {
    const m = {};
    entries.forEach((e) => {
      m[e.periodId] = e;
    });
    return m;
  }, [entries]);

  // Lignes : union des créneaux uniques (par horaires), triés par heure de début
  const rows = useMemo(() => {
    const unique = new Map();
    periods.forEach((p) => unique.set(periodKey(p), p));
    return [...unique.values()].sort((a, b) => {
      const t = String(a.startTime || "").localeCompare(String(b.startTime || ""));
      return t !== 0 ? t : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [periods]);

  // Par jour : clé créneau -> période de ce jour
  const byDayKey = useMemo(() => {
    const m = {};
    DAYS.forEach((d) => (m[d.id] = {}));
    periods.forEach((p) => {
      (m[p.day] = m[p.day] || {})[periodKey(p)] = p;
    });
    return m;
  }, [periods]);

  return (
    <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin">
      <table className="w-full border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
            {/* Colonne créneau */}
            <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400 w-[130px]">
              {isFr ? "Créneau" : "Period"}
            </th>
            {DAYS.map((day) => (
              <th
                key={day.id}
                className="px-3 py-3 text-center text-[11px] font-bold tracking-wider uppercase text-surface-400"
              >
                {isFr ? day.shortFr : day.shortEn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            return (
              <tr
                key={periodKey(row)}
                className="group border-t border-surface-50 dark:border-surface-700/50 hover:bg-surface-50/40 dark:hover:bg-surface-700/10 transition-all duration-150 animate-fadeInUp"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* Libellé du créneau */}
                <td className="px-4 py-2.5 align-top">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                    <span className="text-[12.5px] font-bold text-surface-700 dark:text-surface-200">
                      {row.name || "—"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-surface-400 ml-3">
                    <FiClock className="w-2.5 h-2.5" />
                    {fmtTime(row.startTime)}–{fmtTime(row.endTime)}
                  </span>
                </td>

                {/* Cellules par jour */}
                {DAYS.map((day) => {
                  const period = byDayKey[day.id]?.[periodKey(row)];
                  if (!period) {
                    // Jour sans ce créneau
                    return (
                      <td key={day.id} className="px-2 py-2 align-top">
                        <div className="h-[52px] rounded-lg border border-dashed border-surface-100 dark:border-surface-800 flex items-center justify-center text-[10px] text-surface-200 dark:text-surface-700">
                          —
                        </div>
                      </td>
                    );
                  }

                  if (period.isBreak) {
                    return (
                      <td key={day.id} className="px-2 py-2 align-top">
                        <div
                          className="h-[52px] rounded-lg flex items-center justify-center gap-1.5 border border-surface-100 dark:border-surface-800 text-surface-400 dark:text-surface-500 select-none"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(-45deg, rgba(120,130,125,.06) 0 6px, transparent 6px 12px)",
                          }}
                        >
                          <FiCoffee className="w-3 h-3" />
                          <span className="text-[10.5px] font-semibold">
                            {period.name || (isFr ? "Pause" : "Break")}
                          </span>
                        </div>
                      </td>
                    );
                  }

                  const entry = byPeriod[period.id];
                  const conflicted = conflictPeriodIds.has(period.id);

                  if (entry) {
                    const color = getSubjectColor(entry.subjectId, entry.subjectName);
                    return (
                      <td key={day.id} className="px-2 py-2 align-top">
                        <button
                          onClick={() => onLessonClick?.(entry)}
                          disabled={!editable}
                          className={`w-full text-left rounded-lg border-l-[3px] px-2.5 py-2 transition-all duration-200 ${
                            editable
                              ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                              : "cursor-default"
                          } ${
                            conflicted
                              ? "ring-2 ring-red-400/70 bg-red-50/70 dark:bg-red-900/10"
                              : ""
                          }`}
                          style={{ backgroundColor: color.bg, borderColor: conflicted ? "#f87171" : color.solid }}
                        >
                          {conflicted && (
                            <span className="flex items-center gap-1 text-[9.5px] font-bold text-red-500 dark:text-red-400 mb-0.5">
                              <FiAlertTriangle className="w-2.5 h-2.5" />
                              {isFr ? "Conflit" : "Conflict"}
                            </span>
                          )}
                          <div className="text-[12.5px] font-bold leading-tight truncate" style={{ color: color.text }}>
                            {entry.subjectName}
                          </div>
                          {(showClassName ? entry.className : entry.teacherName) && (
                            <div className="text-[10.5px] text-surface-500 dark:text-surface-400 truncate mt-0.5 leading-tight">
                              {showClassName ? entry.className : entry.teacherName}
                            </div>
                          )}
                          {entry.roomName && (
                            <div className="flex items-center gap-1 text-[10px] text-surface-400 truncate mt-0.5 leading-tight">
                              <FiClock className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="ml-auto flex-shrink-0">{entry.roomName}</span>
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  }

                  // Cellule vide → bouton ajouter / zone de dépôt
                  const isOver = dragOver === period.id;
                  return (
                    <td key={day.id} className="px-2 py-2 align-top">
                      <button
                        onClick={() => onCellClick?.(period)}
                        disabled={!editable}
                        onDragOver={(e) => {
                          if (!onDropSubject) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                          setDragOver(period.id);
                        }}
                        onDragLeave={() => setDragOver((v) => (v === period.id ? null : v))}
                        onDrop={(e) => {
                          if (!onDropSubject) return;
                          e.preventDefault();
                          setDragOver(null);
                          const subjectId = e.dataTransfer.getData("text/plain");
                          if (subjectId) onDropSubject(period, subjectId);
                        }}
                        className={`w-full h-[52px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                          isOver
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                            : editable
                              ? "border-surface-200 dark:border-surface-700 text-surface-300 dark:text-surface-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                              : "border-surface-100 dark:border-surface-800 text-surface-200 dark:text-surface-700 cursor-default"
                        }`}
                      >
                        <FiPlus className={`w-3.5 h-3.5 ${editable ? "" : "hidden"}`} />
                        {editable && (
                          <span className="text-[9.5px] font-medium opacity-60">
                            {isOver ? (isFr ? "Déposer" : "Drop") : isFr ? "Ajouter" : "Add"}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
