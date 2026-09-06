import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import "../Login.css";

type LoginProps = {
  onLogin?: () => void;
  onRegister?: () => void;
};

export default function Login({ onLogin, onRegister }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || "Unable to complete the request.");
      }

      localStorage.setItem("dealflow360_token", result.data.token);
      localStorage.setItem("dealflow360_user", JSON.stringify(result.data.user));
      onLogin?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to complete the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-grid" />

      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-orb orb-three" />

      <div className="login-particles">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="light-beam beam-one" />
      <div className="light-beam beam-two" />

      <div className="login-shell">
        {/* LEFT SIDE */}
        <section className="login-showcase">
          <div className="brand-chip">
            <Sparkles size={16} />
            Intelligent Deal Operations
          </div>

          <h1>
            Welcome back to
            <span> DealFlow360</span>
          </h1>

          <p>
            One connected workspace for smarter deals,
            faster approvals and better decisions.
          </p>

          <div className="animated-brand-visual">
            <div className="orbit orbit-a" />
            <div className="orbit orbit-b" />
            <div className="orbit orbit-c" />

            <div className="energy-core">
              <div className="core-inner">DF</div>
            </div>

            <div className="orbit-dot dot-a" />
            <div className="orbit-dot dot-b" />
            <div className="orbit-dot dot-c" />
          </div>

          <div className="floating-message message-one">
            <span className="message-icon">✦</span>
            Smart workflow
          </div>

          <div className="floating-message message-two">
            <span className="message-icon">✓</span>
            Everything connected
          </div>

          <div className="showcase-bottom">
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="login-card">
          <div className="login-card-glow" />

          <div className="login-card-inner">
            <div className="login-heading">
              <div className="login-logo">
                <span>DF</span>
              </div>

              <div>
                <h2>Sign in</h2>
                <p>Access your DealFlow360 workspace</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label">Work email</label>

              <div className="input-shell">
                <Mail size={19} />

                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="password-label-row">
                <label className="field-label">Password</label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={() => alert("Please contact an administrator to reset your password.")}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-shell">
                <LockKeyhole size={19} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <div className="remember-row">
                <label>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <span className="secure-copy">Secure access</span>
              </div>

              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                <span className="button-shine" />

                {loading ? (
                  <>
                    <span className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue to workspace
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="login-footer">
              New to DealFlow360?{" "}
              <button type="button" className="forgot-button" onClick={onRegister}>
                Register here
              </button>
            </p>

            <div className="login-divider">
              <span />
              <p>DealFlow360</p>
              <span />
            </div>

            <p className="login-footer">
              Smart deals. Faster approvals. Better decisions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}