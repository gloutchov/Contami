import type { BrowserWindow, MenuItemConstructorOptions } from "electron";

export const APP_COPYRIGHT = "Copyright © 2026 Gloutchov";

type WindowControls = Pick<BrowserWindow, "isFullScreen" | "isMaximized" | "maximize" | "minimize" | "setFullScreen" | "unmaximize">;

export type AppMenuActions = {
  getFocusedWindow: () => WindowControls | null;
  platform: NodeJS.Platform;
  quit: () => void;
  showInfo: () => void;
};

export function buildApplicationMenuTemplate({
  getFocusedWindow,
  platform,
  quit,
  showInfo,
}: AppMenuActions): MenuItemConstructorOptions[] {
  const fullscreenAccelerator = platform === "darwin" ? "Ctrl+Command+F" : "F11";

  return [
    {
      label: "File",
      submenu: [
        {
          accelerator: "CmdOrCtrl+Q",
          click: quit,
          label: "Quit",
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        {
          accelerator: "CmdOrCtrl+M",
          click: () => getFocusedWindow()?.minimize(),
          label: "Minimize",
        },
        {
          click: () => {
            const window = getFocusedWindow();
            if (!window) return;
            if (window.isMaximized()) window.unmaximize();
            else window.maximize();
          },
          label: "Zoom",
        },
        {
          accelerator: fullscreenAccelerator,
          click: () => {
            const window = getFocusedWindow();
            if (!window) return;
            window.setFullScreen(!window.isFullScreen());
          },
          label: "Toggle Full Screen",
        },
      ],
    },
    {
      label: "Info",
      submenu: [
        {
          click: showInfo,
          label: "Info",
        },
      ],
    },
  ];
}
