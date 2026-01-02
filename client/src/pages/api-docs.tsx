import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function ApiDocs() {
  const [baseUrl, setBaseUrl] = useState('/api');
  const [token, setToken] = useState('<token>');

  return (
    <main role="main" className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 role="heading" aria-level={1} className="text-3xl font-bold">API Documentation</h1>
        <p className="text-gray-600">High-level overview with examples and a simple interactive tester.</p>
      </header>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Base URL</label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Bearer Token</label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="space-y-3">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">POST {baseUrl}/auth/login
POST {baseUrl}/auth/register
POST {baseUrl}/auth/refresh
GET  {baseUrl}/auth/user</pre>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto"><code>{`fetch('${baseUrl}/auth/user', {
  headers: { Authorization: 'Bearer ${token}' }
}).then(r => r.json()).then(console.log)`}</code></pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-3">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">POST {baseUrl}/content/create
GET  {baseUrl}/content/analytics
POST {baseUrl}/content/schedule</pre>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto"><code>{`curl -H "Authorization: Bearer ${token}" ${baseUrl}/content/analytics`}</code></pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-3">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">POST {baseUrl}/ai/generate-script
POST {baseUrl}/ai/generate-ideas
POST {baseUrl}/ai/generate-thumbnail
POST {baseUrl}/ai/generate-voiceover</pre>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto"><code>{`fetch('${baseUrl}/ai/generate-ideas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ${token}' },
  body: JSON.stringify({ topic: 'How to grow on YouTube' })
}).then(r => r.json()).then(console.log)`}</code></pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}


