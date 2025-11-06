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
import { getAuditName } from "../../../../helpers/userStorage";

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

  // Question options
  const question1Options = [
    { value: "Always", label: "Always" },
    { value: "Never", label: "Never" },
    { value: "Often", label: "Often" },
    { value: "Rarely", label: "Rarely" },
    { value: "Sometimes", label: "Sometimes" },
  ];

  const question2Options = [
    { value: "Does not pray", label: "Does not pray" },
    { value: "Misses 1-2 occasionally", label: "Misses 1-2 occasionally" },
    { value: "Performs all five daily prayers", label: "Performs all five daily prayers" },
    { value: "Prays sometimes", label: "Prays sometimes" },
    { value: "Rarely prays", label: "Rarely prays" },
  ];

  const question3Options = [
    { value: "Always", label: "Always" },
    { value: "Never", label: "Never" },
    { value: "Often", label: "Often" },
    { value: "Rarely", label: "Rarely" },
    { value: "Sometimes", label: "Sometimes" },
  ];

  const question4Options = [
    { value: "Excellent adab and control", label: "Excellent adab and control" },
    { value: "Frequently escalates conflict", label: "Frequently escalates conflict" },
    { value: "Often reacts impulsively", label: "Often reacts impulsively" },
    { value: "Sometimes struggles with patience", label: "Sometimes struggles with patience" },
    { value: "Usually calm and respectful", label: "Usually calm and respectful" },
  ];

  const question5Options = [
    { value: "Frequently untidy", label: "Frequently untidy" },
    { value: "Generally maintains good hygiene", label: "Generally maintains good hygiene" },
    { value: "Poor hygiene and grooming", label: "Poor hygiene and grooming" },
    { value: "Sometimes neglects it", label: "Sometimes neglects it" },
    { value: "Very clean and well-groomed", label: "Very clean and well-groomed" },
  ];

  const jumahOptions = [
    { value: "Always", label: "Always" },
    { value: "Never", label: "Never" },
    { value: "Sometimes", label: "Sometimes" },
  ];

  const eidOptions = [
    { value: "Always", label: "Always" },
    { value: "Never", label: "Never" },
    { value: "Sometimes", label: "Sometimes" },
  ];

  const inclinationOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
  ];

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
      const formData = {
        ...data,
        madressah_app_id: application.id,
        created_by: getAuditName(),
        updated_by: getAuditName(),
      };

      if (editItem) {
        formData.updated_by = getAuditName();
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
        throw error;
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        id: "question1",
        header: "Respect & Kindness",
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
        id: "question2",
        header: "Daily Prayers",
        accessorKey: "question2",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "question3",
        header: "Honesty",
        accessorKey: "question3",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "question4",
        header: "Conflict Handling",
        accessorKey: "question4",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "question5",
        header: "Cleanliness",
        accessorKey: "question5",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "jumah",
        header: "Jumu'ah",
        accessorKey: "jumah",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "eid",
        header: "Eid Salah",
        accessorKey: "eid",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "inclination",
        header: "Inclination",
        accessorKey: "inclination",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "comment_on_character",
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
        id: "created_by",
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "created_at",
        header: "Created On",
        accessorKey: "created_at",
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
          {editItem ? "Edit" : "Add"} Conduct Assessment
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="question1">
                    1. Does the student show respect and kindness to teachers, elders, and peers?
                  </Label>
                  <Controller
                    name="question1"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question1"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {question1Options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="question2">
                    2. How consistent is the student in performing their daily prayers (Salah)?
                  </Label>
                  <Controller
                    name="question2"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question2"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {question2Options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="question3">
                    3. Does the student show honesty and trustworthiness in words and actions?
                  </Label>
                  <Controller
                    name="question3"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question3"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {question3Options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="question4">
                    4. How does the student handle conflict? Do they show patience, humility, and forgiveness?
                  </Label>
                  <Controller
                    name="question4"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question4"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {question4Options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="question5">
                    5. Does the student maintain cleanliness and hygiene, following the example of taharah?
                  </Label>
                  <Controller
                    name="question5"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="question5"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {question5Options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="jumah">
                    6. Does the student regularly attend Jumu'ah (Friday) prayers?
                  </Label>
                  <Controller
                    name="jumah"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="jumah"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {jumahOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="eid">
                    7. Does the student attend Eid Salah regularly with their family or community?
                  </Label>
                  <Controller
                    name="eid"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="eid"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {eidOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="inclination">8. Inclination</Label>
                  <Controller
                    name="inclination"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="inclination"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select an answer</option>
                        {inclinationOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="comment_on_character">9. Comment On Character</Label>
                  <Controller
                    name="comment_on_character"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="comment_on_character"
                        type="textarea"
                        rows={3}
                        placeholder="Enter character assessment comments"
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
