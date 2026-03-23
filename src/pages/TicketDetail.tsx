import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Bot, Send } from "lucide-react";

export default function TicketDetail() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from("tickets").select("*").eq("id", id).single(),
      supabase.from("ticket_comments").select("*, profiles:user_id(full_name)").eq("ticket_id", id).order("created_at"),
    ]);
    setTicket(t);
    setComments(c || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (status: string) => {
    const updates: any = { status };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    await supabase.from("tickets").update(updates).eq("id", id);
    toast({ title: "Status updated" });
    fetchData();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from("ticket_comments").insert({
      ticket_id: id,
      user_id: user.id,
      content: newComment,
    });
    setNewComment("");
    fetchData();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;
  if (!ticket) return <div className="text-center py-12 text-muted-foreground">Ticket not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                #{ticket.ticket_number} · {ticket.department} · {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge variant="secondary">{ticket.priority}</Badge>
              <Badge variant="secondary">{ticket.status?.replace("_", " ")}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

          {ticket.ai_sentiment && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p className="font-medium flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /> AI Analysis</p>
              {ticket.ai_sentiment && <p><span className="text-muted-foreground">Sentiment:</span> {ticket.ai_sentiment}</p>}
              {ticket.ai_classification && <p><span className="text-muted-foreground">Classification:</span> {ticket.ai_classification}</p>}
              {ticket.ai_root_cause && <p><span className="text-muted-foreground">Root cause:</span> {ticket.ai_root_cause}</p>}
              {ticket.ai_suggested_reply && (
                <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Suggested reply:</p>
                  <p className="text-sm">{ticket.ai_suggested_reply}</p>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted-foreground">Update status:</span>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open", "in_progress", "resolved", "closed", "rejected"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">No comments yet</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {c.is_ai_generated ? "🤖 AI" : (c.profiles as any)?.full_name || "User"}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm">{c.content}</p>
            </div>
          ))}

          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleAddComment} size="icon" className="self-end shrink-0 active:scale-95 transition-transform">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
