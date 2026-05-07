// 패 순위 (높을수록 강함)
export const HAND_RANK = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
};

export const HAND_NAMES = [
  '하이 카드', '원 페어', '투 페어', '쓰리 오브 어 카인드',
  '스트레이트', '플러시', '풀 하우스', '포 오브 어 카인드', '스트레이트 플러시',
];

// Ace를 14로 변환
const cardValue = (n) => n === 1 ? 14 : n;

// 카드 5장을 받아 점수 계산
const scoreFiveCards = (cards) => {
  const vals = cards.map(c => cardValue(c.number)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  // 일반 스트레이트 체크
  let isStraight = vals.every((v, i) => i === 0 || vals[i - 1] - v === 1);
  let straightHigh = vals[0];

  // A-2-3-4-5 (휠) 체크
  if (!isStraight && vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2) {
    isStraight = true;
    straightHigh = 5;
  }

  // 숫자별 카운트
  const freq = {};
  vals.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  // count 내림차순, value 내림차순 정렬
  const groups = Object.entries(freq)
    .map(([v, c]) => [parseInt(v), c])
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let rank, tiebreakers;

  if (isFlush && isStraight) {
    rank = HAND_RANK.STRAIGHT_FLUSH;
    tiebreakers = [straightHigh];
  } else if (groups[0][1] === 4) {
    rank = HAND_RANK.FOUR_OF_A_KIND;
    tiebreakers = [groups[0][0], groups[1][0]];
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    rank = HAND_RANK.FULL_HOUSE;
    tiebreakers = [groups[0][0], groups[1][0]];
  } else if (isFlush) {
    rank = HAND_RANK.FLUSH;
    tiebreakers = vals;
  } else if (isStraight) {
    rank = HAND_RANK.STRAIGHT;
    tiebreakers = [straightHigh];
  } else if (groups[0][1] === 3) {
    rank = HAND_RANK.THREE_OF_A_KIND;
    tiebreakers = [groups[0][0], ...vals.filter(v => v !== groups[0][0])];
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    rank = HAND_RANK.TWO_PAIR;
    const kicker = vals.find(v => v !== groups[0][0] && v !== groups[1][0]);
    tiebreakers = [groups[0][0], groups[1][0], kicker];
  } else if (groups[0][1] === 2) {
    rank = HAND_RANK.ONE_PAIR;
    tiebreakers = [groups[0][0], ...vals.filter(v => v !== groups[0][0])];
  } else {
    rank = HAND_RANK.HIGH_CARD;
    tiebreakers = vals;
  }

  // rank * 15^5 + tiebreakers 인코딩
  let score = rank * Math.pow(15, 5);
  tiebreakers.forEach((t, i) => {
    score += t * Math.pow(15, 4 - i);
  });

  return { rank, score };
};

// arr에서 k개 조합 반환
const getCombinations = (arr, k) => {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...getCombinations(rest, k - 1).map(c => [first, ...c]),
    ...getCombinations(rest, k),
  ];
};

// holeCards(2장) + communityCards(3~5장)에서 최강 5장 패 평가
export const evaluateBestHand = (holeCards, communityCards) => {
  const allCards = [...holeCards, ...communityCards];

  if (allCards.length < 5) {
    return { rank: 0, score: 0, handName: HAND_NAMES[0] };
  }

  const combos = allCards.length === 5 ? [allCards] : getCombinations(allCards, 5);
  let best = { rank: -1, score: -1 };

  for (const combo of combos) {
    const result = scoreFiveCards(combo);
    if (result.score > best.score) best = result;
  }

  return { ...best, handName: HAND_NAMES[best.rank] };
};
