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
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const AuditsTab = ({ centerId, audits, lookupData, onUpdate, showAlert }) => {
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
        Audit_Date: editItem?.audit_date ? editItem.audit_date.split('T')[0] : "",
        Audit_Type: editItem?.audit_type || "",
        Findings: editItem?.findings || "",
        Recommendations: editItem?.recommendations || "",
        Conducted_By: editItem?.conducted_by || "",
        Attachments: null,
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
    setEditItem(item);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();

      // Check if file is being uploaded
      const hasFile = data.Attachments && data.Attachments.length > 0;

      if (hasFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("center_id", centerId);
        formData.append("audit_date", data.Audit_Date);
        formData.append("audit_type", data.Audit_Type);
        formData.append("findings", data.Findings || "");
        formData.append("recommendations", data.Recommendations || "");
        formData.append("conducted_by", data.Conducted_By || "");

        if (hasFile) {
          formData.append("attachments", data.Attachments[0]);
        }

        if (editItem) {
          formData.append("updated_by", currentUser?.username || "system");
          await axiosApi.put(`${API_BASE_URL}/centerAudits/${editItem.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          formData.append("created_by", currentUser?.username || "system");
          await axiosApi.post(`${API_BASE_URL}/centerAudits`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Use JSON for regular update/create without file
        const payload = {
          center_id: centerId,
          audit_date: data.Audit_Date,
          audit_type: data.Audit_Type,
          findings: data.Findings || null,
          recommendations: data.Recommendations || null,
          conducted_by: data.Conducted_By || null,
        };

        if (editItem) {
          payload.updated_by = getAuditName();
          await axiosApi.put(`${API_BASE_URL}/centerAudits/${editItem.id}`, payload);
        } else {
          payload.created_by = getAuditName();
          await axiosApi.post(`${API_BASE_URL}/centerAudits`, payload);
        }
      }

      showAlert(
        editItem ? "Audit has been updated successfully" : "Audit has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving audit:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const auditName = `${editItem.audit_type || 'Unknown Type'} - ${editItem.audit_date || 'Unknown Date'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: auditName,
      type: "audit",
      message: "This audit will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/centerAudits/${editItem.id}`);
      showAlert("Audit has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Audit Date",
        accessorKey: "audit_date",
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
            {cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : "-"}
          </span>
        ),
      },
      {
        header: "Audit Type",
        accessorKey: "audit_type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Findings",
        accessorKey: "findings",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const findings = cell.getValue() || "";
          return findings.length > 50 ? `${findings.substring(0, 50)}...` : findings || "-";
        },
      },
      {
        header: "Conducted By",
        accessorKey: "conducted_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Attachment",
        accessorKey: "attachments_filename",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const filename = cell.getValue();
          const rowId = cell.row.original.id;
          return filename ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/centerAudits/${rowId}/view-attachment`}
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
    []
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Audits</h5>
        <Button color="primary" size="sm" onClick={handleAdd}>
          <i className="bx bx-plus me-1"></i> Add Audit
        </Button>
      </div>

      {audits.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No audits found. Click "Add Audit" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={audits}
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
          {editItem ? "Edit" : "Add"} Audit
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Audit_Date">
                    Audit Date <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Audit_Date"
                    control={control}
                    rules={{ required: "Audit date is required" }}
                    render={({ field }) => (
                      <Input id="Audit_Date" type="date" invalid={!!errors.Audit_Date} {...field} />
                    )}
                  />
                  {errors.Audit_Date && <FormFeedback>{errors.Audit_Date.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Audit_Type">
                    Audit Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Audit_Type"
                    control={control}
                    rules={{ required: "Audit type is required" }}
                    render={({ field }) => (
                      <Input id="Audit_Type" type="text" invalid={!!errors.Audit_Type} {...field} />
                    )}
                  />
                  {errors.Audit_Type && <FormFeedback>{errors.Audit_Type.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Conducted_By">Conducted By</Label>
                  <Controller
                    name="Conducted_By"
                    control={control}
                    render={({ field }) => (
                      <Input id="Conducted_By" type="text" {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Findings">Findings</Label>
                  <Controller
                    name="Findings"
                    control={control}
                    render={({ field }) => <Input id="Findings" type="textarea" rows="5" {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Recommendations">Recommendations</Label>
                  <Controller
                    name="Recommendations"
                    control={control}
                    render={({ field }) => <Input id="Recommendations" type="textarea" rows="5" {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Attachments">Attachment Upload</Label>
                  <Controller
                    name="Attachments"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="Attachments"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.Attachments}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        {...field}
                      />
                    )}
                  />
                  {errors.Attachments && <FormFeedback>{errors.Attachments.message}</FormFeedback>}
                  {editItem && editItem.attachments_filename && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.attachments_filename || "file"}</div>
                          <small className="text-muted">
                            {formatFileSize(editItem.attachments_size)} • Current file
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
              {editItem && (
                <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Audit"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default AuditsTab;

