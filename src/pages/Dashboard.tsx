import { useState, useEffect } from "react";
import {
  FileText,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  documentApi,
  chatApi,
  conflictApi,
  historyApi,
  ApiError,
  checkApiHealth,
  type Change,
} from "../lib/api";

interface DashboardStats {
  totalDocuments: number;
  memoryQueries: number;
  conflictsFound: number;
  relationships: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    memoryQueries: 0,
    conflictsFound: 0,
    relationships: 0,
  });
  const [recentChanges, setRecentChanges] = useState<Change[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    loadDashboardData();
  }, []);

  const checkConnection = async () => {
    const connected = await checkApiHealth();
    setApiConnected(connected);
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all dashboard data in parallel
      const [documents, sessions, conflicts, changes] =
        await Promise.allSettled([
          documentApi.list(),
          chatApi.getSessions(),
          conflictApi.list(),
          historyApi.getRecentChanges(),
        ]);

      // Process documents
      const documentsData =
        documents.status === "fulfilled" ? documents.value : [];

      // Process sessions
      const sessionsData =
        sessions.status === "fulfilled" ? sessions.value : [];

      // Process conflicts
      const conflictsData =
        conflicts.status === "fulfilled" ? conflicts.value : [];

      // Process changes
      const changesData = changes.status === "fulfilled" ? changes.value : [];

      setStats({
        totalDocuments: documentsData.length,
        memoryQueries: sessionsData.reduce((total: number, session: any) => {
          return total + (session.messageCount || 0);
        }, 0),
        conflictsFound: conflictsData.filter((c: any) => c.type === "conflict")
          .length,
        relationships: conflictsData.length,
      });

      setRecentChanges(changesData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Legal Memory Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track, recall, and reason across your legal documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* API Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                apiConnected === null
                  ? "bg-gray-400"
                  : apiConnected
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {apiConnected === null
                ? "Checking..."
                : apiConnected
                ? "Connected"
                : "Offline"}
            </span>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div className="text-red-600 text-sm font-medium">Error:</div>
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* API Connection Warning */}
      {apiConnected === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div className="text-yellow-800 text-sm">
              <strong>Backend Disconnected:</strong> The Legal Memory backend at
              http://localhost:8000 is not available. Some features may not work
              properly.
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Documents
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? "..." : stats.totalDocuments}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Memory Queries
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? "..." : stats.memoryQueries}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Conflicts Found
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? "..." : stats.conflictsFound}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Relationships
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? "..." : stats.relationships}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/documents"
              className="block w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                Upload New Documents
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Add contracts, policies, or memos to your legal memory
              </div>
            </a>
            <a
              href="/legal-memory"
              className="block w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                Query Legal Memory
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ask questions across all your documents
              </div>
            </a>
            <a
              href="/relationships"
              className="block w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                Review Conflicts
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Check for contradictions and inconsistencies
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Loading...
                </div>
              </div>
            ) : recentChanges.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                No recent activity. Upload documents to get started.
              </div>
            ) : (
              recentChanges.map((change, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {change.document}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {change.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(change.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
