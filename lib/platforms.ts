export interface Platform {
  id: string;
  label: string;
  contentWord: string;
  hookLabel: string;
  visualLabel: string;
  productionLabel: string;
  hookPlaceholder: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: "youtube",
    label: "YouTube",
    contentWord: "動画",
    hookLabel: "冒頭15秒のフック",
    visualLabel: "サムネイル案",
    productionLabel: "撮影メモ",
    hookPlaceholder: "冒頭15秒のセリフ（そのまま読めるレベルで具体的に）",
  },
  {
    id: "tiktok",
    label: "TikTok / Reels",
    contentWord: "ショート動画",
    hookLabel: "冒頭3秒のフック",
    visualLabel: "サムネイル案",
    productionLabel: "撮影メモ",
    hookPlaceholder: "最初の3秒で使う言葉や動作（即インパクトのあるもの）",
  },
  {
    id: "instagram",
    label: "Instagram",
    contentWord: "投稿",
    hookLabel: "キャプション冒頭",
    visualLabel: "投稿ビジュアル案",
    productionLabel: "制作メモ",
    hookPlaceholder: "キャプションの最初の一文（続きを読ませる一行）",
  },
  {
    id: "podcast",
    label: "Podcast",
    contentWord: "エピソード",
    hookLabel: "オープニングトーク",
    visualLabel: "エピソードアート案",
    productionLabel: "収録メモ",
    hookPlaceholder: "収録開始直後のつかみトーク（30秒以内）",
  },
  {
    id: "blog",
    label: "ブログ / note",
    contentWord: "記事",
    hookLabel: "リード文",
    visualLabel: "アイキャッチ案",
    productionLabel: "執筆メモ",
    hookPlaceholder: "記事冒頭のリード文（読者を引き込む2〜3文）",
  },
  {
    id: "x",
    label: "X (Twitter)",
    contentWord: "投稿",
    hookLabel: "冒頭のツイート",
    visualLabel: "添付画像案",
    productionLabel: "スレッド構成メモ",
    hookPlaceholder: "最初のツイート（140字以内で完結・続きを読ませる）",
  },
  {
    id: "twitch",
    label: "配信 (Twitch / YouTube Live)",
    contentWord: "配信",
    hookLabel: "配信開始のあいさつ",
    visualLabel: "サムネイル案",
    productionLabel: "配信構成メモ",
    hookPlaceholder: "配信開始直後のあいさつと今日のテーマ告知（1分以内）",
  },
  {
    id: "roblox-dev",
    label: "Roblox（ゲーム制作）",
    contentWord: "ゲーム / 体験",
    hookLabel: "ゲーム紹介文",
    visualLabel: "アイコン / サムネイル案",
    productionLabel: "開発メモ",
    hookPlaceholder: "ゲームページの最初の説明文（プレイヤーを引き込む2〜3文）",
  },
  {
    id: "roblox-play",
    label: "Roblox（実況・プレイ動画）",
    contentWord: "動画",
    hookLabel: "冒頭15秒のフック",
    visualLabel: "サムネイル案",
    productionLabel: "撮影メモ",
    hookPlaceholder: "冒頭15秒のセリフ（視聴者を引き込む一言から始める）",
  },
];

export function getPlatform(id: string): Platform {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}
