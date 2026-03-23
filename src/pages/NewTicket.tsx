import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const departments = ["IT", "Finance", "HR", "Operations", "Marketing", "General"] as const;
const priorities = ["low", "medium", "high", "critical"] as const;

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState<string>("General");
  const [priority, setPriority] = useState<string>("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: ticket, error } = await supabase.from("tickets").insert({
      title,
      description,
      department: department as any,
      priority: priority as any,
      created_by: user.id,
    }).select().single();

    if (error) {
      setLoading(false);
      toast({ title: "Failed to create ticket", description: error.message, variant: "destructive" });
      return;
    }

    // Run AI classification in background
    try {
      const { data: analysis } = await supabase.functions.invoke("classify-ticket", {
        body: { title, description },
      });
      if (analysis && !analysis.error) {
        await supabase.from("tickets").update({
          category: analysis.category,
          priority: analysis.priority,
          department: analysis.department,
          ai_sentiment: analysis.sentiment,
          ai_classification: `${analysis.category} (AI)`,
          ai_root_cause: analysis.root_cause,
          ai_suggested_reply: analysis.suggested_reply,
        }).eq("id", ticket.id);
      }
    } catch (aiErr) {
      console.error("AI classification failed:", aiErr);
    }

    setLoading(false);
    toast({ title: "Ticket created", description: "Your ticket has been submitted and AI-analyzed." });
    navigate("/dashboard/tickets");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Raise a New Ticket</CardTitle>
          <CardDescription>Describe your issue and we'll route it to the right team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Brief summary of the issue" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" placeholder="Provide details about the issue…" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full active:scale-[0.97] transition-transform" disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Submitting…" : "Submit Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
