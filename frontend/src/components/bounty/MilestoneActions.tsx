import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { uploadText } from '../../lib/walrus';
import { Loader2, Upload, CheckCircle, XCircle, AlertTriangle, ListTodo } from 'lucide-react';

interface Milestone {
  id: string;
  description: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'overdue';
  deadline: Date;
  amount: number;
  hunterAddress?: string;
}

interface MilestoneActionsProps {
  bountyId: string;
  posterAddress: string;
  milestones?: Milestone[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  overdue: { label: 'Overdue', variant: 'destructive' },
};

export function MilestoneActions({ bountyId, posterAddress, milestones = [] }: MilestoneActionsProps) {
  const { pending, submitMilestone, approveMilestone, rejectMilestone, escalateOverdue } = useContract();
  const { address } = useWallet();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const isPoster = address === posterAddress;
  const isHunter = address !== posterAddress;

  const handleAction = async (action: () => Promise<{ success: boolean; error?: string }>, successMsg: string) => {
    setMessage(null);
    const result = await action();
    if (result.success) {
      setMessage({ type: 'success', text: successMsg });
    } else {
      setMessage({ type: 'error', text: result.error || 'Transaction failed' });
    }
  };

  const handleFileUpload = async (milestoneId: string, file: File) => {
    setUploadingId(milestoneId);
    try {
      const text = await file.text();
      const { blobHash } = await uploadText(text);
      await handleAction(() => submitMilestone(milestoneId, blobHash), 'Milestone submitted');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload to Walrus' });
    } finally {
      setUploadingId(null);
    }
  };

  // Placeholder milestones if none provided
  const displayMilestones = milestones.length > 0 ? milestones : [
    { id: '1', description: 'Initial research and planning', status: 'approved' as const, deadline: new Date(), amount: 100, hunterAddress: '0x123' },
    { id: '2', description: 'Core implementation', status: 'submitted' as const, deadline: new Date(), amount: 300, hunterAddress: '0x123' },
    { id: '3', description: 'Testing and documentation', status: 'pending' as const, deadline: new Date(), amount: 200 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ListTodo className="size-4" />
          Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && (
          <div className={`p-2 rounded text-xs ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {displayMilestones.map((milestone) => {
          const statusConfig = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.pending;
          const canSubmit = isHunter && milestone.status === 'pending';
          const canReview = isPoster && milestone.status === 'submitted';
          const canEscalate = milestone.status === 'overdue';

          return (
            <div key={milestone.id} className="p-3 rounded border border-border bg-surface-low space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{milestone.description}</p>
                  <p className="text-xs text-on-surface-variant">
                    {milestone.amount} SUI • Due {milestone.deadline.toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>

              <div className="flex items-center gap-2">
                {canSubmit && (
                  <label className="flex-1">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(milestone.id, file);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={pending || uploadingId === milestone.id}
                      asChild
                    >
                      <span>
                        {uploadingId === milestone.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                        Submit Work
                      </span>
                    </Button>
                  </label>
                )}

                {canReview && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAction(() => approveMilestone(milestone.id, bountyId), 'Milestone approved')}
                      disabled={pending}
                      className="flex-1"
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(() => rejectMilestone(milestone.id), 'Milestone rejected')}
                      disabled={pending}
                      className="flex-1"
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                      Reject
                    </Button>
                  </>
                )}

                {canEscalate && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(() => escalateOverdue(milestone.id), 'Escalated overdue milestone')}
                    disabled={pending}
                    className="flex-1"
                  >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                    Escalate
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {displayMilestones.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-4">No milestones defined</p>
        )}
      </CardContent>
    </Card>
  );
}