import { API_STREAM_BASE_URL } from "../../helpers/url_helper";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Alert,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";
import AvatarSelector from "../../components/AvatarSelector";
import axiosApi from "../../helpers/api_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import { API_BASE_URL } from "../../helpers/url_helper";
import profile1 from "/src/assets/images/profile-img.png";

// MiniCards Component for KPI Cards
const MiniCards = ({ title, text, iconClass }) => {
  return (
    <Col md="4">
      <Card className="mini-stats-wid">
        <CardBody>
          <div className="d-flex">
            <div className="flex-grow-1">
              <p className="text-muted fw-medium mb-2">{title}</p>
              <h4 className="mb-0">{text}</h4>
            </div>
            <div className="mini-stat-icon avatar-sm align-self-center rounded-circle bg-primary">
              <span className="avatar-title">
                <i className={"bx " + iconClass + " font-size-24"} />
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
};

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [appraisals, setAppraisals] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  // Modal states for each table
  const [appraisalModalOpen, setAppraisalModalOpen] = useState(false);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

  const [editAppraisal, setEditAppraisal] = useState(null);
  const [editInitiative, setEditInitiative] = useState(null);
  const [editSkill, setEditSkill] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("");

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
  const [trainingCourses, setTrainingCourses] = useState([]);
  const [trainingInstitutions, setTrainingInstitutions] = useState([]);
  const [trainingOutcomes, setTrainingOutcomes] = useState([]);

  // Form for Appraisal
  const {
    control: appraisalControl,
    handleSubmit: handleAppraisalSubmit,
    formState: { errors: appraisalErrors, isSubmitting: appraisalSubmitting },
    reset: resetAppraisal,
  } = useForm({
    defaultValues: {
      Positions: "",
      Attendance: "",
      Job_Knowledge_Skills: "",
      Quality_of_Work: "",
      Initiative_And_Motivation: "",
      Teamwork: "",
      General_Conduct: "",
      Discipline: "",
      Special_Task: "",
      Overall_Comments: "",
      Room_for_Improvement: "",
    },
  });

  // Form for Initiative
  const {
    control: initiativeControl,
    handleSubmit: handleInitiativeSubmit,
    formState: { errors: initiativeErrors, isSubmitting: initiativeSubmitting },
    reset: resetInitiative,
  } = useForm({
    defaultValues: {
      Idea: "",
      Details: "",
      Idea_Date: "",
      Status: "",
    },
  });

  // Form for Skills
  const {
    control: skillsControl,
    handleSubmit: handleSkillsSubmit,
    formState: { errors: skillsErrors, isSubmitting: skillsSubmitting },
    reset: resetSkills,
  } = useForm({
    defaultValues: {
      Course: "",
      Institution: "",
      Date_Conducted: "",
      Date_Expired: "",
      Training_Outcome: "",
      Attachment: null,
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

  // Form for Employee Edit
  const {
    control: employeeControl,
    handleSubmit: handleEmployeeSubmit,
    watch: watchEmployee,
    formState: { errors: employeeErrors, isSubmitting: employeeSubmitting },
    reset: resetEmployee,
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
  document.title = "Employee Profile | Welfare App";

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails();
      fetchLookupData();
    }
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const [employeeRes, appraisalsRes, initiativesRes, skillsRes] =
        await Promise.all([
          axiosApi.get(`${API_BASE_URL}/employee/${id}`),
          axiosApi
            .get(
              `${API_BASE_URL}/employeeAppraisal?employee_id=${id}`
            )
            .catch(() => ({ data: [] })),
          axiosApi
            .get(
              `${API_BASE_URL}/employeeInitiative?employee_id=${id}`
            )
            .catch(() => ({ data: [] })),
          axiosApi
            .get(`${API_BASE_URL}/employeeSkills?employee_id=${id}`)
            .catch(() => ({ data: [] })),
        ]);

      setEmployee(employeeRes.data);
      setAppraisals(appraisalsRes.data || []);
      setInitiatives(initiativesRes.data || []);
      setSkills(skillsRes.data || []);
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Failed to fetch employee details");
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
        coursesRes,
        institutionsRes,
        outcomesRes,
      ] = await Promise.all([
        axiosApi
          .get(`${API_BASE_URL}/lookup/Nationality`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Race`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Education_Level`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Gender`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Suburb`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Blood_Type`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/User_Types`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Departments`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/centerDetail`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Training_Courses`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/trainingInstitutions`)
          .catch(() => ({ data: [] })),
        axiosApi
          .get(`${API_BASE_URL}/lookup/Training_Outcome`)
          .catch(() => ({ data: [] })),
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
      setTrainingCourses(coursesRes.data || []);
      setTrainingInstitutions(institutionsRes.data || []);
      setTrainingOutcomes(outcomesRes.data || []);
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      // Set empty arrays as fallback
      setNationalities([]);
      setRaces([]);
      setEducationLevels([]);
      setGenders([]);
      setSuburbs([]);
      setBloodTypes([]);
      setUserTypes([]);
      setDepartments([]);
      setTrainingCourses([]);
      setTrainingInstitutions([]);
      setTrainingOutcomes([]);
    }
  };

  // Helper functions to get names from IDs
  const getLookupName = (id, lookupArray) => {
    if (!id || !Array.isArray(lookupArray)) return "-";
    const item = lookupArray.find(
      (item) => (item && item.id == id) || (item && item.id === parseInt(id))
    );
    return item ? item.name : `ID: ${id}`;
  };

  const getInstitutionName = (id) => {
    if (!id || !Array.isArray(trainingInstitutions)) return "-";
    const institution = trainingInstitutions.find(
      (i) => (i && i.id == id) || (i && i.id === parseInt(id))
    );
    return institution ? institution.institute_name : `ID: ${id}`;
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  // Mini Cards Data
  const miniCards = [
    {
      title: "Completed Projects",
      iconClass: "bx-check-circle",
      text: Array.isArray(appraisals) ? appraisals.length.toString() : "125",
    },
    {
      title: "Pending Projects",
      iconClass: "bx-hourglass",
      text: Array.isArray(initiatives) ? initiatives.length.toString() : "12",
    },
    {
      title: "Total Revenue",
      iconClass: "bx-package",
      text: `$${
        Array.isArray(skills)
          ? (skills.length * 1000).toLocaleString()
          : "36,524"
      }`,
    },
  ];

  // ========== APPRAISAL CRUD ==========
  useEffect(() => {
    if (appraisalModalOpen) {
      resetAppraisal({
        Positions: editAppraisal?.positions || "",
        Attendance: editAppraisal?.attendance || "",
        Job_Knowledge_Skills: editAppraisal?.job_knowledge_skills || "",
        Quality_of_Work: editAppraisal?.quality_of_work || "",
        Initiative_And_Motivation:
          editAppraisal?.initiative_and_motivation || "",
        Teamwork: editAppraisal?.teamwork || "",
        General_Conduct: editAppraisal?.general_conduct || "",
        Discipline: editAppraisal?.discipline || "",
        Special_Task: editAppraisal?.special_task || "",
        Overall_Comments: editAppraisal?.overall_comments || "",
        Room_for_Improvement: editAppraisal?.room_for_improvement || "",
      });
    }
  }, [appraisalModalOpen, editAppraisal, resetAppraisal]);

  const handleAddAppraisal = () => {
    setEditAppraisal(null);
    setAppraisalModalOpen(true);
  };

  const handleEditAppraisal = (item) => {
    setEditAppraisal(item);
    setAppraisalModalOpen(true);
  };

  const handleDeleteAppraisal = async (item) => {
    if (!item || !item.id) {
      showAlert("Invalid appraisal item", "danger");
      return;
    }

    if (window.confirm("Are you sure you want to delete this appraisal?")) {
      try {
        setAppraisalModalOpen(false); // Close modal immediately
        await axiosApi.delete(
          `${API_BASE_URL}/employeeappraisal/${item.id}`
        );
        showAlert("Appraisal has been deleted successfully", "success");
        fetchEmployeeDetails();
      } catch (error) {
        console.error("Error deleting appraisal:", error);
        showAlert("Failed to delete appraisal", "danger");
      }
    }
  };

  const onAppraisalSubmit = async (data) => {
    try {
      if (!id || !employee) {
        showAlert("Employee information not available", "danger");
        return;
      }

      const currentUser = getHudasaUser();

      // Use JSON payload (no file uploads for appraisal)
      const payload = {
        employee_id: parseInt(id),
        positions: data.Positions || "",
        attendance: data.Attendance || "",
        job_knowledge_skills: data.Job_Knowledge_Skills || "",
        quality_of_work: data.Quality_of_Work || "",
        initiative_and_motivation: data.Initiative_And_Motivation || "",
        teamwork: data.Teamwork || "",
        general_conduct: data.General_Conduct || "",
        discipline: data.Discipline || "",
        special_task: data.Special_Task || "",
        overall_comments: data.Overall_Comments || "",
        room_for_improvement: data.Room_for_Improvement || "",
        center_id: employee?.center_id || null,
      };

      if (editAppraisal && editAppraisal.id) {
        payload.updated_by = getAuditName();
        await axiosApi.put(
          `${API_BASE_URL}/employeeAppraisal/${editAppraisal.id}`,
          payload
        );
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(
          `${API_BASE_URL}/employeeAppraisal`,
          payload
        );
      }

      showAlert(
        editAppraisal
          ? "Appraisal has been updated successfully"
          : "Appraisal has been created successfully",
        "success"
      );
      setAppraisalModalOpen(false);
      fetchEmployeeDetails();
    } catch (error) {
      console.error("Error saving appraisal:", error);
      showAlert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to save appraisal",
        "danger"
      );
    }
  };

  // ========== INITIATIVE CRUD ==========
  useEffect(() => {
    if (initiativeModalOpen) {
      resetInitiative({
        Idea: editInitiative?.idea || "",
        Details: editInitiative?.details || "",
        Idea_Date: editInitiative?.idea_date
          ? editInitiative.idea_date.split("T")[0]
          : "",
        Status: editInitiative?.status || "",
      });
    }
  }, [initiativeModalOpen, editInitiative, resetInitiative]);

  const handleAddInitiative = () => {
    setEditInitiative(null);
    setInitiativeModalOpen(true);
  };

  const handleEditInitiative = (item) => {
    setEditInitiative(item);
    setInitiativeModalOpen(true);
  };

  const handleDeleteInitiative = async (item) => {
    if (!item || !item.id) {
      showAlert("Invalid initiative item", "danger");
      return;
    }

    if (window.confirm("Are you sure you want to delete this initiative?")) {
      try {
        setInitiativeModalOpen(false); // Close modal immediately
        await axiosApi.delete(
          `${API_BASE_URL}/employeeInitiative/${item.id}`
        );
        showAlert("Initiative has been deleted successfully", "success");
        fetchEmployeeDetails();
      } catch (error) {
        console.error("Error deleting initiative:", error);
        showAlert("Failed to delete initiative", "danger");
      }
    }
  };

  const onInitiativeSubmit = async (data) => {
    try {
      if (!id || !employee) {
        showAlert("Employee information not available", "danger");
        return;
      }

      const currentUser = getHudasaUser();
      const payload = {
        employee_id: parseInt(id),
        idea: data.Idea || "",
        details: data.Details || "",
        idea_date: data.Idea_Date || null,
        status: data.Status || "",
        center_id: employee?.center_id || null,
      };

      if (editInitiative && editInitiative.id) {
        payload.updated_by = getAuditName();
        await axiosApi.put(
          `/employeeInitiative/${editInitiative.id}`,
          payload
        );
        showAlert("Initiative has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(
          "/employeeInitiative",
          payload
        );
        showAlert("Initiative has been created successfully", "success");
      }

      setInitiativeModalOpen(false);
      fetchEmployeeDetails();
    } catch (error) {
      console.error("Error saving initiative:", error);
      showAlert(
        error?.response?.data?.message || "Failed to save initiative",
        "danger"
      );
    }
  };

  // ========== SKILLS CRUD ==========
  useEffect(() => {
    if (skillsModalOpen) {
      resetSkills({
        Course: editSkill?.course || "",
        Institution: editSkill?.institution || "",
        Date_Conducted: editSkill?.date_conducted
          ? editSkill.date_conducted.split("T")[0]
          : "",
        Date_Expired: editSkill?.date_expired
          ? editSkill.date_expired.split("T")[0]
          : "",
        Training_Outcome: editSkill?.training_outcome || "",
        Attachment: null,
      });
    }
  }, [skillsModalOpen, editSkill, resetSkills]);

  // ========== EMPLOYEE EDIT ==========
  useEffect(() => {
    if (employeeModalOpen && employee) {
      resetEmployee({
        Name: employee?.name || "",
        Surname: employee?.surname || "",
        ID_Number: employee?.id_number || "",
        Date_of_Birth: employee?.date_of_birth
          ? employee.date_of_birth.split("T")[0]
          : "",
        Nationality: employee?.nationality ? String(employee.nationality) : "",
        Race: employee?.race ? String(employee.race) : "",
        Gender: employee?.gender ? String(employee.gender) : "",
        Highest_Education_Level: employee?.highest_education_level
          ? String(employee.highest_education_level)
          : "",
        Employment_Date: employee?.employment_date
          ? employee.employment_date.split("T")[0]
          : "",
        Contact_Number: employee?.contact_number || "",
        Emergency_Contact: employee?.emergency_contact || "",
        Home_Address: employee?.home_address || "",
        Suburb: employee?.suburb ? String(employee.suburb) : "",
        Blood_Type: employee?.blood_type ? String(employee.blood_type) : "",
        Username: employee?.username || "",
        Password: "", // Don't populate password for security
        User_Type: employee?.user_type ? String(employee.user_type) : "",
        Department: employee?.department ? String(employee.department) : "",
        HSEQ_Related: employee?.hseq_related || "N",
        // ✅ App Admin (user_type = 1) has no center_id
        Center_ID: employee?.user_type === 1 ? "" : (employee?.center_id ? String(employee.center_id) : ""),
      });
      setSelectedAvatar(employee?.employee_avatar || "");
    }
  }, [employeeModalOpen, employee, resetEmployee]);

  // ✅ Watch User_Type to conditionally show/hide Center field
  const selectedUserTypeEmployee = watchEmployee("User_Type");
  const isAppAdminEmployee = selectedUserTypeEmployee === "1"; // App Admin (User_Type = 1) should not have center

  // ✅ Clear Center_ID when App Admin is selected in Employee Profile
  useEffect(() => {
    if (isAppAdminEmployee) {
      resetEmployee({
        ...watchEmployee(),
        Center_ID: "", // Clear center_id for App Admin
      });
    }
  }, [selectedUserTypeEmployee]); // Run when User_Type changes

  const handleAddSkill = () => {
    setEditSkill(null);
    setSkillsModalOpen(true);
  };

  const handleEditSkill = (item) => {
    setEditSkill(item);
    setSkillsModalOpen(true);
  };

  const handleDeleteSkill = async (item) => {
    if (!item || !item.id) {
      showAlert("Invalid skill item", "danger");
      return;
    }

    if (window.confirm("Are you sure you want to delete this skill?")) {
      try {
        setSkillsModalOpen(false); // Close modal immediately
        await axiosApi.delete(
          `${API_BASE_URL}/employeeSkills/${item.id}`
        );
        showAlert("Skill has been deleted successfully", "success");
        fetchEmployeeDetails();
      } catch (error) {
        console.error("Error deleting skill:", error);
        showAlert("Failed to delete skill", "danger");
      }
    }
  };

  const onSkillsSubmit = async (data) => {
    try {
      if (!id || !employee) {
        showAlert("Employee information not available", "danger");
        return;
      }

      const currentUser = getHudasaUser();

      // Check if attachment is being uploaded
      const hasAttachment = data.Attachment && data.Attachment.length > 0;

      if (hasAttachment) {
        // Use FormData for file upload
        const formData = new FormData();

        formData.append("employee_id", parseInt(id));
        formData.append("course", data.Course || "");
        formData.append("institution", data.Institution || "");
        formData.append("date_conducted", data.Date_Conducted || "");
        formData.append("date_expired", data.Date_Expired || "");
        formData.append("training_outcome", data.Training_Outcome || "");
        formData.append("center_id", employee?.center_id || "");
        formData.append("attachment", data.Attachment[0]);

        if (editSkill && editSkill.id) {
          formData.append("updated_by", getAuditName());
          await axiosApi.put(
            `${API_BASE_URL}/employeeSkills/${editSkill.id}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        } else {
          formData.append("created_by", getAuditName());
          await axiosApi.post(
            `${API_BASE_URL}/employeeSkills`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }
      } else {
        // Use JSON for regular update/create without file
        const payload = {
          employee_id: parseInt(id),
          course: data.Course ? parseInt(data.Course) : null,
          institution: data.Institution ? parseInt(data.Institution) : null,
          date_conducted: data.Date_Conducted || null,
          date_expired: data.Date_Expired || null,
          training_outcome: data.Training_Outcome
            ? parseInt(data.Training_Outcome)
            : null,
          center_id: employee?.center_id || null,
        };

        if (editSkill && editSkill.id) {
          payload.updated_by = getAuditName();
          await axiosApi.put(
            `${API_BASE_URL}/employeeSkills/${editSkill.id}`,
            payload
          );
        } else {
          payload.created_by = getAuditName();
          await axiosApi.post(`${API_BASE_URL}/employeeSkills`, payload);
        }
      }

      showAlert(
        editSkill ? "Skill has been updated successfully" : "Skill has been created successfully",
        "success"
      );
      setSkillsModalOpen(false);
      fetchEmployeeDetails();
    } catch (error) {
      console.error("Error saving skill:", error);
      showAlert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to save skill",
        "danger"
      );
    }
  };

  // Define table columns for appraisals
  const appraisalColumns = useMemo(
    () => [
      {
        header: "Positions",
        accessorKey: "positions",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const value = cell.getValue() || "-";
          return (
            <span
              className="text-primary"
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => handleEditAppraisal(cell.row.original)}
            >
              {value}
            </span>
          );
        },
      },
      {
        header: "Attendance",
        accessorKey: "attendance",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Job knowledge & skills",
        accessorKey: "job_knowledge_skills",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Quality of work",
        accessorKey: "quality_of_work",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Initiative & motivation",
        accessorKey: "initiative_and_motivation",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Teamwork",
        accessorKey: "teamwork",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "General conduct",
        accessorKey: "general_conduct",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Discipline",
        accessorKey: "discipline",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Special task",
        accessorKey: "special_task",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Overall comments",
        accessorKey: "overall_comments",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Room for improvement",
        accessorKey: "room_for_improvement",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created by",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created at",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Updated by",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated at",
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

  // Define table columns for initiatives
  const initiativeColumns = useMemo(
    () => [
      {
        header: "Idea",
        accessorKey: "idea",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const value = cell.getValue() || "-";
          return (
            <span
              className="text-primary"
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => handleEditInitiative(cell.row.original)}
            >
              {value}
            </span>
          );
        },
      },
      {
        header: "Details",
        accessorKey: "details",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Idea date",
        accessorKey: "idea_date",
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
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created by",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created at",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Updated by",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated at",
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

  // Define table columns for skills
  const skillsColumns = useMemo(
    () => [
      {
        header: "Course",
        accessorKey: "course",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const value = getLookupName(cell.getValue(), trainingCourses);
          return (
            <span
              className="text-primary"
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => handleEditSkill(cell.row.original)}
            >
              {value}
            </span>
          );
        },
      },
      {
        header: "Institution",
        accessorKey: "institution",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getInstitutionName(cell.getValue()),
      },
      {
        header: "Date conducted",
        accessorKey: "date_conducted",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Date expired",
        accessorKey: "date_expired",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Training outcome",
        accessorKey: "training_outcome",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(cell.getValue(), trainingOutcomes),
      },
      {
        header: "Attachment",
        accessorKey: "attachment",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const attachment = cell.getValue();
          const rowId = cell.row.original.id;
          return attachment ? (
            <div className="d-flex justify-content-center gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/employeeSkills/${rowId}/view-attachment`}
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
        header: "Created by",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created at",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Updated by",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated at",
        accessorKey: "updated_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
    ],
    [trainingCourses, trainingInstitutions, trainingOutcomes]
  );

  const handleEditProfile = () => {
    // Open the edit modal on the same page
    setEmployeeModalOpen(true);
  };

  const toggleAvatarSelector = () => {
    setAvatarSelectorOpen(!avatarSelectorOpen);
  };

  const handleAvatarSave = async (avatarUrl) => {
    if (!employee || !id) {
      setSelectedAvatar(avatarUrl);
      showAlert("Avatar selected. Save the employee to apply changes.", "info");
      return;
    }

    // Save immediately
    try {
      const currentUser = getHudasaUser();
      const payload = {
        employee_avatar: avatarUrl,
        updated_by: getAuditName(),
      };

          await axiosApi.put(`${API_BASE_URL}/employee/${id}`, payload);
      setSelectedAvatar(avatarUrl);
      showAlert("Avatar has been updated successfully", "success");
      fetchEmployeeDetails();
      
      // Dispatch custom event to notify other components (like ProfileMenu) to refresh
      window.dispatchEvent(new Event("employeeAvatarUpdated"));
    } catch (error) {
      console.error("Error saving avatar:", error);
      showAlert(
        error?.response?.data?.message || "Failed to save avatar",
        "danger"
      );
      throw error;
    }
  };

  const onEmployeeSubmit = async (data) => {
    try {
      console.log("Form submitted with data:", data);

      if (!id || !employee) {
        showAlert("Employee information not available", "danger");
        return;
      }

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
        // ✅ App Admin (User_Type = 1) should have NULL center_id
        center_id: data.User_Type === "1" ? null : (data.Center_ID ? parseInt(data.Center_ID) : employee?.center_id || null),
        updated_by: getAuditName(),
      };

      // Only include password_hash if password is provided
      if (data.Password && data.Password.trim() !== "") {
        payload.password_hash = data.Password;
      }

      console.log("Sending payload:", payload);
      const response = await axiosApi.put(
        `${API_BASE_URL}/employee/${id}`,
        payload
      );
      console.log("Update response:", response.data);

      showAlert("Employee has been updated successfully", "success");
      setEmployeeModalOpen(false);
      fetchEmployeeDetails();
      
      // Dispatch custom event to notify other components (like ProfileMenu) to refresh
      // Only if avatar was actually changed
      if (payload.employee_avatar) {
        window.dispatchEvent(new Event("employeeAvatarUpdated"));
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      console.error("Error response:", error?.response?.data);
      showAlert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to update employee",
        "danger"
      );
    }
  };

  const handleDownload = () => {
    // Implement download functionality
    window.print();
  };

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center my-5">
            <Spinner color="primary" />
            <p className="mt-2 text-muted">Loading employee details...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="page-content">
        <Container fluid>
          <Alert color="danger">
            <i className="bx bx-error-circle me-2"></i>
            {error || "Employee not found"}
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
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

          <Breadcrumbs title="Employees" breadcrumbItem="Employee Profile" />

          <Row>
            <Col xl="4">
              {/* Combined Employee Profile Card */}
              <Card className="overflow-hidden shadow-sm">
                {/* Profile Header Section */}
                <div className="bg-primary-subtle">
                  <Row>
                    <Col xs="7">
                      <div className="text-primary p-3">
                        <h5 className="text-primary mb-1">Welcome Back !</h5>
                        <p className="mb-0">It will seem like simplified</p>
                      </div>
                    </Col>
                    <Col xs="5" className="align-self-end">
                      <img src={profile1} alt="" className="img-fluid" />
                    </Col>
                  </Row>
                </div>

                {/* Profile Summary Section */}
                <CardBody className="pt-0 pb-3">
                  <Row>
                    <Col sm="5">
                      <div className="avatar-md profile-user-wid mb-4">
                        <img
                          src={
                            employee.employee_avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              employee.name + " " + employee.surname
                            )}&size=80&background=1976d2&color=ffffff&bold=true`
                          }
                          alt={`${employee.name} ${employee.surname}`}
                          className="img-thumbnail rounded-circle"
                        />
                      </div>
                      <h5 className="font-size-14 text-truncate mb-1">
                        {employee.name} {employee.surname}
                      </h5>
                      {/* <p className="text-muted mb-0 text-truncate">
                        {getLookupName(employee.user_type, userTypes)}
                      </p> */}
                    </Col>

                    <Col sm={7}>
                      <div className="pt-4">
                        <Row>
                          <Col xs="6">
                            <h5 className="font-size-15 mb-1">
                              {Array.isArray(appraisals)
                                ? appraisals.length
                                : 2}
                            </h5>
                            <p className="text-muted mb-0">Projects</p>
                          </Col>
                          <Col xs="6">
                            <h5 className="font-size-15 mb-1">
                              $
                              {Array.isArray(skills)
                                ? (skills.length * 1000).toLocaleString()
                                : "1,000"}
                            </h5>
                            <p className="text-muted mb-0">Revenue</p>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                </CardBody>

                {/* Action Buttons Section */}
                <CardBody className="pt-2 pb-3">
                  <div className="d-flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      className="flex-fill"
                      onClick={handleEditProfile}
                    >
                      <i className="bx bx-edit me-1"></i>
                      Edit Profile
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      className="flex-fill"
                      onClick={handleDownload}
                    >
                      <i className="bx bx-download me-1"></i>
                      Download
                    </Button>
                  </div>
                </CardBody>

                {/* Personal Information Section */}
                <CardBody className="border-top pt-4 pb-0">
                  <h5 className="mb-4 text-primary">
                    <i className="bx bx-user me-2"></i>
                    Personal Information
                  </h5>
                  <div className="table-responsive">
                    <Table className="table-nowrap mb-0">
                      <tbody className="font-size-12">
                        <tr>
                          <th
                            scope="row"
                            style={{ width: "40%", fontWeight: "600" }}
                          >
                            Name:
                          </th>
                          <td>{employee.name || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Surname:
                          </th>
                          <td>{employee.surname || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            ID Number:
                          </th>
                          <td>{employee.id_number || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Date of Birth:
                          </th>
                          <td>
                            {employee.date_of_birth
                              ? new Date(
                                  employee.date_of_birth
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Nationality:
                          </th>
                          <td>
                            {getLookupName(employee.nationality, nationalities)}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Race:
                          </th>
                          <td>{getLookupName(employee.race, races)}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Gender:
                          </th>
                          <td>{getLookupName(employee.gender, genders)}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Highest Education Level:
                          </th>
                          <td>
                            {getLookupName(
                              employee.highest_education_level,
                              educationLevels
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Employment Date:
                          </th>
                          <td>
                            {employee.employment_date
                              ? new Date(
                                  employee.employment_date
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Suburb:
                          </th>
                          <td>{getLookupName(employee.suburb, suburbs)}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Home Address:
                          </th>
                          <td>{employee.home_address || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Contact Number:
                          </th>
                          <td>{employee.contact_number || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Emergency Contact:
                          </th>
                          <td>{employee.emergency_contact || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Blood Type:
                          </th>
                          <td>
                            {getLookupName(employee.blood_type, bloodTypes)}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Username:
                          </th>
                          <td>{employee.username || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            User Type:
                          </th>
                          <td>
                            {getLookupName(employee.user_type, userTypes)}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Department:
                          </th>
                          <td>
                            {getLookupName(employee.department, departments)}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            HSEQ Related:
                          </th>
                          <td>{employee.hseq_related || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Created By:
                          </th>
                          <td>{employee.created_by || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Created At:
                          </th>
                          <td>
                            {employee.created_at
                              ? new Date(
                                  employee.created_at
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Updated By:
                          </th>
                          <td>{employee.updated_by || "-"}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: "600" }}>
                            Updated At:
                          </th>
                          <td>
                            {employee.updated_at
                              ? new Date(
                                  employee.updated_at
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl="8">
              {/* KPI Cards Row */}
              <Row>
                {(miniCards || [])?.map((card, key) => (
                  <MiniCards
                    title={card.title}
                    text={card.text}
                    iconClass={card.iconClass}
                    key={"_card_" + key}
                  />
                ))}
              </Row>

              {/* Employee Appraisal Card */}
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Employee Appraisal</h5>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={handleAddAppraisal}
                    >
                      <i className="bx bx-plus me-1"></i>
                      Add New
                    </Button>
                  </div>
                  {Array.isArray(appraisals) && appraisals.length > 0 ? (
                    <TableContainer
                      columns={appraisalColumns}
                      data={appraisals}
                      isGlobalFilter={false}
                      tableClass="table-nowrap table-hover mb-0"
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No appraisals found</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Employee Initiatives Card */}
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Employee Initiative</h5>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={handleAddInitiative}
                    >
                      <i className="bx bx-plus me-1"></i>
                      Add New
                    </Button>
                  </div>
                  {Array.isArray(initiatives) && initiatives.length > 0 ? (
                    <TableContainer
                      columns={initiativeColumns}
                      data={initiatives}
                      isGlobalFilter={false}
                      tableClass="table-nowrap table-hover mb-0"
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No initiatives found</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Employee Skills Card */}
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Employee Skills</h5>
                    <Button color="primary" size="sm" onClick={handleAddSkill}>
                      <i className="bx bx-plus me-1"></i>
                      Add New
                    </Button>
                  </div>
                  {Array.isArray(skills) && skills.length > 0 ? (
                    <TableContainer
                      columns={skillsColumns}
                      data={skills}
                      isGlobalFilter={false}
                      tableClass="table-nowrap table-hover mb-0"
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No skills found</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Appraisal Modal */}
      <Modal
        isOpen={appraisalModalOpen}
        toggle={() => setAppraisalModalOpen(false)}
        centered
        size="lg"
        backdrop="static"
      >
        <ModalHeader toggle={() => setAppraisalModalOpen(false)}>
          <i className={`bx ${editAppraisal ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editAppraisal ? "Edit" : "Add New"} Appraisal
        </ModalHeader>
        <Form onSubmit={handleAppraisalSubmit(onAppraisalSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Positions">Positions</Label>
                  <Controller
                    name="Positions"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Positions"
                        placeholder="Enter positions"
                        invalid={!!appraisalErrors.Positions}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Positions && (
                    <FormFeedback>
                      {appraisalErrors.Positions.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="Attendance">Attendance</Label>
                  <Controller
                    name="Attendance"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Attendance"
                        placeholder="Enter attendance"
                        invalid={!!appraisalErrors.Attendance}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Attendance && (
                    <FormFeedback>
                      {appraisalErrors.Attendance.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="Job_Knowledge_Skills">
                    Job Knowledge & Skills
                  </Label>
                  <Controller
                    name="Job_Knowledge_Skills"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Job_Knowledge_Skills"
                        placeholder="Enter job knowledge & skills"
                        invalid={!!appraisalErrors.Job_Knowledge_Skills}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Job_Knowledge_Skills && (
                    <FormFeedback>
                      {appraisalErrors.Job_Knowledge_Skills.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="Quality_of_Work">Quality of Work</Label>
                  <Controller
                    name="Quality_of_Work"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Quality_of_Work"
                        placeholder="Enter quality of work"
                        invalid={!!appraisalErrors.Quality_of_Work}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Quality_of_Work && (
                    <FormFeedback>
                      {appraisalErrors.Quality_of_Work.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="Initiative_And_Motivation">
                    Initiative & Motivation
                  </Label>
                  <Controller
                    name="Initiative_And_Motivation"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Initiative_And_Motivation"
                        placeholder="Enter initiative & motivation"
                        invalid={!!appraisalErrors.Initiative_And_Motivation}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Initiative_And_Motivation && (
                    <FormFeedback>
                      {appraisalErrors.Initiative_And_Motivation.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="Teamwork">Teamwork</Label>
                  <Controller
                    name="Teamwork"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Teamwork"
                        placeholder="Enter teamwork"
                        invalid={!!appraisalErrors.Teamwork}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Teamwork && (
                    <FormFeedback>
                      {appraisalErrors.Teamwork.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="General_Conduct">General Conduct</Label>
                  <Controller
                    name="General_Conduct"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="General_Conduct"
                        placeholder="Enter general conduct"
                        invalid={!!appraisalErrors.General_Conduct}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.General_Conduct && (
                    <FormFeedback>
                      {appraisalErrors.General_Conduct.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="Discipline">Discipline</Label>
                  <Controller
                    name="Discipline"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Discipline"
                        placeholder="Enter discipline"
                        invalid={!!appraisalErrors.Discipline}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Discipline && (
                    <FormFeedback>
                      {appraisalErrors.Discipline.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="Special_Task">Special Task</Label>
                  <Controller
                    name="Special_Task"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Special_Task"
                        type="textarea"
                        rows="2"
                        placeholder="Enter special task"
                        invalid={!!appraisalErrors.Special_Task}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Special_Task && (
                    <FormFeedback>
                      {appraisalErrors.Special_Task.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="Overall_Comments">Overall Comments</Label>
                  <Controller
                    name="Overall_Comments"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Overall_Comments"
                        type="textarea"
                        rows="2"
                        placeholder="Enter overall comments"
                        invalid={!!appraisalErrors.Overall_Comments}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Overall_Comments && (
                    <FormFeedback>
                      {appraisalErrors.Overall_Comments.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="Room_for_Improvement">Room for Improvement</Label>
                  <Controller
                    name="Room_for_Improvement"
                    control={appraisalControl}
                    render={({ field }) => (
                      <Input
                        id="Room_for_Improvement"
                        type="textarea"
                        rows="2"
                        placeholder="Enter room for improvement"
                        invalid={!!appraisalErrors.Room_for_Improvement}
                        {...field}
                      />
                    )}
                  />
                  {appraisalErrors.Room_for_Improvement && (
                    <FormFeedback>
                      {appraisalErrors.Room_for_Improvement.message}
                    </FormFeedback>
                  )}
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editAppraisal && (
                <Button
                  color="danger"
                  onClick={() => handleDeleteAppraisal(editAppraisal)}
                  disabled={appraisalSubmitting}
                >
                  <i className="bx bx-trash me-1"></i>
                  Delete
                </Button>
              )}
            </div>

            <div>
              <Button
                color="light"
                onClick={() => setAppraisalModalOpen(false)}
                disabled={appraisalSubmitting}
                className="me-2"
              >
                <i className="bx bx-x label-icon"></i> Cancel
              </Button>

              <Button color="success" type="submit" disabled={appraisalSubmitting}>
                {appraisalSubmitting ? (
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

      {/* Initiative Modal */}
      <Modal
        isOpen={initiativeModalOpen}
        toggle={() => setInitiativeModalOpen(false)}
        centered
        backdrop="static"
      >
        <ModalHeader toggle={() => setInitiativeModalOpen(false)}>
          <i className={`bx ${editInitiative ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editInitiative ? "Edit" : "Add New"} Initiative
        </ModalHeader>
        <Form onSubmit={handleInitiativeSubmit(onInitiativeSubmit)}>
          <ModalBody>
            <FormGroup>
              <Label for="Idea">
                Idea <span className="text-danger">*</span>
              </Label>
              <Controller
                name="Idea"
                control={initiativeControl}
                rules={{ required: "Idea is required" }}
                render={({ field }) => (
                  <Input
                    id="Idea"
                    placeholder="Enter idea"
                    invalid={!!initiativeErrors.Idea}
                    {...field}
                  />
                )}
              />
              {initiativeErrors.Idea && (
                <FormFeedback>{initiativeErrors.Idea.message}</FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Details">Details</Label>
              <Controller
                name="Details"
                control={initiativeControl}
                render={({ field }) => (
                  <Input
                    id="Details"
                    type="textarea"
                    rows="3"
                    placeholder="Enter details"
                    invalid={!!initiativeErrors.Details}
                    {...field}
                  />
                )}
              />
              {initiativeErrors.Details && (
                <FormFeedback>{initiativeErrors.Details.message}</FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Idea_Date">Idea Date</Label>
              <Controller
                name="Idea_Date"
                control={initiativeControl}
                render={({ field }) => (
                  <Input
                    id="Idea_Date"
                    type="date"
                    invalid={!!initiativeErrors.Idea_Date}
                    {...field}
                  />
                )}
              />
              {initiativeErrors.Idea_Date && (
                <FormFeedback>
                  {initiativeErrors.Idea_Date.message}
                </FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Status">Status</Label>
              <Controller
                name="Status"
                control={initiativeControl}
                render={({ field }) => (
                  <Input
                    id="Status"
                    placeholder="Enter status"
                    invalid={!!initiativeErrors.Status}
                    {...field}
                  />
                )}
              />
              {initiativeErrors.Status && (
                <FormFeedback>{initiativeErrors.Status.message}</FormFeedback>
              )}
            </FormGroup>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editInitiative && (
                <Button
                  color="danger"
                  onClick={() => handleDeleteInitiative(editInitiative)}
                  disabled={initiativeSubmitting}
                >
                  <i className="bx bx-trash me-1"></i>
                  Delete
                </Button>
              )}
            </div>

            <div>
              <Button
                color="light"
                onClick={() => setInitiativeModalOpen(false)}
                disabled={initiativeSubmitting}
                className="me-2"
              >
                <i className="bx bx-x label-icon"></i> Cancel
              </Button>

              <Button color="success" type="submit" disabled={initiativeSubmitting}>
                {initiativeSubmitting ? (
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

      {/* Skills Modal */}
      <Modal 
        isOpen={skillsModalOpen} 
        toggle={() => setSkillsModalOpen(false)}
        centered
        backdrop="static"
      >
        <ModalHeader toggle={() => setSkillsModalOpen(false)}>
          <i className={`bx ${editSkill ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editSkill ? "Edit" : "Add New"} Skill
        </ModalHeader>
        <Form onSubmit={handleSkillsSubmit(onSkillsSubmit)}>
          <ModalBody>
            <FormGroup>
              <Label for="Course">Course</Label>
              <Controller
                name="Course"
                control={skillsControl}
                render={({ field }) => (
                  <Input
                    id="Course"
                    type="select"
                    invalid={!!skillsErrors.Course}
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
              {skillsErrors.Course && (
                <FormFeedback>{skillsErrors.Course.message}</FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Institution">Institution</Label>
              <Controller
                name="Institution"
                control={skillsControl}
                render={({ field }) => (
                  <Input
                    id="Institution"
                    type="select"
                    invalid={!!skillsErrors.Institution}
                    {...field}
                  >
                    <option value="">Select Institution</option>
                    {trainingInstitutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.institute_name}
                      </option>
                    ))}
                  </Input>
                )}
              />
              {skillsErrors.Institution && (
                <FormFeedback>{skillsErrors.Institution.message}</FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Date_Conducted">Date Conducted</Label>
              <Controller
                name="Date_Conducted"
                control={skillsControl}
                render={({ field }) => (
                  <Input
                    id="Date_Conducted"
                    type="date"
                    invalid={!!skillsErrors.Date_Conducted}
                    {...field}
                  />
                )}
              />
              {skillsErrors.Date_Conducted && (
                <FormFeedback>
                  {skillsErrors.Date_Conducted.message}
                </FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Date_Expired">Date Expired</Label>
              <Controller
                name="Date_Expired"
                control={skillsControl}
                render={({ field }) => (
                  <Input
                    id="Date_Expired"
                    type="date"
                    invalid={!!skillsErrors.Date_Expired}
                    {...field}
                  />
                )}
              />
              {skillsErrors.Date_Expired && (
                <FormFeedback>{skillsErrors.Date_Expired.message}</FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Training_Outcome">Training Outcome</Label>
              <Controller
                name="Training_Outcome"
                control={skillsControl}
                render={({ field }) => (
                  <Input
                    id="Training_Outcome"
                    type="select"
                    invalid={!!skillsErrors.Training_Outcome}
                    {...field}
                  >
                    <option value="">Select Training Outcome</option>
                    {trainingOutcomes.map((outcome) => (
                      <option key={outcome.id} value={outcome.id}>
                        {outcome.name}
                      </option>
                    ))}
                  </Input>
                )}
              />
              {skillsErrors.Training_Outcome && (
                <FormFeedback>
                  {skillsErrors.Training_Outcome.message}
                </FormFeedback>
              )}
            </FormGroup>
            <FormGroup>
              <Label for="Attachment">Attachment</Label>
              <Controller
                name="Attachment"
                control={skillsControl}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    id="Attachment"
                    type="file"
                    onChange={(e) => onChange(e.target.files)}
                    invalid={!!skillsErrors.Attachment}
                    {...field}
                  />
                )}
              />
              {skillsErrors.Attachment && (
                <FormFeedback>{skillsErrors.Attachment.message}</FormFeedback>
              )}
              {editSkill && editSkill.attachment && (
                <div className="mt-2 p-2 border rounded bg-light">
                  <div className="d-flex align-items-center">
                    <i className="bx bx-file font-size-24 text-primary me-2"></i>
                    <div className="flex-grow-1">
                      <div className="fw-medium">{editSkill.attachment_filename || "attachment"}</div>
                      <small className="text-muted">
                        {formatFileSize(editSkill.attachment_size)} • Current file
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </FormGroup>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editSkill && (
                <Button
                  color="danger"
                  onClick={() => handleDeleteSkill(editSkill)}
                  disabled={skillsSubmitting}
                >
                  <i className="bx bx-trash me-1"></i>
                  Delete
                </Button>
              )}
            </div>

            <div>
              <Button
                color="light"
                onClick={() => setSkillsModalOpen(false)}
                disabled={skillsSubmitting}
                className="me-2"
              >
                <i className="bx bx-x label-icon"></i> Cancel
              </Button>

              <Button color="success" type="submit" disabled={skillsSubmitting}>
                {skillsSubmitting ? (
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

      {/* Employee Edit Modal */}
      <Modal
        isOpen={employeeModalOpen}
        toggle={() => setEmployeeModalOpen(false)}
        centered
        size="lg"
        backdrop="static"
      >
        <ModalHeader toggle={() => setEmployeeModalOpen(false)}>
          <i className="bx bx-edit me-2"></i>
          Edit Employee Profile
        </ModalHeader>
        <Form onSubmit={handleEmployeeSubmit(onEmployeeSubmit)}>
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
                      control={employeeControl}
                      rules={{ required: "Name is required" }}
                      render={({ field }) => (
                        <Input
                          id="Name"
                          placeholder="Enter name"
                          invalid={!!employeeErrors.Name}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Name && (
                      <FormFeedback>{employeeErrors.Name.message}</FormFeedback>
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
                      control={employeeControl}
                      rules={{ required: "Surname is required" }}
                      render={({ field }) => (
                        <Input
                          id="Surname"
                          placeholder="Enter surname"
                          invalid={!!employeeErrors.Surname}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Surname && (
                      <FormFeedback>
                        {employeeErrors.Surname.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="ID_Number">ID Number</Label>
                    <Controller
                      name="ID_Number"
                      control={employeeControl}
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
                          invalid={!!employeeErrors.ID_Number}
                          maxLength="13"
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.ID_Number && (
                      <FormFeedback>
                        {employeeErrors.ID_Number.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Date_of_Birth">Date of Birth</Label>
                    <Controller
                      name="Date_of_Birth"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Date_of_Birth"
                          type="date"
                          invalid={!!employeeErrors.Date_of_Birth}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Date_of_Birth && (
                      <FormFeedback>
                        {employeeErrors.Date_of_Birth.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Nationality">Nationality</Label>
                    <Controller
                      name="Nationality"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Nationality"
                          type="select"
                          invalid={!!employeeErrors.Nationality}
                          {...field}
                        >
                          <option value="">Select Nationality</option>
                          {nationalities.map((nationality) => (
                            <option key={nationality.id} value={nationality.id}>
                              {nationality.name}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {employeeErrors.Nationality && (
                      <FormFeedback>
                        {employeeErrors.Nationality.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Race">Race</Label>
                    <Controller
                      name="Race"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Race"
                          type="select"
                          invalid={!!employeeErrors.Race}
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
                    {employeeErrors.Race && (
                      <FormFeedback>{employeeErrors.Race.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Gender">Gender</Label>
                    <Controller
                      name="Gender"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Gender"
                          type="select"
                          invalid={!!employeeErrors.Gender}
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
                    {employeeErrors.Gender && (
                      <FormFeedback>
                        {employeeErrors.Gender.message}
                      </FormFeedback>
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
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Highest_Education_Level"
                          type="select"
                          invalid={!!employeeErrors.Highest_Education_Level}
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
                    {employeeErrors.Highest_Education_Level && (
                      <FormFeedback>
                        {employeeErrors.Highest_Education_Level.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Employment_Date">Employment Date</Label>
                    <Controller
                      name="Employment_Date"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Employment_Date"
                          type="date"
                          invalid={!!employeeErrors.Employment_Date}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Employment_Date && (
                      <FormFeedback>
                        {employeeErrors.Employment_Date.message}
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
                      control={employeeControl}
                      rules={{
                        validate: (v) => (!v ? true : /^\d{10}$/.test(v)) || "Contact Number must be exactly 10 digits",
                      }}
                      render={({ field }) => (
                        <Input
                          id="Contact_Number"
                          placeholder="0123456789"
                          maxLength={10}
                          onInput={(e) => {
                            e.target.value = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                            field.onChange(e);
                          }}
                          value={field.value}
                          onBlur={field.onBlur}
                          invalid={!!employeeErrors.Contact_Number}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Contact_Number && (
                      <FormFeedback>
                        {employeeErrors.Contact_Number.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Emergency_Contact">Emergency Contact</Label>
                    <Controller
                      name="Emergency_Contact"
                      control={employeeControl}
                      rules={{
                        validate: (v) => (!v ? true : /^\d{10}$/.test(v)) || "Emergency Contact must be exactly 10 digits",
                      }}
                      render={({ field }) => (
                        <Input
                          id="Emergency_Contact"
                          placeholder="0123456789"
                          maxLength={10}
                          onInput={(e) => {
                            e.target.value = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                            field.onChange(e);
                          }}
                          value={field.value}
                          onBlur={field.onBlur}
                          invalid={!!employeeErrors.Emergency_Contact}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Emergency_Contact && (
                      <FormFeedback>
                        {employeeErrors.Emergency_Contact.message}
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
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Home_Address"
                          type="textarea"
                          rows="2"
                          placeholder="Enter home address"
                          invalid={!!employeeErrors.Home_Address}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Home_Address && (
                      <FormFeedback>
                        {employeeErrors.Home_Address.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Suburb">Suburb</Label>
                    <Controller
                      name="Suburb"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Suburb"
                          type="select"
                          invalid={!!employeeErrors.Suburb}
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
                    {employeeErrors.Suburb && (
                      <FormFeedback>
                        {employeeErrors.Suburb.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Blood_Type">Blood Type</Label>
                    <Controller
                      name="Blood_Type"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Blood_Type"
                          type="select"
                          invalid={!!employeeErrors.Blood_Type}
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
                    {employeeErrors.Blood_Type && (
                      <FormFeedback>
                        {employeeErrors.Blood_Type.message}
                      </FormFeedback>
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
                      control={employeeControl}
                      rules={{ required: "Username is required" }}
                      render={({ field }) => (
                        <Input
                          id="Username"
                          placeholder="Enter username"
                          invalid={!!employeeErrors.Username}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Username && (
                      <FormFeedback>
                        {employeeErrors.Username.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Password">Password</Label>
                    <Controller
                      name="Password"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Password"
                          type="password"
                          placeholder="Leave blank to keep current password"
                          invalid={!!employeeErrors.Password}
                          {...field}
                        />
                      )}
                    />
                    {employeeErrors.Password && (
                      <FormFeedback>
                        {employeeErrors.Password.message}
                      </FormFeedback>
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
                {!isAppAdminEmployee && (
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Center_ID">
                        Center <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Center_ID"
                        control={employeeControl}
                        rules={{ required: "Center is required" }}
                        render={({ field }) => (
                          <Input
                            id="Center_ID"
                            type="select"
                            invalid={!!employeeErrors.Center_ID}
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
                      {employeeErrors.Center_ID && (
                        <FormFeedback>{employeeErrors.Center_ID.message}</FormFeedback>
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
                      control={employeeControl}
                      rules={{ required: "User Type is required" }}
                      render={({ field }) => (
                        <Input
                          id="User_Type"
                          type="select"
                          invalid={!!employeeErrors.User_Type}
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
                    {employeeErrors.User_Type && (
                      <FormFeedback>
                        {employeeErrors.User_Type.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Department">Department</Label>
                    <Controller
                      name="Department"
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="Department"
                          type="select"
                          invalid={!!employeeErrors.Department}
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
                    {employeeErrors.Department && (
                      <FormFeedback>
                        {employeeErrors.Department.message}
                      </FormFeedback>
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
                      control={employeeControl}
                      render={({ field }) => (
                        <Input
                          id="HSEQ_Related"
                          type="select"
                          invalid={!!employeeErrors.HSEQ_Related}
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
                    {employeeErrors.HSEQ_Related && (
                      <FormFeedback>
                        {employeeErrors.HSEQ_Related.message}
                      </FormFeedback>
                    )}
                  </FormGroup>
                </Col>
              </Row>
            </div>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div></div>
            <div>
              <Button
                color="light"
                onClick={() => setEmployeeModalOpen(false)}
                disabled={employeeSubmitting}
                className="me-2"
              >
                <i className="bx bx-x label-icon"></i> Cancel
              </Button>
              <Button color="success" type="submit" disabled={employeeSubmitting}>
                {employeeSubmitting ? (
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

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={avatarSelectorOpen}
        toggle={toggleAvatarSelector}
        onSave={handleAvatarSave}
        gender={employee?.gender || 1}
        currentAvatar={selectedAvatar}
      />
    </React.Fragment>
  );
};

export default EmployeeProfile;
