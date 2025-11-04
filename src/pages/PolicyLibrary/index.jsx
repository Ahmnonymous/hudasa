import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Spinner, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../helpers/url_helper";

const PolicyLibrary = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Lookup data for enriching policies
  const [policyTypes, setPolicyTypes] = useState([]);
  const [fileStatuses, setFileStatuses] = useState([]);
  const [policyFields, setPolicyFields] = useState([]);

  // Meta title
  document.title = "Policy Library | Welfare App";

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [policiesRes, typesRes, statusRes, fieldsRes] = await Promise.all([
          axiosApi.get(`${API_BASE_URL}/policyAndProcedure`),
          axiosApi.get(`${API_BASE_URL}/lookup/Policy_Procedure_Type`),
          axiosApi.get(`${API_BASE_URL}/lookup/File_Status`),
          axiosApi.get(`${API_BASE_URL}/lookup/Policy_Procedure_Field`),
        ]);

        setPolicyTypes(typesRes.data || []);
        setFileStatuses(statusRes.data || []);
        setPolicyFields(fieldsRes.data || []);
        
        const allPolicies = policiesRes.data || [];
        
        // Find Active status ID
        const activeStatus = statusRes.data?.find(s => s.name === 'Active');
        const activeStatusId = activeStatus ? activeStatus.id : null;
        
        // Filter for active policies only
        const activePolicies = allPolicies.filter(policy => {
          // Check if policy has active status
          if (activeStatusId && policy.status) {
            return parseInt(policy.status) === parseInt(activeStatusId);
          }
          // If we can't determine, show all policies
          return true;
        });
        
        // Enrich policies with lookup names
        const enrichedPolicies = activePolicies.map(policy => ({
          ...policy,
          type_name: typesRes.data?.find(t => String(t.id) === String(policy.type))?.name || '',
          status_name: statusRes.data?.find(s => String(s.id) === String(policy.status))?.name || '',
          field_name: fieldsRes.data?.find(f => String(f.id) === String(policy.field))?.name || '',
        }));
        
        setPolicies(enrichedPolicies);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch policies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleViewPDF = (policyId, filename) => {
    window.open(
      `${API_STREAM_BASE_URL}/policyAndProcedure/${policyId}/view-file`,
      '_blank'
    );
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="Policy Library" breadcrumbItem="Active Policies" />

        {error && (
          <Alert color="danger" className="mb-4">
            <i className="bx bx-error-circle me-2"></i>
            {error}
          </Alert>
        )}

        {loading && (
          <div className="text-center my-5">
            <Spinner color="primary" />
            <p className="mt-2 text-muted">Loading policies...</p>
          </div>
        )}

        {!loading && !error && policies.length === 0 && (
          <Alert color="info" className="mb-4">
            <i className="bx bx-info-circle me-2"></i>
            No active policies available at the moment.
          </Alert>
        )}

        {!loading && !error && policies.length > 0 && (
          <Row className="g-3">
            {policies.map((policy) => (
              <Col key={policy.id} md={6} lg={4}>
                <Card className="h-100 shadow-sm">
                  <CardBody className="d-flex flex-column p-3">
                    <div className="mb-2">
                      <div className="d-flex align-items-center mb-2">
                        <div className="d-flex align-items-center me-2">
                          <i className="bx bx-file-blank text-primary me-2" style={{ fontSize: "1.5rem" }}></i>
                          <CardTitle tag="h5" className="mb-0">
                            {policy.name || "Untitled Policy"}
                          </CardTitle>
                        </div>
                        {policy.type_name && (
                          <span className="badge bg-info">
                            <i className="bx bx-tag me-1"></i>
                            {policy.type_name}
                          </span>
                        )}
                      </div>
                      
                      {policy.description && (
                        <p className="text-muted mb-2" style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
                          {policy.description}
                        </p>
                      )}
                      
                      {policy.field_name && (
                        <div className="mb-0">
                          <span className="badge bg-secondary">
                            <i className="bx bx-grid-small me-1"></i>
                            {policy.field_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      {policy.file_filename ? (
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => handleViewPDF(policy.id, policy.file_filename)}
                        >
                          <i className="bx bx-file me-1"></i>
                          View PDF
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary w-100"
                          disabled
                        >
                          <i className="bx bx-file me-1"></i>
                          No File Available
                        </button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default PolicyLibrary;
