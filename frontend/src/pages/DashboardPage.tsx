import { useEffect, useMemo, useState } from "react";
import { EU_COUNTRIES } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { Shield, Package, TrendingDown, MapPin, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type BackendPackage = {
  id: number;
  token: string;
  status: "created" | "in_transit" | "delivered";
  current_node: string | null;
  origin_node: string | null;
  destination_node: string | null;
  created_at: string;
};

const DashboardPage = () => {
  const { user, isAdmin, token } = useAuth();
  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [pkgError, setPkgError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setPkgError("");
      try {
        const res = await api.getPackages(token);
        if (cancelled) return;
        setPackages(res?.packages || []);
      } catch (e: any) {
        if (cancelled) return;
        setPkgError(e?.message || "Failed to load packages");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const activePackages = packages.filter((p) => p.status !== "delivered").length;
  const deliveredPackages = packages.filter((p) => p.status === "delivered").length;

  // Keep the VAT analytics demo charts (static) — the backend currently focuses on tracking and routing.
  const vatByCountry = useMemo(() => {
    return EU_COUNTRIES.slice(0, 10)
      .map((c) => ({ country: c.code, rate: c.vatRate * 100 }))
      .sort((a, b) => a.rate - b.rate);
  }, []);

  const statusData = useMemo(() => {
    const inTransit = packages.filter((p) => p.status === "in_transit").length;
    const created = packages.filter((p) => p.status === "created").length;
    const delivered = deliveredPackages;

    return [
      { name: "Created", value: created, color: "hsl(220, 10%, 46%)" },
      { name: "In Transit", value: inTransit, color: "hsl(174, 60%, 40%)" },
      { name: "Delivered", value: delivered, color: "hsl(152, 60%, 42%)" },
    ].filter((d) => d.value > 0);
  }, [packages, deliveredPackages]);

  const kpis = [
    { label: "Active Packages", value: activePackages.toString(), icon: Package, color: "text-accent" },
    { label: "Delivered", value: deliveredPackages.toString(), icon: CheckCircle, color: "text-risk-low" },
    { label: "EU Countries", value: EU_COUNTRIES.length.toString(), icon: MapPin, color: "text-accent" },
    { label: "Total VAT Paid", value: "—", icon: TrendingDown, color: "text-destructive" },
    { label: "Risk Flags", value: "—", icon: AlertTriangle, color: "text-risk-medium" },
    { label: "Monitoring", value: "Live", icon: Shield, color: "text-accent" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back, {user?.name}. {isAdmin && <span className="text-accent font-medium">(Admin)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">Tracking Active</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="bg-card rounded-xl p-4 border border-border animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4">VAT Rates Across EU Countries (Demo)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={vatByCountry}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 89%)" />
              <XAxis dataKey="country" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" unit="%" />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "VAT Rate"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220, 15%, 89%)", fontSize: "13px" }}
              />
              <Bar dataKey="rate" fill="hsl(174, 60%, 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Your Package Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No packages yet.</p>
            ) : (
              statusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{d.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active packages list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Your Shipments</h3>
          <a href="/tracking" className="text-sm text-accent hover:underline">
            View all →
          </a>
        </div>

        {pkgError && (
          <div className="px-5 py-4 text-sm text-destructive border-b border-border">{pkgError}</div>
        )}

        <div className="divide-y divide-border">
          {(packages.length ? packages : []).slice(0, 6).map((pkg) => (
            <div key={pkg.token} className="px-5 py-3 flex items-center gap-4">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{pkg.token}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{pkg.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  {pkg.origin_node || "—"} <ArrowRight className="h-3 w-3" /> {pkg.destination_node || "—"}
                  {pkg.current_node ? <span className="ml-2">· Now: {pkg.current_node}</span> : null}
                </div>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">{new Date(pkg.created_at).toLocaleString()}</span>
            </div>
          ))}

          {packages.length === 0 && !pkgError && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No packages found for this account yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
