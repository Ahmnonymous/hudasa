import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Badge,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useForm, Controller } from "react-hook-form";
import DeleteConfirmationModal from "../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../helpers/useRole";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../helpers/userStorage";

const InventorySummary = ({ item, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  useEffect(() => {
    if (item && modalOpen) {
      reset({
        Item_Name: item.item_name || "",
        Description: item.description || "",
        Hamper_Type: item.hamper_type || "",
        Unit: item.unit || "",
        Min_Stock: item.min_stock || "",
        Cost_Per_Unit: item.cost_per_unit || "",
        Supplier_ID: item.supplier_id || "",
      });
    }
  }, [item, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setActiveTab("1");
    }
  };

  const getStockBadge = (item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const minStock = parseFloat(item.min_stock) || 0;

    if (quantity <= 0) {
      return <Badge color="danger">Out of Stock</Badge>;
    } else if (quantity <= minStock) {
      return <Badge color="warning">Low Stock</Badge>;
    } else {
      return <Badge color="success">In Stock</Badge>;
    }
  };

  const getHamperName = (hamperId) => {
    if (!hamperId || !lookupData.hampers) return "-";
    const hamper = lookupData.hampers.find(h => h.id === hamperId);
    return hamper ? hamper.name : "-";
  };

  const getSupplierName = (supplierId) => {
    if (!supplierId || !lookupData.suppliers) return "-";
    const supplier = lookupData.suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : "-";
  };

  const handleEdit = () => {
    setModalOpen(true);
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      
      const payload = {
        item_name: data.Item_Name,
        description: data.Description,
        hamper_type: data.Hamper_Type,
        unit: data.Unit,
        min_stock: data.Min_Stock ? parseFloat(data.Min_Stock) : null,
        cost_per_unit: data.Cost_Per_Unit ? parseFloat(data.Cost_Per_Unit) : null,
        supplier_id: data.Supplier_ID || null,
        updated_by: getAuditName(),
      };

      await axiosApi.put(`${API_BASE_URL}/inventoryItems/${item.id}`, payload);
      showAlert("Inventory item has been updated successfully", "success");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error updating item:", error);
      showAlert(error?.response?.data?.message || "Failed to update item", "danger");
    }
  };

  const handleDelete = () => {
    if (!item) return;

    const itemName = `${item.item_name || 'Unknown Item'} - ${item.quantity || 0} ${item.unit || 'units'}`;
    
    showDeleteConfirmation({
      id: item.id,
      name: itemName,
      type: "inventory item",
      message: "This inventory item will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/inventoryItems/${item.id}`);
      showAlert("Inventory item has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  return (
    <>
      <Card className="border shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0 fw-semibold font-size-16">
              <i className="bx bx-box me-2 text-primary"></i>
              Item Summary
              {isOrgExecutive && <span className="ms-2 badge bg-info">Read Only</span>}
            </h5>
            <div className="d-flex gap-2">
              {!isOrgExecutive && (
                <Button color="primary" size="sm" onClick={handleEdit} className="btn-sm">
                  <i className="bx bx-edit-alt me-1"></i> Edit
                </Button>
              )}
              {/* <Button
                color="danger"
                size="sm"
                onClick={handleDelete}
                className="btn-sm"
              >
                <i className="bx bx-trash me-1"></i> Delete
              </Button> */}
            </div>
          </div>
        </div>

        <CardBody className="py-3">
          {/* Flat summary grid: 4 fields per row */}
          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Item Name</p>
              <p className="mb-2 fw-medium font-size-12">{item.item_name || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Current Quantity</p>
              <p className="mb-2 fw-medium font-size-12">{item.quantity || 0} {item.unit || ""}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Min Stock Level</p>
              <p className="mb-2 fw-medium font-size-12">{item.min_stock || "-"} {item.unit || ""}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Stock Status</p>
              <p className="mb-2 fw-medium font-size-12">{getStockBadge(item)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Cost Per Unit</p>
              <p className="mb-2 fw-medium font-size-12">
                {item.cost_per_unit ? `R ${parseFloat(item.cost_per_unit).toFixed(2)}` : "-"}
              </p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Hamper Type</p>
              <p className="mb-2 fw-medium font-size-12">{getHamperName(item.hamper_type)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Supplier</p>
              <p className="mb-2 fw-medium font-size-12">{getSupplierName(item.supplier_id)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Unit</p>
              <p className="mb-2 fw-medium font-size-12">{item.unit || "-"}</p>
            </Col>
          </Row>

          <Row className="mb-0">
            <Col md={12}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Description</p>
              <p className="mb-2 fw-medium font-size-12">{item.description || "-"}</p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-edit me-2"></i>
          Edit Inventory Item
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "1" })}
                  onClick={() => toggleTab("1")}
                  style={{ cursor: "pointer" }}
                >
                  Item Details
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "2" })}
                  onClick={() => toggleTab("2")}
                  style={{ cursor: "pointer" }}
                >
                  Stock & Pricing
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "3" })}
                  onClick={() => toggleTab("3")}
                  style={{ cursor: "pointer" }}
                >
                  Additional Info
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab} className="pt-3">
              <TabPane tabId="1">
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Item_Name">
                        Item Name <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Item_Name"
                        control={control}
                        rules={{ required: "Item name is required" }}
                        render={({ field }) => (
                          <Input
                            id="Item_Name"
                            type="text"
                            invalid={!!errors.Item_Name}
                            {...field}
                          />
                        )}
                      />
                      {errors.Item_Name && <FormFeedback>{errors.Item_Name.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Unit">
                        Unit <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Unit"
                        control={control}
                        rules={{ required: "Unit is required" }}
                        render={({ field }) => (
                          <Input
                            id="Unit"
                            type="text"
                            placeholder="e.g., kg, units, liters"
                            invalid={!!errors.Unit}
                            {...field}
                          />
                        )}
                      />
                      {errors.Unit && <FormFeedback>{errors.Unit.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label for="Description">Description</Label>
                      <Controller
                        name="Description"
                        control={control}
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
                        control={control}
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
                        control={control}
                        render={({ field }) => (
                          <Input id="Cost_Per_Unit" type="number" step="0.01" {...field} />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <div className="alert alert-info" role="alert">
                      <i className="bx bx-info-circle me-2"></i>
                      <strong>Note:</strong> Quantity is automatically updated by transactions and cannot be edited directly.
                    </div>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tabId="3">
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Hamper_Type">Hamper Type</Label>
                      <Controller
                        name="Hamper_Type"
                        control={control}
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
                        control={control}
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
                </Row>
              </TabPane>
            </TabContent>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {!isOrgExecutive && (
                <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>
            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              {!isOrgExecutive && (
                <Button color="success" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
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
              )}
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Inventory Item"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default InventorySummary;

