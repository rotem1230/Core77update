import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import AppDetailsPage from "../pages/app-details";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { z } from "zod";

export const appDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app-details",
  component: () => (
    <ProtectedRoute>
      <AppDetailsPage />
    </ProtectedRoute>
  ),
  validateSearch: z.object({
    appId: z.number(),
  }),
});
