/**
 * PendingTasks — liste de tâches prioritaires de l'enseignant.
 *
 * L'idée : regrouper le travail en attente du professeur (notes à saisir,
 * appels à faire, …) dans une checklist priorisée. Chaque tâche est un lien
 * vers l'écran correspondant (saisie de notes, présence…).
 *
 * Les tâches sont désormais fournies par la page parent (données réelles),
 * plus de liste de démonstration codée en dur.
 */
import { useState } from 'react';
import {
  FiCheck as Check,
} from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function PendingTasks({ tasks = [], loading = false }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [doneIds, setDoneIds] = useState(() => new Set());

  const remaining = tasks.filter((task) => !doneIds.has(task.id)).length;

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {t('teacher.pendingTasks.title')}
        </div>
        {!loading && tasks.length > 0 && (
          <span className="text-[11.5px] font-semibold text-surface-400">
            {remaining} {t('teacher.pendingTasks.remaining')}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[46px] rounded-[10px] bg-surface-50 dark:bg-surface-900 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-surface-400 text-center py-6">
          {t('teacher.pendingTasks.allDone')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => {
            const done = doneIds.has(task.id);
            const clickable = !!task.href;
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-transparent bg-surface-50 dark:bg-surface-900/50 transition-all duration-150 ${
                  clickable
                    ? "cursor-pointer hover:border-surface-200 dark:hover:border-surface-600 hover:bg-white dark:hover:bg-surface-800"
                    : ""
                }`}
                onClick={() => clickable && navigate(task.href)}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    done
                      ? 'bg-[#085041] border-[#085041]'
                      : 'border-surface-200 dark:border-surface-600 hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDoneIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(task.id)) next.delete(task.id);
                      else next.add(task.id);
                      return next;
                    });
                  }}
                >
                  {done && <Check size={11} strokeWidth={2.5} className="text-white" />}
                </button>

                {/* Text */}
                <span
                  className={`flex-1 text-[13px] font-medium transition-colors ${
                    done
                      ? 'line-through text-surface-300 dark:text-surface-500'
                      : 'text-surface-800 dark:text-surface-100'
                  }`}
                >
                  {task.text}
                </span>

                {/* Priority dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: done ? '#BFC4BB' : task.priority }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
