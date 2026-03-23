import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { role, user, profile } = useAuth();
  const isAdmin = role === "admin";
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, critical: 0 });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const query = isAdmin
        ? supabase.from("tickets").select("*")
        : supabase.from("tickets").select("*").eq("created_by", user.id);
      const { data } = await query;
      if (data) {
        setStats({
          total: data.length,
          open: data.filter((t) => t.status === "open" || t.status === "in_progress").length,
          resolved: data.filter((t) => t.status === "resolved" || t.status === "closed").length,
          critical: data.filter((t) => t.priority === "critical").length,
        });
        setRecentTickets(data.slice(-5).reverse());
      }
    };
    fetchStats();
  }, [user, isAdmin]);

  const statCards = [
    { label: "Total Tickets", value: stats.total, icon: Ticket, color: "text-primary" },
    { label: "Open", value: stats.open, icon: Clock, color: "text-[hsl(var(--warning))]" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-[hsl(var(--success))]" },
    { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-destructive" },
  ];

  const priorityColor: Record<string, string> = {
    low: "bg-secondary text-secondary-foreground",
    medium: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    high: "bg-destructive/15 text-destructive",
    critical: "bg-destructive text-destructive-foreground",
  };

  const statusColor: Record<string, string> = {
    open: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]",
    in_progress: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    resolved: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    closed: "bg-secondary text-secondary-foreground",
    rejected: "bg-destructive/15 text-destructive",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isAdmin ? "Admin Dashboard" : `Welcome, ${profile?.full_name || "there"}`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Overview of all support tickets" : "Track your support tickets"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Recent Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No tickets yet. Create your first ticket to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.department} · #{t.ticket_number}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge className={priorityColor[t.priority] || ""} variant="secondary">{t.priority}</Badge>
                    <Badge className={statusColor[t.status] || ""} variant="secondary">{t.status?.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
