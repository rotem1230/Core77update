import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import ChatPage from "../pages/chat";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { z } from "zod";

export const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  component: () => (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  ),
  validateSearch: z.object({
    appId: z.number().optional(),
  }),
});
