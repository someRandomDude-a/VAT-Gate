import { EU_COUNTRIES } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Globe, TrendingDown, ArrowDown, ArrowUp, Newspaper, Calendar, ExternalLink, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

const VAT_NEWS = [
  {
    id: 1,
    date: "2026-02-14",
    title: "EU Commission Proposes Unified VAT Digital Reporting by 2028",
    summary: "The European Commission has proposed mandatory real-time digital VAT reporting for cross-border B2B transactions across all 27 member states, aiming to close the €93 billion VAT gap.",
    impact: "high",
    impactLabel: "High Impact",
    category: "Regulation",
    countries: ["All EU"],
    detail: "The new directive would require businesses to submit structured e-invoices within 48 hours of each transaction. Non-compliance penalties could reach 5% of annual turnover.",
  },
  {
    id: 2,
    date: "2026-01-30",
    title: "Hungary Freezes VAT at 27% — No Changes for 2026",
    summary: "Hungary's Ministry of Finance confirmed that its standard VAT rate of 27% (the EU's highest) will remain unchanged for the entire 2026 fiscal year.",
    impact: "medium",
    impactLabel: "Neutral",
    category: "Rate Update",
    countries: ["HU"],
    detail: "Despite pressure from the European Parliament to lower rates, Hungary cited fiscal consolidation priorities. E-commerce sellers should continue factoring 27% VAT into Hungarian deliveries.",
  },
  {
    id: 3,
    date: "2026-01-22",
    title: "Germany Plans VAT Reduction on Repair Services",
    summary: "The German Federal Ministry of Finance has announced a proposal to reduce VAT on electronics and clothing repair services from 19% to 7% to promote circular economy goals.",
    impact: "low",
    impactLabel: "Opportunity",
    category: "Rate Change",
    countries: ["DE"],
    detail: "If approved by the Bundesrat, the reduced rate would apply from July 2026. E-commerce platforms offering refurbished goods could benefit significantly.",
  },
  {
    id: 4,
    date: "2026-01-15",
    title: "OSS Threshold Review: €10,000 Limit Under Scrutiny",
    summary: "The EU VAT One-Stop-Shop (OSS) threshold of €10,000 for cross-border digital services is under review. A new consultation paper suggests raising it to €25,000 to ease SME compliance.",
    impact: "medium",
    impactLabel: "Beneficial",
    category: "Policy",
    countries: ["All EU"],
    detail: "The revised threshold would allow small businesses to apply domestic VAT rates to cross-border sales below €25,000, reducing administrative burden considerably.",
  },
  {
    id: 5,
    date: "2026-01-08",
    title: "Poland Extends Reduced VAT on Food Until December 2026",
    summary: "Poland's government extended the 0% VAT rate on basic food products for another year as anti-inflation measures continue amid persistent price pressures.",
    impact: "low",
    impactLabel: "Neutral",
    category: "Rate Update",
    countries: ["PL"],
    detail: "The extension applies to unprocessed food, dairy, bread, and meats. Processed food and beverages remain at the standard 23% rate.",
  },
  {
    id: 6,
    date: "2025-12-19",
    title: "Romania Raises Standard VAT Rate to 21% in 2026 Budget",
    summary: "Romania's parliament approved a budget for 2026 that increases the standard VAT rate from 19% to 21%, effective from March 1, 2026.",
    impact: "high",
    impactLabel: "High Impact",
    category: "Rate Change",
    countries: ["RO"],
    detail: "Sellers shipping goods to Romania must update their VAT calculations from March 1st. Failure to apply the updated rate will result in penalties from ANAF, Romania's tax authority.",
  },
  {
    id: 7,
    date: "2025-12-05",
    title: "EU Introduces New VAT Exemption Rules for Small Parcels",
    summary: "Starting January 2026, the EU eliminated the €22 VAT exemption on small parcels from non-EU countries. All imports are now subject to full VAT regardless of value.",
    impact: "high",
    impactLabel: "Major Change",
    category: "Import Rules",
    countries: ["All EU"],
    detail: "E-commerce platforms selling into the EU from outside (e.g., China, USA) must now collect VAT at point of sale via the Import One-Stop-Shop (IOSS) scheme, or customs will collect it at the border.",
  },
];

const impactConfig: Record<string, { icon: React.ReactNode; class: string }> = {
  high: { icon: <AlertTriangle className="h-3.5 w-3.5" />, class: "bg-risk-high-bg text-risk-high" },
  medium: { icon: <Info className="h-3.5 w-3.5" />, class: "bg-risk-medium-bg text-risk-medium" },
  low: { icon: <CheckCircle className="h-3.5 w-3.5" />, class: "bg-risk-low-bg text-risk-low" },
};

const VATAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState<"analysis" | "news">("analysis");
  const [expandedNews, setExpandedNews] = useState<number | null>(null);

  const sortedByVAT = [...EU_COUNTRIES].sort((a, b) => a.vatRate - b.vatRate);
  const lowest = sortedByVAT[0];
  const highest = sortedByVAT[sortedByVAT.length - 1];
  const avgVAT = EU_COUNTRIES.reduce((s, c) => s + c.vatRate, 0) / EU_COUNTRIES.length;

  const chartData = sortedByVAT.map((c) => ({
    country: c.code,
    name: c.name,
    rate: Math.round(c.vatRate * 100),
  }));

  const tips = [
    {
      title: "Route through low-VAT countries",
      desc: `Luxembourg (${(EU_COUNTRIES.find(c => c.code === "LU")!.vatRate * 100).toFixed(0)}%) has the EU's lowest standard VAT rate. Routing packages through Luxembourg before reaching high-VAT destinations can reduce transit fees.`,
    },
    {
      title: "Minimize transit countries",
      desc: "Each border crossing incurs a small customs handling fee proportional to that country's VAT rate. Direct routes or routes with fewer stops reduce cumulative costs.",
    },
    {
      title: "Consider destination VAT carefully",
      desc: "The destination country always charges the full import VAT. If possible, ship to a warehouse in a lower-VAT country and distribute locally.",
    },
    {
      title: "Avoid high-VAT transit hubs",
      desc: `Hungary (27%), Croatia (25%), Denmark (25%), and Sweden (25%) have the highest VAT rates. Avoid routing through these unless they are the final destination.`,
    },
    {
      title: "Use the Route Planner",
      desc: "Our route planner compares all possible paths between two countries and shows the exact VAT cost for each route, highlighting the cheapest option.",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">VAT Analysis</h1>
        <p className="text-muted-foreground text-sm mt-0.5">EU VAT rates comparison, reduction strategies, and regulatory news</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "analysis" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Analysis
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "news" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Newspaper className="h-4 w-4" />
          VAT News
          <span className="bg-risk-high text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {VAT_NEWS.filter(n => n.impact === "high").length}
          </span>
        </button>
      </div>

      {activeTab === "analysis" && (
        <div className="space-y-8 animate-fade-in">
          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDown className="h-4 w-4 text-risk-low" />
                <span className="text-sm text-muted-foreground">Lowest VAT</span>
              </div>
              <p className="text-2xl font-bold text-risk-low">{(lowest.vatRate * 100).toFixed(0)}%</p>
              <p className="text-sm text-foreground mt-1">{lowest.name}</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">EU Average</span>
              </div>
              <p className="text-2xl font-bold text-accent">{(avgVAT * 100).toFixed(1)}%</p>
              <p className="text-sm text-foreground mt-1">{EU_COUNTRIES.length} countries</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUp className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Highest VAT</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{(highest.vatRate * 100).toFixed(0)}%</p>
              <p className="text-sm text-foreground mt-1">{highest.name}</p>
            </div>
          </div>

          {/* Full chart */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="font-semibold text-foreground mb-4">VAT Rates Across All EU Countries</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" unit="%" stroke="hsl(var(--muted-foreground))" domain={[0, 30]} />
                <YAxis dataKey="country" type="category" width={35} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "VAT Rate"]}
                  labelFormatter={(label) => chartData.find((c) => c.country === label)?.name || label}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "13px", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]} fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* VAT reduction tips */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-accent" />
              Ways to Reduce VAT Costs
            </h3>
            {tips.map((tip, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "news" && (
        <div className="space-y-4 animate-fade-in">
          {/* Alert banner for high-impact news */}
          <div className="bg-risk-high-bg border border-risk-high/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-risk-high shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-risk-high">
                {VAT_NEWS.filter(n => n.impact === "high").length} high-impact VAT changes require your attention
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                These changes may directly affect your shipping costs and compliance obligations.
              </p>
            </div>
          </div>

          {VAT_NEWS.map((news, i) => {
            const cfg = impactConfig[news.impact];
            const isExpanded = expandedNews === news.id;
            return (
              <div
                key={news.id}
                className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <button
                  onClick={() => setExpandedNews(isExpanded ? null : news.id)}
                  className="w-full px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.class}`}>
                          {cfg.icon}
                          {news.impactLabel}
                        </span>
                        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {news.category}
                        </span>
                        {news.countries.map((c) => (
                          <span key={c} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">{c}</span>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-foreground leading-snug">{news.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{news.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(news.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-4 w-4 text-muted-foreground mt-2 ml-auto" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground mt-2 ml-auto" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-muted/20 space-y-3">
                    <h5 className="text-xs font-semibold text-foreground">Full Details</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">{news.detail}</p>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs text-accent font-medium cursor-pointer hover:underline">
                        View official EU documentation →
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <p className="text-xs text-muted-foreground text-center pt-2">
            News updated regularly. Always verify changes with official EU tax authorities.
          </p>
        </div>
      )}
    </div>
  );
};

// Inline chevron icons to avoid import conflicts
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

export default VATAnalysisPage;
