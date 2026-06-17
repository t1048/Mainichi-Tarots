import type { Orientation, Suit, TarotCard } from '../data/tarot-meta';
import { SUIT_LABELS } from '../data/tarot-meta';

export interface LoveTarotPairCard {
  card: TarotCard;
  orientation: Orientation;
}

export interface LoveTarotSummary {
  commonTheme: string;
  complement: string;
  tension: string;
}

type ThemeCluster = 'stability' | 'emotion' | 'action' | 'reflection' | 'trial';

type RelationKind = 'exact' | 'aligned' | 'complement' | 'parallel' | 'adjustment' | 'diverse';

const CLUSTER_ORDER: ThemeCluster[] = ['stability', 'emotion', 'action', 'reflection', 'trial'];

const CLUSTER_LABELS: Record<ThemeCluster, string> = {
  stability: '安定と信頼',
  emotion: '感情とつながり',
  action: '行動と前進',
  reflection: '内省と直感',
  trial: '課題と見直し',
};

const SUIT_RELATION_THEMES: Record<Suit, string> = {
  wands: '行動と情熱',
  cups: '感情とつながり',
  swords: '思考とコミュニケーション',
  pentacles: '現実と暮らし',
};

const COMPLEMENT_PAIRS: [ThemeCluster, ThemeCluster][] = [
  ['stability', 'action'],
  ['emotion', 'action'],
  ['stability', 'emotion'],
  ['reflection', 'action'],
  ['reflection', 'emotion'],
  ['stability', 'reflection'],
];

const COMPLEMENT_PHRASES: Record<string, string> = {
  'stability+action': '土台を固めながら前に進む関係',
  'emotion+action': '想いを形にしていける関係',
  'stability+emotion': '安心感の中で心を育てられる関係',
  'reflection+action': '考えてから動ける関係',
  'reflection+emotion': '感覚と理性のバランスが取れる関係',
  'stability+reflection': '静かに立ち止まり、信頼を深められる関係',
};


