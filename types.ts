export enum PersonaId {
  CUTE = 'cute',
  ANGRY = 'angry',
  SASSY = 'sassy',
  DELHI = 'delhi',
  PUNJABI = 'punjabi',
  FILMY = 'filmy',
  ROAST = 'roast',
  STORYTELLER = 'storyteller',
  BHOJPURI = 'bhojpuri',
  BENGALURU = 'bengaluru'
}

export interface Persona {
  id: PersonaId;
  name: string;
  emoji: string;
  description: string;
  color: string;
  systemInstruction: string;
  voiceName: string; // Mapping to Gemini voices (Puck, Charon, Kore, Fenrir, Zephyr)
}

export interface AudioVisualizerBar {
  height: number;
}