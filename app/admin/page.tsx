import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import RevenueChart from "@/components/RevenueChart";
import VisitsChart, { type VisitsPoint } from "@/components/VisitsChart";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Africa/Lagos";

function getLagosDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "en-NG",
    {
      timeZone: "UTC",
      weekday: "short",
    }
  );
}

function naira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=%2Fadmin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  // Load existing business data and inventory.
  const [
    { data: orders, error: ordersError },
    { count: totalUsers, error: usersError },
    { data: serviceRows, error: servicesError },
    { data: stockRows, error: stockError },
  ] = await Promise.all([
    supabase.from("order").select("*"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("services")
      .select("id, title, category, is_active, available_stock"),
    supabase
      .from("stock")
      .select("service_id, is_used, status, assigned_to"),
  ]);

  if (ordersError) {
    console.error("Admin dashboard orders error:", ordersError.message);
  }

  if (usersError) {
    console.error("Admin dashboard users error:", usersError.message);
  }

  if (servicesError) {
    console.error("Admin dashboard services error:", servicesError.message);
  }

  if (stockError) {
    console.error("Admin dashboard stock error:", stockError.message);
  }

  const safeOrders = orders ?? [];
  const safeServices = serviceRows ?? [];
  const safeStock = stockRows ?? [];

  const totalOrders = safeOrders.length;

  const pendingOrders = safeOrders.filter(
    (order: any) =>
      order.order_status === "pending" ||
      order.order_status === "pending_verification"
  ).length;

  const completedOrders = safeOrders.filter(
    (order: any) => order.order_status === "completed"
  ).length;

  const rejectedOrders = safeOrders.filter(
    (order: any) => order.order_status === "rejected"
  ).length;

  const totalRevenue = safeOrders
    .filter((order: any) => order.order_status === "completed")
    .reduce(
      (sum: number, order: any) => sum + Number(order.amount ?? 0),
      0
    );

  // Use Nigeria's calendar date for dashboard reporting.
  const today = new Date();
  const todayKey = getLagosDateKey(today);
  const sevenDaysAgoKey = shiftDateKey(todayKey, -6);
  const thirtyDaysAgoKey = shiftDateKey(todayKey, -29);

  const revenueToday = safeOrders
    .filter(
      (order: any) =>
        order.order_status === "completed" &&
        getLagosDateKey(new Date(order.created_at)) === todayKey
    )
    .reduce(
      (sum: number, order: any) => sum + Number(order.amount ?? 0),
      0
    );

  // SERVICE PERFORMANCE
  // Only completed orders contribute to sales and revenue statistics.
  const completedForAnalytics = safeOrders.filter(
    (order: any) => order.order_status === "completed"
  );

  const servicePerformance = safeServices.map((service: any) => {
    const serviceOrders = completedForAnalytics.filter(
      (order: any) => order.service_id === service.id
    );

    const recent7 = serviceOrders.filter((order: any) => {
      const date = new Date(order.created_at);

      if (Number.isNaN(date.getTime())) return false;

      const key = getLagosDateKey(date);
      return key >= sevenDaysAgoKey && key <= todayKey;
    });

    const recent30 = serviceOrders.filter((order: any) => {
      const date = new Date(order.created_at);

      if (Number.isNaN(date.getTime())) return false;

      const key = getLagosDateKey(date);
      return key >= thirtyDaysAgoKey && key <= todayKey;
    });

    const available = safeStock.filter(
      (item: any) =>
        item.service_id === service.id &&
        item.is_used === false &&
        item.status === "available" &&
        item.assigned_to == null
    ).length;

    const units7 = recent7.reduce(
      (sum: number, order: any) =>
        sum + Number(order.quantity ?? 0),
      0
    );

    const units30 = recent30.reduce(
      (sum: number, order: any) =>
        sum + Number(order.quantity ?? 0),
      0
    );

    const revenue30 = recent30.reduce(
      (sum: number, order: any) =>
        sum + Number(order.amount ?? 0),
      0
    );

    return {
      id: service.id as string,
      title: service.title as string,
      category: service.category as string | null,
      isActive: service.is_active !== false,
      available,
      units7,
      units30,
      orders30: recent30.length,
      revenue30,
    };
  });

  // Top-selling services ranked by completed units sold.
  const topServices = [...servicePerformance]
    .filter((service) => service.units30 > 0)
    .sort(
      (a, b) =>
        b.units30 - a.units30 ||
        b.revenue30 - a.revenue30
    )
    .slice(0, 5);

  // Services with inventory but no completed sales in the last 30 days.
  const slowServices = servicePerformance
    .filter(
      (service) =>
        service.available > 0 &&
        service.isActive &&
        service.units30 === 0
    )
    .sort((a, b) => b.available - a.available)
    .slice(0, 5);

  // Active services with five or fewer units and recent demand.
  const lowStockServices = servicePerformance
    .filter(
      (service) =>
        service.isActive &&
        service.available <= 5 &&
        service.units7 > 0
    )
    .sort(
      (a, b) =>
        a.available - b.available ||
        b.units7 - a.units7
    )
    .slice(0, 5);

  const revenueThisWeek = safeOrders
    .filter((order: any) => {
      if (order.order_status !== "completed") return false;

      const created = new Date(order.created_at);

      if (Number.isNaN(created.getTime())) return false;

      const key = getLagosDateKey(created);
      return key >= sevenDaysAgoKey && key <= todayKey;
    })
    .reduce(
      (sum: number, order: any) => sum + Number(order.amount ?? 0),
      0
    );

  const revenueLast7Days = Array.from({ length: 7 }, (_, index) => {
    const dayKey = shiftDateKey(todayKey, index - 6);

    const revenue = safeOrders
      .filter((order: any) => {
        if (order.order_status !== "completed") return false;

        const created = new Date(order.created_at);

        if (Number.isNaN(created.getTime())) return false;

        return getLagosDateKey(created) === dayKey;
      })
      .reduce(
        (sum: number, order: any) =>
          sum + Number(order.amount ?? 0),
        0
      );

    return {
      day: formatDayLabel(dayKey),
      revenue,
    };
  });

  // WEBSITE TRAFFIC ANALYTICS
  // This server-only service key is used only after the admin check.
  let visitsData: VisitsPoint[] = [];
  let todayVisits = 0;
  let todayUniqueVisitors = 0;
  let visitsAvailable = false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminSupabase = createSupabaseClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const startDateKey = shiftDateKey(todayKey, -6);
      const startIso = `${startDateKey}T00:00:00+01:00`;

      const {
        data: visitRows,
        error: visitsError,
      } = await adminSupabase
        .from("site_visits")
        .select("visitor_id, page_path, visited_at")
        .gte(
          "visited_at",
          new Date(startIso).toISOString()
        )
        .lte("visited_at", today.toISOString())
        .order("visited_at", { ascending: true });

      if (visitsError) {
        console.error(
          "Admin dashboard visits error:",
          visitsError.message
        );
      } else {
        visitsAvailable = true;

        const visitsByDay = new Map<
          string,
          { visits: number; visitors: Set<string> }
        >();

        for (let offset = -6; offset <= 0; offset++) {
          visitsByDay.set(shiftDateKey(todayKey, offset), {
            visits: 0,
            visitors: new Set<string>(),
          });
        }

        for (const row of visitRows ?? []) {
          const visitedAt = new Date(row.visited_at);

          if (Number.isNaN(visitedAt.getTime())) continue;

          const dayKey = getLagosDateKey(visitedAt);
          const bucket = visitsByDay.get(dayKey);

          if (!bucket) continue;

          bucket.visits += 1;
          bucket.visitors.add(row.visitor_id);
        }

        visitsData = Array.from({ length: 7 }, (_, index) => {
          const dayKey = shiftDateKey(todayKey, index - 6);
          const bucket = visitsByDay.get(dayKey);

          return {
            day: formatDayLabel(dayKey),
            visits: bucket?.visits ?? 0,
            uniqueVisitors: bucket?.visitors.size ?? 0,
          };
        });

        const todayBucket = visitsByDay.get(todayKey);

        todayVisits = todayBucket?.visits ?? 0;
        todayUniqueVisitors = todayBucket?.visitors.size ?? 0;
      }
    } catch (error) {
      console.error("Unable to load visit analytics:", error);
    }
  } else {
    console.error(
      "Visit analytics requires SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY."
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-900">
      <section className="relative overflow-hidden bg-[#071a2f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sm">
                  PS
                </span>

                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                  Admin Control Center
                </span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                ProxySocials{" "}
                <span className="text-sky-400">Admin</span>
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
                Monitor your business, manage customer activity, orders,
                services and revenue from one place.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 sm:px-4 sm:text-sm"
              >
                View Store
              </Link>

              <LogoutButton />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        {/* Main business statistics */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard
            label="Total Orders"
            value={totalOrders.toLocaleString()}
            icon="📦"
            tone="blue"
          />

          <StatCard
            label="Total Users"
            value={(totalUsers ?? 0).toLocaleString()}
            icon="👥"
            tone="purple"
          />

          <StatCard
            label="Pending"
            value={pendingOrders.toLocaleString()}
            icon="⏳"
            tone="yellow"
          />

          <StatCard
            label="Completed"
            value={completedOrders.toLocaleString()}
            icon="✓"
            tone="green"
          />

          <StatCard
            label="Revenue"
            value={naira(totalRevenue)}
            icon="₦"
            tone="sky"
            fullWidth
          />
        </section>

        {/* Website traffic */}
        <section className="mt-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Website Analytics
            </h2>

            <p className="text-xs text-slate-500">
              Visitor activity in Nigeria time (WAT)
            </p>
          </div>

          {!visitsAvailable && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Traffic analytics are currently unavailable. Check the
              server-side Supabase key and the site_visits table. Your
              other dashboard metrics are unaffected.
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard
              label="Today's Page Views"
              value={todayVisits.toLocaleString()}
              icon="👁️"
              tone="blue"
            />

            <StatCard
              label="Today's Unique Visitors"
              value={todayUniqueVisitors.toLocaleString()}
              icon="🧑‍🤝‍🧑"
              tone="purple"
            />
          </div>

          <VisitsChart data={visitsData} />
        </section>

        {/* Revenue overview */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Revenue Overview
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                  Performance over the last 7 days
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 sm:text-xs">
                7 DAY VIEW
              </div>
            </div>

            <div className="p-3 sm:p-5">
              <RevenueChart data={revenueLast7Days} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Revenue Summary
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                Quick business performance snapshot
              </p>
            </div>

            <div className="space-y-3">
              <RevenueSummary
                label="Today"
                amount={revenueToday}
                icon="☀️"
                tone="emerald"
              />

              <RevenueSummary
                label="Last 7 Days"
                amount={revenueThisWeek}
                icon="📈"
                tone="indigo"
              />

              <RevenueSummary
                label="All Time"
                amount={totalRevenue}
                icon="💰"
                tone="sky"
              />
            </div>

            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-red-600">
                    Rejected Orders
                  </p>

                  <p className="mt-0.5 text-[10px] text-red-500">
                    Orders requiring attention
                  </p>
                </div>

                <span className="text-lg font-extrabold text-red-600">
                  {rejectedOrders}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* NEW: Service performance */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Service Performance
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Completed sales and current inventory · Last 7 and 30 days
              </p>
            </div>

            <Link
              href="/admin/stock"
              className="text-xs font-semibold text-sky-700 hover:text-sky-900"
            >
              Open Stock Manager →
            </Link>
          </div>

          {(servicesError || stockError) && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Some service or stock insights may be incomplete. Check the
              server logs for the failed query.
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <ServiceInsightPanel
              title="Top-selling services"
              subtitle="Ranked by units in completed orders · 30 days"
              empty="No completed service sales in the last 30 days."
              items={topServices}
              mode="top"
            />

            <ServiceInsightPanel
              title="Slow-moving stock"
              subtitle="Active services with stock but no completed sales · 30 days"
              empty="No slow-moving services detected."
              items={slowServices}
              mode="slow"
            />

            <ServiceInsightPanel
              title="Low-stock alerts"
              subtitle="5 or fewer available units with recent sales"
              empty="No low-stock services with recent demand."
              items={lowStockServices}
              mode="low"
            />
          </div>

          <p className="mt-4 text-[10px] leading-4 text-slate-400">
            Sales insights exclude pending and rejected orders. Stock
            availability follows the Stock Manager rules. Slow-moving
            status is a signal for review, not proof that a service is
            unprofitable.
          </p>
        </section>

        {/* Management */}
        <section className="mt-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Management
            </h2>

            <p className="text-[11px] text-slate-500 sm:text-xs">
              Quickly access your core admin tools
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ManagementCard
              href="/admin/services"
              icon="🛍️"
              title="Services"
              description="Add, edit and manage your services."
              action="Manage Services"
              tone="sky"
            />

            <ManagementCard
              href="/admin/orders"
              icon="📦"
              title="Orders"
              description="Review and manage customer orders."
              action="Manage Orders"
              tone="indigo"
            />

            <ManagementCard
              href="/admin/announcements"
              icon="📢"
              title="Announcements"
              description="Send updates and important messages."
              action="Create Announcement"
              tone="purple"
            />

            <ManagementCard
              href="/"
              icon="🏠"
              title="Storefront"
              description="Return to the ProxySocials customer site."
              action="View Store"
              tone="slate"
            />
          </div>
        </section>

        {/* Operational snapshot */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Operational Snapshot
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
              Current state of the ProxySocials platform
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Snapshot label="Users" value={totalUsers ?? 0} icon="👥" />
            <Snapshot label="Orders" value={totalOrders} icon="📦" />
            <Snapshot label="Completed" value={completedOrders} icon="✅" />
            <Snapshot label="Rejected" value={rejectedOrders} icon="❌" />
          </div>
        </section>

        <footer className="py-7 text-center">
          <p className="text-[10px] text-slate-400 sm:text-xs">
            ProxySocials Admin Control Center
          </p>

          <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">
            Manage your business. Monitor performance. Grow smarter.
          </p>
        </footer>
      </div>
    </main>
  );
}

/* -------------------------------- */
/* SERVICE PERFORMANCE PANEL */
/* -------------------------------- */

function ServiceInsightPanel({
  title,
  subtitle,
  empty,
  items,
  mode,
}: {
  title: string;
  subtitle: string;
  empty: string;
  items: Array<{
    id: string;
    title: string;
    category: string | null;
    available: number;
    units7: number;
    units30: number;
    orders30: number;
    revenue30: number;
  }>;
  mode: "top" | "slow" | "low";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>

      <p className="mt-1 min-h-10 text-[10px] leading-4 text-slate-500">
        {subtitle}
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-xs leading-5 text-slate-500">
          {empty}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-bold text-slate-500">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-xs font-semibold text-slate-800">
                    {item.title}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {item.category || "Uncategorised"}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                {mode === "top" ? (
                  <>
                    <div>
                      <p className="text-slate-500">Units sold</p>
                      <p className="mt-0.5 font-bold text-slate-800">
                        {item.units30.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Revenue · 30d</p>
                      <p className="mt-0.5 font-bold text-slate-800">
                        {naira(item.revenue30)}
                      </p>
                    </div>
                  </>
                ) : mode === "slow" ? (
                  <>
                    <div>
                      <p className="text-slate-500">Available stock</p>
                      <p className="mt-0.5 font-bold text-amber-700">
                        {item.available.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Units sold · 30d</p>
                      <p className="mt-0.5 font-bold text-slate-800">
                        {item.units30.toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-slate-500">Available stock</p>
                      <p className="mt-0.5 font-bold text-red-700">
                        {item.available.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Units sold · 7d</p>
                      <p className="mt-0.5 font-bold text-slate-800">
                        {item.units7.toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- */
/* STAT CARD */
/* -------------------------------- */

function StatCard({
  label,
  value,
  icon,
  tone,
  fullWidth = false,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "blue" | "purple" | "yellow" | "green" | "sky";
  fullWidth?: boolean;
}) {
  const tones = {
    blue: "bg-sky-50 border-sky-100 text-sky-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    yellow: "bg-amber-50 border-amber-100 text-amber-700",
    green: "bg-emerald-50 border-emerald-100 text-emerald-700",
    sky: "bg-cyan-50 border-cyan-100 text-cyan-700",
  };

  return (
    <div
      className={`group rounded-2xl border p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${
        tones[tone]
      } ${fullWidth ? "col-span-2 lg:col-span-1" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-70 sm:text-xs">
            {label}
          </p>

          <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
            {value}
          </h2>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 text-sm shadow-sm sm:h-9 sm:w-9">
          {icon}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* REVENUE SUMMARY */
/* -------------------------------- */

function RevenueSummary({
  label,
  amount,
  icon,
  tone,
}: {
  label: string;
  amount: number;
  icon: string;
  tone: "emerald" | "indigo" | "sky";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${tones[tone]}`}
        >
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Revenue
          </p>

          <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
            {label}
          </p>
        </div>
      </div>

      <p className="ml-2 whitespace-nowrap text-sm font-extrabold text-slate-900 sm:text-base">
        {naira(amount)}
      </p>
    </div>
  );
}

/* -------------------------------- */
/* MANAGEMENT CARD */
/* -------------------------------- */

function ManagementCard({
  href,
  icon,
  title,
  description,
  action,
  tone,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  action: string;
  tone: "sky" | "indigo" | "purple" | "slate";
}) {
  const tones = {
    sky: "from-sky-500/10 to-cyan-500/5",
    indigo: "from-indigo-500/10 to-blue-500/5",
    purple: "from-purple-500/10 to-fuchsia-500/5",
    slate: "from-slate-500/10 to-gray-500/5",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${tones[tone]} opacity-0 transition group-hover:opacity-100`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-lg shadow-sm">
            {icon}
          </span>

          <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">
            →
          </span>
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-900 sm:text-base">
          {title}
        </h3>

        <p className="mt-1 min-h-[34px] text-[10px] leading-4 text-slate-500 sm:text-xs">
          {description}
        </p>

        <Link
          href={href}
          className="mt-4 inline-flex rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-slate-800 sm:text-xs"
        >
          {action}
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* SNAPSHOT */
/* -------------------------------- */

function Snapshot({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm">{icon}</span>

        <span className="text-lg font-extrabold text-slate-900">
          {value.toLocaleString()}
        </span>
      </div>

      <p className="mt-1 text-[10px] font-medium text-slate-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}