const KEYWORD_CLUSTER: Record<string, ThemeCluster> = {
  "いい加減": 'trial',
  "インスピレーション": 'action',
  "お祝い": 'emotion',
  "カリスマ": 'action',
  "ケチ": 'trial',
  "さぼり": 'trial',
  "しがらみ": 'trial',
  "スピード": 'action',
  "すれ違い": 'trial',
  "チームワーク": 'action',
  "どん底": 'trial',
  "パートナーシップ": 'emotion',
  "パラノイア": 'trial',
  "バランス": 'stability',
  "やる気": 'action',
  "ルーティンの罠": 'trial',
  "ロマンス": 'emotion',
  "ワガママ": 'trial',
  "愛": 'emotion',
  "愛の芽生え": 'emotion',
  "悪巧み": 'trial',
  "安心感": 'stability',
  "安定": 'stability',
  "安堵": 'emotion',
  "依存": 'trial',
  "委譲": 'reflection',
  "意志": 'action',
  "意思決定": 'action',
  "移行": 'action',
  "遺産": 'stability',
  "一方的な与え手": 'trial',
  "影": 'reflection',
  "永続": 'stability',
  "円満": 'stability',
  "遠征": 'action',
  "価値観のズレ": 'trial',
  "家の不和": 'trial',
  "家系": 'stability',
  "家事に追われる": 'trial',
  "家族の幸福": 'stability',
  "家庭の緊張": 'trial',
  "過去への囚われ": 'trial',
  "過剰": 'trial',
  "過労": 'trial',
  "我慢": 'stability',
  "解放": 'reflection',
  "回避": 'trial',
  "回復": 'action',
  "回復の兆し": 'action',
  "拡張": 'action',
  "覚醒": 'action',
  "活力": 'action',
  "完成": 'stability',
  "完走": 'stability',
  "感謝": 'emotion',
  "感受性": 'emotion',
  "感情の依存": 'trial',
  "感情の爆発": 'trial',
  "感情の閉ざし": 'trial',
  "感情の抑圧": 'trial',
  "観察": 'reflection',
  "頑固": 'trial',
  "願い成就": 'emotion',
  "喜び": 'emotion',
  "岐路": 'reflection',
  "希望": 'action',
  "希望の喪失": 'trial',
  "既存路線への疑問": 'trial',
  "機転": 'action',
  "気づき": 'reflection',
  "規範": 'stability',
  "技能": 'stability',
  "休息": 'stability',
  "急変": 'action',
  "虚栄": 'trial',
  "許し": 'emotion',
  "共感": 'emotion',
  "協働": 'emotion',
  "恐怖": 'trial',
  "教え": 'reflection',
  "郷愁": 'reflection',
  "勤勉": 'stability',
  "均衡": 'stability',
  "緊張": 'trial',
  "空っぽ": 'trial',
  "空っぽの勝利": 'trial',
  "空回り": 'trial',
  "啓示": 'reflection',
  "継続": 'stability',
  "計画": 'reflection',
  "計画性不足": 'reflection',
  "警戒": 'reflection',
  "軽率": 'trial',
  "欠乏": 'trial',
  "決断": 'action',
  "堅実": 'stability',
  "権威への反発": 'trial',
  "献身": 'emotion',
  "見通しの甘さ": 'trial',
  "幻想": 'reflection',
  "限界": 'trial',
  "呼びかけへの躊躇": 'trial',
  "孤立": 'trial',
  "後悔": 'trial',
  "誤解の解消": 'reflection',
  "公正": 'stability',
  "公平": 'stability',
  "口論": 'trial',
  "好奇心": 'reflection',
  "好機": 'action',
  "抗えない変化": 'trial',
  "攻撃的": 'trial',
  "綱渡り": 'trial',
  "行き詰まり": 'trial',
  "行動力": 'action',
  "降伏": 'trial',
  "困窮": 'trial',
  "混乱": 'trial',
  "鎖からの脱出": 'action',
  "再会": 'emotion',
  "再起": 'action',
  "再生": 'action',
  "才能": 'action',
  "才能の浪費": 'trial',
  "財力": 'stability',
  "策略": 'trial',
  "三角関係の悩み": 'trial',
  "散漫": 'trial',
  "仕事": 'action',
  "使命": 'reflection',
  "始まり": 'action',
  "思いやり": 'emotion',
  "思考の罠": 'reflection',
  "指導力": 'action',
  "支配的": 'trial',
  "視点の転換": 'reflection',
  "視野の狭さ": 'trial',
  "慈しみ": 'emotion',
  "慈愛": 'emotion',
  "自覚": 'action',
  "自己批判": 'trial',
  "自己不信": 'trial',
  "自信喪失": 'trial',
  "自制": 'stability',
  "自爆": 'trial',
  "自由": 'emotion',
  "執着": 'trial',
  "失望": 'trial',
  "失恋": 'trial',
  "嫉妬": 'trial',
  "疾走": 'action',
  "実りの予感": 'stability',
  "実務力": 'stability',
  "赦し": 'emotion',
  "手抜き": 'trial',
  "手放し": 'reflection',
  "手放す勇気": 'action',
  "終わりと始まり": 'action',
  "終焉": 'reflection',
  "集中": 'action',
  "充足": 'stability',
  "充電": 'stability',
  "重荷": 'trial',
  "祝福": 'emotion',
  "熟考": 'reflection',
  "出口": 'action',
  "純粋": 'emotion',
  "巡り合わせ": 'action',
  "助言を拒む": 'trial',
  "勝利": 'action',
  "焦り": 'trial',
  "衝突": 'trial',
  "上質": 'stability',
  "上達": 'stability',
  "情緒安定": 'stability',
  "情緒不安定": 'trial',
  "譲歩": 'reflection',
  "職人技": 'stability',
  "信念": 'reflection',
  "信頼": 'stability',
  "心痛": 'trial',
  "真実": 'reflection',
  "真実の判明": 'reflection',
  "神秘": 'reflection',
  "勢い": 'action',
  "成功": 'action',
  "成就": 'action',
  "成熟": 'stability',
  "成長": 'action',
  "静寂": 'reflection',
  "責任": 'stability',
  "責任の回避": 'trial',
  "節度": 'stability',
  "節目": 'stability',
  "先延ばし": 'trial',
  "先導": 'action',
  "浅はかさ": 'trial',
  "潜在意識": 'reflection',
  "選択": 'reflection',
  "選択肢": 'reflection',
  "閃き": 'action',
  "前進": 'action',
  "善意": 'emotion',
  "素直さ": 'emotion',
  "創作の手詰まり": 'trial',
  "創造": 'action',
  "喪失": 'trial',
  "喪失感": 'trial',
  "操作": 'trial',
  "相互": 'emotion',
  "束縛": 'trial',
  "卒業": 'stability',
  "怠惰": 'trial',
  "探求": 'reflection',
  "探究": 'reflection',
  "短気": 'trial',
  "短絡": 'trial',
  "胆力": 'action',
  "知性": 'reflection',
  "着火": 'action',
  "中間評価": 'stability',
  "調和": 'emotion',
  "長寿": 'stability',
  "直感": 'reflection',
  "直感の遮断": 'trial',
  "停滞": 'trial',
  "提案": 'action',
  "締め切りの延長": 'trial',
  "転機": 'action',
  "伝達": 'reflection',
  "伝統": 'reflection',
  "徒労": 'trial',
  "努力": 'stability',
  "統合": 'emotion',
  "統率": 'action',
  "踏ん張り": 'stability',
  "導き": 'reflection',
  "洞察": 'reflection',
  "独学": 'reflection',
  "独裁": 'trial',
  "独占欲": 'trial',
  "独善": 'trial',
  "独立性": 'reflection',
  "突進": 'action',
  "突破": 'action',
  "突破口": 'action',
  "内なる声": 'reflection',
  "内なる崩壊": 'trial',
  "内省": 'reflection',
  "内紛": 'trial',
  "内面の曇り": 'trial',
  "忍耐": 'stability',
  "燃え尽き": 'trial',
  "粘り": 'stability',
  "能力の過小評価": 'trial',
  "波乗り": 'trial',
  "破滅の回避": 'trial',
  "敗北": 'trial',
  "八方塞がり": 'trial',
  "八方散漫": 'trial',
  "発見": 'action',
  "繁栄": 'stability',
  "悲しみ": 'trial',
  "悲嘆": 'trial',
  "疲労": 'trial',
  "秘密": 'reflection',
  "飛躍": 'action',
  "美": 'stability',
  "表面的な判断": 'reflection',
  "評価": 'stability',
  "不安": 'trial',
  "不安定": 'trial',
  "不一致": 'trial',
  "不運": 'trial',
  "不均衡": 'trial',
  "不公平": 'stability',
  "不信": 'trial',
  "不調和": 'trial',
  "不満足": 'trial',
  "不毛な争い": 'trial',
  "不和": 'trial',
  "復活": 'action',
  "物質主義": 'trial',
  "分かち合い": 'emotion',
  "閉じこもり": 'trial',
  "偏り": 'trial',
  "変化への抵抗": 'trial',
  "変容": 'action',
  "勉強": 'reflection',
  "保守": 'stability',
  "保有": 'stability',
  "保留": 'reflection',
  "包容": 'stability',
  "崩壊": 'trial',
  "方向違い": 'trial',
  "方向修正": 'reflection',
  "豊穣": 'stability',
  "暴走": 'trial',
  "冒険": 'action',
  "冒険心": 'action',
  "防衛": 'reflection',
  "防御": 'reflection',
  "凡ミス": 'trial',
  "慢心": 'trial',
  "満足": 'emotion',
  "未来図": 'action',
  "魅力": 'emotion',
  "夢": 'reflection',
  "夢見る心": 'reflection',
  "無関心": 'trial',
  "無計画": 'trial',
  "無謀": 'trial',
  "無理": 'trial',
  "明朗": 'emotion',
  "明晰": 'reflection',
  "明晰さ": 'reflection',
  "迷い": 'trial',
  "迷妄": 'trial',
  "面倒見": 'emotion',
  "癒し": 'emotion',
  "優しさ": 'emotion',
  "勇敢": 'action',
  "勇気": 'action',
  "友情": 'emotion',
  "欲望": 'trial',
  "理想": 'reflection',
  "離脱": 'trial',
  "立ち直り": 'action',
  "立て直し": 'action',
  "旅立ち": 'action',
  "旅路の総決算": 'action',
  "両立": 'stability',
  "力の濫用": 'trial',
  "冷酷": 'trial',
  "連携ミス": 'trial',
  "浪費": 'trial',
  "浪費癖": 'trial',
  "和解": 'reflection',
  "絆": 'emotion',
};

