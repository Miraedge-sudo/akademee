import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiTrash2, FiInfo, FiCoffee, FiClock } from "react-icons/fi";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import {
  createPeriod,
  createPeriods,
  deletePeriod,
  updatePeriod,
} from "../../../core/api/timetableService";
import { getErrorMessage } from "../../../core/utils/errorHandler";

const DAYS = [
  { id: 1, fr: "Lun", en: "Mon", fullFr: "Lundi", fullEn: "Monday" },
  { id: 2, fr: "Mar", en: "Tue", fullFr: "Mardi", fullEn: "Tuesday" },
  { id: 3, fr: "Mer", en: "Wed", fullFr: "Mercredi", fullEn: "Wednesday" },
  { id: 4, fr: "Jeu", en: "Thu", fullFr: "Jeudi", fullEn: "Thursday" },
  { id: 5, fr: "Ven", en: "Fri", fullFr: "Vendredi", fullEn: "Friday" },
  { id: 6, fr: "Sam", en: "Sat", fullFr: "Samedi", fullEn: "Saturday" },
];

/**
 * Créneaux types (les mêmes pour chaque jour coché).
 * { key, name, startTime, endTime, isBreak }
 */
function defaultSlots(isTerm) {
  return isTerm
    ? [
        { key: "s1", name: "Period 1", startTime: "07:30", endTime: "08:25", isBreak: false },
        { key: "s2", name: "Period 2", startTime: "08:25", endTime: "09:20", isBreak: false },
        { key: "s3", name: "Period 3", startTime: "09:20", endTime: "10:15", isBreak: false },
        { key: "s4", name: "Break", startTime: "10:15", endTime: "10:35", isBreak: true },
        { key: "s5", name: "Period 4", startTime: "10:35", endTime: "11:30", isBreak: false },
        { key: "s6", name: "Period 5", startTime: "11:30", endTime: "12:25", isBreak: false },
        { key: "s7", name: "Period 6", startTime: "12:25", endTime: "13:20", isBreak: false },
        { key: "s8", name: "Period 7", startTime: "13:50", endTime: "14:45", isBreak: false },
      ]
    : [
        { key: "s1", name: "Période 1", startTime: "07:30", endTime: "08:25", isBreak: false },
        { key: "s2", name: "Période 2", startTime: "08:25", endTime: "09:20", isBreak: false },
        { key: "s3", name: "Période 3", startTime: "09:20", endTime: "10:15", isBreak: false },
        { key: "s4", name: "Récréation", startTime: "10:15", endTime: "10:35", isBreak: true },
        { key: "s5", name: "Période 4", startTime: "10:35", endTime: "11:30", isBreak: false },
        { key: "s6", name: "Période 5", startTime: "11:30", endTime: "12:25", isBreak: false },
        { key: "s7", name: "Période 6", startTime: "12:25", endTime: "13:20", isBreak: false },
      ];
}

const inputClass =
  "h-8 px-2 rounded-md border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-xs text-surface-800 dark:text-surface-100 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 transition-all w-full";

let localKey = 0;
const mkSlot = (s = {}) => ({
  key: `slot-${++localKey}`,
  name: s.name || "",
  startTime: String(s.startTime || "").slice(0, 5),
  endTime: String(s.endTime || "").slice(0, 5),
  isBreak: !!s.isBreak,
});

/**
 * Créneaux de la semaine — définis une fois (types) et appliqués aux jours cochés.
 * Édition libre : ajout / suppression / horaires / pause.
 */
