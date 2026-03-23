import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0, 72%, 51%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(38, 92%, 50%)",
  low: "hsl(160, 50%, 42%)",
};

export default function Dashboard() {
  const { role, user, profile } = useAuth();
  const isAdmin = role === "admin";
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, critical: 0 });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);

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

        // Priority breakdown
        const pData = ["critical", "high", "medium", "low"].map((p) => ({
          name: p.charAt(0).toUpperCase() + p.slice(1),
          value: data.filter((t) => t.priority === p).length,
          fill: PRIORITY_COLORS[p],
        })).filter((d) => d.value > 0);
        setPriorityData(pData);

        // Employee ticket counts (admin only)
        if (isAdmin) {
          const byUser: Record<string, number> = {};
          data.forEach((t) => {
            byUser[t.created_by] = (byUser[t.created_by] || 0) + 1;
          });

          // Fetch profile names
          const userIds = Object.keys(byUser);
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, full_name, email")
              .in("user_id", userIds);

            const empData = userIds.map((uid) => {
              const prof = profiles?.find((p) => p.user_id === uid);
              return {
                name: prof?.full_name || prof?.email || uid.slice(0, 8),
                tickets: byUser[uid],
              };
            }).sort((a, b) => b.tickets - a.tickets);
            setEmployeeData(empData);
          }
        }
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

  const priorityBadge: Record<string, string> = {
    low: "bg-secondary text-secondary-foreground",
    medium: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    high: "bg-destructive/15 text-destructive",
    critical: "bg-destructive text-destructive-foreground",
  };

  const statusBadge: Record<string, string> = {
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

      {/* Stat Cards */}
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

      {/* Admin-only: Priority Breakdown & Employee Ticket Counts */}
      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Priority Pie Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-destructive" />
                Tickets by Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              {priorityData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tickets yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Employee Ticket Counts */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Tickets Raised by Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeeData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={employeeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="tickets" fill="hsl(220, 65%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Tickets */}
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
                    <Badge className={priorityBadge[t.priority] || ""} variant="secondary">{t.priority}</Badge>
                    <Badge className={statusBadge[t.status] || ""} variant="secondary">{t.status?.replace("_", " ")}</Badge>
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
