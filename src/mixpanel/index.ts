import MixpanelSDK from "mixpanel";

const mixpanel = MixpanelSDK.init("d12b44d5ee02796904ef90b94b475111");

export const Mixpanel = {
  "Signed in": (email: string, fingerprint: string) => {
    mixpanel.track("Signed in", { email, distinct_id: fingerprint });
  },
  "User created": (email: string, fingerprint: string) => {
    mixpanel.track("User created", { email, distinct_id: fingerprint });
  },
  "Anonymous created": (fingerprint: string) => {
    mixpanel.track("Anonymous created", {
      distinct_id: fingerprint,
    });
  },
  uninstall: (
    fingerprint?: string,
    google_account_id?: string,
    version?: string
  ) => {
    if (google_account_id) {
      return mixpanel.track("Uninstall", {
        distinct_id: google_account_id,
        ext_version: version,
      });
    }
    mixpanel.track("Uninstall", {
      ...(fingerprint && { distinct_id: `$device:${fingerprint}` }),
      ext_version: version,
    });
  },
};
