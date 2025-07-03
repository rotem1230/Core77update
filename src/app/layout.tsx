import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import { DeepLinkProvider } from "../contexts/DeepLinkContext";
import { Toaster } from "sonner";
import { TitleBar } from "./TitleBar";
import { useAuth } from "../contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  return (
    <>
      <ThemeProvider>
        <DeepLinkProvider>
          {!loading && user ? (
            // משתמש מחובר - הצג עם sidebar
            <SidebarProvider>
              <TitleBar />
              <AppSidebar />
              <div className="flex h-screenish w-full overflow-x-hidden mt-12 mb-4 mr-4 border-t border-l border-border rounded-lg bg-background">
                {children}
              </div>
              <Toaster richColors />
            </SidebarProvider>
          ) : (
            // משתמש לא מחובר או עדיין טוען - הצג ללא sidebar
            <>
              <TitleBar />
              <div className="h-screen w-full bg-background mt-12">
                {children}
              </div>
              <Toaster richColors />
            </>
          )}
        </DeepLinkProvider>
      </ThemeProvider>
    </>
  );
}
