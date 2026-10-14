import { useState } from "react";
import { Plane, Lock, Mail, User, KeyRound, Shield, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import type { StaffAccount } from "../staffTypes";
import { authenticateStaff, createStaffUser } from "../bookingApi";
import { STAFF_ACCESS_KEY } from "../staffData";

interface StaffAuthProps {
  onLogin: (account: StaffAccount) => void;
  onBackToStore: () => void;
}

export function StaffAuth({ onLogin, onBackToStore }: StaffAuthProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const user = await authenticateStaff(email, password);
        if (!user) {
          setError("No staff account found for this email. Try admin@voyagego.com or staff@voyagego.com");
          setLoading(false);
          return;
        }
        onLogin({
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          password: "",
          role: user.role,
        });
      } else {
        if (accessKey !== STAFF_ACCESS_KEY) {
          setError("Invalid Staff Access Key. Hint: VG-STAFF-2026");
          setLoading(false);
          return;
        }
        const user = await createStaffUser(fullName.trim(), email.trim(), role);
        onLogin({
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          password: "",
          role: user.role,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
      setLoading(false);
    }
  }

  function fillTest(account: "admin" | "employee") {
    setEmail(account === "admin" ? "admin@voyagego.com" : "staff@voyagego.com");
    setPassword(account === "admin" ? "admin123" : "staff123");
    setMode("signin");
    setError("");
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <button
          onClick={onBackToStore}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to VoyageGo Storefront
        </button>

        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600/20 mb-3">
              <Plane className="w-6 h-6 text-teal-400" />
            </div>
            <h1 className="text-lg font-bold text-white">VoyageGo Staff Portal</h1>
            <p className="text-xs text-gray-400 mt-1">Restricted access — authorized personnel only</p>
          </div>

          <div className="mx-6 mb-5 flex bg-gray-900/60 rounded-xl p-1">
            <button
              onClick={() => { setMode("signin"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "signin" ? "bg-teal-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "signup" ? "bg-teal-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Create Staff Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-[11px] font-medium text-gray-400 mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900/60 border border-gray-700 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-gray-400 mb-1 block">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@voyagego.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900/60 border border-gray-700 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-400 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-900/60 border border-gray-700 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label className="text-[11px] font-medium text-gray-400 mb-1 block">Staff Access Key</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      required
                      placeholder="Enter invitation code"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900/60 border border-gray-700 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-400 mb-1.5 block">Register As</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        role === "admin"
                          ? "bg-teal-600/20 border-teal-500 text-teal-300"
                          : "bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("employee")}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        role === "employee"
                          ? "bg-teal-600/20 border-teal-500 text-teal-300"
                          : "bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Employee
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-500 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                mode === "signin" ? "Sign In to Portal" : "Create Staff Account"
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-gray-800/40 rounded-xl border border-gray-700/30 p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2 text-center">Quick Test Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fillTest("admin")}
              className="py-2 rounded-lg bg-gray-900/60 border border-gray-700 text-[11px] text-gray-300 hover:border-teal-600 transition-all"
            >
              <span className="block font-semibold text-teal-400">Admin</span>
              <span className="text-gray-500">admin@voyagego.com</span>
            </button>
            <button
              onClick={() => fillTest("employee")}
              className="py-2 rounded-lg bg-gray-900/60 border border-gray-700 text-[11px] text-gray-300 hover:border-teal-600 transition-all"
            >
              <span className="block font-semibold text-teal-400">Employee</span>
              <span className="text-gray-500">staff@voyagego.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
