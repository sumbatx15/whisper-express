import type { CompletionUsage } from "openai/resources";
import { GPT_MODELS } from "../shared/consts";

export const ONE_TOKEN = 0.001;

const PRICES = {
  whisper: {
    minute: 0.006,
    second: 0.0001,
  },
  "gpt-4-1106-preview": {
    input: 0.01 / 1000,
    output: 0.03 / 1000,
  },
  "gpt-3.5-turbo-1106": {
    input: 0.001 / 1000,
    output: 0.002 / 1000,
  },
};

export const FREE_TOKENS = {
  tokens: (20 * PRICES.whisper.minute) / ONE_TOKEN,
  plan_tokens: (60 * PRICES.whisper.minute) / ONE_TOKEN,
};

export const NEW_USER_TOKENS = {
  tokens: (40 * PRICES.whisper.minute) / ONE_TOKEN,
  plan_tokens: (60 * PRICES.whisper.minute) / ONE_TOKEN,
};

export const getDuration = (blob: Blob) => {
  return Math.ceil(blob.size / 1024 / 8);
};

export const calcWhisperTokens = (blob: Blob) => {
  const duration = getDuration(blob);
  return (duration * PRICES.whisper.second) / ONE_TOKEN;
};

export const calcGPTTokens = (
  model: (typeof GPT_MODELS)[number],
  usage: CompletionUsage
) => {
  const input = (usage.prompt_tokens * PRICES[model].input) / ONE_TOKEN;
  const output = (usage.completion_tokens * PRICES[model].output) / ONE_TOKEN;
  return input + output;
};
