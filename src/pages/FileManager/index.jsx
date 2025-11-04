import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser } from "../../helpers/userStorage";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import DeleteConfirmationModal from "../../components/Common/DeleteConfirmationModal";

// Import Components
import FolderTree from "./FolderTree";
import FileList from "./FileList";
import FileModal from "./FileModal";
import FolderModal from "./FolderModal";
import FilePreview from "./FilePreview";
import "./FileManager.css";

const FileManager = () => {
  // State management
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Edit states
  const [editFile, setEditFile] = useState(null);
  const [editFolder, setEditFolder] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Alert state
  const [alert, setAlert] = useState(null);

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  // Meta title
  document.title = "File Manager | Hudasa";

  // Fetch folders and files on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentUser = getHudasaUser();
      
      // Fetch folders and files in parallel
      const [foldersResponse, filesResponse] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/folders`),
        axiosApi.get(`${API_BASE_URL}/personalFiles`)
      ]);

      // ✅ Backend now handles filtering - App Admin sees all, others see only their center
      // No frontend filtering needed (backend enforces it)
      setFolders(foldersResponse.data);
      setFiles(filesResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Failed to load files and folders", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  const getAlertIcon = (color) => {
    switch (color) {
      case "success":
        return "mdi mdi-check-all";
      case "danger":
        return "mdi mdi-block-helper";
      case "warning":
        return "mdi mdi-alert-outline";
      case "info":
        return "mdi mdi-alert-circle-outline";
      default:
        return "mdi mdi-information";
    }
  };

  const getAlertBackground = (color) => {
    switch (color) {
      case "success":
        return "#d4edda";
      case "danger":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      case "info":
        return "#d1ecf1";
      default:
        return "#f8f9fa";
    }
  };

  const getAlertBorder = (color) => {
    switch (color) {
      case "success":
        return "#c3e6cb";
      case "danger":
        return "#f5c6cb";
      case "warning":
        return "#ffeaa7";
      case "info":
        return "#bee5eb";
      default:
        return "#dee2e6";
    }
  };

  // Folder handlers
  const handleCreateFolder = () => {
    setEditFolder(null);
    setFolderModalOpen(true);
  };

  const handleEditFolder = (folder) => {
    setEditFolder(folder);
    setFolderModalOpen(true);
  };

  const handleDeleteFolder = (folder) => {
    showDeleteConfirmation(
      {
        id: folder.id,
        name: folder.name,
        type: "folder",
        message: "This folder will be permanently removed. All files in this folder will be moved to root."
      },
      async () => {
        try {
          await axiosApi.delete(`${API_BASE_URL}/folders/${folder.id}`);
          showAlert("Folder deleted successfully", "success");
          fetchData();
          // If current folder was deleted, go back to root
          if (currentFolder === folder.id) {
            setCurrentFolder(null);
          }
        } catch (error) {
          console.error("Error deleting folder:", error);
          showAlert(error?.response?.data?.message || "Failed to delete folder", "danger");
          throw error; // Re-throw to prevent modal from closing
        }
      }
    );
  };

  const handleFolderSelect = (folderId) => {
    setCurrentFolder(folderId);
  };

  // File handlers
  const handleCreateFile = () => {
    setEditFile(null);
    setFileModalOpen(true);
  };

  const handleEditFile = (file) => {
    setEditFile(file);
    setFileModalOpen(true);
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setPreviewModalOpen(true);
  };

  const handleDeleteFile = (file) => {
    const fileName = file.name || file.file_filename || `File #${file.id}`;
    showDeleteConfirmation(
      {
        id: file.id,
        name: fileName,
        type: "file",
        message: "This file will be permanently removed from the system."
      },
      async () => {
        try {
          await axiosApi.delete(`${API_BASE_URL}/personalFiles/${file.id}`);
          showAlert("File deleted successfully", "success");
          fetchData();
        } catch (error) {
          console.error("Error deleting file:", error);
          showAlert(error?.response?.data?.message || "Failed to delete file", "danger");
          throw error; // Re-throw to prevent modal from closing
        }
      }
    );
  };

  // Get files for current folder
  const getCurrentFiles = () => {
    return files.filter(file => {
      // Normalize values for comparison
      const fileFolderId = file.folder_id === undefined || 
                           file.folder_id === null || 
                           file.folder_id === "" ? null : file.folder_id;
      
      const normalizedCurrentFolder = currentFolder === undefined || 
                                       currentFolder === null || 
                                       currentFolder === "" ? null : currentFolder;
      
      if (normalizedCurrentFolder === null) {
        return fileFolderId === null;
      }
      
      return fileFolderId == normalizedCurrentFolder;
    });
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Apps" breadcrumbItem="File Manager" />

          {/* Alert Notification - Top Right */}
          {alert && (
            <div
              className="position-fixed top-0 end-0 p-3"
              style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
            >
              <Alert
                color={alert.color}
                isOpen={!!alert}
                toggle={() => setAlert(null)}
                className="alert-dismissible fade show shadow-lg"
                role="alert"
                style={{
                  opacity: 1,
                  backgroundColor: getAlertBackground(alert.color),
                  border: `1px solid ${getAlertBorder(alert.color)}`,
                  color: "#000",
                }}
              >
                <i className={`${getAlertIcon(alert.color)} me-2`}></i>
                {alert.message}
              </Alert>
            </div>
          )}

          <Row>
            {/* Folder Tree - Left Sidebar */}
            <Col xl={3} lg={4} md={5}>
              <FolderTree
                folders={folders}
                currentFolder={currentFolder}
                onFolderSelect={handleFolderSelect}
                onCreateFolder={handleCreateFolder}
                onEditFolder={handleEditFolder}
                onDeleteFolder={handleDeleteFolder}
                loading={loading}
              />
            </Col>

            {/* File List - Main Content */}
            <Col xl={9} lg={8} md={7}>
              <FileList
                folders={folders}
                files={getCurrentFiles()}
                currentFolder={currentFolder}
                onCreateFile={handleCreateFile}
                onEditFile={handleEditFile}
                onPreviewFile={handlePreviewFile}
                onDeleteFile={handleDeleteFile}
                onFolderSelect={handleFolderSelect}
                loading={loading}
              />
            </Col>
          </Row>

          {/* Modals */}
          <FileModal
            isOpen={fileModalOpen}
            toggle={() => setFileModalOpen(!fileModalOpen)}
            editItem={editFile}
            folders={folders}
            currentFolder={currentFolder}
            onUpdate={fetchData}
            showAlert={showAlert}
          />

          <FolderModal
            isOpen={folderModalOpen}
            toggle={() => setFolderModalOpen(!folderModalOpen)}
            editItem={editFolder}
            folders={folders}
            currentFolder={currentFolder}
            onUpdate={fetchData}
            showAlert={showAlert}
          />

          <FilePreview
            isOpen={previewModalOpen}
            toggle={() => setPreviewModalOpen(!previewModalOpen)}
            file={previewFile}
          />

          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            toggle={hideDeleteConfirmation}
            onConfirm={confirmDelete}
            itemName={deleteItem?.name}
            itemType={deleteItem?.type}
            message={deleteItem?.message}
            loading={deleteLoading}
          />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default FileManager;
