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
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import SupplierListPanel from "./components/SupplierListPanel";
import { sanitizeTenDigit, tenDigitRule } from "../../helpers/phone";
import SupplierSummary from "./components/SupplierSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";

const SupplierManagement = () => {
  // Meta title
  document.title = "Supplier Management | Welfare App";

  // State management
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Detail data states
  const [evaluations, setEvaluations] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    supplierCategories: [],
  });

  // Create form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      Name: "",
      Registration_No: "",
      Contact_Person: "",
      Contact_Email: "",
      Contact_Phone: "",
      Address: "",
      Category_ID: "",
      Status: "Active",
    },
  });

  // Fetch all suppliers on mount
  useEffect(() => {
    fetchSuppliers();
    fetchLookupData();
  }, []);

  // Fetch detail data when a supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/supplierProfile`);
      setSuppliers(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedSupplier(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      showAlert("Failed to fetch suppliers", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [supplierCategoriesRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Supplier_Category`),
      ]);

      setLookupData({
        supplierCategories: supplierCategoriesRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchSupplierDetails = async (supplierId) => {
    try {
      const [evaluationsRes, documentsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/supplierEvaluation?supplier_id=${supplierId}`),
        axiosApi.get(`${API_BASE_URL}/supplierDocument?supplier_id=${supplierId}`),
      ]);

      setEvaluations(evaluationsRes.data || []);
      setDocuments(documentsRes.data || []);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      showAlert("Failed to fetch supplier details", "warning");
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

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    // Clear existing detail data to avoid showing stale records while fetching
    setEvaluations([]);
    setDocuments([]);
    // Fetch fresh detail data immediately for better UX
    if (supplier?.id) {
      fetchSupplierDetails(supplier.id);
    }
  };

  const handleSupplierUpdate = useCallback(() => {
    fetchSuppliers();
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const handleCreateSupplier = async (formData) => {
    try {
      const currentUser = getHudasaUser();

      // Convert to lowercase for backend
      const payload = {
        name: formData.Name || "",
        registration_no: formData.Registration_No || "",
        contact_person: formData.Contact_Person || "",
        contact_email: formData.Contact_Email || "",
        contact_phone: formData.Contact_Phone || "",
        address: formData.Address || "",
        category_id: formData.Category_ID || null,
        status: formData.Status || "Active",
        created_by: getAuditName(),
      };

      await axiosApi.post(`${API_BASE_URL}/supplierProfile`, payload);
      
      showAlert("Supplier created successfully!", "success");
      setCreateModalOpen(false);
      reset();
      fetchSuppliers();
    } catch (error) {
      console.error("Error creating supplier:", error);
      showAlert(
        error.response?.data?.error || "Failed to create supplier",
        "danger"
      );
    }
  };

  const toggleCreateModal = () => {
    setCreateModalOpen(!createModalOpen);
    if (!createModalOpen) {
      reset();
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (supplier.name || "").toLowerCase().includes(searchLower) ||
      (supplier.registration_no || "").toLowerCase().includes(searchLower) ||
      (supplier.contact_person || "").toLowerCase().includes(searchLower) ||
      (supplier.contact_email || "").toLowerCase().includes(searchLower)
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

        <Breadcrumbs title="Suppliers" breadcrumbItem="Supplier Management" />

        <Row>
          {/* Left Panel - Supplier List */}
          <Col lg={3}>
            <SupplierListPanel
              suppliers={filteredSuppliers}
              selectedSupplier={selectedSupplier}
              onSelectSupplier={handleSupplierSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchSuppliers}
              onCreateClick={toggleCreateModal}
            />
          </Col>

          {/* Main Panel - Supplier Management */}
          <Col lg={9}>
            {selectedSupplier ? (
              <>
                {/* Summary Metrics */}
                <SummaryMetrics
                  evaluations={evaluations}
                  documents={documents}
                />

                {/* Supplier Summary */}
                <SupplierSummary
                  supplier={selectedSupplier}
                  lookupData={lookupData}
                  onUpdate={handleSupplierUpdate}
                  showAlert={showAlert}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedSupplier.id}
                  supplierId={selectedSupplier.id}
                  evaluations={evaluations}
                  documents={documents}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-store display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading suppliers..." : "Select a supplier to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>

        {/* Create Supplier Modal */}
        <Modal
          isOpen={createModalOpen}
          toggle={toggleCreateModal}
          size="lg"
          backdrop="static"
          centered
        >
          <ModalHeader toggle={toggleCreateModal}>
            <i className="bx bx-plus-circle me-2 text-primary"></i>
            Create New Supplier
          </ModalHeader>
          <Form onSubmit={handleSubmit(handleCreateSupplier)}>
            <ModalBody>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Name">
                      Supplier Name <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Name"
                      control={control}
                      rules={{ required: "Supplier name is required" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="text"
                          id="Name"
                          placeholder="Enter supplier name"
                          invalid={!!errors.Name}
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
                    <Label for="Registration_No">Registration Number</Label>
                    <Controller
                      name="Registration_No"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="text"
                          id="Registration_No"
                          placeholder="Enter registration number"
                        />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Contact_Person">Contact Person</Label>
                    <Controller
                      name="Contact_Person"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="text"
                          id="Contact_Person"
                          placeholder="Enter contact person"
                        />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Contact_Email">Email</Label>
                    <Controller
                      name="Contact_Email"
                      control={control}
                      rules={{
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="email"
                          id="Contact_Email"
                          placeholder="Enter email"
                          invalid={!!errors.Contact_Email}
                        />
                      )}
                    />
                    {errors.Contact_Email && (
                      <FormFeedback>{errors.Contact_Email.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Contact_Phone">Phone</Label>
                    <Controller
                      name="Contact_Phone"
                      control={control}
                      rules={tenDigitRule(false, "Phone")}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="text"
                          id="Contact_Phone"
                          placeholder="0123456789"
                          maxLength={10}
                          onInput={(e) => {
                            e.target.value = sanitizeTenDigit(e.target.value);
                            field.onChange(e);
                          }}
                          value={field.value}
                          onBlur={field.onBlur}
                          invalid={!!errors.Contact_Phone}
                        />
                      )}
                    />
                    {errors.Contact_Phone && (
                      <FormFeedback>{errors.Contact_Phone.message}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Category_ID">Category</Label>
                    <Controller
                      name="Category_ID"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="select"
                          id="Category_ID"
                        >
                          <option value="">Select Category</option>
                          {lookupData.supplierCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
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
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="textarea"
                          id="Address"
                          rows="3"
                          placeholder="Enter address"
                        />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Status">Status</Label>
                    <Controller
                      name="Status"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="select"
                          id="Status"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </Input>
                      )}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                color="light"
                onClick={toggleCreateModal}
                disabled={isSubmitting}
                className="me-2"
              >
                <i className="bx bx-x me-1"></i>
                Cancel
              </Button>
              <Button
                type="submit"
                color="success"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i>
                    Create Supplier
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

export default SupplierManagement;
