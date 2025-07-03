import { useState, useCallback } from "react";
import { IpcClient } from "@/ipc/ipc_client";
import {
  appOutputAtom,
  appUrlAtom,
  currentAppAtom,
  previewPanelKeyAtom,
  previewErrorMessageAtom,
  selectedAppIdAtom,
} from "@/atoms/appAtoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { AppOutput } from "@/ipc/ipc_types";

export function useRunApp() {
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useAtom(currentAppAtom);
  const setAppOutput = useSetAtom(appOutputAtom);
  const [appUrlObj, setAppUrlObj] = useAtom(appUrlAtom);
  const setPreviewPanelKey = useSetAtom(previewPanelKeyAtom);
  const appId = useAtomValue(selectedAppIdAtom);
  const setPreviewErrorMessage = useSetAtom(previewErrorMessageAtom);

  const processProxyServerOutput = (output: AppOutput) => {
    const matchesProxyServerStart = output.message.includes(
      "[dyad-proxy-server]started=[",
    );
    if (matchesProxyServerStart) {
      // Extract both proxy URL and original URL using regex
      const proxyUrlMatch = output.message.match(
        /\[dyad-proxy-server\]started=\[(.*?)\]/,
      );
      const originalUrlMatch = output.message.match(/original=\[(.*?)\]/);

      if (proxyUrlMatch && proxyUrlMatch[1]) {
        const proxyUrl = proxyUrlMatch[1];
        const originalUrl = originalUrlMatch && originalUrlMatch[1];
        setAppUrlObj({
          appUrl: proxyUrl,
          appId: appId!,
          originalUrl: originalUrl!,
        });
      }
    }
  };
  const runApp = useCallback(async (appId: number) => {
    setLoading(true);
    try {
      const ipcClient = IpcClient.getInstance();
      console.debug("Running app", appId);

      // Clear the URL and add restart message
      if (appUrlObj?.appId !== appId) {
        setAppUrlObj({ appUrl: null, appId: null, originalUrl: null });
      }
      setAppOutput((prev) => [
        ...prev,
        {
          message: "Trying to restart app...",
          type: "stdout",
          appId,
          timestamp: Date.now(),
        },
      ]);
      const app = await ipcClient.getApp(appId);
      setApp(app);
      await ipcClient.runApp(appId, (output) => {
        setAppOutput((prev) => [...prev, output]);
        processProxyServerOutput(output);
      });
      setPreviewErrorMessage(undefined);
    } catch (error) {
      console.error(`Error running app ${appId}:`, error);
      setPreviewErrorMessage(
        error instanceof Error ? error.message : error?.toString(),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const stopApp = useCallback(async (appId: number) => {
    if (appId === null) {
      return;
    }

    setLoading(true);
    try {
      const ipcClient = IpcClient.getInstance();
      await ipcClient.stopApp(appId);

      setPreviewErrorMessage(undefined);
    } catch (error) {
      console.error(`Error stopping app ${appId}:`, error);
      setPreviewErrorMessage(
        error instanceof Error ? error.message : error?.toString(),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onHotModuleReload = useCallback(() => {
    setPreviewPanelKey((prevKey) => prevKey + 1);
  }, [setPreviewPanelKey]);

  const restartApp = useCallback(
    async ({
      removeNodeModules = false,
    }: { removeNodeModules?: boolean } = {}) => {
      if (appId === null) {
        return;
      }
      setLoading(true);
      try {
        const ipcClient = IpcClient.getInstance();
        console.debug(
          "Restarting app",
          appId,
          removeNodeModules ? "with node_modules cleanup" : "",
        );

        // Clear the URL and add restart message
        setAppUrlObj({ appUrl: null, appId: null, originalUrl: null });
        setAppOutput((prev) => [
          ...prev,
          {
            message: "Restarting app...",
            type: "stdout",
            appId,
            timestamp: Date.now(),
          },
        ]);

        const app = await ipcClient.getApp(appId);
        setApp(app);
        await ipcClient.restartApp(
          appId,
          (output) => {
            setAppOutput((prev) => [...prev, output]);
            if (
              output.message.includes("hmr update") &&
              output.message.includes("[vite]")
            ) {
              onHotModuleReload();
              return;
            }
            processProxyServerOutput(output);
          },
          removeNodeModules,
        );
      } catch (error) {
        console.error(`Error restarting app ${appId}:`, error);
        setPreviewErrorMessage(
          error instanceof Error ? error.message : error?.toString(),
        );
      } finally {
        setPreviewPanelKey((prevKey) => prevKey + 1);
        setLoading(false);
      }
    },
    [appId, setApp, setAppOutput, setAppUrlObj, setPreviewPanelKey],
  );

  const refreshAppIframe = useCallback(async () => {
    setPreviewPanelKey((prevKey) => prevKey + 1);
  }, [setPreviewPanelKey]);

  return {
    loading,
    runApp,
    stopApp,
    restartApp,
    app,
    refreshAppIframe,
  };
}
