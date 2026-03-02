import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";

const LoginPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      const res = await register(email.trim(), password);
      setLoading(false);

      if (!res.success) {
        setError(res.error || "Registration failed");
        return;
      }

      // After successful registration, switch to login.
      setSuccess("Account created. Please sign in.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    // Login
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Shield className="h-9 w-9" />
          <span className="text-2xl font-bold tracking-tight">VATGuard</span>
        </div>
        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">E-Commerce VAT Compliance & Monitoring Platform</h1>
          <p className="text-lg text-primary-foreground/75 leading-relaxed">
            Monitor transactions, classify VAT risks, and ensure your marketplace stays compliant with EU tax regulations.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[{ value: "€2.4M+", label: "Transactions monitored" },
              { value: "99.2%", label: "Compliance rate" },
              { value: "150+", label: "Sellers tracked" },
              { value: "24/7", label: "Real-time monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-primary-foreground/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-primary-foreground/40">© 2026 VATGuard. Academic Project.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background lg:rounded-l-3xl">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <Shield className="h-7 w-7 text-accent" />
            <span className="text-xl font-bold">VATGuard</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="mt-1 text-muted-foreground">
              {mode === "login" ? "Sign in to your VATGuard account" : "Register to start using VATGuard"}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 text-accent text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username / Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="admin@vatguard.com"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm pr-10"
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign in" : "Create account")}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setMode(mode === "login" ? "register" : "login");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-accent hover:underline"
            >
              {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>

          {mode === "login" && (
            <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Demo Credentials</p>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Admin:</span> <code className="font-mono text-foreground">admin@vatguard.com</code> /{" "}
                  <code className="font-mono text-foreground">admin123</code>
                </p>
                <p>
                  <span className="text-muted-foreground">User:</span> <code className="font-mono text-foreground">user@vatguard.com</code> /{" "}
                  <code className="font-mono text-foreground">user123</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
