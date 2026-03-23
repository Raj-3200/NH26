import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function AllTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("tickets").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setTickets(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
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
          <Input placeholder="Search tickets…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        {filtered.map((t) => (
          <Link key={t.id} to={`/dashboard/ticket/${t.id}`}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-3">
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
    </div>
  );
}
