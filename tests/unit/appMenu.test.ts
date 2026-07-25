import { describe, expect, it, vi } from "vitest";
import { APP_COPYRIGHT, buildApplicationMenuTemplate } from "../../src/main/appMenu";

describe("packaged application menu", () => {
  it("keeps only File, Window and Info top-level menus", () => {
    const template = buildApplicationMenuTemplate({
      getFocusedWindow: () => null,
      platform: "darwin",
      quit: vi.fn(),
      showInfo: vi.fn(),
    });

    expect(template.map((item) => item.label)).toEqual(["File", "Window", "Info"]);
    expect(template[0].submenu).toMatchObject([{ label: "Quit", accelerator: "CmdOrCtrl+Q" }]);
    expect(template[2].submenu).toMatchObject([{ label: "Info" }]);
    expect(APP_COPYRIGHT).toBe("Copyright © 2026 Gloutchov");
  });

  it("wires Quit to the full application quit action", () => {
    const quit = vi.fn();
    const template = buildApplicationMenuTemplate({
      getFocusedWindow: () => null,
      platform: "win32",
      quit,
      showInfo: vi.fn(),
    });

    const quitItem = Array.isArray(template[0].submenu) ? template[0].submenu[0] : undefined;
    expect(quitItem?.label).toBe("Quit");
    quitItem?.click?.({} as never, undefined as never, undefined as never);
    expect(quit).toHaveBeenCalledOnce();
  });

  it("controls the focused window without creating new windows", () => {
    const window = {
      isFullScreen: vi.fn(() => false),
      isMaximized: vi.fn(() => false),
      maximize: vi.fn(),
      minimize: vi.fn(),
      setFullScreen: vi.fn(),
      unmaximize: vi.fn(),
    };
    const template = buildApplicationMenuTemplate({
      getFocusedWindow: () => window,
      platform: "win32",
      quit: vi.fn(),
      showInfo: vi.fn(),
    });
    const windowMenu = Array.isArray(template[1].submenu) ? template[1].submenu : [];

    windowMenu[0]?.click?.({} as never, undefined as never, undefined as never);
    windowMenu[1]?.click?.({} as never, undefined as never, undefined as never);
    windowMenu[2]?.click?.({} as never, undefined as never, undefined as never);

    expect(window.minimize).toHaveBeenCalledOnce();
    expect(window.maximize).toHaveBeenCalledOnce();
    expect(window.unmaximize).not.toHaveBeenCalled();
    expect(window.setFullScreen).toHaveBeenCalledWith(true);
  });
});
