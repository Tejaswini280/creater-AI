import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <main role="main" className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 role="heading" aria-level={1} className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-gray-600">By using this application, you agree to the following terms. Please read carefully.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Use of Service</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            Use responsibly and comply with all applicable laws and policies. Do not abuse or attempt to interfere with the service.
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Content</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            You retain ownership of your content. You are solely responsible for what you publish and for obtaining rights to any media you upload.
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Liability & Changes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          The service is provided "as is" without warranties. We may update these terms; continued use constitutes acceptance of the updated terms.
        </CardContent>
      </Card>
    </main>
  );
}