export default function PeriodSetupModal({ isOpen, onClose, academicYearId, periods = [], onSaved }) {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const isTerm = false; // rempli après lecture des périodes existantes

  const [slots, setSlots] = useState([]);
  const [checkedDays, setCheckedDays] = useState([1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);

  // Périodes existantes → déduit les créneaux types + jours actifs
  useEffect(() => {
    if (!isOpen) return;
    const list = Array.isArray(periods) ? periods : periods?.periods || [];
    if (list.length === 0) {
      setSlots(defaultSlots(false).map(mkSlot));
      setCheckedDays([1, 2, 3, 4, 5, 6]);
      return;
    }
    const byTime = new Map();
    const days = new Set();
    list.forEach((p) => {
      days.add(p.day);
      const k = `${p.startTime}-${p.endTime}-${p.name}`;
      if (!byTime.has(k)) {
        byTime.set(k, mkSlot({ name: p.name, startTime: p.startTime, endTime: p.endTime, isBreak: p.isBreak }));
      }
    });
    setSlots([...byTime.values()].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setCheckedDays([1, 2, 3, 4, 5, 6].filter((d) => days.has(d)));
  }, [isOpen, periods]);

  const updateSlot = (key, patch) => setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const addSlot = () => setSlots((prev) => [...prev, mkSlot()]);
  const removeSlot = (key) => setSlots((prev) => prev.filter((s) => s.key !== key));

  const toggleDay = (id) =>
    setCheckedDays((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort()));

  const handleSave = async () => {
    const valid = slots.filter((s) => s.startTime && s.endTime);
    if (valid.length === 0) {
      toast.error(isFr ? "Ajoutez au moins un créneau valide" : "Add at least one valid period");
      return;
    }
    if (checkedDays.length === 0) {
      toast.error(isFr ? "Cochez au moins un jour" : "Select at least one day");
      return;
    }

    setSaving(true);
    try {
      const existing = Array.isArray(periods) ? periods : periods?.periods || [];

      // Construire la cible : créneau type × jours cochés
      const target = [];
      // Normalise les heures (HH:MM) — le backend renvoie parfois "07:30:00",
      // les inputs type=time donnent "07:30" : sans normalisation les clés ne
      // correspondent jamais et le diff (suppression/ajout) est cassé.
      const hhmm = (t) => String(t || "").slice(0, 5);
      const keyOf = (p) => `${p.day}|${hhmm(p.startTime)}-${hhmm(p.endTime)}`;
      checkedDays.forEach((day) => {
        valid.forEach((s, i) => {
          target.push({
            day,
            name: s.name.trim() || (s.isBreak ? (isFr ? "Récréation" : "Break") : isFr ? "Créneau" : "Period"),
            startTime: s.startTime,
            endTime: s.endTime,
            isBreak: s.isBreak,
            sortOrder: i + 1,
          });
        });
      });
      const targetKeys = new Set(target.map((t) => keyOf(t)));

      const toDelete = existing.filter((p) => !targetKeys.has(keyOf(p)));
      const existingKeys = new Map(existing.map((p) => [keyOf(p), p]));
      const toCreate = target.filter((t) => !existingKeys.has(keyOf(t)));

      // Supprimer les créneaux retirés (jour décoche / créneau supprimé).
      // force:true → un jour retiré supprime aussi ses cours (comportement
      // voulu par l'admin qui décoche un jour) ; l'API renvoie le nb de cours
      // retirés pour l'afficher dans le toast.
      let removedLessons = 0;
      for (const p of toDelete) {
        try {
          const res = await deletePeriod(p.id, { force: true });
          removedLessons += Number(res?.removedEntries) || 0;
        } catch (err) {
          toast.error(getErrorMessage(err, isFr ? "Erreur suppression créneau" : "Period deletion error"));
          return;
        }
      }

      // Créer les nouveaux (bulk si possible)
      if (toCreate.length > 0) {
        try {
          await createPeriods({ academicYearId, periods: toCreate });
        } catch {
          // fallback : création individuelle
          for (const t of toCreate) {
            try {
              await createPeriod({ academicYearId, ...t });
            } catch (err) {
              toast.error(getErrorMessage(err, isFr ? "Erreur création créneau" : "Period creation error"));
              return;
            }
          }
        }
      }

      // Mettre à jour les existants modifiés
      let updated = 0;
      for (const t of target) {
        const p = existingKeys.get(keyOf(t));
        if (!p) continue;
        const changed = p.name !== t.name || p.isBreak !== t.isBreak;
        if (changed) {
          try {
            await updatePeriod(p.id, { academicYearId, ...t });
            updated++;
          } catch {
            /* ignore */
          }
        }
      }

      toast.success(
        isFr
          ? `Créneaux enregistrés (${toCreate.length} créés, ${updated} modifiés, ${toDelete.length} retirés${removedLessons > 0 ? `, ${removedLessons} cours retirés` : ""})`
          : `Periods saved (${toCreate.length} created, ${updated} updated, ${toDelete.length} removed${removedLessons > 0 ? `, ${removedLessons} lessons removed` : ""})`
      );
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, isFr ? "Erreur lors de l'enregistrement" : "Error while saving"));
    } finally {
      setSaving(false);
    }
  };

  const totalSlots = slots.length * checkedDays.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFr ? "Créneaux de la semaine" : "Weekly periods"}
      size="full"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-surface-400">
            <FiInfo className="w-3.5 h-3.5" />
            {isFr ? "Les mêmes créneaux sont appliqués aux jours cochés." : "Same periods are applied to the checked days."}
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={onClose} size="sm">
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button onClick={handleSave} size="sm" loading={saving}>
              {isFr ? "Enregistrer" : "Save"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_190px] gap-4">
        {/* Colonne : liste des créneaux types */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold tracking-widest uppercase text-surface-400">
              {isFr ? "Créneaux" : "Periods"}
              <span className="ml-2 font-mono text-surface-300 dark:text-surface-600">{slots.length}</span>
            </div>
            <button
              onClick={addSlot}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary-600 hover:text-primary-700"
            >
              <FiPlus className="w-3.5 h-3.5" /> {isFr ? "Ajouter un créneau" : "Add period"}
            </button>
          </div>

          <div className="space-y-2">
            {slots.length === 0 && (
              <p className="text-[12px] text-surface-400 text-center py-6 border border-dashed border-surface-200 dark:border-surface-700 rounded-xl">
                {isFr ? "Aucun créneau — ajoutez-en" : "No periods — add one"}
              </p>
            )}
            {slots.map((s) => (
              <div
                key={s.key}
                className={`flex items-center gap-2 rounded-xl border p-2 transition-all ${
                  s.isBreak
                    ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10"
                    : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                }`}
              >
                {s.isBreak ? (
                  <FiCoffee className="w-4 h-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <FiClock className="w-4 h-4 text-surface-400 flex-shrink-0" />
                )}
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateSlot(s.key, { name: e.target.value })}
                  placeholder={s.isBreak ? (isFr ? "Récréation" : "Break") : isFr ? "Période 1" : "Period 1"}
                  className={`${inputClass} flex-1 min-w-[90px]`}
                />
                <input
                  type="time"
                  value={s.startTime}
                  onChange={(e) => updateSlot(s.key, { startTime: e.target.value })}
                  className={`${inputClass} w-[100px]`}
                />
                <span className="text-[11px] text-surface-300 dark:text-surface-600 flex-shrink-0">→</span>
                <input
                  type="time"
                  value={s.endTime}
                  onChange={(e) => updateSlot(s.key, { endTime: e.target.value })}
                  className={`${inputClass} w-[100px]`}
                />
                <button
                  onClick={() => updateSlot(s.key, { isBreak: !s.isBreak })}
                  className={`h-8 px-2.5 rounded-md text-[10.5px] font-bold border transition-all flex-shrink-0 ${
                    s.isBreak
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : "bg-surface-100 dark:bg-surface-700 text-surface-500 border-transparent hover:border-amber-300"
                  }`}
                  title={isFr ? "Basculer pause" : "Toggle break"}
                >
                  {s.isBreak ? (isFr ? "Pause" : "Break") : isFr ? "Cours" : "Class"}
                </button>
                <button
                  onClick={() => removeSlot(s.key)}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                  title={isFr ? "Supprimer" : "Delete"}
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne : jours cochés */}
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-surface-400 mb-2">
            {isFr ? "Jours" : "Days"}
          </div>
          <div className="space-y-1.5">
            {DAYS.map((d) => (
              <label
                key={d.id}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  checkedDays.includes(d.id)
                    ? "border-primary-500/60 bg-primary-50/60 dark:bg-primary-900/15"
                    : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedDays.includes(d.id)}
                  onChange={() => toggleDay(d.id)}
                  className="accent-primary-600 w-3.5 h-3.5"
                />
                <span className="text-[12.5px] font-semibold text-surface-700 dark:text-surface-200">
                  {isFr ? d.fullFr : d.fullEn}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-surface-100/70 dark:bg-surface-800/70 border border-surface-100 dark:border-surface-700 p-3 text-center">
            <div className="font-mono text-[22px] font-bold text-primary-600 dark:text-primary-400">{totalSlots}</div>
            <div className="text-[10.5px] uppercase tracking-wide text-surface-400 font-semibold">
              {isFr ? "créneaux au total" : "total periods"}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
