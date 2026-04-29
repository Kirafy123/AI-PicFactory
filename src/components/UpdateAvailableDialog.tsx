import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openUrl } from '@tauri-apps/plugin-opener';
import { UiButton, UiModal, UiSelect } from '@/components/ui';

const GITHUB_OWNER_REPO = 'Kirafy123/AI-PicFactory';

function buildDirectDownloadUrl(version: string): string {
  const tag = `v${version}`;
  const isWindows = navigator.userAgent.includes('Windows');
  const filename = isWindows
    ? `AI-PicFactory_${version}_x64-setup.exe`
    : `AI-PicFactory_${version}_universal.dmg`;
  return `https://github.com/${GITHUB_OWNER_REPO}/releases/download/${tag}/${filename}`;
}

export type UpdateIgnoreMode = 'today-version' | 'forever-version' | 'forever-all';

interface UpdateAvailableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  latestVersion?: string;
  currentVersion?: string;
  onApplyIgnore?: (mode: UpdateIgnoreMode) => void;
}

export function UpdateAvailableDialog({
  isOpen,
  onClose,
  latestVersion,
  currentVersion,
  onApplyIgnore,
}: UpdateAvailableDialogProps) {
  const { t } = useTranslation();
  const [ignoreMode, setIgnoreMode] = useState<UpdateIgnoreMode>('today-version');

  const ignoreOptions = useMemo(
    () => [
      { value: 'today-version' as const, label: t('update.ignoreTodayVersion') },
      { value: 'forever-version' as const, label: t('update.ignoreThisVersionForever') },
      { value: 'forever-all' as const, label: t('update.ignoreAllForever') },
    ],
    [t]
  );

  const handleDownload = useCallback(() => {
    const url = latestVersion
      ? buildDirectDownloadUrl(latestVersion)
      : `https://github.com/${GITHUB_OWNER_REPO}/releases/latest`;
    void openUrl(url);
  }, [latestVersion]);

  const handleApplyIgnore = useCallback(() => {
    onApplyIgnore?.(ignoreMode);
    onClose();
  }, [ignoreMode, onApplyIgnore, onClose]);

  return (
    <UiModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('update.dialogTitle')}
      footer={(
        <>
          <UiButton variant="muted" onClick={onClose}>
            {t('common.cancel')}
          </UiButton>
          <UiButton variant="primary" onClick={handleDownload}>
            {t('update.goToGithubDownload')}
          </UiButton>
          <UiButton variant="ghost" onClick={handleApplyIgnore}>
            {t('update.applyIgnore')}
          </UiButton>
        </>
      )}
    >
      <div className="text-sm text-text-muted leading-6">
        <p>{t('update.dialogDescription')}</p>
        {(latestVersion || currentVersion) && (
          <p className="mt-2 text-xs">
            {t('update.versionLine', {
              currentVersion: currentVersion ?? '-',
              latestVersion: latestVersion ?? '-',
            })}
          </p>
        )}
        <div className="mt-3">
          <p className="mb-1 text-xs text-text-muted">{t('update.ignoreRule')}</p>
          <UiSelect
            value={ignoreMode}
            onChange={(event) => setIgnoreMode(event.target.value as UpdateIgnoreMode)}
            className="h-9 text-sm"
          >
            {ignoreOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </UiSelect>
        </div>
      </div>
    </UiModal>
  );
}
