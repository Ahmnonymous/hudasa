import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
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
  Alert,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";

const LookupDialog = ({
  isOpen,
  toggle,
  onSave,
  onDelete,
  editItem = null,
  tableName,
}) => {
  const [alert, setAlert] = useState(null); // { color: 'success', message: '' }
  const nameInputRef = useRef(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: editItem?.name || "" });
      // Focus the input after a short delay to ensure modal is fully rendered
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [editItem, isOpen, reset]);

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000); // auto dismiss after 4s
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
      case "primary":
        return "mdi mdi-bullseye-arrow";
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
      case "primary":
        return "#cce5ff";
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
      case "primary":
        return "#b8daff";
      default:
        return "#dee2e6";
    }
  };

  const onSubmit = async (data) => {
    try {
      await onSave(data);
      showAlert(
        `${tableName} has been ${editItem ? "updated" : "added"} successfully.`,
        editItem ? "success" : "primary"
      );
      reset({ name: "" });
      toggle();
    } catch (err) {
      showAlert(err?.message || "Operation failed", "danger");
    }
  };

  const handleDeleteClick = async () => {
    if (!editItem || !onDelete) return;
    try {
      await onDelete(editItem);
      showAlert(`${tableName} has been deleted successfully.`, "danger");
      reset({ name: "" });
      toggle();
    } catch (err) {
      showAlert(err?.message || "Delete failed", "danger");
    }
  };

  const handleClose = () => {
    reset({ name: "" });
    toggle();
  };

  return (
    <>
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
              color: '#000'
            }}
          >
            <i className={`${getAlertIcon(alert.color)} me-2`}></i>
            {alert.message}
          </Alert>
        </div>
      )}

      <Modal isOpen={isOpen} toggle={handleClose} centered size="md" backdrop="static">
        <ModalHeader toggle={handleClose}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add New"} {tableName}
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <FormGroup>
              <Label for="name">
                Name <span className="text-danger">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: "Name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                  maxLength: { value: 100, message: "Name must not exceed 100 characters" },
                  pattern: {
                    value: /^[a-zA-Z0-9\s\-_.,()]+$/,
                    message: "Name contains invalid characters",
                  },
                }}
                render={({ field }) => (
                  <Input
                    id="name"
                    placeholder="Enter name"
                    invalid={!!errors.name}
                    innerRef={nameInputRef}
                    {...field}
                  />
                )}
              />
              {errors.name && <FormFeedback>{errors.name.message}</FormFeedback>}
            </FormGroup>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editItem && (
                <Button color="danger" onClick={handleDeleteClick} disabled={isSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button color="light" onClick={handleClose} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x label-icon"></i> Cancel
              </Button>

              <Button color="success" type="submit" disabled={isSubmitting}>
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
    </>
  );
};

LookupDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  editItem: PropTypes.object,
  tableName: PropTypes.string.isRequired,
};

export default LookupDialog;
