import { IMode } from "./types";

export const GPT_MODELS = ["gpt-4-1106-preview", "gpt-3.5-turbo-1106"] as const;
export const defaultModes: IMode[] = [
  {
    name: "Correct grammar",
    instructions: "Correct any grammatical errors",
    description: "Automatically Correct grammatical errors",
    icon: {
      name: "Autobrightness",
      color: "#38A169",
      pack: "sax",
    },
    model: "gpt-3.5-turbo-1106",
  },
  {
    name: "Translate to English",
    instructions:
      "Translate the following text into English. Ensure that the translation captures the essence of any slang, cultural nuances, and contextual subtleties. Aim for a natural and fluent English expression, maintaining consistency in tense and style. Adjust phrases as needed to sound idiomatic in English, while preserving the original meaning and sentiment of the text",
    description: "Translate your speech to English",
    icon: {
      name: "Translate",
      color: "#519DE3",
      pack: "sax",
    },
    model: "gpt-4-1106-preview",
  },
];

export enum Errors {
  NoAccessToken,
  Timeout,
  NotEnoughTokens,
  UserNotFound,
  InvalidAudioFile,
}
