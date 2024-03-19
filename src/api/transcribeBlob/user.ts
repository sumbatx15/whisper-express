import express, { Response } from "express";
import {
  calcGPTTokens,
  calcWhisperTokens,
  getDurationFromBuffer,
} from "../../config/tokens_system";
import { updateUsage } from "../../db/usage";
import { decreaseTokens } from "../../db/user";
import { GPT_MODELS } from "../../shared/consts";
import { TranscribeRequestV2 } from "../../shared/types";
import { correctWithGPTPrompt, transcribeAxiosBlob } from "../../utils/audio";
import catchAsync from "../../utils/catchAsync";
import { getCachedSessionUser } from "../../utils/session";
import {
  hasBearer,
  hasEnoughTokensV2,
  identifyAndCacheUser,
  validTranscriptionBlobBody,
} from "../middleware";

import { upload } from "../../shared/multer";

const router = express.Router();

router.use(
  hasBearer,
  identifyAndCacheUser,
  validTranscriptionBlobBody,
  upload.single("blob"),
  hasEnoughTokensV2
);

router.post(
  "/",
  catchAsync(async (req: TranscribeRequestV2, res: Response) => {
    if (!req.file?.buffer) {
      throw new Error("No file buffer");
    }

    const cachedUser = getCachedSessionUser(req)!;
    const { body } = req;

    const audio_duration = getDurationFromBuffer(req.file?.buffer);
    console.log("FILE: audio_duration:", audio_duration);
    const whisperTokens = calcWhisperTokens(audio_duration);

    const time = Date.now();
    const speech = await transcribeAxiosBlob(req.file?.buffer!, body.lang);
    const timeEnd = Date.now() - time;

    if (body.instructions && body.model) {
      const response = await correctWithGPTPrompt(speech.text, {
        instructions: body.instructions,
        model: body.model,
        name: body.name || "",
      });
      const gptTokens = calcGPTTokens(
        body.model as (typeof GPT_MODELS)[number],
        response.usage!
      );

      const usedTokens = whisperTokens + gptTokens;

      decreaseTokens(cachedUser.google_account_id, usedTokens);
      cachedUser.tokens -= usedTokens;

      updateUsage({
        google_account_id: cachedUser.google_account_id,
        usage: {
          langCode: body.lang,
          tokens_used: usedTokens,
          text: speech.text,
          modeOutput: response.choices[0].message.content ?? undefined,
          mode: {
            id: body.id,
            name: body.name || "",
            model: body.model,
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
          langCode: body.lang,
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
