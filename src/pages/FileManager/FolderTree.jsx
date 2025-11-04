import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner } from "reactstrap";
import { useRole } from "../../helpers/useRole";

const FolderTree = ({
  folders,
  currentFolder,
  onFolderSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  loading,
}) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Auto-expand parent folders when a folder is selected
  useEffect(() => {
    if (currentFolder !== null && folders.length > 0) {
      const findParents = (folderId, allFolders) => {
        const parents = [];
        let folder = allFolders.find(f => f.id === folderId);
        while (folder && folder.parent_id) {
          parents.push(folder.parent_id);
          folder = allFolders.find(f => f.id === folder.parent_id);
        }
        return parents;
      };
      
      const parentIds = findParents(currentFolder, folders);
      if (parentIds.length > 0) {
        setExpandedFolders(new Set([...expandedFolders, ...parentIds]));
      }
    }
  }, [currentFolder, folders]);

  // Build hierarchical folder structure
  // Note: Folders are already filtered in the parent component, no need to filter again
  const buildFolderTree = (parentId = null) => {
    const children = folders
      .filter(folder => {
        // Normalize both values for comparison - handle null, undefined, empty string, and type coercion
        const folderParentId = folder.parent_id === undefined || 
                                folder.parent_id === null || 
                                folder.parent_id === "" ? null : folder.parent_id;
        
        const normalizedParentId = parentId === undefined || 
                                    parentId === null || 
                                    parentId === "" ? null : parentId;
        
        // For null/root level comparison
        if (normalizedParentId === null) {
          return folderParentId === null;
        }
        
        // For non-null comparison, use loose equality to handle number/string mismatch
        return folderParentId == normalizedParentId;
      })
      .map(folder => ({
        ...folder,
        children: buildFolderTree(folder.id)
      }));
    
    return children;
  };

  const folderTree = buildFolderTree();
  
  // Enhanced Debug: Log folder structure with details
  console.log("=== FOLDER TREE DEBUG ===");
  console.log("All folders received:", folders);
  folders.forEach((folder, index) => {
    console.log(`Folder ${index + 1}:`, {
      id: folder.id,
      name: folder.name,
      parent_id: folder.parent_id,
      parent_id_type: typeof folder.parent_id
    });
  });
  console.log("Root level folders (parent_id = null):", folderTree);
  console.log("Total folders count:", folders.length);
  console.log("Root level count:", folderTree.length);
  console.log("========================");

  const toggleExpanded = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = currentFolder === folder.id;

    // Debug nested folders
    if (hasChildren) {
      console.log(`Folder "${folder.name}" has ${folder.children.length} children:`, folder.children.map(c => c.name));
    }

    return (
      <div key={folder.id} className="folder-item">
        <div
          className={`folder-row d-flex align-items-center py-2 px-2 rounded ${
            isSelected ? "bg-primary text-white" : ""
          }`}
          style={{ 
            marginLeft: `${level * 12}px`,
            cursor: "pointer",
            marginBottom: "2px"
          }}
          onClick={() => onFolderSelect(folder.id)}
        >
          <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
            {hasChildren ? (
              <Button
                color="link"
                size="sm"
                className={`p-0 me-2 text-decoration-none ${isSelected ? "text-white" : "text-muted"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(folder.id);
                  console.log(`Toggle folder "${folder.name}" - isExpanded will be: ${!isExpanded}`);
                }}
                style={{ flexShrink: 0 }}
              >
                <i className={`bx ${isExpanded ? "bx-chevron-down" : "bx-chevron-right"}`} style={{ fontSize: "14px" }}></i>
              </Button>
            ) : (
              <div style={{ width: '24px', flexShrink: 0 }}></div>
            )}
            
            <i className={`bx ${isExpanded && hasChildren ? 'bx-folder-open' : 'bx-folder'} me-2 ${
              isSelected ? 'text-white' : 'text-warning'
            }`} style={{ fontSize: "16px", flexShrink: 0 }}></i>
            <span className="text-truncate" style={{ fontSize: '0.875rem' }} title={folder.name}>
              {folder.name}
            </span>
          </div>
          
          <div className="folder-actions" style={{ flexShrink: 0 }}>
            {/* Org Executive can edit and delete folders */}
            <Button
              color="link"
              size="sm"
              className={`p-0 text-decoration-none ${isSelected ? 'text-white' : 'text-muted'}`}
              onClick={(e) => {
                e.stopPropagation();
                onEditFolder(folder);
              }}
              title="Edit Folder"
            >
              <i className="bx bx-edit" style={{ fontSize: "13px" }}></i>
            </Button>
            <Button
              color="link"
              size="sm"
              className="p-0 text-decoration-none text-danger ms-2"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder);
              }}
              title="Delete Folder"
            >
              <i className="bx bx-trash" style={{ fontSize: "13px" }}></i>
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="folder-children" style={{ paddingLeft: "4px", marginTop: "2px" }}>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border shadow-sm h-100">
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h6 className="mb-0 fw-semibold">
            <i className="bx bx-folder-open text-primary me-2"></i>
            Folders
          </h6>
          {/* Org Executive can create folders */}
          <Button
            color="primary"
            size="sm"
            onClick={onCreateFolder}
            style={{ borderRadius: "4px", padding: "4px 10px" }}
            title="Create New Folder"
          >
            <i className="bx bx-plus me-1"></i>
            New
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner size="sm" color="primary" />
            <div className="mt-2 text-muted" style={{ fontSize: "0.85rem" }}>Loading folders...</div>
          </div>
        ) : (
          <div className="folder-tree">
            {/* Root folder option */}
            <div
              className={`folder-row d-flex align-items-center py-2 px-2 rounded ${
                currentFolder === null ? "bg-primary text-white" : ""
              }`}
              style={{ cursor: "pointer", marginBottom: "8px" }}
              onClick={() => onFolderSelect(null)}
            >
              <i className={`bx bx-home me-2 ${currentFolder === null ? "text-white" : "text-info"}`} style={{ fontSize: "16px" }}></i>
              <span style={{ fontSize: "0.875rem", fontWeight: currentFolder === null ? "500" : "normal" }}>
                All Files
              </span>
            </div>

            {/* Folder tree */}
            {folderTree.length === 0 ? (
              <div className="text-center py-4 px-2">
                <i className="bx bx-folder-open text-muted mb-2" style={{ fontSize: "48px", opacity: 0.3 }}></i>
                <div className="text-muted mb-1" style={{ fontSize: '0.875rem', fontWeight: "500" }}>No folders yet</div>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Click "New" to create your first folder
                </small>
              </div>
            ) : (
              <div>
                {folderTree.map(folder => renderFolder(folder))}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default FolderTree;
