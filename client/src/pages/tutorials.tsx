import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaySquare } from 'lucide-react';

export default function Tutorials() {
  const [level, setLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const tutorials = useMemo(() => ([
    { title: 'Create Your First Content', level: 'beginner', steps: ['Open Content Studio', 'Click Create', 'Fill form', 'Submit'], duration: '5 min' },
    { title: 'Generate a Script with AI', level: 'beginner', steps: ['Open AI Generator', 'Enter topic', 'Choose type', 'Click Generate'], duration: '6 min' },
    { title: 'Optimize Thumbnails with AI', level: 'intermediate', steps: ['Go to AI', 'Choose Thumbnail', 'Upload image', 'Generate variations'], duration: '8 min' },
    { title: 'Advanced Scheduling Tips', level: 'advanced', steps: ['Open Scheduler', 'Use best-time suggestions', 'Batch schedule', 'Review calendar'], duration: '10 min' },
  ]), []);

  const filtered = tutorials.filter(t => level === 'all' ? true : t.level === level);

  return (
    <main role="main" className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 role="heading" aria-level={1} className="text-3xl font-bold">Tutorials</h1>
        <div className="flex gap-2">
          {(['all','beginner','intermediate','advanced'] as const).map(l => (
            <Badge key={l} className={`cursor-pointer ${level===l? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setLevel(l)}>
              {l.charAt(0).toUpperCase()+l.slice(1)}
            </Badge>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <Card key={t.title} className="border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center">
              <PlaySquare className="h-8 w-8 text-primary" />
            </div>
            <CardHeader className="pb-1">
              <CardTitle className="text-gray-900">{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-500 mb-2">{t.duration} • {t.level}</p>
              <ol className="list-decimal ml-5 text-sm space-y-1">
                {t.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}


