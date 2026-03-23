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
import { Send, Mic, MicOff, AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const departments = ["IT", "Finance", "HR", "Operations", "Marketing", "General"] as const;
const priorities = ["low", "medium", "high", "critical"] as const;

// Predefined issue categories and types from helpdesk dataset
const issueCategories = {
  Hardware: {
    issues: [
      { type: "Laptop Not Turning On", description: "Laptop does not power on after pressing button", priority: "high" },
      { type: "Keyboard Not Working", description: "Some keys not functioning on keyboard", priority: "medium" },
      { type: "Screen Flickering", description: "Laptop screen flickers randomly", priority: "medium" },
      { type: "Overheating Laptop", description: "Laptop heating up quickly during use", priority: "high" },
      { type: "Fan Noise", description: "Laptop fan making loud noise", priority: "low" },
      { type: "Coffee/Liquid Spill", description: "Liquid spilled on laptop or keyboard", priority: "high" },
    ],
  },
  Software: {
    issues: [
      { type: "Application Crash", description: "Application crashes while opening or using", priority: "medium" },
      { type: "Software Installation", description: "Need installation of specific software", priority: "low" },
      { type: "Update Failure", description: "System update failed", priority: "medium" },
      { type: "Login Issue", description: "Cannot login to internal portal or application", priority: "medium" },
      { type: "Weird Popups", description: "Unknown popups appearing randomly on screen", priority: "medium" },
      { type: "Auto Logout", description: "System logs out automatically", priority: "medium" },
      { type: "Dark Mode / UI Issue", description: "UI glitch or display issue in application", priority: "low" },
    ],
  },
  Network: {
    issues: [
      { type: "Slow Internet", description: "Internet speed extremely slow", priority: "medium" },
      { type: "VPN Connection Issue", description: "Unable to connect to company VPN", priority: "high" },
      { type: "WiFi Not Connecting", description: "Cannot connect to office WiFi", priority: "medium" },
      { type: "DNS Issue", description: "Website not resolving domain name", priority: "high" },
      { type: "Intermittent Drop", description: "Internet disconnects frequently", priority: "high" },
      { type: "IP Conflict", description: "Duplicate IP address detected on network", priority: "high" },
    ],
  },
  Access: {
    issues: [
      { type: "Password Reset", description: "Forgot system login password", priority: "low" },
      { type: "Account Locked", description: "Account locked after multiple login attempts", priority: "medium" },
      { type: "Wrong Permissions", description: "Cannot access shared drive or folder", priority: "medium" },
    ],
  },
  Email: {
    issues: [
      { type: "Email Not Sending", description: "Unable to send emails via email client", priority: "high" },
      { type: "Spam Emails", description: "Receiving excessive spam emails", priority: "low" },
      { type: "Missing Attachments", description: "Email attachments not visible or downloadable", priority: "medium" },
    ],
  },
  Security: {
    issues: [
      { type: "Suspicious Activity", description: "Unusual login attempt or activity detected", priority: "high" },
      { type: "Phishing Email", description: "Suspicious phishing email received", priority: "high" },
      { type: "USB Blocked", description: "External USB device not recognized or blocked", priority: "low" },
    ],
  },
  Printer: {
    issues: [
      { type: "Printer Offline", description: "Office printer not responding", priority: "low" },
      { type: "Paper Jam", description: "Printer stuck due to paper jam", priority: "low" },
    ],
  },
};

type IssueCategory = keyof typeof issueCategories;

const priorityConfig = {
  low: { label: "Low", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Info, message: "This is a low-priority issue. It will be resolved during normal working hours." },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertCircle, message: "This is a medium-priority issue. Our team will address it within a few hours." },
  high: { label: "High", color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle, message: "This is a high-priority issue. Our team will prioritize this and respond quickly." },
  critical: { label: "Critical", color: "bg-red-100 text-red-800 border-red-200", icon: ShieldAlert, message: "This is a critical issue requiring immediate attention. Our team will respond ASAP." },
};

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState<string>("General");
  const [priority, setPriority] = useState<string>("medium");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<string>("");

  // Voice input state
  const [listening, setListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<"title" | "description">("description");
  const recognitionRef = useRef<any>(null);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedIssue("");
    if (category !== "Other") {
      // Auto-set department based on category
      if (category === "Network" || category === "Security") setDepartment("IT");
      else if (category === "Email") setDepartment("IT");
      else if (category === "Printer") setDepartment("Operations");
      else setDepartment("IT");
    }
  };

  const handleIssueChange = (issueType: string) => {
    setSelectedIssue(issueType);
    if (issueType === "Other") return;

    const category = issueCategories[selectedCategory as IssueCategory];
    if (!category) return;
    const issue = category.issues.find((i) => i.type === issueType);
    if (issue) {
      setTitle(issue.type);
      setDescription(issue.description);
      setPriority(issue.priority);
    }
  };

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

  const currentPriority = priorityConfig[priority as keyof typeof priorityConfig];
  const PriorityIcon = currentPriority?.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Raise a New Ticket</CardTitle>
          <CardDescription>Select your issue type or describe a custom problem.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Issue Category Selection */}
            <div className="space-y-2">
              <Label>What type of problem are you facing?</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue placeholder="Select a category…" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(issueCategories).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other (describe manually)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Issue Type Selection */}
            {selectedCategory && selectedCategory !== "Other" && (
              <div className="space-y-2">
                <Label>Select your specific issue</Label>
                <Select value={selectedIssue} onValueChange={handleIssueChange}>
                  <SelectTrigger><SelectValue placeholder="Select an issue…" /></SelectTrigger>
                  <SelectContent>
                    {issueCategories[selectedCategory as IssueCategory]?.issues.map((issue) => (
                      <SelectItem key={issue.type} value={issue.type}>{issue.type}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other (describe manually)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority Importance Banner */}
            {(selectedIssue || selectedCategory === "Other") && currentPriority && (
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${currentPriority.color}`}>
                {PriorityIcon && <PriorityIcon className="w-5 h-5 mt-0.5 shrink-0" />}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Priority:</span>
                    <Badge variant="outline" className={currentPriority.color}>
                      {currentPriority.label}
                    </Badge>
                  </div>
                  <p className="text-sm opacity-90">{currentPriority.message}</p>
                </div>
              </div>
            )}

            {/* Title */}
            {(selectedCategory) && (
              <>
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
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
