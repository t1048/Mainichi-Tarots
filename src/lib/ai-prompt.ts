const SIGNATURE = '— 毎日タロット＆占い';

export const AI_COPY_LABEL = 'AI 解説用にコピー';
export const AI_COPIED_LABEL = 'コピーしました';

const AI_GUIDE_LINE =
  '以下の占い結果を生成 AI（ChatGPT・Claude・Gemini など）に貼り付けて、解説やアドバイスを依頼できます。';

/**
 * Builds a copy-ready string aimed at generative AI tools by appending a guidance
 * line and a per-fortune request prompt. When the base reading already ends with
 * the standard signature, the AI block is inserted just before it so the signature
 * stays last (matching the タロット相性占い spread format).
 */
export function buildAiCopyText(reading: string, requestPrompt: string): string {
  if (!reading) return '';
  const aiBlock = `—\n${AI_GUIDE_LINE}\n${requestPrompt}`;
  const trimmed = reading.replace(/\s+$/, '');
  if (trimmed.endsWith(SIGNATURE)) {
    const head = trimmed.slice(0, trimmed.length - SIGNATURE.length).replace(/\s+$/, '');
    return `${head}\n\n${aiBlock}\n\n${SIGNATURE}`;
  }
  return `${trimmed}\n\n${aiBlock}`;
}
