"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RevenuePoint = {
  day: string;
  revenue: number;
};

export default function RevenueChart({
  data,
}: {
  data: RevenuePoint[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-sky-700 mb-6">
        Revenue Trend (Last 7 Days)
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip
              formatter={(value: number) =>
                [`₦${value.toLocaleString()}`, "Revenue"]
              }
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0284c7"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}