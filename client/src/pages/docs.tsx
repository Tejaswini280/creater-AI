import { Link, Route } from "wouter";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenText, Search, Sparkles, ShieldCheck, Calendar, Bot, PlugZap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Sidebar from "@/components/dashboard/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Docs() {
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  const sections = useMemo(
    () => ([
      { id: "getting-started", icon: Sparkles, title: "Getting Started" },
      { id: "scheduler", icon: Calendar, title: "Scheduler" },
      { id: "ai-generator", icon: Bot, title: "AI Generator" },
      { id: "integrations", icon: PlugZap, title: "Integrations" },
    ]),
    []
  );

  // Smooth scroll to a section and update URL hash without full navigation
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      if (history.replaceState) {
        history.replaceState(null, "", `/docs#${id}`);
      }
    }
  };

  // Handle deep links like /docs/scheduler or /docs#scheduler
  useEffect(() => {
    const slugToId: Record<string, string> = {
      "getting-started": "getting-started",
      "scheduler": "scheduler",
      "ai-generator": "ai-generator",
      "integrations": "integrations",
    };

    const handleInitialScroll = () => {
      const { pathname, hash } = window.location;
      if (pathname.startsWith("/docs/") && pathname.split("/")[2]) {
        const slug = pathname.split("/")[2];
        const id = slugToId[slug];
        if (id) {
          setTimeout(() => scrollToSection(id), 50);
          return;
        }
      }
      if (hash && hash.length > 1) {
        const id = hash.substring(1);
        setTimeout(() => scrollToSection(id), 50);
      }
    };

    handleInitialScroll();
    // Also handle back/forward navigation
    const onPop = () => handleInitialScroll();
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  // Scroll spy to highlight the section currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="flex min-h-screen bg-white">
      {!isMobile && (
        <aside className="w-64 border-r bg-gray-50 p-4 hidden md:block">
          <div className="flex items-center gap-2 mb-4">
            <BookOpenText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Documentation</h2>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search docs..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <nav className="space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(s.id);
                  }}
                >
                  <div
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      activeSection === s.id ? "bg-gray-200" : "hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span>{s.title}</span>
                  </div>
                </a>
              );
            })}
          </nav>
        </aside>
      )}

      <main role="main" className="flex-1 mx-auto max-w-5xl p-6 space-y-8">
        <header className="space-y-2">
          <h1 role="heading" aria-level={1} className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Documentation</h1>
          <p className="text-gray-600">Guides to help you get the most out of CreatorAI Studio.</p>
          <div className="relative md:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search docs..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </header>

        {/* Getting Started */}
        <section id="getting-started" className="space-y-4">
          <Card className={`border border-gray-200 ${activeSection === 'getting-started' ? 'ring-2 ring-primary/40' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-600" /> Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal ml-6 text-sm space-y-1">
                <li>Register an account and log in</li>
                <li>Create your first content in Content Studio</li>
                <li>Generate scripts or ideas with AI</li>
                <li>Schedule and publish to your channels</li>
              </ol>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="border">
                  <CardContent className="p-3 text-sm text-gray-700">
                    <p className="mb-2 font-medium">Sample API Call</p>
                    <pre className="bg-gray-50 rounded p-2 overflow-x-auto"><code>{`curl -H "Authorization: Bearer <token>" https://api.example.com/content`}</code></pre>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-3 text-sm text-gray-700">
                    <p className="mb-2 font-medium">Intro Video</p>
                    <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">Video placeholder</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Scheduler */}
        <section id="scheduler" className="space-y-4">
          <Card className={`border border-gray-200 ${activeSection === 'scheduler' ? 'ring-2 ring-primary/40' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" /> Scheduler</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="s1">
                  <AccordionTrigger>Creating a schedule</AccordionTrigger>
                  <AccordionContent>
                    Plan posts with best-time recommendations and reminders.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="s2">
                  <AccordionTrigger>Editing and canceling</AccordionTrigger>
                  <AccordionContent>
                    Update or cancel scheduled posts from the Scheduler page.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* AI Generator */}
        <section id="ai-generator" className="space-y-4">
          <Card className={`border border-gray-200 ${activeSection === 'ai-generator' ? 'ring-2 ring-primary/40' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-green-600" /> AI Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3">Turn ideas into scripts and captions using AI models.</p>
              <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto"><code>{`POST /api/ai/generate { topic: "Your idea" }`}</code></pre>
            </CardContent>
          </Card>
        </section>

        {/* Integrations */}
        <section id="integrations" className="space-y-4">
          <Card className={`border border-gray-200 ${activeSection === 'integrations' ? 'ring-2 ring-primary/40' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PlugZap className="h-5 w-5 text-red-600" /> Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">Connect YouTube, LinkedIn, and more to sync analytics and publish content.</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-2">
          <h2 role="heading" aria-level={2} className="text-xl font-semibold">Useful Links</h2>
          <ul className="list-disc ml-6 text-sm space-y-1">
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/api-docs">API Docs</Link></li>
            <li><Link href="/tutorials">Tutorials</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
          </ul>
        </section>
      </main>
    </div>
  );
}



