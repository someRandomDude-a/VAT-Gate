import { useState, useEffect } from "react";
import { getLocations, calculateRoute } from "@/lib/api";
import {
  MapPin, ArrowRight, TrendingDown, Route, Zap, Clock, ChevronRight, Star,
} from "lucide-react";

interface Location {
  id: number;
  name: string;
  location: string;
}

interface RouteResult {
  path: number[];
  total: number;
}

interface BalancedResult {
  path: number[];
}

interface RouteResponse {
  least_cost_path: RouteResult | null;
  least_time_path: RouteResult | null;
  balanced_path: BalancedResult | null;
}

const RoutePlannerPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [fromNodeId, setFromNodeId] = useState("");
  const [toNodeId, setToNodeId] = useState("");
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getLocations()
      .then((data) => setLocations(data.locations || []))
      .catch(() => setError("Failed to load locations from server."))
      .finally(() => setLocationsLoading(false));
  }, []);

  const getNodeName = (id: number) =>
    locations.find((l) => l.id === id)?.name || `Node ${id}`;

  const formatPath = (path: number[]) =>
    path.map((id) => getNodeName(id)).join(" → ");

  const handleSearch = async () => {
    if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await calculateRoute(Number(fromNodeId), Number(toNodeId));
      setResult(data);
      if (!data.least_cost_path && !data.least_time_path) {
        setError("No route found between these locations.");
      }
    } catch {
      setError("No route found between these locations. Try a different pair.");
    }
    setLoading(false);
  };

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Route Planner</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Find the optimal shipping route between EU locations
        </p>
      </div>

      {/* Input panel */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-accent" /> Origin
            </label>
            <select
              value={fromNodeId}
              onChange={(e) => {
                setFromNodeId(e.target.value);
                setResult(null);
                setError("");
              }}
              disabled={locationsLoading}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">
                {locationsLoading ? "Loading locations..." : "Select location"}
              </option>
              {sortedLocations.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                  disabled={String(l.id) === toNodeId}
                >
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-destructive" /> Destination
            </label>
            <select
              value={toNodeId}
              onChange={(e) => {
                setToNodeId(e.target.value);
                setResult(null);
                setError("");
              }}
              disabled={locationsLoading}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">
                {locationsLoading ? "Loading locations..." : "Select location"}
              </option>
              {sortedLocations.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                  disabled={String(l.id) === fromNodeId}
                >
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={
            !fromNodeId ||
            !toNodeId ||
            fromNodeId === toNodeId ||
            loading ||
            locationsLoading
          }
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2 justify-center"
        >
          <Route className="h-4 w-4" />
          {loading ? "Calculating..." : "Find Routes"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Lowest Cost Route */}
            {result.least_cost_path ? (
              <div className="bg-accent/10 rounded-xl p-5 border border-accent/20 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-foreground">
                    Lowest Cost Route
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {formatPath(result.least_cost_path.path)}
                </p>
                <p className="text-2xl font-bold text-accent">
                  €{result.least_cost_path.total.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  total shipping cost
                </p>

                {/* Path nodes */}
                <div className="mt-4 space-y-1.5">
                  {result.least_cost_path.path.map((id, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-foreground">{getNodeName(id)}</span>
                      {i < result.least_cost_path!.path.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl p-5 border border-border text-center text-muted-foreground text-sm">
                No cost route found
              </div>
            )}

            {/* Fastest Route */}
            {result.least_time_path ? (
              <div className="bg-card rounded-xl p-5 border border-border animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">
                    Fastest Route
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {formatPath(result.least_time_path.path)}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {result.least_time_path.total.toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  total transit time
                </p>

                {/* Path nodes */}
                <div className="mt-4 space-y-1.5">
                  {result.least_time_path.path.map((id, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-foreground">{getNodeName(id)}</span>
                      {i < result.least_time_path!.path.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl p-5 border border-border text-center text-muted-foreground text-sm">
                No time route found
              </div>
            )}

            {/* Balanced Route */}
            {result.balanced_path ? (
              <div className="bg-card rounded-xl p-5 border border-border animate-fade-in relative">
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  <Star className="h-3 w-3" /> Recommended
                </span>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Balanced Route</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {formatPath(result.balanced_path.path)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Optimises both cost and time
                </p>
                <div className="mt-4 space-y-1.5">
                  {result.balanced_path.path.map((id, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-foreground">{getNodeName(id)}</span>
                      {i < result.balanced_path!.path.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl p-5 border border-border text-center text-muted-foreground text-sm">
                No balanced route found
              </div>
            )}
          </div>

          {/* Comparison summary */}
          {(result.least_cost_path || result.least_time_path || result.balanced_path) && (
            <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-foreground">Route Comparison</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-6 text-sm">
                {result.least_cost_path && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Lowest Cost</p>
                    <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                      {result.least_cost_path.path.map((id, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-foreground font-medium">{getNodeName(id)}</span>
                          {i < result.least_cost_path!.path.length - 1 && <ArrowRight className="h-3 w-3" />}
                        </span>
                      ))}
                    </div>
                    <p className="text-accent font-semibold text-base">€{result.least_cost_path.total.toFixed(2)}</p>
                  </div>
                )}
                {result.least_time_path && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fastest</p>
                    <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                      {result.least_time_path.path.map((id, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-foreground font-medium">{getNodeName(id)}</span>
                          {i < result.least_time_path!.path.length - 1 && <ArrowRight className="h-3 w-3" />}
                        </span>
                      ))}
                    </div>
                    <p className="text-foreground font-semibold text-base">{result.least_time_path.total.toFixed(1)} hours</p>
                  </div>
                )}
                {result.balanced_path && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                      Balanced <Star className="h-3 w-3 text-accent" />
                    </p>
                    <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                      {result.balanced_path.path.map((id, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-foreground font-medium">{getNodeName(id)}</span>
                          {i < result.balanced_path!.path.length - 1 && <ArrowRight className="h-3 w-3" />}
                        </span>
                      ))}
                    </div>
                    <p className="text-accent font-semibold text-base">Cost + Time optimised</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoutePlannerPage;
