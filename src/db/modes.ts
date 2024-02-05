/* eslint-disable sonarjs/no-duplicate-string */
import mongoose from 'mongoose';

export const GPT_MODELS = ['gpt-4-1106-preview', 'gpt-3.5-turbo-1106'] as const;

export const defaultModes: IMode[] = [
  {
    name: 'Correct grammar',
    instructions: 'Correct any grammatical errors',
    description: 'Automatically Correct grammatical errors',
    icon: {
      name: 'Autobrightness',
      color: '#38A169',
      pack: 'sax',
    },
    model: 'gpt-3.5-turbo-1106',
  },
  {
    name: 'Translate to English',
    instructions:
      'Translate the following text into English. Ensure that the translation captures the essence of any slang, cultural nuances, and contextual subtleties. Aim for a natural and fluent English expression, maintaining consistency in tense and style. Adjust phrases as needed to sound idiomatic in English, while preserving the original meaning and sentiment of the text',
    description: 'Translate your speech to English',
    icon: {
      name: 'Translate',
      color: '#519DE3',
      pack: 'sax',
    },
    model: 'gpt-4-1106-preview',
  },
];

export type IMode = {
  name: string;
  instructions: string;
  description?: string;
  hidden?: boolean;
  icon: {
    name: string;
    color: string;
    pack: 'sax' | 'feather';
  };
  model: (typeof GPT_MODELS)[number];
};

const modeSchema = new mongoose.Schema<IMode>({
  name: String,
  instructions: String,
  description: String,
  hidden: Boolean,
  icon: {
    name: String,
    color: String,
    pack: String,
  },
  model: String,
});

type IUserModes = {
  google_account_id: string;
  modes: IMode[];
};

const userModesSchema = new mongoose.Schema<IUserModes>({
  google_account_id: String,
  modes: [modeSchema],
});

const UserModes = (mongoose.models.UserModes ||
  mongoose.model<IUserModes>(
    'UserModes',
    userModesSchema
  )) as mongoose.Model<IUserModes>;

export const addDefaultModesToUser = async (google_account_id: string) => {
  const user = await UserModes.findOne({ google_account_id });
  if (user?.modes) return null;

  return UserModes.create({
    google_account_id,
    modes: defaultModes,
  });
};

export const getModes = async (google_account_id: string) => {
  const user = await UserModes.findOne({ google_account_id });
  if (!user) {
    throw new Error('User not found');
  }
  return user?.modes;
};

export const addMode = async (google_account_id: string, mode: IMode) => {
  const user = await UserModes.findOne({ google_account_id });
  if (!user) {
    throw new Error('User not found');
  }
  user.modes.push(mode);
  await user.save();
  return user.modes;
};

export const updateMode = async (
  google_account_id: string,
  id: string,
  mode: Partial<IMode>
) => {
  const user = await UserModes.findOne({ google_account_id });
  if (!user) {
    throw new Error('User not found');
  }

  // @ts-expect-error _id is not typed
  const index = user.modes.findIndex((m) => m._id.toString() === id);
  if (index === -1) {
    throw new Error('Mode not found');
  }

  console.log('mode:', mode);
  user.modes[index] = { ...user.modes[index], ...mode };
  await user.save();
  return user.modes;
};

export const deleteMode = async (google_account_id: string, id: string) => {
  const user = await UserModes.findOne({ google_account_id });
  if (!user) {
    throw new Error('User not found');
  }
  // @ts-expect-error _id is not typed
  const index = user.modes.findIndex((m) => m._id.toString() === id);
  if (index === -1) {
    throw new Error('Mode not found');
  }

  user.modes.splice(index, 1);
  await user.save();
  return user.modes;
};
