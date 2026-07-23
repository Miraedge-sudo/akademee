/**
 * ProgressChart — Visualizes grade evolution across sequences/periods.
 *
 * Uses recharts to render a responsive line chart with:
 *  - X-axis: period/sequence names
 *  - Y-axis: average score /20
 *  - Reference line at 10/20 (pass threshold)
 *  - Color-coded dots (green ≥10, amber ≥8, red <8)
 *  - Tooltip with period name, average, rank
 *
 * Props:
 *  - data: Array of { period_name, general_average, class_rank, class_size }
 *  - primaryColor: theme hex color (default #085041)
 */
import {
  LineChart,
  Line,
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

function CustomTooltip({ active, payload, label, isFr = false }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = scoreColor(d.general_average);
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3 max-w-[200px]">
      <div className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5">
        {label}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[13px] font-bold" style={{ color }}>
          {d.general_average?.toFixed(2) || "-"} /20
        </span>
      </div>
      {d.class_rank != null && (
        <div className="text-[11px] text-surface-400">
          {isFr ? "Rang" : "Rank"}: #{d.class_rank}/{d.class_size || "?"}
        </div>
      )}
    </div>
  );
}

export default function ProgressChart({ data = [], primaryColor, isFr = false }) {
  const pc = primaryColor || defaultColor;

  if (!data || data.length === 0) {
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

  // Determine Y-axis domain
  const values = data.map((d) => Number(d.general_average) || 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const domainMin = Math.max(0, Math.floor(minVal - 1));
  const domainMax = Math.min(20, Math.ceil(maxVal + 1));

  return (
    <div className="mr-fade" style={{ animationDelay: "0.05s" }}>
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${pc}15` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-surface-900 dark:text-surface-100">
                {isFr ? "Évolution des Moyennes" : "Grade Progress"}
              </h3>
              <p className="text-[10px] text-surface-400">
                {isFr
                  ? "Progression à travers les séquences"
                  : "Progress across sequences"}
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
              <div className="w-2.5 h-0.5 rounded-full bg-red-400 border-dashed" style={{ borderTop: "2px dashed #f87171", height: 0 }} />
              <span className="text-[10px] text-surface-400">10/20</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="p-4 sm:p-5">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="period_name"
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

              <Line
                type="monotone"
                dataKey="general_average"
                stroke={pc}
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return null;
                  const score = Number(payload.general_average) || 0;
                  const color = scoreColor(score);
                  const r = 5;
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 3}
                        fill="white"
                        stroke={color}
                        strokeWidth={2}
                        opacity={0.8}
                      />
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
                  if (!cx || !cy) return null;
                  const score = Number(payload.general_average) || 0;
                  const color = scoreColor(score);
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="white"
                        stroke={color}
                        strokeWidth={2.5}
                        opacity={0.9}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={color}
                        stroke="none"
                      />
                    </g>
                  );
                }}
                fill="url(#progressGrad)"
                connectNulls
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
