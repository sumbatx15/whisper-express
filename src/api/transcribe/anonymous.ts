import express, { Request, Response } from "express";
import { decreaseTokensByUUID } from "../../db/user";
import { getCachedSessionUser } from "../../utils/session";
import {
  authAnonymous,
  hasBearer,
  hasEnoughTokens,
  hasValidBody,
} from "../middleware";
import { TranscribeRequest } from "../../shared/types";
import { bearer } from "../../utils/request";
import { toFile } from "openai";
import {
  correctWithGPTPrompt,
  normalArrayToBlob,
  transcribe,
} from "../../utils/audio";
import {
  calcGPTTokens,
  calcWhisperTokens,
  getDuration,
} from "../../config/tokens_system";
import { GPT_MODELS } from "../../shared/consts";
import { updateUsageByUUID } from "../../db/usage";

const router = express.Router();

router.use(hasBearer, hasValidBody, authAnonymous, hasEnoughTokens);

router.post("/", async (req: TranscribeRequest, res: Response) => {
  const fingerprint = bearer(req);
  const cachedUser = getCachedSessionUser(req)!;
  const { body } = req;

  const blob = normalArrayToBlob(body.buffer || []);
  const whisperTokens = calcWhisperTokens(blob);
  const audio_duration = getDuration(blob);

  const file = await toFile(blob, "audio.webm", {
    type: "audio/webm; codecs=opus",
  });

  const speech = await transcribe(file, {
    lang: body.lang,
  });

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
      },
    });
  }
});

export default router;
