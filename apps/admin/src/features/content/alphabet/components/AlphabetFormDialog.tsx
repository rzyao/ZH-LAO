import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { alphabetAdminApi, type CreateCharacterInput, type LaoLetterClassification } from '../api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AlphabetFormDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const [formData, setFormData] = useState<CreateCharacterInput>({
    unicodeChar: '',
    classification: 'consonant',
    subtype: 'cons_middle',
    ipaPhonetic: '',
    description: '',
    sortOrder: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await alphabetAdminApi.createCharacter(formData);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '录入失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建老挝语字符 (LaoCharacter)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div>
            <Label>Unicode 字符</Label>
            <Input
              value={formData.unicodeChar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, unicodeChar: e.target.value })}
              placeholder="例如: ກ"
              required
            />
          </div>
          <div>
            <Label>大分类</Label>
            <select
              className="w-full border rounded p-2"
              value={formData.classification}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const val = e.target.value as LaoLetterClassification;
                const noAudio = val === 'tone_mark' || val === 'other';
                setFormData({
                  ...formData,
                  classification: val,
                  subtype: val === 'consonant' ? 'cons_middle' : val === 'vowel' ? 'vowel_short' : val === 'tone_mark' ? 'symbol_tone' : 'symbol_other',
                  ipaPhonetic: noAudio ? '-' : formData.ipaPhonetic,
                });
              }}
            >
              <option value="consonant">辅音 (Consonant)</option>
              <option value="vowel">元音 (Vowel)</option>
              <option value="tone_mark">声调符号 (Tone mark)</option>
              <option value="other">其他正字法标记 (Other)</option>
            </select>
          </div>
          <div>
            <Label>IPA 音标</Label>
            <Input
              value={formData.ipaPhonetic}
              disabled={formData.classification === 'tone_mark' || formData.classification === 'other'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ipaPhonetic: e.target.value })}
              placeholder="例如: /k/"
            />
          </div>
          <div>
            <Label>教学描述 / 名称</Label>
            <Input
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="例如: 中辅音 ກ (Ko)"
            />
          </div>
          <div>
            <Label>组内展示排序号 (Sort Order)</Label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '提交中...' : '创建草稿'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
