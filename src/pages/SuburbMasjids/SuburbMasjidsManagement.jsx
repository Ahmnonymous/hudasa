import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import SuburbMasjidsListPanel from "./components/SuburbMasjidsListPanel";
import SuburbMasjidsSummary from "./components/SuburbMasjidsSummary";
import DetailTabs from "./components/DetailTabs";

const SuburbMasjidsManagement = () => {
  document.title = "Suburb Masjids Management | Welfare App";

  const [masjids, setMasjids] = useState([]);
  const [selectedMasjid, setSelectedMasjid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [createMode, setCreateMode] = useState(false);

  const [census, setCensus] = useState([]);
  const [concerns, setConcerns] = useState([]);

  const [lookupData, setLookupData] = useState({
    suburbs: [],
  });

  useEffect(() => {
    fetchMasjids();
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (selectedMasjid) {
      fetchMasjidDetails(selectedMasjid.id);
    }
  }, [selectedMasjid]);

  const fetchMasjids = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/suburbMasjids`);
      setMasjids(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedMasjid(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching suburb masjids:", error);
      showAlert("Failed to fetch suburb masjids", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [suburbsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Suburb`),
      ]);

      setLookupData({
        suburbs: suburbsRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchMasjidDetails = async (masjidId) => {
    try {
      const masjid = masjids.find(m => m.id === masjidId);
      if (!masjid || !masjid.suburb_id) return;

      const [censusRes, concernsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/suburbCensus/suburb/${masjid.suburb_id}`),
        axiosApi.get(`${API_BASE_URL}/suburbConcerns/suburb/${masjid.suburb_id}`),
      ]);

      setCensus(censusRes.data || []);
      setConcerns(concernsRes.data || []);
    } catch (error) {
      console.error("Error fetching masjid details:", error);
    }
  };

  const handleUpdate = () => {
    fetchMasjids();
    if (selectedMasjid) {
      fetchMasjidDetails(selectedMasjid.id);
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

  const filteredMasjids = masjids.filter((masjid) =>
    masjid.masjid_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    masjid.imaam_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    masjid.suburb_id?.toString().includes(searchTerm)
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

        <Breadcrumbs title="Suburb Masjids" breadcrumbItem="Suburb Masjids Management" />

        <Row>
          {/* Left Panel - Suburb Masjids List */}
          <Col lg={3}>
            <SuburbMasjidsListPanel
              masjids={filteredMasjids}
              selectedMasjid={selectedMasjid}
              onSelectMasjid={(masjid) => {
                setSelectedMasjid(masjid);
                setCreateMode(false);
              }}
              onCreateNew={() => {
                setSelectedMasjid(null);
                setCreateMode(true);
              }}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              lookupData={lookupData}
            />
          </Col>

          {/* Main Panel - Suburb Masjid Details */}
          <Col lg={9}>
            {/* Always render summary component to allow creation */}
            <SuburbMasjidsSummary
              masjid={selectedMasjid}
              createMode={createMode}
              onUpdate={handleUpdate}
              onCloseCreate={() => setCreateMode(false)}
              showAlert={showAlert}
              lookupData={lookupData}
            />

            {selectedMasjid ? (
              <>
                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedMasjid.id}
                  masjid={selectedMasjid}
                  masjidId={selectedMasjid.id}
                  census={census}
                  concerns={concerns}
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
                    {loading ? "Loading masjids..." : "Select a masjid to view details"}
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

export default SuburbMasjidsManagement;

