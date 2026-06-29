import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Wallet, Bell, Search, FileText, ArrowRight, Gavel, Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useOnChainBounties, useMySubmissions } from "@/hooks/useOnChainBounties";
import { useWallet } from "@/hooks/useWallet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { stripHtml } from "@/lib/utils";
import { getApplicationsForBounty } from "@/lib/judge-applications";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Qually" },
      { name: "description", content: "View your bounties, submissions, and platform activity." },
    ],
  }),
  component: DashboardPage,
});

function formatSui(amount: number) {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} SUI`;
}

function truncAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function statusColor(status: string) {
  switch (status) {
    case "open":
      return "bg-primary/10 text-primary border-primary/20";
    case "review":
      return "bg-warning/15 text-warning border-warning/30";
    case "closed":
      return "bg-on-surface-variant/10 text-on-surface-variant border-border";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

function notifId(text: string, meta: string) {
  let h = 0;
  const s = text + meta;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return `n${h}`;
}

function DashboardPage() {
  const { connected, address } = useWallet();
  const { data: allBounties, isLoading } = useOnChainBounties();
  const { data: mySubmissionData, isLoading: isLoadingSubmissions } = useMySubmissions(address);
  const [activeTab, setActiveTab] = useState("bounties");

  const readKey = address ? `qually_read_notifications_${address}` : "";
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!readKey) return;
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(readKey) || "[]");
      setReadIds(new Set(stored));
    } catch {
      setReadIds(new Set());
    }
  }, [readKey]);

  function markRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(readKey, JSON.stringify([...next]));
      return next;
    });
  }

  function markAllRead() {
    const allIds = notifications.map((n) => notifId(n.text, n.meta));
    setReadIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      localStorage.setItem(readKey, JSON.stringify([...next]));
      return next;
    });
  }

  const myBounties = useMemo(() => {
    if (!allBounties || !address) return [];
    return allBounties.filter((b) => b.posterAddress === address);
  }, [allBounties, address]);

  const mySubmissions = useMemo(() => {
    if (!allBounties || !address) return [];
    return allBounties.filter((b) =>
      b.submittedAddresses?.map((a: string) => a.toLowerCase()).includes(address.toLowerCase()),
    );
  }, [allBounties, address]);

  const judgingBounties = useMemo(() => {
    if (!allBounties || !address) return [];
    return allBounties.filter((b) => {
      const apps = getApplicationsForBounty(b.id);
      return apps.some(
        (a) => a.judgeAddress.toLowerCase() === address.toLowerCase() && a.state === "approved",
      );
    });
  }, [allBounties, address]);

  const notifications = useMemo(() => {
    const items: { text: string; meta: string; time: string }[] = [];

    // Boost notifications from localStorage
    if (address) {
      const boostKey = `qually_boost_notifications_${address}`;
      try {
        const boosts: { text: string; meta: string; time: string; bountyId: string }[] = JSON.parse(localStorage.getItem(boostKey) || "[]");
        for (const b of boosts) {
          items.push({ text: b.text, meta: b.meta, time: b.time });
        }
      } catch {}
    }

    // Existing submission notifications
    for (const b of myBounties) {
      if (b.submissionCount > 0 && (b.status === "open" || b.status === "review")) {
        items.push({
          text: `${b.submissionCount} new submission${b.submissionCount > 1 ? "s" : ""} for "${b.title}"`,
          meta: "BOUNTY ACTIVITY",
          time: "Active",
        });
      }
    }
    return items;
  }, [myBounties, address]);

  const unreadCount = notifications.filter((n) => !readIds.has(notifId(n.text, n.meta))).length;

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <h1 className="text-display mb-8">Dashboard</h1>
          <div className="rounded-lg border border-border bg-card p-16 text-center">
            <Wallet className="size-12 mx-auto text-on-surface-variant mb-4" />
            <h2 className="text-headline-md mb-2">Connect your wallet</h2>
            <p className="text-on-surface-variant max-w-md mx-auto">
              Connect your Sui wallet to view your dashboard, including bounties, submissions, and
              judging queue.
            </p>
          </div>
        </div>
        <SiteFooter compact />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-display">Dashboard</h1>
            <p className="mt-2 text-on-surface-variant">Overview of your activity on Qually.</p>
          </div>
          <div className="text-right">
            <p className="text-label-mono text-on-surface-variant">{truncAddr(address!)}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="bounties" className="gap-2">
              <FileText className="size-4" /> My Bounties
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <Search className="size-4" /> My Submissions
            </TabsTrigger>
            <TabsTrigger value="judging" className="gap-2">
              <Gavel className="size-4" /> Judging
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="size-4" /> Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* My Bounties */}
          <TabsContent value="bounties">
            {isLoading ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-on-surface-variant">
                Loading your bounties...
              </div>
            ) : myBounties.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-16 text-center">
                <FileText className="size-10 mx-auto text-on-surface-variant mb-4" />
                <h3 className="text-headline-sm mb-2">No bounties yet</h3>
                <p className="text-on-surface-variant max-w-md mx-auto mb-6">
                  You haven't posted any bounties yet. Create your first bounty to start receiving
                  submissions.
                </p>
                <Link
                  to="/post"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                >
                  Post a Bounty
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myBounties.map((b) => (
                  <Link
                    key={b.id}
                    to="/bounty/$id"
                    params={{ id: b.id }}
                    className="block rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusColor(b.status)}>
                          {b.status.toUpperCase()}
                        </Badge>
                        <span className="text-label-mono text-on-surface-variant">
                          #{b.id.slice(0, 8)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-primary">
                        {formatSui(b.prizePool)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{b.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                      {stripHtml(b.description || "No description provided.")}
                    </p>
                    <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                      <span className="text-label-mono text-on-surface-variant">
                        {b.submissionCount} Submission{b.submissionCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                        View Details <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Submissions */}
          <TabsContent value="submissions">
            {isLoadingSubmissions ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-on-surface-variant">
                Loading your submissions...
              </div>
            ) : !mySubmissionData || mySubmissionData.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-16 text-center">
                <Search className="size-10 mx-auto text-on-surface-variant mb-4" />
                <h3 className="text-headline-sm mb-2">No submissions yet</h3>
                <p className="text-on-surface-variant max-w-md mx-auto mb-6">
                  Once you submit work to a bounty, your submissions will appear here.
                </p>
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-border bg-surface-low text-sm font-semibold hover:border-primary/40 transition"
                >
                  Explore Bounties <ArrowRight className="size-3 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {mySubmissionData.map((sub) => (
                  <Link
                    key={sub.id}
                    to="/submission/$bountyId"
                    params={{ bountyId: sub.bountyId }}
                    className="block rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/20"
                        >
                          SUBMITTED
                        </Badge>
                        <span className="text-label-mono text-on-surface-variant">
                          #{sub.bountyId.slice(0, 8)}
                        </span>
                      </div>
                      <span className="text-label-mono text-on-surface-variant text-xs">
                        {sub.submittedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{sub.title}</h3>
                    {sub.description && (
                      <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                        {stripHtml(sub.description)}
                      </p>
                    )}
                    <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                      <span className="text-label-mono text-on-surface-variant text-xs">
                        Blob: {sub.blobId.slice(0, 16)}...
                      </span>
                      <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                        View Bounty <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Judging */}
          <TabsContent value="judging">
            {isLoading ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-on-surface-variant">
                Loading bounties you're judging...
              </div>
            ) : judgingBounties.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-16 text-center">
                <Gavel className="size-10 mx-auto text-on-surface-variant mb-4" />
                <h3 className="text-headline-sm mb-2">No bounties to judge</h3>
                <p className="text-on-surface-variant max-w-md mx-auto mb-6">
                  Once you're approved as a judge for a bounty, it will appear here.
                </p>
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-border bg-surface-low text-sm font-semibold hover:border-primary/40 transition"
                >
                  Explore Bounties <ArrowRight className="size-3 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {judgingBounties.map((b) => (
                  <Link
                    key={b.id}
                    to="/bounty/$id"
                    params={{ id: b.id }}
                    className="block rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <Badge variant="outline" className={statusColor(b.status)}>
                        {b.status.toUpperCase()}
                      </Badge>
                      <span className="font-mono font-bold text-primary">
                        {formatSui(b.prizePool)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{b.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                      {stripHtml(b.description || "No description provided.")}
                    </p>
                    <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                      <span className="text-label-mono text-on-surface-variant">
                        {b.submissionCount} Submission{b.submissionCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                        Review <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            {notifications.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-16 text-center">
                <Bell className="size-10 mx-auto text-on-surface-variant mb-4" />
                <h3 className="text-headline-sm mb-2">No new notifications</h3>
                <p className="text-on-surface-variant max-w-md mx-auto">
                  You're all caught up. Notifications about your bounties and submissions will
                  appear here.
                </p>
              </div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Check className="size-3" /> Mark all as read
                    </button>
                  </div>
                )}
                <div className="space-y-3">
                  {notifications.map((n, i) => {
                    const nid = notifId(n.text, n.meta);
                    const isRead = readIds.has(nid);
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border bg-card p-5 flex items-start gap-4 transition-colors ${
                          isRead ? "border-border opacity-60" : "border-primary/30"
                        }`}
                      >
                        <div className="relative size-9 rounded-md bg-primary/10 grid place-items-center text-primary flex-shrink-0">
                          <Bell className="size-4" />
                          {!isRead && (
                            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary border-2 border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{n.text}</p>
                          <p className="text-label-mono text-on-surface-variant mt-1">
                            {n.meta} · {n.time}
                          </p>
                        </div>
                        {!isRead && (
                          <button
                            onClick={() => markRead(nid)}
                            className="flex-shrink-0 text-xs font-semibold text-primary hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <SiteFooter compact />
    </div>
  );
}
