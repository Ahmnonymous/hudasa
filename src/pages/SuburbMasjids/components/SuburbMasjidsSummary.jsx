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

const SuburbMasjidsSummary = ({ masjid, createMode, onUpdate, onCloseCreate, showAlert, lookupData }) => {
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

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
  };

  useEffect(() => {
    if (masjid && modalOpen) {
      reset({
        suburb_id: masjid.suburb_id || "",
        masjid_name: masjid.masjid_name || "",
        imaam_name: masjid.imaam_name || "",
        imaam_contact: masjid.imaam_contact || "",
        facilities_available: masjid.facilities_available || "",
      });
    } else if (!masjid && modalOpen) {
      reset({
        suburb_id: "",
        masjid_name: "",
        imaam_name: "",
        imaam_contact: "",
        facilities_available: "",
      });
    }
  }, [masjid, modalOpen, reset]);

  // Open modal when createMode is true
  useEffect(() => {
    if (createMode) {
      setModalOpen(true);
    }
  }, [createMode]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!masjid && modalOpen && onCloseCreate) {
      // If closing creation modal, notify parent
      onCloseCreate();
    }
  };

  const handleEdit = () => {
    setModalOpen(true);
  };

  const handleDelete = () => {
    if (!masjid) return;
    showDeleteConfirmation({
      id: masjid.id,
      name: masjid.masjid_name || "this masjid",
      type: "Suburb Masjid",
      message: `Are you sure you want to delete "${masjid.masjid_name}"? This action cannot be undone.`,
    });
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      const formData = {
        ...data,
        suburb_id: parseInt(data.suburb_id),
      };

      if (masjid) {
        formData.updated_by = currentUser?.username || "system";
        await axiosApi.put(`${API_BASE_URL}/suburbMasjids/${masjid.id}`, formData);
        showAlert("Masjid updated successfully", "success");
      } else {
        formData.created_by = currentUser?.username || "system";
        const response = await axiosApi.post(`${API_BASE_URL}/suburbMasjids`, formData);
        showAlert("Masjid created successfully", "success");
        setModalOpen(false);
        if (onCloseCreate) {
          onCloseCreate();
        }
        onUpdate();
      }
      if (masjid) {
        onUpdate();
        setModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving masjid:", error);
      showAlert(error.response?.data?.error || "Failed to save masjid", "danger");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await confirmDelete(async () => {
        await axiosApi.delete(`${API_BASE_URL}/suburbMasjids/${deleteItem.id}`);
        showAlert("Masjid deleted successfully", "success");
        onUpdate();
      });
    } catch (error) {
      showAlert(error.response?.data?.error || "Failed to delete masjid", "danger");
    }
  };

  return (
    <>
      {masjid && (
        <Card className="border shadow-sm">
          <div className="card-header bg-transparent border-bottom py-3">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-semibold font-size-16">
                <i className="bx bx-mosque me-2 text-primary"></i>
                Suburb Masjid Summary
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
                <p className="text-muted mb-1 font-size-11 text-uppercase">Masjid Name</p>
                <p className="mb-2 fw-medium font-size-12">{masjid.masjid_name || "-"}</p>
              </Col>
              <Col md={3}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Suburb</p>
                <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.suburbs, masjid.suburb_id)}</p>
              </Col>
              <Col md={3}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Imaam Name</p>
                <p className="mb-2 fw-medium font-size-12">{masjid.imaam_name || "-"}</p>
              </Col>
              <Col md={3}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Imaam Contact</p>
                <p className="mb-2 fw-medium font-size-12">{masjid.imaam_contact || "-"}</p>
              </Col>
            </Row>

            <Row className="mb-0">
              <Col md={12}>
                <p className="text-muted mb-1 font-size-11 text-uppercase">Facilities Available</p>
                <p className="mb-2 fw-medium font-size-12">{masjid.facilities_available || "-"}</p>
              </Col>
            </Row>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={modalOpen} toggle={toggleModal} centered backdrop="static" size="lg">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${masjid ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {masjid ? "Edit Suburb Masjid" : "Create Suburb Masjid"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="suburb_id">Suburb *</Label>
                  <Controller
                    name="suburb_id"
                    control={control}
                    rules={{ required: "Suburb is required" }}
                    render={({ field }) => (
                      <Input
                        id="suburb_id"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.suburb_id}
                        {...field}
                      >
                        <option value="">Select Suburb</option>
                        {lookupData.suburbs?.map((suburb) => (
                          <option key={suburb.id} value={suburb.id}>
                            {suburb.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.suburb_id && (
                    <FormFeedback>{errors.suburb_id.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="masjid_name">Masjid Name *</Label>
                  <Controller
                    name="masjid_name"
                    control={control}
                    rules={{ required: "Masjid name is required" }}
                    render={({ field }) => (
                      <Input
                        id="masjid_name"
                        type="text"
                        placeholder="Enter masjid name"
                        disabled={isOrgExecutive}
                        invalid={!!errors.masjid_name}
                        {...field}
                      />
                    )}
                  />
                  {errors.masjid_name && (
                    <FormFeedback>{errors.masjid_name.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="imaam_name">Imaam Name</Label>
                  <Controller
                    name="imaam_name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="imaam_name"
                        type="text"
                        placeholder="Enter imaam name"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="imaam_contact">Imaam Contact</Label>
                  <Controller
                    name="imaam_contact"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="imaam_contact"
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
                  <Label for="facilities_available">Facilities Available</Label>
                  <Controller
                    name="facilities_available"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="facilities_available"
                        type="textarea"
                        rows="3"
                        placeholder="List facilities available"
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
              {masjid && (
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
                    <i className="bx bx-save me-1"></i> {masjid ? "Update" : "Create"}
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
        title="Delete Suburb Masjid"
        message={deleteItem?.message || ""}
        itemName={deleteItem?.name || ""}
        itemType={deleteItem?.type || "Suburb Masjid"}
      />
    </>
  );
};

export default SuburbMasjidsSummary;

