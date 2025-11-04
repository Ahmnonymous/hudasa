import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Progress,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser } from "../../helpers/userStorage";

const FileModal = ({
  isOpen,
  toggle,
  editItem,
  folders,
  currentFolder,
  onUpdate,
  showAlert,
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      folder_id: "",
      file: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: editItem?.name || "",
        folder_id: editItem?.folder_id || currentFolder || "",
        file: null,
      });
      setSelectedFile(null);
      setUploadProgress(0);
    }
  }, [editItem, currentFolder, isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      
      // Validate user session
      if (!currentUser) {
        showAlert("User session expired. Please login again.", "danger");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      formData.append("name", data.name);
      
      // Only append folder_id if it has a value
      if (data.folder_id) {
        formData.append("folder_id", data.folder_id);
      }
      
      // Only append employee_id if it has a value
      if (currentUser?.id) {
        formData.append("employee_id", currentUser.id);
      }
      
      // Backend will handle App Admin (null center_id)
      if (currentUser?.center_id) {
        formData.append("center_id", currentUser.center_id);
      }

      if (editItem) {
        formData.append("updated_by", currentUser?.username || "system");
      } else {
        formData.append("created_by", currentUser?.username || "system");
      }

      // Add file if selected
      if (data.file && data.file.length > 0) {
        formData.append("file", data.file[0]);
      } else if (!editItem) {
        showAlert("Please select a file to upload", "warning");
        return;
      }

      if (editItem) {
        await axiosApi.put(`${API_BASE_URL}/personalFiles/${editItem.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        });
        showAlert("File has been updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/personalFiles`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        });
        showAlert("File has been uploaded successfully", "success");
      }

      onUpdate();
      toggle();
    } catch (error) {
      console.error("Error saving file:", error);
      
      // Provide specific error messages
      let errorMessage = editItem ? "Failed to update file" : "Failed to upload file";
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error types
      if (errorMessage.includes("File too large")) {
        errorMessage = "File size exceeds the maximum limit. Please select a smaller file.";
      } else if (errorMessage.includes("duplicate")) {
        errorMessage = "A file with this name already exists in this folder.";
      } else if (errorMessage.includes("invalid input syntax")) {
        errorMessage = "Invalid data format. Please check all fields.";
      }
      
      showAlert(errorMessage, "danger");
    } finally {
      setUploadProgress(0);
    }
  };


  const handleFileChange = (e, onChange) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      onChange(e.target.files);
      
      // Auto-populate filename if name field is empty
      const currentName = watch("name");
      if (!currentName || currentName.trim() === "") {
        // Extract filename without extension
        const filename = file.name.split('.').slice(0, -1).join('.') || file.name;
        setValue("name", filename);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" size="lg">
      <ModalHeader toggle={toggle}>
        <i className={`bx ${editItem ? "bx-edit" : "bx-upload"} me-2`}></i>
        {editItem ? "Edit" : "Upload"} File
      </ModalHeader>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          <FormGroup>
            <Label for="name">
              File Name <span className="text-danger">*</span>
            </Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "File name is required" }}
              render={({ field }) => (
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter file name"
                  invalid={!!errors.name}
                  {...field}
                />
              )}
            />
            {errors.name && <FormFeedback>{errors.name.message}</FormFeedback>}
          </FormGroup>

          <FormGroup>
            <Label for="folder_id">Folder</Label>
            <Controller
              name="folder_id"
              control={control}
              render={({ field }) => (
                <Input id="folder_id" type="select" {...field}>
                  <option value="">Root (No Folder)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </Input>
              )}
            />
          </FormGroup>

          <FormGroup>
            <Label for="file">
              {editItem ? "Replace File (Optional)" : "Select File"}{" "}
              {!editItem && <span className="text-danger">*</span>}
            </Label>
            <Controller
              name="file"
              control={control}
              rules={
                !editItem
                  ? { required: "Please select a file to upload" }
                  : {}
              }
              render={({ field: { onChange, value, ...field } }) => (
                <Input
                  id="file"
                  type="file"
                  invalid={!!errors.file}
                  onChange={(e) => handleFileChange(e, onChange)}
                  {...field}
                />
              )}
            />
            {errors.file && <FormFeedback>{errors.file.message}</FormFeedback>}
            
            <small className="text-muted">
              {editItem 
                ? "Upload a new file to replace the existing one (optional). The filename will update the File Name field automatically." 
                : "Select a file to upload. The filename will auto-populate the File Name field."}
            </small>
            
            {selectedFile && (
              <div className="mt-2 p-2 border rounded bg-success-subtle">
                <div className="d-flex align-items-center">
                  <i className="bx bx-check-circle font-size-24 text-success me-2"></i>
                  <div className="flex-grow-1">
                    <div className="fw-medium text-success">{selectedFile.name}</div>
                    <small className="text-muted">
                      {formatFileSize(selectedFile.size)} • Ready to upload
                    </small>
                  </div>
                </div>
              </div>
            )}

            {editItem && editItem.file_filename && !selectedFile && (
              <div className="mt-2 p-2 border rounded bg-light">
                <div className="d-flex align-items-center">
                  <i className="bx bx-file font-size-24 text-primary me-2"></i>
                  <div className="flex-grow-1">
                    <div className="fw-medium">{editItem.file_filename}</div>
                    <small className="text-muted">
                      {formatFileSize(editItem.file_size)} • Current file
                    </small>
                  </div>
                </div>
              </div>
            )}
          </FormGroup>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <FormGroup>
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="mb-2">
                {uploadProgress}%
              </Progress>
            </FormGroup>
          )}
        </ModalBody>

        <ModalFooter>
          <div className="d-flex gap-2 w-100 justify-content-end">
            <Button
              color="light"
              onClick={toggle}
              disabled={isSubmitting}
              className="me-2"
            >
              <i className="bx bx-x me-1"></i> Cancel
            </Button>
            <Button 
              color="success" 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  {editItem ? "Updating..." : "Uploading..."}
                </>
              ) : (
                <>
                  <i className={`bx ${editItem ? "bx-save" : "bx-upload"} me-1`}></i>{" "}
                  {editItem ? "Save" : "Upload"}
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default FileModal;

