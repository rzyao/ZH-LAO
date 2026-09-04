import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlphabetTable } from '../components/AlphabetTable';
import { AlphabetFormDialog } from '../components/AlphabetFormDialog';
import { alphabetAdminApi, type CharacterItem } from '../api';

export const AlphabetPage: React.FC = () => {
  const [items, setItems] = useState<CharacterItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await alphabetAdminApi.listCharacters();
      setItems(response.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="p-6 space-y-6" data-testid="content-lo-letters-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">老挝语字母管理 (Lao Alphabet)</h1>
          <p className="text-gray-500 text-sm">
            维护 68 个基础字母、声调符号与其他正字法标记的分类、IPA 音标与审核发布生命周期
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>新建字母/符号</Button>
      </div>

      <AlphabetTable items={items} onRefresh={fetchItems} />

      <AlphabetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchItems}
      />
    </div>
  );
};
