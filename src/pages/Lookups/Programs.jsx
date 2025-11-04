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

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [alert, setAlert] = useState(null);
  const personInputRef = useRef(null);

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
  const [applicants, setApplicants] = useState([]);
  const [trainingCourses, setTrainingCourses] = useState([]);
  const [meansOfCommunication, setMeansOfCommunication] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [trainingLevels, setTrainingLevels] = useState([]);
  const [trainingInstitutions, setTrainingInstitutions] = useState([]);
  const [trainingOutcomes, setTrainingOutcomes] = useState([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      Person_Trained_ID: "",
      Program_Name: "",
      Means_of_communication: "",
      Date_of_program: "",
      Communicated_by: "",
      Training_Level: "",
      Training_Provider: "",
      Program_Outcome: "",
    },
  });

  // Meta title
  document.title = "Programs | Welfare App";

  useEffect(() => {
    fetchPrograms();
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      reset({
        Person_Trained_ID: editItem?.person_trained_id || "",
        Program_Name: editItem?.program_name || "",
        Means_of_communication: editItem?.means_of_communication || "",
        Date_of_program: editItem?.date_of_program || "",
        Communicated_by: editItem?.communicated_by || "",
        Training_Level: editItem?.training_level || "",
        Training_Provider: editItem?.training_provider || "",
        Program_Outcome: editItem?.program_outcome || "",
      });
      // Auto-focus on first input
      setTimeout(() => {
        if (personInputRef.current) {
          personInputRef.current.focus();
        }
      }, 100);
    }
  }, [editItem, modalOpen, reset]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/programs`);
      setPrograms(response.data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
      showAlert("Failed to fetch programs", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [
        applicantsRes,
        coursesRes,
        meansRes,
        employeesRes,
        levelsRes,
        institutionsRes,
        outcomesRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/applicantDetails`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Courses`),
        axiosApi.get(`${API_BASE_URL}/lookup/Means_of_communication`),
        axiosApi.get(`${API_BASE_URL}/employee`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Level`),
        axiosApi.get(`${API_BASE_URL}/trainingInstitutions`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Outcome`),
      ]);

      setApplicants(applicantsRes.data || []);
      setTrainingCourses(coursesRes.data || []);
      setMeansOfCommunication(meansRes.data || []);
      setEmployees(employeesRes.data || []);
      setTrainingLevels(levelsRes.data || []);
      setTrainingInstitutions(institutionsRes.data || []);
      setTrainingOutcomes(outcomesRes.data || []);
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
        person_trained_id: data.Person_Trained_ID ? parseInt(data.Person_Trained_ID) : null,
        program_name: data.Program_Name ? parseInt(data.Program_Name) : null,
        means_of_communication: data.Means_of_communication ? parseInt(data.Means_of_communication) : null,
        date_of_program: data.Date_of_program || null,
        communicated_by: data.Communicated_by ? parseInt(data.Communicated_by) : null,
        training_level: data.Training_Level ? parseInt(data.Training_Level) : null,
        training_provider: data.Training_Provider ? parseInt(data.Training_Provider) : null,
        program_outcome: data.Program_Outcome ? parseInt(data.Program_Outcome) : null,
      };

      // Add audit fields based on workspace rules
      if (editItem) {
        payload.updated_by = getAuditName();
      } else {
        payload.created_by = getAuditName();
      }

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/programs/${editItem.id}`,
          payload
        );
        showAlert("Program has been updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/programs`, payload);
        showAlert("Program has been added successfully", "success");
      }
      fetchPrograms();
      toggleModal();
    } catch (error) {
      console.error("Error saving program:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    showDeleteConfirmation({
      id: editItem.id,
      name: editItem.name || "Unknown Program",
      type: "program",
      message: "This program will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/programs/${editItem.id}`);
      showAlert("Program has been deleted successfully", "success");
      fetchPrograms();
      toggleModal();
    });
  };

  // Helper functions to get names from IDs
  const getApplicantName = (id) => {
    if (!id) return "-";
    const applicant = applicants.find((a) => a.id == id || a.id === parseInt(id));
    return applicant ? `${applicant.name || ''} ${applicant.surname || ''}`.trim() : `ID: ${id}`;
  };

  const getCourseName = (id) => {
    if (!id) return "-";
    const course = trainingCourses.find((c) => c.id == id || c.id === parseInt(id));
    return course ? course.name : `ID: ${id}`;
  };

  const getMeansName = (id) => {
    if (!id) return "-";
    const means = meansOfCommunication.find((m) => m.id == id || m.id === parseInt(id));
    return means ? means.name : `ID: ${id}`;
  };

  const getEmployeeName = (id) => {
    if (!id) return "-";
    const employee = employees.find((e) => e.id == id || e.id === parseInt(id));
    return employee ? `${employee.name || ''} ${employee.surname || ''}`.trim() : `ID: ${id}`;
  };

  const getLevelName = (id) => {
    if (!id) return "-";
    const level = trainingLevels.find((l) => l.id == id || l.id === parseInt(id));
    return level ? level.name : `ID: ${id}`;
  };

  const getInstitutionName = (id) => {
    if (!id) return "-";
    const institution = trainingInstitutions.find((i) => i.id == id || i.id === parseInt(id));
    return institution ? institution.institute_name : `ID: ${id}`;
  };

  const getOutcomeName = (id) => {
    if (!id) return "-";
    const outcome = trainingOutcomes.find((o) => o.id == id || o.id === parseInt(id));
    return outcome ? outcome.name : `ID: ${id}`;
  };

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: "Person Trained",
        accessorKey: "person_trained_id",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const value = cell.getValue();
          const name = getApplicantName(value);
          return (
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
              {name}
            </span>
          );
        },
      },
      {
        header: "Program Name",
        accessorKey: "program_name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const value = cell.getValue();
          const name = getCourseName(value);
          return name;
        },
      },
      {
        header: "Means of Communication",
        accessorKey: "means_of_communication",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getMeansName(cell.getValue()),
      },
      {
        header: "Date",
        accessorKey: "date_of_program",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Communicated By",
        accessorKey: "communicated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getEmployeeName(cell.getValue()),
      },
      {
        header: "Training Level",
        accessorKey: "training_level",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLevelName(cell.getValue()),
      },
      {
        header: "Training Provider",
        accessorKey: "training_provider",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getInstitutionName(cell.getValue()),
      },
      {
        header: "Outcome",
        accessorKey: "program_outcome",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getOutcomeName(cell.getValue()),
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
    [applicants, trainingCourses, meansOfCommunication, employees, trainingLevels, trainingInstitutions, trainingOutcomes]
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

        <Breadcrumbs title="Lookup Setup" breadcrumbItem="Programs" />

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
                      <h4 className="card-title mb-0">Programs</h4>
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

                {!loading && programs.length === 0 && (
                  <div className="alert alert-info" role="alert">
                    <i className="bx bx-info-circle me-2"></i>
                    No programs found. Click "Add New" to create one.
                  </div>
                )}

                {!loading && programs.length > 0 && (
                  <TableContainer
                    columns={columns}
                    data={programs}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder="Search Programs..."
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
            {editItem ? "Edit" : "Add New"} Program
          </ModalHeader>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Person_Trained_ID">
                      Person Trained <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Person_Trained_ID"
                      control={control}
                      rules={{
                        required: "Person trained is required",
                      }}
                      render={({ field }) => (
                        <Input
                          id="Person_Trained_ID"
                          type="select"
                          invalid={!!errors.Person_Trained_ID}
                          innerRef={personInputRef}
                          {...field}
                        >
                          <option value="">Select Person</option>
                          {applicants.map((applicant) => (
                            <option key={applicant.id} value={applicant.id}>
                              {applicant.name} {applicant.surname}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Person_Trained_ID && (
                      <FormFeedback>{errors.Person_Trained_ID.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Program_Name">
                      Program Name <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Program_Name"
                      control={control}
                      rules={{
                        required: "Program name is required",
                      }}
                      render={({ field }) => (
                        <Input
                          id="Program_Name"
                          type="select"
                          invalid={!!errors.Program_Name}
                          {...field}
                        >
                          <option value="">Select Course</option>
                          {trainingCourses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Program_Name && (
                      <FormFeedback>{errors.Program_Name.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Means_of_communication">Means of Communication</Label>
                    <Controller
                      name="Means_of_communication"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="Means_of_communication"
                          type="select"
                          invalid={!!errors.Means_of_communication}
                          {...field}
                        >
                          <option value="">Select Means</option>
                          {meansOfCommunication.map((means) => (
                            <option key={means.id} value={means.id}>
                              {means.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Means_of_communication && (
                      <FormFeedback>{errors.Means_of_communication.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Date_of_program">Date of Program</Label>
                    <Controller
                      name="Date_of_program"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="Date_of_program"
                          type="date"
                          invalid={!!errors.Date_of_program}
                          {...field}
                        />
                      )}
                    />
                    {errors.Date_of_program && (
                      <FormFeedback>{errors.Date_of_program.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Communicated_by">Communicated By</Label>
                    <Controller
                      name="Communicated_by"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="Communicated_by"
                          type="select"
                          invalid={!!errors.Communicated_by}
                          {...field}
                        >
                          <option value="">Select Employee</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} {employee.surname}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Communicated_by && (
                      <FormFeedback>{errors.Communicated_by.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Training_Level">Training Level</Label>
                    <Controller
                      name="Training_Level"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="Training_Level"
                          type="select"
                          invalid={!!errors.Training_Level}
                          {...field}
                        >
                          <option value="">Select Level</option>
                          {trainingLevels.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Training_Level && (
                      <FormFeedback>{errors.Training_Level.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Training_Provider">Training Provider</Label>
                    <Controller
                      name="Training_Provider"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="Training_Provider"
                          type="select"
                          invalid={!!errors.Training_Provider}
                          {...field}
                        >
                          <option value="">Select Provider</option>
                          {trainingInstitutions.map((institution) => (
                            <option key={institution.id} value={institution.id}>
                              {institution.institute_name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Training_Provider && (
                      <FormFeedback>{errors.Training_Provider.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Program_Outcome">Program Outcome</Label>
                    <Controller
                      name="Program_Outcome"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="Program_Outcome"
                          type="select"
                          invalid={!!errors.Program_Outcome}
                          {...field}
                        >
                          <option value="">Select Outcome</option>
                          {trainingOutcomes.map((outcome) => (
                            <option key={outcome.id} value={outcome.id}>
                              {outcome.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {errors.Program_Outcome && (
                      <FormFeedback>{errors.Program_Outcome.message}</FormFeedback>
                    )}
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
          title="Delete Program"
          message={deleteItem?.message}
          itemName={deleteItem?.name}
          itemType={deleteItem?.type}
          loading={deleteLoading}
        />
      </Container>
    </div>
  );
};

export default Programs;

