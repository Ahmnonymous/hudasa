import React, { useEffect } from "react";
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
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";

const FolderModal = ({
  isOpen,
  toggle,
  editItem,
  folders,
  currentFolder,
  onUpdate,
  showAlert,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      parent_id: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: editItem?.name || "",
        parent_id: editItem?.parent_id || currentFolder || "",
      });
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

      const payload = {
        name: data.name,
        parent_id: data.parent_id && data.parent_id !== "" ? parseInt(data.parent_id) : null,
        employee_id: currentUser?.id || null,
        center_id: currentUser?.center_id, // Backend will handle App Admin (null center_id)
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/folders/${editItem.id}`, payload);
        showAlert("Folder has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/folders`, payload);
        showAlert("Folder has been created successfully", "success");
      }

      onUpdate();
      toggle();
    } catch (error) {
      console.error("Error saving folder:", error);
      
      // Provide specific error messages
      let errorMessage = editItem ? "Failed to update folder" : "Failed to create folder";
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error types
      if (errorMessage.includes("duplicate") || errorMessage.includes("unique constraint")) {
        errorMessage = "A folder with this name already exists in this location.";
      } else if (errorMessage.includes("invalid input syntax")) {
        errorMessage = "Invalid data format. Please check the folder name.";
      } else if (errorMessage.includes("foreign key constraint")) {
        errorMessage = "Invalid parent folder selected.";
      }
      
      showAlert(errorMessage, "danger");
    }
  };


  // Get available parent folders (excluding current folder and its descendants)
  const getAvailableParentFolders = () => {
    if (!editItem) return folders;

    // Function to get all descendant IDs
    const getDescendantIds = (folderId, allFolders) => {
      const descendants = new Set([folderId]);
      const children = allFolders.filter(f => f.parent_id === folderId);
      children.forEach(child => {
        const childDescendants = getDescendantIds(child.id, allFolders);
        childDescendants.forEach(id => descendants.add(id));
      });
      return descendants;
    };

    const excludeIds = getDescendantIds(editItem.id, folders);
    return folders.filter(f => !excludeIds.has(f.id));
  };

  const availableFolders = getAvailableParentFolders();

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" size="md">
      <ModalHeader toggle={toggle}>
        <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
        {editItem ? "Edit" : "Add New"} Folder
      </ModalHeader>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          <FormGroup>
            <Label for="name">
              Folder Name <span className="text-danger">*</span>
            </Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Folder name is required" }}
              render={({ field }) => (
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter folder name"
                  invalid={!!errors.name}
                  {...field}
                />
              )}
            />
            {errors.name && <FormFeedback>{errors.name.message}</FormFeedback>}
          </FormGroup>

          <FormGroup>
            <Label for="parent_id">Parent Folder</Label>
            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <Input id="parent_id" type="select" {...field}>
                  <option value="">Root (No Parent)</option>
                  {availableFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </Input>
              )}
            />
            <small className="text-muted">
              Select a parent folder to create a subfolder
            </small>
          </FormGroup>
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
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bx bx-save me-1"></i> Save
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default FolderModal;

