import express, { Response } from "express";
import {
  calcGPTTokens,
  calcWhisperTokens,
  getDuration,
} from "../../config/tokens_system";
import { updateUsage } from "../../db/usage";
import { decreaseTokens } from "../../db/user";
import { GPT_MODELS } from "../../shared/consts";
import { TranscribeRequest } from "../../shared/types";
import {
  correctWithGPTPrompt,
  normalArrayToBlob,
  transcribeAxios,
} from "../../utils/audio";
import catchAsync from "../../utils/catchAsync";
import { getCachedSessionUser } from "../../utils/session";
import {
  hasBearer,
  hasEnoughTokens,
  hasValidBody,
  identifyAndCacheUser,
} from "../middleware";

const router = express.Router();

router.use(hasBearer, identifyAndCacheUser, hasValidBody, hasEnoughTokens);

router.post(
  "/",
  catchAsync(async (req: TranscribeRequest, res: Response) => {
    const cachedUser = getCachedSessionUser(req)!;
    const { body } = req;

    const blob = normalArrayToBlob(body.buffer || []);
    const whisperTokens = calcWhisperTokens(blob);
    const audio_duration = getDuration(blob);

    const speech = await transcribeAxios(
      body.buffer,
      body.lang,
      `Oliver, sensing Samantha's disappointment, nudged her gently with his wet nose. He looked up at her with his big, soulful eyes, as if to say, "Don't give up, Samantha. There's still more to discover."

      Her father, Mr. Williams, happened to be tinkering with a broken radio in the basement when Samantha and Oliver returned home. He noticed the dejected look on Samantha's face and put his work aside.
      
      "Well, Samantha," he said gently, a warm smile spreading across his face, "sometimes the real treasure isn't what you expect it to be. Let's see where this key leads us."
      
      Samantha's eyes lit up with renewed hope. She nodded eagerly, her disappointment fading away. With Oliver by her side, she knew that their adventure had only just begun.
      
      Little did Samantha know, this key held secrets that would unlock a world beyond her wildest imagination—a world filled with magic, wonder, and a treasure far greater than any material wealth.`
    );

    if (body.mode) {
      const response = await correctWithGPTPrompt(speech.text, body.mode);
      const gptTokens = calcGPTTokens(
        body.mode.model as (typeof GPT_MODELS)[number],
        response.usage!
      );

      const usedTokens = whisperTokens + gptTokens;

      decreaseTokens(cachedUser.google_account_id, usedTokens);
      cachedUser.tokens -= usedTokens;

      updateUsage({
        google_account_id: cachedUser.google_account_id,
        usage: {
          tokens_used: usedTokens,
          text: speech.text,
          mode: {
            id: body.mode.id,
            name: body.mode.name,
            model: body.mode.model,
            input_tokens: response.usage?.prompt_tokens,
            output_tokens: response.usage?.completion_tokens,
          },
          audio_length: audio_duration,
          created_at: Date.now(),
        },
      });

      res.status(200).send({
        text: response.choices[0].message.content,
        speech: speech.text,
        timing: {
          audio_duration,
        },
      });
    } else {
      updateUsage({
        google_account_id: cachedUser.google_account_id,
        usage: {
          tokens_used: whisperTokens,
          text: speech.text,
          audio_length: audio_duration,
          created_at: Date.now(),
        },
      });
      decreaseTokens(cachedUser.google_account_id, whisperTokens);
      cachedUser.tokens -= whisperTokens;

      res.status(200).send({
        text: speech.text,
        timing: {
          audio_duration,
        },
      });
    }
  })
);

export default router;