interface StructuralSignals {
  sameSuit: boolean;
  suit?: Suit;
  bothMajor: boolean;
  bothUpright: boolean;
  bothReversed: boolean;
  mixedOrientation: boolean;
}

interface ToneView {
  keywords: string[];
}

function toneOf(drawn: LoveTarotPairCard): ToneView {
  return drawn.orientation === 'upright' ? drawn.card.upright : drawn.card.reversed;
}

function normalizeKeyword(keyword: string): string {
  return keyword.replace(/[、。・\s]/g, '');
}

function clusterOfKeyword(keyword: string): ThemeCluster | null {
  return KEYWORD_CLUSTER[keyword] ?? KEYWORD_CLUSTER[normalizeKeyword(keyword)] ?? null;
}

function clustersFromKeywords(keywords: string[]): Set<ThemeCluster> {
  const result = new Set<ThemeCluster>();
  for (const keyword of keywords) {
    const cluster = clusterOfKeyword(keyword);
    if (cluster) result.add(cluster);
  }
  return result;
}

function findExactKeyword(a: string[], b: string[]): string | null {
  for (const ka of a) {
    const norm = normalizeKeyword(ka);
    for (const kb of b) {
      if (norm && norm === normalizeKeyword(kb)) return ka;
    }
  }
  return null;
}

