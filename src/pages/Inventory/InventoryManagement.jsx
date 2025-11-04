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
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import InventoryListPanel from "./components/InventoryListPanel";
import InventorySummary from "./components/InventorySummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";

const InventoryManagement = () => {
  // Meta title
  document.title = "Inventory Management | Welfare App";

  // State management
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createActiveTab, setCreateActiveTab] = useState("1");

  // Detail data states
  const [transactions, setTransactions] = useState([]);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    hampers: [],
    suppliers: [],
    employees: [],
  });

  // Create form
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isSubmitting: createIsSubmitting },
    reset: resetCreateForm,
  } = useForm();

  // Fetch all items on mount
  useEffect(() => {
    fetchItems();
    fetchLookupData();
  }, []);

  // Fetch detail data when an item is selected
  useEffect(() => {
    if (selectedItem) {
      fetchItemDetails(selectedItem.id);
    }
  }, [selectedItem]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/inventoryItems`);
      setItems(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedItem(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      showAlert("Failed to fetch inventory items", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [hampersRes, suppliersRes, employeesRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Hampers`),
        axiosApi.get(`${API_BASE_URL}/supplierProfile`),
        axiosApi.get(`${API_BASE_URL}/employee`),
      ]);

      setLookupData({
        hampers: hampersRes.data || [],
        suppliers: suppliersRes.data || [],
        employees: employeesRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchItemDetails = async (itemId) => {
    try {
      const [transactionsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/inventoryTransactions?item_id=${itemId}`),
      ]);

      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error("Error fetching item details:", error);
      showAlert("Failed to fetch item details", "warning");
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

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    // Clear existing detail data to avoid showing stale records while fetching
    setTransactions([]);
    // Fetch fresh detail data immediately for better UX
    if (item?.id) {
      fetchItemDetails(item.id);
    }
  };

  const handleItemUpdate = useCallback(() => {
    fetchItems();
    if (selectedItem) {
      fetchItemDetails(selectedItem.id);
    }
  }, [selectedItem]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedItem) {
      fetchItemDetails(selectedItem.id);
      // Also refresh item to get updated quantity
      fetchItems();
    }
  }, [selectedItem]);

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.item_name || "").toLowerCase().includes(searchLower) ||
      (item.description || "").toLowerCase().includes(searchLower) ||
      (item.unit || "").toLowerCase().includes(searchLower)
    );
  });

  const toggleCreateModal = () => {
    setCreateModalOpen(!createModalOpen);
    if (!createModalOpen) {
      setCreateActiveTab("1");
      resetCreateForm({
        Item_Name: "",
        Description: "",
        Hamper_Type: "",
        Unit: "",
        Min_Stock: "",
        Cost_Per_Unit: "",
        Supplier_ID: "",
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
      
      const payload = {
        item_name: data.Item_Name,
        description: data.Description,
        hamper_type: data.Hamper_Type && data.Hamper_Type !== "" ? data.Hamper_Type : null,
        quantity: 0, // Start with 0, will be updated via transactions
        unit: data.Unit,
        min_stock: data.Min_Stock ? parseFloat(data.Min_Stock) : null,
        cost_per_unit: data.Cost_Per_Unit ? parseFloat(data.Cost_Per_Unit) : null,
        supplier_id: data.Supplier_ID || null,
        center_id: currentUser?.center_id || 1,
        created_by: getAuditName(),
      };

      await axiosApi.post(`${API_BASE_URL}/inventoryItems`, payload);
      showAlert("Inventory item has been created successfully", "success");
      fetchItems();
      toggleCreateModal();
    } catch (error) {
      console.error("Error creating inventory item:", error);
      showAlert(error?.response?.data?.error || "Failed to create inventory item", "danger");
    }
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

        <Breadcrumbs title="Inventory" breadcrumbItem="Inventory Management" />

        <Row>
          {/* Left Panel - Inventory Items List */}
          <Col lg={3}>
            <InventoryListPanel
              items={filteredItems}
              selectedItem={selectedItem}
              onSelectItem={handleItemSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchItems}
              onCreateNew={() => setCreateModalOpen(true)}
            />
          </Col>

          {/* Main Panel - Item Details */}
          <Col lg={9}>
            {selectedItem ? (
              <>
                {/* Summary Metrics */}
                <SummaryMetrics
                  items={items}
                  transactions={transactions}
                />

                {/* Item Summary */}
                <InventorySummary
                  item={selectedItem}
                  lookupData={lookupData}
                  onUpdate={handleItemUpdate}
                  showAlert={showAlert}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedItem.id}
                  itemId={selectedItem.id}
                  transactions={transactions}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-box display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading inventory items..." : "Select an item to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>

        {/* Create Item Modal */}
        <Modal isOpen={createModalOpen} toggle={toggleCreateModal} centered size="lg" backdrop="static">
          <ModalHeader toggle={toggleCreateModal}>
            <i className="bx bx-plus-circle me-2"></i>
            Create New Inventory Item
          </ModalHeader>

          <Form onSubmit={handleCreateSubmit(onCreateSubmit)}>
            <ModalBody>
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={classnames({ active: createActiveTab === "1" })}
                    onClick={() => toggleCreateTab("1")}
                    style={{ cursor: "pointer" }}
                  >
                    Item Details
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: createActiveTab === "2" })}
                    onClick={() => toggleCreateTab("2")}
                    style={{ cursor: "pointer" }}
                  >
                    Stock & Pricing
                  </NavLink>
                </NavItem>
              </Nav>

              <TabContent activeTab={createActiveTab} className="pt-3">
                <TabPane tabId="1">
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="Item_Name">
                          Item Name <span className="text-danger">*</span>
                        </Label>
                        <Controller
                          name="Item_Name"
                          control={createControl}
                          rules={{ required: "Item name is required" }}
                          render={({ field }) => (
                            <Input id="Item_Name" type="text" invalid={!!createErrors.Item_Name} {...field} />
                          )}
                        />
                        {createErrors.Item_Name && <FormFeedback>{createErrors.Item_Name.message}</FormFeedback>}
                      </FormGroup>
                    </Col>

                    <Col md={6}>
                      <FormGroup>
                        <Label for="Unit">
                          Unit <span className="text-danger">*</span>
                        </Label>
                        <Controller
                          name="Unit"
                          control={createControl}
                          rules={{ required: "Unit is required" }}
                          render={({ field }) => (
                            <Input id="Unit" type="text" placeholder="e.g., kg, units, liters" invalid={!!createErrors.Unit} {...field} />
                          )}
                        />
                        {createErrors.Unit && <FormFeedback>{createErrors.Unit.message}</FormFeedback>}
                      </FormGroup>
                    </Col>

                    <Col md={6}>
                      <FormGroup>
                        <Label for="Hamper_Type">Hamper Type</Label>
                        <Controller
                          name="Hamper_Type"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Hamper_Type" type="select" {...field}>
                              <option value="">Select Hamper Type</option>
                              {(lookupData.hampers || []).map((hamper) => (
                                <option key={hamper.id} value={hamper.id}>
                                  {hamper.name}
                                </option>
                              ))}
                            </Input>
                          )}
                        />
                      </FormGroup>
                    </Col>

                    <Col md={6}>
                      <FormGroup>
                        <Label for="Supplier_ID">Supplier</Label>
                        <Controller
                          name="Supplier_ID"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Supplier_ID" type="select" {...field}>
                              <option value="">Select Supplier</option>
                              {(lookupData.suppliers || []).map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </option>
                              ))}
                            </Input>
                          )}
                        />
                      </FormGroup>
                    </Col>

                    <Col md={12}>
                      <FormGroup>
                        <Label for="Description">Description</Label>
                        <Controller
                          name="Description"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Description" type="textarea" rows="3" {...field} />
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
                        <Label for="Min_Stock">Minimum Stock Level</Label>
                        <Controller
                          name="Min_Stock"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Min_Stock" type="number" step="0.01" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>

                    <Col md={6}>
                      <FormGroup>
                        <Label for="Cost_Per_Unit">Cost Per Unit</Label>
                        <Controller
                          name="Cost_Per_Unit"
                          control={createControl}
                          render={({ field }) => (
                            <Input id="Cost_Per_Unit" type="number" step="0.01" {...field} />
                          )}
                        />
                      </FormGroup>
                    </Col>

                    <Col md={12}>
                      <div className="alert alert-info" role="alert">
                        <i className="bx bx-info-circle me-2"></i>
                        <strong>Note:</strong> Initial quantity will be set to 0. Use the "Add Transaction" feature to record stock movements.
                      </div>
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

export default InventoryManagement;

