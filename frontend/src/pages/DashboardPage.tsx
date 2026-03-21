import { useState, useEffect, useCallback } from "react";
import { EU_COUNTRIES } from "@/data/mockData";
import { getPackages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Package, MapPin, ArrowRight, CheckCircle, AlertTriangle, Truck, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface BackendPackage {
  id: number;
  token: string;
  status: "created" | "in_transit" | "delivered";
  current_node: string | null;
  origin_node: string | null;
  destination_node: string | null;
  created_at: string;
  value: number;
  name: string;
}

const statusIcon = (status: string) => {
  switch (status) {
    case "delivered":  return <CheckCircle className="h-4 w-4 text-risk-low" />;
    case "in_transit": return <Truck className="h-4 w-4 text-accent" />;
    default:           return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const DashboardPage = () => {
  const { user, isAdmin, token } = useAuth();
  const [packages, setPackages] = useState<BackendPackage[]>([]);

  const fetchPackages = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getPackages(token);
      setPackages(data.packages || []);
    } catch {
      // Silently keep previous data on refresh failure
    }
  }, [token]);

  useEffect(() => {
    fetchPackages();
    const interval = setInterval(fetchPackages, 30_000);
    return () => clearInterval(interval);
  }, [fetchPackages]);

  // KPI counts derived from real backend data
  const activePackages  = packages.filter((p) => p.status !== "delivered").length;
  const deliveredCount  = packages.filter((p) => p.status === "delivered").length;
  const inTransitCount  = packages.filter((p) => p.status === "in_transit").length;
  const totalValue      = packages.reduce((s, p) => s + (p.value || 0), 0);

  const vatByCountry = EU_COUNTRIES.slice(0, 10).map((c) => ({
    country: c.code,
    rate: c.vatRate * 100,
  })).sort((a, b) => a.rate - b.rate);

  const statusData = [
    { name: "In Transit", value: inTransitCount,                                                           color: "hsl(174, 60%, 40%)" },
    { name: "Created",    value: packages.filter((p) => p.status === "created").length,                   color: "hsl(220, 60%, 20%)" },
    { name: "Delivered",  value: deliveredCount,                                                           color: "hsl(152, 60%, 42%)" },
  ].filter((d) => d.value > 0);

  const kpis = [
    { label: "Active Packages", value: activePackages.toString(),               icon: Package,       color: "text-accent" },
    { label: "Delivered",        value: deliveredCount.toString(),               icon: CheckCircle,   color: "text-risk-low" },
    { label: "In Transit",       value: inTransitCount.toString(),               icon: Truck,         color: "text-risk-medium" },
    { label: "Total Value",      value: `€${totalValue.toLocaleString()}`,       icon: AlertTriangle, color: "text-accent" },
    { label: "Total Packages",   value: packages.length.toString(),              icon: Package,       color: "text-destructive" },
    { label: "EU Countries",     value: EU_COUNTRIES.length.toString(),          icon: MapPin,        color: "text-accent" },
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
          {statusData.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No packages yet
            </div>
          )}
        </div>
      </div>

      {/* Active packages list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Active Shipments</h3>
          <a href="/tracking" className="text-sm text-accent hover:underline">View all →</a>
        </div>
        {packages.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">
            No shipments found. <a href="/tracking" className="text-accent hover:underline">Add a package</a> to get started.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {packages.slice(0, 4).map((pkg) => (
              <div key={pkg.token} className="px-5 py-3 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  {statusIcon(pkg.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {pkg.name ? (
                      <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{pkg.name}</span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">{pkg.token.slice(0, 20)}…</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <span>{pkg.origin_node || "—"}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{pkg.destination_node || "—"}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    pkg.status === "delivered"  ? "bg-risk-low-bg text-risk-low" :
                    pkg.status === "in_transit" ? "bg-accent/10 text-accent" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {pkg.status === "delivered" ? "Delivered" : pkg.status === "in_transit" ? "In Transit" : "Created"}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">€{(pkg.value || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
