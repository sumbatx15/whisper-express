import type { FileLike } from "openai/uploads";
import { openai } from "../app";
import FormData from "form-data";
import axios, { isAxiosError } from "axios";

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
  lang?: string,
  prompt?: string
) => {
  const audioBuffer = Buffer.from(file);
  const formData = new FormData();

  formData.append("file", audioBuffer, "audio.webm");
  formData.append("model", "whisper-1");

  if (lang) formData.append("language", lang);
  if (prompt) formData.append("prompt", prompt);

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
    // console.log("error:", error);+
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    console.log("error.response.data:", error.response.data);

    throw error;
  }
};
export const transcribeAxiosBlob = async (
  buffer: Buffer,
  lang?: string,
  prompt?: string
) => {
  const formData = new FormData();

  formData.append("file", buffer, "audio.webm");
  formData.append("model", "whisper-1");

  if (lang) formData.append("language", lang);
  if (prompt) formData.append("prompt", prompt);

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
    // console.log("error:", error);+
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    console.log("error.response.data:", error?.response?.data);
    const isAxiosErr = isAxiosError(error);
    throw isAxiosErr ? error?.response?.data?.error : error;
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
