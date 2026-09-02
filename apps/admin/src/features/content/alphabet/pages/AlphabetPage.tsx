import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlphabetTable } from '../components/AlphabetTable';
import { AlphabetFormDialog } from '../components/AlphabetFormDialog';

export const AlphabetPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/v1/content/letters');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">老挝语字母管理 (Lao Alphabet)</h1>
          <p className="text-gray-500 text-sm">
            维护 68 个基础字母、辅音、元音及符号分类、IPA 音标与审核发布生命周期
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
