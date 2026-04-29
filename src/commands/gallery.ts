import { invoke, isTauri } from '@tauri-apps/api/core';

export async function archiveGeneratedImage(params: {
  source: string;
  projectName: string;
  model: string;
}): Promise<string> {
  if (!isTauri() || !params.source) return '';

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStem = [
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    params.model.replace(/\//g, '-').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40),
  ]
    .filter(Boolean)
    .join('_');

  return await invoke<string>('archive_generated_image', {
    source: params.source,
    projectName: params.projectName,
    dateStr,
    timeStem,
  });
}
