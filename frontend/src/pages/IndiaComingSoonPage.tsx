import { Link } from "react-router-dom";
import { ArrowLeft, Rocket, MapPin, Globe, Bell } from "lucide-react";
import { useState } from "react";

const IndiaComingSoonPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: "hsl(var(--accent))", filter: "blur(80px)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-5"
          style={{ background: "hsl(38 92% 50%)", filter: "blur(60px)", transform: "translate(-30%, 30%)" }} />
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10 animate-fade-in">
        {/* Back link */}
        <div className="flex justify-start">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* India flag emoji + icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center text-5xl">
              🇮🇳
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-accent flex items-center justify-center">
              <Rocket className="h-4 w-4 text-accent-foreground" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">India Market</h1>
            <p className="text-xl font-medium text-accent">Coming Soon</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-2xl border border-border p-8 space-y-4 text-left">
          <h2 className="text-lg font-semibold text-foreground text-center">What to Expect</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Globe, title: "GST Compliance", desc: "Full support for India's Goods and Services Tax (GST) framework across all 28 states and 8 UTs." },
              { icon: MapPin, title: "State-Level Tracking", desc: "Track packages crossing Indian state borders with state-specific SGST/CGST/IGST breakdowns." },
              { icon: Bell, title: "Real-Time Alerts", desc: "Get notified on GSTIN validation status, filing deadlines, and compliance risk changes." },
              { icon: Rocket, title: "Customs Integration", desc: "Integrate with India Customs (ICEGATE) for automated duty calculations on international shipments." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/50">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GST rates preview */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">India GST Rate Slabs (Preview)</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { rate: "0%", desc: "Essential goods", color: "text-risk-low bg-risk-low-bg" },
              { rate: "5%", desc: "Basic necessities", color: "text-accent bg-accent/10" },
              { rate: "12%", desc: "Standard goods", color: "text-risk-medium bg-risk-medium-bg" },
              { rate: "28%", desc: "Luxury goods", color: "text-risk-high bg-risk-high-bg" },
            ].map((slab, i) => (
              <div key={i} className={`rounded-xl p-3 text-center ${slab.color}`}>
                <p className="text-xl font-bold">{slab.rate}</p>
                <p className="text-[10px] mt-1 opacity-80">{slab.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email notification form */}
        {!submitted ? (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">Get Notified at Launch</h3>
            <p className="text-xs text-muted-foreground mb-4">Be the first to know when India GST tracking goes live.</p>
            <form onSubmit={handleNotify} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Notify Me
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-risk-low-bg border border-risk-low/20 rounded-2xl p-6">
            <p className="text-risk-low font-semibold text-sm">✓ You're on the list!</p>
            <p className="text-muted-foreground text-xs mt-1">We'll email you at <span className="font-medium">{email}</span> when India goes live.</p>
          </div>
        )}

        {/* Estimated launch */}
        <p className="text-xs text-muted-foreground">
          Estimated launch: <span className="font-medium text-foreground">Q3 2026</span>
        </p>
      </div>
    </div>
  );
};

export default IndiaComingSoonPage;
