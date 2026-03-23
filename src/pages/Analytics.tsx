import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(220, 65%, 45%)", "hsl(160, 50%, 42%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(215, 15%, 47%)"];

export default function Analytics() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("tickets").select("*").then(({ data }) => setTickets(data || []));
  }, []);

  const byStatus = ["open", "in_progress", "resolved", "closed", "rejected"].map((s) => ({
    name: s.replace("_", " "),
    value: tickets.filter((t) => t.status === s).length,
  })).filter((d) => d.value > 0);

  const byDepartment = ["IT", "Finance", "HR", "Operations", "Marketing", "General"].map((d) => ({
    name: d,
    tickets: tickets.filter((t) => t.department === d).length,
  })).filter((d) => d.tickets > 0);

  const byPriority = ["low", "medium", "high", "critical"].map((p) => ({
    name: p,
    value: tickets.filter((t) => t.priority === p).length,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">Tickets by Department</CardTitle></CardHeader>
          <CardContent>
            {byDepartment.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="hsl(220, 65%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">Tickets by Status</CardTitle></CardHeader>
          <CardContent>
            {byStatus.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Tickets by Priority</CardTitle></CardHeader>
          <CardContent>
            {byPriority.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byPriority} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(160, 50%, 42%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
