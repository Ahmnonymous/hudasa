import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import MadressaApplicationListPanel from "./components/MadressaApplicationListPanel";
import MadressaApplicationSummary from "./components/MadressaApplicationSummary";
import DetailTabs from "./components/DetailTabs";

const MadressaApplicationManagement = () => {
  // Meta title
  document.title = "Madressa Applications | Hudasa";

  // State management
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);

  // Detail data states
  const [conductAssessments, setConductAssessments] = useState([]);
  const [academicResults, setAcademicResults] = useState([]);
  const [islamicResults, setIslamicResults] = useState([]);
  const [surveys, setSurveys] = useState([]);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    relationships: [],
    bloodTypes: [],
    terms: [],
    academicSubjects: [],
    islamicSubjects: [],
    healthConditions: [],
  });

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch all applications on mount
  useEffect(() => {
    fetchApplications();
    fetchLookupData();
  }, []);

  // Fetch detail data when an application is selected
  useEffect(() => {
    if (selectedApplication) {
      fetchApplicationDetails(selectedApplication.id);
    }
  }, [selectedApplication]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/madressaApplication`);
      setApplications(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedApplication(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching madressa applications:", error);
      showAlert("Failed to fetch madressa applications", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [relationshipsRes, bloodTypesRes, termsRes, academicSubjectsRes, islamicSubjectsRes, healthConditionsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/relationships`),
        axiosApi.get(`${API_BASE_URL}/lookup/Blood_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/Terms`),
        axiosApi.get(`${API_BASE_URL}/lookup/Academic_Subjects`),
        axiosApi.get(`${API_BASE_URL}/lookup/Islamic_Subjects`),
        axiosApi.get(`${API_BASE_URL}/lookup/Health_Conditions`),
      ]);

      setLookupData({
        relationships: relationshipsRes.data || [],
        bloodTypes: bloodTypesRes.data || [],
        terms: termsRes.data || [],
        academicSubjects: academicSubjectsRes.data || [],
        islamicSubjects: islamicSubjectsRes.data || [],
        healthConditions: healthConditionsRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchApplicationDetails = async (applicationId) => {
    try {
      const [
        conductAssessmentsRes,
        academicResultsRes,
        islamicResultsRes,
        surveysRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/conductAssessment?madressah_app_id=${applicationId}`),
        axiosApi.get(`${API_BASE_URL}/academicResults?madressah_app_id=${applicationId}`),
        axiosApi.get(`${API_BASE_URL}/islamicResults?madressah_app_id=${applicationId}`),
        axiosApi.get(`${API_BASE_URL}/survey?madressah_app_id=${applicationId}`),
      ]);

      setConductAssessments(conductAssessmentsRes.data || []);
      setAcademicResults(academicResultsRes.data || []);
      setIslamicResults(islamicResultsRes.data || []);
      setSurveys(surveysRes.data || []);
    } catch (error) {
      console.error("Error fetching application details:", error);
      showAlert("Failed to fetch application details", "warning");
    }
  };

  const showAlert = (message, color) => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 5000);
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const relationship = lookupData.relationships.find((r) => r.id === app.applicant_relationship_id);
    if (relationship) {
      return (
        (relationship.name || "").toLowerCase().includes(searchLower) ||
        (relationship.surname || "").toLowerCase().includes(searchLower) ||
        (relationship.id_number || "").toLowerCase().includes(searchLower)
      );
    }
    return false;
  });

  const handleSelectApplication = useCallback((application) => {
    setSelectedApplication(application);
  }, []);

  const handleUpdate = useCallback(() => {
    fetchApplications();
    if (selectedApplication) {
      fetchApplicationDetails(selectedApplication.id);
    }
  }, [selectedApplication]);

  return (
    <div className="page-content">
      <Container fluid>
        <TopRightAlert alert={alert} onClose={() => setAlert(null)} />
        <Breadcrumbs title="Madressa" breadcrumbItem="Applications" />

        <Row>
          {/* Left Panel - Application List */}
          <Col xl={4} lg={5}>
            <MadressaApplicationListPanel
              applications={filteredApplications}
              selectedApplication={selectedApplication}
              onSelectApplication={handleSelectApplication}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchApplications}
              onCreateNew={() => setCreateModalOpen(true)}
              lookupData={lookupData}
            />
          </Col>

          {/* Right Panel - Application Details */}
          <Col xl={8} lg={7}>
            {selectedApplication ? (
              <>
                <MadressaApplicationSummary
                  application={selectedApplication}
                  lookupData={lookupData}
                  onUpdate={handleUpdate}
                  showAlert={showAlert}
                />
                <DetailTabs
                  application={selectedApplication}
                  conductAssessments={conductAssessments}
                  academicResults={academicResults}
                  islamicResults={islamicResults}
                  surveys={surveys}
                  onUpdate={handleUpdate}
                  showAlert={showAlert}
                  lookupData={lookupData}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-user-circle display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading applications..." : "Select an application to view details"}
                </h4>
              </div>
            )}

          {/* Create Application Modal */}
          {createModalOpen && (
            <MadressaApplicationSummary
              application={null}
              lookupData={lookupData}
              onUpdate={() => {
                setCreateModalOpen(false);
                handleUpdate();
              }}
              showAlert={showAlert}
              onClose={() => setCreateModalOpen(false)}
            />
          )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

// TopRightAlert component
const TopRightAlert = ({ alert, onClose }) => {
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

  if (!alert) return null;
  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
    >
      <Alert
        color={alert.color}
        isOpen={!!alert}
        toggle={onClose}
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
  );
};

export default MadressaApplicationManagement;

