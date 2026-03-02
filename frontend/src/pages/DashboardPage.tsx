import { EU_COUNTRIES } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Package, Route, TrendingDown, MapPin, ArrowRight, CheckCircle, AlertTriangle, Truck, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";

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
  const { user, isAdmin, token, logout } = useAuth();
  const [pkgs, setPkgs] = useState<BackendPackage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await api.getPackages(token);
        setPkgs(res?.packages || []);
      } catch (e: any) {
        // If token expired/invalid, force logout to return user to login.
        if (String(e?.message || "").toLowerCase().includes("unauthorized")) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token, logout]);

  const { activePackages, deliveredPackages } = useMemo(() => {
    const delivered = pkgs.filter((p) => p.status === "delivered").length;
    const active = pkgs.length - delivered;
    return { activePackages: active, deliveredPackages: delivered };
  }, [pkgs]);

  // Backend only exposes created/in_transit/delivered right now.
  const atCustoms = 0;

  const vatByCountry = EU_COUNTRIES.slice(0, 10).map((c) => ({
    country: c.code,
    rate: c.vatRate * 100,
  })).sort((a, b) => a.rate - b.rate);

  const statusData = [
    { name: "In Transit", value: MOCK_PACKAGES.filter((p) => p.statuses[p.statuses.length - 1].status === "in_transit").length, color: "hsl(174, 60%, 40%)" },
    { name: "At Customs", value: atCustoms, color: "hsl(38, 92%, 50%)" },
    { name: "Cleared", value: MOCK_PACKAGES.filter((p) => p.statuses[p.statuses.length - 1].status === "cleared").length, color: "hsl(220, 60%, 20%)" },
    { name: "Delivered", value: deliveredPackages, color: "hsl(152, 60%, 42%)" },
  ].filter((d) => d.value > 0);

  const kpis = [
    { label: "Active Packages", value: activePackages.toString(), icon: Package, color: "text-accent" },
    { label: "Delivered", value: deliveredPackages.toString(), icon: CheckCircle, color: "text-risk-low" },
    { label: "At Customs", value: atCustoms.toString(), icon: AlertTriangle, color: "text-risk-medium" },
    { label: "Total Value", value: "—", icon: TrendingDown, color: "text-accent" },
    { label: "Total VAT Paid", value: "—", icon: TrendingDown, color: "text-destructive" },
    { label: "EU Countries", value: EU_COUNTRIES.length.toString(), icon: MapPin, color: "text-accent" },
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
          <div key={kpi.label} className="bg-card rounded-xl p-4 border border-border animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4">VAT Rates Across EU Countries</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={vatByCountry}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 89%)" />
              <XAxis dataKey="country" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" unit="%" />
              <Tooltip formatter={(value: number) => [`${value}%`, "VAT Rate"]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220, 15%, 89%)", fontSize: "13px" }} />
              <Bar dataKey="rate" fill="hsl(174, 60%, 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Package Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active packages list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Active Shipments</h3>
          <a href="/tracking" className="text-sm text-accent hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-border">
          {loading && (
            <div className="px-5 py-6 text-sm text-muted-foreground">Loading shipments…</div>
          )}
          {!loading && pkgs.length === 0 && (
            <div className="px-5 py-6 text-sm text-muted-foreground">No shipments found for this account.</div>
          )}
          {!loading && pkgs.slice(0, 6).map((pkg) => {
            return (
              <div key={pkg.id} className="px-5 py-3 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">PKG-{pkg.id}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    {pkg.origin_node || "—"} <ArrowRight className="h-3 w-3" /> {pkg.destination_node || "—"}
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground capitalize">{pkg.status.replace("_", " ")}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
