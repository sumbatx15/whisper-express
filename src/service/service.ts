import axios from "axios";

import { GoogleTokenInfo, GoogleUserInfo } from "../shared/types";
import { IUser } from "../db/user";

export const getGoogleTokenInfo = async (access_token: string) => {
  console.log("fetching google token info");
  const response = await axios.post(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${access_token}`
  );
  return response.data as GoogleTokenInfo;
};

export const getGoogleUserInfo = async (access_token: string) => {
  const response = await axios.get(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
  );
  return response.data as GoogleUserInfo;
};

export const fetchAccountInfoByOTT = async (ott: string) => {
  const response = await axios.post("/api/get-payer-info", null, {
    headers: {
      Authorization: `Bearer ${ott}`,
    },
  });

  return response.data as {
    googleUserInfo: GoogleUserInfo;
    user: IUser;
  };
};
