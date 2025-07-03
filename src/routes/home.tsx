import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import HomePage from "../pages/home";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { z } from "zod";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  ),
  validateSearch: z.object({
    appId: z.number().optional(),
  }),
});
