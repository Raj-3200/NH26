import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headset, Brain, BarChart3, Shield, Zap, Users } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Classification", desc: "Automatically classifies tickets as valid, spam, or duplicate using advanced AI models." },
  { icon: Zap, title: "Smart Routing", desc: "Routes tickets to the right department — IT, Finance, HR, Operations, or Marketing." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights into ticket trends, workload distribution, and SLA compliance." },
  { icon: Shield, title: "Priority Detection", desc: "AI-powered sentiment analysis and priority scoring for every incoming ticket." },
  { icon: Users, title: "Team Collaboration", desc: "Admins and employees collaborate with comments, status updates, and AI suggestions." },
  { icon: Headset, title: "Self-Learning System", desc: "Continuously improves classification accuracy from resolved ticket patterns." },
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Headset className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold" style={{ lineHeight: "1.15" }}>SmartDesk</h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
          An intelligent, AI-powered complaint management and ticketing system that predicts, analyzes, and resolves issues automatically while reducing workload and improving efficiency.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
