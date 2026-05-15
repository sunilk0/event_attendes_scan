"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  type PieLabelRenderProps,
} from "recharts";

type WeekPoint = { date: string; label: string; total: number; firstTimers: number; returning: number };
type ArrivalPoint = { time: string; count: number };
type DemoPoint = { name: string; value: number };

type Stats = {
  weeklyData: WeekPoint[];
  arrivalData: ArrivalPoint[];
  ageGroups: DemoPoint[];
  genders: DemoPoint[];
  summary: { totalAttendance: number; uniqueMembers: number; thisWeek: number; lastWeek: number };
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [weeks, setWeeks] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?weeks=${weeks}`);
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Failed to load stats.");
    } finally {
      setLoading(false);
    }
  }, [weeks, router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const s = stats!;
  const trend = s.summary.lastWeek > 0
    ? Math.round(((s.summary.thisWeek - s.summary.lastWeek) / s.summary.lastWeek) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance Dashboard</h1>
          <p className="text-sm text-gray-500">Fellowship tracking overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
            <option value={24}>Last 24 weeks</option>
            <option value={52}>Last year</option>
          </select>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2"
          >
            Check-in Page
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="This Sunday" value={s.summary.thisWeek} sub={trend !== 0 ? `${trend > 0 ? "+" : ""}${trend}% vs last week` : "Same as last week"} subColor={trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-gray-400"} />
          <SummaryCard label="Last Sunday" value={s.summary.lastWeek} />
          <SummaryCard label="Total Check-ins" value={s.summary.totalAttendance} sub={`Last ${weeks} weeks`} />
          <SummaryCard label="Unique Members" value={s.summary.uniqueMembers} sub="Tracked in period" />
        </div>

        {/* Weekly headcount + first-timers */}
        <ChartCard title="Weekly Attendance" subtitle="Total check-ins per Sunday">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={s.weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="returning" name="Returning" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="firstTimers" name="First-timers" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Trend line */}
        <ChartCard title="Attendance Trend" subtitle="Week-over-week total">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={s.weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" fill="url(#totalGrad)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Arrival times */}
        {s.arrivalData.length > 0 && (
          <ChartCard title="Arrival Time Distribution" subtitle="Check-in times (15-min buckets)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={s.arrivalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Arrivals" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Age Groups" subtitle="All check-ins in period">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={s.ageGroups} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }: PieLabelRenderProps) => `${name ?? ""} ${Math.round(((percent as number) ?? 0) * 100)}%`} labelLine={false}>
                  {s.ageGroups.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Gender Breakdown" subtitle="All check-ins in period">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={s.genders} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }: PieLabelRenderProps) => `${name ?? ""} ${Math.round(((percent as number) ?? 0) * 100)}%`} labelLine={false}>
                  {s.genders.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, sub, subColor }: { label: string; value: number; sub?: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor ?? "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
