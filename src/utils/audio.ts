import type { FileLike } from "openai/uploads";
import { openai } from "../app";
import FormData from "form-data";
import axios from "axios";

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

export const transcribeAxios = async (
  file: any,
  lang = "en",
  prompt?: string
) => {
  const audioBuffer = Buffer.from(file);

  const formData = new FormData();
  formData.append("file", audioBuffer, "audio.webm");
  formData.append("model", "whisper-1");
  formData.append("language", lang);

  console.log("prompt:", prompt);
  if (prompt) {
    formData.append("prompt", prompt);
  }

  // Make the axios request
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log("error:", error);
    throw error;
  }
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