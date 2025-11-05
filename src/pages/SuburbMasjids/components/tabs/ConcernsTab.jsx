import React, { useState, useEffect, useMemo } from "react";
import {
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
  Row,
  Col,
  Alert,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser } from "../../../../helpers/userStorage";

const ConcernsTab = ({ masjidId, suburbId, concerns, onUpdate, showAlert, lookupData = {} }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

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
    if (editItem && modalOpen) {
      reset({
        general_perception: editItem.general_perception || "",
        safety_security: editItem.safety_security || "",
        infrastructure_transport: editItem.infrastructure_transport || "",
        public_services: editItem.public_services || "",
        environmental_health_concerns: editItem.environmental_health_concerns || "",
        social_community_wellbeing: editItem.social_community_wellbeing || "",
        development_planning: editItem.development_planning || "",
        assessment_done_by: editItem.assessment_done_by || "",
        concerns_discussed_with: editItem.concerns_discussed_with || "",
      });
    } else if (modalOpen) {
      reset({
        general_perception: "",
        safety_security: "",
        infrastructure_transport: "",
        public_services: "",
        environmental_health_concerns: "",
        social_community_wellbeing: "",
        development_planning: "",
        assessment_done_by: "",
        concerns_discussed_with: "",
      });
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setEditItem(null);
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      const formData = {
        ...data,
        suburb_id: suburbId,
        created_by: currentUser?.username || "system",
        updated_by: currentUser?.username || "system",
      };

      if (editItem) {
        await axiosApi.put(`${API_BASE_URL}/suburbConcerns/${editItem.id}`, formData);
        showAlert("Concerns record updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/suburbConcerns`, formData);
        showAlert("Concerns record created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving concerns:", error);
      showAlert(
        error.response?.data?.error || "Failed to save concerns record",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const recordName = editItem.assessment_done_by || 'Unknown Assessment';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: recordName,
      type: "concerns record",
      message: "This concerns record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/suburbConcerns/${editItem.id}`);
      showAlert("Concerns record deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Assessment Done By",
        accessorKey: "assessment_done_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => (
          <span
            style={{ cursor: "pointer", color: "inherit" }}
            onClick={() => handleEdit(cell.row.original)}
            onMouseOver={(e) => {
              e.currentTarget.classList.add('text-primary', 'text-decoration-underline');
            }}
            onMouseOut={(e) => {
              e.currentTarget.classList.remove('text-primary', 'text-decoration-underline');
            }}
          >
            {cell.getValue() || "-"}
          </span>
        ),
      },
      {
        header: "General Perception",
        accessorKey: "general_perception",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const text = cell.getValue() || "";
          return text.length > 50 ? `${text.substring(0, 50)}...` : text || "-";
        },
      },
      {
        header: "Safety & Security",
        accessorKey: "safety_security",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const text = cell.getValue() || "";
          return text.length > 50 ? `${text.substring(0, 50)}...` : text || "-";
        },
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created On",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
      {
        header: "Updated By",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated On",
        accessorKey: "updated_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    [handleEdit]
  );

  if (!masjidId || !suburbId) {
    return (
      <Alert color="info" className="d-flex align-items-center">
        <i className="bx bx-info-circle font-size-16 me-2"></i>
        Please select a masjid to view concerns records.
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Concerns Records</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Concerns
          </Button>
        )}
      </div>

      {concerns.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No concerns records found. Click "Add Concerns" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={concerns}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      <Modal
        isOpen={modalOpen}
        toggle={toggleModal}
        centered
        backdrop="static"
        size="lg"
      >
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Concerns Record
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="general_perception">General Perception</Label>
                  <Controller
                    name="general_perception"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="general_perception"
                        type="textarea"
                        rows="2"
                        placeholder="Enter general perception"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="safety_security">Safety & Security</Label>
                  <Controller
                    name="safety_security"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="safety_security"
                        type="textarea"
                        rows="2"
                        placeholder="Enter safety and security concerns"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="infrastructure_transport">Infrastructure & Transport</Label>
                  <Controller
                    name="infrastructure_transport"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="infrastructure_transport"
                        type="textarea"
                        rows="2"
                        placeholder="Enter infrastructure and transport concerns"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="public_services">Public Services</Label>
                  <Controller
                    name="public_services"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="public_services"
                        type="textarea"
                        rows="2"
                        placeholder="Enter public services concerns"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="environmental_health_concerns">Environmental Health Concerns</Label>
                  <Controller
                    name="environmental_health_concerns"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="environmental_health_concerns"
                        type="textarea"
                        rows="2"
                        placeholder="Enter environmental health concerns"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="social_community_wellbeing">Social & Community Wellbeing</Label>
                  <Controller
                    name="social_community_wellbeing"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="social_community_wellbeing"
                        type="textarea"
                        rows="2"
                        placeholder="Enter social and community wellbeing concerns"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="development_planning">Development Planning</Label>
                  <Controller
                    name="development_planning"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="development_planning"
                        type="textarea"
                        rows="2"
                        placeholder="Enter development planning concerns"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="assessment_done_by">Assessment Done By</Label>
                  <Controller
                    name="assessment_done_by"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="assessment_done_by"
                        type="text"
                        placeholder="Enter assessor name"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="concerns_discussed_with">Concerns Discussed With</Label>
                  <Controller
                    name="concerns_discussed_with"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="concerns_discussed_with"
                        type="text"
                        placeholder="Enter person/group name"
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
              {editItem && !isOrgExecutive && (
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
        title="Delete Concerns Record"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default ConcernsTab;


