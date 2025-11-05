import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import IslamicCentersListPanel from "./components/IslamicCentersListPanel";
import IslamicCentersSummary from "./components/IslamicCentersSummary";
import DetailTabs from "./components/DetailTabs";

const IslamicCentersManagement = () => {
  document.title = "Islamic Centers Management | Welfare App";

  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [createMode, setCreateMode] = useState(false);

  const [maintenance, setMaintenance] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);

  const [lookupData, setLookupData] = useState({
    suburbs: [],
    maintenanceTypes: [],
  });

  useEffect(() => {
    fetchCenters();
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (selectedCenter) {
      fetchCenterDetails(selectedCenter.id);
    }
  }, [selectedCenter]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/islamicCenters`);
      setCenters(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedCenter(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching Islamic centers:", error);
      showAlert("Failed to fetch Islamic centers", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [suburbsRes, maintenanceTypesRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Suburb`),
        axiosApi.get(`${API_BASE_URL}/lookup/Maintenance_Type`).catch(() => ({ data: [] })), // Handle if table doesn't exist yet
      ]);

      setLookupData({
        suburbs: suburbsRes.data || [],
        maintenanceTypes: maintenanceTypesRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchCenterDetails = async (centerId) => {
    try {
      const [maintenanceRes, siteVisitsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/maintenance/islamic-center/${centerId}`),
        axiosApi.get(`${API_BASE_URL}/siteVisits/islamic-center/${centerId}`),
      ]);

      setMaintenance(maintenanceRes.data || []);
      setSiteVisits(siteVisitsRes.data || []);
    } catch (error) {
      console.error("Error fetching center details:", error);
    }
  };

  const handleUpdate = () => {
    fetchCenters();
    if (selectedCenter) {
      fetchCenterDetails(selectedCenter.id);
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

  const filteredCenters = centers.filter((center) =>
    center.center_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.suburb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <Breadcrumbs title="Islamic Centers" breadcrumbItem="Islamic Centers Management" />

        <Row>
          {/* Left Panel - Islamic Centers List */}
          <Col lg={3}>
            <IslamicCentersListPanel
              centers={filteredCenters}
              selectedCenter={selectedCenter}
              onSelectCenter={(center) => {
                setSelectedCenter(center);
                setCreateMode(false);
              }}
              onCreateNew={() => {
                setSelectedCenter(null);
                setCreateMode(true);
              }}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              showAlert={showAlert}
            />
          </Col>

          {/* Main Panel - Islamic Center Details */}
          <Col lg={9}>
            {/* Always render summary component to allow creation */}
            <IslamicCentersSummary
              center={selectedCenter}
              createMode={createMode}
              onUpdate={handleUpdate}
              onCloseCreate={() => setCreateMode(false)}
              showAlert={showAlert}
              lookupData={lookupData}
            />

            {selectedCenter ? (
              <>
                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedCenter.id}
                  center={selectedCenter}
                  centerId={selectedCenter.id}
                  maintenance={maintenance}
                  siteVisits={siteVisits}
                  onUpdate={handleUpdate}
                  showAlert={showAlert}
                  lookupData={lookupData}
                />
              </>
            ) : (
              !createMode && (
                <div className="text-center mt-5 pt-5">
                  <i className="bx bx-mosque display-1 text-muted"></i>
                  <h4 className="mt-4 text-muted">
                    {loading ? "Loading Islamic centers..." : "Select an Islamic center to view details"}
                  </h4>
                </div>
              )
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default IslamicCentersManagement;

