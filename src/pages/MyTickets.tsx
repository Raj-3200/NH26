import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Ticket } from "lucide-react";

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tickets")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTickets(data || []);
        setLoading(false);
      });
  }, [user]);

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

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading tickets…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground mt-1">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/new-ticket"><Plus className="w-4 h-4 mr-2" />New Ticket</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="text-center py-16">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-4">You haven't raised any tickets yet.</p>
            <Button asChild><Link to="/dashboard/new-ticket"><Plus className="w-4 h-4 mr-2" />Create Your First Ticket</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} to={`/dashboard/ticket/${t.id}`}>
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      #{t.ticket_number} · {t.department} · {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Badge className={priorityColor[t.priority]} variant="secondary">{t.priority}</Badge>
                    <Badge className={statusColor[t.status]} variant="secondary">{t.status?.replace("_", " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
