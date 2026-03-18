import { EUCountry, Route, RoutePath, Package, PackageStatus } from "@/types/vat";

// EU Countries with standard VAT rates (2026)
export const EU_COUNTRIES: EUCountry[] = [
  { code: "DE", name: "Germany", vatRate: 0.19, position: { x: 50, y: 35 } },
  { code: "FR", name: "France", vatRate: 0.20, position: { x: 35, y: 50 } },
  { code: "NL", name: "Netherlands", vatRate: 0.21, position: { x: 45, y: 25 } },
  { code: "BE", name: "Belgium", vatRate: 0.21, position: { x: 40, y: 32 } },
  { code: "LU", name: "Luxembourg", vatRate: 0.17, position: { x: 42, y: 38 } },
  { code: "AT", name: "Austria", vatRate: 0.20, position: { x: 58, y: 42 } },
  { code: "IT", name: "Italy", vatRate: 0.22, position: { x: 52, y: 60 } },
  { code: "ES", name: "Spain", vatRate: 0.21, position: { x: 22, y: 65 } },
  { code: "PT", name: "Portugal", vatRate: 0.23, position: { x: 12, y: 62 } },
  { code: "PL", name: "Poland", vatRate: 0.23, position: { x: 65, y: 30 } },
  { code: "CZ", name: "Czech Republic", vatRate: 0.21, position: { x: 58, y: 35 } },
  { code: "SK", name: "Slovakia", vatRate: 0.20, position: { x: 63, y: 38 } },
  { code: "HU", name: "Hungary", vatRate: 0.27, position: { x: 65, y: 44 } },
  { code: "SI", name: "Slovenia", vatRate: 0.22, position: { x: 56, y: 48 } },
  { code: "HR", name: "Croatia", vatRate: 0.25, position: { x: 60, y: 52 } },
  { code: "DK", name: "Denmark", vatRate: 0.25, position: { x: 48, y: 18 } },
  { code: "SE", name: "Sweden", vatRate: 0.25, position: { x: 55, y: 10 } },
  { code: "IE", name: "Ireland", vatRate: 0.23, position: { x: 18, y: 28 } },
  { code: "GR", name: "Greece", vatRate: 0.24, position: { x: 68, y: 65 } },
  { code: "RO", name: "Romania", vatRate: 0.19, position: { x: 75, y: 48 } },
  { code: "BG", name: "Bulgaria", vatRate: 0.20, position: { x: 78, y: 55 } },
];

// Direct connections between bordering/linked countries
export const EU_ROUTES: Route[] = [
  // Germany connections
  { from: "DE", to: "FR", distanceKm: 880, transitDays: 1 },
  { from: "DE", to: "NL", distanceKm: 660, transitDays: 1 },
  { from: "DE", to: "BE", distanceKm: 750, transitDays: 1 },
  { from: "DE", to: "LU", distanceKm: 600, transitDays: 1 },
  { from: "DE", to: "AT", distanceKm: 680, transitDays: 1 },
  { from: "DE", to: "PL", distanceKm: 570, transitDays: 1 },
  { from: "DE", to: "CZ", distanceKm: 350, transitDays: 1 },
  { from: "DE", to: "DK", distanceKm: 460, transitDays: 1 },
  // France connections
  { from: "FR", to: "BE", distanceKm: 310, transitDays: 1 },
  { from: "FR", to: "LU", distanceKm: 380, transitDays: 1 },
  { from: "FR", to: "IT", distanceKm: 1100, transitDays: 2 },
  { from: "FR", to: "ES", distanceKm: 1050, transitDays: 2 },
  // Benelux
  { from: "NL", to: "BE", distanceKm: 200, transitDays: 1 },
  { from: "BE", to: "LU", distanceKm: 190, transitDays: 1 },
  // Central Europe
  { from: "AT", to: "CZ", distanceKm: 330, transitDays: 1 },
  { from: "AT", to: "SK", distanceKm: 80, transitDays: 1 },
  { from: "AT", to: "HU", distanceKm: 250, transitDays: 1 },
  { from: "AT", to: "SI", distanceKm: 380, transitDays: 1 },
  { from: "AT", to: "IT", distanceKm: 880, transitDays: 1 },
  { from: "CZ", to: "SK", distanceKm: 330, transitDays: 1 },
  { from: "CZ", to: "PL", distanceKm: 530, transitDays: 1 },
  { from: "SK", to: "HU", distanceKm: 200, transitDays: 1 },
  { from: "SK", to: "PL", distanceKm: 460, transitDays: 1 },
  { from: "HU", to: "HR", distanceKm: 350, transitDays: 1 },
  { from: "HU", to: "RO", distanceKm: 830, transitDays: 2 },
  { from: "SI", to: "HR", distanceKm: 140, transitDays: 1 },
  { from: "SI", to: "IT", distanceKm: 490, transitDays: 1 },
  // South
  { from: "IT", to: "SI", distanceKm: 490, transitDays: 1 },
  { from: "IT", to: "GR", distanceKm: 1500, transitDays: 3 },
  { from: "ES", to: "PT", distanceKm: 620, transitDays: 1 },
  { from: "GR", to: "BG", distanceKm: 520, transitDays: 1 },
  { from: "RO", to: "BG", distanceKm: 390, transitDays: 1 },
  { from: "RO", to: "HU", distanceKm: 830, transitDays: 2 },
  // Nordics
  { from: "DK", to: "SE", distanceKm: 650, transitDays: 1 },
  // Ireland
  { from: "IE", to: "FR", distanceKm: 850, transitDays: 2 },
  { from: "IE", to: "NL", distanceKm: 760, transitDays: 2 },
  { from: "IE", to: "BE", distanceKm: 780, transitDays: 2 },
  // HR to IT via sea
  { from: "HR", to: "IT", distanceKm: 520, transitDays: 1 },
  // PL to SE via sea
  { from: "PL", to: "SE", distanceKm: 800, transitDays: 2 },
];

