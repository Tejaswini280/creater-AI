import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, CheckCircle2, Info, LifeBuoy, PlugZap, Rocket, Search, Server, ShieldAlert, Zap } from 'lucide-react';

export default function Troubleshooting() {
  const [query, setQuery] = useState('');

  const categories = useMemo(() => ([
    { id: 'login', title: 'Login Issues', icon: ShieldAlert },
    { id: 'performance', title: 'Performance Problems', icon: Rocket },
    { id: 'integrations', title: 'Integration Errors', icon: PlugZap },
    { id: 'billing', title: 'Billing & Payments', icon: LifeBuoy },
  ]), []);

  const data = useMemo(() => ({
    login: [
      { q: 'I cannot log in', a: 'Ensure the server is running, your token is valid, and time is in sync.' },
      { q: 'I get 401 Unauthorized', a: 'Log out and back in. Clear local token from LocalStorage and refresh.' },
    ],
    performance: [
      { q: 'The app feels slow', a: 'Check your network, close unused tabs, and verify the server has not hit rate limits.' },
      { q: 'Charts don’t load', a: 'Disable ad-blockers and check the Network tab for blocked requests.' },
    ],
    integrations: [
      { q: 'YouTube authentication fails', a: 'Reconnect from Settings → Integrations; ensure Google OAuth credentials are correct.' },
      { q: 'LinkedIn profile not found', a: 'Reconnect and grant organization permissions if posting as a page.' },
    ],
    billing: [
      { q: 'Payment declined', a: 'Verify card details, check available funds, or try another card.' },
      { q: 'Invoice missing', a: 'Visit Settings → Billing to download receipts.' },
    ],
  }), []);

  const filter = (arr: { q: string; a: string }[]) => arr.filter(i => (
    i.q.toLowerCase().includes(query.toLowerCase()) || i.a.toLowerCase().includes(query.toLowerCase())
  ));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-gray-50 p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Topics</h2>
        </div>
        <nav className="space-y-1">
          {categories.map(c => {
            const Icon = c.icon;
            return (
              <a key={c.id} href={`#${c.id}`} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                <Icon className="h-4 w-4 text-gray-600" />
                <span>{c.title}</span>
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main role="main" className="flex-1 mx-auto max-w-5xl p-6 space-y-6">
        <header className="space-y-2">
          <h1 role="heading" aria-level={1} className="text-3xl font-bold">Troubleshooting</h1>
          <p className="text-gray-600">Find solutions to common problems. Use the search to quickly locate steps.</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search issues..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </header>

        {/* Alert/info boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-900 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Warning</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-yellow-900">Before trying advanced steps, check the Status page and ensure your internet connection is stable.</CardContent>
          </Card>
          <Card className="border border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-900 flex items-center gap-2"><Info className="h-4 w-4" /> Tip</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-blue-900">Open DevTools → Network to see failed requests and error codes.</CardContent>
          </Card>
          <Card className="border border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-900 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Quick fix</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-green-900">Clearing cache/localStorage and reloading resolves most token-related issues.</CardContent>
          </Card>
        </div>

        {/* Sections */}
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <section key={cat.id} id={cat.id} className="space-y-4">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900"><Icon className="h-5 w-5" /> {cat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {filter(data[cat.id as keyof typeof data]).map((item, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger>{item.q}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p>{item.a}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Card className="border">
                                <CardContent className="p-3">
                                  <p className="font-medium mb-2">Steps</p>
                                  <ol className="list-decimal ml-5 space-y-1">
                                    <li>Open DevTools → Network to confirm the error.</li>
                                    <li>Check Settings or Integrations for misconfiguration.</li>
                                    <li>Retry the action and watch for new logs.</li>
                                  </ol>
                                </CardContent>
                              </Card>
                              <Card className="border">
                                <CardContent className="p-3">
                                  <p className="font-medium mb-2">Visual Guide</p>
                                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">Screenshot/Video</div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          );
        })}
      </main>
    </div>
  );
}