function pickFirst<T>(arr: T[], fallback: T): T {
  return arr.length > 0 ? arr[0] : fallback;
}

function keywordForCluster(keywords: string[], cluster: ThemeCluster): string | null {
  for (const keyword of keywords) {
    if (clusterOfKeyword(keyword) === cluster) return keyword;
  }
  return null;
}

function sharedClusters(a: Set<ThemeCluster>, b: Set<ThemeCluster>): ThemeCluster[] {
  return CLUSTER_ORDER.filter((cluster) => a.has(cluster) && b.has(cluster));
}

function complementPair(
  a: Set<ThemeCluster>,
  b: Set<ThemeCluster>,
): [ThemeCluster, ThemeCluster] | null {
  for (const [left, right] of COMPLEMENT_PAIRS) {
    if ((a.has(left) && b.has(right)) || (a.has(right) && b.has(left))) {
      return [left, right];
    }
  }
  return null;
}

function complementKey(left: ThemeCluster, right: ThemeCluster): string {
  const pair = [left, right].sort().join('+');
  return pair;
}

function structuralSignals(a: LoveTarotPairCard, b: LoveTarotPairCard): StructuralSignals {
  const sameSuit = Boolean(
    a.card.suit && b.card.suit && a.card.suit === b.card.suit,
  );
  return {
    sameSuit,
    suit: sameSuit ? a.card.suit : undefined,
    bothMajor: a.card.arcana === 'major' && b.card.arcana === 'major',
    bothUpright: a.orientation === 'upright' && b.orientation === 'upright',
    bothReversed: a.orientation === 'reversed' && b.orientation === 'reversed',
    mixedOrientation: a.orientation !== b.orientation,
  };
}

function hasParallelSignal(signals: StructuralSignals): boolean {
  return (
    signals.sameSuit ||
    signals.bothMajor ||
    signals.bothUpright ||
    signals.bothReversed ||
    signals.mixedOrientation
  );
}

function orientationHint(signals: StructuralSignals): string {
  if (signals.bothUpright) return '二人とも前向きな姿勢が感じられます。';
  if (signals.bothReversed) return '二人とも立ち止まって見直す時期です。';
  if (signals.mixedOrientation) return '歩調の違いは、互いの視点を広げるきっかけにもなります。';
  return '';
}

function buildExactSummary(
  keyword: string,
  signals: StructuralSignals,
): LoveTarotSummary {
  const hint = orientationHint(signals);
  return {
    commonTheme: hint
      ? `二人のあいだに「${keyword}」という共通のテーマがあります。${hint}`
      : `二人のあいだに「${keyword}」という共通のテーマがあります。`,
    complement: 'お互いがこのテーマを大切にしているからこそ、自然に引き合う縁です。',
    tension: signals.bothReversed
      ? '同じテーマを見直す時期が重なると、一時的にすれ違いを感じることもあります。焦らず話し合えば大丈夫です。'
      : '同じテーマを同時に強く求めると、時に主導権のすれ違いが生まれることもあります。',
  };
}

