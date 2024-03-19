import express, { Response } from "express";
import {
  calcGPTTokens,
  calcWhisperTokens,
  getDurationFromBlob,
} from "../../config/tokens_system";
import { updateUsageByUUID } from "../../db/usage";
import { decreaseTokensByUUID } from "../../db/user";
import { GPT_MODELS } from "../../shared/consts";
import { TranscribeRequest } from "../../shared/types";
import { correctWithGPTPrompt, transcribeAxios } from "../../utils/audio";
import catchAsync from "../../utils/catchAsync";
import { getCachedSessionUser } from "../../utils/session";
import {
  hasBearer,
  hasEnoughTokens,
  identifyAndCacheAnonymous,
  validFingerprint,
  validTranscriptionBody,
} from "../middleware";

const router = express.Router();

router.use(
  hasBearer,
  validFingerprint,
  validTranscriptionBody,
  identifyAndCacheAnonymous,
  hasEnoughTokens
);

router.post(
  "/",
  catchAsync(async (req: TranscribeRequest, res: Response) => {
    const fingerprint = req.context.fingerprint!;
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

      decreaseTokensByUUID(fingerprint, usedTokens);
      cachedUser.tokens -= usedTokens;

      updateUsageByUUID({
        uuid: fingerprint,
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
          transcribe: timeEnd,
        },
      });
    } else {
      updateUsageByUUID({
        uuid: fingerprint,
        usage: {
          tokens_used: whisperTokens,
          text: speech.text,
          audio_length: audio_duration,
          created_at: Date.now(),
        },
      });
      decreaseTokensByUUID(fingerprint, whisperTokens);
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
