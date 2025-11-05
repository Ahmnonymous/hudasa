import React, { useState, useEffect, useMemo } from "react";
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
  FormFeedback,
  Row,
  Col,
  Alert,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser } from "../../../../helpers/userStorage";

const SiteVisitsTab = ({ centerId, siteVisits, onUpdate, showAlert, lookupData = {} }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete,
  } = useDeleteConfirmation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  useEffect(() => {
    if (modalOpen) {
      reset({
        representative: editItem?.representative || "",
        date_of_visit: editItem?.date_of_visit || "",
        comments: editItem?.comments || "",
        comments_of_staff: editItem?.comments_of_staff || "",
      });
      setSelectedFile(null);

      // Load employees when opening the modal
      (async () => {
        try {
          setEmployeesLoading(true);
          const res = await axiosApi.get(`${API_BASE_URL}/employee`);
          // Backend enforces tenant filtering. Use as-is.
          setEmployees(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
          console.error("Error fetching employees for representative dropdown:", e);
        } finally {
          setEmployeesLoading(false);
        }
      })();
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setEditItem(null);
      setSelectedFile(null);
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleFileChange = (e, onChange) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onChange(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key !== "uploads" && data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      if (selectedFile) {
        formData.append("uploads", selectedFile);
        formData.append("uploads_filename", selectedFile.name);
        formData.append("uploads_mime", selectedFile.type);
        formData.append("uploads_size", selectedFile.size);
      }

      formData.append("islamic_center_id", centerId);
      formData.append("created_by", currentUser?.username || "system");
      formData.append("updated_by", currentUser?.username || "system");

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/siteVisits/${editItem.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        showAlert("Site visit updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/siteVisits`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Site visit created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving site visit:", error);
      showAlert(
        error.response?.data?.error || "Failed to save site visit",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const visitName = editItem.representative || 'Unknown Representative';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: visitName,
      type: "site visit",
      message: "This site visit will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/siteVisits/${editItem.id}`);
      showAlert("Site visit deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Representative",
        accessorKey: "representative",
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
        header: "Date of Visit",
        accessorKey: "date_of_visit",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Comments",
        accessorKey: "comments",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const comment = cell.getValue() || "";
          return comment.length > 50 ? `${comment.substring(0, 50)}...` : comment || "-";
        },
      },
      {
        header: "Upload",
        accessorKey: "uploads_filename",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const filename = cell.getValue();
          const rowId = cell.row.original.id;
          return filename ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/siteVisits/${rowId}/uploads`}
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
    [handleEdit]
  );

  if (!centerId) {
    return (
      <Alert color="info" className="d-flex align-items-center">
        <i className="bx bx-info-circle font-size-16 me-2"></i>
        Please select an Islamic center to view site visits.
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Site Visits</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Site Visit
          </Button>
        )}
      </div>

      {siteVisits.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No site visits found. Click "Add Site Visit" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={siteVisits}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      <Modal
        isOpen={modalOpen}
        toggle={toggleModal}
        centered
        backdrop="static"
        size="lg"
      >
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Site Visit
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="representative">
                    Representative <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="representative"
                    control={control}
                    rules={{ required: "Representative is required" }}
                    render={({ field }) => (
                      <Input
                        id="representative"
                        type="select"
                        invalid={!!errors.representative}
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="" disabled>
                          {employeesLoading ? "Loading employees..." : "Select representative"}
                        </option>
                        {employees.map((emp) => {
                          const label = [emp.name, emp.surname].filter(Boolean).join(" ");
                          const value = label || emp.username || String(emp.id || "");
                          return (
                            <option key={emp.id || value} value={value}>
                              {label || value}
                            </option>
                          );
                        })}
                      </Input>
                    )}
                  />
                  {errors.representative && <FormFeedback>{errors.representative.message}</FormFeedback>}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="date_of_visit">Date of Visit</Label>
                  <Controller
                    name="date_of_visit"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="date_of_visit"
                        type="date"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="comments">Comments</Label>
                  <Controller
                    name="comments"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="comments"
                        type="textarea"
                        rows="3"
                        placeholder="Enter comments"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="comments_of_staff">Staff Comments</Label>
                  <Controller
                    name="comments_of_staff"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="comments_of_staff"
                        type="textarea"
                        rows="3"
                        placeholder="Enter staff comments"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="uploads">
                    {editItem ? "Replace Upload (Optional)" : "Upload Document"}
                  </Label>
                  <Controller
                    name="uploads"
                    control={control}
                    render={({ field: { onChange, ...field } }) => (
                      <Input
                        id="uploads"
                        type="file"
                        disabled={isOrgExecutive}
                        onChange={(e) => handleFileChange(e, onChange)}
                        {...field}
                      />
                    )}
                  />
                  {selectedFile && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{selectedFile.name}</div>
                          <small className="text-muted">
                            {formatFileSize(selectedFile.size)} • Selected file
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  {editItem?.uploads_filename && !selectedFile && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.uploads_filename || "uploads"}</div>
                          <small className="text-muted">
                            {editItem.uploads_size ? formatFileSize(editItem.uploads_size) : ""} • Current file
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
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
        title="Delete Site Visit"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default SiteVisitsTab;