export function getCountry(code: string): EUCountry | undefined {
  return EU_COUNTRIES.find((c) => c.code === code);
}

// Build adjacency list (bidirectional)
function buildGraph(): Map<string, { to: string; distanceKm: number; transitDays: number }[]> {
  const graph = new Map<string, { to: string; distanceKm: number; transitDays: number }[]>();
  for (const c of EU_COUNTRIES) {
    graph.set(c.code, []);
  }
  for (const r of EU_ROUTES) {
    graph.get(r.from)!.push({ to: r.to, distanceKm: r.distanceKm, transitDays: r.transitDays });
    graph.get(r.to)!.push({ to: r.from, distanceKm: r.distanceKm, transitDays: r.transitDays });
  }
  return graph;
}

// Find all paths (DFS, limit depth to avoid explosion)
export function findAllPaths(from: string, to: string, maxStops = 5): string[][] {
  const graph = buildGraph();
  const results: string[][] = [];

  function dfs(current: string, path: string[], visited: Set<string>) {
    if (path.length > maxStops + 1) return;
    if (current === to) {
      results.push([...path]);
      return;
    }
    const neighbors = graph.get(current) || [];
    for (const n of neighbors) {
      if (!visited.has(n.to)) {
        visited.add(n.to);
        path.push(n.to);
        dfs(n.to, path, visited);
        path.pop();
        visited.delete(n.to);
      }
    }
  }

  const visited = new Set<string>([from]);
  dfs(from, [from], visited);
  return results;
}

// Calculate route details including VAT for each border crossing
export function calculateRoute(path: string[], packageValue: number): RoutePath {
  const graph = buildGraph();
  let totalDistanceKm = 0;
  let totalTransitDays = 0;
  const vatBreakdown: { country: string; vatRate: number; vatAmount: number }[] = [];

  // VAT is applied at destination country's rate (simplified model)
  // In reality, VAT is charged at import into each country, but for this simulation:
  // Each transit country applies a handling/customs charge proportional to their VAT rate
  // Destination country applies the full import VAT

  for (let i = 0; i < path.length - 1; i++) {
    const fromCode = path[i];
    const toCode = path[i + 1];
    const neighbors = graph.get(fromCode) || [];
    const edge = neighbors.find((n) => n.to === toCode);
    if (edge) {
      totalDistanceKm += edge.distanceKm;
      totalTransitDays += edge.transitDays;
    }

    // Transit countries (not origin, not destination) apply a small customs processing fee
    const country = getCountry(toCode)!;
    const isDestination = i === path.length - 2;

    if (isDestination) {
      // Full VAT at destination
      vatBreakdown.push({
        country: toCode,
        vatRate: country.vatRate,
        vatAmount: Math.round(packageValue * country.vatRate * 100) / 100,
      });
    } else {
      // Transit fee: ~2% of the country's VAT rate on the package value (customs handling)
      const transitFee = Math.round(packageValue * country.vatRate * 0.1 * 100) / 100;
      vatBreakdown.push({
        country: toCode,
        vatRate: country.vatRate,
        vatAmount: transitFee,
      });
    }
  }

  const totalVAT = vatBreakdown.reduce((s, v) => s + v.vatAmount, 0);

  return {
    countries: path,
    totalDistanceKm,
    totalTransitDays,
    vatBreakdown,
    totalVAT: Math.round(totalVAT * 100) / 100,
    totalCostWithVAT: Math.round((packageValue + totalVAT) * 100) / 100,
  };
}

// Find optimal (lowest VAT) route
export function findOptimalRoute(from: string, to: string, packageValue: number): { routes: RoutePath[]; optimal: RoutePath | null } {
  const paths = findAllPaths(from, to, 5);
  const routes = paths.map((p) => calculateRoute(p, packageValue)).sort((a, b) => a.totalVAT - b.totalVAT);
  return { routes, optimal: routes[0] || null };
}

