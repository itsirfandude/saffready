export type InstallState = "unavailable" | "available" | "prompting" | "accepted" | "dismissed" | "installed";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

export interface InstallEventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface InstallStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const INSTALL_DISMISSED_KEY = "saffready-install-dismissed";

export class InstallPromptController {
  private deferred: InstallPromptEvent | null = null;
  private state: InstallState;
  private readonly onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    if (this.state === "dismissed" || this.state === "installed") return;
    this.deferred = event as InstallPromptEvent;
    this.update("available");
  };
  private readonly onAppInstalled = () => {
    this.deferred = null;
    this.storage.removeItem(INSTALL_DISMISSED_KEY);
    this.update("installed");
  };

  constructor(
    private readonly target: InstallEventTarget,
    private readonly storage: InstallStorage,
    private readonly onChange: (state: InstallState) => void,
    alreadyInstalled = false,
  ) {
    this.state = alreadyInstalled ? "installed" : storage.getItem(INSTALL_DISMISSED_KEY) === "true" ? "dismissed" : "unavailable";
    this.onChange(this.state);
  }

  mount() {
    this.target.addEventListener("beforeinstallprompt", this.onBeforeInstallPrompt);
    this.target.addEventListener("appinstalled", this.onAppInstalled);
    return () => {
      this.target.removeEventListener("beforeinstallprompt", this.onBeforeInstallPrompt);
      this.target.removeEventListener("appinstalled", this.onAppInstalled);
    };
  }

  async install() {
    if (!this.deferred || this.state !== "available") return;
    const prompt = this.deferred;
    this.update("prompting");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      this.deferred = null;
      if (choice.outcome === "dismissed") {
        this.storage.setItem(INSTALL_DISMISSED_KEY, "true");
        this.update("dismissed");
      } else {
        this.update("accepted");
      }
    } catch {
      this.update("unavailable");
    }
  }

  private update(state: InstallState) {
    this.state = state;
    this.onChange(state);
  }
}

export type InstallPlatform = "installed" | "ios-safari" | "ios-other" | "android-brave" | "android-chrome" | "android-other" | "other";

export function getInstallPlatform(userAgent: string, standalone: boolean, isIPad = false): InstallPlatform {
  if (standalone) return "installed";
  if (/iPad|iPhone|iPod/i.test(userAgent) || isIPad) {
    return /CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent) ? "ios-other" : "ios-safari";
  }
  if (/Android/i.test(userAgent)) {
    if (/Brave/i.test(userAgent)) return "android-brave";
    return /Chrome/i.test(userAgent) ? "android-chrome" : "android-other";
  }
  return "other";
}
