import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, Star, Award, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "../hooks/useWallet";
import { useContract } from "../hooks/useContract";

export const Route = createFileRoute("/judges")({
  head: () => ({
    meta: [
      { title: "Judges — Qually" },
      { name: "description", content: "Become a judge on Qually. Evaluate submissions, earn reputation, and help maintain quality in the Sui ecosystem." },
    ],
  }),
  component: JudgesPage,
});

const TIERS = [
  {
    level: "T0",
    name: "New",
    color: "text-on-surface-variant",
    bg: "bg-surface-container",
    border: "border-border",
    requirements: { bounties: "0+", reputation: "—", accuracy: "—" },
    description: "Entry-level judge. Just onboarded and ready to evaluate first bounties.",
    icon: Shield,
  },
  {
    level: "T1",
    name: "Active",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    requirements: { bounties: "5+", reputation: "≥ 60%", accuracy: "≥ 50%" },
    description: "Consistent evaluator with a track record of fair, on-time reviews.",
    icon: Star,
  },
  {
    level: "T2",
    name: "Veteran",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    requirements: { bounties: "20+", reputation: "≥ 80%", accuracy: "≥ 70%" },
    description: "Experienced judge trusted with high-value bounties and complex evaluations.",
    icon: Award,
  },
  {
    level: "T3",
    name: "Elite",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    requirements: { bounties: "50+", reputation: "≥ 95%", accuracy: "≥ 85%" },
    description: "Top-tier judge. Handles the most critical bounties and disputes.",
    icon: Award,
  },
];

const SAMPLE_JUDGES = [
  { name: "SuiArchitect", tier: "T2", skills: ["Move", "DeFi"], score: 87 },
  { name: "CodeValidator", tier: "T1", skills: ["Frontend", "UI/UX"], score: 72 },
  { name: "AuditPro", tier: "T3", skills: ["Security", "Move"], score: 94 },
  { name: "BountyScout", tier: "T1", skills: ["Writing", "Research"], score: 68 },
];

function JudgesPage() {
  const { connected } = useWallet();
  const { mintJudgeProfile, applyAsJudge, pending } = useContract();

  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [profileMinted, setProfileMinted] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBounty, setSelectedBounty] = useState("");

  async function handleMintProfile() {
    setError(null);
    const result = await mintJudgeProfile();
    if (result.success) {
      setProfileMinted(true);
      if (result.createdObjects && result.createdObjects.length > 0) {
        setProfileId(result.createdObjects[0]);
      }
    } else {
      setError(result.error ?? "Failed to mint profile");
    }
  }

  async function handleApply() {
    setError(null);
    if (!selectedBounty.trim()) {
      setError("Please enter a bounty ID to apply for");
      return;
    }
    if (!profileId) {
      setError("Profile not found. Please mint your profile first.");
      return;
    }
    const result = await applyAsJudge(profileId, selectedBounty, 1, []);
    if (result.success) {
      setApplied(true);
    } else {
      setError(result.error ?? "Failed to apply");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader showSearch />

      <div className="grid-bg-lg border-b border-border">
        <div className="mx-auto max-w-[1280px] px-6 py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-md bg-primary/10 border border-primary/20 grid place-items-center text-primary">
              <Shield className="size-5" />
            </div>
            <h1 className="text-display">Judge System</h1>
          </div>
          <p className="mt-2 text-on-surface-variant max-w-2xl">
            Become a trusted evaluator on Qually. Review submissions, earn reputation, and help maintain quality across the Sui ecosystem.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 py-10 space-y-10">
        {/* Tier System */}
        <section>
          <h2 className="text-headline-md mb-5">Judge Tiers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.level}
                  className={`rounded-lg border ${tier.border} ${tier.bg} p-5`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`size-9 rounded-md ${tier.bg} border ${tier.border} grid place-items-center ${tier.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <span className={`font-mono font-bold ${tier.color}`}>{tier.level}</span>
                      <span className="ml-2 text-sm font-semibold">{tier.name}</span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">{tier.description}</p>
                  <div className="border-t border-border/50 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Bounties Judged</span>
                      <span className="font-mono font-semibold">{tier.requirements.bounties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Reputation</span>
                      <span className="font-mono font-semibold">{tier.requirements.reputation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Accuracy</span>
                      <span className="font-mono font-semibold">{tier.requirements.accuracy}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Active Judges Directory */}
          <section>
            <h2 className="text-headline-md mb-5">Active Judges</h2>
            {connected ? (
              <div className="space-y-3">
                {SAMPLE_JUDGES.map((judge) => (
                  <div key={judge.name} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-md bg-primary/10 border border-primary/20 grid place-items-center text-primary font-mono font-bold text-sm">
                        {judge.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{judge.name}</span>
                          <Badge variant="outline" className="font-mono text-[10px]">{judge.tier}</Badge>
                        </div>
                        <div className="flex gap-2 mt-1">
                          {judge.skills.map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-border">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-primary">{judge.score}</span>
                      <span className="text-label-caps text-on-surface-variant block">SCORE</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Shield className="size-10 text-on-surface-variant mx-auto mb-3" />
                <p className="text-on-surface-variant">Connect wallet to see judge applications and the full directory.</p>
              </div>
            )}
          </section>

          {/* Application Form */}
          <section>
            <h2 className="text-headline-md mb-5">Become a Judge</h2>
            <div className="rounded-lg border border-border bg-card p-6 space-y-5">
              {!connected ? (
                <div className="text-center py-8">
                  <Shield className="size-10 text-on-surface-variant mx-auto mb-3" />
                  <p className="text-on-surface-variant text-sm">Connect wallet to apply as judge.</p>
                </div>
              ) : (
                <>
                  {!profileMinted ? (
                    <div className="space-y-4">
                      <p className="text-sm text-on-surface-variant">
                        Mint your on-chain judge profile to get started. This creates your identity as a Qually judge.
                      </p>
                      <Button onClick={handleMintProfile} disabled={pending} className="w-full">
                        {pending ? (
                          <><Loader2 className="size-4 animate-spin" /> Minting...</>
                        ) : (
                          "Mint Judge Profile"
                        )}
                      </Button>
                    </div>
                  ) : !applied ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <CheckCircle2 className="size-4" />
                        <span>Profile minted{profileId ? ` (${profileId.slice(0, 8)}...)` : ''}. Now apply to judge a bounty.</span>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Bounty ID to Judge</label>
                        <Input
                          placeholder="Paste the bounty object ID"
                          value={selectedBounty}
                          onChange={(e) => setSelectedBounty(e.target.value)}
                        />
                        <p className="text-xs text-on-surface-variant mt-1">Find bounty IDs on the Explore page</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Motivation</label>
                        <Textarea
                          placeholder="Why do you want to be a judge on Qually?"
                          value={motivation}
                          onChange={(e) => setMotivation(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Experience</label>
                        <Textarea
                          placeholder="Relevant experience evaluating code, design, or technical work..."
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button onClick={handleApply} disabled={pending || !selectedBounty.trim()} className="w-full">
                        {pending ? (
                          <><Loader2 className="size-4 animate-spin" /> Submitting...</>
                        ) : (
                          "Apply as Judge (1 SUI stake)"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="size-10 text-green-500 mx-auto mb-3" />
                      <p className="font-semibold mb-1">Application submitted!</p>
                      <p className="text-sm text-on-surface-variant">Once approved, you can start evaluating bounties.</p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
