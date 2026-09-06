import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import "../Login.css";

type SignupProps = {
  onLogin: () => void;
};

export default function Signup({ onLogin }: SignupProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SALES_REP");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || "Unable to create your account.");
      }

      alert("Registration successful. Please sign in to continue.");
      onLogin();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-grid" />
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-orb orb-three" />
      <div className="login-particles"><span /><span /><span /><span /><span /><span /><span /><span /></div>
      <div className="light-beam beam-one" />
      <div className="light-beam beam-two" />

      <div className="login-shell">
        <section className="login-showcase">
          <div className="brand-chip"><Sparkles size={16} />Intelligent Deal Operations</div>
          <h1>Join <span>DealFlow360</span></h1>
          <p>One connected workspace for smarter deals, faster approvals and better decisions.</p>
          <div className="animated-brand-visual">
            <div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="orbit orbit-c" />
            <div className="energy-core"><div className="core-inner">DF</div></div>
            <div className="orbit-dot dot-a" /><div className="orbit-dot dot-b" /><div className="orbit-dot dot-c" />
          </div>
          <div className="floating-message message-one"><span className="message-icon">✦</span>Smart workflow</div>
          <div className="floating-message message-two"><span className="message-icon">✓</span>Everything connected</div>
          <div className="showcase-bottom"><span /><span /><span /><span /></div>
        </section>

        <section className="login-card">
          <div className="login-card-glow" />
          <div className="login-card-inner">
            <div className="login-heading">
              <div className="login-logo"><span>DF</span></div>
              <div><h2>Create account</h2><p>Register for your DealFlow360 workspace</p></div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label">Full name</label>
              <div className="input-shell">
                <input type="text" placeholder="Enter your full name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>

              <label className="field-label">Work email</label>
              <div className="input-shell">
                <Mail size={19} />
                <input type="email" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>

              <label className="field-label">Role</label>
              <div className="input-shell">
                <select value={role} onChange={(event) => setRole(event.target.value)} required>
                  <option value="SALES_REP">Sales Representative</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="FINANCE_OPERATIONS">Finance Operations</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <label className="field-label">Password</label>
              <div className="input-shell">
                <LockKeyhole size={19} />
                <input type={showPassword ? "text" : "password"} placeholder="Create a password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              <button className="login-button" type="submit" disabled={loading}>
                <span className="button-shine" />
                {loading ? <><span className="login-spinner" />Creating account...</> : <>Create account<ArrowRight size={18} /></>}
              </button>
            </form>

            <p className="login-footer">
              Already have an account?{" "}
              <button type="button" className="forgot-button" onClick={onLogin}>Sign in</button>
            </p>
            <div className="login-divider"><span /><p>DealFlow360</p><span /></div>
            <p className="login-footer">Smart deals. Faster approvals. Better decisions.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
