import { Shield, Database, Lock, BarChart3, Globe, Code, Route, Package, Server } from "lucide-react";

const AboutPage = () => {
  const sections = [
    {
      icon: Shield,
      title: "Project Aim",
      content: "VATGuard is an academic project simulating a real-world VAT compliance and package tracking platform for e-commerce within the EU. It demonstrates how logistics platforms can optimize shipping routes to minimize VAT costs while ensuring regulatory compliance across EU member states."
    },
    {
      icon: Route,
      title: "Key Features",
      items: [
        "Interactive route planner to find lowest-VAT shipping paths between EU countries",
        "Package tracking with real-time border crossing updates and VAT applied at each step",
        "VAT rate comparison across all 21 EU member states",
        "Path optimization algorithm showing all possible routes with cost breakdown",
        "Role-based access control (Admin vs User)",
        "VAT reduction strategies and recommendations",
      ]
    },
    {
      icon: Database,
      title: "System Architecture",
      content: "The system uses a graph-based data model where EU countries are nodes and border connections are edges. A DFS pathfinding algorithm discovers all viable routes between origin and destination, calculating cumulative VAT at each border crossing. The frontend is a React SPA with simulated REST API interactions."
    },
    {
      icon: Lock,
      title: "Security & Access Control",
      items: [
        "Token-based authentication (Bearer Token concept)",
        "Role-based access control (Admin vs User)",
        "Protected route enforcement via React Router",
        "Form validation on all user inputs",
        "Session management with localStorage tokens",
      ]
    },
    {
      icon: Globe,
      title: "VAT Classification Logic",
      content: "Each transit country applies a customs handling fee proportional to 10% of their standard VAT rate on the package value. The destination country applies the full import VAT rate. This model enables meaningful comparison between routes — direct paths may have higher destination VAT but fewer transit fees, while indirect routes through low-VAT countries can reduce overall cost."
    },
    {
      icon: Code,
      title: "Technology Stack",
      items: [
        "Frontend: React 18, TypeScript, Tailwind CSS",
        "Charting: Recharts for data visualization",
        "Routing: React Router v6 with protected routes",
        "State Management: React Context API",
        "Algorithm: DFS-based pathfinding with VAT cost optimization",
        "Build Tool: Vite",
      ]
    },
  ];

  const apiEndpoints = [
    { method: "POST", path: "/api/login", desc: "Authenticate user, returns Bearer token" },
    { method: "GET", path: "/api/packages", desc: "List all tracked packages" },
    { method: "GET", path: "/api/packages/:id", desc: "Get package tracking details" },
    { method: "GET", path: "/api/countries", desc: "List EU countries with VAT rates" },
    { method: "POST", path: "/api/routes/find", desc: "Find all routes between two countries" },
    { method: "POST", path: "/api/routes/optimal", desc: "Get lowest-VAT route for a shipment" },
    { method: "GET", path: "/api/vat/rates", desc: "Get current EU VAT rates" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">About VATGuard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Academic project documentation and system overview</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={section.title} className="bg-card rounded-xl p-6 border border-border animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <section.icon className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            </div>
            {section.content && <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>}
            {section.items && (
              <ul className="space-y-1.5 mt-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* API Documentation */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Server className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">REST API Documentation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Method</th>
                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Endpoint</th>
                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((ep) => (
                <tr key={ep.path} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">
                    <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                      ep.method === "GET" ? "bg-risk-low-bg text-risk-low" : "bg-accent/10 text-accent"
                    }`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-foreground">{ep.path}</td>
                  <td className="px-6 py-3 text-muted-foreground">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center py-6 text-sm text-muted-foreground">
        <p>VATGuard © 2026 — Academic Project</p>
        <p className="mt-1">Fundamentals of E-Commerce Laboratory Evaluation</p>
      </div>
    </div>
  );
};

export default AboutPage;
