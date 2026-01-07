export enum CardType {
  NUMBER = 'number',
  ADDITION = 'addition',
  MULTIPLIER = 'multiplier',
  FREEZE = 'freeze',
  FLIP_THREE = 'flip-three',
  SECOND_CHANCE = 'second-chance',
}

export interface Card {
  id: number;
  type: CardType;
  value: number | string;
  imageUrl: string;
  displayValue: string; // For UI display (e.g., "+2", "x2", "FREEZE")
}
