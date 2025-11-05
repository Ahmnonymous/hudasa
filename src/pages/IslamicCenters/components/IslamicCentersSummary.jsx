import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
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
import { getHudasaUser } from "../../../helpers/userStorage";

const IslamicCentersSummary = ({ center, createMode, onUpdate, onCloseCreate, showAlert, lookupData }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);

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
    if (center && modalOpen) {
      reset({
        center_name: center.center_name || "",
        suburb: center.suburb || "",
        address: center.address || "",
        ameer: center.ameer || "",
        contact_number: center.contact_number || "",
        name_syllabus: center.name_syllabus || "",
      });
    } else if (!center && modalOpen) {
      reset({
        center_name: "",
        suburb: "",
        address: "",
        ameer: "",
        contact_number: "",
        name_syllabus: "",
      });
    }
  }, [center, modalOpen, reset]);

  // Open modal when createMode is true
  useEffect(() => {
    if (createMode) {
      setModalOpen(true);
    }
  }, [createMode]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!center && modalOpen && onCloseCreate) {
      // If closing creation modal, notify parent
      onCloseCreate();
    }
  };

  const handleEdit = () => {
    setModalOpen(true);
  };

  const handleDelete = () => {
    if (!center) return;
    showDeleteConfirmation({
      id: center.id,
      name: center.center_name || "this center",
      type: "Islamic Center",
      message: `Are you sure you want to delete "${center.center_name}"? This action cannot be undone.`,
    });
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      const formData = { 
        ...data,
        suburb: data.suburb ? parseInt(data.suburb) : null,
      };

      if (center) {
        formData.updated_by = currentUser?.username || "system";
        await axiosApi.put(`${API_BASE_URL}/islamicCenters/${center.id}`, formData);
        showAlert("Islamic center updated successfully", "success");
        onUpdate();
        setModalOpen(false);
      } else {
        formData.created_by = currentUser?.username || "system";
        await axiosApi.post(`${API_BASE_URL}/islamicCenters`, formData);
        showAlert("Islamic center created successfully", "success");
        setModalOpen(false);
        if (onCloseCreate) {
          onCloseCreate();
        }
        onUpdate();
      }
    } catch (error) {
      console.error("Error saving Islamic center:", error);
      showAlert(error.response?.data?.error || "Failed to save Islamic center", "danger");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await confirmDelete(async () => {
        await axiosApi.delete(`${API_BASE_URL}/islamicCenters/${deleteItem.id}`);
        showAlert("Islamic center deleted successfully", "success");
        onUpdate();
      });
    } catch (error) {
      showAlert(error.response?.data?.error || "Failed to delete Islamic center", "danger");
    }
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
  };

  return (
    <>
      {center && (
        <Card className="border shadow-sm">
          <div className="card-header bg-transparent border-bottom py-3">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-semibold font-size-16">
                <i className="bx bx-mosque me-2 text-primary"></i>
                Islamic Center Summary
                {isOrgExecutive && <span className="ms-2 badge bg-info">Read Only</span>}
              </h5>
              {!isOrgExecutive && (
                <Button color="primary" size="sm" onClick={handleEdit} className="btn-sm">
                  <i className="bx bx-edit-alt me-1"></i> Edit
                </Button>
              )}
            </div>
          </div>

          <CardBody className="py-3">
            {/* Flat summary grid: 4 fields per row */}
            <Row className="mb-2">
              <Col md={3}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Center Name</p>
                <p className="mb-2 fw-medium font-size-12">{center.center_name || "-"}</p>
              </Col>
              <Col md={3}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Suburb</p>
                <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.suburbs, center.suburb) || center.suburb || "-"}</p>
              </Col>
              <Col md={3}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Ameer</p>
                <p className="mb-2 fw-medium font-size-12">{center.ameer || "-"}</p>
              </Col>
              <Col md={3}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Contact Number</p>
                <p className="mb-2 fw-medium font-size-12">{center.contact_number || "-"}</p>
              </Col>
            </Row>

            <Row className="mb-0">
              <Col md={6}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Address</p>
                <p className="mb-2 fw-medium font-size-12">{center.address || "-"}</p>
              </Col>
              <Col md={6}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Syllabus</p>
                <p className="mb-2 fw-medium font-size-12">{center.name_syllabus || "-"}</p>
              </Col>
            </Row>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={modalOpen} toggle={toggleModal} centered backdrop="static" size="lg">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${center ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {center ? "Edit Islamic Center" : "Create Islamic Center"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="center_name">Center Name *</Label>
                  <Controller
                    name="center_name"
                    control={control}
                    rules={{ required: "Center name is required" }}
                    render={({ field }) => (
                      <Input
                        id="center_name"
                        type="text"
                        placeholder="Enter center name"
                        disabled={isOrgExecutive}
                        invalid={!!errors.center_name}
                        {...field}
                      />
                    )}
                  />
                  {errors.center_name && (
                    <FormFeedback>{errors.center_name.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="suburb">Suburb</Label>
                  <Controller
                    name="suburb"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" {...field} disabled={isOrgExecutive}>
                        <option value="">Select Suburb</option>
                        {lookupData.suburbs?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="contact_number">Contact Number</Label>
                  <Controller
                    name="contact_number"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="contact_number"
                        type="text"
                        placeholder="Enter contact number"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="address">Address</Label>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="address"
                        type="textarea"
                        rows="2"
                        placeholder="Enter address"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="ameer">Ameer</Label>
                  <Controller
                    name="ameer"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="ameer"
                        type="text"
                        placeholder="Enter ameer name"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="name_syllabus">Syllabus</Label>
                  <Controller
                    name="name_syllabus"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="name_syllabus"
                        type="text"
                        placeholder="Enter syllabus name"
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
              {center && (
                <Button
                  color="danger"
                  onClick={handleDelete}
                  disabled={deleteLoading || isOrgExecutive}
                >
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>
            <div>
              <Button
                color="light"
                onClick={toggleModal}
                disabled={isSubmitting}
                className="me-2"
              >
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              <Button color="success" type="submit" disabled={isSubmitting || isOrgExecutive}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span> Saving...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i> {center ? "Update" : "Create"}
                  </>
                )}
              </Button>
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Islamic Center"
        message={deleteItem?.message || ""}
        itemName={deleteItem?.name || ""}
        itemType={deleteItem?.type || "Islamic Center"}
      />
    </>
  );
};

export default IslamicCentersSummary;

