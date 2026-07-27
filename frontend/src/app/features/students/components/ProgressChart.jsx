/**
 * ProgressChart — Visualizes grade evolution across sequences/periods.
 *
 * Improvements:
 *  - Area fill with gradient
 *  - Chronological sorting
 *  - Delta annotations (Δ between consecutive points)
 *  - Clickable dots (opens report card)
 *  - Better X-axis labels (sequence_label || period_name)
 *
 * Uses recharts LineChart + Area.
 *
 * Props:
 *  - data: Array of report card objects (must include created_at, general_average, etc.)
 *  - primaryColor: theme hex color
 *  - isFr: boolean
 *  - onDotClick: (reportCard) => void — called when user clicks a data point
 */
import { useMemo } from "react";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const defaultColor = "#085041";

function scoreColor(score) {
  const pct = (score / 20) * 100;
  if (pct >= 60) return "#1D9E75";
  if (pct >= 40) return "#F59E0B";
  return "#EF4444";
}

function deltaColor(delta) {
  if (delta > 0.5) return "#1D9E75";
  if (delta < -0.5) return "#EF4444";
  return "#9CA3AF";
}

function CustomTooltip({ active, payload, label, isFr = false }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = scoreColor(d.general_average);
  const delta = d.delta != null ? Number(d.delta) : null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3 max-w-[220px]">
      <div className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5">
        {d.sequence_label || d.period_name || label}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[13px] font-bold" style={{ color }}>
          {d.general_average?.toFixed(2) || "—"} /20
        </span>
      </div>
      {delta != null && (
        <div className="flex items-center gap-1 text-[12px]" style={{ color: deltaColor(delta) }}>
          <span>{delta > 0 ? "▲" : delta < 0 ? "▼" : "—"}</span>
          <span className="font-semibold">
            {delta > 0 ? "+" : ""}{delta.toFixed(1)} pts
          </span>
          <span className="text-surface-400 ml-auto">
            {isFr ? "depuis le précédent" : "from previous"}
          </span>
        </div>
      )}
      {d.class_rank != null && (
        <div className="text-[11px] text-surface-400 mt-1">
          {isFr ? "Rang" : "Rank"}: #{d.class_rank}/{d.class_size || "?"}
        </div>
      )}
    </div>
  );
}

export default function ProgressChart({ data = [], primaryColor, isFr = false, onDotClick }) {
  const pc = primaryColor || defaultColor;

  // ── Sort data chronologically & compute deltas ──
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data]
      .filter((d) => d.general_average != null)
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    return sorted.map((item, idx) => {
      const prevAvg = idx > 0 ? Number(sorted[idx - 1].general_average) || 0 : null;
      const currAvg = Number(item.general_average) || 0;
      const delta = prevAvg != null ? +(currAvg - prevAvg).toFixed(2) : null;
      return {
        ...item,
        // use the best available label for X-axis
        label: item.sequence_label || item.period_name || `${isFr ? "Période" : "Period"} ${idx + 1}`,
        delta,
      };
    });
  }, [data, isFr]);

  // ── Y-axis domain ──
  const domainMin = useMemo(() => {
    if (chartData.length === 0) return 0;
    const vals = chartData.map((d) => Number(d.general_average) || 0);
    return Math.max(0, Math.floor(Math.min(...vals) - 0.5));
  }, [chartData]);

  const domainMax = useMemo(() => {
    if (chartData.length === 0) return 20;
    const vals = chartData.map((d) => Number(d.general_average) || 0);
    return Math.min(20, Math.ceil(Math.max(...vals) + 0.5));
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-6 text-center">
        <div className="text-[13px] text-surface-400">
          {isFr
            ? "Aucune donnée disponible pour le graphique"
            : "No data available for chart"}
        </div>
      </div>
    );
  }

  const uniqueId = `progressGrad-${pc.replace("#", "")}`;

  return (
    <div className="mr-fade" style={{ animationDelay: "0.05s" }}>
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${pc}15` }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={pc}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-surface-900 dark:text-surface-100">
                {isFr ? "Évolution des Moyennes" : "Grade Progress"}
              </h3>
              <p className="text-[10px] text-surface-400">
                {isFr
                  ? "Progression à travers les séquences (cliquez un point pour voir le bulletin)"
                  : "Progress across sequences (click a point to view the report card)"}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-0.5 rounded-full" style={{ background: pc }} />
              <span className="text-[10px] text-surface-400">
                {isFr ? "Moyenne" : "Average"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-0.5"
                style={{ borderTop: "2px dashed #f87171", height: 0 }}
              />
              <span className="text-[10px] text-surface-400">10/20</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="p-4 sm:p-5">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 18, right: 12, bottom: 4, left: -8 }}
            >
              <defs>
                <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={pc} stopOpacity={0.25} />
                  <stop offset="50%" stopColor={pc} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={pc} stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[domainMin, domainMax]}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.toFixed(1)}
                width={36}
              />

              <Tooltip content={<CustomTooltip isFr={isFr} />} />

              {/* Reference line at 10/20 (pass threshold) */}
              <ReferenceLine
                y={10}
                stroke="#f87171"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "10/20",
                  position: "insideBottomRight",
                  fontSize: 10,
                  fill: "#f87171",
                }}
              />

              {/* Area fill */}
              <Area
                type="monotone"
                dataKey="general_average"
                fill={`url(#${uniqueId})`}
                stroke="none"
              />

              {/* Main line */}
              <Line
                type="monotone"
                dataKey="general_average"
                stroke={pc}
                strokeWidth={2.5}
                connectNulls
                animationDuration={800}
                animationEasing="ease-out"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null) return null;
                  const score = Number(payload.general_average) || 0;
                  const color = scoreColor(score);
                  const delta = payload.delta != null ? Number(payload.delta) : null;
                  const r = 5;

                  return (
                    <g
                      style={{ cursor: "pointer" }}
                      onClick={() => onDotClick?.(payload)}
                    >
                      {/* Delta text above the dot */}
                      {delta != null && (
                        <text
                          x={cx}
                          y={cy - 16}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={700}
                          fill={deltaColor(delta)}
                          style={{ userSelect: "none" }}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(1)}
                        </text>
                      )}

                      {/* Hover ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 4}
                        fill="transparent"
                        stroke="transparent"
                        strokeWidth={1}
                      />

                      {/* Outer white circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 3}
                        fill="white"
                        stroke={color}
                        strokeWidth={2}
                        opacity={0.9}
                      />

                      {/* Inner colored circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={color}
                        stroke="none"
                      />
                    </g>
                  );
                }}
                activeDot={(props) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null) return null;
                  const score = Number(payload.general_average) || 0;
                  const color = scoreColor(score);
                  const delta = payload.delta != null ? Number(payload.delta) : null;

                  return (
                    <g style={{ cursor: "pointer" }}>
                      {/* Delta text */}
                      {delta != null && (
                        <text
                          x={cx}
                          y={cy - 22}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={800}
                          fill={deltaColor(delta)}
                          style={{ userSelect: "none" }}
                        >
                          {delta > 0 ? "▲ +" : delta < 0 ? "▼ " : "— "}
                          {delta !== 0 ? `${Math.abs(delta).toFixed(1)}` : ""}
                        </text>
                      )}

                      {/* Large pulsing ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="white"
                        stroke={color}
                        strokeWidth={2.5}
                        opacity={0.9}
                      />

                      {/* Inner dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5.5}
                        fill={color}
                        stroke="none"
                      />
                    </g>
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
