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
  content: string; // Separated with '---' for gorgeous pages
  characterAppearance: string;
  coverIllustrationPrompt: string; 
  coverImageUrl?: string; // Holds base64 png or svg string
  keyFeatures: KeyFeatures;
  inputs?: StoryInput; // Preserve original input parameters for reload
  id?: string; // Unique id for list identification
  createdAt?: string; // Date of formulation
}

export interface StaticExample {
  id: string;
  title: string;
  summary: string;
  specialInterest: string;
  superpower: string;
  characterAppearance: string;
  content: string;
  keyFeatures: KeyFeatures;
  coverImageUrl?: string; // Cozy illustration
  objectAppearance?: string;
  suggestedIllustrations?: string[];
  fallbackImages?: string[];
}
