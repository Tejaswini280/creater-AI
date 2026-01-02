import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <main role="main" className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 role="heading" aria-level={1} className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> Privacy Policy
        </h1>
        <p className="text-gray-600">We respect your privacy. This page explains what we collect and how we protect it.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Data We Collect</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 text-sm space-y-1">
              <li>Account information (email, name)</li>
              <li>Content and scheduling data you create</li>
              <li>Analytics and usage data (subject to cookie preferences)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">How We Use Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 text-sm space-y-1">
              <li>Operate and improve the service</li>
              <li>Provide support and troubleshoot issues</li>
              <li>Personalize features and recommendations</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Your Rights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6 text-sm space-y-1">
            <li>Access and export your data</li>
            <li>Rectify inaccurate data</li>
            <li>Delete your account and associated data</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">For requests, visit Settings → Privacy or contact support.</p>
        </CardContent>
      </Card>
    </main>
  );
}


