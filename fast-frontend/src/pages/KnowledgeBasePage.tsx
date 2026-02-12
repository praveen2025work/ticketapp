import type { ReactNode } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { knowledgeApi } from '../shared/api/knowledgeApi';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <h2 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h2>,
  p: ({ children }: { children?: ReactNode }) => <p className="text-gray-700 text-sm mb-3">{children}</p>,
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
      <table className="min-w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => <thead className="bg-gray-50 border-b border-gray-200">{children}</thead>,
  tbody: ({ children }: { children?: ReactNode }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  tr: ({ children }: { children?: ReactNode }) => <tr className="hover:bg-gray-50/50">{children}</tr>,
  th: ({ children }: { children?: ReactNode }) => <th className="px-4 py-2.5 font-semibold text-gray-700">{children}</th>,
  td: ({ children }: { children?: ReactNode }) => <td className="px-4 py-2.5 text-gray-600">{children}</td>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-3">{children}</ul>,
  li: ({ children }: { children?: ReactNode }) => <li className="ml-2">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-gray-800">{children}</strong>,
};

export default function KnowledgeBasePage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [roleRulesOpen, setRoleRulesOpen] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledge', 0, 20],
    queryFn: () => knowledgeApi.getAll(0, 20),
  });

  const { data: roleRulesData } = useQuery({
    queryKey: ['knowledge', 'role-rules'],
    queryFn: () => knowledgeApi.getRoleRules(),
  });

  if (isLoading) return <LoadingSpinner message="Loading knowledge base..." />;
  if (error) return <div className="text-center py-8 text-red-500">Failed to load knowledge articles</div>;

  const articles = data?.content ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Knowledge Base</h1>

      {/* Role rules section – Who can do what */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setRoleRulesOpen(!roleRulesOpen)}
          className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Role rules – Who can do what</h2>
          <span className="text-gray-400 dark:text-slate-400 text-sm" aria-hidden>{roleRulesOpen ? '\u25B2' : '\u25BC'}</span>
        </button>
        {roleRulesOpen && roleRulesData?.content && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {roleRulesData.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

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
