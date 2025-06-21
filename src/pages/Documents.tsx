import { useState, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  Search,
  Filter,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { documentApi, type Document, ApiError } from "../lib/api";

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const docs = await documentApi.list();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to load documents"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        uploadFiles(files);
      }
    },
    []
  );

  const uploadFiles = async (files: File[]) => {
    try {
      setIsUploading(true);
      setError(null);

      const uploadedDocs = await documentApi.upload(files);

      // Add uploaded documents to the list
      setDocuments((prev) => [...uploadedDocs, ...prev]);

      // Start polling for status updates
      uploadedDocs.forEach((doc) => {
        if (doc.status === "processing") {
          pollDocumentStatus(doc.id);
        }
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const pollDocumentStatus = async (documentId: string) => {
    const maxRetries = 30; // Poll for up to 5 minutes (30 * 10s)
    let retries = 0;

    const poll = async () => {
      try {
        const statusResult = await documentApi.getStatus(documentId);

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === documentId
              ? { ...doc, status: statusResult.status }
              : doc
          )
        );

        // If still processing and haven't exceeded retries, continue polling
        if (statusResult.status === "processing" && retries < maxRetries) {
          retries++;
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (err) {
        console.error("Failed to check document status:", err);
        // Stop polling on error
      }
    };

    poll();
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await documentApi.delete(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      console.error("Failed to delete document:", err);
      setError(
        err instanceof ApiError ? err.message : "Failed to delete document"
      );
    }
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Document Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upload and manage your legal documents
        </p>
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

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload
            className={`mx-auto h-12 w-12 text-gray-400 ${
              isUploading ? "animate-pulse" : ""
            }`}
          />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {isUploading
                  ? "Uploading..."
                  : "Drop files here or click to upload"}
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Supports PDF and DOCX files
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Documents ({filteredDocuments.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">
              Loading documents...
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {documents.length === 0
                ? "No documents yet"
                : "No matching documents"}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {documents.length === 0
                ? "Upload your first document to get started with Legal Memory"
                : "Try adjusting your search terms"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{doc.type}</span>
                      <span>{doc.size}</span>
                      <span>
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      doc.status === "ready"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : doc.status === "processing"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                    }`}
                  >
                    {doc.status}
                  </span>
                  <div className="relative">
                    <button
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 group"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400 group-hover:hidden" />
                      <Trash2 className="h-4 w-4 text-red-500 hidden group-hover:block" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
