export default function DeveloperDocs() {
  return (
    <main role="main" className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 role="heading" aria-level={1} className="text-3xl font-bold">Developer Documentation</h1>
      <section className="space-y-2">
        <h2 role="heading" aria-level={2} className="text-xl font-semibold">Local Setup</h2>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">npm install
npx playwright install
npm run dev</pre>
      </section>
      <section className="space-y-2">
        <h2 role="heading" aria-level={2} className="text-xl font-semibold">Testing</h2>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">npm test
npm run test:server
npm run e2e</pre>
      </section>
    </main>
  );
}


