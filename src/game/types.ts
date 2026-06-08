export interface EventCard {
  id: string;
  question: string;
  displayDate: string;
  sortDate: number;
  title: string;
  description: string;
}

export interface CharacterCard {
  id: string;
  name: string;
  description: string;
}

export interface CardPair {
  event_card: EventCard;
  character_card: CharacterCard;
}

// State for an Event Card on the Timeline
export interface TimelineCard {
  event: EventCard;
  isRevealed: boolean;
  isCorrect: boolean;
}

export type ActionType = 'put' | 'refresh' | 'pass';

export interface GameState {
  lives: number;
  eventDeck: EventCard[];
  characterDeck: CharacterCard[];
  playerHand: CharacterCard[];
  discardPile: CharacterCard[];
  timeline: TimelineCard[];
  isGameOver: boolean;
  isWin: boolean;
  currentTurnEventCard: EventCard | null; // The event card currently being placed
  relatedEventCards: Record<string, string>; // Maps character.id to event.id for validation
  charactersOnTimeline: Record<string, CharacterCard>; // Maps event.id to CharacterCard placed under it
}
