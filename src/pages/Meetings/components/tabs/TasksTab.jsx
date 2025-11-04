import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Badge,
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
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const TasksTab = ({ meetingId, tasks, lookupData, onUpdate, showAlert }) => {
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

  useEffect(() => {
    if (modalOpen) {
      reset({
        Task_Description: editItem?.task_description || "",
        Completion_Date: editItem?.completion_date ? editItem.completion_date.split('T')[0] : "",
        Responsible: editItem?.responsible || "",
        Status: editItem?.status || "",
        Notes: editItem?.notes || "",
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

  const getStatusBadge = (statusId) => {
    if (!statusId || !lookupData.taskStatuses) return <Badge color="light">Unknown</Badge>;
    const status = lookupData.taskStatuses.find(s => s.id === statusId);
    const statusName = status ? status.name : "Unknown";

    switch (statusName?.toLowerCase()) {
      case "complete":
        return <Badge color="success">Complete</Badge>;
      case "incomplete":
        return <Badge color="danger">Incomplete</Badge>;
      case "in progress":
        return <Badge color="warning">In Progress</Badge>;
      default:
        return <Badge color="light">{statusName}</Badge>;
    }
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      
      const payload = {
        hseq_toolbox_meeting_id: meetingId,
        task_description: data.Task_Description,
        completion_date: data.Completion_Date || null,
        responsible: data.Responsible,
        status: data.Status || null,
        notes: data.Notes,
        center_id: currentUser?.center_id || 1,
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/hseqToolboxMeetingTasks/${editItem.id}`, payload);
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/hseqToolboxMeetingTasks`, payload);
      }

      showAlert(
        editItem ? "Task has been updated successfully" : "Task has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving task:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const taskName = `${editItem.task_description || 'Unknown Task'} - ${editItem.responsible || 'Unassigned'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: taskName,
      type: "task",
      message: "This task will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/hseqToolboxMeetingTasks/${editItem.id}`);
      showAlert("Task has been deleted successfully", "success");
      onUpdate();
      toggleModal();
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Task Description",
        accessorKey: "task_description",
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
        header: "Completion Date",
        accessorKey: "completion_date",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Responsible",
        accessorKey: "responsible",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getStatusBadge(cell.getValue()),
      },
      {
        header: "Notes",
        accessorKey: "notes",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const notes = cell.getValue() || "";
          return notes.length > 50 ? `${notes.substring(0, 50)}...` : notes || "-";
        },
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
    ],
    [lookupData.taskStatuses]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Tasks</h5>
        <Button color="primary" size="sm" onClick={handleAdd}>
          <i className="bx bx-plus me-1"></i> Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No tasks found. Click "Add Task" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={tasks}
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
          {editItem ? "Edit" : "Add"} Task
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="Task_Description">
                    Task Description <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Task_Description"
                    control={control}
                    rules={{ required: "Task description is required" }}
                    render={({ field }) => (
                      <Input id="Task_Description" type="textarea" rows="3" invalid={!!errors.Task_Description} {...field} />
                    )}
                  />
                  {errors.Task_Description && <FormFeedback>{errors.Task_Description.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Completion_Date">Completion Date</Label>
                  <Controller
                    name="Completion_Date"
                    control={control}
                    render={({ field }) => (
                      <Input id="Completion_Date" type="date" {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Responsible">Responsible</Label>
                  <Controller
                    name="Responsible"
                    control={control}
                    render={({ field }) => (
                      <Input id="Responsible" type="text" {...field} />
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
                        {(lookupData.taskStatuses || []).map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Notes">Notes</Label>
                  <Controller
                    name="Notes"
                    control={control}
                    render={({ field }) => (
                      <Input id="Notes" type="textarea" rows="5" {...field} />
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editItem && (
                <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
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
        title="Delete Task"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default TasksTab;

