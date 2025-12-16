import React, { useState, useEffect } from 'react';
import cmsEditorService, { VersionHistoryItem, VersionComparisonResult, EditorPageContent } from '../../services/cmsEditorService';
import Button from '../Button';

interface VersionHistoryPanelProps {
  contentId: string;
  currentContent: EditorPageContent;
  onClose: () => void;
  onVersionPreview: (version: EditorPageContent) => void;
  onVersionRestore: (versionNumber: number) => Promise<void>;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  contentId,
  currentContent,
  onClose,
  onVersionPreview,
  onVersionRestore
}) => {
  const [versions, setVersions] = useState<VersionHistoryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionHistoryItem | null>(null);
  const [previewVersion, setPreviewVersion] = useState<EditorPageContent | null>(null);
  const [compareResults, setCompareResults] = useState<VersionComparisonResult[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Load versions on mount and when page changes
  useEffect(() => {
    loadVersions(pagination.page);
  }, [contentId, pagination.page]);
  
  // Load version history
  const loadVersions = async (page: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await cmsEditorService.getVersionHistory(contentId, page);
      setVersions(result.versions);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Error loading version history:', err);
      setError('Failed to load version history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load version content for preview
  const handlePreviewVersion = async (version: VersionHistoryItem) => {
    setIsLoading(true);
    setError(null);
    setSelectedVersion(version);
    
    try {
      const versionContent = await cmsEditorService.getVersion(contentId, version.versionNumber);
      setPreviewVersion(versionContent);
      
      // Compare with current content
      const comparison = cmsEditorService.compareVersions(currentContent, versionContent);
      setCompareResults(comparison);
      
      // Call the preview handler
      onVersionPreview(versionContent);
    } catch (err) {
      console.error(`Error loading version ${version.versionNumber}:`, err);
      setError(`Failed to load version ${version.versionNumber}. Please try again.`);
      setPreviewVersion(null);
      setCompareResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Restore to a previous version
  const handleRestoreVersion = async (version: VersionHistoryItem) => {
    if (!confirm(`Are you sure you want to restore to version ${version.versionNumber}?`)) {
      return;
    }
    
    setIsRestoring(true);
    setError(null);
    
    try {
      await onVersionRestore(version.versionNumber);
      
      // Reload versions after restoration
      await loadVersions(1);
      
      // Clear preview
      setPreviewVersion(null);
      setCompareResults([]);
      setSelectedVersion(null);
    } catch (err) {
      console.error(`Error restoring to version ${version.versionNumber}:`, err);
      setError(`Failed to restore to version ${version.versionNumber}. Please try again.`);
    } finally {
      setIsRestoring(false);
    }
  };
  
  // Navigate to a different page
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination(prev => ({ ...prev, page }));
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="version-history-panel fixed inset-0 bg-light-overlay dark:bg-dark-overlay z-50 flex items-center justify-center">
      <div className="relative bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <button 
          className="absolute top-4 right-4 text-light-text dark:text-dark-text hover:text-light-primary dark:hover:text-dark-primary"
          onClick={onClose}
          aria-label="Close version history"
        >
          &times;
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-light-text dark:text-dark-text">Version History</h2>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-light-accent dark:border-dark-accent"></div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-light-negative dark:bg-dark-negative text-light-text-inverse dark:text-dark-text-inverse p-4 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Version list */}
          <div className="flex-1 min-w-[300px]">
            <h3 className="text-lg font-semibold mb-3 text-light-text dark:text-dark-text">Versions</h3>
            
            {versions.length === 0 && !isLoading ? (
              <p className="text-light-text-muted dark:text-dark-text-muted">No versions found.</p>
            ) : (
              <div className="space-y-2">
                {versions.map(version => (
                  <div 
                    key={version.id}
                    className={`p-3 rounded border ${selectedVersion?.id === version.id ? 
                      'border-light-primary dark:border-dark-primary bg-light-primary-faded dark:bg-dark-primary-faded' : 
                      'border-light-border dark:border-dark-border hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover cursor-pointer'
                    }`}
                    onClick={() => handlePreviewVersion(version)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-light-text dark:text-dark-text">
                        Version {version.versionNumber}
                        {version.status === 'published' && (
                          <span className="ml-2 text-xs bg-light-success dark:bg-dark-success text-light-text-inverse dark:text-dark-text-inverse px-2 py-0.5 rounded-full">
                            Published
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-light-text-muted dark:text-dark-text-muted">
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                    
                    <div className="text-sm mt-1 text-light-text dark:text-dark-text">
                      {version.title}
                    </div>
                    
                    <div className="text-xs mt-1 text-light-text-muted dark:text-dark-text-muted">
                      By {version.createdBy.firstName} {version.createdBy.lastName}
                    </div>
                    
                    {version.notes && (
                      <div className="text-xs mt-1 italic text-light-text-muted dark:text-dark-text-muted">
                        {version.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isLoading}
                >
                  Previous
                </Button>
                <span className="py-2 px-3 text-light-text dark:text-dark-text">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          
          {/* Version comparison and actions */}
          <div className="flex-1">
            {selectedVersion && previewVersion ? (
              <>
                <h3 className="text-lg font-semibold mb-3 text-light-text dark:text-dark-text">
                  Version {selectedVersion.versionNumber} - {formatDate(selectedVersion.createdAt)}
                </h3>
                
                <div className="mb-4 flex gap-3">
                  <Button 
                    variant="primary"
                    onClick={() => handleRestoreVersion(selectedVersion)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? 'Restoring...' : `Restore to this version`}
                  </Button>
                </div>
                
                <h4 className="font-medium text-light-text dark:text-dark-text mb-2">Changes</h4>
                
                {compareResults.length === 0 ? (
                  <p className="text-light-text-muted dark:text-dark-text-muted">No changes detected.</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {compareResults
                      .filter(result => result.hasChanged)
                      .map(result => (
                        <div 
                          key={result.fieldKey}
                          className="p-3 border border-light-border dark:border-dark-border rounded"
                        >
                          <div className="font-medium mb-1 text-light-text dark:text-dark-text">
                            {result.fieldName}
                          </div>
                          
                          <div className="text-sm grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-light-text-muted dark:text-dark-text-muted mb-1">
                                Current Version
                              </div>
                              <div className="p-2 bg-light-bg dark:bg-dark-bg rounded text-light-text dark:text-dark-text">
                                {typeof result.currentValue === 'string' ? (
                                  result.currentValue.substring(0, 100) + (result.currentValue.length > 100 ? '...' : '')
                                ) : (
                                  JSON.stringify(result.currentValue)
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-light-text-muted dark:text-dark-text-muted mb-1">
                                Version {selectedVersion.versionNumber}
                              </div>
                              <div className="p-2 bg-light-bg dark:bg-dark-bg rounded text-light-text dark:text-dark-text">
                                {typeof result.comparedValue === 'string' ? (
                                  result.comparedValue.substring(0, 100) + (result.comparedValue.length > 100 ? '...' : '')
                                ) : (
                                  JSON.stringify(result.comparedValue)
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-light-text-muted dark:text-dark-text-muted">
                Select a version to see details and changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryPanel;