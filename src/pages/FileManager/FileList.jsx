import React, { useState } from "react";
import { Card, CardBody, Row, Col, Button, Input, Spinner, Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import { useRole } from "../../helpers/useRole";

const FileList = ({
  folders,
  files,
  currentFolder,
  onCreateFile,
  onEditFile,
  onPreviewFile,
  onDeleteFile,
  onFolderSelect,
  loading,
}) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

  // Get current folder name
  const getCurrentFolderName = () => {
    if (currentFolder === null) return "Root";
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : "Unknown Folder";
  };

  // Get subfolders of current folder
  const currentSubfolders = folders.filter(folder => 
    folder.parent_id === currentFolder
  );

  // Filter files based on search
  const filteredFiles = files.filter(file =>
    file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.file_filename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Get file icon based on mime type
  const getFileIcon = (mimetype, filename) => {
    if (!mimetype && !filename) return "bx-file";
    
    const ext = filename ? filename.split('.').pop().toLowerCase() : '';
    
    if (mimetype?.includes("pdf") || ext === "pdf") return "bxs-file-pdf";
    if (mimetype?.includes("word") || ["doc", "docx"].includes(ext)) return "bxs-file-doc";
    if (mimetype?.includes("excel") || mimetype?.includes("spreadsheet") || ["xls", "xlsx"].includes(ext)) return "bx-spreadsheet";
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "bx-image";
    if (mimetype?.includes("video") || ["mp4", "avi", "mov", "wmv"].includes(ext)) return "bx-video";
    if (mimetype?.includes("audio") || ["mp3", "wav", "ogg"].includes(ext)) return "bx-music";
    if (mimetype?.includes("zip") || mimetype?.includes("compressed") || ["zip", "rar", "7z"].includes(ext)) return "bx-archive";
    if (mimetype?.includes("text") || ext === "txt") return "bx-file-blank";
    
    return "bx-file";
  };

  // Get file color based on type
  const getFileColor = (mimetype, filename) => {
    if (!mimetype && !filename) return "primary";
    
    const ext = filename ? filename.split('.').pop().toLowerCase() : '';
    
    if (mimetype?.includes("pdf") || ext === "pdf") return "danger";
    if (mimetype?.includes("word") || ["doc", "docx"].includes(ext)) return "info";
    if (mimetype?.includes("excel") || mimetype?.includes("spreadsheet") || ["xls", "xlsx"].includes(ext)) return "success";
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "warning";
    if (mimetype?.includes("video") || ["mp4", "avi", "mov", "wmv"].includes(ext)) return "purple";
    
    return "primary";
  };

  return (
    <Card className="h-100">
      <CardBody className="p-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="mb-1 fw-semibold">
              <i className="bx bx-folder-open me-2 text-primary"></i>
              {getCurrentFolderName()}
            </h5>
            <small className="text-muted">
              {currentSubfolders.length} folders • {filteredFiles.length} files
            </small>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            {/* Search */}
            <div className="position-relative" style={{ width: "220px" }}>
              <Input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="bx bx-search-alt position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ fontSize: "14px" }}></i>
            </div>

            {/* View Mode Toggle */}
            <div className="btn-group" role="group">
              <Button
                color={viewMode === "grid" ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-3"
              >
                <i className="bx bx-grid-alt"></i>
              </Button>
              <Button
                color={viewMode === "list" ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
              >
                <i className="bx bx-list-ul"></i>
              </Button>
            </div>

            {/* Upload Button - Org Executive can upload */}
            <Button color="primary" size="sm" onClick={onCreateFile} className="px-3">
              <i className="mdi mdi-upload me-1"></i> Upload
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="mt-2 text-muted">Loading files...</div>
      </div>
        ) : (
          <>
            {/* Subfolders */}
            {currentSubfolders.length > 0 && (
              <div className="mb-3">
                <h6 className="text-muted mb-2">
                  <i className="bx bx-folder me-1"></i>Folders
                </h6>
                <Row>
                  {currentSubfolders.map(folder => (
                    <Col key={folder.id} xl={viewMode === "grid" ? 3 : 12} md={viewMode === "grid" ? 4 : 12} sm={6} className="mb-2">
                      <Card 
                        className="border hover-shadow mb-0" 
                        style={{ cursor: "pointer" }}
                        onClick={() => onFolderSelect(folder.id)}
                      >
                        <CardBody className="p-2">
                          <div className="d-flex align-items-center">
                            <i className="bx bxs-folder text-warning font-size-20 me-2"></i>
                            <div className="flex-grow-1 overflow-hidden">
                              <span className="text-truncate d-block">{folder.name}</span>
                            </div>
                            <i className="bx bx-chevron-right text-muted"></i>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Files */}
            {filteredFiles.length > 0 ? (
              <div>
                <h6 className="text-muted mb-2">
                  <i className="bx bx-file me-1"></i>Files
                </h6>
                
                {viewMode === "grid" ? (
                  <Row>
                    {filteredFiles.map(file => (
                      <Col key={file.id} xl={3} md={4} sm={6} className="mb-2">
                        <Card className="border hover-shadow mb-0">
                          <CardBody className="p-2">
                            <div className="text-end mb-1">
                              <UncontrolledDropdown>
                                <DropdownToggle
                                  tag="button"
                                  className="btn btn-link text-muted p-0"
                                >
                                  <i className="bx bx-dots-vertical-rounded"></i>
                                </DropdownToggle>
                                <DropdownMenu end>
                                  <DropdownItem onClick={() => onPreviewFile(file)}>
                                    <i className="bx bx-show me-2"></i>Preview
                                  </DropdownItem>
                                  {/* Org Executive can edit and delete files */}
                                  <DropdownItem onClick={() => onEditFile(file)}>
                                    <i className="bx bx-edit me-2"></i>Edit
                                  </DropdownItem>
                                  <DropdownItem divider />
                                  <DropdownItem className="text-danger" onClick={() => onDeleteFile(file)}>
                                    <i className="bx bx-trash me-2"></i>Delete
                                  </DropdownItem>
                                </DropdownMenu>
                              </UncontrolledDropdown>
                            </div>

                            <div 
                              className="text-center cursor-pointer"
                              onClick={() => onPreviewFile(file)}
                            >
                              <div className="mb-2">
                                <i className={`bx ${getFileIcon(file.file_mime, file.file_filename)} font-size-48 text-${getFileColor(file.file_mime, file.file_filename)}`}></i>
                              </div>
                              <h6 className="mb-1 text-truncate" title={file.name} style={{ fontSize: '0.9rem' }}>
                                {file.name || file.file_filename || "Untitled"}
                              </h6>
                              <small className="text-muted">
                                {formatFileSize(file.file_size)}
                              </small>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-nowrap table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Size</th>
                          <th>Type</th>
                          <th>Modified</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map(file => (
                          <tr key={file.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className={`bx ${getFileIcon(file.file_mime, file.file_filename)} font-size-20 text-${getFileColor(file.file_mime, file.file_filename)} me-2`}></i>
                                <span 
                                  className="text-truncate cursor-pointer"
                                  onClick={() => onPreviewFile(file)}
                                  style={{ maxWidth: "300px" }}
                                >
                                  {file.name || file.file_filename || "Untitled"}
                                </span>
                              </div>
                            </td>
                            <td>{formatFileSize(file.file_size)}</td>
                            <td>
                              <Badge className="badge-soft-secondary">
                                {file.file_filename ? file.file_filename.split('.').pop().toUpperCase() : "N/A"}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {file.updated_at ? new Date(file.updated_at).toLocaleDateString() : "-"}
                              </small>
                            </td>
                            <td className="text-end">
                              <Button
                                color="light"
                                size="sm"
                                className="me-1"
                                onClick={() => onPreviewFile(file)}
                              >
                                <i className="bx bx-show"></i>
                              </Button>
                              {/* Org Executive can edit and delete files */}
                              <Button
                                color="light"
                                size="sm"
                                className="me-1"
                                onClick={() => onEditFile(file)}
                              >
                                <i className="bx bx-edit"></i>
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => onDeleteFile(file)}
                              >
                                <i className="bx bx-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="bx bx-file display-4 text-muted"></i>
                <h5 className="mt-3">No files found</h5>
                <p className="text-muted">Upload files to get started</p>
                {!isOrgExecutive && (
                  <Button color="primary" onClick={onCreateFile} style={{ borderRadius: 0 }}>
                    <i className="mdi mdi-upload me-1"></i>
                    Upload File
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default FileList;
