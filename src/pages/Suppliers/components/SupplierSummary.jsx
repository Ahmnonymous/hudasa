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
import { getHudasaUser } from "../../../helpers/userStorage";
import { sanitizeTenDigit, tenDigitRule } from "../../../helpers/phone";

const SupplierSummary = ({ supplier, lookupData, onUpdate, showAlert }) => {
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
    if (supplier && modalOpen) {
      reset({
        Name: supplier.name || "",
        Registration_No: supplier.registration_no || "",
        Contact_Person: supplier.contact_person || "",
        Contact_Email: supplier.contact_email || "",
        Contact_Phone: supplier.contact_phone || "",
        Address: supplier.address || "",
        Category_ID: supplier.category_id || "",
        Status: supplier.status || "",
      });
    }
  }, [supplier, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setActiveTab("1");
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge color="success">Active</Badge>;
      case "inactive":
        return <Badge color="secondary">Inactive</Badge>;
      case "pending":
        return <Badge color="warning">Pending</Badge>;
      default:
        return <Badge color="light">Unknown</Badge>;
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId || !lookupData.supplierCategories) return "-";
    const category = lookupData.supplierCategories.find(cat => cat.id === categoryId);
    return category ? category.name : "-";
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
        name: data.Name,
        registration_no: data.Registration_No,
        contact_person: data.Contact_Person,
        contact_email: data.Contact_Email,
        contact_phone: data.Contact_Phone,
        address: data.Address,
        category_id: data.Category_ID,
        status: data.Status,
        updated_by: currentUser?.username || "system",
      };

      await axiosApi.put(`${API_BASE_URL}/supplierProfile/${supplier.id}`, payload);
      showAlert("Supplier has been updated successfully", "success");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error updating supplier:", error);
      showAlert(error?.response?.data?.message || "Failed to update supplier", "danger");
    }
  };

  const handleDelete = () => {
    if (!supplier) return;

    const supplierName = `${supplier.name || 'Unknown Supplier'} - ${supplier.registration_no || 'No Registration'}`;
    
    showDeleteConfirmation({
      id: supplier.id,
      name: supplierName,
      type: "supplier",
      message: "This supplier will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/supplierProfile/${supplier.id}`);
      showAlert("Supplier has been deleted successfully", "success");
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
              <i className="bx bx-store me-2 text-primary"></i>
              Supplier Summary
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
                onClick={() => setIsDeleteModalOpen(true)}
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
              <p className="text-muted mb-1 font-size-11 text-uppercase">Supplier Name</p>
              <p className="mb-2 fw-medium font-size-12">{supplier.name || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Registration Number</p>
              <p className="mb-2 fw-medium font-size-12">{supplier.registration_no || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Contact Person</p>
              <p className="mb-2 fw-medium font-size-12">{supplier.contact_person || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Category</p>
              <p className="mb-2 fw-medium font-size-12">{getCategoryName(supplier.category_id)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Contact Email</p>
              <p className="mb-2 fw-medium font-size-12 text-break">{supplier.contact_email || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Contact Phone</p>
              <p className="mb-2 fw-medium font-size-12">{supplier.contact_phone || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Status</p>
              <p className="mb-2 fw-medium font-size-12">{getStatusBadge(supplier.status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Created Date</p>
              <p className="mb-2 fw-medium font-size-12">{supplier.datestamp ? new Date(supplier.datestamp).toLocaleDateString() : "-"}</p>
            </Col>
          </Row>

          <Row className="mb-0">
            <Col md={12}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Address</p>
              <p className="mb-2 fw-medium font-size-12">{supplier.address || "-"}</p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-edit me-2"></i>
          Edit Supplier
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
                  Company Info
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "2" })}
                  onClick={() => toggleTab("2")}
                  style={{ cursor: "pointer" }}
                >
                  Contact Details
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
                      <Label for="Name">
                        Supplier Name <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Name"
                        control={control}
                        rules={{ required: "Supplier name is required" }}
                        render={({ field }) => (
                          <Input
                            id="Name"
                            type="text"
                            invalid={!!errors.Name}
                            disabled={isOrgExecutive}
                            {...field}
                          />
                        )}
                      />
                      {errors.Name && <FormFeedback>{errors.Name.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Registration_No">Registration Number</Label>
                      <Controller
                        name="Registration_No"
                        control={control}
                        render={({ field }) => (
                          <Input id="Registration_No" type="text" disabled={isOrgExecutive} {...field} />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Category_ID">Category</Label>
                      <Controller
                        name="Category_ID"
                        control={control}
                        render={({ field }) => (
                          <Input id="Category_ID" type="select" {...field}>
                            <option value="">Select Category</option>
                            {(lookupData.supplierCategories || []).map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </Input>
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
                          <Input id="Status" type="select" {...field}>
                            <option value="">Select Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending">Pending</option>
                          </Input>
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
                      <Label for="Contact_Person">Contact Person</Label>
                      <Controller
                        name="Contact_Person"
                        control={control}
                        render={({ field }) => (
                          <Input id="Contact_Person" type="text" {...field} />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Contact_Email">Contact Email</Label>
                      <Controller
                        name="Contact_Email"
                        control={control}
                        render={({ field }) => (
                          <Input id="Contact_Email" type="email" {...field} />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Contact_Phone">Contact Phone</Label>
                      <Controller
                        name="Contact_Phone"
                        control={control}
                        rules={tenDigitRule(false, "Contact Phone")}
                        render={({ field }) => (
                          <Input
                            id="Contact_Phone"
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Contact_Phone}
                            {...field}
                          />
                        )}
                      />
                      {errors.Contact_Phone && (
                        <FormFeedback>{errors.Contact_Phone.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tabId="3">
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label for="Address">Address</Label>
                      <Controller
                        name="Address"
                        control={control}
                        render={({ field }) => (
                          <Input id="Address" type="textarea" rows="3" {...field} />
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
              <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                <i className="bx bx-trash me-1"></i> Delete
              </Button>
            </div>
            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
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
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default SupplierSummary;