import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useSettingsStore,
  DEFAULT_PROMPT_STYLE_TAGS,
} from '@/stores/settingsStore';

interface PromptStyleTagBarProps {
  onTagClick: (promptText: string) => void;
}

export function PromptStyleTagBar({ onTagClick }: PromptStyleTagBarProps) {
  const { t } = useTranslation();
  const tags = useSettingsStore((s) => s.promptStyleTags);
  const addTag = useSettingsStore((s) => s.addPromptStyleTag);
  const updateTag = useSettingsStore((s) => s.updatePromptStyleTag);
  const removeTag = useSettingsStore((s) => s.removePromptStyleTag);
  const setTags = useSettingsStore((s) => s.setPromptStyleTags);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((isAdding || editingIndex !== null) && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isAdding, editingIndex]);

  const startEdit = useCallback((index: number) => {
    const tag = useSettingsStore.getState().promptStyleTags[index];
    if (!tag) return;
    setEditingIndex(index);
    setEditLabel(tag.label);
    setEditPrompt(tag.prompt);
    setIsAdding(false);
  }, []);

  const startAdd = useCallback(() => {
    setEditingIndex(null);
    setEditLabel('');
    setEditPrompt('');
    setIsAdding(true);
  }, []);

  const commitEdit = useCallback(() => {
    const trimmedLabel = editLabel.trim();
    const trimmedPrompt = editPrompt.trim();
    if (!trimmedLabel) {
      setIsAdding(false);
      setEditingIndex(null);
      return;
    }
    const finalPrompt = trimmedPrompt || `${trimmedLabel}，`;
    if (isAdding) {
      addTag({ label: trimmedLabel, prompt: finalPrompt });
    } else if (editingIndex !== null) {
      updateTag(editingIndex, { label: trimmedLabel, prompt: finalPrompt });
    }
    setIsAdding(false);
    setEditingIndex(null);
  }, [editLabel, editPrompt, isAdding, editingIndex, addTag, updateTag]);

  const cancelEdit = useCallback(() => {
    setIsAdding(false);
    setEditingIndex(null);
  }, []);

  const handleEditKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  const resetToDefaults = useCallback(() => {
    setTags([...DEFAULT_PROMPT_STYLE_TAGS]);
    setEditingIndex(null);
    setIsAdding(false);
  }, [setTags]);

  const isEditorOpen = isAdding || editingIndex !== null;

  return (
    <div className="mb-1.5">
      <div className="flex flex-wrap gap-1 items-center">
        {tags.map((tag, index) => (
          <button
            key={`${tag.label}-${index}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(tag.prompt);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startEdit(index);
            }}
            title={tag.prompt}
            className="nodrag nowheel px-2 py-0.5 text-xs bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded text-cyan-400 transition-colors select-none"
          >
            {tag.label}
          </button>
        ))}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            startAdd();
          }}
          title={t('node.imageEdit.addStyleTag', '添加标签')}
          className="nodrag nowheel px-1.5 py-0.5 text-xs bg-zinc-800/60 hover:bg-zinc-700 rounded text-zinc-400 hover:text-cyan-400 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            resetToDefaults();
          }}
          title={t('node.imageEdit.resetStyleTags', '恢复默认标签')}
          className="nodrag nowheel px-1.5 py-0.5 text-xs bg-zinc-800/60 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {isEditorOpen && (
        <div
          className="nodrag nowheel mt-1.5 rounded-lg border border-border-dark bg-surface-dark p-2 space-y-1.5"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            ref={labelInputRef}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder={t('node.imageEdit.tagLabel', '标签名称')}
            className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1 text-xs text-text-dark placeholder:text-text-muted outline-none"
          />
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder={t('node.imageEdit.tagPrompt', '追加到提示词的文本（留空则自动用标签名）')}
            rows={2}
            className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1 text-xs text-text-dark placeholder:text-text-muted outline-none resize-none font-mono"
          />
          <div className="flex justify-between items-center">
            <div>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    removeTag(editingIndex);
                    cancelEdit();
                  }}
                  className="px-2 py-0.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                >
                  <X className="h-3 w-3 inline mr-0.5" />
                  {t('common.delete', '删除')}
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-2 py-0.5 text-xs text-text-muted hover:text-text-dark transition-colors"
              >
                {t('common.cancel', '取消')}
              </button>
              <button
                type="button"
                onClick={commitEdit}
                className="px-2 py-0.5 text-xs bg-accent text-white rounded hover:bg-accent/80 transition-colors"
              >
                {t('common.save', '保存')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
