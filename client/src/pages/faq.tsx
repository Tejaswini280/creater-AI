import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircleQuestion, Search, Send, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FAQ() {
	const [query, setQuery] = useState('');

	const categories = useMemo(() => ({
		general: [
			{ q: 'How do I create content?', a: 'Open Content Studio and click Create. Fill in the details and submit.' },
			{ q: 'Can I collaborate with teammates?', a: 'Yes. Invite teammates from Settings → Team. Assign roles and collaborate in real time.' },
		],
		ai: [
			{ q: 'How do I use AI to generate scripts?', a: 'Go to AI Generator, enter your topic, select the output type, and click Generate.' },
			{ q: 'Why did my AI request fail?', a: 'Check your network connection and remaining AI credits, then try again.' },
		],
		scheduling: [
			{ q: 'How do I schedule a post?', a: 'From Content Studio or Scheduler, choose a time, platform, and click Schedule.' },
			{ q: 'Why didn’t my post publish?', a: 'Ensure your social account is connected and tokens are valid. Reconnect in Settings → Integrations.' },
		],
		account: [
			{ q: 'How can I export my data?', a: 'Open Settings → Privacy and use the Data Export option.' },
			{ q: 'How do I delete my account?', a: 'Visit Settings → Privacy and request account deletion. You will receive a confirmation email.' },
		],
	}), []);

	const filterItems = (items: { q: string; a: string }[]) =>
		items.filter(i => i.q.toLowerCase().includes(query.toLowerCase()) || i.a.toLowerCase().includes(query.toLowerCase()));

	return (
    <main role="main" className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 role="heading" aria-level={1} className="text-3xl font-bold flex items-center gap-2">
          <MessageCircleQuestion className="h-6 w-6 text-primary" /> Frequently Asked Questions
        </h1>
        <p className="text-gray-600">Quick answers to common questions. Use the search to find what you need.</p>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search questions..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
      </header>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {(['general','ai','scheduling','account'] as const).map((key) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Top Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {filterItems(categories[key]).map((item, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`}>
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionContent>{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Can’t find an answer?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>Reach out to our support team for help.</p>
            <Button asChild className="w-full">
              <a href="mailto:support@example.com"><Send className="h-4 w-4 mr-1" /> Contact Support</a>
            </Button>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">Visit <a className="text-primary underline" href="/troubleshooting">Troubleshooting</a> for common fixes.</CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Policy & Safety</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-primary" /> See <a className="text-primary underline" href="/privacy">Privacy</a> and <a className="text-primary underline" href="/terms">Terms</a>.</CardContent>
        </Card>
      </div>
    </main>
  );
}


