import { EU_COUNTRIES, EU_ROUTES, getCountry } from "@/data/mockData";
import { Package } from "@/types/vat";

interface EUMapProps {
  highlightRoute?: string[];
  currentLocation?: string;
  packages?: Package[];
  onCountryClick?: (code: string) => void;
  selectedCountries?: string[];
}

// Scaled positions to fit inside the SVG viewBox 0 0 100 100
const EUMap = ({ highlightRoute, currentLocation, packages, onCountryClick, selectedCountries = [] }: EUMapProps) => {
  const routeSet = new Set(highlightRoute || []);
  const activeEdges = new Set<string>();

  if (highlightRoute && highlightRoute.length > 1) {
    for (let i = 0; i < highlightRoute.length - 1; i++) {
      const a = highlightRoute[i];
      const b = highlightRoute[i + 1];
      activeEdges.add(`${a}-${b}`);
      activeEdges.add(`${b}-${a}`);
    }
  }

  const getEdgeKey = (from: string, to: string) => `${from}-${to}`;

  return (
    <div className="bg-card rounded-xl border border-border p-4 w-full">
      <h3 className="text-sm font-semibold text-foreground mb-3">EU Network Map</h3>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-auto"
        style={{ maxHeight: 420 }}
      >
        {/* Background */}
        <rect x="0" y="0" width="100" height="100" fill="hsl(var(--muted))" rx="6" />

        {/* Route lines */}
        {EU_ROUTES.map((r) => {
          const from = getCountry(r.from);
          const to = getCountry(r.to);
          if (!from || !to) return null;
          const isActive = activeEdges.has(getEdgeKey(r.from, r.to));
          return (
            <line
              key={`${r.from}-${r.to}`}
              x1={from.position.x}
              y1={from.position.y}
              x2={to.position.x}
              y2={to.position.y}
              stroke={isActive ? "hsl(var(--accent))" : "hsl(var(--border))"}
              strokeWidth={isActive ? 0.8 : 0.4}
              strokeOpacity={isActive ? 1 : 0.6}
            />
          );
        })}

        {/* Country nodes */}
        {EU_COUNTRIES.map((country) => {
          const isOnRoute = routeSet.has(country.code);
          const isCurrent = currentLocation === country.code;
          const isSelected = selectedCountries.includes(country.code);
          const hasPackage = packages?.some((p) => p.currentLocation === country.code);

          // Node appearance
          let fill = "hsl(var(--background))";
          let stroke = "hsl(var(--border))";
          let strokeWidth = 0.5;
          let r = 2.2;

          if (isCurrent) {
            fill = "hsl(var(--accent))";
            stroke = "hsl(var(--accent-foreground))";
            strokeWidth = 0.8;
            r = 3.2;
          } else if (isSelected) {
            fill = "hsl(var(--accent))";
            stroke = "hsl(var(--accent))";
            strokeWidth = 0.8;
            r = 2.8;
          } else if (isOnRoute) {
            fill = "hsl(var(--accent) / 0.3)";
            stroke = "hsl(var(--accent))";
            strokeWidth = 0.6;
            r = 2.4;
          } else if (hasPackage) {
            fill = "hsl(var(--risk-medium-bg))";
            stroke = "hsl(var(--risk-medium))";
            strokeWidth = 0.6;
            r = 2.4;
          }

          return (
            <g
              key={country.code}
              onClick={() => onCountryClick?.(country.code)}
              style={{ cursor: onCountryClick ? "pointer" : "default" }}
            >
              {/* Pulse ring for current location */}
              {isCurrent && (
                <circle
                  cx={country.position.x}
                  cy={country.position.y}
                  r={r + 1.5}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth={0.4}
                  strokeOpacity={0.5}
                />
              )}
              {/* Package indicator */}
              {hasPackage && !isCurrent && (
                <circle
                  cx={country.position.x}
                  cy={country.position.y}
                  r={r + 1.2}
                  fill="none"
                  stroke="hsl(var(--risk-medium))"
                  strokeWidth={0.4}
                  strokeOpacity={0.4}
                />
              )}
              <circle
                cx={country.position.x}
                cy={country.position.y}
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              <text
                x={country.position.x}
                y={country.position.y + r + 2.2}
                textAnchor="middle"
                fontSize="2.2"
                fill="hsl(var(--muted-foreground))"
                fontFamily="system-ui"
                fontWeight="500"
              >
                {country.code}
              </text>
              {/* VAT rate on hover (always show on desktop as small label) */}
              <title>{country.name} — VAT: {(country.vatRate * 100).toFixed(0)}%{isCurrent ? " 📍 Package here" : ""}
              </title>
            </g>
          );
        })}

        {/* Legend */}
        <g>
          <circle cx="4" cy="93" r="1.5" fill="hsl(var(--accent))" />
          <text x="7" y="94" fontSize="2.2" fill="hsl(var(--muted-foreground))" fontFamily="system-ui">Current location</text>
          <circle cx="4" cy="97" r="1.5" fill="hsl(var(--risk-medium-bg))" stroke="hsl(var(--risk-medium))" strokeWidth="0.4" />
          <text x="7" y="98" fontSize="2.2" fill="hsl(var(--muted-foreground))" fontFamily="system-ui">Package in transit</text>
        </g>
      </svg>
      <p className="text-xs text-muted-foreground mt-2 text-center">Hover over a country for VAT rate details. Click to select.</p>
    </div>
  );
};

export default EUMap;
