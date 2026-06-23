import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useWallet } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";
import { uploadJson } from "@/lib/walrus";
import { addBountyToRegistry } from "@/lib/bounty-registry";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { CreateBountyParams } from "@/lib/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create Bounty — Qually" },
      { name: "description", content: "Create a new bounty on Qually." },
    ],
  }),
  component: CreateBountyPage,
});

function CreateBountyPage() {
  const { connected, address } = useWallet();
  const { createBounty, pending } = useContract();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    bountyType: "0" as "0" | "1" | "2",
    prizeSui: "",
    submissionValue: "5",
    submissionUnit: "min" as "min" | "hr" | "day",
    judgingValue: "5",
    judgingUnit: "min" as "min" | "hr" | "day",
    category: "Development",
    maxJudges: "3",
    autoExtend: false,
    requiredFields: ["GitHub Repository"] as string[],
  });

  const [step, setStep] = useState<"form" | "uploading" | "signing">("form");

  const categories = [
    "Development",
    "Design",
    "Content Creation",
    "Security",
    "Documentation",
    "Research",
    "Infrastructure",
    "Other",
  ];

  const categoryFields: Record<string, { label: string; defaultChecked: boolean }[]> = {
    Development: [
      { label: "GitHub Repository", defaultChecked: true },
      { label: "Webpage/Demo Link", defaultChecked: false },
      { label: "Technical Documentation", defaultChecked: false },
      { label: "Test Coverage Report", defaultChecked: false },
    ],
    Design: [
      { label: "Image Upload", defaultChecked: true },
      { label: "Figma Link", defaultChecked: false },
      { label: "Live Preview Link", defaultChecked: false },
      { label: "Design System Document", defaultChecked: false },
    ],
    "Content Creation": [
      { label: "X/Twitter Post Link", defaultChecked: true },
      { label: "TikTok Video Link", defaultChecked: false },
      { label: "YouTube Video Link", defaultChecked: false },
      { label: "Blog Post Link", defaultChecked: false },
      { label: "Instagram Post Link", defaultChecked: false },
    ],
    Security: [
      { label: "Audit Report", defaultChecked: true },
      { label: "PoC/Exploit Code", defaultChecked: false },
      { label: "Fix PR Link", defaultChecked: false },
    ],
    Documentation: [
      { label: "Documentation Link", defaultChecked: true },
      { label: "GitHub PR Link", defaultChecked: false },
      { label: "Preview Link", defaultChecked: false },
    ],
    Research: [
      { label: "Research Paper", defaultChecked: true },
      { label: "Data/Analysis", defaultChecked: false },
      { label: "Presentation Slides", defaultChecked: false },
    ],
    Infrastructure: [
      { label: "GitHub Repository", defaultChecked: true },
      { label: "Deployment Link", defaultChecked: false },
      { label: "Architecture Document", defaultChecked: false },
    ],
    Other: [],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const prizeMist = Math.floor(parseFloat(form.prizeSui) * 1_000_000_000);
    if (!prizeMist || prizeMist <= 0) {
      setError("Please enter a valid prize amount");
      return;
    }

    const judgingNum = parseInt(form.judgingValue);
    if (!judgingNum || judgingNum <= 0) {
      setError("Judging window must be at least 1 minute");
      return;
    }

    const now = Date.now();

    let submissionMs: number;
    const submissionNum = parseInt(form.submissionValue);
    if (form.submissionUnit === "min") {
      submissionMs = submissionNum * 60 * 1000;
    } else if (form.submissionUnit === "hr") {
      submissionMs = submissionNum * 60 * 60 * 1000;
    } else {
      submissionMs = submissionNum * 24 * 60 * 60 * 1000;
    }

    let judgingMs: number;
    if (form.judgingUnit === "min") {
      judgingMs = judgingNum * 60 * 1000;
    } else if (form.judgingUnit === "hr") {
      judgingMs = judgingNum * 60 * 60 * 1000;
    } else {
      judgingMs = judgingNum * 24 * 60 * 60 * 1000;
    }

    // Step 1: Upload brief to Walrus
    setStep("uploading");
    let briefResult;
    try {
      briefResult = await uploadJson({
        title: form.title,
        description: form.description,
        category: form.category,
        requirements: form.description,
        requiredFields: form.requiredFields,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(
        `Walrus upload failed: ${err.message}. Please try again — your bounty needs Walrus storage for the title and description.`,
      );
      setStep("form");
      return;
    }

    const blobIdBytes = Array.from(new TextEncoder().encode(briefResult.blobId));
    const params: CreateBountyParams = {
      bounty_type: parseInt(form.bountyType) as 0 | 1 | 2,
      brief_blob_id: blobIdBytes,
      brief_content_hash: briefResult.blobHash,
      submission_deadline: now + submissionMs,
      judging_deadline: now + submissionMs + judgingMs,
      poster_weight: 50,
      max_judges: parseInt(form.maxJudges),
      contest_splits: [],
      is_recurring: false,
      auto_extend: form.autoExtend,
      category_tags: [form.category],
      prizeAmountMist: prizeMist,
    };

    try {
      setStep("signing");
      const result = await createBounty(params);
      if (result.success) {
        setSubmitted(true);
        // Cache bounty ID in localStorage for discovery
        if (result.createdObjects?.length) {
          const cached = JSON.parse(localStorage.getItem("qually_bounty_ids") || "[]");
          for (const objId of result.createdObjects) {
            if (!cached.includes(objId)) cached.push(objId);
          }
          localStorage.setItem("qually_bounty_ids", JSON.stringify(cached));

          // Register bounty on Walrus for persistence
          for (const objId of result.createdObjects) {
            addBountyToRegistry(objId, address!).catch(() => {});
          }
        }
        queryClient.invalidateQueries({ queryKey: ["onChainBounties"] });
        // Navigate to the bounty detail page if we have the ID
        if (result.createdObjects?.length) {
          const bountyId = result.createdObjects.find((id) => id !== undefined);
          if (bountyId) {
            setTimeout(() => navigate({ to: "/bounty/$id", params: { id: bountyId } }), 2000);
          } else {
            setTimeout(() => navigate({ to: "/post" }), 3000);
          }
        } else {
          setTimeout(() => navigate({ to: "/post" }), 3000);
        }
      } else {
        setError(result.error || "Transaction failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create bounty");
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-[800px] px-6 py-10">
          <div className="rounded-lg border border-border bg-card p-16 text-center">
            <Wallet className="size-12 mx-auto text-on-surface-variant mb-4" />
            <h2 className="text-headline-md mb-2">Connect your wallet</h2>
            <p className="text-on-surface-variant max-w-md mx-auto">
              Connect your Sui wallet to create a bounty.
            </p>
          </div>
        </div>
        <SiteFooter compact />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-[800px] px-6 py-10">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-16 text-center">
            <CheckCircle2 className="size-12 mx-auto text-primary mb-4" />
            <h2 className="text-headline-md mb-2">Bounty Created!</h2>
            <p className="text-on-surface-variant">Redirecting to your dashboard...</p>
          </div>
        </div>
        <SiteFooter compact />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[800px] px-6 py-10">
        <button
          onClick={() => history.back()}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="text-display mb-2">Create Bounty</h1>
        <p className="text-on-surface-variant mb-8">Post a new bounty to the Qually network.</p>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bounty Type */}
          <div>
            <label className="text-label-caps text-on-surface-variant block mb-3">
              Bounty Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: "0",
                  label: "Fixed Price",
                  desc: "Single winner, set reward",
                  disabled: false,
                },
                {
                  value: "1",
                  label: "Contest",
                  desc: "Multiple winners, split prize",
                  disabled: false,
                },
                { value: "2", label: "Grant", desc: "Milestone-based payout", disabled: true },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  disabled={t.disabled}
                  onClick={() =>
                    !t.disabled && setForm({ ...form, bountyType: t.value as "0" | "1" | "2" })
                  }
                  className={`rounded-lg border p-4 text-left transition-all relative ${
                    t.disabled
                      ? "border-border bg-muted/50 opacity-60 cursor-not-allowed"
                      : form.bountyType === t.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{t.label}</p>
                    {t.disabled && (
                      <div className="flex items-center gap-1">
                        <Lock className="size-3 text-on-surface-variant" />
                        <span className="text-[10px] font-medium text-on-surface-variant bg-muted px-1.5 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-label-caps text-on-surface-variant block mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Build a Walrus upload widget"
              className="w-full h-11 px-4 rounded-md border border-border bg-card text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-label-caps text-on-surface-variant block mb-2">
              Description / Brief
            </label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm({ ...form, description: html })}
              placeholder="Describe the bounty requirements, deliverables, and acceptance criteria..."
              minHeight="200px"
            />
          </div>

          {/* Prize + Deadlines */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-label-caps text-on-surface-variant block mb-2">
                Prize (SUI)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={form.prizeSui}
                onChange={(e) => setForm({ ...form, prizeSui: e.target.value })}
                placeholder="10"
                className="w-full h-11 px-4 rounded-md border border-border bg-card text-sm font-mono placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                required
              />
              <p className="text-xs text-on-surface-variant mt-1.5">
                Pay with SUI from your wallet.{" "}
                <span
                  className="text-primary cursor-pointer hover:underline"
                  title="Cross-chain payments via LI.FI are coming soon."
                >
                  Cross-chain?
                </span>
              </p>
            </div>
            <div>
              <label className="text-label-caps text-on-surface-variant block mb-2">
                Submission Window
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={form.submissionValue}
                  onChange={(e) => setForm({ ...form, submissionValue: e.target.value })}
                  className="flex-1 h-11 px-4 rounded-md border border-border bg-card text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <select
                  value={form.submissionUnit}
                  onChange={(e) =>
                    setForm({ ...form, submissionUnit: e.target.value as "min" | "hr" | "day" })
                  }
                  className="h-11 px-3 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="min">min</option>
                  <option value="hr">hr</option>
                  <option value="day">day</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-label-caps text-on-surface-variant block mb-2">
                Judging Window
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={form.judgingValue}
                  onChange={(e) => setForm({ ...form, judgingValue: e.target.value })}
                  className="flex-1 h-11 px-4 rounded-md border border-border bg-card text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <select
                  value={form.judgingUnit}
                  onChange={(e) =>
                    setForm({ ...form, judgingUnit: e.target.value as "min" | "hr" | "day" })
                  }
                  className="h-11 px-3 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="min">min</option>
                  <option value="hr">hr</option>
                  <option value="day">day</option>
                </select>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5">
                {parseInt(form.judgingValue) <= 0
                  ? "Minimum 1 minute"
                  : form.judgingUnit === "min"
                    ? `${form.judgingValue} minute${parseInt(form.judgingValue) !== 1 ? "s" : ""}`
                    : form.judgingUnit === "hr"
                      ? `${form.judgingValue} hour${parseInt(form.judgingValue) !== 1 ? "s" : ""}`
                      : `${form.judgingValue} day${parseInt(form.judgingValue) !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Category + Max Judges + Auto-extend */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-label-caps text-on-surface-variant block mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  const defaults = (categoryFields[newCategory] || [])
                    .filter((f) => f.defaultChecked)
                    .map((f) => f.label);
                  setForm({ ...form, category: newCategory, requiredFields: defaults });
                }}
                className="w-full h-11 px-4 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label-caps text-on-surface-variant block mb-2">
                Max Judges
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.maxJudges}
                onChange={(e) => setForm({ ...form, maxJudges: e.target.value })}
                className="w-full h-11 px-4 rounded-md border border-border bg-card text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoExtend}
                  onChange={(e) => setForm({ ...form, autoExtend: e.target.checked })}
                  className="size-4 rounded border-border accent-primary"
                />
                <span className="text-sm">Auto-extend deadline</span>
              </label>
            </div>
          </div>

          {/* Submission Requirements */}
          {categoryFields[form.category] && categoryFields[form.category].length > 0 && (
            <div>
              <label className="text-label-caps text-on-surface-variant block mb-3">
                Submission Requirements
              </label>
              <p className="text-xs text-on-surface-variant mb-3">
                Select the fields submitters must provide when applying.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categoryFields[form.category].map((field) => (
                  <label
                    key={field.label}
                    className="flex items-center gap-3 cursor-pointer rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.requiredFields.includes(field.label)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({
                            ...form,
                            requiredFields: [...form.requiredFields, field.label],
                          });
                        } else {
                          setForm({
                            ...form,
                            requiredFields: form.requiredFields.filter((f) => f !== field.label),
                          });
                        }
                      }}
                      className="size-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              disabled={
                pending || step !== "form" || !form.title || !form.description || !form.prizeSui
              }
              className="h-12 px-8 rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === "uploading" ? (
                <>
                  <Cloud className="size-4 animate-pulse" /> Uploading to Walrus...
                </>
              ) : step === "signing" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing Transaction...
                </>
              ) : (
                <>
                  <Send className="size-4" /> Create Bounty
                </>
              )}
            </button>
            <p className="text-xs text-on-surface-variant mt-3">
              {step === "uploading"
                ? "Uploading your bounty brief to Walrus decentralized storage..."
                : step === "signing"
                  ? "You'll be asked to sign a transaction in your wallet. Prize amount will be escrowed on-chain."
                  : "Your brief will be stored on Walrus. Prize SUI will be escrowed on-chain."}
            </p>
          </div>
        </form>
      </div>
      <SiteFooter compact />
    </div>
  );
}
