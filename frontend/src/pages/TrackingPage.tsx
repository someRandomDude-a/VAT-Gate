import { MOCK_PACKAGES, getCountry, getPackageProgress, EU_COUNTRIES } from "@/data/mockData";
import { Package as PackageType, PackageStatus } from "@/types/vat";
import { Package, MapPin, ArrowRight, CheckCircle, Clock, AlertTriangle, Truck, ChevronDown, ChevronUp, Plus, X, Navigation } from "lucide-react";
import { useState } from "react";
import EUMap from "@/components/EUMap";

const statusIcon = (status: string) => {
  switch (status) {
    case "delivered": return <CheckCircle className="h-4 w-4 text-risk-low" />;
    case "cleared": return <CheckCircle className="h-4 w-4 text-accent" />;
    case "customs": return <AlertTriangle className="h-4 w-4 text-risk-medium" />;
    case "in_transit": return <Truck className="h-4 w-4 text-accent" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const statusLabel: Record<string, { text: string; class: string }> = {
  delivered: { text: "Delivered", class: "bg-risk-low-bg text-risk-low" },
  cleared: { text: "Cleared", class: "bg-accent/10 text-accent" },
  customs: { text: "At Customs", class: "bg-risk-medium-bg text-risk-medium" },
  in_transit: { text: "In Transit", class: "bg-accent/10 text-accent" },
  pending: { text: "Pending", class: "bg-muted text-muted-foreground" },
};

const sortedCountries = [...EU_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

const TrackingPage = () => {
  const [packages, setPackages] = useState<PackageType[]>(MOCK_PACKAGES);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(MOCK_PACKAGES[0]?.id || null);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(MOCK_PACKAGES[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState<string | null>(null);

  // Add shipment form state
  const [form, setForm] = useState({ description: "", value: "", origin: "", destination: "", currentLocation: "" });
  const [formError, setFormError] = useState("");

  // Update location form state
  const [updateForm, setUpdateForm] = useState({ location: "", status: "in_transit" as PackageStatus["status"], note: "", vatApplied: "" });

  const selectedPackage = packages.find((p) => p.id === selectedPkg);

  const handleAddShipment = () => {
    setFormError("");
    if (!form.description.trim()) return setFormError("Description is required.");
    const val = parseFloat(form.value);
    if (!val || val <= 0) return setFormError("Please enter a valid package value.");
    if (!form.origin) return setFormError("Please select an origin country.");
    if (!form.destination) return setFormError("Please select a destination country.");
    if (form.origin === form.destination) return setFormError("Origin and destination cannot be the same.");

    const newPkg: PackageType = {
      id: `PKG-${Date.now()}`,
      description: form.description.trim(),
      value: val,
      currency: "EUR",
      origin: form.origin,
      destination: form.destination,
      route: [form.origin, form.destination],
      currentLocation: form.origin,
      statuses: [
        {
          location: form.origin,
          status: "cleared",
          timestamp: new Date().toISOString(),
          vatApplied: 0,
          note: `Package registered at ${getCountry(form.origin)?.name}`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setPackages((prev) => [newPkg, ...prev]);
    setExpandedPkg(newPkg.id);
    setSelectedPkg(newPkg.id);
    setShowAddModal(false);
    setForm({ description: "", value: "", origin: "", destination: "", currentLocation: "" });
  };

  const handleUpdateLocation = (pkgId: string) => {
    if (!updateForm.location) return;
    const vatNum = parseFloat(updateForm.vatApplied) || 0;

    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        const newStatus: PackageStatus = {
          location: updateForm.location,
          status: updateForm.status,
          timestamp: new Date().toISOString(),
          vatApplied: vatNum,
          note: updateForm.note.trim() || `Package updated at ${getCountry(updateForm.location)?.name}`,
        };
        // Add location to route if not there
        const newRoute = pkg.route.includes(updateForm.location)
          ? pkg.route
          : [...pkg.route.filter((r) => r !== pkg.destination), updateForm.location, pkg.destination];
        return {
          ...pkg,
          currentLocation: updateForm.location,
          route: newRoute,
          statuses: [...pkg.statuses, newStatus],
        };
      })
    );

    setShowUpdateModal(null);
    setUpdateForm({ location: "", status: "in_transit", note: "", vatApplied: "" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Package Tracking</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track packages across EU borders with real-time VAT updates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Shipment
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Package list */}
        <div className="lg:col-span-3 space-y-4">
          {packages.map((pkg, i) => {
            const expanded = expandedPkg === pkg.id;
            const progress = getPackageProgress(pkg);
            const latestStatus = pkg.statuses[pkg.statuses.length - 1];
            const currentStatusInfo = statusLabel[latestStatus.status] || statusLabel.pending;
            const totalVATApplied = pkg.statuses.reduce((s, st) => s + st.vatApplied, 0);

            return (
              <div
                key={pkg.id}
                className={`bg-card rounded-xl border transition-colors overflow-hidden animate-fade-in ${selectedPkg === pkg.id ? "border-accent/50" : "border-border"}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Header */}
                <button
                  onClick={() => {
                    setExpandedPkg(expanded ? null : pkg.id);
                    setSelectedPkg(pkg.id);
                  }}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-muted-foreground">{pkg.id}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentStatusInfo.class}`}>
                        {currentStatusInfo.text}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{pkg.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <span>{getCountry(pkg.origin)?.name}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{getCountry(pkg.destination)?.name}</span>
                      <span className="ml-2">· €{pkg.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-foreground">€{totalVATApplied.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">VAT applied</p>
                  </div>
                  {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {expanded && (
                  <div className="border-t border-border px-5 py-5 space-y-5">
                    {/* Update location button */}
                    <button
                      onClick={() => {
                        setShowUpdateModal(pkg.id);
                        setUpdateForm({ location: "", status: "in_transit", note: "", vatApplied: "" });
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent/40 text-accent text-xs font-medium hover:bg-accent/10 transition-colors"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Update Location
                    </button>

                    {/* Route progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Route Progress</p>
                        <p className="text-xs text-muted-foreground">{progress}%</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {pkg.route.map((code, ri) => {
                          const routeIndex = pkg.route.indexOf(pkg.currentLocation);
                          const isPast = ri <= routeIndex;
                          const isCurrent = ri === routeIndex;
                          return (
                            <div key={ri} className="flex items-center gap-1 flex-1">
                              <div className="relative flex flex-col items-center">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                                  isCurrent ? "border-accent bg-accent text-accent-foreground" :
                                  isPast ? "border-accent bg-accent/20 text-accent" :
                                  "border-border bg-muted text-muted-foreground"
                                }`}>
                                  {code}
                                </div>
                                <span className="text-[9px] text-muted-foreground mt-1 whitespace-nowrap">
                                  {getCountry(code)?.name}
                                </span>
                              </div>
                              {ri < pkg.route.length - 1 && (
                                <div className={`flex-1 h-0.5 ${isPast && ri < routeIndex ? "bg-accent" : "bg-border"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Border Crossing Timeline</h4>
                      <div className="space-y-0">
                        {pkg.statuses.map((st, si) => {
                          const country = getCountry(st.location);
                          const isLast = si === pkg.statuses.length - 1;
                          return (
                            <div key={si} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="mt-0.5">{statusIcon(st.status)}</div>
                                {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                              </div>
                              <div className="pb-4">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-medium text-foreground">{country?.name}</span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusLabel[st.status]?.class || ""}`}>
                                    {statusLabel[st.status]?.text || st.status}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{st.note}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>{new Date(st.timestamp).toLocaleString()}</span>
                                  {st.vatApplied > 0 && (
                                    <span className="text-risk-medium font-medium">VAT: €{st.vatApplied.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <EUMap
              highlightRoute={selectedPackage?.route}
              currentLocation={selectedPackage?.currentLocation}
              packages={packages}
            />
            {selectedPackage && (
              <div className="mt-3 bg-card rounded-xl border border-border p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">Selected Package</p>
                <p className="text-sm text-muted-foreground truncate">{selectedPackage.description}</p>
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3 text-accent" />
                  <span className="text-foreground font-medium">Currently in {getCountry(selectedPackage.currentLocation)?.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Heading to <span className="font-medium text-foreground">{getCountry(selectedPackage.destination)?.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Shipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Add New Shipment</h2>
              <button onClick={() => { setShowAddModal(false); setFormError(""); }} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Electronics - Laptop"
                  maxLength={100}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Package Value (€)</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="1000"
                  min={1}
                  max={1000000}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Origin</label>
                  <select
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select</option>
                    {sortedCountries.map((c) => (
                      <option key={c.code} value={c.code} disabled={c.code === form.destination}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Destination</label>
                  <select
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select</option>
                    {sortedCountries.map((c) => (
                      <option key={c.code} value={c.code} disabled={c.code === form.origin}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formError && <p className="text-xs text-destructive">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setShowAddModal(false); setFormError(""); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddShipment}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Create Shipment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Location Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Update Package Location</h2>
              <button onClick={() => setShowUpdateModal(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Current Location</label>
                <select
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select country</option>
                  {sortedCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} (VAT: {(c.vatRate * 100).toFixed(0)}%)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as PackageStatus["status"] })}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="in_transit">In Transit</option>
                  <option value="customs">At Customs</option>
                  <option value="cleared">Cleared</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">VAT Applied (€)</label>
                <input
                  type="number"
                  value={updateForm.vatApplied}
                  onChange={(e) => setUpdateForm({ ...updateForm, vatApplied: e.target.value })}
                  placeholder="0.00"
                  min={0}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optional)</label>
                <input
                  type="text"
                  value={updateForm.note}
                  onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })}
                  placeholder="e.g. Cleared at Frankfurt hub"
                  maxLength={150}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowUpdateModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateLocation(showUpdateModal)}
                  disabled={!updateForm.location}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Update Location
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
