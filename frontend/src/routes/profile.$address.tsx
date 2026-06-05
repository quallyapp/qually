import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wallet, Copy, Check, User, FileBarChart, Trophy, Target, Clock, ArrowRight, Frown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useOnChainBounties } from "@/hooks/useOnChainBounties";
import { useWallet } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";
import { uploadText } from "@/lib/walrus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/profile/$address")({
  head: () => ({
    meta: [
      { title: "Profile — Qually" },
      { name: "description", content: "View and manage your on-chain profile on Qually." },
    ],
  }),
  component: ProfilePage,
});

function formatSui(mist: number) {
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(mist);
  return `${formatted} SUI`;
}

function truncAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeUntil(date: Date) {
  const now = Date.now();
  const diff = date.getTime() - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

function ProfilePage() {
  const { address: routeAddress } = Route.useParams();
  const { connected, address: connectedAddress } = useWallet();
  const { createPosterProfile, createHunterProfile, pending } = useContract();
  const { data: allBounties, isLoading } = useOnChainBounties();

  const isOwnProfile = connected && connectedAddress === routeAddress;

  const [copied, setCopied] = useState(false);
  const [profileType, setProfileType] = useState<"poster" | "hunter">("poster");
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ success: boolean; error?: string } | null>(null);

  const postedBounties = useMemo(() => {
    if (!allBounties || !routeAddress) return [];
    return allBounties.filter((b) => b.posterAddress === routeAddress);
  }, [allBounties, routeAddress]);

  const totalEscrowed = useMemo(
    () => postedBounties.reduce((sum, b) => sum + b.prizePool, 0),
    [postedBounties]
  );

  const activeBounties = useMemo(
    () => postedBounties.filter((b) => b.status === "open" || b.status === "review"),
    [postedBounties]
  );

  const closedBounties = useMemo(
    () => postedBounties.filter((b) => b.status === "closed"),
    [postedBounties]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(routeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateProfile = async () => {
    if (!profileName.trim()) return;
    setCreating(true);
    setCreateResult(null);

    try {
      const bioContent = JSON.stringify({ name: profileName, bio: profileBio, skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean) });
      const uploadResult = await uploadText(bioContent);

      let result;
      if (profileType === "poster") {
        result = await createPosterProfile(profileName, uploadResult.blobHash);
      } else {
        const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
        result = await createHunterProfile(profileName, uploadResult.blobHash, skills);
      }

      setCreateResult(result);
    } catch (e: any) {
      setCreateResult({ success: false, error: e.message || "Profile creation failed" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader showSearch />

      <div className="mx-auto max-w-[1280px] px-6 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-display">Profile</h1>
            <p className="mt-2 text-on-surface-variant">
              {isOwnProfile ? "Manage your on-chain identity." : "View this user's activity on Qually."}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Main content */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="size-16 rounded-full bg-surface-container grid place-items-center text-primary flex-shrink-0">
                  <User className="size-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-headline-md font-semibold truncate">{truncAddr(routeAddress)}</h2>
                    <span className="text-label-mono px-2 py-1 rounded-sm bg-surface-container text-on-surface-variant border border-border">
                      User
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-sm text-on-surface-variant font-mono truncate">{routeAddress}</code>
                    <button onClick={handleCopy} className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0" title="Copy address">
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={<FileBarChart className="size-5" />} label="BOUNTIES POSTED" value={String(postedBounties.length).padStart(2, "0")} trend={`${activeBounties.length} active`} />
              <Stat icon={<Target className="size-5" />} label="SUBMISSIONS" value="—" trend="Coming soon" />
              <Stat icon={<Trophy className="size-5" />} label="SUI EARNED" value={formatSui(totalEscrowed)} trend={`${closedBounties.length} closed`} />
              <Stat icon={<Clock className="size-5" />} label="WIN RATE" value="—" trend="Coming soon" />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="posted">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="posted">Posted Bounties</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="judge">Judge History</TabsTrigger>
              </TabsList>

              <TabsContent value="posted" className="mt-4">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center text-on-surface-variant">Loading bounties...</div>
                  ) : postedBounties.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                      <Frown className="size-8 mx-auto text-on-surface-variant mb-3" />
                      <p className="text-on-surface-variant">No bounties posted yet.</p>
                    </div>
                  ) : (
                    postedBounties.map((b) => (
                      <article key={b.id} className="rounded-lg border border-border bg-card p-5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-label-mono px-2 py-1 rounded-sm ${b.status === "review" ? "bg-warning/15 text-warning border border-warning/30" : b.status === "open" ? "bg-primary/10 text-primary border border-primary/20" : "bg-surface-container text-on-surface-variant border border-border"}`}>
                              {b.status.toUpperCase()}
                            </span>
                            <span className="text-label-mono text-on-surface-variant">#{b.id.slice(0, 8)}</span>
                          </div>
                          <span className="font-mono font-bold text-primary">{formatSui(b.prizePool)}</span>
                        </div>
                        <h3 className="font-semibold text-lg">{b.title}</h3>
                        <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{b.description || "No description provided."}</p>
                        <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                          <p className={`text-label-mono ${b.status === "review" ? "text-warning" : "text-on-surface-variant"}`}>
                            {b.submissionCount} Submission{b.submissionCount !== 1 ? "s" : ""} • {b.status === "review" ? "Review Period" : b.status === "closed" ? "Closed" : timeUntil(b.submissionDeadline)}
                          </p>
                          <Link to="/bounty/$id" params={{ id: b.id }} className="text-sm font-semibold h-9 px-4 rounded-md border border-border bg-surface-low hover:border-primary/40 inline-flex items-center gap-1">
                            View <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="submissions" className="mt-4">
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Frown className="size-8 mx-auto text-on-surface-variant mb-3" />
                  <p className="text-on-surface-variant">Submissions data coming soon.</p>
                </div>
              </TabsContent>

              <TabsContent value="judge" className="mt-4">
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Frown className="size-8 mx-auto text-on-surface-variant mb-3" />
                  <p className="text-on-surface-variant">Judge history coming soon.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Create Profile Widget (own profile only) */}
            {isOwnProfile && (
              <div className="rounded-lg border border-border bg-card p-5 border-t-2 border-t-primary">
                <h3 className="font-semibold mb-4">Create On-Chain Profile</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-label-mono text-on-surface-variant block mb-2">PROFILE TYPE</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="profileType"
                          value="poster"
                          checked={profileType === "poster"}
                          onChange={() => setProfileType("poster")}
                          className="accent-primary"
                        />
                        Poster
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="profileType"
                          value="hunter"
                          checked={profileType === "hunter"}
                          onChange={() => setProfileType("hunter")}
                          className="accent-primary"
                        />
                        Hunter
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-label-mono text-on-surface-variant block mb-2">NAME</label>
                    <Input
                      placeholder="Your display name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-label-mono text-on-surface-variant block mb-2">BIO</label>
                    <Textarea
                      placeholder="Tell others about yourself..."
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                    />
                  </div>

                  {profileType === "hunter" && (
                    <div>
                      <label className="text-label-mono text-on-surface-variant block mb-2">SKILLS (comma-separated)</label>
                      <Input
                        placeholder="Rust, Solana, TypeScript"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                      />
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleCreateProfile}
                    disabled={creating || pending || !profileName.trim()}
                  >
                    {creating || pending ? "Creating..." : "Create Profile"}
                  </Button>

                  {createResult && (
                    <div className={`text-sm p-3 rounded-md ${createResult.success ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                      {createResult.success ? "Profile created successfully!" : createResult.error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Not connected prompt for own profile */}
            {isOwnProfile === false && connectedAddress === null && routeAddress && (
              <div className="rounded-lg border border-border bg-card p-5 border-t-2 border-t-primary">
                <Wallet className="size-8 mx-auto text-on-surface-variant mb-3" />
                <h3 className="font-semibold text-center mb-2">Connect Wallet</h3>
                <p className="text-sm text-on-surface-variant text-center">
                  Connect your wallet to manage your profile.
                </p>
              </div>
            )}

            {/* Reputation card */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Reputation</h3>
              <div className="flex items-center gap-4">
                <div className="relative size-20 rounded-full grid place-items-center" style={{ background: "conic-gradient(var(--primary) 0 0%, var(--surface-container) 0% 100%)" }}>
                  <div className="size-16 rounded-full bg-card grid place-items-center font-mono font-bold text-lg">—</div>
                </div>
                <div>
                  <p className="text-label-caps text-on-surface-variant">TIER: UNRANKED</p>
                  <p className="text-sm text-on-surface-variant mt-1">No reputation data yet</p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Total Bounties</span>
                  <span className="font-mono font-semibold">{postedBounties.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Active Bounties</span>
                  <span className="font-mono font-semibold">{activeBounties.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Total Escrowed</span>
                  <span className="font-mono font-semibold text-primary">{formatSui(totalEscrowed)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter compact />
    </div>
  );
}

function Stat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="size-9 rounded-md bg-surface-container grid place-items-center text-primary">{icon}</div>
        <span className="text-label-mono text-on-surface-variant">{trend}</span>
      </div>
      <p className="text-label-caps text-on-surface-variant">{label}</p>
      <p className="font-mono font-bold text-2xl mt-1">{value}</p>
    </div>
  );
}