// Mock packages with tracking
export const MOCK_PACKAGES: Package[] = [
  {
    id: "PKG-2026-0001",
    description: "Electronics - Laptop & Accessories",
    value: 1200,
    currency: "EUR",
    origin: "DE",
    destination: "FR",
    route: ["DE", "LU", "FR"],
    currentLocation: "LU",
    statuses: [
      { location: "DE", status: "cleared", timestamp: "2026-02-06T09:00:00Z", vatApplied: 0, note: "Package dispatched from Berlin warehouse" },
      { location: "DE", status: "cleared", timestamp: "2026-02-06T14:30:00Z", vatApplied: 0, note: "Departed Germany - heading to Luxembourg" },
      { location: "LU", status: "customs", timestamp: "2026-02-07T08:15:00Z", vatApplied: 20.4, note: "Arrived at Luxembourg customs - processing" },
    ],
    createdAt: "2026-02-06T08:00:00Z",
  },
  {
    id: "PKG-2026-0002",
    description: "Fashion - Designer Clothing",
    value: 850,
    currency: "EUR",
    origin: "IT",
    destination: "NL",
    route: ["IT", "AT", "DE", "NL"],
    currentLocation: "DE",
    statuses: [
      { location: "IT", status: "cleared", timestamp: "2026-02-04T10:00:00Z", vatApplied: 0, note: "Shipped from Milan distribution center" },
      { location: "AT", status: "cleared", timestamp: "2026-02-05T07:00:00Z", vatApplied: 17.0, note: "Cleared Austrian customs" },
      { location: "DE", status: "in_transit", timestamp: "2026-02-06T12:00:00Z", vatApplied: 16.15, note: "In transit through Germany" },
    ],
    createdAt: "2026-02-04T09:00:00Z",
  },
  {
    id: "PKG-2026-0003",
    description: "Auto Parts - Engine Components",
    value: 3200,
    currency: "EUR",
    origin: "PL",
    destination: "ES",
    route: ["PL", "DE", "FR", "ES"],
    currentLocation: "FR",
    statuses: [
      { location: "PL", status: "cleared", timestamp: "2026-02-03T08:00:00Z", vatApplied: 0, note: "Dispatched from Warsaw" },
      { location: "DE", status: "cleared", timestamp: "2026-02-04T06:00:00Z", vatApplied: 60.8, note: "Processed through German customs" },
      { location: "FR", status: "customs", timestamp: "2026-02-05T10:00:00Z", vatApplied: 64.0, note: "Held at French border - documentation review" },
    ],
    createdAt: "2026-02-03T07:00:00Z",
  },
  {
    id: "PKG-2026-0004",
    description: "Pharmaceuticals - Medical Supplies",
    value: 5500,
    currency: "EUR",
    origin: "IE",
    destination: "AT",
    route: ["IE", "NL", "DE", "AT"],
    currentLocation: "AT",
    statuses: [
      { location: "IE", status: "cleared", timestamp: "2026-02-01T07:00:00Z", vatApplied: 0, note: "Shipped from Dublin" },
      { location: "NL", status: "cleared", timestamp: "2026-02-02T14:00:00Z", vatApplied: 115.5, note: "Cleared Rotterdam port customs" },
      { location: "DE", status: "cleared", timestamp: "2026-02-03T09:00:00Z", vatApplied: 104.5, note: "Transit through Germany complete" },
      { location: "AT", status: "delivered", timestamp: "2026-02-04T16:00:00Z", vatApplied: 1100.0, note: "Delivered in Vienna — full import VAT applied" },
    ],
    createdAt: "2026-02-01T06:00:00Z",
  },
  {
    id: "PKG-2026-0005",
    description: "Wine & Spirits Collection",
    value: 420,
    currency: "EUR",
    origin: "FR",
    destination: "SE",
    route: ["FR", "BE", "NL", "DE", "DK", "SE"],
    currentLocation: "NL",
    statuses: [
      { location: "FR", status: "cleared", timestamp: "2026-02-08T10:00:00Z", vatApplied: 0, note: "Dispatched from Bordeaux" },
      { location: "BE", status: "cleared", timestamp: "2026-02-08T18:00:00Z", vatApplied: 8.82, note: "Cleared Belgian border" },
      { location: "NL", status: "in_transit", timestamp: "2026-02-09T06:00:00Z", vatApplied: 8.82, note: "Processing at Amsterdam hub" },
    ],
    createdAt: "2026-02-08T09:00:00Z",
  },
];

export function getPackageProgress(pkg: Package): number {
  const routeIndex = pkg.route.indexOf(pkg.currentLocation);
  if (routeIndex === -1) return 0;
  return Math.round((routeIndex / (pkg.route.length - 1)) * 100);
}
