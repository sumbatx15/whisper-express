import { Request } from "express";
import { z } from "zod";

export type ModeOptions = {
  id?: string;
  name: string;
  instructions: string;
  model: string;
};

export type TranscribeOptions = {
  lang?: string;
  mode?: ModeOptions;
};

export type TranscribeRequest = Request<
  {},
  {},
  { buffer: number[]; prompt?: string } & TranscribeOptions
>;

export const transcriptionBodySchema = z.object({
  buffer: z.array(z.number()),
  lang: z.string().optional(),
  mode: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      instructions: z.string(),
      model: z.string(),
    })
    .optional(),
});

export type GoogleTokenInfo = {
  azp: string;
  aud: string;
  sub: string;
  scope: string;
  exp: number;
  expires_in: string;
  email: string;
  email_verified: string;
  access_type: string;
};

export type GoogleUserInfo = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
};
