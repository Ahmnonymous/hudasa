import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
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
  Alert,
  Spinner,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import axiosApi from "../../helpers/api_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../helpers/url_helper";

const PolicyAndProcedure = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [alert, setAlert] = useState(null);
  const nameInputRef = useRef(null);

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  // Lookup data states
  const [policyTypes, setPolicyTypes] = useState([]);
  const [fileStatuses, setFileStatuses] = useState([]);
  const [policyFields, setPolicyFields] = useState([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      Name: "",
      Description: "",
      Type: "",
      Date_Of_Publication: "",
      Status: "",
      Field: "",
      File: null,
    },
  });

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Meta title
  document.title = "Policy and Procedure | Welfare App";

  useEffect(() => {
    fetchPolicies();
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      reset({
        Name: editItem?.name || "",
        Description: editItem?.description || "",
        Type: editItem?.type || "",
        Date_Of_Publication: editItem?.date_of_publication ? editItem.date_of_publication.split('T')[0] : "",
        Status: editItem?.status || "",
        Field: editItem?.field || "",
        File: null,
      });
      // Auto-focus on first input
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [editItem, modalOpen, reset]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/policyAndProcedure`);
      setPolicies(response.data || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      showAlert("Failed to fetch policies", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [typesRes, statusRes, fieldsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Policy_Procedure_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/File_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Policy_Procedure_Field`),
      ]);

      setPolicyTypes(typesRes.data || []);
      setFileStatuses(statusRes.data || []);
      setPolicyFields(fieldsRes.data || []);
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
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
      case "primary":
        return "mdi mdi-information";
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
        return "#cfe2ff";
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
        return "#b6d4fe";
      default:
        return "#dee2e6";
    }
  };

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
      // Get current user from localStorage
      const currentUser = getHudasaUser();
      
      // Convert form fields to lowercase for PostgreSQL
      const payload = {
        name: data.Name,
        description: data.Description || null,
        type: data.Type ? parseInt(data.Type) : null,
        date_of_publication: data.Date_Of_Publication || null,
        status: data.Status ? parseInt(data.Status) : null,
        field: data.Field ? parseInt(data.Field) : null,
      };

      // Add audit fields based on workspace rules
      if (editItem) {
        payload.updated_by = getAuditName();
      } else {
        payload.created_by = getAuditName();
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all payload fields to FormData
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
          formData.append(key, payload[key]);
        }
      });

      // Handle file upload if present
      if (data.File && data.File.length > 0) {
        const file = data.File[0];
        // Validate PDF file type
        if (file.type !== 'application/pdf') {
          showAlert("Only PDF files are allowed", "danger");
          return;
        }
        formData.append('file', file);
      } else if (!editItem) {
        // For new records, file is required
        showAlert("PDF file is required", "danger");
        return;
      }

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/policyAndProcedure/${editItem.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        showAlert("Policy and Procedure has been updated successfully", "success");
      } else {
        await axiosApi.post(
          `${API_BASE_URL}/policyAndProcedure`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        showAlert("Policy and Procedure has been added successfully", "success");
      }
      fetchPolicies();
      toggleModal();
    } catch (error) {
      console.error("Error saving policy:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    showDeleteConfirmation({
      id: editItem.id,
      name: editItem.name || "Unknown Policy",
      type: "policy and procedure",
      message: "This policy and procedure will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/policyAndProcedure/${editItem.id}`);
      showAlert("Policy and Procedure has been deleted successfully", "success");
      fetchPolicies();
      toggleModal();
    });
  };

  // Helper functions to get names from IDs
  const getTypeName = (id) => {
    if (!id) return "-";
    const type = policyTypes.find((t) => t.id == id || t.id === parseInt(id));
    return type ? type.name : `ID: ${id}`;
  };

  const getStatusName = (id) => {
    if (!id) return "-";
    const status = fileStatuses.find((s) => s.id == id || s.id === parseInt(id));
    return status ? status.name : `ID: ${id}`;
  };

  const getFieldName = (id) => {
    if (!id) return "-";
    const field = policyFields.find((f) => f.id == id || f.id === parseInt(id));
    return field ? field.name : `ID: ${id}`;
  };

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => (
          <span
            style={{ cursor: "default", color: "inherit", textDecoration: "none" }}
            onClick={() => handleEdit(cell.row.original)}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#0d6efd";
              e.currentTarget.style.textDecoration = "underline";
              e.currentTarget.style.cursor = "pointer";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "inherit";
              e.currentTarget.style.textDecoration = "none";
              e.currentTarget.style.cursor = "default";
            }}
          >
            {cell.getValue()}
          </span>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Type",
        accessorKey: "type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getTypeName(cell.getValue()),
      },
      {
        header: "Publication Date",
        accessorKey: "date_of_publication",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getStatusName(cell.getValue()),
      },
      {
        header: "Field",
        accessorKey: "field",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getFieldName(cell.getValue()),
      },
      {
        header: "File",
        accessorKey: "file_filename",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const filename = cell.getValue();
          const row = cell.row.original;
          if (filename) {
            return (
              <div className="d-flex gap-2">
                <a
                  href={`${API_STREAM_BASE_URL}/policyAndProcedure/${row.id}/view-file`}
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
            );
          }
          return "-";
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
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
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
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
    ],
    [policyTypes, fileStatuses, policyFields]
  );

  return (
    <div className="page-content">
      <Container fluid>
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

        <Breadcrumbs title="Lookup Setup" breadcrumbItem="Policy and Procedure" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <Row className="mb-3">
                  <Col sm={6}>
                    <div className="d-flex align-items-center">
                      <Link to="/lookups" className="btn btn-light btn-sm me-2">
                        <i className="bx bx-arrow-back"></i> Back
                      </Link>
                      <h4 className="card-title mb-0">Policy and Procedure</h4>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="text-sm-end">
                      <Button
                        color="primary"
                        style={{ borderRadius: 0 }}
                        onClick={handleAdd}
                      >
                        <i className="mdi mdi-plus me-1"></i> Add New
                      </Button>
                    </div>
                  </Col>
                </Row>

                {loading && (
                  <div className="text-center my-5">
                    <Spinner color="primary" />
                    <p className="mt-2 text-muted">Loading data...</p>
                  </div>
                )}

                {!loading && policies.length === 0 && (
                  <div className="alert alert-info" role="alert">
                    <i className="bx bx-info-circle me-2"></i>
                    No policies found. Click "Add New" to create one.
                  </div>
                )}

                {!loading && policies.length > 0 && (
                  <TableContainer
                    columns={columns}
                    data={policies}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder="Search Policies..."
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Add/Edit Modal */}
        <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
          <ModalHeader toggle={toggleModal}>
            <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
            {editItem ? "Edit" : "Add New"} Policy and Procedure
          </ModalHeader>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label for="Name">
                      Name <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Name"
                      control={control}
                      rules={{
                        required: "Name is required",
                        minLength: { value: 2, message: "Minimum 2 characters required" },
                        maxLength: { value: 255, message: "Maximum 255 characters allowed" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="Name"
                          placeholder="Enter policy name"
                          invalid={!!errors.Name}
                          innerRef={nameInputRef}
                          {...field}
                        />
                      )}
                    />
                    {errors.Name && <FormFeedback>{errors.Name.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="Description">Description</Label>
                    <Controller
                      name="Description"
                      control={control}
                      rules={{
                        maxLength: { value: 255, message: "Maximum 255 characters allowed" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="Description"
                          type="textarea"
                          rows="3"
                          placeholder="Enter policy description"
                          invalid={!!errors.Description}
                          {...field}
                        />
                      )}
                    />
                    {errors.Description && (
                      <FormFeedback>{errors.Description.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Type">
                      Type <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Type"
                      control={control}
                      rules={{
                        required: "Type is required",
                      }}
                      render={({ field }) => (
                        <Input
                          id="Type"
                          type="select"
                          invalid={!!errors.Type}
                          {...field}
                        >
                          <option value="">Select Type</option>
                          {policyTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Type && <FormFeedback>{errors.Type.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Date_Of_Publication">Publication Date</Label>
                    <Controller
                      name="Date_Of_Publication"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="Date_Of_Publication"
                          type="date"
                          invalid={!!errors.Date_Of_Publication}
                          {...field}
                        />
                      )}
                    />
                    {errors.Date_Of_Publication && (
                      <FormFeedback>{errors.Date_Of_Publication.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Status">
                      Status <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Status"
                      control={control}
                      rules={{
                        required: "Status is required",
                      }}
                      render={({ field }) => (
                        <Input
                          id="Status"
                          type="select"
                          invalid={!!errors.Status}
                          {...field}
                        >
                          <option value="">Select Status</option>
                          {fileStatuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Status && <FormFeedback>{errors.Status.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Field">
                      Field <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Field"
                      control={control}
                      rules={{
                        required: "Field is required",
                      }}
                      render={({ field }) => (
                        <Input
                          id="Field"
                          type="select"
                          invalid={!!errors.Field}
                          {...field}
                        >
                          <option value="">Select Field</option>
                          {policyFields.map((fieldOption) => (
                            <option key={fieldOption.id} value={fieldOption.id}>
                              {fieldOption.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Field && <FormFeedback>{errors.Field.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="File">
                      PDF File <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="File"
                      control={control}
                      rules={{
                        required: editItem ? false : "PDF file is required",
                        validate: (value) => {
                          if (!editItem && (!value || value.length === 0)) {
                            return "PDF file is required";
                          }
                          return true;
                        }
                      }}
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          id="File"
                          type="file"
                          onChange={(e) => onChange(e.target.files)}
                          invalid={!!errors.File}
                          accept=".pdf,application/pdf"
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
                      Only PDF files are allowed
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
                <Button
                  color="light"
                  onClick={toggleModal}
                  disabled={isSubmitting}
                  className="me-2"
                >
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

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          toggle={hideDeleteConfirmation}
          onConfirm={confirmDelete}
          title="Delete Policy and Procedure"
          message={deleteItem?.message}
          itemName={deleteItem?.name}
          itemType={deleteItem?.type}
          loading={deleteLoading}
        />
      </Container>
    </div>
  );
};

export default PolicyAndProcedure;
