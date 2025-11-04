import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import ApplicantListPanel from "./components/ApplicantListPanel";
import ApplicantSummary from "./components/ApplicantSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";

const ApplicantManagement = () => {
  // Meta title
  document.title = "Applicant Management | Welfare App";

  // State management
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);

  // Detail data states
  const [comments, setComments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [homeVisits, setHomeVisits] = useState([]);
  const [financialAssistance, setFinancialAssistance] = useState([]);
  const [foodAssistance, setFoodAssistance] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [financialAssessment, setFinancialAssessment] = useState(null);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    race: [],
    nationality: [],
    gender: [],
    fileCondition: [],
    fileStatus: [],
    educationLevel: [],
    maritalStatus: [],
    employmentStatus: [],
    suburb: [],
    dwellingType: [],
    dwellingStatus: [],
    healthConditions: [],
    skills: [],
    bornReligion: [],
    periodAsMuslim: [],
    relationshipTypes: [],
    assistanceTypes: [],
    hampers: [],
    trainingCourses: [],
    meansOfCommunication: [],
    employees: [],
    trainingLevels: [],
    trainingInstitutions: [],
    trainingOutcomes: [],
    incomeTypes: [],
    expenseTypes: [],
  });

  // Fetch all applicants on mount
  useEffect(() => {
    fetchApplicants();
    fetchLookupData();
  }, []);

  // Fetch detail data when an applicant is selected
  useEffect(() => {
    if (selectedApplicant) {
      fetchApplicantDetails(selectedApplicant.id);
    }
  }, [selectedApplicant]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/applicantDetails`);
      setApplicants(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedApplicant(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
      showAlert("Failed to fetch applicants", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [
        raceRes,
        nationalityRes,
        genderRes,
        fileConditionRes,
        fileStatusRes,
        educationLevelRes,
        maritalStatusRes,
        employmentStatusRes,
        suburbRes,
        dwellingTypeRes,
        dwellingStatusRes,
        healthConditionsRes,
        skillsRes,
        bornReligionRes,
        periodAsMuslimRes,
        relationshipTypesRes,
        assistanceTypesRes,
        hampersRes,
        trainingCoursesRes,
        meansOfCommunicationRes,
        employeesRes,
        trainingLevelsRes,
        trainingInstitutionsRes,
        trainingOutcomesRes,
        incomeTypesRes,
        expenseTypesRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Race`),
        axiosApi.get(`${API_BASE_URL}/lookup/Nationality`),
        axiosApi.get(`${API_BASE_URL}/lookup/Gender`),
        axiosApi.get(`${API_BASE_URL}/lookup/File_Condition`),
        axiosApi.get(`${API_BASE_URL}/lookup/File_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Education_Level`),
        axiosApi.get(`${API_BASE_URL}/lookup/Marital_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Employment_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Suburb`),
        axiosApi.get(`${API_BASE_URL}/lookup/Dwelling_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/Dwelling_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Health_Conditions`),
        axiosApi.get(`${API_BASE_URL}/lookup/Skills`),
        axiosApi.get(`${API_BASE_URL}/lookup/Born_Religion`),
        axiosApi.get(`${API_BASE_URL}/lookup/Period_As_Muslim`),
        axiosApi.get(`${API_BASE_URL}/lookup/Relationship_Types`),
        axiosApi.get(`${API_BASE_URL}/lookup/Assistance_Types`),
        axiosApi.get(`${API_BASE_URL}/lookup/Hampers`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Courses`),
        axiosApi.get(`${API_BASE_URL}/lookup/Means_of_communication`),
        axiosApi.get(`${API_BASE_URL}/employee`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Level`),
        axiosApi.get(`${API_BASE_URL}/trainingInstitutions`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Outcome`),
        axiosApi.get(`${API_BASE_URL}/lookup/Income_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/Expense_Type`),
      ]);

      setLookupData({
        race: raceRes.data || [],
        nationality: nationalityRes.data || [],
        gender: genderRes.data || [],
        fileCondition: fileConditionRes.data || [],
        fileStatus: fileStatusRes.data || [],
        educationLevel: educationLevelRes.data || [],
        maritalStatus: maritalStatusRes.data || [],
        employmentStatus: employmentStatusRes.data || [],
        suburb: suburbRes.data || [],
        dwellingType: dwellingTypeRes.data || [],
        dwellingStatus: dwellingStatusRes.data || [],
        healthConditions: healthConditionsRes.data || [],
        skills: skillsRes.data || [],
        bornReligion: bornReligionRes.data || [],
        periodAsMuslim: periodAsMuslimRes.data || [],
        relationshipTypes: relationshipTypesRes.data || [],
        assistanceTypes: assistanceTypesRes.data || [],
        hampers: hampersRes.data || [],
        trainingCourses: trainingCoursesRes.data || [],
        meansOfCommunication: meansOfCommunicationRes.data || [],
        employees: employeesRes.data || [],
        trainingLevels: trainingLevelsRes.data || [],
        trainingInstitutions: trainingInstitutionsRes.data || [],
        trainingOutcomes: trainingOutcomesRes.data || [],
        incomeTypes: incomeTypesRes.data || [],
        expenseTypes: expenseTypesRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchApplicantDetails = async (applicantId) => {
    try {
      const [
        commentsRes,
        tasksRes,
        relationshipsRes,
        homeVisitsRes,
        financialAssistanceRes,
        foodAssistanceRes,
        attachmentsRes,
        programsRes,
        financialAssessmentRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/comments?file_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/tasks?file_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/relationships?file_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/homeVisit?file_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/financialAssistance?file_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/foodAssistance?file_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/attachments?file_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/programs?person_trained_id=${applicantId}`),
        axiosApi.get(`${API_BASE_URL}/financialAssessment?file_id=${applicantId}`),
      ]);

      setComments(commentsRes.data || []);
      setTasks(tasksRes.data || []);
      setRelationships(relationshipsRes.data || []);
      setHomeVisits(homeVisitsRes.data || []);
      setFinancialAssistance(financialAssistanceRes.data || []);
      setFoodAssistance(foodAssistanceRes.data || []);
      setAttachments(attachmentsRes.data || []);
      setPrograms(programsRes.data || []);
      setFinancialAssessment(
        financialAssessmentRes.data && financialAssessmentRes.data.length > 0
          ? financialAssessmentRes.data[0]
          : null
      );
    } catch (error) {
      console.error("Error fetching applicant details:", error);
      showAlert("Failed to fetch applicant details", "warning");
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
      default:
        return "#dee2e6";
    }
  };

  const handleApplicantSelect = (applicant) => {
    setSelectedApplicant(applicant);
    // Clear existing detail data to avoid showing stale records while fetching
    setComments([]);
    setTasks([]);
    setRelationships([]);
    setHomeVisits([]);
    setFinancialAssistance([]);
    setFoodAssistance([]);
    setAttachments([]);
    setPrograms([]);
    setFinancialAssessment(null);
    // Fetch fresh detail data immediately for better UX
    if (applicant?.id) {
      fetchApplicantDetails(applicant.id);
    }
  };

  const handleApplicantUpdate = useCallback(() => {
    fetchApplicants();
    if (selectedApplicant) {
      fetchApplicantDetails(selectedApplicant.id);
    }
  }, [selectedApplicant]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedApplicant) {
      fetchApplicantDetails(selectedApplicant.id);
    }
  }, [selectedApplicant]);

  const filteredApplicants = applicants.filter((applicant) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (applicant.name || "").toLowerCase().includes(searchLower) ||
      (applicant.surname || "").toLowerCase().includes(searchLower) ||
      (applicant.file_number || "").toLowerCase().includes(searchLower) ||
      (applicant.id_number || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="page-content">
      <Container fluid>
        {/* Alert Notification - Top Right */}
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

        <Breadcrumbs title="Applicants" breadcrumbItem="Applicant Management" />

        <Row>
          {/* Left Panel - Applicant List */}
          <Col lg={3}>
            <ApplicantListPanel
              applicants={filteredApplicants}
              selectedApplicant={selectedApplicant}
              onSelectApplicant={handleApplicantSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchApplicants}
            />
          </Col>

          {/* Main Panel - Applicant Details */}
          <Col lg={9}>
            {selectedApplicant ? (
              <>
                {/* Summary Metrics */}
                <SummaryMetrics
                  applicantId={selectedApplicant.id}
                  financialAssistance={financialAssistance}
                  foodAssistance={foodAssistance}
                  homeVisits={homeVisits}
                  programs={programs}
                />

                {/* Applicant Summary */}
                <ApplicantSummary
                  applicant={selectedApplicant}
                  lookupData={lookupData}
                  onUpdate={handleApplicantUpdate}
                  showAlert={showAlert}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedApplicant.id}
                  applicantId={selectedApplicant.id}
                  comments={comments}
                  tasks={tasks}
                  relationships={relationships}
                  homeVisits={homeVisits}
                  financialAssistance={financialAssistance}
                  foodAssistance={foodAssistance}
                  attachments={attachments}
                  programs={programs}
                  financialAssessment={financialAssessment}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-user-circle display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading applicants..." : "Select an applicant to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ApplicantManagement;

