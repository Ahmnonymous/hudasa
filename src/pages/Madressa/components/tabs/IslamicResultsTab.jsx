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
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser } from "../../../../helpers/userStorage";

const IslamicResultsTab = ({ application, islamicResults, onUpdate, showAlert, lookupData = {} }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
    if (editItem && modalOpen) {
      reset({
        grade: editItem.grade || "",
        term: editItem.term || "",
        subject1: editItem.subject1 || "",
        subject1ave: editItem.subject1ave || "",
        subject1name: editItem.subject1name || "",
        subject2: editItem.subject2 || "",
        subject2ave: editItem.subject2ave || "",
        subject2name: editItem.subject2name || "",
        subject3: editItem.subject3 || "",
        subject3ave: editItem.subject3ave || "",
        subject3name: editItem.subject3name || "",
        subject4: editItem.subject4 || "",
        subject4ave: editItem.subject4ave || "",
        subject4name: editItem.subject4name || "",
        subject5: editItem.subject5 || "",
        subject5ave: editItem.subject5ave || "",
        subject5name: editItem.subject5name || "",
        subject6: editItem.subject6 || "",
        subject6ave: editItem.subject6ave || "",
        subject6name: editItem.subject6name || "",
        subject7: editItem.subject7 || "",
        subject7ave: editItem.subject7ave || "",
        subject7name: editItem.subject7name || "",
        subject8: editItem.subject8 || "",
        subject8ave: editItem.subject8ave || "",
        subject8name: editItem.subject8name || "",
        subject9: editItem.subject9 || "",
        subject9ave: editItem.subject9ave || "",
        subject9name: editItem.subject9name || "",
        days_absent: editItem.days_absent || "",
        comments: editItem.comments || "",
      });
      setSelectedFile(null);
    } else if (modalOpen) {
      reset({
        grade: "",
        term: "",
        subject1: "",
        subject1ave: "",
        subject1name: "",
        subject2: "",
        subject2ave: "",
        subject2name: "",
        subject3: "",
        subject3ave: "",
        subject3name: "",
        subject4: "",
        subject4ave: "",
        subject4name: "",
        subject5: "",
        subject5ave: "",
        subject5name: "",
        subject6: "",
        subject6ave: "",
        subject6name: "",
        subject7: "",
        subject7ave: "",
        subject7name: "",
        subject8: "",
        subject8ave: "",
        subject8name: "",
        subject9: "",
        subject9ave: "",
        subject9name: "",
        days_absent: "",
        comments: "",
      });
      setSelectedFile(null);
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

      // Add all text fields
      Object.keys(data).forEach((key) => {
        if (key !== "report_upload" && data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      // Handle file upload
      if (selectedFile) {
        formData.append("report_upload", selectedFile);
        formData.append("report_upload_filename", selectedFile.name);
        formData.append("report_upload_mime", selectedFile.type);
        formData.append("report_upload_size", selectedFile.size);
      }

      formData.append("madressah_app_id", application.id);
      formData.append("created_by", currentUser?.username || "system");
      formData.append("updated_by", currentUser?.username || "system");

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/islamicResults/${editItem.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        showAlert("Islamic results updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/islamicResults`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Islamic results created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving Islamic results:", error);
      showAlert(
        error.response?.data?.error || "Failed to save Islamic results",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const resultName = editItem.term || editItem.grade || 'Islamic Result';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: resultName,
      type: "islamic result",
      message: "This Islamic result will be permanently removed from the system."
    }, async () => {
      try {
        await axiosApi.delete(`${API_BASE_URL}/islamicResults/${editItem.id}`);
        showAlert("Islamic result has been deleted successfully", "success");
      onUpdate();
        if (modalOpen) {
          setModalOpen(false);
        }
    } catch (error) {
        console.error("Error deleting Islamic result:", error);
        showAlert(error?.response?.data?.message || "Failed to delete Islamic result", "danger");
        throw error; // Re-throw so the hook knows there was an error
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Term",
        accessorKey: "term",
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
        header: "Grade",
        accessorKey: "grade",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Days Absent",
        accessorKey: "days_absent",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
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
        header: "Report",
        accessorKey: "report_upload_filename",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const filename = cell.getValue();
          const rowId = cell.row.original.id;
          return filename ? (
            <div className="d-flex justify-content-center gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/islamicResults/${rowId}/view-report`}
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
        <h5 className="mb-0">Islamic Results</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Results
          </Button>
        )}
      </div>

      {islamicResults && islamicResults.length > 0 ? (
         <TableContainer
           columns={columns}
           data={islamicResults || []}
           isGlobalFilter={false}
           isPagination={true}
           isCustomPageSize={true}
           pagination="pagination"
           paginationWrapper="dataTables_paginate paging_simple_numbers"
           tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
         />
       ) : (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No Islamic results found. Click "Add Results" to create one.
        </div>
      )}

      {/* Create/Edit Modal - Similar structure to AcademicResultsTab */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="xl" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Islamic Results
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="grade">Grade</Label>
                  <Controller
                    name="grade"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="grade"
                        type="text"
                        placeholder="e.g., Grade 7"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="term">Term</Label>
                  <Controller
                    name="term"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="term"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select Term</option>
                        {lookupData.terms?.map((term) => (
                          <option key={term.id} value={term.name}>
                            {term.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <hr />
                <h6 className="mb-3">Islamic Subject Results</h6>
              </Col>

              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <React.Fragment key={num}>
                  <Col md={4}>
                    <FormGroup>
                      <Label for={`subject${num}name`}>Subject {num} Name</Label>
                      <Controller
                        name={`subject${num}name`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            id={`subject${num}name`}
                            type="select"
                            disabled={isOrgExecutive}
                            {...field}
                          >
                            <option value="">Select Subject</option>
                            {lookupData.islamicSubjects?.map((subject) => (
                              <option key={subject.id} value={subject.name}>
                                {subject.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <FormGroup>
                      <Label for={`subject${num}`}>Subject {num} Grade</Label>
                      <Controller
                        name={`subject${num}`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            id={`subject${num}`}
                            type="text"
                            placeholder="Grade"
                            disabled={isOrgExecutive}
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <FormGroup>
                      <Label for={`subject${num}ave`}>Subject {num} Average</Label>
                      <Controller
                        name={`subject${num}ave`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            id={`subject${num}ave`}
                            type="text"
                            placeholder="Average"
                            disabled={isOrgExecutive}
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                </React.Fragment>
              ))}

              <Col md={6}>
                <FormGroup>
                  <Label for="days_absent">Days Absent</Label>
                  <Controller
                    name="days_absent"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="days_absent"
                        type="text"
                        placeholder="Days absent"
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
                        rows={3}
                        placeholder="Additional comments"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="report_upload">Report Upload</Label>
                  <Controller
                    name="report_upload"
                    control={control}
                    render={({ field: { onChange, ...field } }) => (
                      <Input
                        id="report_upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, onChange)}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
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
                  {editItem && editItem.report_upload_filename && !selectedFile && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.report_upload_filename}</div>
                          <small className="text-muted">
                            {formatFileSize(editItem.report_upload_size)} • Current file
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
              {editItem && !isOrgExecutive && (
                <Button
                  color="danger"
                  onClick={handleDelete}
                  type="button"
                  disabled={isSubmitting}
                >
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button
                color="light"
                onClick={toggleModal}
                type="button"
                disabled={isSubmitting}
                className="me-2"
              >
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
        title="Delete Islamic Result"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default IslamicResultsTab;