function buildAlignedSummary(
  cluster: ThemeCluster,
  signals: StructuralSignals,
): LoveTarotSummary {
  if (cluster === 'trial') {
    return buildAdjustmentSummary(signals, '同じ課題意識を共有している');
  }

  const label = CLUSTER_LABELS[cluster];
  let commonTheme = `二人とも「${label}」を大切にする時期です。`;

  if (signals.sameSuit && signals.suit) {
    const suitName = SUIT_LABELS[signals.suit].name;
    commonTheme = `二人とも「${SUIT_RELATION_THEMES[signals.suit]}」に関心が向いています。${suitName}のエネルギーが、関係の土台になりやすい組み合わせです。`;
  } else {
    const hint = orientationHint(signals);
    if (hint) commonTheme += hint;
  }

  return {
    commonTheme,
    complement: '似た価値観を持っているから、説明しなくても通じ合える部分があります。',
    tension: signals.bothReversed
      ? '同じ方向を見つめている分、立ち止まるタイミングが重なることも。急いで動き出さなくて大丈夫です。'
      : '似すぎると新鮮さを求めたくなることもありますが、安定感は二人の強みです。',
  };
}

function buildComplementSummary(
  pair: [ThemeCluster, ThemeCluster],
  aKeywords: string[],
  bKeywords: string[],
  signals: StructuralSignals,
): LoveTarotSummary {
  const phrase = COMPLEMENT_PHRASES[complementKey(pair[0], pair[1])];
  const aWord = keywordForCluster(aKeywords, pair[0]) ?? pickFirst(aKeywords, CLUSTER_LABELS[pair[0]]);
  const bWord = keywordForCluster(bKeywords, pair[1]) ?? pickFirst(bKeywords, CLUSTER_LABELS[pair[1]]);

  return {
    commonTheme: phrase
      ? `テーマは違いますが、${phrase}です。`
      : `「${CLUSTER_LABELS[pair[0]]}」と「${CLUSTER_LABELS[pair[1]]}」が補い合う組み合わせです。`,
    complement: `あなたの「${aWord}」と、相手の「${bWord}」が役割分担として機能しやすいです。`,
    tension: signals.mixedOrientation
      ? '進み方のペースに差が出やすいですが、急いで揃える必要はありません。'
      : '足りない部分を埋め合える反面、最初は「なぜ違うのか」と感じることも。時間をかけて慣れていけます。',
  };
}

function buildParallelSummary(signals: StructuralSignals): LoveTarotSummary {
  if (signals.sameSuit && signals.suit) {
    const suitName = SUIT_LABELS[signals.suit].name;
    return {
      commonTheme: `二人とも「${SUIT_RELATION_THEMES[signals.suit]}」に関心が向いています。${suitName}のテーマが、関係の共通言語になりやすい組み合わせです。`,
      complement: '同じ領域を大切にしているから、日常の中で自然に並走しやすい関係です。',
      tension: '似た関心が強いほど、細かな好みの違いに気づくことも。大切なのは、同じ方向を向いているという安心感です。',
    };
  }

  if (signals.bothMajor) {
    return {
      commonTheme: 'お互いの人生の大きなテーマが交わる関係です。表面的な違いより、根底にある価値観に注目してみましょう。',
      complement: 'それぞれの人生観が響き合うことで、深い理解に育ちやすい組み合わせです。',
      tension: 'テーマが大きい分、関係にも真剣になりやすい反面、時に重く感じることも。無理に軽くする必要はありません。',
    };
  }

  if (signals.bothUpright) {
    return {
      commonTheme: '二人とも前向きに関係へ向き合おうとしている時期です。素直な気持ちが通じやすい組み合わせです。',
      complement: 'お互いを前向きに受け止め合えるから、小さな好意も自然に育ちます。',
      tension: '勢いが合うと進みが速くなる一方、相手のペースを置き去りにしないよう意識するとより安心です。',
    };
  }

  if (signals.bothReversed) {
    return {
      commonTheme: '二人とも立ち止まり、関係を見直している時期です。急いで結論を出さなくて大丈夫です。',
      complement: '同じように立ち止まっているから、焦らず対話の時間をとれる関係です。',
      tension: '見直しの時期が重なると、一時的に距離を感じることも。それは関係が壊れた証ではなく、整え直すサインです。',
    };
  }

  return {
    commonTheme: '歩調は違いますが、互いの視点が自然な距離感をつくります。無理に揃えなくても、関係は育っていけます。',
    complement: '違いがあるからこそ、一人では気づけない視点を持ち込めます。',
    tension: '正位置と逆位置の差は、時に「温度差」と感じることも。急いで理解し合おうとしなくて大丈夫です。',
  };
}

