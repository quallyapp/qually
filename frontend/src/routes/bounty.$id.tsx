import { useState, useEffect, useCallback } from "react";
import { Link, createFileRoute, useParams, Outlet, useMatchRoute } from "@tanstack/react-router";
import { Info, Cloud, Link as LinkIcon, BadgeCheck, Lock, Send, Share2, Copy, ShieldCheck, Shield, User, ExternalLink, Loader2, Vote, DollarSign, Plus, Pencil, Trash2, X, Check, FileText } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { useOnChainBounty } from "../hooks/useOnChainBounties";
import { useWallet } from "../hooks/useWallet";
import { PosterActions } from "../components/bounty/PosterActions";
import { JudgeActions } from "../components/bounty/JudgeActions";
import { getApplicationsForBounty, getJudgeDetailsForApplication, updateApplicationState, type JudgeApplication } from "../lib/judge-applications";
import type { JudgeProfileDetails } from "../lib/judge-profiles";
import { useContract } from "../hooks/useContract";
import { getNickname } from "../lib/user-profiles";
import { sanitizeHtml } from "../lib/utils";

export const Route = createFileRoute("/bounty/$id")({
  head: () => ({
    meta: [
      { title: "Bounty Detail — Qually" },
      { name: "description", content: "View bounty details and submit your work on Qually." },
    ],
  }),
  component: BountyDetail,
});

const STATUS_LABELS: Record<string, string> = {
  open: "OPEN",
  review: "REVIEW",
  closed: "CLOSED",
};

function formatPrizePool(prizePool: number): string {
  return `${prizePool.toLocaleString()} SUI`;
}

function getTimeRemaining(deadline: Date): { days: string; hours: string; minutes: string; seconds: string } {
  const now = Date.now();
  const diff = deadline.getTime() - now;
  if (diff <= 0) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface CustomTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface ApplicationWithDetails extends JudgeApplication {
  judgeDetails?: JudgeProfileDetails | null;
}

function getCustomEvents(bountyId: string): CustomTimelineEvent[] {
  try {
    return JSON.parse(localStorage.getItem(`qually_timeline_${bountyId}`) || "[]");
  } catch {
    return [];
  }
}

function saveCustomEvents(bountyId: string, events: CustomTimelineEvent[]) {
  localStorage.setItem(`qually_timeline_${bountyId}`, JSON.stringify(events));
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1280px] px-6 py-10 grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="border-l-2 border-primary/30 pl-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-32 rounded-sm bg-surface-container animate-pulse" />
              <div className="h-5 w-28 rounded-sm bg-surface-container animate-pulse" />
            </div>
            <div className="h-10 w-96 rounded bg-surface-container animate-pulse mb-3" />
            <div className="h-5 w-80 rounded bg-surface-container animate-pulse" />
          </div>
          <aside className="rounded-lg border border-border bg-card p-5 self-start space-y-3">
            <div className="h-5 w-24 rounded bg-surface-container animate-pulse" />
            <div className="h-8 w-32 rounded bg-surface-container animate-pulse" />
            <div className="border-t border-border pt-3">
              <div className="h-5 w-28 rounded bg-surface-container animate-pulse" />
            </div>
          </aside>
        </div>
      </section>
      <div className="mx-auto max-w-[1280px] px-6 py-10 grid lg:grid-cols-[260px_1fr_280px] gap-6">
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="h-5 w-32 rounded bg-surface-container animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-surface-container animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-surface-container animate-pulse" />
                <div className="h-3 w-24 rounded bg-surface-container animate-pulse" />
              </div>
            </div>
          </div>
        </aside>
        <main className="rounded-lg border border-border bg-card min-h-[400px]">
          <div className="p-6 space-y-4">
            <div className="h-6 w-48 rounded bg-surface-container animate-pulse" />
            <div className="h-4 w-full rounded bg-surface-container animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-surface-container animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-surface-container animate-pulse" />
          </div>
        </main>
        <aside className="space-y-4">
          <div className="h-12 rounded-md bg-surface-container animate-pulse" />
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="h-5 w-36 rounded bg-surface-container animate-pulse" />
            <div className="h-4 w-full rounded bg-surface-container animate-pulse" />
            <div className="h-4 w-full rounded bg-surface-container animate-pulse" />
          </div>
        </aside>
      </div>
      <SiteFooter compact />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[1280px] px-6 py-20 text-center space-y-6">
        <h1 className="text-display">Bounty Not Found</h1>
        <p className="text-on-surface-variant">The bounty you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          Browse Bounties
        </Link>
      </div>
      <SiteFooter compact />
    </div>
  );
}

