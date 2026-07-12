/**
 * Tab navigation component.
 *
 * @param {{
 *   tabs: Array<{ key: string, label: string, icon?: React.ReactNode, count?: number }>,
 *   activeTab: string,
 *   onChange: (key: string) => void,
 *   color?: string,
 *   className?: string,
 * }} props
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  color = '#085041',
  className = '',
}) {
  return (
    <div
      className={`flex border-b border-surface-200 dark:border-surface-700 overflow-x-auto scrollbar-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap
              transition-colors border-b-2
              ${
                isActive
                  ? 'text-primary-700 dark:text-primary-400 font-bold'
                  : 'border-transparent text-surface-400 hover:text-surface-600'
              }
            `}
            style={
              isActive
                ? { borderColor: color, color }
                : undefined
            }
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive
                    ? `${color}14`
                    : '#EEF0EC',
                  color: isActive ? color : '#9BA59C',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
