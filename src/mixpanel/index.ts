import MixpanelSDK from "mixpanel";

const mixpanel = MixpanelSDK.init("d12b44d5ee02796904ef90b94b475111");

export const Mixpanel = {
  "Signed in": (email: string, fingerprint: string) => {
    mixpanel.track("Signed in", { email, distinct_id: fingerprint });
  },
  "Anonymous created": (fingerprint: string) => {
    mixpanel.track("Anonymous created", {
      distinct_id: fingerprint,
    });
  },
  uninstall: (fingerprint: string | null) => {
    mixpanel.track("Uninstall", {
      ...(fingerprint && { distinct_id: fingerprint }),
    });
  },
};
