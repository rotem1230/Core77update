import React from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { ProviderSettingsPage } from "@/components/settings/ProviderSettingsPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface ProviderSettingsParams {
  provider: string;
}

export const providerSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/providers/$provider",
  params: {
    parse: (params: { provider: string }): ProviderSettingsParams => ({
      provider: params.provider,
    }),
  },
  component: function ProviderSettingsRouteComponent() {
    const { provider } = providerSettingsRoute.useParams();

    return (
      <ProtectedRoute>
        <ProviderSettingsPage provider={provider} />
      </ProtectedRoute>
    );
  },
});
