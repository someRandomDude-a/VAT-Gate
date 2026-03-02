import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { Package, ChevronDown, ChevronUp, Navigation, CheckCircle, Truck, Clock, AlertTriangle } from "lucide-react";

type BackendPackage = {
  id: number;
  token: string;
  status: "created" | "in_transit" | "delivered";
  current_node: string | null;
  origin_node: string | null;
  destination_node: string | null;
  created_at: string;
};

type LocationNode = {
  id: number;
  name: string;
  location: string;
  x: number;
  y: number;
};

const statusIcon = (status: BackendPackage["status"]) => {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-risk-low" />;
    case "in_transit":
      return <Truck className="h-4 w-4 text-accent" />;
    case "created":
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const statusLabel: Record<BackendPackage["status"], { text: string; class: string }> = {
  delivered: { text: "Delivered", class: "bg-risk-low-bg text-risk-low" },
  in_transit: { text: "In Transit", class: "bg-accent/10 text-accent" },
  created: { text: "Created", class: "bg-muted text-muted-foreground" },
};

const TrackingPage = () => {
  const { token, logout } = useAuth();
  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [expandedPkg, setExpandedPkg] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [updateModalFor, setUpdateModalFor] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | "">("");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [auditByToken, setAuditByToken] = useState<Record<string, any>>({});

  const selectedPackage = useMemo(() => packages.find((p) => p.id === expandedPkg) || null, [packages, expandedPkg]);

  const refreshPackages = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.getPackages(token);
      setPackages(res?.packages || []);
      if ((res?.packages || []).length > 0 && expandedPkg == null) {
        setExpandedPkg((res.packages[0] as BackendPackage).id);
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to fetch packages";
      // Token expired / unauthorized
      if (String(msg).toLowerCase().includes("unauthorized")) logout();
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    // Locations are public
    api
      .getLocations()
      .then((res) => setLocations(res?.locations || []))
      .catch(() => setLocations([]));
  }, []);

  const openAudit = async (pkgToken: string) => {
    if (auditByToken[pkgToken]) return;
    try {
      const res = await api.auditPackage(pkgToken);
      setAuditByToken((prev) => ({ ...prev, [pkgToken]: res }));
    } catch {
      setAuditByToken((prev) => ({ ...prev, [pkgToken]: { error: "Failed to load audit history" } }));
    }
  };

  const handleUpdateLocation = async (pkg: BackendPackage) => {
    if (!token) return;
    if (!selectedNodeId) return;
    setUpdateBusy(true);
    try {
      await api.updatePackage(token, pkg.token, Number(selectedNodeId));
      // refresh package list and audit
      await refreshPackages();
      setAuditByToken((prev) => {
        const next = { ...prev };
        delete next[pkg.token];
        return next;
      });
      setUpdateModalFor(null);
      setSelectedNodeId("");
    } catch (e: any) {
      setError(e?.message || "Failed to update package");
    } finally {
      setUpdateBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Package Tracking</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track shipments and verify the blockchain audit trail</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && <div className="text-sm text-muted-foreground">Loading shipments…</div>}
        {!loading && packages.length === 0 && (
          <div className="text-sm text-muted-foreground">No shipments found for this account.</div>
        )}

        {packages.map((pkg, i) => {
          const expanded = expandedPkg === pkg.id;
          const currentStatusInfo = statusLabel[pkg.status];
          return (
            <div
              key={pkg.id}
              className={`bg-card rounded-xl border transition-colors overflow-hidden animate-fade-in ${expanded ? "border-accent/50" : "border-border"}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <button
                onClick={() => {
                  setExpandedPkg(expanded ? null : pkg.id);
                  if (!expanded) openAudit(pkg.token);
                }}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-muted-foreground">PKG-{pkg.id}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentStatusInfo.class}`}>{currentStatusInfo.text}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">Token: {pkg.token}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{pkg.origin_node || "—"}</span>
                    <span className="text-muted-foreground/60">→</span>
                    <span>{pkg.destination_node || "—"}</span>
                    <span className="ml-2">· Current: {pkg.current_node || "—"}</span>
                  </div>
                </div>
                {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {expanded && (
                <div className="border-t border-border px-5 py-5 space-y-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-muted-foreground">
                      Created: <span className="text-foreground">{new Date(pkg.created_at).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => {
                        setUpdateModalFor(pkg.id);
                        setSelectedNodeId("");
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent/40 text-accent text-xs font-medium hover:bg-accent/10 transition-colors"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Update Location
                    </button>
                  </div>

                  {/* Audit trail */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Blockchain Audit Trail</h4>
                    {auditByToken[pkg.token]?.error && (
                      <div className="text-sm text-destructive">{auditByToken[pkg.token].error}</div>
                    )}
                    {!auditByToken[pkg.token] && (
                      <div className="text-sm text-muted-foreground">Loading history…</div>
                    )}
                    {auditByToken[pkg.token]?.history && (
                      <div className="space-y-0">
                        {auditByToken[pkg.token].history.map((h: any, idx: number) => {
                          const isLast = idx === auditByToken[pkg.token].history.length - 1;
                          return (
                            <div key={idx} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="mt-0.5">{statusIcon(pkg.status)}</div>
                                {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                              </div>
                              <div className="pb-4">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-medium text-foreground">{h.node}</span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Block {idx + 1}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</p>
                                <p className="text-[11px] text-muted-foreground mt-1 font-mono break-all">{h.hash}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Update modal inline */}
                  {updateModalFor === pkg.id && (
                    <div className="rounded-xl border border-border p-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Update current location</p>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setUpdateModalFor(null);
                            setSelectedNodeId("");
                          }}
                        >
                          Close
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3">
                        <select
                          value={selectedNodeId}
                          onChange={(e) => setSelectedNodeId(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                        >
                          <option value="">Select a location…</option>
                          {locations.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name} ({n.location})
                            </option>
                          ))}
                        </select>

                        <button
                          disabled={!selectedNodeId || updateBusy}
                          onClick={() => handleUpdateLocation(pkg)}
                          className="w-full py-2.5 px-4 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {updateBusy ? "Updating…" : "Update"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingPage;
