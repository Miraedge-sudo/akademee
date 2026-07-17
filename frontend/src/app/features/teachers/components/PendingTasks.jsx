
import { useState } from 'react';
import { Check } from 'lucide-react';

const INITIAL_TASKS = [
  { text: 'Enter Seq 3 grades — Form 4A Mathematics', priority: '#EF4444', done: false },
  { text: 'Enter Seq 3 grades — Form 3B Mathematics', priority: '#EF4444', done: false },
  { text: 'Attendance report — Form 5A (Friday)',      priority: '#F59E0B', done: false },
  { text: 'Prepare assessment — Lower 6th Sci.',       priority: '#F59E0B', done: false },
  { text: 'Submit term report — Form 4A',              priority: '#3B82F6', done: false },
  { text: 'Update lesson register — Form 3B',          priority: '#9BA59C', done: true  },
];

export default function PendingTasks({ tasks: propTasks }) {
  const [tasks, setTasks] = useState(propTasks || INITIAL_TASKS);

  const toggle = (i) =>
    setTasks((prev) => prev.map((t, idx) => (idx === i ? { ...t, done: !t.done } : t)));

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Pending tasks
        </div>
        <span className="text-[11.5px] font-semibold text-surface-400">
          {remaining} remaining
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-transparent bg-surface-50 dark:bg-surface-900/50 transition-all duration-150 hover:border-surface-200 dark:hover:border-surface-600 hover:bg-white dark:hover:bg-surface-800 cursor-pointer"
            onClick={() => toggle(i)}
          >
            {/* Checkbox */}
            <button
              type="button"
              className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                task.done
                  ? 'bg-[#085041] border-[#085041]'
                  : 'border-surface-200 dark:border-surface-600 hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20'
              }`}
              onClick={(e) => { e.stopPropagation(); toggle(i); }}
            >
              {task.done && <Check size={11} strokeWidth={2.5} className="text-white" />}
            </button>

            {/* Text */}
            <span
              className={`flex-1 text-[13px] font-medium transition-colors ${
                task.done
                  ? 'line-through text-surface-300 dark:text-surface-500'
                  : 'text-surface-800 dark:text-surface-100'
              }`}
            >
              {task.text}
            </span>

            {/* Priority dot */}
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: task.done ? '#BFC4BB' : task.priority }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
