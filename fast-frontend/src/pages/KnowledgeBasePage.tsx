import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { knowledgeApi } from '../shared/api/knowledgeApi';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function KnowledgeBasePage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledge', 0, 20],
    queryFn: () => knowledgeApi.getAll(0, 20),
  });

  if (isLoading) return <LoadingSpinner message="Loading knowledge base..." />;
  if (error) return <div className="text-center py-8 text-red-500">Failed to load knowledge articles</div>;

  const articles = data?.content ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>

      {articles.length === 0 ? (
        <EmptyState message="No knowledge articles yet. Articles are auto-created when problems are resolved." />
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                onClick={() => setExpanded(expanded === article.id ? null : article.id)}
              >
                <div>
                  <h3 className="font-medium text-gray-900">{article.title}</h3>
                  <div className="flex gap-2 mt-1">
                    {article.category && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{article.category}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      article.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {article.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      Created: {new Date(article.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-gray-400">{expanded === article.id ? '\u25B2' : '\u25BC'}</span>
              </div>

              {expanded === article.id && (
                <div className="px-4 pb-4 border-t space-y-3 pt-3">
                  {article.rootCause && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Root Cause</p>
                      <p className="text-sm text-gray-700 mt-1">{article.rootCause}</p>
                    </div>
                  )}
                  {article.workaround && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Workaround</p>
                      <p className="text-sm text-gray-700 mt-1">{article.workaround}</p>
                    </div>
                  )}
                  {article.permanentFix && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Permanent Fix</p>
                      <p className="text-sm text-gray-700 mt-1">{article.permanentFix}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Problem #{article.fastProblemId}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
