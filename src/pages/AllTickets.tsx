import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Search, Clock, ArrowUpCircle, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SLA_HOURS: Record<string, number> = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 48,
};

function getEstimatedTime(ticket: any) {
  const createdAt = new Date(ticket.created_at).getTime();
  const slaHours = SLA_HOURS[ticket.priority] || 24;
  const deadline = createdAt + slaHours * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = deadline - now;

  if (ticket.status === "resolved" || ticket.status === "closed") {
    return { label: "Resolved", overdue: false };
  }
  if (remaining <= 0) {
    return { label: "Overdue", overdue: true };
  }
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return { label: `~${hours}h ${mins}m left`, overdue: false };
  return { label: `~${mins}m left`, overdue: false };
}

export default function AllTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      const tickets = ticketData || [];
      setTickets(tickets);

      // Fetch employee names
      const userIds = [...new Set(tickets.map((t) => t.created_by))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        const map: Record<string, string> = {};
        profileData?.forEach((p) => {
          map[p.user_id] = p.full_name || p.email || "Unknown";
        });
        setProfiles(map);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleEscalate = async (e: React.MouseEvent, ticket: any) => {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from("tickets").update({ priority: "critical", status: "open" }).eq("id", ticket.id);
    // Add escalation comment
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("ticket_comments").insert({
        ticket_id: ticket.id,
        user_id: user.id,
        content: "⚠️ This ticket has been escalated to CRITICAL priority and sent to higher authority for immediate attention.",
      });
    }
    toast({ title: "Ticket escalated", description: `Ticket #${ticket.ticket_number} has been escalated to higher authority.` });
    // Refresh
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, priority: "critical", status: "open" } : t))
    );
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const employeeName = (profiles[t.created_by] || "").toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !employeeName.includes(q)) return false;
    }
    return true;
  });

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

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Tickets</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tickets or employee name…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["open", "in_progress", "resolved", "closed", "rejected"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {["low", "medium", "high", "critical"].map((p) => (
              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-3">
        {filtered.map((t) => {
          const eta = getEstimatedTime(t);
          return (
            <Link key={t.id} to={`/dashboard/ticket/${t.id}`}>
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-3">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {profiles[t.created_by] || "Unknown"}
                        </span>
                        <span>#{t.ticket_number}</span>
                        <span>{t.department}</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <span className={`flex items-center gap-1 text-xs font-medium ${eta.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {eta.label}
                      </span>
                      <Badge className={priorityColor[t.priority]} variant="secondary">{t.priority}</Badge>
                      <Badge className={statusColor[t.status]} variant="secondary">{t.status?.replace("_", " ")}</Badge>
                      {t.priority !== "critical" && t.status !== "resolved" && t.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => handleEscalate(e, t)}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          Escalate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
