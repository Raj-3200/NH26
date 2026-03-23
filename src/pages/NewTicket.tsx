import { useState, useRef, useCallback } from "react";
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
import { Send, Mic, MicOff } from "lucide-react";

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

  // Voice input state
  const [listening, setListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<"title" | "description">("description");
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback((target: "title" | "description") => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Your browser doesn't support voice input.", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    setVoiceTarget(target);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      if (target === "title") {
        setTitle((prev) => (prev ? prev + " " : "") + transcript);
      } else {
        setDescription((prev) => (prev ? prev + " " : "") + transcript);
      }
    };
    recognition.onerror = () => { setListening(false); };
    recognition.onend = () => { setListening(false); };
    recognition.start();
    setListening(true);
    toast({ title: "🎙️ Listening…", description: `Speak now to fill the ${target} field.` });
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

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
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title</Label>
                <Button
                  type="button"
                  variant={listening && voiceTarget === "title" ? "destructive" : "outline"}
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => listening && voiceTarget === "title" ? stopListening() : startListening("title")}
                >
                  {listening && voiceTarget === "title" ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {listening && voiceTarget === "title" ? "Stop" : "Voice"}
                </Button>
              </div>
              <Input id="title" placeholder="Brief summary of the issue" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="desc">Description</Label>
                <Button
                  type="button"
                  variant={listening && voiceTarget === "description" ? "destructive" : "outline"}
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => listening && voiceTarget === "description" ? stopListening() : startListening("description")}
                >
                  {listening && voiceTarget === "description" ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {listening && voiceTarget === "description" ? "Stop" : "Voice"}
                </Button>
              </div>
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
