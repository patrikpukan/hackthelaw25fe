import { useState, useEffect } from "react";
import { History, FileText, Clock, User, RefreshCw } from "lucide-react";
import { historyApi, type Change, ApiError } from "../lib/api";

export function Changes() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentChanges();
  }, []);

  const loadRecentChanges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const recentChanges = await historyApi.getRecentChanges();
      setChanges(recentChanges);
    } catch (err) {
      console.error("Failed to load changes:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load changes"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "created":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "modified":
        return <History className="h-4 w-4 text-blue-600" />;
      case "analyzed":
        return <Clock className="h-4 w-4 text-purple-600" />;
      case "conflict_detected":
        return <History className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "created":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "modified":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "analyzed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "conflict_detected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Document Changes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track document evolution and legal memory updates
          </p>
        </div>
        <button
          onClick={loadRecentChanges}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
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

      {/* Changes Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Changes
          </h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">
                Loading changes...
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {changes.map((change) => (
                <div key={change.id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {getChangeIcon(change.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {change.document}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getChangeColor(
                          change.type
                        )}`}
                      >
                        {change.type.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {change.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(change.timestamp)}
                      </div>
                      {change.user && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {change.user}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {changes.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No changes yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Document changes and updates will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
