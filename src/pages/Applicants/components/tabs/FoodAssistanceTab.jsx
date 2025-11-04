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
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getAuditName } from "../../../../helpers/userStorage";

const FoodAssistanceTab = ({ applicantId, foodAssistance, lookupData, onUpdate, showAlert }) => {
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

  useEffect(() => {
    if (modalOpen) {
      reset({
        Distributed_Date: editItem?.distributed_date || "",
        Hamper_Type: editItem?.hamper_type || "",
        Financial_Cost: editItem?.financial_cost || "",
        Assisted_By: editItem?.assisted_by || "",
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

      const payload = {
        file_id: applicantId,
        distributed_date: data.Distributed_Date || null,
        hamper_type: data.Hamper_Type ? parseInt(data.Hamper_Type) : null,
        financial_cost: data.Financial_Cost ? parseFloat(data.Financial_Cost) : 0,
        assisted_by: data.Assisted_By ? parseInt(data.Assisted_By) : null,
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/foodAssistance/${editItem.id}`, payload);
        showAlert("Food assistance has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/foodAssistance`, payload);
        showAlert("Food assistance has been added successfully", "success");
      }

      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving food assistance:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const assistanceName = `${getLookupName(lookupData.hamperTypes, editItem.hamper_type)} - ${editItem.distributed_date || 'Unknown Date'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: assistanceName,
      type: "food assistance",
      message: "This food assistance record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/foodAssistance/${editItem.id}`);
      showAlert("Food assistance has been deleted successfully", "success");
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

  const columns = useMemo(
    () => [
      {
        header: "Hamper Type",
        accessorKey: "hamper_type",
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
            {getLookupName(lookupData.hampers, cell.getValue())}
          </span>
        ),
      },
      {
        header: "Date",
        accessorKey: "distributed_date",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Cost",
        accessorKey: "financial_cost",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const amount = parseFloat(cell.getValue()) || 0;
          return `R ${amount.toFixed(2)}`;
        },
      },
      {
        header: "Assisted By",
        accessorKey: "assisted_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const empId = cell.getValue();
          const emp = (lookupData.employees || []).find((e) => e.id == empId);
          return emp ? `${emp.name || ''} ${emp.surname || ''}`.trim() : "-";
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

  const totalCost = foodAssistance.reduce((sum, item) => sum + (parseFloat(item.financial_cost) || 0), 0);

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Food Assistance</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Food Assistance
          </Button>
        )}
      </div>

      {foodAssistance.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No food assistance records found. Click "Add Food Assistance" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={foodAssistance}
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
          {editItem ? "Edit" : "Add"} Food Assistance
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Distributed_Date">
                    Distributed Date <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Distributed_Date"
                    control={control}
                    rules={{ required: "Distributed date is required" }}
                    render={({ field }) => (
                      <Input id="Distributed_Date" type="date" invalid={!!errors.Distributed_Date} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Distributed_Date && <FormFeedback>{errors.Distributed_Date.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Hamper_Type">
                    Hamper Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Hamper_Type"
                    control={control}
                    rules={{ required: "Hamper type is required" }}
                    render={({ field }) => (
                      <Input id="Hamper_Type" type="select" invalid={!!errors.Hamper_Type} disabled={isOrgExecutive} {...field}>
                        <option value="">Select Type</option>
                        {lookupData.hampers.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.Hamper_Type && <FormFeedback>{errors.Hamper_Type.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Financial_Cost">Cost (R)</Label>
                  <Controller
                    name="Financial_Cost"
                    control={control}
                    render={({ field }) => <Input id="Financial_Cost" type="number" step="0.01" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Assisted_By">Assisted By</Label>
                  <Controller
                    name="Assisted_By"
                    control={control}
                    render={({ field }) => (
                      <Input id="Assisted_By" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Employee</option>
                        {(lookupData.employees || []).map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {(emp.name || "")} {(emp.surname || "")}
                          </option>
                        ))}
                      </Input>
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
        title="Delete Food Assistance"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default FoodAssistanceTab;

