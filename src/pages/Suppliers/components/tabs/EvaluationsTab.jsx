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
import { useRole } from "../../../../helpers/useRole";

const EvaluationsTab = ({ supplierId, evaluations, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole();
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
        Eval_Date: editItem?.eval_date ? editItem.eval_date.split('T')[0] : "",
        Quality_Score: editItem?.quality_score || "",
        Delivery_Score: editItem?.delivery_score || "",
        Cost_Score: editItem?.cost_score || "",
        OHS_Score: editItem?.ohs_score || "",
        Env_Score: editItem?.env_score || "",
        Quality_Wt: editItem?.quality_wt || "",
        Delivery_Wt: editItem?.delivery_wt || "",
        Cost_Wt: editItem?.cost_wt || "",
        OHS_Wt: editItem?.ohs_wt || "",
        Env_Wt: editItem?.env_wt || "",
        Overall_Score: editItem?.overall_score || "",
        Status: editItem?.status || "",
        Expiry_Date: editItem?.expiry_date ? editItem.expiry_date.split('T')[0] : "",
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
    // Allow Org Executive to view (open modal) but they'll only see Cancel button
    setEditItem(item);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      
      const payload = {
        supplier_id: supplierId,
        eval_date: data.Eval_Date,
        quality_score: data.Quality_Score ? parseInt(data.Quality_Score) : null,
        delivery_score: data.Delivery_Score ? parseInt(data.Delivery_Score) : null,
        cost_score: data.Cost_Score ? parseInt(data.Cost_Score) : null,
        ohs_score: data.OHS_Score ? parseInt(data.OHS_Score) : null,
        env_score: data.Env_Score ? parseInt(data.Env_Score) : null,
        quality_wt: data.Quality_Wt ? parseFloat(data.Quality_Wt) : null,
        delivery_wt: data.Delivery_Wt ? parseFloat(data.Delivery_Wt) : null,
        cost_wt: data.Cost_Wt ? parseFloat(data.Cost_Wt) : null,
        ohs_wt: data.OHS_Wt ? parseFloat(data.OHS_Wt) : null,
        env_wt: data.Env_Wt ? parseFloat(data.Env_Wt) : null,
        overall_score: data.Overall_Score ? parseFloat(data.Overall_Score) : null,
        status: data.Status,
        expiry_date: data.Expiry_Date,
        notes: data.Notes,
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/supplierEvaluation/${editItem.id}`, payload);
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/supplierEvaluation`, payload);
      }

      showAlert(
        editItem ? "Evaluation has been updated successfully" : "Evaluation has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const evaluationName = `Evaluation on ${editItem.eval_date || 'Unknown Date'} - ${editItem.status || 'Unknown Status'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: evaluationName,
      type: "evaluation",
      message: "This evaluation will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/supplierEvaluation/${editItem.id}`);
      showAlert("Evaluation has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge color="success">Approved</Badge>;
      case "pending":
        return <Badge color="warning">Pending</Badge>;
      case "rejected":
        return <Badge color="danger">Rejected</Badge>;
      default:
        return <Badge color="light">Unknown</Badge>;
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Evaluation Date",
        accessorKey: "eval_date",
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
            {cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : "-"}
          </span>
        ),
      },
      {
        header: "Overall Score",
        accessorKey: "overall_score",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const score = cell.getValue();
          return score ? (
            <Badge color="info">
              {Number(score).toFixed(2)}
            </Badge>
          ) : "-";
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getStatusBadge(cell.getValue()),
      },
      {
        header: "Expiry Date",
        accessorKey: "expiry_date",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
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
    [isOrgExecutive]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Evaluations</h5>
        {/* Hide Add button for Org Executive (view-only) */}
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Evaluation
          </Button>
        )}
      </div>

      {evaluations.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No evaluations found. Click "Add Evaluation" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={evaluations}
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
          {editItem ? "Edit" : "Add"} Evaluation
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Eval_Date">
                    Evaluation Date <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Eval_Date"
                    control={control}
                    rules={{ required: "Evaluation date is required" }}
                    render={({ field }) => (
                      <Input id="Eval_Date" type="date" invalid={!!errors.Eval_Date} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Eval_Date && <FormFeedback>{errors.Eval_Date.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Status">Status</Label>
                  <Controller
                    name="Status"
                    control={control}
                    render={({ field }) => (
                      <Input id="Status" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Quality_Score">Quality Score (1-5)</Label>
                  <Controller
                    name="Quality_Score"
                    control={control}
                    render={({ field }) => (
                      <Input id="Quality_Score" type="number" min="1" max="5" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Delivery_Score">Delivery Score (1-5)</Label>
                  <Controller
                    name="Delivery_Score"
                    control={control}
                    render={({ field }) => (
                      <Input id="Delivery_Score" type="number" min="1" max="5" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Cost_Score">Cost Score (1-5)</Label>
                  <Controller
                    name="Cost_Score"
                    control={control}
                    render={({ field }) => (
                      <Input id="Cost_Score" type="number" min="1" max="5" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="OHS_Score">OHS Score (1-5)</Label>
                  <Controller
                    name="OHS_Score"
                    control={control}
                    render={({ field }) => (
                      <Input id="OHS_Score" type="number" min="1" max="5" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Env_Score">Environment Score (1-5)</Label>
                  <Controller
                    name="Env_Score"
                    control={control}
                    render={({ field }) => (
                      <Input id="Env_Score" type="number" min="1" max="5" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Overall_Score">Overall Score</Label>
                  <Controller
                    name="Overall_Score"
                    control={control}
                    render={({ field }) => (
                      <Input id="Overall_Score" type="number" step="0.01" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Expiry_Date">Expiry Date</Label>
                  <Controller
                    name="Expiry_Date"
                    control={control}
                    render={({ field }) => (
                      <Input id="Expiry_Date" type="date" disabled={isOrgExecutive} {...field} />
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
                      <Input id="Notes" type="textarea" rows="5" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {/* Hide Delete button for Org Executive (view-only) */}
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
              {/* Hide Save button for Org Executive (view-only) */}
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
        title="Delete Evaluation"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default EvaluationsTab;