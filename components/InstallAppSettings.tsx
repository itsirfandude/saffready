"use client";

import { useEffect, useState } from "react";
import { getInstallPlatform, InstallPromptController, type InstallPlatform, type InstallState } from "@/src/lib/install-prompt";
import { usePreferences } from "@/components/PreferencesProvider";

export function InstallAppSettings() {
  const { language } = usePreferences();
  const ta = language === "ta";
  const [state, setState] = useState<InstallState>("unavailable");
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const [controller, setController] = useState<InstallPromptController | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const isIPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const detectedPlatform = getInstallPlatform(navigator.userAgent, standalone, isIPad);
    setPlatform(detectedPlatform);
    if (detectedPlatform === "android-chrome" || detectedPlatform === "android-other") {
      const braveNavigator = navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } };
      void braveNavigator.brave?.isBrave?.().then((isBrave) => {
        if (isBrave) setPlatform("android-brave");
      }).catch(() => {});
    }
    const promptController = new InstallPromptController(window, window.localStorage, setState, standalone);
    setController(promptController);
    return promptController.mount();
  }, []);

  const instructions = (() => {
    if (platform === "ios-safari") return ta
      ? "Safari-யில் பகிர் பொத்தானைத் தட்டி, ‘முகப்புத் திரையில் சேர்’ என்பதைத் தேர்ந்தெடுக்கவும்."
      : "In Safari, tap Share, then choose Add to Home Screen.";
    if (platform === "ios-other") return ta
      ? "SaffReady-ஐ Safari-யில் திறந்து, பகிர் → முகப்புத் திரையில் சேர் என்பதைத் தேர்ந்தெடுக்கவும்."
      : "Open SaffReady in Safari, then tap Share → Add to Home Screen.";
    if (platform === "android-chrome") return ta
      ? "Chrome-ல் ⋮ பட்டியைத் திறந்து ‘செயலியை நிறுவு’ என்பதைத் தேர்ந்தெடுக்கவும். அது இல்லாவிட்டால் ‘முகப்புத் திரையில் சேர்’ என்பதைப் பார்க்கவும்; அந்த விருப்பம் உலாவி குறுக்குவழியாக இருக்கலாம்."
      : "In Chrome, open ⋮ and choose Install app. If only Add to Home Screen is offered, it may create a browser shortcut rather than an installed app.";
    if (platform === "android-brave") return ta
      ? "Brave-ல் ⋮ பட்டியைத் திறந்து ‘முகப்புத் திரையில் சேர்’ அல்லது ‘நிறுவு’ என்பதைப் பார்க்கவும். Brave வழங்கும் விருப்பம் முகப்புத் திரை குறுக்குவழியாக இருக்கலாம்; இது native app நிறுவலை உறுதி செய்யாது."
      : "In Brave, open ⋮ and look for Add to Home Screen or Install. Brave may offer a home-screen shortcut; this does not guarantee native app installation.";
    if (platform === "android-other") return ta
      ? "உலாவி பட்டியைத் திறந்து ‘Install’ அல்லது ‘Add to Home Screen’ என்பதைப் பார்க்கவும். முகப்புத் திரை விருப்பம் குறுக்குவழியாக இருக்கலாம்."
      : "Open the browser menu and look for Install or Add to Home Screen. Add to Home Screen may create a shortcut rather than an installed app.";
    return ta
      ? "உலாவி பட்டியில் Install விருப்பம் இருந்தால் அதைப் பயன்படுத்தவும். இல்லையெனில் SaffReady-ஐ இந்த உலாவியில் தொடர்ந்து பயன்படுத்தலாம்."
      : "Use the browser’s Install option if it provides one. Otherwise, keep using SaffReady in this browser.";
  })();

  return <section className="mt-7" aria-labelledby="install-app-heading">
    <h3 id="install-app-heading" className="mb-2 font-semibold">{ta ? "செயலியை நிறுவு" : "Install app"}</h3>
    {state === "installed" || platform === "installed" ? <p className="text-sm text-[var(--text-muted)]" role="status">{ta ? "SaffReady நிறுவப்பட்டுள்ளது." : "SaffReady is installed and running as an app."}</p>
      : state === "available" || state === "prompting" ? <button type="button" disabled={state === "prompting"} onClick={() => void controller?.install()} className="min-h-11 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--bg)] disabled:opacity-60">
        {state === "prompting" ? (ta ? "திறக்கிறது…" : "Opening…") : (ta ? "செயலியை நிறுவு" : "Install App")}
      </button>
      : <p className="text-sm leading-6 text-[var(--text-muted)]" role={state === "accepted" ? "status" : "note"}>
        {state === "accepted" ? (ta ? "நிறுவலை முடிக்க உலாவியின் வழிமுறைகளைப் பின்பற்றவும்." : "Follow the browser’s instructions to finish installation.") : instructions}
      </p>}
  </section>;
}
