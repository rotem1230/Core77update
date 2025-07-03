import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import SettingsPage from "../pages/settings";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  ),
});
