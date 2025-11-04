import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Spinner,
  Alert,
} from "reactstrap";

// Import Components
import WelcomeComp from "./WelcomeComp";
import NationalityChart from "./NationalityChart";
import GenderChart from "./GenderChart";
import RaceChart from "./RaceChart";
import EducationChart from "./EducationChart";
import EmploymentChart from "./EmploymentChart";
import MaritalChart from "./MaritalChart";
import SuburbsChart from "./SuburbsChart";
import FileStatusChart from "./FileStatusChart";
import FileConditionChart from "./FileConditionChart";
import StatsCards from "./StatsCards";

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

// i18n
import { withTranslation } from "react-i18next";

// API
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";

const ApplicantStatistics = (props) => {
  // Meta title
  document.title = "Dashboard | Hudasa";

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    nationality: [],
    gender: [],
    race: [],
    education: [],
    employment: [],
    marital: [],
    suburbs: [],
    fileStatus: [],
    fileCondition: [],
    totalApplicants: 0,
    activeApplicants: 0,
    newThisMonth: 0,
  });

  useEffect(() => {
    fetchStatisticsData();
  }, []);

  const fetchStatisticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from backend endpoint
      const response = await axiosApi.get(`${API_BASE_URL}/dashboard/applicant-statistics`);
      const data = response.data;

      // Transform data to ensure consistency
      setStatsData({
        nationality: Array.isArray(data.nationality) ? data.nationality : [],
        gender: Array.isArray(data.gender) ? data.gender : [],
        race: Array.isArray(data.race) ? data.race : [],
        education: Array.isArray(data.education) ? data.education : [],
        employment: Array.isArray(data.employment) ? data.employment : [],
        marital: Array.isArray(data.marital) ? data.marital : [],
        suburbs: Array.isArray(data.suburbs) ? data.suburbs : [],
        fileStatus: Array.isArray(data.fileStatus) ? data.fileStatus : [],
        fileCondition: Array.isArray(data.fileCondition) ? data.fileCondition : [],
        totalApplicants: parseInt(data.summary?.total_applicants) || 0,
        activeApplicants: parseInt(data.summary?.active_applicants) || 0,
        newThisMonth: parseInt(data.summary?.new_this_month) || 0,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError(error.response?.data?.error || error.message || "Failed to load statistics");
      
      // Use mock data as fallback
      setStatsData(getMockData());
    } finally {
      setLoading(false);
    }
  };


  const getMockData = () => {
    return {
      nationality: [
        { label: "South African", value: 450 },
        { label: "Zimbabwean", value: 120 },
        { label: "Nigerian", value: 80 },
        { label: "Somali", value: 65 },
        { label: "Other", value: 85 },
      ],
      gender: [
        { label: "Male", value: 420 },
        { label: "Female", value: 380 },
      ],
      race: [
        { label: "Black African", value: 520 },
        { label: "Coloured", value: 150 },
        { label: "Indian", value: 80 },
        { label: "White", value: 50 },
      ],
      education: [
        { label: "Matric", value: 320 },
        { label: "Tertiary", value: 180 },
        { label: "Primary", value: 150 },
        { label: "No Formal", value: 100 },
        { label: "Post-Graduate", value: 50 },
      ],
      employment: [
        { label: "Unemployed", value: 480 },
        { label: "Employed", value: 200 },
        { label: "Self-Employed", value: 80 },
        { label: "Student", value: 40 },
      ],
      marital: [
        { label: "Single", value: 350 },
        { label: "Married", value: 280 },
        { label: "Divorced", value: 100 },
        { label: "Widowed", value: 70 },
      ],
      suburbs: [
        { label: "Mitchells Plain", value: 180 },
        { label: "Khayelitsha", value: 160 },
        { label: "Athlone", value: 120 },
        { label: "Manenberg", value: 100 },
        { label: "Bonteheuwel", value: 90 },
        { label: "Hanover Park", value: 70 },
        { label: "Delft", value: 65 },
        { label: "Philippi", value: 55 },
        { label: "Gugulethu", value: 50 },
        { label: "Nyanga", value: 45 },
      ],
      fileStatus: [
        { label: "Active", value: 520 },
        { label: "Inactive", value: 180 },
        { label: "Pending", value: 100 },
      ],
      fileCondition: [
        { label: "Good", value: 420 },
        { label: "Fair", value: 250 },
        { label: "Poor", value: 130 },
      ],
      totalApplicants: 800,
      activeApplicants: 520,
      newThisMonth: 45,
    };
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Render Breadcrumb */}
          <Breadcrumbs
            title={props.t("Dashboard")}
            breadcrumbItem={props.t("Dashboard")}
          />

          {/* Error Alert */}
          {error && (
            <Alert color="danger" className="alert-dismissible fade show" role="alert">
              <i className="mdi mdi-alert-outline me-2"></i>
              <strong>Error:</strong> {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
                aria-label="Close"
              ></button>
            </Alert>
          )}

          {/* Welcome Section & Stats Cards */}
          <Row>
            <Col xl="4">
              <WelcomeComp loading={loading} />
            </Col>
            <Col xl="8">
              <StatsCards data={statsData} loading={loading} />
            </Col>
          </Row>

          {/* Charts Grid - Row 1 */}
          <Row>
            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Nationality</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <NationalityChart data={statsData.nationality} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Gender</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="success" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <GenderChart data={statsData.gender} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Highest Education</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="warning" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <EducationChart data={statsData.education} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Grid - Row 2 */}
          <Row>
            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Race</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="info" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <RaceChart data={statsData.race} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Suburbs</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="success" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <SuburbsChart data={statsData.suburbs} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Employment Status</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="danger" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <EmploymentChart data={statsData.employment} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Grid - Row 3 */}
          <Row>
            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Marital Status</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <MaritalChart data={statsData.marital} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">File Status</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="info" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <FileStatusChart data={statsData.fileStatus} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="4" lg="6">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">File Condition</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="warning" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <FileConditionChart data={statsData.fileCondition} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

ApplicantStatistics.propTypes = {
  t: PropTypes.any,
};

export default withTranslation()(ApplicantStatistics);

