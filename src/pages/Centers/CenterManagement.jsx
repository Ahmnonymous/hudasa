import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { validateTabsAndNavigate } from "../../helpers/tabValidation";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import CenterListPanel from "./components/CenterListPanel";
import CenterSummary from "./components/CenterSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";
import { sanitizeTenDigit, tenDigitRule } from "../../helpers/phone";

const CenterManagement = () => {
  // Meta title
  document.title = "Center Management | Welfare App";

  // State management
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createActiveTab, setCreateActiveTab] = useState("1");

  // Detail data states
  const [audits, setAudits] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    suburbs: [],
    maintenanceTypes: [],
  });

  // Create form
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isSubmitting: createIsSubmitting },
    reset: resetCreateForm,
    trigger: createTrigger,
    getValues: createGetValues,
  } = useForm({ shouldUnregister: false });

  // Fetch all centers on mount
  useEffect(() => {
    fetchCenters();
    fetchLookupData();
  }, []);

  // Fetch detail data when a center is selected
  useEffect(() => {
    if (selectedCenter) {
      fetchCenterDetails(selectedCenter.id);
    }
  }, [selectedCenter]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/centerDetail`);
      setCenters(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedCenter(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
      showAlert("Failed to fetch centers", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [suburbsRes, maintenanceTypesRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Suburb`),
        axiosApi.get(`${API_BASE_URL}/lookup/Maintenance_Type`),
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
      const [auditsRes, maintenanceRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/centerAudits?center_id=${centerId}`),
        axiosApi.get(`${API_BASE_URL}/maintenance/center-detail/${centerId}`),
      ]);

      setAudits(auditsRes.data || []);
      setMaintenance(maintenanceRes.data || []);
    } catch (error) {
      console.error("Error fetching center details:", error);
      showAlert("Failed to fetch center details", "warning");
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

  const handleCenterSelect = (center) => {
    setSelectedCenter(center);
    // Clear existing detail data to avoid showing stale records while fetching
    setAudits([]);
    // Fetch fresh detail data immediately for better UX
    if (center?.id) {
      fetchCenterDetails(center.id);
    }
  };

  const handleCenterUpdate = useCallback(() => {
    fetchCenters();
    if (selectedCenter) {
      fetchCenterDetails(selectedCenter.id);
    }
  }, [selectedCenter]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedCenter) {
      fetchCenterDetails(selectedCenter.id);
    }
  }, [selectedCenter]);

  const filteredCenters = centers.filter((center) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (center.organisation_name || "").toLowerCase().includes(searchLower) ||
      (center.npo_number || "").toLowerCase().includes(searchLower) ||
      (center.email_address || "").toLowerCase().includes(searchLower) ||
      (center.contact_number || "").toLowerCase().includes(searchLower)
    );
  });

  const toggleCreateModal = () => {
    setCreateModalOpen(!createModalOpen);
    if (!createModalOpen) {
      setCreateActiveTab("1");
      resetCreateForm({
        Organisation_Name: "",
        Date_of_Establishment: "",
        Contact_Number: "",
        Email_Address: "",
        Website_Link: "",
        Address: "",
        Area: "",
        Ameer: "",
        Cell1: "",
        Cell2: "",
        Cell3: "",
        Contact1: "",
        Contact2: "",
        Contact3: "",
        NPO_Number: "",
        Service_Rating_Email: "",
        Logo: null,
        QR_Code_Service_URL: null,
      });
    }
  };

  const toggleCreateTab = (tab) => {
    if (createActiveTab !== tab) {
      setCreateActiveTab(tab);
    }
  };

  const onCreateSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      const hasLogo = data.Logo && data.Logo.length > 0;
      const hasQR = data.QR_Code_Service_URL && data.QR_Code_Service_URL.length > 0;

      if (hasLogo || hasQR) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("organisation_name", data.Organisation_Name);
        formData.append("date_of_establishment", data.Date_of_Establishment || "");
        formData.append("contact_number", data.Contact_Number || "");
        formData.append("email_address", data.Email_Address || "");
        formData.append("website_link", data.Website_Link || "");
        formData.append("address", data.Address || "");
        if (data.Area) formData.append("area", data.Area);
        formData.append("ameer", data.Ameer || "");
        formData.append("cell1", data.Cell1 || "");
        formData.append("cell2", data.Cell2 || "");
        formData.append("cell3", data.Cell3 || "");
        formData.append("contact1", data.Contact1 || "");
        formData.append("contact2", data.Contact2 || "");
        formData.append("contact3", data.Contact3 || "");
        formData.append("npo_number", data.NPO_Number || "");
        formData.append("service_rating_email", data.Service_Rating_Email || "");
        formData.append("created_by", currentUser?.username || "system");

        if (hasLogo) formData.append("logo", data.Logo[0]);
        if (hasQR) formData.append("qr_code_service_url", data.QR_Code_Service_URL[0]);

        await axiosApi.post(`${API_BASE_URL}/centerDetail`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Use JSON for regular create without files
        const payload = {
          organisation_name: data.Organisation_Name,
          date_of_establishment: data.Date_of_Establishment || null,
          contact_number: data.Contact_Number,
          email_address: data.Email_Address,
          website_link: data.Website_Link,
          address: data.Address,
          area: data.Area || null,
          ameer: data.Ameer,
          cell1: data.Cell1,
          cell2: data.Cell2,
          cell3: data.Cell3,
          contact1: data.Contact1,
          contact2: data.Contact2,
          contact3: data.Contact3,
          npo_number: data.NPO_Number,
          service_rating_email: data.Service_Rating_Email,
          created_by: getAuditName(),
        };

        await axiosApi.post(`${API_BASE_URL}/centerDetail`, payload);
      }

      showAlert("Center has been created successfully", "success");
      fetchCenters();
      toggleCreateModal();
    } catch (error) {
      console.error("Error creating center:", error);
      showAlert(error?.response?.data?.error || "Failed to create center", "danger");
    }
  };

  // Cross-tab validation for create-center modal
  const createRequiredFields = ["Organisation_Name"];
  const createFieldTabMap = { Organisation_Name: "1" };

  const handleValidatedCreateSubmit = async () => {
    const ok = await validateTabsAndNavigate({
      requiredFields: createRequiredFields,
      fieldTabMap: createFieldTabMap,
      trigger: (fields, opts) => createTrigger(fields, opts),
      getValues: (name) => createGetValues(name),
      setActiveTab: setCreateActiveTab,
      showAlert,
    });
    if (!ok) return;
    // Now run full RHF validation and submit
    return handleCreateSubmit(onCreateSubmit)();
  };

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

        <Breadcrumbs title="Centers" breadcrumbItem="Center Management" />

        <Row>
          {/* Left Panel - Center List */}
          <Col lg={3}>
            <CenterListPanel
              centers={filteredCenters}
              selectedCenter={selectedCenter}
              onSelectCenter={handleCenterSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchCenters}
              onCreateNew={() => setCreateModalOpen(true)}
            />
          </Col>

          {/* Main Panel - Center Details */}
          <Col lg={9}>
            {selectedCenter ? (
              <>
                {/* Summary Metrics */}
                <SummaryMetrics
                  centers={centers}
                  audits={audits}
                />

                {/* Center Summary */}
                <CenterSummary
                  center={selectedCenter}
                  lookupData={lookupData}
                  onUpdate={handleCenterUpdate}
                  showAlert={showAlert}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedCenter.id}
                  centerId={selectedCenter.id}
                  audits={audits}
                  maintenance={maintenance}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-building display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading centers..." : "Select a center to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>

        {/* Create Center Modal */}
        <Modal isOpen={createModalOpen} toggle={toggleCreateModal} centered size="lg" backdrop="static">
          <ModalHeader toggle={toggleCreateModal}>
            <i className="bx bx-plus-circle me-2"></i>
            Create New Center
          </ModalHeader>

          <Form onSubmit={(e) => { e.preventDefault(); handleValidatedCreateSubmit(); }}>
            <ModalBody>
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={classnames({ active: createActiveTab === "1" })}
                    onClick={() => toggleCreateTab("1")}
                    style={{ cursor: "pointer" }}
                  >
                    Basic Info
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: createActiveTab === "2" })}
                    onClick={() => toggleCreateTab("2")}
                    style={{ cursor: "pointer" }}
                  >
                    Contact Details
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: createActiveTab === "3" })}
                    onClick={() => toggleCreateTab("3")}
                    style={{ cursor: "pointer" }}
                  >
                    Files & Media
                  </NavLink>
                </NavItem>
              </Nav>

              <TabContent activeTab={createActiveTab} className="pt-3">
                <TabPane tabId="1">
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Organisation_Name">
                          Organization Name <span className="text-danger">*</span>
                        </Label>
                        <Controller
                          name="Organisation_Name"
                          control={createControl}
                          rules={{ required: "Organization name is required" }}
                          render={({ field }) => (
                            <Input id="Organisation_Name" type="text" invalid={!!createErrors.Organisation_Name} {...field} />
                          )}
                        />
                        {createErrors.Organisation_Name && <FormFeedback>{createErrors.Organisation_Name.message}</FormFeedback>}
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="NPO_Number">NPO Number</Label>
                        <Controller
                          name="NPO_Number"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="NPO_Number" type="text" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Date_of_Establishment">Date of Establishment</Label>
                        <Controller
                          name="Date_of_Establishment"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Date_of_Establishment" type="date" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Ameer">Ameer</Label>
                        <Controller
                          name="Ameer"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Ameer" type="text" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Area">Area</Label>
                        <Controller
                          name="Area"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Area" type="select" {...field}>
                              <option value="">Select Area</option>
                              {(lookupData.suburbs || []).map((suburb) => (
                                <option key={suburb.id} value={suburb.id}>{suburb.name}</option>
                              ))}
                            </Input>
                          )}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <Label for="Address">Address</Label>
                        <Controller
                          name="Address"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Address" type="textarea" rows="2" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </TabPane>

                <TabPane tabId="2">
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Contact_Number">Contact Number</Label>
                        <Controller
                          name="Contact_Number"
                          control={createControl}
                          rules={tenDigitRule(false, "Contact Number")}
                          render={({ field }) => (
                            <Input
                              id="Contact_Number"
                              type="text"
                              placeholder="0123456789"
                              maxLength={10}
                              onInput={(e) => {
                                e.target.value = sanitizeTenDigit(e.target.value);
                                field.onChange(e);
                              }}
                              value={field.value}
                              onBlur={field.onBlur}
                              invalid={!!createErrors.Contact_Number}
                              {...field}
                            />
                          )}
                        />
                        {createErrors.Contact_Number && (
                          <FormFeedback>{createErrors.Contact_Number.message}</FormFeedback>
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Email_Address">Email Address</Label>
                        <Controller
                          name="Email_Address"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Email_Address" type="email" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Website_Link">Website</Label>
                        <Controller
                          name="Website_Link"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Website_Link" type="url" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Service_Rating_Email">Service Rating Email</Label>
                        <Controller
                          name="Service_Rating_Email"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Service_Rating_Email" type="email" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </TabPane>

                <TabPane tabId="3">
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Logo">Logo Upload</Label>
                        <Controller
                          name="Logo"
                          control={createControl}
                          render={({ field: { onChange, value, ...field } }) => (
                            <Input
                              id="Logo"
                              type="file"
                              onChange={(e) => onChange(e.target.files)}
                              accept="image/*"
                              {...field}
                            />
                          )}
                        />
                        <small className="text-muted d-block mt-1">
                          Supported formats: JPG, PNG, GIF
                        </small>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="QR_Code_Service_URL">QR Code</Label>
                        <Controller
                          name="QR_Code_Service_URL"
                          control={createControl}
                          render={({ field: { onChange, value, ...field } }) => (
                            <Input
                              id="QR_Code_Service_URL"
                              type="file"
                              onChange={(e) => onChange(e.target.files)}
                              accept="image/*"
                              {...field}
                            />
                          )}
                        />
                        <small className="text-muted d-block mt-1">
                          Supported formats: JPG, PNG, GIF
                        </small>
                      </FormGroup>
                    </Col>
                  </Row>
                </TabPane>
              </TabContent>
            </ModalBody>

            <ModalFooter className="d-flex justify-content-end">
              <Button color="light" onClick={toggleCreateModal} disabled={createIsSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              <Button color="success" type="submit" disabled={createIsSubmitting}>
                {createIsSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i> Create
                  </>
                )}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default CenterManagement;


