// CardSuit, 숫자는 poker_response.proto의 enum과 동일하게 맞춤
// CardSuit: SPADE=0, HEART=1, DIAMOND=2, CLUB=3
// number: 1(A) ~ 13(K)

export const createDeck = () => {
  const deck = [];
  for (let suit = 0; suit <= 3; suit++) {
    for (let number = 1; number <= 13; number++) {
      deck.push({ suit, number });
    }
  }
  return deck;
};

// Fisher-Yates 셔플
export const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createShuffledDeck = () => shuffleDeck(createDeck());

// 덱에서 n장 뽑기 (덱을 직접 변경)
export const dealCards = (deck, count) => deck.splice(0, count);
