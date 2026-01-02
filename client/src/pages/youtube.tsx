import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/dashboard/Sidebar";
import YouTubeIntegration from "@/components/dashboard/YouTubeIntegration";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

export default function YouTubePage() {
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50" role="application">
      {!isMobile && <Sidebar />}

      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[18rem]">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4" role="banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                  className="md:hidden"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">YouTube</h2>
              <p className="text-gray-600">Connect your channel and manage YouTube features</p>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-6" role="main">
          <div className="max-w-6xl mx-auto space-y-6">
            <YouTubeIntegration />

            {/* Placeholder for future YouTube-specific tools to remain consistent with app cards */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">YouTube Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">More YouTube features are coming soon.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}


