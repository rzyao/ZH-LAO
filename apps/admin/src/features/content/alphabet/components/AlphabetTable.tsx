import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { alphabetAdminApi, type CharacterItem } from '../api';
import { ReviewAuditDialog } from './ReviewAuditDialog';

interface Props {
  items: CharacterItem[];
  onRefresh: () => void;
}

export const AlphabetTable: React.FC<Props> = ({ items, onRefresh }) => {
  const [selectedChar, setSelectedChar] = useState<{ charId: string; revId: string } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const handlePublish = async (charId: string, revId: string) => {
    try {
      await alphabetAdminApi.publishCharacter(charId, revId);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '发布失败');
    }
  };

  const handleSubmitReview = async (charId: string, revId: string) => {
    try {
      await alphabetAdminApi.submitReview(charId, revId);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '提交审核失败');
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>字符</TableHead>
            <TableHead>大类</TableHead>
            <TableHead>子分类</TableHead>
            <TableHead>IPA 音标</TableHead>
            <TableHead>排序</TableHead>
            <TableHead>发音</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-xl font-bold">{item.unicodeChar}</TableCell>
              <TableCell>{item.classification}</TableCell>
              <TableCell>{item.subtype}</TableCell>
              <TableCell>{item.ipaPhonetic}</TableCell>
              <TableCell>{item.sortOrder}</TableCell>
              <TableCell>
                {item.noAudio ? (
                  <Badge variant="outline">无音频</Badge>
                ) : (
                  <Badge variant="secondary">标准发音</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge>{item.status || 'Draft'}</Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSubmitReview(item.id, item.id)}
                >
                  提交审核
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedChar({ charId: item.id, revId: item.id });
                    setAuditOpen(true);
                  }}
                >
                  审核
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handlePublish(item.id, item.id)}
                >
                  正式发布
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedChar && (
        <ReviewAuditDialog
          characterId={selectedChar.charId}
          revisionId={selectedChar.revId}
          open={auditOpen}
          onOpenChange={setAuditOpen}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
