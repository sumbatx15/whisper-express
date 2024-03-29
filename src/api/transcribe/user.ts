import express, { Response } from "express";
import {
  calcGPTTokens,
  calcWhisperTokens,
  getDurationFromBlob,
} from "../../config/tokens_system";
import { updateUsage } from "../../db/usage";
import { decreaseTokens } from "../../db/user";
import { GPT_MODELS } from "../../shared/consts";
import { TranscribeRequest } from "../../shared/types";
import { correctWithGPTPrompt, transcribeAxios } from "../../utils/audio";
import catchAsync from "../../utils/catchAsync";
import { getCachedSessionUser } from "../../utils/session";
import {
  hasBearer,
  hasEnoughTokens,
  identifyAndCacheUser,
  validTranscriptionBody,
} from "../middleware";

const router = express.Router();

router.use(
  hasBearer,
  identifyAndCacheUser,
  validTranscriptionBody,
  hasEnoughTokens
);

router.post(
  "/",
  catchAsync(async (req: TranscribeRequest, res: Response) => {
    const cachedUser = getCachedSessionUser(req)!;
    const { body } = req;

    const blob = req.context.blob!;
    const audio_duration = getDurationFromBlob(blob);
    const whisperTokens = calcWhisperTokens(audio_duration);

    const time = Date.now();
    const speech = await transcribeAxios(body.buffer, body.lang);
    const timeEnd = Date.now() - time;

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
          modeOutput: response.choices[0].message.content ?? undefined,
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
          transcribe: timeEnd,
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
          transcribe: timeEnd,
        },
      });
    }
  })
);

export default router;
