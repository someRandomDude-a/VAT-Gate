export interface EUCountry {
  code: string;
  name: string;
  vatRate: number; // standard VAT rate as decimal
  position: { x: number; y: number }; // for visual map layout
}

export interface Route {
  from: string; // country code
  to: string;   // country code
  distanceKm: number;
  transitDays: number;
}

export interface RoutePath {
  countries: string[];
  totalDistanceKm: number;
  totalTransitDays: number;
  vatBreakdown: { country: string; vatRate: number; vatAmount: number }[];
  totalVAT: number;
  totalCostWithVAT: number;
}

export interface PackageStatus {
  location: string; // country code
  status: "in_transit" | "customs" | "cleared" | "delivered" | "pending";
  timestamp: string;
  vatApplied: number;
  note: string;
}

export interface Package {
  id: string;
  description: string;
  value: number;
  currency: string;
  origin: string;
  destination: string;
  route: string[];
  currentLocation: string;
  statuses: PackageStatus[];
  createdAt: string;
}
