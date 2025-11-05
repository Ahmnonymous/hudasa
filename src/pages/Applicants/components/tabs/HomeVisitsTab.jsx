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
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getAuditName } from "../../../../helpers/userStorage";

const HomeVisitsTab = ({ applicantId, homeVisits, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

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
        Visit_Date: editItem?.visit_date || "",
        Representative: editItem?.representative || "",
        Home_Visit_Type: editItem?.home_visit_type || "",
        Short_Term: editItem?.short_term || "",
        Medium_Term: editItem?.medium_term || "",
        Long_Term: editItem?.long_term || "",
        Comments: editItem?.comments || "",
        Attachment_1: null,
        Attachment_2: null,
      });

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

      // Check if any attachment is being uploaded
      const hasAttachment1 = data.Attachment_1 && data.Attachment_1.length > 0;
      const hasAttachment2 = data.Attachment_2 && data.Attachment_2.length > 0;

      if (hasAttachment1 || hasAttachment2) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("file_id", applicantId);
        formData.append("visit_date", data.Visit_Date || "");
        formData.append("representative", data.Representative);
        formData.append("home_visit_type", data.Home_Visit_Type ? parseInt(data.Home_Visit_Type) : null);
        formData.append("short_term", data.Short_Term || "");
        formData.append("medium_term", data.Medium_Term || "");
        formData.append("long_term", data.Long_Term || "");
        formData.append("comments", data.Comments);

        if (hasAttachment1) {
          formData.append("attachment_1", data.Attachment_1[0]);
        }
        if (hasAttachment2) {
          formData.append("attachment_2", data.Attachment_2[0]);
        }

        if (editItem) {
          formData.append("updated_by", getAuditName());
          await axiosApi.put(`${API_BASE_URL}/homeVisit/${editItem.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          formData.append("created_by", getAuditName());
          await axiosApi.post(`${API_BASE_URL}/homeVisit`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Use JSON for regular update/create without file
        const payload = {
          file_id: applicantId,
          visit_date: data.Visit_Date || null,
          representative: data.Representative,
          home_visit_type: data.Home_Visit_Type ? parseInt(data.Home_Visit_Type) : null,
          short_term: data.Short_Term || "",
          medium_term: data.Medium_Term || "",
          long_term: data.Long_Term || "",
          comments: data.Comments,
        };

        if (editItem) {
          payload.updated_by = getAuditName();
          await axiosApi.put(`${API_BASE_URL}/homeVisit/${editItem.id}`, payload);
        } else {
          payload.created_by = getAuditName();
          await axiosApi.post(`${API_BASE_URL}/homeVisit`, payload);
        }
      }

      showAlert(
        editItem ? "Home visit has been updated successfully" : "Home visit has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving home visit:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const visitName = `Visit on ${editItem.visit_date || 'Unknown Date'} - ${editItem.visit_purpose || 'Unknown Purpose'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: visitName,
      type: "home visit",
      message: "This home visit record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/homeVisit/${editItem.id}`);
      showAlert("Home visit has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray?.find((l) => l.id == id);
    return item ? item.name : "-";
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
        header: "Visit Date",
        accessorKey: "visit_date",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Visit Type",
        accessorKey: "home_visit_type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(lookupData?.homeVisitTypes, cell.getValue()),
      },
      {
        header: "Short Term Goal",
        accessorKey: "short_term",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const goal = cell.getValue() || "";
          return goal.length > 50 ? `${goal.substring(0, 50)}...` : goal || "-";
        },
      },
      {
        header: "Medium Term Goal",
        accessorKey: "medium_term",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const goal = cell.getValue() || "";
          return goal.length > 50 ? `${goal.substring(0, 50)}...` : goal || "-";
        },
      },
      {
        header: "Long Term Goal",
        accessorKey: "long_term",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const goal = cell.getValue() || "";
          return goal.length > 50 ? `${goal.substring(0, 50)}...` : goal || "-";
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
        header: "Attachment 1",
        accessorKey: "attachment_1",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const attachment = cell.getValue();
          const rowId = cell.row.original.id;
          return attachment ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/homeVisit/${rowId}/view-attachment-1`}
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
        header: "Attachment 2",
        accessorKey: "attachment_2",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const attachment = cell.getValue();
          const rowId = cell.row.original.id;
          return attachment ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/homeVisit/${rowId}/view-attachment-2`}
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
    [lookupData, handleEdit]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Home Visits</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Home Visit
          </Button>
        )}
      </div>

      {homeVisits.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No home visits found. Click "Add Home Visit" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={homeVisits}
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
          {editItem ? "Edit" : "Add"} Home Visit
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Visit_Date">
                    Visit Date <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Visit_Date"
                    control={control}
                    rules={{ required: "Visit date is required" }}
                    render={({ field }) => (
                      <Input id="Visit_Date" type="date" invalid={!!errors.Visit_Date} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Visit_Date && <FormFeedback>{errors.Visit_Date.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Representative">
                    Representative <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Representative"
                    control={control}
                    rules={{ required: "Representative is required" }}
                    render={({ field }) => (
                      <Input
                        id="Representative"
                        type="select"
                        invalid={!!errors.Representative}
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
                  {errors.Representative && <FormFeedback>{errors.Representative.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Home_Visit_Type">Visit Type</Label>
                  <Controller
                    name="Home_Visit_Type"
                    control={control}
                    render={({ field }) => (
                      <Input id="Home_Visit_Type" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Visit Type</option>
                        {(lookupData?.homeVisitTypes || []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Short_Term">Short Term Goal</Label>
                  <Controller
                    name="Short_Term"
                    control={control}
                    render={({ field }) => <Input id="Short_Term" type="textarea" rows="3" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Medium_Term">Medium Term Goal</Label>
                  <Controller
                    name="Medium_Term"
                    control={control}
                    render={({ field }) => <Input id="Medium_Term" type="textarea" rows="3" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Long_Term">Long Term Goal</Label>
                  <Controller
                    name="Long_Term"
                    control={control}
                    render={({ field }) => <Input id="Long_Term" type="textarea" rows="3" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Comments">Comments</Label>
                  <Controller
                    name="Comments"
                    control={control}
                    render={({ field }) => <Input id="Comments" type="textarea" rows="5" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Attachment_1">Attachment 1</Label>
                  <Controller
                    name="Attachment_1"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="Attachment_1"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.Attachment_1}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.Attachment_1 && <FormFeedback>{errors.Attachment_1.message}</FormFeedback>}
                  {editItem && editItem.attachment_1 && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.attachment_1_filename || "attachment_1"}</div>
                          <small className="text-muted">
                            {formatFileSize(editItem.attachment_1_size)} • Current file
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Attachment_2">Attachment 2</Label>
                  <Controller
                    name="Attachment_2"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="Attachment_2"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.Attachment_2}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.Attachment_2 && <FormFeedback>{errors.Attachment_2.message}</FormFeedback>}
                  {editItem && editItem.attachment_2 && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.attachment_2_filename || "attachment_2"}</div>
                          <small className="text-muted">
                            {formatFileSize(editItem.attachment_2_size)} • Current file
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
        title="Delete Home Visit"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default HomeVisitsTab;

