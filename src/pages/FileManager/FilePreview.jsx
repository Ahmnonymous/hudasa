import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Spinner,
  Alert,
  Badge,
} from "reactstrap";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../helpers/url_helper";

const FilePreview = ({ isOpen, toggle, file }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(false);
      setError(null);
      setZoom(100);
    }
  }, [isOpen, file]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") {
        toggle();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, toggle, zoom]);

  if (!file) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (mimetype, filename) => {
    if (!mimetype && !filename) return "bx-file";

    const ext = filename ? filename.split(".").pop().toLowerCase() : "";

    if (mimetype?.includes("pdf") || ext === "pdf") return "bxs-file-pdf";
    if (mimetype?.includes("word") || ["doc", "docx"].includes(ext))
      return "bxs-file-doc";
    if (
      mimetype?.includes("excel") ||
      mimetype?.includes("spreadsheet") ||
      ["xls", "xlsx"].includes(ext)
    )
      return "bx-spreadsheet";
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext))
      return "bx-image";
    if (
      mimetype?.includes("video") ||
      ["mp4", "avi", "mov", "wmv"].includes(ext)
    )
      return "bx-video";
    if (
      mimetype?.includes("audio") ||
      ["mp3", "wav", "ogg"].includes(ext)
    )
      return "bx-music";
    if (
      mimetype?.includes("zip") ||
      mimetype?.includes("compressed") ||
      ["zip", "rar", "7z"].includes(ext)
    )
      return "bx-archive";
    if (mimetype?.includes("text") || ext === "txt") return "bx-file-blank";

    return "bx-file";
  };

  const getFileColor = (mimetype, filename) => {
    if (!mimetype && !filename) return "primary";
    
    const ext = filename ? filename.split(".").pop().toLowerCase() : "";
    
    if (mimetype?.includes("pdf") || ext === "pdf") return "danger";
    if (mimetype?.includes("word") || ["doc", "docx"].includes(ext)) return "info";
    if (mimetype?.includes("excel") || mimetype?.includes("spreadsheet") || ["xls", "xlsx"].includes(ext)) return "success";
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "warning";
    if (mimetype?.includes("video") || ["mp4", "avi", "mov", "wmv"].includes(ext)) return "purple";
    if (mimetype?.includes("audio") || ["mp3", "wav", "ogg"].includes(ext)) return "info";
    
    return "primary";
  };

  const canPreview = (mimetype, filename) => {
    if (!mimetype && !filename) return false;

    const ext = filename ? filename.split(".").pop().toLowerCase() : "";

    // Images
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) {
      return true;
    }

    // PDF
    if (mimetype?.includes("pdf") || ext === "pdf") {
      return true;
    }

    // Text files
    if (mimetype?.includes("text") || ext === "txt") {
      return true;
    }

    // Audio
    if (mimetype?.includes("audio") || ["mp3", "wav", "ogg"].includes(ext)) {
      return true;
    }

    // Video
    if (mimetype?.includes("video") || ["mp4", "webm", "ogg"].includes(ext)) {
      return true;
    }

    return false;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const renderPreview = () => {
    if (!file.file_filename) {
      return (
        <div className="preview-empty">
          <i className="bx bx-error-circle"></i>
          <h5>No file available</h5>
          <p className="text-muted">This file cannot be previewed</p>
        </div>
      );
    }

    const mimetype = file.file_mime;
    const filename = file.file_filename;
    const ext = filename ? filename.split(".").pop().toLowerCase() : "";

    // Image preview
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) {
      return (
        <div className="preview-image-container">
          <img
            src={`${API_STREAM_BASE_URL}/personalFiles/${file.id}/view-file`}
            alt={file.name}
            className="preview-image"
            style={{ transform: `scale(${zoom / 100})` }}
            onError={(e) => {
              e.target.style.display = "none";
              setError("Failed to load image");
            }}
          />
        </div>
      );
    }

    // PDF preview
    if (mimetype?.includes("pdf") || ext === "pdf") {
      return (
        <div className="preview-pdf-container">
          <iframe
            src={`${API_STREAM_BASE_URL}/personalFiles/${file.id}/view-file`}
            title={file.name}
            className="preview-iframe"
          />
        </div>
      );
    }

    // Text file preview
    if (mimetype?.includes("text") || ext === "txt") {
      return (
        <div className="preview-text-container">
          <iframe
            src={`${API_STREAM_BASE_URL}/personalFiles/${file.id}/view-file`}
            title={file.name}
            className="preview-iframe"
          />
        </div>
      );
    }

    // Audio preview
    if (mimetype?.includes("audio") || ["mp3", "wav", "ogg"].includes(ext)) {
      return (
        <div className="preview-audio-container">
          <div className="audio-icon">
            <i className="bx bx-music"></i>
          </div>
          <audio controls className="audio-player">
            <source
              src={`${API_STREAM_BASE_URL}/personalFiles/${file.id}/view-file`}
              type={mimetype}
            />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Video preview
    if (mimetype?.includes("video") || ["mp4", "webm", "ogg"].includes(ext)) {
      return (
        <div className="preview-video-container">
          <video controls className="preview-video">
            <source
              src={`${API_STREAM_BASE_URL}/personalFiles/${file.id}/view-file`}
              type={mimetype}
            />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    // Default - no preview available
    return (
      <div className="preview-empty">
        <i className={`bx ${getFileIcon(mimetype, filename)}`}></i>
        <h5>Preview not available</h5>
        <p className="text-muted mb-3">
          This file type cannot be previewed in the browser
        </p>
      </div>
    );
  };

  const handleDownload = () => {
    window.open(
      `${API_STREAM_BASE_URL}/personalFiles/${file.id}/download-file`,
      "_blank"
    );
  };

  const mimetype = file.file_mime;
  const filename = file.file_filename;
  const ext = filename ? filename.split(".").pop().toLowerCase() : "";
  const isImage = mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext);

  return (
    <Modal 
      isOpen={isOpen} 
      toggle={toggle} 
      size="xl"
      className="file-preview-modal"
      backdrop="static"
      fullscreen
    >
      {/* Header */}
      <div className="file-preview-header bg-body border-bottom">
        <div className="header-left">
          <div className="file-icon-badge bg-light">
            <i className={`bx ${getFileIcon(mimetype, filename)} text-${getFileColor(mimetype, filename)}`}></i>
              </div>
          <div className="file-info">
            <h5 className="file-name mb-1">{file.name || filename || "Untitled"}</h5>
            <div className="file-meta">
              <Badge color={getFileColor(mimetype, filename)} className="me-2">
                {ext ? ext.toUpperCase() : "FILE"}
              </Badge>
              <span className="text-muted">{formatFileSize(file.file_size)}</span>
              <span className="mx-2 text-muted">•</span>
              <span className="text-muted">
                {file.created_at ? new Date(file.created_at).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          {/* Zoom controls for images */}
          {isImage && (
            <div className="zoom-controls bg-light me-3">
              <Button 
                color="light" 
                size="sm" 
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                title="Zoom Out (-)">
                <i className="bx bx-minus"></i>
              </Button>
              <span className="zoom-value">{zoom}%</span>
              <Button 
                color="light" 
                size="sm" 
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Zoom In (+)">
                <i className="bx bx-plus"></i>
              </Button>
              <Button 
                color="light" 
                size="sm" 
                onClick={handleResetZoom}
                className="ms-1"
                title="Reset Zoom">
                <i className="bx bx-reset"></i>
              </Button>
            </div>
          )}
          
          <Button 
            color="primary" 
            size="sm" 
            onClick={handleDownload}
            className="me-2">
            <i className="bx bx-download me-1"></i>
            Download
          </Button>
          <Button 
            color="light" 
            size="sm" 
            onClick={toggle}>
            <i className="bx bx-x"></i>
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="file-preview-body bg-light">
        {loading ? (
          <div className="preview-loading text-muted">
            <Spinner color="primary" />
            <div className="mt-3">Loading preview...</div>
          </div>
        ) : error ? (
          <Alert color="danger" className="m-4">
            <i className="bx bx-error-circle me-2"></i>
            {error}
          </Alert>
        ) : (
          renderPreview()
        )}
      </div>

      {/* Footer hint */}
      <div className="file-preview-footer bg-body border-top">
        <small className="text-muted">
          <i className="bx bx-info-circle me-1"></i>
          Press <kbd>ESC</kbd> to close
          {isImage && (
            <>
              {" • "}
              <kbd>+</kbd> to zoom in
              {" • "}
              <kbd>-</kbd> to zoom out
            </>
          )}
        </small>
      </div>

      {/* Styles */}
      <style jsx>{`
        .file-preview-modal :global(.modal-content) {
          height: 100vh;
          border: none;
          border-radius: 0;
          display: flex;
          flex-direction: column;
        }

        .file-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .file-icon-badge {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .file-icon-badge i {
          font-size: 24px;
        }

        .file-info {
          min-width: 0;
          flex: 1;
        }

        .file-name {
          font-size: 1.1rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-meta {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .zoom-value {
          min-width: 50px;
          text-align: center;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .file-preview-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .preview-loading {
          text-align: center;
        }

        .preview-empty {
          text-align: center;
          padding: 3rem;
        }

        .preview-empty i {
          font-size: 80px;
          color: var(--bs-secondary-color);
          opacity: 0.5;
          margin-bottom: 1.5rem;
        }

        .preview-empty h5 {
          margin-bottom: 0.5rem;
        }

        .preview-image-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          padding: 2rem;
        }

        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          background: var(--bs-body-bg);
        }

        .preview-pdf-container,
        .preview-text-container {
          width: 100%;
          height: 100%;
          padding: 1rem;
        }

        .preview-iframe {
          width: 100%;
          height: 100%;
          border: 1px solid var(--bs-border-color);
          border-radius: 8px;
          background: var(--bs-body-bg);
        }

        .preview-video-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .preview-video {
          max-width: 100%;
          max-height: 100%;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .preview-audio-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }

        .audio-icon {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .audio-icon i {
          font-size: 60px;
          color: white;
        }

        .audio-player {
          width: 100%;
          max-width: 500px;
        }

        .file-preview-footer {
          padding: 0.75rem 1.5rem;
          text-align: center;
          flex-shrink: 0;
        }

        kbd {
          background-color: var(--bs-tertiary-bg);
          border: 1px solid var(--bs-border-color);
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--bs-body-color);
        }

        @media (max-width: 768px) {
          .file-preview-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .zoom-controls {
            flex: 1;
          }

          .file-name {
            font-size: 1rem;
          }
        }

        /* Dark mode specific adjustments */
        [data-bs-theme="dark"] .preview-image {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        [data-bs-theme="dark"] .preview-video {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </Modal>
  );
};

export default FilePreview;
