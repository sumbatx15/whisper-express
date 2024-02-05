import type { FileLike } from "openai/uploads";
import { openai } from "../app";

export const createInstructions = (instructions: string) => {
  return `Instruction: "${instructions}"
  Given the above instruction, please respond with the corrected text based on the following user input. Only provide the improved or formatted text without any additional explanations or descriptions.`;
};
export const normalArrayToBlob = (array: number[]): Blob => {
  const typedArray = new Uint8Array(array);
  return new Blob([typedArray.buffer]);
};

type ModeOptions = {
  id?: string;
  name: string;
  instructions: string;
  model: string;
};

export type TranscribeOptions = {
  lang?: string;
  mode?: ModeOptions;
};

export const transcribe = async (
  file: FileLike,
  { lang }: TranscribeOptions
) => {
  return openai.audio.transcriptions.create({
    file,
    language: lang,
    model: "whisper-1",
  });
};

export const correctWithGPTPrompt = async (speech: string, mode: ModeOptions) =>
  openai.chat.completions.create({
    model: mode.model,
    messages: [
      {
        role: "system",
        content: createInstructions(mode.instructions),
      },
      {
        role: "user",
        content: speech,
      },
    ],
  });
