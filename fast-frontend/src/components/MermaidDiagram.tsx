import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
});

interface MermaidDiagramProps {
  chart: string;
  id: string;
}

export function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart) return;
    const containerId = `mermaid-${id}`;
    mermaid
      .render(containerId, chart)
      .then(({ svg: result }) => setSvg(result))
      .catch((e) => setError(e.message ?? 'Failed to render diagram'));
  }, [chart, id]);

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
        Diagram error: {error}
      </div>
    );
  }
  if (!svg) {
    return <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />;
  }
  return (
    <div
      className="mermaid-diagram overflow-x-auto rounded-lg bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
