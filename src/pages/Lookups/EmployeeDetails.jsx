import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import AvatarSelector from "../../components/AvatarSelector";
import DeleteConfirmationModal from "../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import axiosApi from "../../helpers/api_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import { API_BASE_URL } from "../../helpers/url_helper";
import { sanitizeTenDigit, tenDigitRule } from "../../helpers/phone";

const EmployeeDetails = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [alert, setAlert] = useState(null);
  const nameInputRef = useRef(null);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");

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
  const [nationalities, setNationalities] = useState([]);
  const [races, setRaces] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [genders, setGenders] = useState([]);
  const [suburbs, setSuburbs] = useState([]);
  const [bloodTypes, setBloodTypes] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [centers, setCenters] = useState([]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      Name: "",
      Surname: "",
      ID_Number: "",
      Date_of_Birth: "",
      Nationality: "",
      Race: "",
      Gender: "",
      Highest_Education_Level: "",
      Employment_Date: "",
      Contact_Number: "",
      Emergency_Contact: "",
      Home_Address: "",
      Suburb: "",
      Blood_Type: "",
      Username: "",
      Password: "",
      User_Type: "",
      Department: "",
      HSEQ_Related: "N",
      Center_ID: "",
    },
  });

  // Meta title
  document.title = "Employee Details | Welfare App";

  useEffect(() => {
    fetchEmployees();
    fetchLookupData();
  }, []);

  // Separate useEffect to handle URL hash after employees are loaded
  useEffect(() => {
    if (employees.length > 0) {
      const hash = window.location.hash;
      if (hash.startsWith("#edit-")) {
        const employeeId = hash.replace("#edit-", "");
        const employeeToEdit = employees.find((emp) => emp.id == employeeId);
        if (employeeToEdit) {
          handleEdit(employeeToEdit);
          // Clear the hash
          window.location.hash = "";
        }
      }
    }
  }, [employees]);

  useEffect(() => {
    if (modalOpen) {
      const currentUser = getHudasaUser();
      reset({
        Name: editItem?.name || "",
        Surname: editItem?.surname || "",
        ID_Number: editItem?.id_number || "",
        Date_of_Birth: editItem?.date_of_birth
          ? editItem.date_of_birth.split("T")[0]
          : "",
        Nationality: editItem?.nationality ? String(editItem.nationality) : "",
        Race: editItem?.race ? String(editItem.race) : "",
        Gender: editItem?.gender ? String(editItem.gender) : "",
        Highest_Education_Level: editItem?.highest_education_level
          ? String(editItem.highest_education_level)
          : "",
        Employment_Date: editItem?.employment_date
          ? editItem.employment_date.split("T")[0]
          : "",
        Contact_Number: editItem?.contact_number || "",
        Emergency_Contact: editItem?.emergency_contact || "",
        Home_Address: editItem?.home_address || "",
        Suburb: editItem?.suburb ? String(editItem.suburb) : "",
        Blood_Type: editItem?.blood_type ? String(editItem.blood_type) : "",
        Username: editItem?.username || "",
        Password: "", // Don't populate password for security
        User_Type: editItem?.user_type ? String(editItem.user_type) : "",
        Department: editItem?.department ? String(editItem.department) : "",
        HSEQ_Related: editItem?.hseq_related || "N",
        // ✅ App Admin (user_type = 1) has no center_id, others populate from editItem or currentUser
        Center_ID: editItem?.user_type === 1 ? "" : (editItem?.center_id ? String(editItem.center_id) : (currentUser?.center_id ? String(currentUser.center_id) : "")),
      });
      setSelectedAvatar(editItem?.employee_avatar || "");
      // Auto-focus on first input
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [editItem, modalOpen, reset]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/employee`);
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showAlert("Failed to fetch employees", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [
        nationalitiesRes,
        racesRes,
        educationRes,
        gendersRes,
        suburbsRes,
        bloodTypesRes,
        userTypesRes,
        departmentsRes,
        centersRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Nationality`),
        axiosApi.get(`${API_BASE_URL}/lookup/Race`),
        axiosApi.get(`${API_BASE_URL}/lookup/Education_Level`),
        axiosApi.get(`${API_BASE_URL}/lookup/Gender`),
        axiosApi.get(`${API_BASE_URL}/lookup/Suburb`),
        axiosApi.get(`${API_BASE_URL}/lookup/Blood_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/User_Types`),
        axiosApi.get(`${API_BASE_URL}/lookup/Departments`),
        axiosApi.get(`${API_BASE_URL}/centerDetail`),
      ]);

      setNationalities(nationalitiesRes.data || []);
      setRaces(racesRes.data || []);
      setEducationLevels(educationRes.data || []);
      setGenders(gendersRes.data || []);
      setSuburbs(suburbsRes.data || []);
      setBloodTypes(bloodTypesRes.data || []);
      setUserTypes(userTypesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setCenters(centersRes.data || []);
    } catch (error) {
      console.error("Error fetching lookup data:", error);
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      setEditItem(null);
      setSelectedAvatar("");
    }
  };

  const toggleAvatarSelector = () => {
    setAvatarSelectorOpen(!avatarSelectorOpen);
  };

  const handleAvatarSave = async (avatarUrl) => {
    if (!editItem) {
      // Just save to local state if it's a new employee
      setSelectedAvatar(avatarUrl);
      showAlert("Avatar selected.", "success");
      return;
    }

    // Save immediately if editing an existing employee
    try {
      const currentUser = getHudasaUser();
      const payload = {
        employee_avatar: avatarUrl,
        updated_by: getAuditName(),
      };

      await axiosApi.put(
        `${API_BASE_URL}/employee/${editItem.id}`,
        payload
      );
      setSelectedAvatar(avatarUrl);
      showAlert("Avatar has been updated successfully", "success");
      fetchEmployees();
    } catch (error) {
      console.error("Error saving avatar:", error);
      showAlert(
        error?.response?.data?.message || "Failed to save avatar",
        "danger"
      );
      throw error;
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    toggleModal();
  };

  const handleEdit = (item) => {
    setEditItem(item);
    toggleModal();
  };

  const handleDelete = (item) => {
    showDeleteConfirmation({
      id: item.id,
      name: `${item.name} ${item.surname}`,
      type: "employee",
      message: "This employee will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/employee/${item.id}`);
      showAlert("Employee has been deleted successfully", "success");
      fetchEmployees();
    });
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();

      // Convert form data to lowercase for PostgreSQL
      const payload = {
        name: data.Name,
        surname: data.Surname,
        id_number: data.ID_Number,
        date_of_birth: data.Date_of_Birth || null,
        nationality: data.Nationality ? parseInt(data.Nationality) : null,
        race: data.Race ? parseInt(data.Race) : null,
        gender: data.Gender ? parseInt(data.Gender) : null,
        highest_education_level: data.Highest_Education_Level
          ? parseInt(data.Highest_Education_Level)
          : null,
        employment_date: data.Employment_Date || null,
        contact_number: data.Contact_Number,
        emergency_contact: data.Emergency_Contact,
        home_address: data.Home_Address,
        suburb: data.Suburb ? parseInt(data.Suburb) : null,
        blood_type: data.Blood_Type ? parseInt(data.Blood_Type) : null,
        username: data.Username,
        user_type: data.User_Type ? parseInt(data.User_Type) : null,
        department: data.Department ? parseInt(data.Department) : null,
        hseq_related: data.HSEQ_Related,
        employee_avatar: selectedAvatar || null,
        center_id: data.Center_ID ? parseInt(data.Center_ID) : null,
      };

      // Only include password_hash if password is provided (for new employees or password changes)
      if (data.Password && data.Password.trim() !== "") {
        payload.password_hash = data.Password;
      }

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(
          `${API_BASE_URL}/employee/${editItem.id}`,
          payload
        );
        showAlert("Employee has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/employee`, payload);
        showAlert("Employee has been created successfully", "success");
      }

      toggleModal();
      fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      showAlert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to save employee",
        "danger"
      );
    }
  };

  // Helper functions to get names from IDs
  const getLookupName = (id, lookupArray) => {
    if (!id) return "-";
    const item = lookupArray.find(
      (item) => item.id == id || item.id === parseInt(id)
    );
    return item ? item.name : "-";
  };

  // ✅ Watch User_Type to conditionally show/hide Center field
  const selectedUserType = watch("User_Type");
  const isAppAdmin = selectedUserType === "1"; // App Admin (User_Type = 1) should not have center

  // ✅ Clear Center_ID when App Admin is selected
  useEffect(() => {
    if (isAppAdmin) {
      reset({
        ...watch(),
        Center_ID: "", // Clear center_id for App Admin
      });
    }
  }, [selectedUserType]); // Run when User_Type changes

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: "Username",
        accessorKey: "username",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => (
          <span
            style={{
              cursor: "default",
              color: "inherit",
              textDecoration: "none",
            }}
            onClick={() =>
              navigate(`/employees/profile/${cell.row.original.id}`)
            }
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
            {cell.getValue() || "-"}
          </span>
        ),
      },
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Surname",
        accessorKey: "surname",
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
        header: "User Type",
        accessorKey: "user_type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(cell.getValue(), userTypes),
      },
      {
        header: "Department",
        accessorKey: "department",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(cell.getValue(), departments),
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
    [employees, userTypes, departments]
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
                backgroundColor:
                  alert.color === "success" ? "#d4edda" : "#f8d7da",
                border: `1px solid ${
                  alert.color === "success" ? "#c3e6cb" : "#f5c6cb"
                }`,
                color: "#000",
              }}
            >
              <i
                className={`mdi ${
                  alert.color === "success"
                    ? "mdi-check-all"
                    : "mdi-block-helper"
                } me-2`}
              ></i>
              {alert.message}
            </Alert>
          </div>
        )}

        <Breadcrumbs title="Lookups" breadcrumbItem="Employee Details" />

        <Row className="mb-3">
          <Col lg={12}>
            <div className="d-flex align-items-center justify-content-between">
              <Link to="/lookups" className="btn btn-light btn-sm">
                <i className="bx bx-arrow-back me-1"></i> Back to Lookups
              </Link>
              <Button color="success" onClick={handleAdd}>
                <i className="bx bx-plus me-1"></i> Add Employee
              </Button>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner color="primary" />
                    <p className="mt-2 text-muted">Loading employees...</p>
                  </div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={employees}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder="Search employees..."
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
        <Modal isOpen={modalOpen} toggle={toggleModal} size="lg">
          <ModalHeader toggle={toggleModal}>
            {editItem ? "Edit Employee" : "Add Employee"}
          </ModalHeader>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Avatar Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-3 pb-2 border-bottom">
                  <i className="bx bx-user-circle me-2"></i>
                  Profile Avatar
                </h6>
                <Row>
                  <Col md={12} className="text-center">
                    <div className="mb-3">
                      {selectedAvatar ? (
                        <img
                          src={selectedAvatar}
                          alt="Selected Avatar"
                          className="rounded-circle border border-primary"
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-circle border border-secondary d-inline-flex align-items-center justify-content-center"
                          style={{
                            width: "120px",
                            height: "120px",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <i
                            className="bx bx-user"
                            style={{ fontSize: "3rem", color: "#adb5bd" }}
                          ></i>
                        </div>
                      )}
                    </div>
                    <Button
                      color="primary"
                      size="sm"
                      outline
                      onClick={toggleAvatarSelector}
                      type="button"
                    >
                      <i className="bx bx-image-add me-1"></i>
                      {selectedAvatar ? "Change Avatar" : "Select Avatar"}
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Personal Information Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-3 pb-2 border-bottom">
                  <i className="bx bx-user me-2"></i>
                  Personal Information
                </h6>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Name">
                        Name <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Name"
                        control={control}
                        rules={{ required: "Name is required" }}
                        render={({ field }) => (
                          <Input
                            id="Name"
                            innerRef={nameInputRef}
                            placeholder="Enter name"
                            invalid={!!errors.Name}
                            {...field}
                          />
                        )}
                      />
                      {errors.Name && (
                        <FormFeedback>{errors.Name.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Surname">
                        Surname <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Surname"
                        control={control}
                        rules={{ required: "Surname is required" }}
                        render={({ field }) => (
                          <Input
                            id="Surname"
                            placeholder="Enter surname"
                            invalid={!!errors.Surname}
                            {...field}
                          />
                        )}
                      />
                      {errors.Surname && (
                        <FormFeedback>{errors.Surname.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="ID_Number">ID Number</Label>
                      <Controller
                        name="ID_Number"
                        control={control}
                        rules={{
                          pattern: {
                            value: /^[0-9]{13}$/,
                            message: "ID number must be 13 digits",
                          },
                        }}
                        render={({ field }) => (
                          <Input
                            id="ID_Number"
                            placeholder="Enter 13-digit ID number"
                            invalid={!!errors.ID_Number}
                            maxLength="13"
                            {...field}
                          />
                        )}
                      />
                      {errors.ID_Number && (
                        <FormFeedback>{errors.ID_Number.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Date_of_Birth">Date of Birth</Label>
                      <Controller
                        name="Date_of_Birth"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Date_of_Birth"
                            type="date"
                            invalid={!!errors.Date_of_Birth}
                            {...field}
                          />
                        )}
                      />
                      {errors.Date_of_Birth && (
                        <FormFeedback>
                          {errors.Date_of_Birth.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Nationality">Nationality</Label>
                      <Controller
                        name="Nationality"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Nationality"
                            type="select"
                            invalid={!!errors.Nationality}
                            {...field}
                          >
                            <option value="">Select Nationality</option>
                            {nationalities.map((nationality) => (
                              <option
                                key={nationality.id}
                                value={nationality.id}
                              >
                                {nationality.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.Nationality && (
                        <FormFeedback>
                          {errors.Nationality.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Race">Race</Label>
                      <Controller
                        name="Race"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Race"
                            type="select"
                            invalid={!!errors.Race}
                            {...field}
                          >
                            <option value="">Select Race</option>
                            {races.map((race) => (
                              <option key={race.id} value={race.id}>
                                {race.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.Race && (
                        <FormFeedback>{errors.Race.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Gender">Gender</Label>
                      <Controller
                        name="Gender"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Gender"
                            type="select"
                            invalid={!!errors.Gender}
                            {...field}
                          >
                            <option value="">Select Gender</option>
                            {genders.map((gender) => (
                              <option key={gender.id} value={gender.id}>
                                {gender.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.Gender && (
                        <FormFeedback>{errors.Gender.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Highest_Education_Level">
                        Highest Education Level
                      </Label>
                      <Controller
                        name="Highest_Education_Level"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Highest_Education_Level"
                            type="select"
                            invalid={!!errors.Highest_Education_Level}
                            {...field}
                          >
                            <option value="">Select Education Level</option>
                            {educationLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.Highest_Education_Level && (
                        <FormFeedback>
                          {errors.Highest_Education_Level.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Employment_Date">Employment Date</Label>
                      <Controller
                        name="Employment_Date"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Employment_Date"
                            type="date"
                            invalid={!!errors.Employment_Date}
                            {...field}
                          />
                        )}
                      />
                      {errors.Employment_Date && (
                        <FormFeedback>
                          {errors.Employment_Date.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </div>

              {/* Contact Information Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-3 pb-2 border-bottom">
                  <i className="bx bx-phone me-2"></i>
                  Contact Information
                </h6>
                <Row>
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
                        <FormFeedback>
                          {errors.Contact_Number.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Emergency_Contact">Emergency Contact</Label>
                      <Controller
                        name="Emergency_Contact"
                        control={control}
                        rules={tenDigitRule(false, "Emergency Contact")}
                        render={({ field }) => (
                          <Input
                            id="Emergency_Contact"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Emergency_Contact}
                            {...field}
                          />
                        )}
                      />
                      {errors.Emergency_Contact && (
                        <FormFeedback>
                          {errors.Emergency_Contact.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </div>

              {/* Address Information Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-3 pb-2 border-bottom">
                  <i className="bx bx-map me-2"></i>
                  Address Information
                </h6>
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label for="Home_Address">Home Address</Label>
                      <Controller
                        name="Home_Address"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Home_Address"
                            type="textarea"
                            rows="2"
                            placeholder="Enter home address"
                            invalid={!!errors.Home_Address}
                            {...field}
                          />
                        )}
                      />
                      {errors.Home_Address && (
                        <FormFeedback>
                          {errors.Home_Address.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Suburb">Suburb</Label>
                      <Controller
                        name="Suburb"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Suburb"
                            type="select"
                            invalid={!!errors.Suburb}
                            {...field}
                          >
                            <option value="">Select Suburb</option>
                            {suburbs.map((suburb) => (
                              <option key={suburb.id} value={suburb.id}>
                                {suburb.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.Suburb && (
                        <FormFeedback>{errors.Suburb.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Blood_Type">Blood Type</Label>
                      <Controller
                        name="Blood_Type"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Blood_Type"
                            type="select"
                            invalid={!!errors.Blood_Type}
                            {...field}
                          >
                            <option value="">Select Blood Type</option>
                            {bloodTypes.map((bloodType) => (
                              <option key={bloodType.id} value={bloodType.id}>
                                {bloodType.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.Blood_Type && (
                        <FormFeedback>{errors.Blood_Type.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </div>

              {/* Account Information Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-3 pb-2 border-bottom">
                  <i className="bx bx-lock-alt me-2"></i>
                  Account Information
                </h6>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Username">
                        Username <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Username"
                        control={control}
                        rules={{ required: "Username is required" }}
                        render={({ field }) => (
                          <Input
                            id="Username"
                            placeholder="Enter username"
                            invalid={!!errors.Username}
                            {...field}
                          />
                        )}
                      />
                      {errors.Username && (
                        <FormFeedback>{errors.Username.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Password">
                        Password{" "}
                        {!editItem && <span className="text-danger">*</span>}
                      </Label>
                      <Controller
                        name="Password"
                        control={control}
                        rules={
                          !editItem ? { required: "Password is required" } : {}
                        }
                        render={({ field }) => (
                          <Input
                            id="Password"
                            type="password"
                            placeholder={
                              editItem
                                ? "Leave blank to keep current password"
                                : "Enter password"
                            }
                            invalid={!!errors.Password}
                            {...field}
                          />
                        )}
                      />
                      {errors.Password && (
                        <FormFeedback>{errors.Password.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </div>

              {/* Department & HSEQ Information Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-3 pb-2 border-bottom">
                  <i className="bx bx-briefcase me-2"></i>
                  Department & HSEQ Information
                </h6>
                <Row>
                  {/* ✅ Center field: Hidden/Disabled for App Admin (User_Type = 1) */}
                  {!isAppAdmin && (
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Center_ID">
                          Center <span className="text-danger">*</span>
                        </Label>
                        <Controller
                          name="Center_ID"
                          control={control}
                          rules={{ required: "Center is required" }}
                          render={({ field }) => (
                            <Input
                              id="Center_ID"
                              type="select"
                              invalid={!!errors.Center_ID}
                              {...field}
                            >
                              <option value="">Select Center</option>
                              {centers.map((center) => (
                                <option key={center.id} value={center.id}>
                                  {center.organisation_name}
                                </option>
                              ))}
                            </Input>
                          )}
                        />
                        {errors.Center_ID && (
                          <FormFeedback>{errors.Center_ID.message}</FormFeedback>
                        )}
                      </FormGroup>
                    </Col>
                  )}
                  <Col md={6}>
                    <FormGroup>
                      <Label for="User_Type">
                        User Type <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="User_Type"
                        control={control}
                        rules={{ required: "User Type is required" }}
                        render={({ field }) => (
                          <Input
                            id="User_Type"
                            type="select"
                            invalid={!!errors.User_Type}
                            {...field}
                          >
                            <option value="">Select User Type</option>
                            {userTypes.map((userType) => (
                              <option key={userType.id} value={userType.id}>
                                {userType.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.User_Type && (
                        <FormFeedback>{errors.User_Type.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Department">Department</Label>
                      <Controller
                        name="Department"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="Department"
                            type="select"
                            invalid={!!errors.Department}
                            {...field}
                          >
                            <option value="">Select Department</option>
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.Department && (
                        <FormFeedback>{errors.Department.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="HSEQ_Related">
                        <i className="bx bx-shield me-1"></i>
                        HSEQ Related Employee
                      </Label>
                      <Controller
                        name="HSEQ_Related"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="HSEQ_Related"
                            type="select"
                            invalid={!!errors.HSEQ_Related}
                            {...field}
                          >
                            <option value="N">No</option>
                            <option value="Y">Yes</option>
                          </Input>
                        )}
                      />
                      <small className="text-muted d-block mt-1">
                        Select if the employee is involved in Health, Safety,
                        Environment & Quality activities
                      </small>
                      {errors.HSEQ_Related && (
                        <FormFeedback>
                          {errors.HSEQ_Related.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="light"
                onClick={toggleModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button color="success" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i>
                    {editItem ? "Update" : "Create"}
                  </>
                )}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* Avatar Selector Modal */}
        <AvatarSelector
          isOpen={avatarSelectorOpen}
          toggle={toggleAvatarSelector}
          onSave={handleAvatarSave}
          gender={editItem?.gender || 1}
          currentAvatar={selectedAvatar}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          toggle={hideDeleteConfirmation}
          onConfirm={confirmDelete}
          title="Delete Employee"
          message={deleteItem?.message}
          itemName={deleteItem?.name}
          itemType={deleteItem?.type}
          loading={deleteLoading}
        />
      </Container>
    </div>
  );
};

export default EmployeeDetails;
