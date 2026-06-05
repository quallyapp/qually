import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { uploadText } from '../../lib/walrus';
import { Loader2, Upload, AlertTriangle, Shield, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Dispute {
  id: string;
  status: 'open' | 'evidence_submitted' | 'resolved' | 'rejected';
  bountyId: string;
  submissionId: string;
  reason: string;
  arbiterAddress?: string;
  outcome?: 'hunter_wins' | 'poster_wins' | 'split';
}

interface DisputePanelProps {
  bountyId: string;
  posterAddress: string;
  dispute?: Dispute;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', variant: 'default' },
  evidence_submitted: { label: 'Evidence Submitted', variant: 'secondary' },
  resolved: { label: 'Resolved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export function DisputePanel({ bountyId, posterAddress, dispute }: DisputePanelProps) {
  const { pending, openDispute, submitEvidence, assignArbiter, resolveDispute, rejectDispute } = useContract();
  const { address } = useWallet();
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [submissionId, setSubmissionId] = useState('');
  const [reason, setReason] = useState('');
  const [arbiterAddress, setArbiterAddress] = useState('');
  const [outcome, setOutcome] = useState<'hunter_wins' | 'poster_wins' | 'split'>('hunter_wins');
  const [fee, setFee] = useState('1000000000'); // 1 SUI default

  const isPoster = address === posterAddress;
  const isArbiter = dispute?.arbiterAddress === address;
  const isInvolced = isPoster || isArbiter;

  const handleAction = async (action: () => Promise<{ success: boolean; error?: string }>, successMsg: string) => {
    setMessage(null);
    const result = await action();
    if (result.success) {
      setMessage({ type: 'success', text: successMsg });
    } else {
      setMessage({ type: 'error', text: result.error || 'Transaction failed' });
    }
  };

  const handleOpenDispute = async () => {
    if (!reason) return;
    const { blobHash } = await uploadText(reason);
    await handleAction(
      () => openDispute(bountyId, submissionId, blobHash, Number(fee)),
      'Dispute opened'
    );
  };

  const handleEvidenceUpload = async (file: File) => {
    const text = await file.text();
    const { blobHash } = await uploadText(text);
    await handleAction(
      () => submitEvidence(dispute!.id, blobHash),
      'Evidence submitted'
    );
  };

  const handleResolve = async () => {
    const outcomeMap = { hunter_wins: 0, poster_wins: 1, split: 2 };
    await handleAction(
      () => resolveDispute(dispute!.id, bountyId, outcomeMap[outcome]),
      'Dispute resolved'
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full"
        >
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Dispute Panel
          </CardTitle>
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-3">
          {message && (
            <div className={`p-2 rounded text-xs ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {!dispute ? (
            // No dispute - show open form (for hunters)
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">No active dispute for this bounty.</p>
              <div className="space-y-2">
                <Input
                  placeholder="Submission ID"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                />
                <Textarea
                  placeholder="Reason for dispute..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Fee (MIST)"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleOpenDispute}
                    disabled={pending || !submissionId || !reason}
                  >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                    Open Dispute
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Dispute exists - show status and actions
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={STATUS_CONFIG[dispute.status]?.variant || 'default'}>
                  {STATUS_CONFIG[dispute.status]?.label || dispute.status}
                </Badge>
              </div>

              <div className="p-2 rounded bg-surface-low text-sm">
                <p className="text-on-surface-variant">Reason:</p>
                <p>{dispute.reason}</p>
              </div>

              {/* Evidence submission */}
              {dispute.status === 'open' && isInvolced && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Submit Evidence</label>
                  <input
                    type="file"
                    className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleEvidenceUpload(file);
                    }}
                  />
                </div>
              )}

              {/* Assign arbiter (poster only) */}
              {dispute.status === 'open' && isPoster && !dispute.arbiterAddress && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Assign Arbiter</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Arbiter address"
                      value={arbiterAddress}
                      onChange={(e) => setArbiterAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAction(() => assignArbiter(dispute.id, arbiterAddress), 'Arbiter assigned')}
                      disabled={pending || !arbiterAddress}
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Resolve dispute (arbiter only) */}
              {dispute.status === 'evidence_submitted' && isArbiter && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Resolve Dispute</label>
                  <div className="flex gap-2">
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value as typeof outcome)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                    >
                      <option value="hunter_wins">Hunter Wins</option>
                      <option value="poster_wins">Poster Wins</option>
                      <option value="split">Split</option>
                    </select>
                    <Button
                      onClick={handleResolve}
                      disabled={pending}
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                      Resolve
                    </Button>
                  </div>
                </div>
              )}

              {/* Reject dispute (arbiter only) */}
              {['open', 'evidence_submitted'].includes(dispute.status) && isArbiter && (
                <Button
                  variant="destructive"
                  onClick={() => handleAction(() => rejectDispute(dispute.id), 'Dispute rejected')}
                  disabled={pending}
                  className="w-full"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                  Reject Dispute
                </Button>
              )}

              {/* Final status */}
              {(dispute.status === 'resolved' || dispute.status === 'rejected') && (
                <div className={`p-3 rounded text-center ${dispute.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {dispute.status === 'resolved' ? (
                    <p className="text-sm font-medium">Dispute resolved: {dispute.outcome}</p>
                  ) : (
                    <p className="text-sm font-medium">Dispute rejected</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}