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
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser } from "../../../../helpers/userStorage";

const ConductAssessmentTab = ({ application, conductAssessments, onUpdate, showAlert, lookupData = {} }) => {
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
        question1: editItem.question1 || "",
        question2: editItem.question2 || "",
        question3: editItem.question3 || "",
        question4: editItem.question4 || "",
        question5: editItem.question5 || "",
        jumah: editItem.jumah || "",
        eid: editItem.eid || "",
        inclination: editItem.inclination || "",
        comment_on_character: editItem.comment_on_character || "",
      });
    } else if (modalOpen) {
      reset({
        question1: "",
        question2: "",
        question3: "",
        question4: "",
        question5: "",
        jumah: "",
        eid: "",
        inclination: "",
        comment_on_character: "",
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
        madressah_app_id: application.id,
        created_by: currentUser?.username || "system",
        updated_by: currentUser?.username || "system",
      };

      if (editItem) {
        formData.updated_by = currentUser?.username || "system";
        await axiosApi.put(
          `${API_BASE_URL}/conductAssessment/${editItem.id}`,
          formData
        );
        showAlert("Assessment updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/conductAssessment`, formData);
        showAlert("Assessment created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving assessment:", error);
      showAlert(
        error.response?.data?.error || "Failed to save assessment",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const assessmentName = editItem.comment_on_character 
      ? editItem.comment_on_character.substring(0, 50) + (editItem.comment_on_character.length > 50 ? '...' : '') 
      : 'Assessment';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: assessmentName,
      type: "assessment",
      message: "This assessment will be permanently removed from the system."
    }, async () => {
      try {
        await axiosApi.delete(`${API_BASE_URL}/conductAssessment/${editItem.id}`);
        showAlert("Assessment has been deleted successfully", "success");
        onUpdate();
        if (modalOpen) {
          setModalOpen(false);
        }
      } catch (error) {
        console.error("Error deleting assessment:", error);
        showAlert(error?.response?.data?.message || "Failed to delete assessment", "danger");
        throw error; // Re-throw so the hook knows there was an error
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const columns = useMemo(
    () => [
      {
        header: "Question 1",
        accessorKey: "question1",
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
        header: "Date",
        accessorKey: "created_on",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
      {
        header: "Character Comment",
        accessorKey: "comment_on_character",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const comment = cell.getValue() || "";
          return comment.length > 50 ? `${comment.substring(0, 50)}...` : comment || "-";
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
     []
   );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Conduct Assessment</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Assessment
          </Button>
        )}
      </div>

      {conductAssessments && conductAssessments.length > 0 ? (
        <TableContainer
          columns={columns}
          data={conductAssessments || []}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      ) : (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No assessments found. Click "Add Assessment" to create one.
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Assessment
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="question1">Question 1</Label>
                  <Controller
                    name="question1"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question1"
                        type="text"
                        placeholder="Question 1"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="question2">Question 2</Label>
                  <Controller
                    name="question2"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question2"
                        type="text"
                        placeholder="Question 2"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="question3">Question 3</Label>
                  <Controller
                    name="question3"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question3"
                        type="text"
                        placeholder="Question 3"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="question4">Question 4</Label>
                  <Controller
                    name="question4"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question4"
                        type="text"
                        placeholder="Question 4"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="question5">Question 5</Label>
                  <Controller
                    name="question5"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question5"
                        type="text"
                        placeholder="Question 5"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="jumah">Jumah</Label>
                  <Controller
                    name="jumah"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="jumah"
                        type="text"
                        placeholder="Jumah attendance"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="eid">Eid</Label>
                  <Controller
                    name="eid"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="eid"
                        type="text"
                        placeholder="Eid attendance"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="inclination">Inclination</Label>
                  <Controller
                    name="inclination"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="inclination"
                        type="text"
                        placeholder="Inclination"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="comment_on_character">Comment on Character</Label>
                  <Controller
                    name="comment_on_character"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="comment_on_character"
                        type="textarea"
                        rows={3}
                        placeholder="Character assessment comments"
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
                <Button
                  color="danger"
                  onClick={handleDelete}
                  type="button"
                  disabled={isSubmitting}
                >
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button
                color="light"
                onClick={toggleModal}
                type="button"
                disabled={isSubmitting}
                className="me-2"
              >
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
        title="Delete Assessment"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default ConductAssessmentTab;

