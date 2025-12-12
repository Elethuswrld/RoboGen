import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Shield, Activity, Settings, Trash2, Edit, Clock } from "lucide-react";

const teamMembers = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active", lastActive: "Now" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Trader", status: "Active", lastActive: "5 min ago" },
  { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "Viewer", status: "Active", lastActive: "1 hour ago" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", role: "Trader", status: "Invited", lastActive: "Never" },
];

const auditLog = [
  { id: 1, user: "John Doe", action: "Modified risk settings", timestamp: "2024-12-05 14:32" },
  { id: 2, user: "Jane Smith", action: "Enabled MA Crossover strategy", timestamp: "2024-12-05 13:15" },
  { id: 3, user: "John Doe", action: "Invited Alice Brown", timestamp: "2024-12-05 11:00" },
  { id: 4, user: "Jane Smith", action: "Closed EURUSD position", timestamp: "2024-12-05 10:45" },
  { id: 5, user: "Bob Wilson", action: "Exported trade journal", timestamp: "2024-12-04 16:20" },
];

const Team = () => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-primary/20 text-primary";
      case "Trader": return "bg-accent/20 text-accent";
      case "Viewer": return "bg-secondary text-muted-foreground";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">{teamMembers.length} team members</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <Shield className="w-8 h-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.role === "Admin").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <Activity className="w-8 h-8 text-buy" />
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.lastActive === "Now").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.status === "Invited").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="members" className="gap-2"><Users className="w-4 h-4" />Members</TabsTrigger>
            <TabsTrigger value="roles" className="gap-2"><Shield className="w-4 h-4" />Roles</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><Activity className="w-4 h-4" />Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card className="bg-card border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {member.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "Active" ? "default" : "outline"}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.lastActive}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Admin", permissions: ["Full access", "Manage users", "Configure settings", "Execute trades", "View all data"], color: "border-l-primary" },
                { name: "Trader", permissions: ["Execute trades", "Modify strategies", "View positions", "Export data"], color: "border-l-accent" },
                { name: "Viewer", permissions: ["View dashboard", "View positions", "Export reports"], color: "border-l-muted-foreground" },
              ].map((role) => (
                <Card key={role.name} className={`bg-card border-border border-l-4 ${role.color}`}>
                  <CardHeader>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>{teamMembers.filter(m => m.role === role.name).length} members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {role.permissions.map((perm) => (
                        <li key={perm} className="text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Permissions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent team activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLog.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {log.user.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{log.user}</span>
                          <span className="text-muted-foreground"> {log.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Team;
