import { useState, useCallback } from "react";
import { Shield, Loader2, CheckCircle2, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWallet } from "../../hooks/useWallet";
import { useContract } from "../../hooks/useContract";

interface JudgeActionsProps {
  bountyId: string;
}

function generateNonce(): number[] {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr);
}

function computeHash(submissionId: string, score: number, nonce: number[]): number[] {
  const data = new TextEncoder().encode(`${submissionId}:${score}:${nonce.join(",")}`);
  // Simple deterministic hash: XOR-fold the data into 32 bytes
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    hash[i % 32] ^= data[i];
  }
  return Array.from(hash);
}

export function JudgeActions({ bountyId }: JudgeActionsProps) {
  const { connected } = useWallet();
  const { mintJudgeProfile, applyAsJudge, commitVote, revealVote, pending } = useContract();

  const [showApply, setShowApply] = useState(false);
  const [showCommit, setShowCommit] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const [applyStake, setApplyStake] = useState("10");
  const [applyBlobId, setApplyBlobId] = useState("");

  const [commitScore, setCommitScore] = useState(5);
  const [commitNonce, setCommitNonce] = useState<number[]>([]);
  const [commitHash, setCommitHash] = useState<number[]>([]);

  const [revealCommitId, setRevealCommitId] = useState("");
  const [revealSubmissionId, setRevealSubmissionId] = useState("");
  const [revealScore, setRevealScore] = useState(5);
  const [revealNonce, setRevealNonce] = useState("");

  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleApply = useCallback(async () => {
    const stake = parseFloat(applyStake);
    if (isNaN(stake) || stake <= 0) {
      setResult({ success: false, message: "Enter a valid stake amount" });
      return;
    }
    const blobIdArr = applyBlobId
      ? Array.from(new TextEncoder().encode(applyBlobId)).slice(0, 32)
      : [];
    const res = await applyAsJudge("", bountyId, stake, blobIdArr);
    setResult({
      success: res.success,
      message: res.success ? "Application submitted!" : (res.error ?? "Failed"),
    });
    if (res.success) setShowApply(false);
  }, [applyAsJudge, bountyId, applyStake, applyBlobId]);

  const handleCommit = useCallback(async () => {
    if (commitScore < 1 || commitScore > 10) {
      setResult({ success: false, message: "Score must be 1-10" });
      return;
    }
    const nonce = generateNonce();
    const hash = computeHash(bountyId, commitScore, nonce);
    setCommitNonce(nonce);
    setCommitHash(hash);
    const res = await commitVote(bountyId, hash);
    setResult({
      success: res.success,
      message: res.success ? "Vote committed! Save your nonce and score for reveal." : (res.error ?? "Failed"),
    });
    if (res.success) setShowCommit(false);
  }, [commitVote, bountyId, commitScore]);

  const handleReveal = useCallback(async () => {
    const nonceArr = revealNonce
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (!revealCommitId || !revealSubmissionId || nonceArr.length === 0) {
      setResult({ success: false, message: "Fill all fields" });
      return;
    }
    const res = await revealVote(revealCommitId, revealSubmissionId, revealScore, nonceArr);
    setResult({
      success: res.success,
      message: res.success ? "Vote revealed successfully!" : (res.error ?? "Failed"),
    });
    if (res.success) setShowReveal(false);
  }, [revealVote, revealCommitId, revealSubmissionId, revealScore, revealNonce]);

  if (!connected) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <Shield className="size-8 text-on-surface-variant mx-auto mb-2" />
        <p className="text-sm text-on-surface-variant">Connect wallet to access judge actions.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Shield className="size-4 text-primary" />
        Judge Actions
      </h3>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowApply(true)}>
          Apply as Judge
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowCommit(true)}>
          <Send className="size-3.5" /> Commit Vote
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowReveal(true)}>
          <Eye className="size-3.5" /> Reveal Vote
        </Button>
      </div>

      {result && (
        <div
          className={`rounded-md p-3 text-sm ${
            result.success
              ? "bg-green-500/10 border border-green-500/20 text-green-500"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {result.message}
        </div>
      )}

      {commitNonce.length > 0 && (
        <div className="rounded-md bg-surface-container p-3 text-xs font-mono space-y-1">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-wide">Save for reveal</p>
          <p>Score: <span className="text-foreground font-semibold">{commitScore}</span></p>
          <p>Nonce: <span className="text-foreground">{commitNonce.join(",")}</span></p>
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply as Judge</DialogTitle>
            <DialogDescription>
              Stake SUI to apply as a judge for this bounty. Your stake is returned upon successful evaluation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Stake (SUI)</label>
              <Input
                type="number"
                min="1"
                value={applyStake}
                onChange={(e) => setApplyStake(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Qualification Blob ID (optional)</label>
              <Input
                placeholder="Walrus blob ID for your credentials"
                value={applyBlobId}
                onChange={(e) => setApplyBlobId(e.target.value)}
              />
            </div>
            <Button onClick={handleApply} disabled={pending} className="w-full">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Submit Application"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commit Vote Dialog */}
      <Dialog open={showCommit} onOpenChange={setShowCommit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit Vote</DialogTitle>
            <DialogDescription>
              Submit a commit-reveal vote. Your score is hashed on-chain; reveal later to finalize.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Score (1–10)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={commitScore}
                onChange={(e) => setCommitScore(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button onClick={handleCommit} disabled={pending} className="w-full">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Commit Vote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reveal Vote Dialog */}
      <Dialog open={showReveal} onOpenChange={setShowReveal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reveal Vote</DialogTitle>
            <DialogDescription>
              Reveal your previously committed vote by providing the original parameters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Commit ID</label>
              <Input
                placeholder="The commit object ID"
                value={revealCommitId}
                onChange={(e) => setRevealCommitId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Submission ID</label>
              <Input
                placeholder="The submission object ID"
                value={revealSubmissionId}
                onChange={(e) => setRevealSubmissionId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Score (1–10)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={revealScore}
                onChange={(e) => setRevealScore(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nonce (comma-separated bytes)</label>
              <Input
                placeholder="e.g. 12,34,56,..."
                value={revealNonce}
                onChange={(e) => setRevealNonce(e.target.value)}
              />
            </div>
            <Button onClick={handleReveal} disabled={pending} className="w-full">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Reveal Vote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
