import { useAtom } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useRouter } from "@tanstack/react-router";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
// @ts-ignore
import logo from "../../assets/logo_transparent.png";
import { providerSettingsRoute } from "@/routes/settings/providers/$provider";
import { cn } from "@/lib/utils";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { useEffect, useState } from "react";
import { Core77ProSuccessDialog } from "@/components/DyadProSuccessDialog";
import { useTheme } from "@/contexts/ThemeContext";
import { IpcClient } from "@/ipc/ipc_client";
import { useUserBudgetInfo } from "@/hooks/useUserBudgetInfo";
import { UserBudgetInfo } from "@/ipc/ipc_types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export const TitleBar = () => {
  const [selectedAppId] = useAtom(selectedAppIdAtom);
  const { apps } = useLoadApps();
  const { navigate } = useRouter();
  const { settings, refreshSettings } = useSettings();
  const [showCore77ProSuccessDialog, setShowCore77ProSuccessDialog] = useState(false);
  const [showWindowControls, setShowWindowControls] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if we're running on Windows
    const checkPlatform = async () => {
      try {
        const platform = await IpcClient.getInstance().getSystemPlatform();
        setShowWindowControls(platform !== "darwin");
      } catch (error) {
        console.error("Failed to get platform info:", error);
      }
    };

    checkPlatform();
  }, []);

  const { lastDeepLink } = useDeepLink();
  useEffect(() => {
      if (lastDeepLink?.type === "core77-pro-return") {
      setShowCore77ProSuccessDialog(true);
      }
  }, [lastDeepLink]);

  // Get selected app name
  const selectedApp = apps.find((app) => app.id === selectedAppId);
  const displayText = selectedApp
    ? selectedApp.name
    : "(no app selected)";

  const handleAppClick = () => {
    if (selectedApp) {
      navigate({ to: "/app-details", search: { appId: selectedApp.id } });
    }
  };

  const isCore77Pro = !!settings?.providerSettings?.auto?.apiKey?.value;
  const isCore77ProEnabled = Boolean(settings?.enableCore77Pro);

  return (
    <>
      <div className="@container z-11 w-full h-11 bg-(--sidebar) absolute top-0 left-0 app-region-drag flex items-center">
        <div className="pl-20"></div>
        <img src={logo} alt="Core77 Logo" className="w-6 h-6 mr-2" />
        <Button
          data-testid="title-bar-app-name-button"
          variant="outline"
          size="sm"
          className={`hidden @md:block no-app-region-drag text-sm font-medium ${
            selectedApp ? "cursor-pointer" : ""
          }`}
          onClick={handleAppClick}
        >
          {displayText}
        </Button>
        {isCore77Pro && <Core77ProButton isCore77ProEnabled={isCore77ProEnabled} />}
        <div className="ml-auto flex items-center space-x-2 no-app-region-drag">
          {user && <UserMenu />}
        {showWindowControls && <WindowsControls />}
        </div>
      </div>

              <Core77ProSuccessDialog
        isOpen={showCore77ProSuccessDialog}
        onClose={() => setShowCore77ProSuccessDialog(false)}
      />
    </>
  );
};

function WindowsControls() {
  const { isDarkMode } = useTheme();
  const ipcClient = IpcClient.getInstance();

  const minimizeWindow = () => {
    ipcClient.minimizeWindow();
  };

  const maximizeWindow = () => {
    ipcClient.maximizeWindow();
  };

  const closeWindow = () => {
    ipcClient.closeWindow();
  };

  return (
    <div className="flex no-app-region-drag">
      <button
        className="w-12 h-11 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={minimizeWindow}
        aria-label="Minimize"
      >
        <svg
          width="12"
          height="1"
          viewBox="0 0 12 1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="12"
            height="1"
            fill={isDarkMode ? "#ffffff" : "#000000"}
          />
        </svg>
      </button>
      <button
        className="w-12 h-11 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={maximizeWindow}
        aria-label="Maximize"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0.5"
            y="0.5"
            width="11"
            height="11"
            stroke={isDarkMode ? "#ffffff" : "#000000"}
          />
        </svg>
      </button>
      <button
        className="w-12 h-11 flex items-center justify-center hover:bg-red-500 transition-colors"
        onClick={closeWindow}
        aria-label="Close"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L11 11M1 11L11 1"
            stroke={isDarkMode ? "#ffffff" : "#000000"}
            strokeWidth="1.5"
          />
        </svg>
      </button>
    </div>
  );
}

export function Core77ProButton({
  isCore77ProEnabled,
}: {
  isCore77ProEnabled: boolean;
}) {
  const { navigate } = useRouter();
  const { userBudget } = useUserBudgetInfo();
  return (
    <div
      className="flex items-center gap-2"
      data-testid="title-bar-core77-pro-button"
    >
      <Badge
        variant="secondary"
      className={cn(
          "text-xs",
          isCore77ProEnabled
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
          !isCore77ProEnabled && "bg-zinc-600 dark:bg-zinc-600",
      )}
    >
        {isCore77ProEnabled ? "Core77 Pro" : "Core77 Pro (disabled)"}
      </Badge>
      {userBudget && <AICreditStatus userBudget={userBudget} />}
    </div>
  );
}

export function AICreditStatus({ userBudget }: { userBudget: UserBudgetInfo }) {
  const remaining = Math.round(
    userBudget.totalCredits - userBudget.usedCredits,
  );
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="text-xs mt-0.5">{remaining} credits left</div>
      </TooltipTrigger>
      <TooltipContent>
        <div>
          <p>
            You have used {Math.round(userBudget.usedCredits)} credits out of{" "}
            {userBudget.totalCredits}.
          </p>
          <p>
            Your budget resets on{" "}
            {userBudget.budgetResetDate.toLocaleDateString()}
          </p>
          <p>Note: there is a slight delay in updating the credit status.</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
