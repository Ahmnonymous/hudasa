import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import DeleteConfirmationModal from "../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../helpers/useRole";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../helpers/userStorage";

const MadressaApplicationSummary = ({ application, lookupData, onUpdate, showAlert, onClose }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(!application); // Open if creating new

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete,
  } = useDeleteConfirmation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  useEffect(() => {
    if (application && modalOpen) {
      reset({
        applicant_relationship_id: application.applicant_relationship_id || "",
        chronic_condition: application.chronic_condition || "",
        blood_type: application.blood_type || "",
        family_doctor: application.family_doctor || "",
        contact_details: application.contact_details || "",
        allegies: application.allegies || "",
        chronic_medication_required: application.chronic_medication_required || "",
        allergy_medication_required: application.allergy_medication_required || "",
      });
    } else if (!application && modalOpen) {
      // Initialize form for new application
      reset({
        applicant_relationship_id: "",
        chronic_condition: "",
        blood_type: "",
        family_doctor: "",
        contact_details: "",
        allegies: "",
        chronic_medication_required: "",
        allergy_medication_required: "",
      });
    }
  }, [application, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (onClose && !modalOpen) {
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      const formData = {
        ...data,
        applicant_relationship_id: parseInt(data.applicant_relationship_id),
      };

      if (application) {
        formData.updated_by = currentUser?.username || "system";
        delete formData.created_by; // Don't allow overwrite of created_by
        const response = await axiosApi.put(
          `${API_BASE_URL}/madressaApplication/${application.id}`,
          formData
        );
        showAlert("Application updated successfully", "success");
      } else {
        formData.created_by = currentUser?.username || "system";
        formData.updated_by = currentUser?.username || "system";
        const response = await axiosApi.post(`${API_BASE_URL}/madressaApplication`, formData);
        showAlert("Application created successfully", "success");
        // Select the newly created application
        if (response.data && onUpdate) {
          // onUpdate will refresh the list and we can select it
        }
      }

      toggleModal();
      onUpdate();
      // Reset form after successful creation
      if (!application) {
        reset();
      }
    } catch (error) {
      console.error("Error saving application:", error);
      showAlert(
        error.response?.data?.error || "Failed to save application",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    const applicationName = getRelationshipName(application?.applicant_relationship_id) || 'Unknown Application';
    
    showDeleteConfirmation({
      id: application.id,
      name: applicationName,
      type: "application",
      message: "This application and all associated data will be permanently removed from the system."
    }, async () => {
      try {
        await axiosApi.delete(`${API_BASE_URL}/madressaApplication/${application.id}`);
        showAlert("Application has been deleted successfully", "success");
        onUpdate();
        if (modalOpen) {
          setModalOpen(false);
        }
      } catch (error) {
        console.error("Error deleting application:", error);
        showAlert(error?.response?.data?.message || "Failed to delete application", "danger");
        throw error; // Re-throw so the hook knows there was an error
      }
    });
  };

  const getRelationshipName = (relationshipId) => {
    const relationship = lookupData.relationships?.find((r) => r.id === relationshipId);
    if (relationship) {
      return `${relationship.name || ""} ${relationship.surname || ""}`.trim() || "N/A";
    }
    return "N/A";
  };

  // If creating new, show modal only
  if (!application && modalOpen) {
    return (
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-plus-circle me-2"></i>
          Create New Application
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="applicant_relationship_id">
                    Student (Relationship) <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="applicant_relationship_id"
                    control={control}
                    rules={{ required: "Student is required" }}
                    render={({ field }) => (
                      <Input
                        id="applicant_relationship_id"
                        type="select"
                        invalid={!!errors.applicant_relationship_id}
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select Student</option>
                        {lookupData.relationships?.map((rel) => (
                          <option key={rel.id} value={rel.id}>
                            {rel.name} {rel.surname} ({rel.id_number || "N/A"})
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.applicant_relationship_id && (
                    <FormFeedback>{errors.applicant_relationship_id.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="blood_type">Blood Type</Label>
                  <Controller
                    name="blood_type"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="blood_type"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select Blood Type</option>
                        {lookupData.bloodTypes?.map((bt) => (
                          <option key={bt.id} value={bt.name}>
                            {bt.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="chronic_condition">Chronic Condition</Label>
                  <Controller
                    name="chronic_condition"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="chronic_condition"
                        type="text"
                        placeholder="e.g., Diabetes"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="family_doctor">Family Doctor</Label>
                  <Controller
                    name="family_doctor"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="family_doctor"
                        type="text"
                        placeholder="Doctor name"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="contact_details">Contact Details</Label>
                  <Controller
                    name="contact_details"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="contact_details"
                        type="text"
                        placeholder="Phone number"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="allegies">Allergies</Label>
                  <Controller
                    name="allegies"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="allegies"
                        type="text"
                        placeholder="e.g., Peanuts, Dairy"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="chronic_medication_required">Chronic Medication Required</Label>
                  <Controller
                    name="chronic_medication_required"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="chronic_medication_required"
                        type="text"
                        placeholder="Medication details"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="allergy_medication_required">Allergy Medication Required</Label>
                  <Controller
                    name="allergy_medication_required"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="allergy_medication_required"
                        type="text"
                        placeholder="Medication details"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div></div>
            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              {!isOrgExecutive && (
                <Button color="success" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
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
              )}
            </div>
          </ModalFooter>
        </Form>
      </Modal>
    );
  }

  if (!application) {
    return (
      <Card className="border shadow-sm">
        <CardBody className="text-center py-5">
          <i className="bx bx-info-circle font-size-48 text-muted mb-3"></i>
          <h5 className="text-muted">Select an application to view details</h5>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="border shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0 fw-semibold font-size-16">
              <i className="bx bx-user me-2 text-primary"></i>
              Application Summary
              {isOrgExecutive && <span className="ms-2 badge bg-info">Read Only</span>}
            </h5>
            {!isOrgExecutive && (
              <Button color="primary" size="sm" onClick={toggleModal} className="btn-sm">
                <i className="bx bx-edit-alt me-1"></i> Edit
              </Button>
            )}
          </div>
        </div>

        <CardBody className="py-3">
          {/* Flat summary grid: 4 fields per row */}
          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Student</p>
              <p className="mb-2 fw-medium font-size-12">
                {getRelationshipName(application.applicant_relationship_id)}
              </p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Blood Type</p>
              <p className="mb-2 fw-medium font-size-12">{application.blood_type || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Chronic Condition</p>
              <p className="mb-2 fw-medium font-size-12">{application.chronic_condition || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Family Doctor</p>
              <p className="mb-2 fw-medium font-size-12">{application.family_doctor || "-"}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Contact Details</p>
              <p className="mb-2 fw-medium font-size-12">{application.contact_details || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Allergies</p>
              <p className="mb-2 fw-medium font-size-12">{application.allegies || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Chronic Medication</p>
              <p className="mb-2 fw-medium font-size-12">{application.chronic_medication_required || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Allergy Medication</p>
              <p className="mb-2 fw-medium font-size-12">{application.allergy_medication_required || "-"}</p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${application ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {application ? "Edit Application" : "Create Application"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="applicant_relationship_id">
                    Student (Relationship) <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="applicant_relationship_id"
                    control={control}
                    rules={{ required: "Student is required" }}
                    render={({ field }) => (
                      <Input
                        id="applicant_relationship_id"
                        type="select"
                        invalid={!!errors.applicant_relationship_id}
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select Student</option>
                        {lookupData.relationships?.map((rel) => (
                          <option key={rel.id} value={rel.id}>
                            {rel.name} {rel.surname} ({rel.id_number || "N/A"})
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.applicant_relationship_id && (
                    <FormFeedback>{errors.applicant_relationship_id.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="blood_type">Blood Type</Label>
                  <Controller
                    name="blood_type"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="blood_type"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select Blood Type</option>
                        {lookupData.bloodTypes?.map((bt) => (
                          <option key={bt.id} value={bt.name}>
                            {bt.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="chronic_condition">Chronic Condition</Label>
                  <Controller
                    name="chronic_condition"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="chronic_condition"
                        type="text"
                        placeholder="e.g., Diabetes"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="family_doctor">Family Doctor</Label>
                  <Controller
                    name="family_doctor"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="family_doctor"
                        type="text"
                        placeholder="Doctor name"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="contact_details">Contact Details</Label>
                  <Controller
                    name="contact_details"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="contact_details"
                        type="text"
                        placeholder="Phone number"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="allegies">Allergies</Label>
                  <Controller
                    name="allegies"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="allegies"
                        type="text"
                        placeholder="e.g., Peanuts, Dairy"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="chronic_medication_required">Chronic Medication Required</Label>
                  <Controller
                    name="chronic_medication_required"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="chronic_medication_required"
                        type="text"
                        placeholder="Medication details"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="allergy_medication_required">Allergy Medication Required</Label>
                  <Controller
                    name="allergy_medication_required"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="allergy_medication_required"
                        type="text"
                        placeholder="Medication details"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {application && !isOrgExecutive && (
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
        title="Delete Application"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default MadressaApplicationSummary;

