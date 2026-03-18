import { useState, useMemo } from "react";
import { EU_COUNTRIES, findOptimalRoute, getCountry } from "@/data/mockData";
import { RoutePath } from "@/types/vat";
import { MapPin, ArrowRight, TrendingDown, Route, Zap, Clock, Ruler, ChevronDown, ChevronUp, Star, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell
} from "recharts";
import EUMap from "@/components/EUMap";

const RoutePlannerPage = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [packageValue, setPackageValue] = useState(1000);
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [result, setResult] = useState<{ routes: RoutePath[]; optimal: RoutePath | null } | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

  const sortedCountries = useMemo(() => [...EU_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []);

  const handleSearch = () => {
    if (!origin || !destination || origin === destination || packageValue <= 0) return;
    const res = findOptimalRoute(origin, destination, packageValue);
    setResult(res);
    setExpandedRoute(0);
    setSelectedRouteIndex(0);
  };

  const formatPath = (countries: string[]) =>
    countries.map((c) => getCountry(c)?.name || c).join(" → ");

  // Chart data: top 10 routes
  const chartData = useMemo(() => {
    if (!result || result.routes.length === 0) return [];
    return result.routes.slice(0, 10).map((r, i) => ({
      name: `R${i + 1}`,
      label: r.countries.join("→"),
      vat: parseFloat(r.totalVAT.toFixed(2)),
      days: r.totalTransitDays,
      km: r.totalDistanceKm,
      isOptimal: i === 0,
    }));
  }, [result]);

  const selectedRoute = result?.routes[selectedRouteIndex] || result?.routes[0];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Route Planner</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Find the lowest-VAT shipping route between EU countries
        </p>
      </div>

      {/* Input panel */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-accent" /> Origin
            </label>
            <select
              value={origin}
              onChange={(e) => { setOrigin(e.target.value); setResult(null); }}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select country</option>
              {sortedCountries.map((c) => (
                <option key={c.code} value={c.code} disabled={c.code === destination}>
                  {c.name} ({(c.vatRate * 100).toFixed(0)}% VAT)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-destructive" /> Destination
            </label>
            <select
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setResult(null); }}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select country</option>
              {sortedCountries.map((c) => (
                <option key={c.code} value={c.code} disabled={c.code === origin}>
                  {c.name} ({(c.vatRate * 100).toFixed(0)}% VAT)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Package Value (€)</label>
            <input
              type="number"
              value={packageValue}
              onChange={(e) => { setPackageValue(Number(e.target.value)); setResult(null); }}
              min={1}
              max={100000}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={!origin || !destination || origin === destination || packageValue <= 0}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2 justify-center"
        >
          <Route className="h-4 w-4" />
          Find Routes
        </button>
      </div>

      {/* No results */}
      {result && result.routes.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <p className="text-muted-foreground">No routes found between these countries. Try different origin/destination.</p>
        </div>
      )}

      {result && result.routes.length > 0 && (
        <div className="space-y-6">
          {/* Optimal summary */}
          {result.optimal && (
            <div className="bg-accent/10 rounded-xl p-5 border border-accent/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-foreground">Optimal Route — Lowest VAT</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{formatPath(result.optimal.countries)}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1 text-accent font-semibold">
                  <TrendingDown className="h-4 w-4" /> €{result.optimal.totalVAT.toFixed(2)} VAT
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Ruler className="h-4 w-4" /> {result.optimal.totalDistanceKm.toLocaleString()} km
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /> {result.optimal.totalTransitDays} days
                </span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Route list */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-sm text-muted-foreground">{result.routes.length} route{result.routes.length > 1 ? "s" : ""} found — sorted by lowest VAT</p>
              {result.routes.slice(0, 15).map((route, i) => {
                const isOptimal = i === 0;
                const expanded = expandedRoute === i;

                return (
                  <div
                    key={i}
                    className={`bg-card rounded-xl border transition-colors ${isOptimal ? "border-accent/40" : "border-border"} ${selectedRouteIndex === i ? "ring-1 ring-accent/30" : ""} animate-fade-in`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <button
                      onClick={() => {
                        setExpandedRoute(expanded ? null : i);
                        setSelectedRouteIndex(i);
                      }}
                      className="w-full px-5 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isOptimal && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                              <Star className="h-3 w-3" /> Best
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">Route #{i + 1}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-sm">
                          {route.countries.map((code, ci) => (
                            <span key={ci} className="flex items-center gap-1">
                              <span className="font-medium text-foreground">{code}</span>
                              {ci < route.countries.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{route.totalTransitDays}d</span>
                          <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{route.totalDistanceKm.toLocaleString()} km</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 ml-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${isOptimal ? "text-accent" : "text-foreground"}`}>€{route.totalVAT.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">total VAT</p>
                        </div>
                        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                        <div className="grid sm:grid-cols-3 gap-3 text-sm">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="font-semibold text-foreground">{route.totalDistanceKm.toLocaleString()} km</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Transit Time</p>
                            <p className="font-semibold text-foreground">{route.totalTransitDays} day{route.totalTransitDays > 1 ? "s" : ""}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Total Cost (incl. VAT)</p>
                            <p className="font-semibold text-foreground">€{route.totalCostWithVAT.toFixed(2)}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">VAT Breakdown by Country</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                {route.countries[0]}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{getCountry(route.countries[0])?.name} <span className="text-xs text-muted-foreground">(Origin)</span></p>
                              </div>
                              <p className="text-muted-foreground">—</p>
                            </div>

                            {route.vatBreakdown.map((vb, vi) => {
                              const country = getCountry(vb.country)!;
                              const isLast = vi === route.vatBreakdown.length - 1;
                              return (
                                <div key={vi} className="flex items-center gap-3 text-sm">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isLast ? "bg-destructive/10 text-destructive" : "bg-risk-medium-bg text-risk-medium"
                                  }`}>
                                    {vb.country}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">
                                      {country.name}
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({(vb.vatRate * 100).toFixed(0)}% VAT{isLast ? " — Destination" : " — Transit"})
                                      </span>
                                    </p>
                                  </div>
                                  <p className={`font-semibold ${isLast ? "text-destructive" : "text-risk-medium"}`}>
                                    €{vb.vatAmount.toFixed(2)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {!isOptimal && result.optimal && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                            💡 This route costs <span className="font-semibold text-destructive">€{(route.totalVAT - result.optimal.totalVAT).toFixed(2)} more</span> in VAT than the optimal route.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Map showing selected route */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <EUMap
                  highlightRoute={selectedRoute?.countries}
                  selectedCountries={selectedRoute?.countries || []}
                />
              </div>
            </div>
          </div>

          {/* ── Comparison Chart ── */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-5 animate-fade-in">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">All Routes Comparison</h3>
              <span className="text-xs text-muted-foreground">— top {Math.min(chartData.length, 10)} routes</span>
            </div>

            {/* VAT comparison */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Total VAT Cost (€)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} unit="€" />
                  <Tooltip
                    formatter={(value: number) => [`€${value.toFixed(2)}`, "VAT"]}
                    labelFormatter={(label) => {
                      const row = chartData.find(d => d.name === label);
                      return row ? `Route ${label}: ${row.label}` : label;
                    }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="vat" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isOptimal ? "hsl(var(--accent))" : "hsl(var(--muted-foreground) / 0.4)"}
                        stroke={entry.isOptimal ? "hsl(var(--accent))" : "none"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transit days comparison */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Transit Time (days)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} unit="d" allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value} day${value !== 1 ? "s" : ""}`, "Transit"]}
                    labelFormatter={(label) => {
                      const row = chartData.find(d => d.name === label);
                      return row ? `Route ${label}: ${row.label}` : label;
                    }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-days-${index}`}
                        fill={entry.isOptimal ? "hsl(var(--chart-3))" : "hsl(var(--muted-foreground) / 0.3)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-accent" />
                <span>Optimal route</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-muted-foreground/40" />
                <span>Alternative routes</span>
              </div>
            </div>

            {/* Route labels table */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground mb-2">Route Reference</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                {chartData.map((row) => (
                  <div key={row.name} className="flex items-center gap-2 text-xs">
                    <span className={`font-semibold w-6 ${row.isOptimal ? "text-accent" : "text-muted-foreground"}`}>{row.name}</span>
                    <span className="text-muted-foreground truncate">{row.label}</span>
                    <span className="ml-auto font-medium text-foreground shrink-0">€{row.vat} · {row.days}d</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePlannerPage;
