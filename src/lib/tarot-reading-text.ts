import {
  POSITION_LABELS,
  orientationLabel,
  type Orientation,
  type Position,
  type TarotCard,
} from '../data/tarot-meta';
import { interpret } from '../data/templates';

const AI_PROMPT_HINT =
  '上記のタロット占いの結果（カード名・正逆・位置）を、総合的なメッセージとして読み解いてください。';

export interface TarotReadingCard {
  card: TarotCard;
  orientation: Orientation;
  position?: Position;
}

export function formatTarotReading(mode: 'one' | 'three', cards: TarotReadingCard[]): string {
  const header = mode === 'one' ? '1 枚引き' : '3 枚スプレッド';
  const lines = ['【タロット占い】', header, ''];
  for (const d of cards) {
    const pos = d.position ?? 'today';
    const txt = interpret(d.card, d.orientation, pos);
    lines.push(`■ ${POSITION_LABELS[pos]} — ${d.card.nameJp}（${orientationLabel(d.orientation)}）`);
    if (txt.keywords.length > 0) {
      lines.push(`キーワード: ${txt.keywords.join(' / ')}`);
    }
    lines.push(txt.body);
    lines.push('');
  }
  lines.push('—');
  lines.push('以下の文を生成 AI（ChatGPT・Claude・Gemini など）に貼り付けて、占いの結果を統合的に読み解いてもらえます。');
  lines.push(AI_PROMPT_HINT);
  lines.push('');
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}
