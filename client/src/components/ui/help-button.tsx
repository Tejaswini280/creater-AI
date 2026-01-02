import { useMemo, useState } from "react";
import { 
  HelpCircle, 
  BookOpenText, 
  MessageCircleQuestion, 
  FileCode2, 
  PlaySquare,
  Search as SearchIcon,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const [docsSearch, setDocsSearch] = useState("");
  const [tutorialLevel, setTutorialLevel] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");

  const popularGuides = useMemo(
    () => [
      { title: "Getting Started with CreatorAI", href: "/docs/getting-started" },
      { title: "Scheduling Your First Post", href: "/docs/scheduler" },
      { title: "Connecting Social Accounts", href: "/docs/integrations" },
      { title: "Using the AI Generator", href: "/docs/ai-generator" },
    ],
    []
  );

  const filteredGuides = useMemo(
    () => popularGuides.filter(g => g.title.toLowerCase().includes(docsSearch.trim().toLowerCase())),
    [docsSearch, popularGuides]
  );

  const tutorials = useMemo(
    () => ([
      { title: "Create a YouTube Short", duration: "6 min", level: "beginner" },
      { title: "Optimize Content with AI", duration: "9 min", level: "intermediate" },
      { title: "Advanced Scheduling Strategies", duration: "12 min", level: "advanced" },
    ] as Array<{ title: string; duration: string; level: "beginner" | "intermediate" | "advanced" }>),
    []
  );

  const filteredTutorials = useMemo(
    () => tutorials.filter(t => tutorialLevel === "all" ? true : t.level === tutorialLevel),
    [tutorialLevel, tutorials]
  );

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Open help menu"
              className="rounded-full shadow-lg bg-primary text-white p-3 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => setOpen((v) => !v)}
            >
              <HelpCircle className="h-6 w-6" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Help & Documentation</TooltipContent>
        </Tooltip>

        {open && (
          <div
            role="dialog"
            aria-label="Help & Documentation"
            className="absolute bottom-16 right-0 w-[20rem] sm:w-[24rem] md:w-[32rem] rounded-xl border bg-white shadow-2xl p-4"
          >
            <Tabs defaultValue="docs" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="docs" className="flex items-center gap-2">
                  <BookOpenText className="h-4 w-4" />
                  <span className="hidden sm:inline">Docs</span>
                </TabsTrigger>
                <TabsTrigger value="faq" className="flex items-center gap-2">
                  <MessageCircleQuestion className="h-4 w-4" />
                  <span className="hidden sm:inline">FAQ</span>
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4" />
                  <span className="hidden sm:inline">API</span>
                </TabsTrigger>
                <TabsTrigger value="tutorials" className="flex items-center gap-2">
                  <PlaySquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Tutorials</span>
                </TabsTrigger>
              </TabsList>

              {/* Documentation */}
              <TabsContent value="docs" className="space-y-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Quick search guides…"
                    value={docsSearch}
                    onChange={(e) => setDocsSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Sparkles className="h-4 w-4 text-purple-600" /> Getting Started
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      Create your account, connect social profiles, and publish your first post.
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <ShieldCheck className="h-4 w-4 text-blue-600" /> Integrations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      YouTube, LinkedIn, and more—connect safely with step-by-step instructions.
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Popular Guides</p>
                  <div className="space-y-2">
                    {filteredGuides.map((g, idx) => (
                      <a
                        key={idx}
                        href={g.href}
                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50"
                      >
                        <span className="text-sm text-gray-800">{g.title}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <a href="/docs" className="inline-flex items-center gap-2 text-primary font-medium">
                    <BookOpenText className="h-4 w-4" />
                    Documentation
                  </a>
                </div>
              </TabsContent>

              {/* FAQ */}
              <TabsContent value="faq" className="space-y-3">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Account & Billing</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-600">Update your profile, manage subscriptions, and change passwords in Settings.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Scheduling</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-600">Use the Scheduler to plan posts and enable reminders for best times.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Content Studio</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-600">Draft, edit, and publish content across platforms with version history.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trending questions</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li><a href="/faq#connect-youtube" className="hover:underline">How do I connect my YouTube channel?</a></li>
                    <li><a href="/faq#schedule-post" className="hover:underline">Why didn’t my scheduled post publish?</a></li>
                    <li><a href="/faq#ai-credits" className="hover:underline">How are AI credits calculated?</a></li>
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <a href="/faq" className="inline-flex items-center gap-2 text-primary font-medium">
                    <MessageCircleQuestion className="h-4 w-4" />
                    FAQ
                  </a>
                </div>
              </TabsContent>

              {/* API Docs */}
              <TabsContent value="api" className="space-y-3">
                <Card className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-gray-900">Quick example</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <pre className="bg-gray-50 rounded-md p-3 text-xs overflow-x-auto"><code>{`fetch('/api/content', {
  headers: { Authorization: 'Bearer <token>' }
}).then(r => r.json())
  .then(console.log)`}</code></pre>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card className="border border-blue-200">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm text-blue-900">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">Use bearer tokens for all authenticated requests.</CardContent>
                  </Card>
                  <Card className="border border-purple-200">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm text-purple-900">Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">Content, Scheduler, Analytics, YouTube, LinkedIn.</CardContent>
                  </Card>
                </div>

                <div className="flex items-center justify-between">
                  <a href="/api-docs" className="inline-flex items-center gap-2 text-primary font-medium">
                    <FileCode2 className="h-4 w-4" />
                    API Docs
                  </a>
                </div>
              </TabsContent>

              {/* Tutorials */}
              <TabsContent value="tutorials" className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Difficulty:</span>
                  <div className="flex gap-1">
                    {(["all","beginner","intermediate","advanced"] as const).map(l => (
                      <Badge
                        key={l}
                        className={`cursor-pointer ${tutorialLevel===l?"bg-primary text-white":"bg-gray-100 text-gray-700"}`}
                        onClick={() => setTutorialLevel(l)}
                      >
                        {l.charAt(0).toUpperCase()+l.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredTutorials.map((t, i) => (
                    <Card key={i} className="border border-gray-200 overflow-hidden">
                      <div className="h-24 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center">
                        <PlaySquare className="h-6 w-6 text-primary" />
                      </div>
                      <CardContent className="p-3 space-y-1">
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-500">{t.duration} • {t.level.charAt(0).toUpperCase()+t.level.slice(1)}</p>
                        <a href="/tutorials" className="inline-flex items-center gap-1 text-primary text-sm">
                          Watch <ArrowRight className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <a href="/tutorials" className="inline-flex items-center gap-2 text-primary font-medium">
                    <PlaySquare className="h-4 w-4" />
                    Tutorials
                  </a>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}


