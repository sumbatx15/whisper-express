import express, { Response } from "express";
import {
  calcGPTTokens,
  calcWhisperTokens,
  getDurationFromBuffer,
} from "../../config/tokens_system";
import { updateUsageByUUID } from "../../db/usage";
import { decreaseTokensByUUID } from "../../db/user";
import { GPT_MODELS } from "../../shared/consts";
import { upload } from "../../shared/multer";
import { TranscribeRequestV2 } from "../../shared/types";
import { correctWithGPTPrompt, transcribeAxios } from "../../utils/audio";
import catchAsync from "../../utils/catchAsync";
import { getCachedSessionUser } from "../../utils/session";
import {
  hasBearer,
  hasEnoughTokensV2,
  identifyAndCacheAnonymous,
  validFingerprint,
  validTranscriptionBlobBody,
} from "../middleware";

const router = express.Router();

router.use(
  hasBearer,
  validFingerprint,
  identifyAndCacheAnonymous,
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

    const fingerprint = req.context.fingerprint!;
    const cachedUser = getCachedSessionUser(req)!;
    const { body } = req;

    const audio_duration = getDurationFromBuffer(req.file.buffer);
    const whisperTokens = calcWhisperTokens(audio_duration);

    const time = Date.now();
    const speech = await transcribeAxios(req.file.buffer, body.lang);
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

      decreaseTokensByUUID(fingerprint, usedTokens);
      cachedUser.tokens -= usedTokens;

      updateUsageByUUID({
        uuid: fingerprint,
        usage: {
          tokens_used: usedTokens,
          text: speech.text,
          mode: {
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
