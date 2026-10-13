"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export type VisitsPoint = {
  day: string;
  visits: number;
  uniqueVisitors: number;
};

export default function VisitsChart({
  data,
}: {
  data: VisitsPoint[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 sm:text-base">
          Website Traffic
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Daily page views and unique visitors · Last 7 days
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -18, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              formatter={(value, name) => [
                Number(value ?? 0).toLocaleString(),
                name === "visits" ? "Page views" : "Unique visitors",
              ]}
            />

            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) =>
                value === "visits" ? "Page views" : "Unique visitors"
              }
            />

            <Line
              type="monotone"
              dataKey="visits"
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />

            <Line
              type="monotone"
              dataKey="uniqueVisitors"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}