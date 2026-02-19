import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Schema ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Configuration ─────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormData>({
    // @ts-ignore - zodResolver types are messed up
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Non-validation errors show in Sonner notification
        toast.error(result.error || "Login Failed");
        return;
      }

      // Store credentials and user profile
      localStorage.setItem("bp_token", result.token);
      localStorage.setItem("bp_user", JSON.stringify(result.user));

      toast.success(`Welcome back, ${result.user.name}`);
      navigate("/dashboard");
    } catch (error) {
      // Server connection errors show in Sonner notification
      toast.error("Network Error", {
        description: "Cannot connect to Blue Pearls server.",
      });
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Backgrounds ── */}
      <div className="absolute inset-0 z-0 bg-white md:hidden" />
      <div
        className="absolute inset-0 z-0 hidden md:block"
        style={{
          background:
            "linear-gradient(160deg, #ddf0fb 0%, #b8e0f7 30%, #ceeaf9 60%, #e8f6fd 100%)",
        }}
      />
      <div
        className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat opacity-60 hidden md:block"
        style={{ backgroundImage: "url('/bg-illustration-2.png')" }}
      />
      <div
        className="absolute inset-0 z-0 hidden md:block"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 110%, rgba(255,255,255,0.55) 0%, transparent 65%)",
        }}
      />

      {/* ── Logo bar ── */}
      <header className="relative z-10 flex items-center gap-2.5 px-6 pt-6 pb-2 md:absolute md:top-6 md:left-7 md:pb-0">
        <img
          src="/logo.png"
          alt="Blue Pearls Logo"
          className="h-9 w-9 object-contain"
        />
        <span className="font-semibold tracking-tight text-[#1a3a5c] text-lg">
          Blue Pearls
        </span>
      </header>

      {/* ── Form area ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-8 md:absolute md:inset-0 md:flex md:items-center md:justify-center md:px-0 md:py-0">
        <div className="relative w-full max-w-sm md:max-w-md">
          {/* Glass card — md+ only */}
          <div
            className="absolute inset-0 pointer-events-none hidden md:block"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(225,244,255,0.82) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow:
                "0 8px 40px rgba(100,180,240,0.18), 0 2px 12px rgba(0,80,160,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          />

          <div className="relative px-0 py-0 md:px-10 md:py-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #ddf0fb 100%)",
                  boxShadow:
                    "0 4px 16px rgba(100,180,240,0.25), 0 1px 4px rgba(0,0,0,0.08)",
                }}>
                <ArrowRight
                  className="w-6 h-6 text-[#1a3a5c]"
                  strokeWidth={2.2}
                />
              </div>
            </div>

            <h1 className="text-center text-2xl font-bold text-[#0f2a45] mb-1.5 tracking-tight">
              Administrator Sign In
            </h1>
            <p className="text-center text-sm text-[#6b8fa8] mb-8">
              Sign in to access the Blue Pearls Application.
            </p>

            <form
              id="login-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate>
              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-email"
                      className="text-xs font-semibold text-[#3b6080] uppercase tracking-widest">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#90b8d0]"
                        strokeWidth={2}
                      />
                      <Input
                        {...field}
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                        className={`pl-10 h-11 text-sm bg-white/70 text-[#1a3a5c] placeholder:text-[#b0cfe0] rounded-xl transition-all ${
                          fieldState.invalid
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20 focus:ring-2"
                            : "border-[#c4dff0] focus:border-[#5aabdb] focus:ring-[#5aabdb]/20 focus:ring-2"
                        }`}
                      />
                    </div>
                    {fieldState.invalid && (
                      <p className="text-xs text-red-500 pl-0.5">
                        {fieldState.error?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Password */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-password"
                      className="text-xs font-semibold text-[#3b6080] uppercase tracking-widest">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#90b8d0]"
                        strokeWidth={2}
                      />
                      <Input
                        {...field}
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        className={`pl-10 pr-10 h-11 text-sm bg-white/70 text-[#1a3a5c] placeholder:text-[#b0cfe0] rounded-xl transition-all ${
                          fieldState.invalid
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20 focus:ring-2"
                            : "border-[#c4dff0] focus:border-[#5aabdb] focus:ring-[#5aabdb]/20 focus:ring-2"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#90b8d0] hover:text-[#5aabdb] transition-colors"
                        tabIndex={-1}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }>
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && (
                      <p className="text-xs text-red-500 pl-0.5">
                        {fieldState.error?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Forgot password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-[#5aabdb] hover:text-[#1a3a5c] font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
            </form>

            {/* Submit */}
            <Button
              type="submit"
              form="login-form"
              disabled={form.formState.isSubmitting}
              className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 mt-2"
              style={{
                background: form.formState.isSubmitting
                  ? "linear-gradient(135deg, #3a7da8, #1a5a85)"
                  : "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(26,58,92,0.35)",
              }}>
              {form.formState.isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-[#a0bdd0] mt-7">
              Need access?{" "}
              <button className="text-[#5aabdb] hover:text-[#1a3a5c] font-semibold transition-colors">
                Contact your administrator
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer
        className="relative z-10 text-center text-xs text-[#7aacc4] py-5 mt-auto"
        style={{ letterSpacing: "0.06em" }}>
        © {new Date().getFullYear()} Blue Pearls Systems
      </footer>
    </div>
  );
}
