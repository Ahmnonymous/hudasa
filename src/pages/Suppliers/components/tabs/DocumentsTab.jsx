import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import axiosApi from "../../../../helpers/api_helper";
import { useRole } from "../../../../helpers/useRole";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const DocumentsTab = ({ supplierId, documents, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  useEffect(() => {
    if (modalOpen) {
      reset({
        Doc_Type: editItem?.doc_type || "",
        Issued_At: editItem?.issued_at ? editItem.issued_at.split('T')[0] : "",
        Description: editItem?.description || "",
        File: null,
      });
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      setEditItem(null);
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    // Allow Org Executive to view (open modal) but they'll only see Cancel button
    setEditItem(item);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();

      // Check if file is being uploaded
      const hasFile = data.File && data.File.length > 0;

      if (hasFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("supplier_id", supplierId);
        formData.append("doc_type", data.Doc_Type);
        formData.append("issued_at", data.Issued_At || "");
        formData.append("description", data.Description);

        if (hasFile) {
          formData.append("file", data.File[0]);
        }

        if (editItem) {
          formData.append("updated_by", currentUser?.username || "system");
          await axiosApi.put(`${API_BASE_URL}/supplierDocument/${editItem.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          formData.append("created_by", currentUser?.username || "system");
          await axiosApi.post(`${API_BASE_URL}/supplierDocument`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Use JSON for regular update/create without file
        const payload = {
          supplier_id: supplierId,
          doc_type: data.Doc_Type,
          issued_at: data.Issued_At || null,
          description: data.Description,
        };

        if (editItem) {
          payload.updated_by = getAuditName();
          await axiosApi.put(`${API_BASE_URL}/supplierDocument/${editItem.id}`, payload);
        } else {
          payload.created_by = getAuditName();
          await axiosApi.post(`${API_BASE_URL}/supplierDocument`, payload);
        }
      }

      showAlert(
        editItem ? "Document has been updated successfully" : "Document has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving document:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const documentName = `${editItem.doc_type || 'Unknown Type'} - ${editItem.description || 'No Description'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: documentName,
      type: "document",
      message: "This document will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/supplierDocument/${editItem.id}`);
      showAlert("Document has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Document Type",
        accessorKey: "doc_type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => (
          <span
            style={{ cursor: "pointer", color: "inherit" }}
            onClick={() => handleEdit(cell.row.original)}
            onMouseOver={(e) => {
              e.currentTarget.classList.add('text-primary', 'text-decoration-underline');
            }}
            onMouseOut={(e) => {
              e.currentTarget.classList.remove('text-primary', 'text-decoration-underline');
            }}
          >
            {cell.getValue() || "-"}
          </span>
        ),
      },
      {
        header: "Issued Date",
        accessorKey: "issued_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const description = cell.getValue() || "";
          return description.length > 50 ? `${description.substring(0, 50)}...` : description || "-";
        },
      },
      {
        header: "File",
        accessorKey: "file_filename",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const filename = cell.getValue();
          const rowId = cell.row.original.id;
          return filename ? (
            <div className="d-flex justify-content-center gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/supplierDocument/${rowId}/view-file`}
                target="_blank"
                rel="noopener noreferrer"
                title="View"
              >
                <i
                  className="bx bx-show text-success"
                  style={{ cursor: "pointer", fontSize: "16px" }}
                ></i>
              </a>
            </div>
          ) : (
            "-"
          );
        },
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created On",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
      {
        header: "Updated By",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated On",
        accessorKey: "updated_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    [isOrgExecutive]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Documents</h5>
        {/* Hide Add button for Org Executive (view-only) */}
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Document
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No documents found. Click "Add Document" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={documents}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Document
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Doc_Type">
                    Document Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Doc_Type"
                    control={control}
                    rules={{ required: "Document type is required" }}
                    render={({ field }) => (
                      <Input id="Doc_Type" type="text" invalid={!!errors.Doc_Type} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Doc_Type && <FormFeedback>{errors.Doc_Type.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Issued_At">Issued Date <span className="text-danger">*</span></Label>
                  <Controller
                    name="Issued_At"
                    control={control}
                    rules={{ required: "Issued date is required" }}
                    render={({ field }) => (
                      <Input id="Issued_At" type="date" invalid={!!errors.Issued_At} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Issued_At && <FormFeedback>{errors.Issued_At.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Description">Description</Label>
                  <Controller
                    name="Description"
                    control={control}
                    render={({ field }) => <Input id="Description" type="textarea" rows="5" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="File">File Upload</Label>
                  <Controller
                    name="File"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="File"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.File}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.File && <FormFeedback>{errors.File.message}</FormFeedback>}
                  {editItem && editItem.file_filename && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.file_filename || "file"}</div>
                          <small className="text-muted">
                            {formatFileSize(editItem.file_size)} • Current file
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  <small className="text-muted d-block mt-1">
                    Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                  </small>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {/* Hide Delete button for Org Executive (view-only) */}
              {editItem && !isOrgExecutive && (
                <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              {/* Hide Save button for Org Executive (view-only) */}
              {!isOrgExecutive && (
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
              )}
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default DocumentsTab;