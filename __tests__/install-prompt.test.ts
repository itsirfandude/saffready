import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getInstallPlatform, INSTALL_DISMISSED_KEY, InstallPromptController, type InstallState } from "@/src/lib/install-prompt";
import { InstallAppSettings } from "@/components/InstallAppSettings";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

class FakeTarget {
  private listeners = new Map<string, Set<EventListener>>();
  addEventListener(type: string, listener: EventListener) {
    const set = this.listeners.get(type) ?? new Set<EventListener>();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: EventListener) { this.listeners.get(type)?.delete(listener); }
  dispatch(event: Event) { for (const listener of this.listeners.get(event.type) ?? []) listener(event); }
}

function promptEvent(outcome: "accepted" | "dismissed", calls: { prompt: number }) {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.assign(event, {
    prompt: async () => { calls.prompt += 1; },
    userChoice: Promise.resolve({ outcome }),
  });
  return event;
}

describe("install prompt lifecycle", () => {
  it("captures the browser prompt and only opens it after an explicit install action", async () => {
    const target = new FakeTarget();
    const storage = new MemoryStorage();
    const states: InstallState[] = [];
    const controller = new InstallPromptController(target, storage, (state) => states.push(state));
    const unmount = controller.mount();
    const calls = { prompt: 0 };
    const event = promptEvent("accepted", calls);
    target.dispatch(event);
    expect(event.defaultPrevented).toBe(true);
    expect(states[states.length - 1]).toBe("available");
    expect(calls.prompt).toBe(0);
    await controller.install();
    expect(calls.prompt).toBe(1);
    expect(states[states.length - 1]).toBe("accepted");
    unmount();
  });

  it("remembers dismissal and does not offer the deferred prompt again", async () => {
    const target = new FakeTarget();
    const storage = new MemoryStorage();
    const states: InstallState[] = [];
    const controller = new InstallPromptController(target, storage, (state) => states.push(state));
    controller.mount();
    const calls = { prompt: 0 };
    target.dispatch(promptEvent("dismissed", calls));
    await controller.install();
    expect(states[states.length - 1]).toBe("dismissed");
    expect(storage.getItem(INSTALL_DISMISSED_KEY)).toBe("true");

    const laterStates: InstallState[] = [];
    const later = new InstallPromptController(target, storage, (state) => laterStates.push(state));
    later.mount();
    target.dispatch(promptEvent("accepted", calls));
    await later.install();
    expect(laterStates[laterStates.length - 1]).toBe("dismissed");
    expect(calls.prompt).toBe(1);
  });

  it("detects installed apps and the iOS Safari installation path", () => {
    expect(getInstallPlatform("iPhone Safari", false)).toBe("ios-safari");
    expect(getInstallPlatform("iPhone CriOS", false)).toBe("ios-other");
    expect(getInstallPlatform("Mozilla/5.0 Macintosh", false, true)).toBe("ios-safari");
    expect(getInstallPlatform("Android Chrome", true)).toBe("installed");
    expect(getInstallPlatform("Android Chrome", false)).toBe("android-chrome");
    expect(getInstallPlatform("Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36", false)).toBe("android-chrome");
    expect(getInstallPlatform("Mozilla/5.0 (Linux; Android 14) Brave Chrome/130 Mobile Safari/537.36", false)).toBe("android-brave");
    const target = new FakeTarget();
    const states: InstallState[] = [];
    const controller = new InstallPromptController(target, new MemoryStorage(), (state) => states.push(state));
    controller.mount();
    target.dispatch(new Event("appinstalled"));
    expect(states[states.length - 1]).toBe("installed");
  });

  it("renders iOS install guidance in settings", async () => {
    const source = await readInstallSettings();
    expect(source).toContain("In Safari, tap Share, then choose Add to Home Screen.");
    expect(source).toContain("Open SaffReady in Safari, then tap Share → Add to Home Screen.");
  });

  it("keeps the Settings install entry visible before beforeinstallprompt fires", () => {
    const markup = renderToStaticMarkup(createElement(InstallAppSettings));
    expect(markup).toContain('aria-labelledby="install-app-heading"');
    expect(markup).toContain('id="install-app-heading"');
    expect(markup).toContain("செயலியை நிறுவு");
    expect(markup).toContain('role="note"');
    expect(markup).toContain("SaffReady-ஐ");
  });
});

async function readInstallSettings() {
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  return readFileSync(resolve(process.cwd(), "components/InstallAppSettings.tsx"), "utf8");
}
