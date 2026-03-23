import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Headset, Shield } from "lucide-react";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get("portal") === "admin";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Email sent!", description: "Check your inbox for the password reset link." });
    }
  };

  const backLink = isAdmin ? "/auth/admin" : "/auth";
  const backLabel = isAdmin ? "Back to Admin Sign In" : "Back to Sign In";
  const Icon = isAdmin ? Shield : Headset;

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className={`hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden ${isAdmin ? "bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800" : "bg-primary"}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-sm mb-8 border border-white/10 ${isAdmin ? "bg-white/10" : "bg-white/15"}`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Reset Your Password
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdmin ? "bg-zinc-900" : "bg-primary"}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Reset Password</span>
          </div>

          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Forgot Password</CardTitle>
              <CardDescription>
                {sent
                  ? "We've sent a password reset link to your email."
                  : "Enter your email address to receive a reset link."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fp-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fp-email"
                        type="email"
                        placeholder="you@company.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className={`w-full active:scale-[0.97] transition-transform ${isAdmin ? "bg-zinc-900 hover:bg-zinc-800 text-white" : ""}`}
                    disabled={loading}
                  >
                    {loading ? "Sending…" : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Check your inbox at <strong className="text-foreground">{email}</strong> and click the reset link.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSent(false)}
                  >
                    Send again
                  </Button>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link
                  to={backLink}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {backLabel}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
