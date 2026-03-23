import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { title, description } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const systemPrompt = `You are a support ticket analysis AI. Analyze the ticket and return structured data using the provided tool.

Rules:
- category: "valid" for real issues, "spam" for irrelevant/junk, "duplicate" if it sounds generic/repeated
- priority: assess urgency (low/medium/high/critical)
- sentiment: one word (frustrated/neutral/urgent/angry/satisfied)
- department: route to the best fit (IT/Finance/HR/Operations/Marketing/General)
- root_cause: brief root cause hypothesis
- suggested_reply: a helpful, professional reply to the employee`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Title: ${title}\nDescription: ${description}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_ticket",
              description: "Return structured ticket analysis",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["valid", "spam", "duplicate"],
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                  sentiment: { type: "string" },
                  department: {
                    type: "string",
                    enum: [
                      "IT",
                      "Finance",
                      "HR",
                      "Operations",
                      "Marketing",
                      "General",
                    ],
                  },
                  root_cause: { type: "string" },
                  suggested_reply: { type: "string" },
                },
                required: [
                  "category",
                  "priority",
                  "sentiment",
                  "department",
                  "root_cause",
                  "suggested_reply",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_ticket" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again later" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-ticket error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
