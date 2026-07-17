import { useEffect, useRef } from 'react';

const DONUT_DATA = [
  { label: 'Fully paid', value: 148, color: '#1D9E75' },
  { label: 'Partial',    value: 82,  color: '#F59E0B' },
  { label: 'Unpaid',     value: 47,  color: '#EF4444' },
];

function buildArcs(data) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 50, cy = 50, r = 36, sw = 13;
  const circ = 2 * Math.PI * r;
  let angle = -90;
  const arcs = data.map((d) => {
    const sweep = (d.value / total) * 360;
    const a1 = (angle * Math.PI) / 180;
    const a2 = ((angle + sweep) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = sweep > 180 ? 1 : 0;
    const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    angle += sweep;
    return { ...d, path, circ, sw };
  });
  return { arcs, total };
}

export default function FeeStatusDonut({ data = DONUT_DATA }) {
  const { arcs, total } = buildArcs(data);

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-5">
        <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
        Fee status overview
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        {/* Donut SVG */}
        <svg
          viewBox="0 0 100 100"
          width={110}
          height={110}
          className="flex-shrink-0"
        >
          <style>{`
            @keyframes donutDraw { from { stroke-dashoffset: var(--c) } to { stroke-dashoffset: 0 } }
          `}</style>
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={arc.sw}
              strokeLinecap="butt"
              style={{
                strokeDasharray: arc.circ,
                strokeDashoffset: arc.circ,
                animation: `donutDraw 1.2s ${0.3 + i * 0.15}s cubic-bezier(.16,1,.3,1) forwards`,
                '--c': arc.circ,
              }}
            />
          ))}
          {/* Center label */}
          <text
            x="50" y="47"
            textAnchor="middle"
            fontFamily="DM Sans, sans-serif"
            fontSize="14"
            fontWeight="800"
            fill="currentColor"
            className="fill-surface-900 dark:fill-surface-50"
          >
            {total}
          </text>
          <text
            x="50" y="58"
            textAnchor="middle"
            fontFamily="DM Sans, sans-serif"
            fontSize="8"
            className="fill-surface-400"
          >
            students
          </text>
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2.5 text-[12.5px] text-surface-700 dark:text-surface-200">
              <div className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: d.color }} />
              <span className="flex-1">{d.label}</span>
              <span className="font-bold text-[13px] text-surface-900 dark:text-surface-100">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
