import { useState, useEffect, useCallback } from "react";
import {
  getPackages, trackPackage, updatePackage, getLocations,
  createPackage, getPackageAudit, calculateRoute, AuthError,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { EU_COUNTRIES } from "@/data/mockData";
import {
  Package, MapPin, ArrowRight, CheckCircle, Clock, Truck,
  ChevronDown, ChevronUp, X, Navigation, Search, Plus, Copy,
  ShieldCheck, ShieldAlert, AlertCircle, Star, TrendingDown, Zap,
} from "lucide-react";

interface BackendPackage {
  id: number;
  token: string;
  status: string;
  current_node: string | null;
  origin_node: string | null;
  destination_node: string | null;
  created_at: string;
  name: string;
  value: number;
}

interface Location {
  id: number;
  name: string;
  x: number;
  y: number;
}

interface AuditEvent {
  node: string;
  timestamp: string;
  hash: string;
}

interface AuditResult {
  valid: boolean;
  chain_length: number;
  errors: string[];
  history: AuditEvent[];
}

interface RouteResult {
  path: number[];
  total: number;
}

interface RouteResponse {
  least_cost_path: RouteResult | null;
  least_time_path: RouteResult | null;
  balanced_path: { path: number[] } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getVatRate(countryName: string | null): number {
  if (!countryName) return 0;
  return EU_COUNTRIES.find((c) => c.name === countryName)?.vatRate ?? 0;
}

function countryCode(countryName: string): string {
  const found = EU_COUNTRIES.find((c) => c.name === countryName);
  if (found) return found.code;
  return countryName.slice(0, 2).toUpperCase();
}

function fmtPkgId(id: number): string {
  return `PKG-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
}

// ── Route Options Panel ────────────────────────────────────────────────────
interface RouteOptionsPanelProps {
  route: RouteResponse;
  pkg: BackendPackage;
  locationMap: Record<number, string>;
}

const RouteOptionsPanel = ({ route, pkg, locationMap }: RouteOptionsPanelProps) => {
  const destVatRate = getVatRate(pkg.destination_node);
  const vatAmount = pkg.value > 0 && destVatRate > 0 ? pkg.value * destVatRate : null;

  const renderPath = (path: number[]) =>
    path.map((id) => locationMap[id] || `#${id}`).join(" → ");

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        <TrendingDown className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-foreground">Optimal Routes</span>
        {pkg.value > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            Declared value: €{pkg.value.toLocaleString()}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        {/* Balanced (Recommended) */}
        {route.balanced_path && (
          <div className="rounded-lg bg-accent/5 border border-accent/30 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Star className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">Balanced (Recommended)</span>
            </div>
            <p className="text-xs text-foreground font-medium">
              {renderPath(route.balanced_path.path)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Optimised for both cost and speed
            </p>
          </div>
        )}

        {/* Least Cost */}
        {route.least_cost_path && (
          <div className="rounded-lg bg-card border border-border p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-risk-low" />
                <span className="text-xs font-semibold text-foreground">Least Cost Route</span>
              </div>
              <span className="text-xs font-bold text-risk-low">
                €{route.least_cost_path.total.toFixed(0)} shipping
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {renderPath(route.least_cost_path.path)}
            </p>
            {vatAmount !== null && (
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  €{route.least_cost_path.total.toFixed(0)} shipping + €{vatAmount.toFixed(2)} VAT ({(destVatRate * 100).toFixed(0)}%)
                </span>
                <span className="font-bold text-foreground">
                  €{(route.least_cost_path.total + vatAmount).toFixed(2)} total
                </span>
              </div>
            )}
          </div>
        )}

        {/* Least Time */}
        {route.least_time_path && (
          <div className="rounded-lg bg-card border border-border p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-foreground">Fastest Route</span>
              </div>
              <span className="text-xs font-bold text-amber-600">
                {route.least_time_path.total.toFixed(1)}h transit
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {renderPath(route.least_time_path.path)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Route Progress Bar ─────────────────────────────────────────────────────
interface RouteProgressProps {
  pkg: BackendPackage;
  audit: AuditResult | null;
  routeData: RouteResponse | null;
  locationMap: Record<number, string>;
  loading: boolean;
}

const RouteProgressBar = ({ pkg, audit, routeData, locationMap, loading }: RouteProgressProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">Loading route...</p>
      </div>
    );
  }

  // Use planned route from balanced or least_cost path
  const plannedIds =
    routeData?.balanced_path?.path ||
    routeData?.least_cost_path?.path ||
    [];
  const plannedNodes = plannedIds.map((id) => locationMap[id] || `#${id}`);

  // Fallback: visited nodes from audit + destination
  const visitedNodes = audit?.history.map((e) => e.node) ?? [];
  const allSteps: string[] =
    plannedNodes.length > 0
      ? plannedNodes
      : (() => {
          const steps: string[] = [];
          const seen = new Set<string>();
          for (const n of visitedNodes) {
            if (!seen.has(n)) { steps.push(n); seen.add(n); }
          }
          if (pkg.destination_node && !seen.has(pkg.destination_node)) {
            steps.push(pkg.destination_node);
          }
          if (steps.length === 0) {
            if (pkg.origin_node) steps.push(pkg.origin_node);
            if (pkg.destination_node) steps.push(pkg.destination_node);
          }
          return steps;
        })();

  if (allSteps.length === 0) return null;

  const uniqueVisited = [...new Set(visitedNodes)];
  // Count how many planned steps have been visited
  const visitedPlannedCount = allSteps.filter((s) => uniqueVisited.includes(s)).length;
  const pct = allSteps.length > 1
    ? Math.round((visitedPlannedCount / (allSteps.length - 1)) * 100)
    : pkg.status === "delivered" ? 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold text-foreground">Route Progress</span>
        </div>
        <span className="text-xs font-bold text-accent">{pct}%</span>
      </div>
      <div className="px-6 py-5">
        <div className="relative flex items-start justify-between">
          {/* Background track */}
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-border" />
          {/* Filled progress */}
          {pct > 0 && (
            <div
              className="absolute left-4 top-4 h-0.5 bg-accent transition-all"
              style={{ right: `${(100 - pct) / 100 * (100 - 8)}%` }}
            />
          )}
          {/* Steps */}
          {allSteps.map((step, i) => {
            const visited = uniqueVisited.includes(step);
            const isCurrent = step === pkg.current_node;
            const code = countryCode(step);
            return (
              <div key={i} className="relative flex flex-col items-center z-10" style={{ minWidth: 40 }}>
                <div
                  className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    visited
                      ? "bg-accent border-accent text-accent-foreground"
                      : "bg-card border-border text-muted-foreground"
                  } ${isCurrent ? "ring-2 ring-accent/30 ring-offset-1" : ""}`}
                >
                  {visited
                    ? <CheckCircle className="h-3.5 w-3.5" />
                    : <span className="text-[9px] font-bold">{code}</span>
                  }
                </div>
                <span className={`mt-1.5 text-[10px] font-semibold ${visited ? "text-accent" : "text-muted-foreground"}`}>
                  {code}
                </span>
                {isCurrent && (
                  <span className="mt-0.5 text-[9px] text-accent font-bold tracking-tight">HERE</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Border Crossing Timeline ───────────────────────────────────────────────
interface TimelineProps {
  pkg: BackendPackage;
  audit: AuditResult | null;
  loading: boolean;
}

const BorderCrossingTimeline = ({ pkg, audit, loading }: TimelineProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  if (!audit || audit.history.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          No events recorded yet. Update the package location to begin tracking.
        </p>
      </div>
    );
  }

  const events = audit.history;
  const lastIdx = events.length - 1;
  const isInTransit = pkg.status === "in_transit";
  const destVatRate = getVatRate(pkg.destination_node);
  const vatAmount = pkg.value > 0 && destVatRate > 0 ? pkg.value * destVatRate : null;

  function getDescription(event: AuditEvent, idx: number): string {
    if (idx === 0) return `Package dispatched from ${event.node} warehouse`;
    if (idx === lastIdx && isInTransit)
      return `Package arrived at ${event.node} – VAT assessment in progress`;
    return `Package arrived at ${event.node} – cleared for transit`;
  }

  function getBadge(event: AuditEvent, idx: number): { text: string; className: string } {
    if (idx === lastIdx && isInTransit)
      return { text: "At Customs", className: "bg-amber-100 text-amber-700" };
    if (event.node === pkg.destination_node)
      return { text: "Delivered", className: "bg-risk-low-bg text-risk-low" };
    return { text: "Cleared", className: "bg-accent/10 text-accent" };
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold text-foreground">Border Crossing Timeline</span>
        </div>
        <div className="flex items-center gap-1.5">
          {audit.valid ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-risk-low" />
              <span className="text-[10px] font-semibold text-risk-low">
                Chain Valid ({audit.chain_length} block{audit.chain_length !== 1 ? "s" : ""})
              </span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] font-semibold text-destructive">Tampered</span>
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {events.map((event, i) => {
          const isLast = i === lastIdx;
          const badge = getBadge(event, i);
          const desc = getDescription(event, i);
          const showVat = isLast && isInTransit && vatAmount !== null;

          return (
            <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && (
                <div className="absolute left-3.5 top-7 bottom-0 w-px bg-border" />
              )}
              <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                isLast && isInTransit ? "bg-amber-100" : "bg-accent/10"
              }`}>
                {isLast && isInTransit
                  ? <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  : <CheckCircle className="h-3.5 w-3.5 text-accent" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{event.node}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.className}`}>
                    {badge.text}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {new Date(event.timestamp).toLocaleString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                {showVat && (
                  <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-xs font-bold text-amber-700">
                      VAT: €{vatAmount!.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-amber-600">
                      ({(destVatRate * 100).toFixed(0)}% on €{pkg.value.toLocaleString()})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {audit.errors.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-destructive/5">
          {audit.errors.map((err, i) => (
            <p key={i} className="text-[10px] text-destructive">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Status helpers ─────────────────────────────────────────────────────────
const statusLabel: Record<string, { text: string; class: string }> = {
  delivered:  { text: "Delivered",  class: "bg-risk-low-bg text-risk-low" },
  in_transit: { text: "In Transit", class: "bg-accent/10 text-accent" },
  created:    { text: "Created",    class: "bg-muted text-muted-foreground" },
};

const statusIcon = (status: string) => {
  switch (status) {
    case "delivered":  return <CheckCircle className="h-4 w-4 text-risk-low" />;
    case "in_transit": return <Truck className="h-4 w-4 text-accent" />;
    default:           return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

// ── Main page ──────────────────────────────────────────────────────────────
const TrackingPage = () => {
  const { token, logout } = useAuth();

  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [packagesError, setPackagesError] = useState("");
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lazy-loaded data keyed by package token
  const [auditData, setAuditData] = useState<Record<string, AuditResult>>({});
  const [auditLoading, setAuditLoading] = useState<Record<string, boolean>>({});
  const [routeData, setRouteData] = useState<Record<string, RouteResponse>>({});
  const [routeLoading, setRouteLoading] = useState<Record<string, boolean>>({});

  const [trackInput, setTrackInput] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState<string | null>(null);
  const [updateNodeId, setUpdateNodeId] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addOriginId, setAddOriginId] = useState("");
  const [addDestId, setAddDestId] = useState("");
  const [addName, setAddName] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // Map node ID → name for route display
  const locationMap: Record<number, string> = {};
  for (const loc of locations) {
    locationMap[loc.id] = loc.name;
  }

  const loadData = useCallback(async () => {
    setError("");
    setPackagesError("");
    let locationsOk = true;

    try {
      const locsData = await getLocations();
      setLocations(locsData.locations || []);
    } catch {
      locationsOk = false;
    }

    if (!locationsOk) {
      setError("Cannot connect to backend. Is the server running?");
      setLoading(false);
      return;
    }

    if (token) {
      try {
        const pkgsData = await getPackages(token);
        setPackages(pkgsData.packages || []);
      } catch (e) {
        if (e instanceof AuthError) {
          // Stale token — clear it so the user is sent back to login
          logout();
          return;
        }
        setPackages([]);
        setPackagesError("Could not load your packages. Try again or sign out and back in.");
      }
    }

    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExpand = useCallback(async (pkg: BackendPackage) => {
    const pkgToken = pkg.token;
    const isExpanding = expandedPkg !== pkgToken;
    setExpandedPkg(isExpanding ? pkgToken : null);
    setSelectedPkg(pkgToken);

    if (!isExpanding) return;

    // Fetch audit if not cached
    if (!auditData[pkgToken] && !auditLoading[pkgToken]) {
      setAuditLoading((prev) => ({ ...prev, [pkgToken]: true }));
      try {
        const data = await getPackageAudit(pkgToken);
        setAuditData((prev) => ({ ...prev, [pkgToken]: data }));
      } catch { /* non-critical */ } finally {
        setAuditLoading((prev) => ({ ...prev, [pkgToken]: false }));
      }
    }

    // Fetch route if not cached and we have origin/destination
    if (!routeData[pkgToken] && !routeLoading[pkgToken] && pkg.origin_node && pkg.destination_node) {
      const originLoc = locations.find((l) => l.name === pkg.origin_node);
      const destLoc = locations.find((l) => l.name === pkg.destination_node);
      if (originLoc && destLoc) {
        setRouteLoading((prev) => ({ ...prev, [pkgToken]: true }));
        try {
          const data = await calculateRoute(originLoc.id, destLoc.id);
          setRouteData((prev) => ({ ...prev, [pkgToken]: data }));
        } catch { /* non-critical */ } finally {
          setRouteLoading((prev) => ({ ...prev, [pkgToken]: false }));
        }
      }
    }
  }, [expandedPkg, auditData, auditLoading, routeData, routeLoading, locations]);

  const handleTrack = async () => {
    if (!trackInput.trim()) return;
    setTrackLoading(true); setTrackError(""); setTrackResult(null);
    try {
      setTrackResult(await trackPackage(trackInput.trim()));
    } catch {
      setTrackError("Package not found. Check the token and try again.");
    }
    setTrackLoading(false);
  };

  const handleUpdateLocation = async () => {
    if (!showUpdateModal || !updateNodeId || !token) return;
    setUpdateLoading(true); setUpdateError("");
    try {
      await updatePackage(token, showUpdateModal, Number(updateNodeId));
      // Invalidate caches for this package
      setAuditData((prev) => { const n = { ...prev }; delete n[showUpdateModal]; return n; });
      setRouteData((prev) => { const n = { ...prev }; delete n[showUpdateModal]; return n; });
      setShowUpdateModal(null); setUpdateNodeId("");
      await loadData();
    } catch (e: any) {
      setUpdateError(e.message || "Failed to update location.");
    }
    setUpdateLoading(false);
  };

  const handleAddPackage = async () => {
    if (!addOriginId || !addDestId || !token) return;
    setAddLoading(true); setAddError("");
    try {
      const data = await createPackage(
        token, Number(addOriginId), Number(addDestId),
        addName.trim(), addValue !== "" ? Number(addValue) : 0
      );
      setCreatedToken(data.token);
      // Optimistically prepend the new package so it's visible immediately
      if (data.package) {
        setPackages((prev) => [data.package, ...prev]);
      }
      setAddOriginId(""); setAddDestId(""); setAddName(""); setAddValue("");
    } catch (e: any) {
      setAddError(e.message || "Failed to create package.");
    }
    setAddLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">Loading packages...</p>
      </div>
    );
  }

  const sortedLocations = [...locations].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Package Tracking</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track packages across EU borders with real-time updates
        </p>
      </div>

      {/* Track by token */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Track a Package</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            placeholder="Enter package token..."
            className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleTrack}
            disabled={!trackInput.trim() || trackLoading}
            className="px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {trackLoading ? "Searching..." : "Track"}
          </button>
        </div>
        {trackError && <p className="text-xs text-destructive">{trackError}</p>}
        {trackResult && (
          <div className="rounded-lg border border-border p-4 text-sm space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{trackResult.package_token}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusLabel[trackResult.status]?.class || "bg-muted text-muted-foreground"}`}>
                {statusLabel[trackResult.status]?.text || trackResult.status}
              </span>
            </div>
            {trackResult.last_location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-accent" />
                <span>Currently in <span className="font-medium text-foreground">{trackResult.last_location}</span></span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Created: {new Date(trackResult.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={loadData} className="text-xs text-accent underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* My Packages */}
      {token && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">My Packages ({packages.length})</h2>
            <button
              onClick={() => { setShowAddModal(true); setCreatedToken(null); setAddError(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Package
            </button>
          </div>

          {packagesError && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-5 py-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive">{packagesError}</p>
                <button onClick={loadData} className="text-xs text-accent underline hover:no-underline mt-1">
                  Try again
                </button>
              </div>
            </div>
          )}

          {!packagesError && packages.length === 0 && (
            <div className="bg-card rounded-xl p-8 border border-border text-center">
              <p className="text-muted-foreground">No packages found. Use the tracker above or add a new package.</p>
            </div>
          )}

          {packages.length > 0 && (
            <div className="space-y-4">
              {packages.map((pkg, i) => {
                const expanded = expandedPkg === pkg.token;
                const statusInfo = statusLabel[pkg.status] || statusLabel.created;
                const destVatRate = getVatRate(pkg.destination_node);
                const vatAmount = pkg.value > 0 && destVatRate > 0
                  ? pkg.value * destVatRate
                  : null;
                const pkgRouteData = routeData[pkg.token] ?? null;
                const pkgRouteLoading = routeLoading[pkg.token] ?? false;

                return (
                  <div
                    key={pkg.token}
                    className={`bg-card rounded-xl border transition-colors overflow-hidden animate-fade-in ${
                      selectedPkg === pkg.token ? "border-accent/50" : "border-border"
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => handleExpand(pkg)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        {statusIcon(pkg.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {fmtPkgId(pkg.id)}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                          {vatAmount !== null && (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0 border border-amber-200">
                              €{vatAmount.toFixed(2)} VAT applied
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-foreground truncate">
                          {pkg.name || (
                            <span className="text-muted-foreground text-xs font-normal">{pkg.token.slice(0, 24)}…</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <span>{pkg.origin_node || "—"}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{pkg.destination_node || "—"}</span>
                          {pkg.value > 0 && (
                            <span className="ml-1 text-accent font-medium">· €{pkg.value.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      {expanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      }
                    </button>

                    {/* Expanded detail */}
                    {expanded && (
                      <div className="border-t border-border px-5 py-5 space-y-5">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setShowUpdateModal(pkg.token);
                              setUpdateNodeId("");
                              setUpdateError("");
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent/40 text-accent text-xs font-medium hover:bg-accent/10 transition-colors"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Update Location
                          </button>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(pkg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        {/* Location grid */}
                        <div className="grid sm:grid-cols-3 gap-3 text-sm">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Origin</p>
                            <p className="font-semibold text-foreground">{pkg.origin_node || "—"}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Current Location</p>
                            <p className="font-semibold text-foreground">{pkg.current_node || "Not dispatched"}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Destination</p>
                            <p className="font-semibold text-foreground">{pkg.destination_node || "—"}</p>
                          </div>
                        </div>

                        {/* Optimal Routes (loaded with route data) */}
                        {pkgRouteLoading && (
                          <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground">Calculating optimal routes...</p>
                          </div>
                        )}
                        {pkgRouteData && !pkgRouteLoading && (
                          <RouteOptionsPanel
                            route={pkgRouteData}
                            pkg={pkg}
                            locationMap={locationMap}
                          />
                        )}

                        {/* Route Progress Bar */}
                        <RouteProgressBar
                          pkg={pkg}
                          audit={auditData[pkg.token] ?? null}
                          routeData={pkgRouteData}
                          locationMap={locationMap}
                          loading={auditLoading[pkg.token] ?? false}
                        />

                        {/* Border Crossing Timeline */}
                        <BorderCrossingTimeline
                          pkg={pkg}
                          audit={auditData[pkg.token] ?? null}
                          loading={auditLoading[pkg.token] ?? false}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Add Package</h2>
              <button
                onClick={() => {
                  if (createdToken) loadData();
                  setShowAddModal(false);
                  setCreatedToken(null);
                  setAddName("");
                  setAddValue("");
                }}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {createdToken ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-risk-low-bg border border-risk-low/30 p-4 space-y-2">
                  <p className="text-sm font-medium text-risk-low">Package created!</p>
                  <p className="text-xs text-muted-foreground">Save this tracking token:</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-foreground bg-muted rounded px-2 py-1 flex-1 truncate">
                      {createdToken}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(createdToken)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                      title="Copy token"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setCreatedToken(null);
                    setAddName("");
                    setAddValue("");
                    loadData(); // Reconcile with server state
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Origin</label>
                  <select
                    value={addOriginId}
                    onChange={(e) => setAddOriginId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select origin</option>
                    {sortedLocations.map((l) => (
                      <option key={l.id} value={l.id} disabled={String(l.id) === addDestId}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Destination</label>
                  <select
                    value={addDestId}
                    onChange={(e) => setAddDestId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select destination</option>
                    {sortedLocations.map((l) => (
                      <option key={l.id} value={l.id} disabled={String(l.id) === addOriginId}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Goods Name <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Electronics Shipment"
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Goods Value (€) <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={addValue}
                    onChange={(e) => setAddValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {addError && <p className="text-xs text-destructive">{addError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPackage}
                    disabled={!addOriginId || !addDestId || addLoading}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {addLoading ? "Creating..." : "Create Package"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Location Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Update Package Location</h2>
              <button
                onClick={() => setShowUpdateModal(null)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">New Location</label>
                <select
                  value={updateNodeId}
                  onChange={(e) => setUpdateNodeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select location</option>
                  {sortedLocations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              {updateError && <p className="text-xs text-destructive">{updateError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowUpdateModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLocation}
                  disabled={!updateNodeId || updateLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {updateLoading ? "Updating..." : "Update Location"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
