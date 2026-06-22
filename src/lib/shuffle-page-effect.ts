import type { PageEffectMod } from './tarot-shuffle';
import pageEffects from '../styles/shuffle-page-effects.module.css';

const PAGE_EFFECT_CLASS: Record<NonNullable<PageEffectMod>, string> = {
  shake: pageEffects.pageShake,
  nudge: pageEffects.pageNudge,
  bounce: pageEffects.pageBounce,
  lift: pageEffects.pageLift,
  swirl: pageEffects.pageSwirl,
};

export function shufflePageEffectClass(effect: PageEffectMod, active: boolean): string {
  if (!active || effect == null) return '';
  return PAGE_EFFECT_CLASS[effect] ?? '';
}
