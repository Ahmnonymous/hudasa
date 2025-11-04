import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
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
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";
import { getHudasaUser } from "../../../helpers/userStorage";
import { sanitizeTenDigit, tenDigitRule } from "../../../helpers/phone";

const CenterSummary = ({ center, lookupData, onUpdate, showAlert }) => {
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

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  useEffect(() => {
    if (center && modalOpen) {
      reset({
        Organisation_Name: center.organisation_name || "",
        Date_of_Establishment: center.date_of_establishment ? center.date_of_establishment.split('T')[0] : "",
        Contact_Number: center.contact_number || "",
        Email_Address: center.email_address || "",
        Website_Link: center.website_link || "",
        Address: center.address || "",
        Area: center.area || "",
        Ameer: center.ameer || "",
        Cell1: center.cell1 || "",
        Cell2: center.cell2 || "",
        Cell3: center.cell3 || "",
        Contact1: center.contact1 || "",
        Contact2: center.contact2 || "",
        Contact3: center.contact3 || "",
        NPO_Number: center.npo_number || "",
        Service_Rating_Email: center.service_rating_email || "",
        Logo: null,
        QR_Code_Service_URL: null,
      });
    }
  }, [center, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setActiveTab("1");
    }
  };

  const getSuburbName = (suburbId) => {
    if (!suburbId || !lookupData.suburbs) return "-";
    const suburb = lookupData.suburbs.find(s => String(s.id) === String(suburbId));
    return suburb ? suburb.name : "-";
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
      
      // Check if files are being uploaded
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
        formData.append("area", data.Area || "");
        formData.append("ameer", data.Ameer || "");
        formData.append("cell1", data.Cell1 || "");
        formData.append("cell2", data.Cell2 || "");
        formData.append("cell3", data.Cell3 || "");
        formData.append("contact1", data.Contact1 || "");
        formData.append("contact2", data.Contact2 || "");
        formData.append("contact3", data.Contact3 || "");
        formData.append("npo_number", data.NPO_Number || "");
        formData.append("service_rating_email", data.Service_Rating_Email || "");
        formData.append("updated_by", currentUser?.username || "system");

        if (hasLogo) {
          formData.append("logo", data.Logo[0]);
        }
        if (hasQR) {
          formData.append("qr_code_service_url", data.QR_Code_Service_URL[0]);
        }

        await axiosApi.put(`${API_BASE_URL}/centerDetail/${center.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Use JSON for regular update without files
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
          updated_by: currentUser?.username || "system",
        };

        await axiosApi.put(`${API_BASE_URL}/centerDetail/${center.id}`, payload);
      }

      showAlert("Center has been updated successfully", "success");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error updating center:", error);
      showAlert(error?.response?.data?.message || "Failed to update center", "danger");
    }
  };

  const handleDelete = () => {
    if (!center) return;

    const centerName = `${center.organisation_name || 'Unknown Center'} - ${center.npo_number || 'No NPO'}`;
    
    showDeleteConfirmation({
      id: center.id,
      name: centerName,
      type: "center",
      message: "This center will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/centerDetail/${center.id}`);
      showAlert("Center has been deleted successfully", "success");
      // If edit modal is open, close it; avoid toggling which could open it unintentionally
      if (modalOpen) {
        setModalOpen(false);
      }
      onUpdate();
    });
  };

  return (
    <>
      <Card className="border shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0 fw-semibold font-size-16">
              <i className="bx bx-building me-2 text-primary"></i>
              Center Summary
            </h5>
            <div className="d-flex gap-2">
              <Button color="primary" size="sm" onClick={handleEdit} className="btn-sm">
                <i className="bx bx-edit-alt me-1"></i> Edit
              </Button>
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
              <p className="text-muted mb-1 font-size-11 text-uppercase">Organization Name</p>
              <p className="mb-2 fw-medium font-size-12">{center.organisation_name || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">NPO Number</p>
              <p className="mb-2 fw-medium font-size-12">{center.npo_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Established Date</p>
              <p className="mb-2 fw-medium font-size-12">
                {center.date_of_establishment ? new Date(center.date_of_establishment).toLocaleDateString() : "-"}
              </p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Ameer</p>
              <p className="mb-2 fw-medium font-size-12">{center.ameer || "-"}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Contact Number</p>
              <p className="mb-2 fw-medium font-size-12">{center.contact_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Email Address</p>
              <p className="mb-2 fw-medium font-size-12 text-break">{center.email_address || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Website</p>
              <p className="mb-2 fw-medium font-size-12 text-break">{center.website_link || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Area</p>
              <p className="mb-2 fw-medium font-size-12">{getSuburbName(center.area)}</p>
            </Col>
          </Row>

          <Row className="mb-0">
            <Col md={12}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Address</p>
              <p className="mb-2 fw-medium font-size-12">{center.address || "-"}</p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-edit me-2"></i>
          Edit Center
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
                  Basic Info
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
                      <Label for="Organisation_Name">
                        Organization Name <span className="text-danger">*</span>
                      </Label>
                      <Controller
                        name="Organisation_Name"
                        control={control}
                        rules={{ required: "Organization name is required" }}
                        render={({ field }) => (
                          <Input
                            id="Organisation_Name"
                            type="text"
                            invalid={!!errors.Organisation_Name}
                            {...field}
                          />
                        )}
                      />
                      {errors.Organisation_Name && <FormFeedback>{errors.Organisation_Name.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="NPO_Number">NPO Number</Label>
                      <Controller
                        name="NPO_Number"
                        control={control}
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
                        control={control}
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
                        control={control}
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
                        control={control}
                        render={({ field }) => (
                          <Input id="Area" type="select" {...field}>
                            <option value="">Select Area</option>
                            {(lookupData.suburbs || []).map((suburb) => (
                              <option key={suburb.id} value={suburb.id}>
                                {suburb.name}
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
                          <Input id="Address" type="textarea" rows="3" {...field} />
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
                        control={control}
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
                            invalid={!!errors.Contact_Number}
                            {...field}
                          />
                        )}
                      />
                      {errors.Contact_Number && (
                        <FormFeedback>{errors.Contact_Number.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="Email_Address">Email Address</Label>
                      <Controller
                        name="Email_Address"
                        control={control}
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
                        control={control}
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
                        control={control}
                        render={({ field }) => (
                          <Input id="Service_Rating_Email" type="email" {...field} />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label for="Cell1">Cell 1</Label>
                      <Controller
                        name="Cell1"
                        control={control}
                        rules={tenDigitRule(false, "Cell 1")}
                        render={({ field }) => (
                          <Input
                            id="Cell1"
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Cell1}
                            {...field}
                          />
                        )}
                      />
                      {errors.Cell1 && <FormFeedback>{errors.Cell1.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label for="Cell2">Cell 2</Label>
                      <Controller
                        name="Cell2"
                        control={control}
                        rules={tenDigitRule(false, "Cell 2")}
                        render={({ field }) => (
                          <Input
                            id="Cell2"
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Cell2}
                            {...field}
                          />
                        )}
                      />
                      {errors.Cell2 && <FormFeedback>{errors.Cell2.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label for="Cell3">Cell 3</Label>
                      <Controller
                        name="Cell3"
                        control={control}
                        rules={tenDigitRule(false, "Cell 3")}
                        render={({ field }) => (
                          <Input
                            id="Cell3"
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Cell3}
                            {...field}
                          />
                        )}
                      />
                      {errors.Cell3 && <FormFeedback>{errors.Cell3.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label for="Contact1">Contact 1</Label>
                      <Controller
                        name="Contact1"
                        control={control}
                        rules={tenDigitRule(false, "Contact 1")}
                        render={({ field }) => (
                          <Input
                            id="Contact1"
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Contact1}
                            {...field}
                          />
                        )}
                      />
                      {errors.Contact1 && <FormFeedback>{errors.Contact1.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label for="Contact2">Contact 2</Label>
                      <Controller
                        name="Contact2"
                        control={control}
                        rules={tenDigitRule(false, "Contact 2")}
                        render={({ field }) => (
                          <Input
                            id="Contact2"
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Contact2}
                            {...field}
                          />
                        )}
                      />
                      {errors.Contact2 && <FormFeedback>{errors.Contact2.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label for="Contact3">Contact 3</Label>
                      <Controller
                        name="Contact3"
                        control={control}
                        rules={tenDigitRule(false, "Contact 3")}
                        render={({ field }) => (
                          <Input
                            id="Contact3"
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Contact3}
                            {...field}
                          />
                        )}
                      />
                      {errors.Contact3 && <FormFeedback>{errors.Contact3.message}</FormFeedback>}
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
                        control={control}
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
                      {center && center.logo_filename && (
                        <div className="mt-2 p-2 border rounded bg-light">
                          <div className="d-flex align-items-center">
                            <i className="bx bx-file font-size-24 text-primary me-2"></i>
                            <div className="flex-grow-1">
                              <div className="fw-medium">{center.logo_filename}</div>
                              <small className="text-muted">
                                {formatFileSize(center.logo_size)} • Current file
                              </small>
                            </div>
                          </div>
                        </div>
                      )}
                      <small className="text-muted d-block mt-1">
                        Supported formats: JPG, PNG, GIF
                      </small>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="QR_Code_Service_URL">QR Code Service URL</Label>
                      <Controller
                        name="QR_Code_Service_URL"
                        control={control}
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
                      {center && center.qr_code_service_url_filename && (
                        <div className="mt-2 p-2 border rounded bg-light">
                          <div className="d-flex align-items-center">
                            <i className="bx bx-file font-size-24 text-primary me-2"></i>
                            <div className="flex-grow-1">
                              <div className="fw-medium">{center.qr_code_service_url_filename}</div>
                              <small className="text-muted">
                                {formatFileSize(center.qr_code_service_url_size)} • Current file
                              </small>
                            </div>
                          </div>
                        </div>
                      )}
                      <small className="text-muted d-block mt-1">
                        Supported formats: JPG, PNG, GIF
                      </small>
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
        title="Delete Center"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default CenterSummary;

