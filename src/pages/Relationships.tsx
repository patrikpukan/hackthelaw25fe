import { useState, useEffect } from "react";
import {
  Network,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  RefreshCw,
} from "lucide-react";
import { conflictApi, type Conflict, ApiError } from "../lib/api";

export function Relationships() {
  const [relationships, setRelationships] = useState<Conflict[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const conflicts = await conflictApi.list();
      setRelationships(conflicts);
    } catch (err) {
      console.error("Failed to load relationships:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load relationships"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    conflictId: string,
    newStatus: Conflict["status"]
  ) => {
    try {
      setUpdatingStatus((prev) => new Set(prev).add(conflictId));
      setError(null);

      const updatedConflict = await conflictApi.updateStatus(
        conflictId,
        newStatus
      );

      setRelationships((prev) =>
        prev.map((rel) => (rel.id === conflictId ? updatedConflict : rel))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to update status"
      );
    } finally {
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conflictId);
        return newSet;
      });
    }
  };

  const filteredRelationships = relationships.filter((rel) => {
    const typeMatch = filterType === "all" || rel.type === filterType;
    const severityMatch =
      filterSeverity === "all" || rel.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "conflict":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "similarity":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "reference":
        return <Network className="h-4 w-4 text-purple-600" />;
      case "precedent":
        return <Eye className="h-4 w-4 text-green-600" />;
      default:
        return <Network className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "dismissed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Document Relationships
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visualize connections, conflicts, and patterns across your legal
            documents
          </p>
        </div>
        <button
          onClick={loadRelationships}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conflicts
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {relationships.filter((r) => r.type === "conflict").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Similarities
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {relationships.filter((r) => r.type === "similarity").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                References
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {relationships.filter((r) => r.type === "reference").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Precedents
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {relationships.filter((r) => r.type === "precedent").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="conflict">Conflicts</option>
            <option value="similarity">Similarities</option>
            <option value="reference">References</option>
            <option value="precedent">Precedents</option>
          </select>
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Relationships List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Detected Relationships ({filteredRelationships.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">
              Loading relationships...
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRelationships.map((relationship) => (
              <div
                key={relationship.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(relationship.type)}
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {relationship.type}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                          relationship.severity
                        )}`}
                      >
                        {relationship.severity} severity
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          relationship.status
                        )}`}
                      >
                        {relationship.status}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {relationship.description}
                    </p>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Affected Documents:
                      </p>
                      {relationship.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>{doc.name}</span>
                          {doc.section && (
                            <span className="text-gray-500">
                              ({doc.section})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    {relationship.status === "active" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            handleStatusUpdate(relationship.id, "resolved")
                          }
                          disabled={updatingStatus.has(relationship.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                          {updatingStatus.has(relationship.id)
                            ? "..."
                            : "Resolve"}
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(relationship.id, "dismissed")
                          }
                          disabled={updatingStatus.has(relationship.id)}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-100 transition-colors text-gray-700 dark:text-gray-300"
                        >
                          {updatingStatus.has(relationship.id)
                            ? "..."
                            : "Dismiss"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredRelationships.length === 0 && !isLoading && (
              <div className="p-12 text-center">
                <Network className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No relationships found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {relationships.length === 0
                    ? "Upload more documents to discover connections and patterns"
                    : "Try adjusting your filters to see more results"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
