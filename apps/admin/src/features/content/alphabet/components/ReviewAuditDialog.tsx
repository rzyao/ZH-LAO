import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { alphabetAdminApi } from '../api';

interface Props {
  characterId: string;
  revisionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ReviewAuditDialog: React.FC<Props> = ({
  characterId,
  revisionId,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (action: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      await alphabetAdminApi.reviewCharacter(characterId, revisionId, action, remark);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || '审核操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>审核 LaoCharacter 修订版本</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>审核意见 / 驳回原因</Label>
            <Textarea
              value={remark}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemark(e.target.value)}
              placeholder="请输入审核批注（驳回时必填）"
            />
          </div>
        </div>
        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" disabled={submitting} onClick={() => handleReview('reject')}>
            驳回
          </Button>
          <Button variant="default" disabled={submitting} onClick={() => handleReview('approve')}>
            通过审核
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