function BountyDetail() {
  const { id } = useParams({ from: "/bounty/$id" });
  const matchRoute = useMatchRoute();
  const isChildRoute = matchRoute({ to: "/bounty/$id/submit", fuzzy: true });
  const { data: bounty, isLoading } = useOnChainBounty(id);
  const [activeTab, setActiveTab] = useState<"brief" | "submissions" | "timeline" | "poster" | "judges">("brief");
  const [copied, setCopied] = useState(false);
  const { address } = useWallet();
  const { pending, approveJudge, boostPrizePool } = useContract();
  const [time, setTime] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [boostAmount, setBoostAmount] = useState("");
  const [boostMsg, setBoostMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [localPrizePool, setLocalPrizePool] = useState<number | null>(null);

  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const [customEvents, setCustomEvents] = useState<CustomTimelineEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");

  useEffect(() => {
    if (!bounty) return;
    setTime(getTimeRemaining(bounty.submissionDeadline));
    const interval = setInterval(() => {
      setTime(getTimeRemaining(bounty.submissionDeadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [bounty?.submissionDeadline]);

  useEffect(() => {
    async function loadApps() {
      setLoadingApps(true);
      try {
        const apps = getApplicationsForBounty(id);
        const withDetails = await Promise.all(
          apps.map(async (app) => {
            const details = await getJudgeDetailsForApplication(app);
            return { ...app, judgeDetails: details };
          })
        );
        setApplications(withDetails);
      } catch {}
      setLoadingApps(false);
    }
    loadApps();
  }, [id]);

  useEffect(() => {
    setCustomEvents(getCustomEvents(id));
  }, [id]);

  if (isChildRoute) {
    return <Outlet />;
  }

  if (isLoading) return <SkeletonLoader />;
  if (!bounty) return <NotFound />;

  const isPoster = address === bounty.posterAddress;
  const submissionsLocked = bounty.submissionDeadline.getTime() > Date.now();
  const tabs = [
    { key: "brief" as const, label: "Brief", lock: false },
    { key: "submissions" as const, label: `Submissions (${bounty.submissionCount})`, lock: submissionsLocked },
    { key: "timeline" as const, label: "Timeline", lock: false },
    ...(isPoster ? [{ key: "poster" as const, label: "Poster Actions", lock: false }] : []),
    { key: "judges" as const, label: `Judges (${applications.length})`, lock: false },
  ];

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: bounty!.title, url: window.location.href });
    } else {
      handleCopy();
    }
  }

  async function handleApproveJudge(app: ApplicationWithDetails) {
    const result = await approveJudge(app.applicationId, bounty!.id);
    if (result.success) {
      updateApplicationState(app.applicationId, 'approved');
      setApplications(prev => prev.map(a =>
        a.applicationId === app.applicationId ? { ...a, state: 'approved' } : a
      ));
    }
  }

  function handleRejectJudge(app: ApplicationWithDetails) {
    updateApplicationState(app.applicationId, 'rejected');
    setApplications(prev => prev.map(a =>
      a.applicationId === app.applicationId ? { ...a, state: 'rejected' } : a
    ));
  }

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormDate("");
    setEditingId(null);
    setShowAddForm(false);
  }

  function handleSaveEvent() {
    if (!formTitle.trim() || !formDate) return;
    const newEvent: CustomTimelineEvent = {
      id: editingId || crypto.randomUUID(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      date: formDate,
    };
    let updated: CustomTimelineEvent[];
    if (editingId) {
      updated = customEvents.map(e => e.id === editingId ? newEvent : e);
    } else {
      updated = [...customEvents, newEvent];
    }
    saveCustomEvents(id, updated);
    setCustomEvents(updated);
    resetForm();
  }

  function handleEditEvent(event: CustomTimelineEvent) {
    setEditingId(event.id);
    setFormTitle(event.title);
    setFormDescription(event.description);
    setFormDate(event.date);
    setShowAddForm(true);
  }

  function handleDeleteEvent(eventId: string) {
    const updated = customEvents.filter(e => e.id !== eventId);
    saveCustomEvents(id, updated);
    setCustomEvents(updated);
  }

  function getEventStatus(dateStr: string): "done" | "current" | "upcoming" {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);
    if (eventDay.getTime() < today.getTime()) return "done";
    if (eventDay.getTime() === today.getTime()) return "current";
    return "upcoming";
  }

  async function handleBoost() {
    if (!boostAmount || Number(boostAmount) <= 0) return;
    setBoostMsg(null);
    const mist = Number(boostAmount) * 1_000_000_000;
    const result = await boostPrizePool(bounty!.id, mist);
    if (result.success) {
      const added = Number(boostAmount);
      setLocalPrizePool((prev) => (prev ?? bounty!.prizePool) + added);
      setBoostMsg({ type: "success", text: `Boosted by ${added} SUI!` });
      setBoostAmount("");
      const key = `qually_boost_notifications_${bounty!.posterAddress}`;
      try {
        const existing: { text: string; meta: string; time: string; bountyId: string }[] = JSON.parse(localStorage.getItem(key) || "[]");
        existing.push({
          text: `Someone boosted "${bounty!.title}" by ${added} SUI`,
          meta: "PRIZE POOL BOOST",
          time: new Date().toLocaleDateString(),
          bountyId: bounty!.id,
        });
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {}
    } else {
      setBoostMsg({ type: "error", text: result.error || "Boost failed" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Title bar */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1280px] px-6 py-10 grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="border-l-2 border-primary pl-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-label-mono px-2.5 py-1 rounded-sm bg-primary/10 text-primary border border-primary/20">
                {STATUS_LABELS[bounty.status] ?? "OPEN"}
              </span>
              <span className="text-label-mono text-on-surface-variant">
                ID: {bounty.id.slice(0, 8)}-{bounty.type.toUpperCase().slice(0, 3)}
              </span>
            </div>
            <h1 className="text-display">{bounty.title}</h1>
            <p className="mt-3 text-on-surface-variant max-w-2xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(bounty.description) || "No description available." }} />
          </div>
          <aside className="rounded-lg border border-border bg-card p-5 self-start overflow-hidden">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-on-surface-variant">Prize Pool</span>
              <span className="font-mono font-bold text-primary text-xl">{formatPrizePool(localPrizePool ?? bounty.prizePool)}</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">Time Remaining</span>
              {time.days === "00" && time.hours === "00" && time.minutes === "00" && time.seconds === "00" ? (
                <span className="text-sm font-mono font-bold text-destructive">EXPIRED</span>
              ) : (
                <div className="flex gap-2">
                  {[[time.days, "DAYS"], [time.hours, "HRS"], [time.minutes, "MIN"], [time.seconds, "SEC"]].map(([n, l], i, a) => (
                    <div key={l} className="flex items-center gap-2">
                      <div className="text-center">
                        <div className="font-mono font-bold text-lg">{n}</div>
                        <div className="text-label-caps text-on-surface-variant">{l}</div>
                      </div>
                      {i < a.length - 1 && <span className="text-on-surface-variant">:</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boost Prize Pool — visible to any connected wallet */}
            {address && bounty.status === "open" && (
              <div className="border-t border-border pt-3 mt-3 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <DollarSign className="size-4 text-primary" /> Boost Prize Pool
                </p>
                {boostMsg && (
                  <div className={`text-xs px-2 py-1.5 rounded ${boostMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {boostMsg.text}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="SUI amount"
                    value={boostAmount}
                    onChange={(e) => setBoostAmount(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-sm font-mono placeholder:text-on-surface-variant/50"
                  />
                  <button
                    onClick={handleBoost}
                    disabled={pending || !boostAmount || Number(boostAmount) <= 0}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {pending ? <Loader2 className="size-3.5 animate-spin" /> : <DollarSign className="size-3.5" />} Boost
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 py-10 grid lg:grid-cols-[260px_1fr_280px] gap-6">
        {/* Left column */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold mb-4">Poster Profile</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-md bg-primary/10 border border-primary/20 grid place-items-center text-primary"><Cloud className="size-5" /></div>
              <div>
                <Link to="/profile/$address" params={{ address: bounty.posterAddress }} className="font-semibold text-sm hover:text-primary transition-colors">
                  {getNickname(bounty.posterAddress)}
                </Link>
                <p className="text-label-mono text-on-surface-variant">Verified Poster</p>
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              {[["Reputation", `${bounty.posterReputation}%`]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-on-surface-variant">{k}</span>
                  <span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold mb-3">Review Panel</h3>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-md bg-surface-container grid place-items-center text-primary"><ShieldCheck className="size-4" /></div>
              <div>
                <p className="text-sm font-semibold">Community Tier-1</p>
                <p className="text-label-mono text-on-surface-variant">3 Technical Judges</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant italic mt-4 leading-relaxed">"This bounty is reviewed by the Sui Core Community Steering Committee to ensure technical accuracy."</p>
          </div>
        </aside>

        {/* Center */}
        <main className="rounded-lg border border-border bg-card">
          <div className="flex items-center border-b border-border px-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`py-4 px-5 text-sm font-semibold relative inline-flex items-center gap-2 whitespace-nowrap ${activeTab === t.key ? "text-primary" : "text-on-surface-variant hover:text-foreground"}`}
              >
                {t.label}{t.lock && <Lock className="size-3.5" />}
                {activeTab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* ── Brief Tab ── */}
            {activeTab === "brief" && (
              <>
                <div className="flex items-start gap-3 rounded-md bg-primary/5 border border-primary/15 p-4 text-sm">
                  <Info className="size-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-primary">This document is cryptographically served from Walrus Decentralized Storage.</p>
                </div>
                <section>
                  <h2 className="text-headline-md mb-3">Project Overview</h2>
                  <div className="text-on-surface-variant leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(bounty.description) || "No description available." }} />
                </section>
              </>
            )}

            {/* ── Submissions Tab ── */}
            {activeTab === "submissions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-headline-md mb-2">Submissions</h2>
                  <p className="text-sm text-on-surface-variant">
                    {bounty.submissionDeadline.getTime() > Date.now()
                      ? "Submissions are sealed until the submission deadline passes."
                      : `${bounty.submissionCount} submission${bounty.submissionCount !== 1 ? "s" : ""} received.`
                    }
                  </p>
                </div>

                {bounty.submissionDeadline.getTime() > Date.now() ? (
                  <div className="py-16 text-center space-y-4">
                    <Lock className="size-10 text-on-surface-variant mx-auto" />
                    <h2 className="text-headline-md">Submissions are sealed</h2>
                    <p className="text-on-surface-variant max-w-md mx-auto">
                      Submissions are sealed until the deadline: {bounty.submissionDeadline.toLocaleDateString()} {bounty.submissionDeadline.toLocaleTimeString()}
                    </p>
                  </div>
                ) : bounty.submissionCount === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <FileText className="size-10 text-on-surface-variant mx-auto" />
                    <h2 className="text-headline-md">No submissions</h2>
                    <p className="text-on-surface-variant max-w-md mx-auto">No work was submitted for this bounty.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bounty.submittedAddresses?.map((addr: string, i: number) => (
                      <div key={addr} className="rounded-lg border border-border bg-surface-low p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-md bg-primary/10 border border-primary/20 grid place-items-center text-primary font-mono font-bold text-xs">
                            {addr.slice(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{addr.slice(0, 6)}...{addr.slice(-4)}</p>
                            <p className="text-xs text-on-surface-variant">Submission #{i + 1}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Submitted</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Timeline Tab ── */}
            {activeTab === "timeline" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-headline-md mb-2">Bounty Timeline</h2>
                    <p className="text-sm text-on-surface-variant">Key dates and deadlines for this bounty.</p>
                  </div>
                  {isPoster && !showAddForm && (
                    <button
                      onClick={() => { resetForm(); setShowAddForm(true); }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                    >
                      <Plus className="size-3.5" /> Add Milestone
                    </button>
                  )}
                </div>

                {isPoster && showAddForm && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <h3 className="font-semibold text-sm">{editingId ? "Edit Milestone" : "Add Milestone"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Title"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        className="px-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="datetime-local"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                        className="px-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEvent}
                        disabled={!formTitle.trim() || !formDate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="size-3" /> {editingId ? "Update" : "Save"}
                      </button>
                      <button
                        onClick={resetForm}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-surface-container"
                      >
                        <X className="size-3" /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-8">
                    {/* Created */}
                    <TimelineItem
                      label="Bounty Created"
                      date={bounty!.createdAt}
                      description={`Prize pool: ${formatPrizePool(bounty!.prizePool)}`}
                      status="done"
                    />

                    {/* Submission Window */}
                    <TimelineItem
                      label="Submission Window Open"
                      date={bounty!.createdAt}
                      description="Hunters can submit work"
                      status="done"
                    />

                    {/* Custom poster-created events */}
                    {customEvents
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((event) => (
                        <TimelineItem
                          key={event.id}
                          label={event.title}
                          date={new Date(event.date)}
                          description={event.description}
                          status={getEventStatus(event.date)}
                          isPoster={isPoster}
                          onEdit={() => handleEditEvent(event)}
                          onDelete={() => handleDeleteEvent(event.id)}
                        />
                      ))
                    }

                    {/* Submission Deadline */}
                    <TimelineItem
                      label="Submission Deadline"
                      date={bounty!.submissionDeadline}
                      description={bounty!.status === "open" ? `${bounty!.submissionCount} submission${bounty!.submissionCount !== 1 ? "s" : ""} received` : "Submissions sealed"}
                      status={bounty!.submissionDeadline.getTime() <= Date.now() ? "done" : "current"}
                    />

                    {/* Judging Deadline */}
                    <TimelineItem
                      label="Judging Deadline"
                      date={bounty!.judgingDeadline}
                      description="All votes must be revealed by this time"
                      status={bounty!.judgingDeadline.getTime() <= Date.now() ? "done" : bounty!.submissionDeadline.getTime() <= Date.now() ? "current" : "upcoming"}
                    />

                    {/* Closed */}
                    {bounty!.status === "closed" && (
                      <TimelineItem
                        label="Bounty Closed"
                        date={bounty!.judgingDeadline}
                        description="Prize distributed to winner"
                        status="done"
                      />
                    )}
                  </div>
                </div>

                {/* Deadline summary */}
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="font-semibold mb-3">Deadline Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-on-surface-variant">Submission Deadline</p>
                      <p className="font-mono font-semibold mt-1">{bounty!.submissionDeadline.toLocaleDateString()} {bounty!.submissionDeadline.toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Judging Deadline</p>
                      <p className="font-mono font-semibold mt-1">{bounty!.judgingDeadline.toLocaleDateString()} {bounty!.judgingDeadline.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Poster Actions Tab ── */}
            {activeTab === "poster" && isPoster && (
              <PosterActions bounty={bounty} />
            )}

            {/* ── Judges Tab ── */}
            {activeTab === "judges" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-headline-md mb-2">Judge Applications</h2>
                  <p className="text-sm text-on-surface-variant">Judges who applied to evaluate this bounty. Their credentials are stored on Walrus.</p>
                </div>

                <JudgeActions bountyId={id} />

                {loadingApps ? (
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant py-8 justify-center">
                    <Loader2 className="size-4 animate-spin" /> Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <Shield className="size-10 text-on-surface-variant mx-auto mb-3" />
                    <p className="text-on-surface-variant">No judge applications yet.</p>
                    <p className="text-xs text-on-surface-variant mt-1">Apply as a judge to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app.applicationId} className="rounded-lg border border-border bg-surface-low p-4 space-y-3">
                        {/* Judge Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-md bg-primary/10 border border-primary/20 grid place-items-center text-primary font-mono font-bold text-xs">
                              {app.judgeAddress.slice(2, 4).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{truncateAddress(app.judgeAddress)}</p>
                              <p className="text-xs text-on-surface-variant">Profile: {truncateAddress(app.profileId)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-on-surface-variant">Stake: {app.stakeAmount} SUI</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              app.state === "approved" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                              app.state === "rejected" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                              "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                            }`}>
                              {app.state.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Judge Credentials */}
                        {app.judgeDetails && (
                          <div className="rounded-md bg-card border border-border p-3 space-y-2">
                            <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold">Credentials</p>
                            <div className="flex flex-wrap gap-2">
                              {app.judgeDetails.x && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-xs border border-border">
                                  𝕏 {app.judgeDetails.x}
                                </span>
                              )}
                              {app.judgeDetails.github && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-xs border border-border">
                                  GH {app.judgeDetails.github}
                                </span>
                              )}
                              {app.judgeDetails.linkedin && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-xs border border-border">
                                  LI {app.judgeDetails.linkedin}
                                </span>
                              )}
                              {app.judgeDetails.instagram && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-xs border border-border">
                                  IG {app.judgeDetails.instagram}
                                </span>
                              )}
                              {app.judgeDetails.portfolio && (
                                <a href={app.judgeDetails.portfolio} target="_blank" rel="noopener noreferrer"
                                   className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-xs border border-border text-primary hover:underline">
                                  Portfolio <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                            {app.judgeDetails.motivation && (
                              <div className="mt-2">
                                <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold mb-0.5">Motivation</p>
                                <p className="text-xs text-on-surface-variant italic">"{app.judgeDetails.motivation}"</p>
                              </div>
                            )}
                            {app.judgeDetails.experience && (
                              <div className="mt-2">
                                <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold mb-0.5">Experience</p>
                                <p className="text-xs text-on-surface-variant">{app.judgeDetails.experience}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {!app.judgeDetails && (
                          <div className="rounded-md bg-card border border-border p-3">
                            <p className="text-xs text-on-surface-variant italic">No off-chain credentials stored.</p>
                          </div>
                        )}

                        {isPoster && app.state === 'pending' && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleApproveJudge(app)}
                              disabled={pending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              {pending ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck className="size-3" />} Approve
                            </button>
                            <button
                              onClick={() => handleRejectJudge(app)}
                              disabled={pending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              <Shield className="size-3" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right column */}
        <aside className="space-y-4">
          <Link
            to="/bounty/$id/submit"
            params={{ id }}
            className="w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90"
          >
            <Send className="size-4" /> Submit Work
          </Link>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold mb-4">Technical Metadata</h3>
            <h4 className="text-label-caps text-on-surface-variant mb-2">RESOURCE LINKS</h4>
            <ul className="space-y-2 mb-5">
              {["Walrus Docs (Official)", "GitHub Reference Repo", "Architecture Diagram"].map((l) => (
                <li key={l}><a href="#" className="text-sm text-primary inline-flex items-center gap-2 hover:underline"><LinkIcon className="size-3.5" /> {l}</a></li>
              ))}
            </ul>
            <h4 className="text-label-caps text-on-surface-variant mb-2">TECH STACK TAGGING</h4>
            <div className="flex flex-wrap gap-2 mb-5">
              {[bounty.category, bounty.type].filter(Boolean).map((t) => (
                <span key={t} className="text-label-mono px-2.5 py-1 rounded-sm border border-border bg-surface-low">{t}</span>
              ))}
            </div>
            <h4 className="text-label-caps text-on-surface-variant mb-2">GOVERNANCE VERIFICATION</h4>
            <div className="rounded-md border border-border bg-primary/5 p-4 grid place-items-center text-center">
              <BadgeCheck className="size-8 text-primary" />
              <p className="text-label-mono mt-2 text-on-surface-variant">Secured by Sui Smart Contract</p>
              <p className="text-label-mono text-on-surface-variant">{truncateAddress(bounty.id)}</p>
              <div className="w-full h-1 rounded-full bg-primary mt-3" />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-on-surface-variant">Share this Bounty:</span>
            <div className="flex gap-2">
              <button onClick={handleShare} className="size-8 rounded-md border border-border grid place-items-center hover:border-primary/40"><Share2 className="size-3.5" /></button>
              <button onClick={handleCopy} className="size-8 rounded-md border border-border grid place-items-center hover:border-primary/40">
                {copied ? <BadgeCheck className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <SiteFooter compact />
    </div>
  );
}

function TimelineItem({ label, date, description, status, isPoster, onEdit, onDelete }: { label: string; date: Date; description: string; status: "done" | "current" | "upcoming"; isPoster?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const color = status === "done" ? "bg-primary" : status === "current" ? "bg-yellow-500" : "bg-surface-container";
  const textColor = status === "done" ? "text-primary" : status === "current" ? "text-yellow-500" : "text-on-surface-variant";
  const dotRing = status === "current" ? "ring-4 ring-yellow-500/20" : "";

  return (
    <div className="relative pl-12 group">
      <div className={`absolute left-3.5 size-3 rounded-full ${color} ${dotRing}`} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-semibold text-sm ${textColor}`}>{label}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
          <p className="text-xs text-on-surface-variant mt-1 font-mono">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </p>
        </div>
        {isPoster && onEdit && onDelete && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="size-6 rounded border border-border grid place-items-center hover:border-primary/40 hover:bg-primary/5"
            >
              <Pencil className="size-3" />
            </button>
            <button
              onClick={onDelete}
              className="size-6 rounded border border-border grid place-items-center hover:border-destructive/40 hover:bg-destructive/5"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
