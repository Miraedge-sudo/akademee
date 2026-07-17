/**
 * RecentPayments — last payments received with student name, class, method and amount.
 */
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SAMPLE_PAYMENTS = [
  { name: 'Emma Nkeng',   cls: 'Form 4A', amount: 40000, method: 'Mobile Money',  avatarBg: '#E1F5EE', avatarText: '#085041' },
  { name: 'Boris Abega',  cls: 'Form 3B', amount: 20000, method: 'Cash',          avatarBg: '#EFF6FF', avatarText: '#3B82F6' },
  { name: 'Sophie Mekam', cls: 'Form 5A', amount: 60000, method: 'Bank transfer', avatarBg: '#F5F3FF', avatarText: '#8B5CF6' },
];

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('');
}

export default function RecentPayments({ payments = SAMPLE_PAYMENTS }) {
  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Recent payments
        </div>
        <Link
          to="/dashboard/finance"
          className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:gap-2 transition-all"
        >
          All <ArrowRight size={13} />
        </Link>
      </div>

      <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
        {payments.map((p, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
              style={{ background: p.avatarBg, color: p.avatarText }}
            >
              {initials(p.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100">{p.name}</div>
              <div className="text-[11.5px] text-surface-400">{p.cls} · {p.method}</div>
            </div>
            <span className="text-[13.5px] font-extrabold text-teal-700 dark:text-teal-400 flex-shrink-0">
              +{p.amount.toLocaleString('fr')} F
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
