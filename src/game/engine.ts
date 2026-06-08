import type { GameState, CardPair, EventCard, CharacterCard, TimelineCard } from './types';

export class GameEngine {
  private state: GameState;
  private onStateChange: (state: GameState) => void;

  constructor(data: CardPair[], initialHandSize: number, onStateChange: (state: GameState) => void) {
    this.onStateChange = onStateChange;
    this.state = this.initializeGame(data, initialHandSize);
    this.notify();
  }

  public getState(): GameState {
    return this.state;
  }

  private notify() {
    this.onStateChange({ ...this.state }); // clone state reference to trigger UI updates
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private initializeGame(data: CardPair[], handSize: number): GameState {
    let eventDeck: EventCard[] = [];
    let characterDeck: CharacterCard[] = [];
    let relatedEventCards: Record<string, string> = {};

    data.forEach(pair => {
      eventDeck.push(pair.event_card);
      characterDeck.push(pair.character_card);
      relatedEventCards[pair.character_card.id] = pair.event_card.id;
    });

    eventDeck = this.shuffle(eventDeck);
    characterDeck = this.shuffle(characterDeck);

    const firstEvent = eventDeck.pop();
    const timeline: TimelineCard[] = [];
    if (firstEvent) {
      timeline.push({ event: firstEvent, isRevealed: true, isCorrect: true });
    }

    const playerHand = characterDeck.splice(0, handSize);

    return {
      lives: 3,
      eventDeck,
      characterDeck,
      playerHand,
      discardPile: [],
      timeline,
      isGameOver: false,
      isWin: false,
      currentTurnEventCard: eventDeck.length > 0 ? eventDeck.pop()! : null,
      relatedEventCards,
      charactersOnTimeline: {}
    };
  }

  private drawCharacter(): CharacterCard | null {
    if (this.state.characterDeck.length === 0) {
      if (this.state.discardPile.length === 0) {
        return null;
      }
      this.state.characterDeck = this.shuffle(this.state.discardPile);
      this.state.discardPile = [];
    }
    return this.state.characterDeck.pop() || null;
  }

  public placeEvent(timelineIndex: number): boolean {
    if (!this.state.currentTurnEventCard) return false;
    
    const card = this.state.currentTurnEventCard;
    let isCorrect = true;
    
    if (timelineIndex > 0) {
      const prev = this.state.timeline[timelineIndex - 1];
      if (card.sortDate < prev.event.sortDate) {
        isCorrect = false;
      }
    }
    
    if (timelineIndex < this.state.timeline.length) {
      const next = this.state.timeline[timelineIndex];
      if (card.sortDate > next.event.sortDate) {
        isCorrect = false;
      }
    }

    if (isCorrect) {
      this.state.timeline.splice(timelineIndex, 0, { event: card, isRevealed: true, isCorrect: true });
    } else {
      let correctIndex = 0;
      while (correctIndex < this.state.timeline.length && this.state.timeline[correctIndex].event.sortDate < card.sortDate) {
        correctIndex++;
      }
      this.state.timeline.splice(correctIndex, 0, { event: card, isRevealed: true, isCorrect: false });
      
      this.state.lives -= 1;
      
      const penaltyCard = this.drawCharacter();
      if (penaltyCard) this.state.playerHand.push(penaltyCard);

      this.checkEndConditions();
      
      if (!this.state.isGameOver) {
        this.nextTurn();
      }
    }

    this.notify();
    return isCorrect;
  }

  public putCharacter(characterId: string, eventId: string): boolean {
    const charIndex = this.state.playerHand.findIndex(c => c.id === characterId);
    if (charIndex === -1) return false;

    if (this.state.relatedEventCards[characterId] === eventId) {
      const charCard = this.state.playerHand.splice(charIndex, 1)[0];
      this.state.charactersOnTimeline[eventId] = charCard;
      
      this.checkEndConditions();
      if (!this.state.isGameOver) {
        this.nextTurn();
      } else {
        this.notify();
      }
      return true;
    }
    
    return false;
  }

  public refreshCharacters(characterIds: string[]) {
    let discardedCount = 0;
    characterIds.forEach(id => {
      const idx = this.state.playerHand.findIndex(c => c.id === id);
      if (idx !== -1) {
        const c = this.state.playerHand.splice(idx, 1)[0];
        this.state.discardPile.push(c);
        discardedCount++;
      }
    });

    for (let i = 0; i < discardedCount; i++) {
      const newChar = this.drawCharacter();
      if (newChar) {
        this.state.playerHand.push(newChar);
      }
    }

    this.nextTurn();
  }

  public passTurn() {
    this.nextTurn();
  }

  private nextTurn() {
    if (this.state.eventDeck.length > 0) {
      this.state.currentTurnEventCard = this.state.eventDeck.pop()!;
    } else {
      this.state.currentTurnEventCard = null;
    }
    this.notify();
  }

  private checkEndConditions() {
    if (this.state.playerHand.length === 0) {
      this.state.isGameOver = true;
      this.state.isWin = true;
    } else if (this.state.lives <= 0) {
      this.state.isGameOver = true;
      this.state.isWin = false;
    }
  }
}
