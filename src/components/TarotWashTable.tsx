import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { secureRandomInt } from '../lib/rng';
import { CardBackSvg } from './tarot/tarot-card-svg';
import styles from './TarotWashTable.module.css';

const CARD_COUNT = 20;
const CARD_W = 48;
const CARD_H = 75;
const SPREAD_MS = 600;
const GATHER_MS = 500;
const POINTER_RADIUS = 80;
const FRICTION = 0.88;
const SPRING = 0.018;
const REPEL_STRENGTH = 1200;

type WashPhase = 'idle' | 'spreading' | 'interactive' | 'gathering';

interface CardState {
  x: number;
  y: number;
  rot: number;
  vx: number;
  vy: number;
  spreadX: number;
  spreadY: number;
  spreadRot: number;
}

interface Props {
  shuffling: boolean;
  onDone: () => void;
}

function createSpreadTargets(
  width: number,
  height: number,
): Pick<CardState, 'spreadX' | 'spreadY' | 'spreadRot'>[] {
  const padX = CARD_W / 2 + 6;
  const padY = CARD_H / 2 + 6;
  const rangeX = Math.max(1, width - padX * 2);
  const rangeY = Math.max(1, height - padY * 2);
  return Array.from({ length: CARD_COUNT }, () => ({
    spreadX: padX + secureRandomInt(rangeX),
    spreadY: padY + secureRandomInt(rangeY),
    spreadRot: secureRandomInt(61) - 30,
  }));
}

