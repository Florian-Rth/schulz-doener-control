import { ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectInstallPlatform } from "@/lib/push";
import { canPromptInstall } from "@/lib/pwa/install-prompt";
import { theme } from "@/styles/theme";
import { InstallGuide } from "./InstallGuide";

// The guide picks its steps from the detected platform and shows the one-tap CTA only when the
// browser captured an install prompt — both are stubbed here so the copy/CTA logic is exercised
// without real device sniffing.
vi.mock("@/lib/push", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/push")>();
  return { ...actual, detectInstallPlatform: vi.fn(() => "ios") };
});

vi.mock("@/lib/pwa/install-prompt", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pwa/install-prompt")>();
  return {
    ...actual,
    canPromptInstall: vi.fn(() => false),
    subscribeInstallPrompt: vi.fn(() => () => {}),
  };
});

const renderGuide = (): ReturnType<typeof render> =>
  render(
    <ThemeProvider theme={theme}>
      <InstallGuide />
    </ThemeProvider>,
  );

describe("InstallGuide", () => {
  beforeEach(() => {
    vi.mocked(detectInstallPlatform).mockReturnValue("ios");
    vi.mocked(canPromptInstall).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("zeigt die iOS-Schritte inklusive „Zum Home-Bildschirm“", () => {
    vi.mocked(detectInstallPlatform).mockReturnValue("ios");
    const { getByText } = renderGuide();

    expect(getByText("So installierst du die App")).toBeInTheDocument();
    expect(getByText("iPhone / iPad · Safari")).toBeInTheDocument();
    expect(getByText(/Zum Home-Bildschirm/)).toBeInTheDocument();
  });

  it("zeigt die Android-Schritte mit „App installieren“", () => {
    vi.mocked(detectInstallPlatform).mockReturnValue("android");
    const { getByText } = renderGuide();

    expect(getByText("Android · Chrome")).toBeInTheDocument();
    expect(getByText(/App installieren/)).toBeInTheDocument();
  });

  it("zeigt die Desktop-Schritte samt Firefox/Safari-Hinweis", () => {
    vi.mocked(detectInstallPlatform).mockReturnValue("desktop");
    const { getByText } = renderGuide();

    expect(getByText("Desktop · Chrome / Edge")).toBeInTheDocument();
    expect(getByText(/Firefox und Safari am Desktop/)).toBeInTheDocument();
  });

  it("zeigt den Ein-Klick-Install-Button nur, wenn ein Prompt vorliegt", () => {
    vi.mocked(detectInstallPlatform).mockReturnValue("android");
    vi.mocked(canPromptInstall).mockReturnValue(true);
    const { getByRole } = renderGuide();

    expect(getByRole("button", { name: "Jetzt installieren" })).toBeInTheDocument();
  });
});
