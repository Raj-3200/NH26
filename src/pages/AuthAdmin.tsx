import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Shield, Mail, Lock } from "lucide-react";

export default function AuthAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      setLoading(false);
      toast({
        title: "Access denied",
        description: "This account does not have admin privileges. Please use the employee login.",
        variant: "destructive",
      });
      return;
    }

    setLoading(false);
    toast({ title: "Welcome, Admin!" });
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-8 border border-white/10">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Admin Portal
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Manage tickets, users, analytics, and system-wide configurations from the admin dashboard.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left text-sm text-zinc-500">
            {["Manage all tickets", "User role management", "Analytics dashboard", "AI insights & reports"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Shield className="w-3 h-3 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Admin Portal</span>
          </div>

          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="w-5 h-5 text-zinc-900" />
                Admin Sign In
              </CardTitle>
              <CardDescription>Access the admin dashboard with your admin credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="admin-email" type="email" placeholder="admin@company.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="admin-pass" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white active:scale-[0.97] transition-transform" disabled={loading}>
                  {loading ? "Verifying…" : "Sign In as Admin"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Employee login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
