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
import { API_BASE_URL } from "../../helpers/url_helper";
import { sanitizeTenDigit, tenDigitRule } from "../../helpers/phone";

const TrainingInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
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

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      Institute_Name: "",
      Contact_Person: "",
      Contact_Number: "",
      Email_Address: "",
      Seta_Number: "",
      Address: "",
    },
  });

  // Meta title
  document.title = "Training Institutions | Welfare App";

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      reset({
        Institute_Name: editItem?.institute_name || "",
        Contact_Person: editItem?.contact_person || "",
        Contact_Number: editItem?.contact_number || "",
        Email_Address: editItem?.email_address || "",
        Seta_Number: editItem?.seta_number || "",
        Address: editItem?.address || "",
      });
      // Auto-focus on first input
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [editItem, modalOpen, reset]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/trainingInstitutions`);
      setInstitutions(response.data || []);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      showAlert("Failed to fetch training institutions", "danger");
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
        institute_name: data.Institute_Name,
        contact_person: data.Contact_Person,
        contact_number: data.Contact_Number,
        email_address: data.Email_Address,
        seta_number: data.Seta_Number,
        address: data.Address,
      };

      // Add audit fields based on workspace rules
      if (editItem) {
        payload.updated_by = getAuditName();
      } else {
        payload.created_by = getAuditName();
      }

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/trainingInstitutions/${editItem.id}`,
          payload
        );
        showAlert("Training institution has been updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/trainingInstitutions`, payload);
        showAlert("Training institution has been added successfully", "success");
      }
      fetchInstitutions();
      toggleModal();
    } catch (error) {
      console.error("Error saving institution:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    showDeleteConfirmation({
      id: editItem.id,
      name: editItem.Institute_Name || "Unknown Institution",
      type: "training institution",
      message: "This training institution will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/trainingInstitutions/${editItem.id}`);
      showAlert("Training institution has been deleted successfully", "success");
      fetchInstitutions();
      toggleModal();
    });
  };

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: "Institute Name",
        accessorKey: "institute_name",
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
        header: "Contact Person",
        accessorKey: "contact_person",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Contact Number",
        accessorKey: "contact_number",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Email",
        accessorKey: "email_address",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "SETA Number",
        accessorKey: "seta_number",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Address",
        accessorKey: "address",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
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
    []
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

        <Breadcrumbs title="Lookup Setup" breadcrumbItem="Training Institutions" />

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
                      <h4 className="card-title mb-0">Training Institutions</h4>
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

                {!loading && institutions.length === 0 && (
                  <div className="alert alert-info" role="alert">
                    <i className="bx bx-info-circle me-2"></i>
                    No training institutions found. Click "Add New" to create one.
                  </div>
                )}

                {!loading && institutions.length > 0 && (
                  <TableContainer
                    columns={columns}
                    data={institutions}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder="Search Training Institutions..."
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
            {editItem ? "Edit" : "Add New"} Training Institution
          </ModalHeader>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Institute_Name">
                      Institute Name <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Institute_Name"
                      control={control}
                      rules={{
                        required: "Institute name is required",
                        minLength: { value: 2, message: "Minimum 2 characters required" },
                        maxLength: { value: 255, message: "Maximum 255 characters allowed" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="Institute_Name"
                          placeholder="Enter institute name"
                          invalid={!!errors.Institute_Name}
                          innerRef={nameInputRef}
                          {...field}
                        />
                      )}
                    />
                    {errors.Institute_Name && (
                      <FormFeedback>{errors.Institute_Name.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Contact_Person">Contact Person</Label>
                    <Controller
                      name="Contact_Person"
                      control={control}
                      rules={{
                        maxLength: { value: 255, message: "Maximum 255 characters allowed" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="Contact_Person"
                          placeholder="Enter contact person name"
                          invalid={!!errors.Contact_Person}
                          {...field}
                        />
                      )}
                    />
                    {errors.Contact_Person && (
                      <FormFeedback>{errors.Contact_Person.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Contact_Number">Contact Number</Label>
                    <Controller
                      name="Contact_Number"
                      control={control}
                      rules={tenDigitRule(false, "Contact Number")}
                      render={({ field }) => (
                        <Input
                          id="Contact_Number"
                          placeholder="0123456789"
                          maxLength={10}
                          onInput={(e) => {
                            e.target.value = sanitizeTenDigit(e.target.value);
                            field.onChange(e);
                          }}
                          value={field.value}
                          onBlur={field.onBlur}
                          invalid={!!errors.Contact_Number}
                          {...field}
                        />
                      )}
                    />
                    {errors.Contact_Number && (
                      <FormFeedback>{errors.Contact_Number.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Email_Address">Email Address</Label>
                    <Controller
                      name="Email_Address"
                      control={control}
                      rules={{
                        pattern: {
                          value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                          message: "Invalid email address",
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          id="Email_Address"
                          type="email"
                          placeholder="email@example.com"
                          invalid={!!errors.Email_Address}
                          {...field}
                        />
                      )}
                    />
                    {errors.Email_Address && (
                      <FormFeedback>{errors.Email_Address.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Seta_Number">SETA Number</Label>
                    <Controller
                      name="Seta_Number"
                      control={control}
                      rules={{
                        maxLength: { value: 255, message: "Maximum 255 characters allowed" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="Seta_Number"
                          placeholder="Enter SETA number"
                          invalid={!!errors.Seta_Number}
                          {...field}
                        />
                      )}
                    />
                    {errors.Seta_Number && (
                      <FormFeedback>{errors.Seta_Number.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Address">Address</Label>
                    <Controller
                      name="Address"
                      control={control}
                      rules={{
                        maxLength: { value: 255, message: "Maximum 255 characters allowed" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="Address"
                          placeholder="Enter address"
                          invalid={!!errors.Address}
                          {...field}
                        />
                      )}
                    />
                    {errors.Address && <FormFeedback>{errors.Address.message}</FormFeedback>}
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
          title="Delete Training Institution"
          message={deleteItem?.message}
          itemName={deleteItem?.name}
          itemType={deleteItem?.type}
          loading={deleteLoading}
        />
      </Container>
    </div>
  );
};

export default TrainingInstitutions;

