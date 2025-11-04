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

const SurveyTab = ({ application, surveys, onUpdate, showAlert, lookupData = {} }) => {
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
        question6: editItem.question6 || "",
        question7: editItem.question7 || "",
        question8: editItem.question8 || "",
        question9: editItem.question9 || "",
        question10: editItem.question10 || "",
        question11: editItem.question11 || "",
        question12: editItem.question12 || "",
        question13: editItem.question13 || "",
        question14: editItem.question14 || "",
        question15: editItem.question15 || "",
        question16: editItem.question16 || "",
        question17: editItem.question17 || "",
        question18: editItem.question18 || "",
        question19: editItem.question19 || "",
      });
    } else if (modalOpen) {
      reset({
        question1: "",
        question2: "",
        question3: "",
        question4: "",
        question5: "",
        question6: "",
        question7: "",
        question8: "",
        question9: "",
        question10: "",
        question11: "",
        question12: "",
        question13: "",
        question14: "",
        question15: "",
        question16: "",
        question17: "",
        question18: "",
        question19: "",
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
          `${API_BASE_URL}/survey/${editItem.id}`,
          formData
        );
        showAlert("Survey updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/survey`, formData);
        showAlert("Survey created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving survey:", error);
      showAlert(
        error.response?.data?.error || "Failed to save survey",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const surveyName = editItem.question1 
      ? editItem.question1.substring(0, 50) + (editItem.question1.length > 50 ? '...' : '') 
      : 'Survey';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: surveyName,
      type: "survey",
      message: "This survey will be permanently removed from the system."
    }, async () => {
      try {
        await axiosApi.delete(`${API_BASE_URL}/survey/${editItem.id}`);
        showAlert("Survey has been deleted successfully", "success");
        onUpdate();
        if (modalOpen) {
          setModalOpen(false);
        }
      } catch (error) {
        console.error("Error deleting survey:", error);
        showAlert(error?.response?.data?.message || "Failed to delete survey", "danger");
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
            {cell.getValue() ? (cell.getValue().length > 50 ? `${cell.getValue().substring(0, 50)}...` : cell.getValue()) : "-"}
          </span>
        ),
      },
      {
        header: "Created On",
        accessorKey: "created_on",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
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
        header: "Created At",
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
        <h5 className="mb-0">Survey</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Survey
          </Button>
        )}
      </div>

             {surveys && surveys.length > 0 ? (
         <TableContainer
           columns={columns}
           data={surveys || []}
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
           No surveys found. Click "Add Survey" to create one.
         </div>
       )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="xl" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Survey
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((num) => (
                <Col md={num === 5 || num === 15 ? 12 : 6} key={num}>
                  <FormGroup>
                    <Label for={`question${num}`}>Question {num}</Label>
                    <Controller
                      name={`question${num}`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          id={`question${num}`}
                          type={num === 5 || num === 15 ? "textarea" : "text"}
                          rows={num === 5 || num === 15 ? 3 : 1}
                          placeholder={`Answer question ${num}`}
                          disabled={isOrgExecutive}
                          {...field}
                        />
                      )}
                    />
                  </FormGroup>
                </Col>
              ))}
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
        title="Delete Survey"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default SurveyTab;

