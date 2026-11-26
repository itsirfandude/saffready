"use client";

import { useEffect, useState } from "react";
import { getInstallPlatform, InstallPromptController, type InstallState } from "@/src/lib/install-prompt";
import { usePreferences } from "@/components/PreferencesProvider";

export function InstallAppSettings() {
  const { language } = usePreferences();
  const ta = language === "ta";
  const [state, setState] = useState<InstallState>("unavailable");
  const [platform, setPlatform] = useState<"installed" | "ios-safari" | "ios-other" | "other">("other");
  const [controller, setController] = useState<InstallPromptController | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setPlatform(getInstallPlatform(navigator.userAgent, standalone));
    const promptController = new InstallPromptController(window, window.localStorage, setState, standalone);
    setController(promptController);
    return promptController.mount();
  }, []);

  return <section className="mt-7" aria-labelledby="install-app-heading">
    <h3 id="install-app-heading" className="mb-2 font-semibold">{ta ? "செயலியை நிறுவு" : "Install app"}</h3>
    {platform === "ios-safari" ? <p className="text-sm leading-6 text-[var(--text-muted)]" role="note">
      {ta ? "Safari-யில் பகிர் பொத்தானைத் தட்டி, ‘முகப்புத் திரையில் சேர்’ என்பதைத் தேர்ந்தெடுக்கவும்." : "In Safari, tap Share, then choose Add to Home Screen."}
    </p> : platform === "ios-other" ? <p className="text-sm leading-6 text-[var(--text-muted)]" role="note">
      {ta ? "SaffReady-ஐ Safari-யில் திறந்து, பகிர் → முகப்புத் திரையில் சேர் என்பதைத் தேர்ந்தெடுக்கவும்." : "Open SaffReady in Safari, then tap Share → Add to Home Screen."}
    </p> : state === "installed" || platform === "installed" ? <p className="text-sm text-[var(--text-muted)]" role="status">{ta ? "SaffReady நிறுவப்பட்டுள்ளது." : "SaffReady is installed."}</p>
      : state === "available" || state === "prompting" ? <button type="button" disabled={state === "prompting"} onClick={() => void controller?.install()} className="min-h-11 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--bg)] disabled:opacity-60">
        {state === "prompting" ? (ta ? "திறக்கிறது…" : "Opening…") : (ta ? "செயலியை நிறுவு" : "Install App")}
      </button>
      : <p className="text-sm leading-6 text-[var(--text-muted)]" role="status">
        {state === "dismissed"
          ? (ta ? "நீங்கள் பின்னர் உலாவி பட்டியிலிருந்து நிறுவலாம்." : "You can install later from your browser menu.")
          : state === "accepted"
            ? (ta ? "நிறுவலை முடிக்க உலாவியின் வழிமுறைகளைப் பின்பற்றவும்." : "Follow your browser’s instructions to finish installing.")
            : (ta ? "இந்த உலாவியில் நிறுவும் வசதி கிடைக்கும்போது இங்கே தோன்றும். நிறுவாமல் தொடர்ந்து பயன்படுத்தலாம்." : "An install option will appear here when this browser makes it available. SaffReady works without installing.")}
      </p>}
  </section>;
}
