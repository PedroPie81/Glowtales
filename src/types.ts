export interface StoryInput {
  name: string;
  age: string;
  pronouns: string;
  specialInterests: string;
  triggers: string;
  addressTriggers: boolean;
  length: "Short" | "Medium" | "Long";
  sensoryLevel: string;
  structure: string;
  perspective: "First-person" | "Third-person";
  includeIllustrations: boolean;
  visualStyle?: "vector" | "watercolor" | "contrast";
  customAppearance?: string;
  referencePhoto?: string;
  companionName?: string;
  companionType?: string;
  companionAppearance?: string;
}

export interface KeyFeatures {
  specialInterestUsed: string;
  strengthsCelebrated: string;
  sensoryLevel: string;
}

export interface StoryResult {
  title: string;
  content: string;
  characterAppearance: string;
  objectAppearance: string;
  suggestedIllustrations: string[];
  keyFeatures: KeyFeatures;
  // Dynamic images map: marker index (e.g., 1, 2, 3, 4) -> full image data URL
  images?: Record<number, string>;
}

export interface StaticExample {
  id: string;
  title: string;
  summary: string;
  specialInterest: string;
  superpower: string;
  characterAppearance: string;
  objectAppearance: string;
  content: string;
  keyFeatures: {
    specialInterestUsed: string;
    strengthsCelebrated: string;
    sensoryLevel: string;
  };
  suggestedIllustrations: string[];
  // static illustrations - SVGs or CSS layouts as a comforting default
  fallbackImages: string[]; 
}
