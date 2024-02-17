declare namespace Express {
  export interface Request {
    context: {
      fingerprint?: string;
      tokenInfo?: {
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
      blob?: Blob;
      googleAccessToken?: string;
    };
  }
}
