import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Save,
  Camera,
  TrendingUp,
  Globe,
  Bell,
  Target,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  experience_level: string | null;
  preferred_markets: string[];
  timezone: string;
  trading_goals: string | null;
  notification_email: boolean;
  notification_push: boolean;
  notification_telegram: boolean;
}

const experienceLevels = [
  { value: "beginner", label: "Beginner", description: "New to trading" },
  { value: "intermediate", label: "Intermediate", description: "1-3 years experience" },
  { value: "advanced", label: "Advanced", description: "3-5 years experience" },
  { value: "professional", label: "Professional", description: "5+ years, full-time" },
];

const markets = [
  "Forex",
  "Crypto",
  "Stocks",
  "Commodities",
  "Indices",
  "Options",
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
];

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          ...data,
          preferred_markets: data.preferred_markets || [],
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          experience_level: profile.experience_level,
          preferred_markets: profile.preferred_markets,
          timezone: profile.timezone,
          trading_goals: profile.trading_goals,
          notification_email: profile.notification_email,
          notification_push: profile.notification_push,
          notification_telegram: profile.notification_telegram,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleMarket = (market: string) => {
    if (!profile) return;
    const markets = profile.preferred_markets.includes(market)
      ? profile.preferred_markets.filter((m) => m !== market)
      : [...profile.preferred_markets, market];
    setProfile({ ...profile, preferred_markets: markets });
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "TB";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your trading profile</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h2 className="text-2xl font-bold">
                  {profile?.display_name || "Trader"}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {profile?.experience_level && (
                    <Badge variant="secondary" className="capitalize">
                      {profile.experience_level}
                    </Badge>
                  )}
                  {profile?.preferred_markets.slice(0, 3).map((market) => (
                    <Badge key={market} variant="outline">
                      {market}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="general" className="gap-2">
              <User className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="trading" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Globe className="w-4 h-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your display name and bio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      value={profile?.display_name || ""}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, display_name: e.target.value } : p
                        )
                      }
                      placeholder="Your display name"
                      className="bg-secondary border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avatar URL</Label>
                    <Input
                      value={profile?.avatar_url || ""}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, avatar_url: e.target.value } : p
                        )
                      }
                      placeholder="https://example.com/avatar.png"
                      className="bg-secondary border-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={profile?.bio || ""}
                    onChange={(e) =>
                      setProfile((p) => (p ? { ...p, bio: e.target.value } : p))
                    }
                    placeholder="Tell us about yourself and your trading journey..."
                    className="bg-secondary border-0 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Trading Experience</CardTitle>
                <CardDescription>
                  Set your experience level and preferred markets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Experience Level</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {experienceLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() =>
                          setProfile((p) =>
                            p ? { ...p, experience_level: level.value } : p
                          )
                        }
                        className={`p-4 rounded-lg border text-left transition-all ${
                          profile?.experience_level === level.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{level.label}</span>
                          {profile?.experience_level === level.value && (
                            <CheckCircle className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {level.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Preferred Markets</Label>
                  <div className="flex flex-wrap gap-2">
                    {markets.map((market) => (
                      <Badge
                        key={market}
                        variant={
                          profile?.preferred_markets.includes(market)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer transition-all"
                        onClick={() => toggleMarket(market)}
                      >
                        {market}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Trading Goals
                </CardTitle>
                <CardDescription>
                  What are you trying to achieve with your trading?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={profile?.trading_goals || ""}
                  onChange={(e) =>
                    setProfile((p) =>
                      p ? { ...p, trading_goals: e.target.value } : p
                    )
                  }
                  placeholder="e.g., Generate consistent monthly income, grow capital by 20% annually, learn algorithmic trading..."
                  className="bg-secondary border-0 min-h-[100px]"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>
                  Configure your timezone for accurate trading schedules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={profile?.timezone || "UTC"}
                    onValueChange={(value) =>
                      setProfile((p) => (p ? { ...p, timezone: value } : p))
                    }
                  >
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for session filters and trade scheduling
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive trade alerts and daily summaries via email
                    </p>
                  </div>
                  <Switch
                    checked={profile?.notification_email ?? true}
                    onCheckedChange={(checked) =>
                      setProfile((p) =>
                        p ? { ...p, notification_email: checked } : p
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <Label className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Browser notifications for real-time alerts
                    </p>
                  </div>
                  <Switch
                    checked={profile?.notification_push ?? true}
                    onCheckedChange={(checked) =>
                      setProfile((p) =>
                        p ? { ...p, notification_push: checked } : p
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <Label className="font-medium">Telegram Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Configure in Settings → Notifications
                    </p>
                  </div>
                  <Switch
                    checked={profile?.notification_telegram ?? false}
                    onCheckedChange={(checked) =>
                      setProfile((p) =>
                        p ? { ...p, notification_telegram: checked } : p
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Profile;