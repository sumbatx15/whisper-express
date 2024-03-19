import mongoose from "mongoose";

type IUsage = {
  text: string;
  modeOutput?: string;
  audio?: number[];
  langCode?: string;
  mode?: {
    id?: string;
    model: string;
    name: string;
    input_tokens?: number;
    output_tokens?: number;
  };
  audio_length: number;
  created_at: number;
  tokens_used: number;
};

export type IUsageModel = {
  uuid?: string;
  google_account_id: string;
  usage: IUsage[];
};

const usageSchema = new mongoose.Schema<IUsageModel>({
  uuid: String,
  google_account_id: String,
  usage: [
    {
      text: String,
      modeOutput: String,
      audio: [Number],
      langCode: String,
      mode: {
        id: String,
        model: String,
        name: String,
        input_tokens: Number,
        output_tokens: Number,
      },
      audio_length: Number,
      created_at: Number,
      tokens_used: Number,
    },
  ],
});

export const Usage = (mongoose.models.Usage ||
  mongoose.model<IUsageModel>(
    "Usage",
    usageSchema
  )) as mongoose.Model<IUsageModel>;

export const updateUsage = async (usage: {
  google_account_id?: string;
  usage: IUsage;
}) => {
  await Usage.findOneAndUpdate(
    { google_account_id: usage.google_account_id },
    { $push: { usage: usage.usage } },
    { upsert: true }
  );
};
export const updateUsageByUUID = async (usage: {
  uuid: string;
  usage: IUsage;
}) => {
  await Usage.findOneAndUpdate(
    { uuid: usage.uuid },
    { $push: { usage: usage.usage } },
    { upsert: true }
  );
};
