import React, { useState, useMemo, useEffect } from "react";
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
  Row,
  Col,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const ProgramsTab = ({ applicantId, programs, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

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
    if (modalOpen) {
      reset({
        Program_Name: editItem?.program_name || "",
        Means_of_communication: editItem?.means_of_communication || "",
        Date_of_program: editItem?.date_of_program || "",
        Communicated_by: editItem?.communicated_by || "",
        Training_Level: editItem?.training_level || "",
        Training_Provider: editItem?.training_provider || "",
        Program_Outcome: editItem?.program_outcome || "",
        Attachment: null,
      });
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
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
      const currentUser = getHudasaUser();

      // Check if attachment is being uploaded
      const hasAttachment = data.Attachment && data.Attachment.length > 0;

      if (hasAttachment) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("person_trained_id", applicantId);
        formData.append("program_name", data.Program_Name || "");
        formData.append("means_of_communication", data.Means_of_communication || "");
        formData.append("date_of_program", data.Date_of_program || "");
        formData.append("communicated_by", data.Communicated_by || "");
        formData.append("training_level", data.Training_Level || "");
        formData.append("training_provider", data.Training_Provider || "");
        formData.append("program_outcome", data.Program_Outcome || "");
        formData.append("attachment", data.Attachment[0]);

        if (editItem) {
          formData.append("updated_by", currentUser?.username || "system");
          await axiosApi.put(`${API_BASE_URL}/programs/${editItem.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          formData.append("created_by", currentUser?.username || "system");
          await axiosApi.post(`${API_BASE_URL}/programs`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Use JSON for regular update/create without file
        const payload = {
          person_trained_id: applicantId,
          program_name: data.Program_Name ? parseInt(data.Program_Name) : null,
          means_of_communication: data.Means_of_communication ? parseInt(data.Means_of_communication) : null,
          date_of_program: data.Date_of_program || null,
          communicated_by: data.Communicated_by ? parseInt(data.Communicated_by) : null,
          training_level: data.Training_Level ? parseInt(data.Training_Level) : null,
          training_provider: data.Training_Provider ? parseInt(data.Training_Provider) : null,
          program_outcome: data.Program_Outcome ? parseInt(data.Program_Outcome) : null,
        };

        if (editItem) {
          payload.updated_by = getAuditName();
          await axiosApi.put(`${API_BASE_URL}/programs/${editItem.id}`, payload);
        } else {
          payload.created_by = getAuditName();
          await axiosApi.post(`${API_BASE_URL}/programs`, payload);
        }
      }

      showAlert(
        editItem ? "Program has been updated successfully" : "Program has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving program:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const programName = `${getLookupName(lookupData.programs, editItem.program_id)} - ${editItem.enrollment_date || 'Unknown Date'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: programName,
      type: "program enrollment",
      message: "This program enrollment will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/programs/${editItem.id}`);
      showAlert("Program has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
  };

  const getInstitutionName = (id) => {
    if (!id) return "-";
    const item = lookupData.trainingInstitutions.find((l) => l.id == id);
    return item ? item.institute_name : "-";
  };

  const getEmployeeName = (id) => {
    if (!id) return "-";
    const employee = lookupData.employees.find((e) => e.id == id);
    return employee ? `${employee.name || ""} ${employee.surname || ""}`.trim() : "-";
  };

  const columns = useMemo(
    () => [
      {
        header: "Program Name",
        accessorKey: "program_name",
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
            {getLookupName(lookupData.trainingCourses, cell.getValue())}
          </span>
        ),
      },
      {
        header: "Date",
        accessorKey: "date_of_program",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Provider",
        accessorKey: "training_provider",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getInstitutionName(cell.getValue()),
      },
      {
        header: "Outcome",
        accessorKey: "program_outcome",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const outcomeName = getLookupName(lookupData.trainingOutcomes, cell.getValue());
          let badgeClass = "badge-soft-secondary";
          
          if (outcomeName.toLowerCase().includes("complet") || outcomeName.toLowerCase().includes("certif")) {
            badgeClass = "badge-soft-success";
          } else if (outcomeName.toLowerCase().includes("fail")) {
            badgeClass = "badge-soft-danger";
          }
          
          return <span className={`badge ${badgeClass}`}>{outcomeName}</span>;
        },
      },
      {
        header: "Attachment",
        accessorKey: "attachment",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const attachment = cell.getValue();
          const rowId = cell.row.original.id;
          return attachment ? (
            <div className="d-flex justify-content-center gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/programs/${rowId}/view-attachment`}
                target="_blank"
                rel="noopener noreferrer"
                title="View"
              >
                <i
                  className="bx bx-show text-success"
                  style={{ cursor: "pointer", fontSize: "16px" }}
                ></i>
              </a>
            </div>
          ) : (
            "-"
          );
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
    [lookupData]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Programs</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Program
          </Button>
        )}
      </div>

      {programs.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No programs found. Click "Add Program" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={programs}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Program
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Program_Name">
                    Program Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Program_Name"
                    control={control}
                    rules={{ required: "Program name is required" }}
                    render={({ field }) => (
                      <Input id="Program_Name" type="select" invalid={!!errors.Program_Name} disabled={isOrgExecutive} {...field}>
                        <option value="">Select Course</option>
                        {lookupData.trainingCourses.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.Program_Name && <FormFeedback>{errors.Program_Name.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Date_of_program">Date of Program</Label>
                  <Controller
                    name="Date_of_program"
                    control={control}
                    render={({ field }) => <Input id="Date_of_program" type="date" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Means_of_communication">Means of Communication</Label>
                  <Controller
                    name="Means_of_communication"
                    control={control}
                    render={({ field }) => (
                      <Input id="Means_of_communication" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Means</option>
                        {lookupData.meansOfCommunication.map((item) => (
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
                  <Label for="Communicated_by">Communicated By</Label>
                  <Controller
                    name="Communicated_by"
                    control={control}
                    render={({ field }) => (
                      <Input id="Communicated_by" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Employee</option>
                        {lookupData.employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} {employee.surname}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Training_Level">Training Level</Label>
                  <Controller
                    name="Training_Level"
                    control={control}
                    render={({ field }) => (
                      <Input id="Training_Level" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Level</option>
                        {lookupData.trainingLevels.map((item) => (
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
                  <Label for="Training_Provider">Training Provider</Label>
                  <Controller
                    name="Training_Provider"
                    control={control}
                    render={({ field }) => (
                      <Input id="Training_Provider" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Provider</option>
                        {lookupData.trainingInstitutions.map((institution) => (
                          <option key={institution.id} value={institution.id}>
                            {institution.institute_name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Program_Outcome">Program Outcome</Label>
                  <Controller
                    name="Program_Outcome"
                    control={control}
                    render={({ field }) => (
                      <Input id="Program_Outcome" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Outcome</option>
                        {lookupData.trainingOutcomes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Attachment">Attachment</Label>
                  <Controller
                    name="Attachment"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="Attachment"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.Attachment}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.Attachment && <FormFeedback>{errors.Attachment.message}</FormFeedback>}
                  {editItem && editItem.attachment && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.attachment_filename || "attachment"}</div>
                          <small className="text-muted">
                            {formatFileSize(editItem.attachment_size)} • Current file
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
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
        title="Delete Program Enrollment"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default ProgramsTab;

