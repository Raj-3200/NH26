import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Users, Shield, UserCheck } from "lucide-react";

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    if (profiles && roles) {
      const combined = profiles.map((p) => ({
        ...p,
        roles: roles.filter((r) => r.user_id === p.user_id).map((r) => r.role),
      }));
      setUsers(combined);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as any });
    }
    toast({ title: isCurrentlyAdmin ? "Admin role removed" : "Admin role granted" });
    fetchUsers();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      <div className="space-y-3">
        {users.map((u) => {
          const isAdmin = u.roles.includes("admin");
          return (
            <Card key={u.id} className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{u.full_name || "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge variant="secondary" className={isAdmin ? "bg-primary/10 text-primary" : ""}>
                    {isAdmin ? <><Shield className="w-3 h-3 mr-1" />Admin</> : <><UserCheck className="w-3 h-3 mr-1" />Employee</>}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => toggleAdmin(u.user_id, isAdmin)}>
                    {isAdmin ? "Remove Admin" : "Make Admin"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
