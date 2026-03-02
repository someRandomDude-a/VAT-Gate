import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { Package, MapPin, ArrowRight, CheckCircle, Clock, Truck, ChevronDown, ChevronUp, Navigation, Search } from "lucide-react";

type LocationNode = {
  id: number;
  name: string;
  location: string;
  x: number;
  y: number;
};

type BackendPackage = {
  id: number;
  token: string;
  status: "created" | "in_transit" | "delivered";
  current_node: string | null;
  origin_node: string | null;
  destination_node: string | null;
  created_at: string;
};

const statusIcon = (status: string) => {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-risk-low" />;
    case "in_transit":
      return <Truck className="h-4 w-4 text-accent" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const statusLabel: Record<string, { text: string; class: string }> = {
  delivered: { text: "Delivered", class: "bg-risk-low-bg text-risk-low" },
  in_transit: { text: "In Transit", class: "bg-accent/10 text-accent" },
  created: { text: "Created", class: "bg-muted text-muted-foreground" },
};

const TrackingPage = () => {
  const { token } = useAuth();

  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Public tracking
  const [trackToken, setTrackToken] = useState<string>("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState<string>("");

  // Update location modal state
  const [showUpdateModal, setShowUpdateModal] = useState<string | null>(null);
  const [updateNodeId, setUpdateNodeId] = useState<number | "">("");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateError, setUpdateError] = useState<string>("");

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [locations]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      setLoading(true);
      try {
        const locRes = await api.getLocations();
        if (!cancelled) setLocations(locRes?.locations || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load locations");
      }

      if (token) {
        try {
          const pkgRes = await api.getPackages(token);
          if (!cancelled) {
            setPackages(pkgRes?.packages || []);
            setExpandedPkg((pkgRes?.packages || [])?.[0]?.token || null);
          }
        } catch (e: any) {
          if (!cancelled) setError(e?.message || "Failed to load packages");
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refreshPackages = async () => {
    if (!token) return;
    const pkgRes = await api.getPackages(token);
    setPackages(pkgRes?.packages || []);
  };

  const runPublicTracking = async () => {
    setTrackError("");
    setTrackResult(null);
    if (!trackToken.trim()) {
      setTrackError("Enter a package token");
      return;
    }
    try {
      const res = await api.trackPackage(trackToken.trim());
      setTrackResult(res);
    } catch (e: any) {
      setTrackError(e?.message || "Package not found");
    }
  };

  const handleUpdateLocation = async (pkgToken: string) => {
    setUpdateError("");
    if (!token) {
      setUpdateError("You must be logged in to update a package.");
      return;
    }
    if (updateNodeId === "") {
      setUpdateError("Select a location");
      return;
    }

    setUpdateBusy(true);
    try {
      await api.updatePackage(token, pkgToken, Number(updateNodeId));
      await refreshPackages();
      setShowUpdateModal(null);
      setUpdateNodeId("");

      // Optional: refresh public tracking view if it’s the same token
      if (trackToken.trim() === pkgToken) {
        try {
          const res = await api.trackPackage(pkgToken);
          setTrackResult(res);
        } catch {
          // ignore
        }
      }
    } catch (e: any) {
      setUpdateError(e?.message || "Failed to update location");
    } finally {
      setUpdateBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Package Tracking</h1>
          <p className="text-muted-foreground text-sm mt-0.5">View your packages and update their location (stored on-chain in the backend).</p>
        </div>
      </div>

      {/* Public tracking */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-semibold text-foreground mb-3">Public Tracking</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Package token</label>
            <input
              value={trackToken}
              onChange={(e) => setTrackToken(e.target.value)}
              placeholder="e.g. abc-123-xyz"
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={runPublicTracking}
            className="h-11 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            Track
          </button>
        </div>

        {trackError && <p className="text-sm text-destructive mt-3">{trackError}</p>}

        {trackResult && (
          <div className="mt-4 rounded-lg border border-border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-muted-foreground">{trackResult.package_token}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusLabel[trackResult.status]?.class || "bg-muted text-muted-foreground"}`}>
                {statusLabel[trackResult.status]?.text || trackResult.status}
              </span>
            </div>
            <p className="text-sm text-foreground mt-2">
              Last location: <span className="font-medium">{trackResult.last_location || "—"}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Created: {new Date(trackResult.created_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Package list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Your Packages</h3>
            {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          {packages.length === 0 && !loading && !error && (
            <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
              No packages found for this account yet.
            </div>
          )}

          {packages.map((pkg, i) => {
            const expanded = expandedPkg === pkg.token;
            const info = statusLabel[pkg.status] || { text: pkg.status, class: "bg-muted text-muted-foreground" };

            return (
              <div
                key={pkg.token}
                className={`bg-card rounded-xl border transition-colors overflow-hidden animate-fade-in ${expanded ? "border-accent/50" : "border-border"}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <button
                  onClick={() => setExpandedPkg(expanded ? null : pkg.token)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-muted-foreground">{pkg.token}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${info.class}`}>{info.text}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{pkg.origin_node || "—"}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{pkg.destination_node || "—"}</span>
                      {pkg.current_node ? <span className="ml-2">· Now: {pkg.current_node}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(pkg.status)}
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-border px-5 py-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">Created: {new Date(pkg.created_at).toLocaleString()}</p>
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
                    </div>

                    <div className="rounded-lg border border-border p-4 bg-muted/30">
                      <p className="text-sm font-medium text-foreground">Current location</p>
                      <p className="text-sm text-muted-foreground mt-1">{pkg.current_node || "Not yet updated"}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Locations panel */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 h-fit">
          <h3 className="font-semibold text-foreground mb-2">Locations (from backend)</h3>
          <p className="text-xs text-muted-foreground mb-4">These nodes come from /api/routes/locations.</p>
          <div className="max-h-[420px] overflow-auto space-y-2 pr-1">
            {sortedLocations.map((loc) => (
              <div key={loc.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-background">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{loc.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{loc.location}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">ID: {loc.id}</span>
              </div>
            ))}
            {sortedLocations.length === 0 && <p className="text-sm text-muted-foreground">No locations yet.</p>}
          </div>
        </div>
      </div>

      {/* Update modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Update Package Location</h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{showUpdateModal}</p>
            </div>

            <div className="p-5 space-y-4">
              {updateError && <p className="text-sm text-destructive">{updateError}</p>}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New location</label>
                <select
                  value={updateNodeId}
                  onChange={(e) => setUpdateNodeId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a location</option>
                  {sortedLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} (ID: {l.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">This will call /api/packages/update and write a new blockchain event.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowUpdateModal(null);
                    setUpdateNodeId("");
                    setUpdateError("");
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted/30"
                >
                  Cancel
                </button>
                <button
                  disabled={updateBusy}
                  onClick={() => handleUpdateLocation(showUpdateModal)}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {updateBusy ? "Updating..." : "Update"}
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