function cardTransform(x: number, y: number, rot: number): string {
  return `translate(${x - CARD_W / 2}px, ${y - CARD_H / 2}px) rotate(${rot}deg)`;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TarotWashTable({ shuffling, onDone }: Props) {
  const tableRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardsRef = useRef<CardState[]>([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef(0);
  const gatherTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [washPhase, setWashPhase] = useState<WashPhase>('idle');

  const applyCardTransform = useCallback((el: HTMLElement, x: number, y: number, rot: number) => {
    el.style.transform = cardTransform(x, y, rot);
  }, []);

  const initCardsAtCenter = useCallback(() => {
    const table = tableRef.current;
    if (!table) return;
    const width = table.clientWidth;
    const height = table.clientHeight;
    const cx = width / 2;
    const cy = height / 2;
    const targets = createSpreadTargets(width, height);
    cardsRef.current = targets.map((t) => ({
      x: cx,
      y: cy,
      rot: 0,
      vx: 0,
      vy: 0,
      ...t,
    }));
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      el.classList.remove(styles.spreading, styles.gathering);
      const c = cardsRef.current[i];
      applyCardTransform(el, c.x, c.y, c.rot);
    });
  }, [applyCardTransform]);

  useEffect(() => {
    if (!shuffling) {
      cancelAnimationFrame(rafRef.current);
      if (gatherTimerRef.current) {
        clearTimeout(gatherTimerRef.current);
        gatherTimerRef.current = null;
      }
      setWashPhase('idle');
      initCardsAtCenter();
      return;
    }

    initCardsAtCenter();
    setWashPhase('spreading');

    const reduced = prefersReducedMotion();
    const spreadDelay = reduced ? 50 : SPREAD_MS;
    let spreadTimer: ReturnType<typeof setTimeout> | undefined;

    const raf = requestAnimationFrame(() => {
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        el.classList.add(styles.spreading);
        const c = cardsRef.current[i];
        applyCardTransform(el, c.spreadX, c.spreadY, c.spreadRot);
        c.x = c.spreadX;
        c.y = c.spreadY;
        c.rot = c.spreadRot;
        c.vx = 0;
        c.vy = 0;
      });

      spreadTimer = setTimeout(() => {
        cardRefs.current.forEach((el) => {
          el?.classList.remove(styles.spreading);
        });
        setWashPhase('interactive');
      }, spreadDelay);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (spreadTimer) clearTimeout(spreadTimer);
    };
  }, [shuffling, initCardsAtCenter, applyCardTransform]);

  useEffect(() => {
    if (washPhase !== 'interactive' || prefersReducedMotion()) return;

    const tick = () => {
      const ptr = pointerRef.current;
      const cards = cardsRef.current;

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        if (ptr.active) {
          const dx = c.x - ptr.x;
          const dy = c.y - ptr.y;
          const dist = Math.hypot(dx, dy);
          if (dist < POINTER_RADIUS && dist > 0.5) {
            const force = (REPEL_STRENGTH * (1 - dist / POINTER_RADIUS)) / (dist * dist);
            c.vx += (dx / dist) * force * 0.016;
            c.vy += (dy / dist) * force * 0.016;
          }
        }
        c.vx += (c.spreadX - c.x) * SPRING;
        c.vy += (c.spreadY - c.y) * SPRING;
        c.vx *= FRICTION;
        c.vy *= FRICTION;
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.vx * 0.15;

        const el = cardRefs.current[i];
        if (el) applyCardTransform(el, c.x, c.y, c.rot);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [washPhase, applyCardTransform]);

  const getPointerPos = useCallback((clientX: number, clientY: number) => {
    const table = tableRef.current;
    if (!table) return { x: 0, y: 0 };
    const rect = table.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (washPhase !== 'interactive') return;
      const table = tableRef.current;
      if (!table) return;
      table.setPointerCapture(e.pointerId);
      const pos = getPointerPos(e.clientX, e.clientY);
      pointerRef.current = { x: pos.x, y: pos.y, active: true };
    },
    [washPhase, getPointerPos],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!pointerRef.current.active) return;
      const pos = getPointerPos(e.clientX, e.clientY);
      pointerRef.current.x = pos.x;
      pointerRef.current.y = pos.y;
    },
    [getPointerPos],
  );

  const handlePointerUp = useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  const handleGather = useCallback(() => {
    if (washPhase !== 'interactive') return;
    cancelAnimationFrame(rafRef.current);
    pointerRef.current.active = false;
    setWashPhase('gathering');

    const table = tableRef.current;
    if (!table) return;
    const cx = table.clientWidth / 2;
    const cy = table.clientHeight / 2;
    const reduced = prefersReducedMotion();
    const gatherDelay = reduced ? 50 : GATHER_MS;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      el.classList.remove(styles.spreading);
      el.classList.add(styles.gathering);
      const offset = i * 0.8;
      const gx = cx + offset;
      const gy = cy - offset * 1.2;
      applyCardTransform(el, gx, gy, 0);
      cardsRef.current[i].x = gx;
      cardsRef.current[i].y = gy;
      cardsRef.current[i].rot = 0;
    });

    if (gatherTimerRef.current) clearTimeout(gatherTimerRef.current);
    gatherTimerRef.current = setTimeout(() => {
      gatherTimerRef.current = null;
      onDone();
    }, gatherDelay);
  }, [washPhase, applyCardTransform, onDone]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (gatherTimerRef.current) clearTimeout(gatherTimerRef.current);
    };
  }, []);

  useEffect(() => {
    initCardsAtCenter();
  }, [initCardsAtCenter]);

  return (
    <div class={styles.wrap}>
      <div
        ref={tableRef}
        class={styles.table}
        aria-label="テーブルシャッフル"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            class={styles.card}
            aria-hidden="true"
          >
            <CardBackSvg cardId={`wash-card-${i}`} />
          </div>
        ))}
        {washPhase === 'interactive' && (
          <button type="button" class={styles.gatherBtn} onClick={handleGather}>
            山にまとめる
          </button>
        )}
      </div>
      {washPhase === 'interactive' && (
        <p class={styles.hint}>指やマウスでカードをなぞって混ぜてください</p>
      )}
      {washPhase === 'spreading' && (
        <p class={styles.hint}>カードをテーブルに広げています…</p>
      )}
    </div>
  );
}