function buildAdjustmentSummary(
  signals: StructuralSignals,
  prefix = 'お互いに見直しや調整が必要なテーマを抱えている',
): LoveTarotSummary {
  const pauseHint = signals.bothReversed
    ? '二人とも立ち止まっている時期が重なっています。'
    : '';
  return {
    commonTheme: `${prefix}組み合わせです。${pauseHint}うまくいかない時期のサインとして読むより、関係を整えるチャンスと捉えてみましょう。`,
    complement: '課題を共有しているからこそ、正直に話し合えるきっかけにもなります。',
    tension: 'すれ違いや不満を感じやすい時期でも、関係そのものが終わったわけではありません。小さな歩みで十分です。',
  };
}

function buildDiverseSummary(
  aKeywords: string[],
  bKeywords: string[],
  signals: StructuralSignals,
): LoveTarotSummary {
  const aWord = pickFirst(aKeywords, '自分らしさ');
  const bWord = pickFirst(bKeywords, '相手らしさ');

  const hint = orientationHint(signals);
  return {
    commonTheme: hint
      ? `テーマの重なりは薄めですが、だからこそ新しい視点を持ち込める関係です。${hint}`
      : 'テーマの重なりは薄めですが、日常の中で自然に距離を保てる組み合わせです。',
    complement: `あなたの「${aWord}」と、相手の「${bWord}」が、穏やかに共存しやすい関係です。`,
    tension: '違いを急いで埋めようとしなくてよい関係です。自然体のまま、時間をかけて知っていけます。',
  };
}

function detectRelationKind(
  exact: string | null,
  shared: ThemeCluster[],
  complement: [ThemeCluster, ThemeCluster] | null,
  signals: StructuralSignals,
  aClusters: Set<ThemeCluster>,
  bClusters: Set<ThemeCluster>,
): RelationKind {
  if (exact) return 'exact';

  const nonTrialShared = shared.filter((cluster) => cluster !== 'trial');
  if (nonTrialShared.length > 0) return 'aligned';
  if (shared.includes('trial')) return 'adjustment';
  if (complement) return 'complement';
  if (hasParallelSignal(signals)) return 'parallel';
  if (aClusters.has('trial') && bClusters.has('trial')) return 'adjustment';
  return 'diverse';
}

export function summarizeLoveTarotPair(
  a: LoveTarotPairCard,
  b: LoveTarotPairCard,
): LoveTarotSummary {
  const aTone = toneOf(a);
  const bTone = toneOf(b);
  const signals = structuralSignals(a, b);
  const exact = findExactKeyword(aTone.keywords, bTone.keywords);
  const aClusters = clustersFromKeywords(aTone.keywords);
  const bClusters = clustersFromKeywords(bTone.keywords);
  const shared = sharedClusters(aClusters, bClusters);
  const complement = complementPair(aClusters, bClusters);
  const kind = detectRelationKind(exact, shared, complement, signals, aClusters, bClusters);

  switch (kind) {
    case 'exact':
      return buildExactSummary(exact!, signals);
    case 'aligned':
      return buildAlignedSummary(nonTrialSharedFirst(shared), signals);
    case 'complement':
      return buildComplementSummary(complement!, aTone.keywords, bTone.keywords, signals);
    case 'parallel':
      return buildParallelSummary(signals);
    case 'adjustment':
      return buildAdjustmentSummary(signals);
    case 'diverse':
    default:
      return buildDiverseSummary(aTone.keywords, bTone.keywords, signals);
  }
}

function nonTrialSharedFirst(shared: ThemeCluster[]): ThemeCluster {
  return shared.find((cluster) => cluster !== 'trial') ?? shared[0];
}
