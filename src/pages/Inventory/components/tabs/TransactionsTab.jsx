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
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const TransactionsTab = ({ itemId, transactions, lookupData, onUpdate, showAlert }) => {
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
        Transaction_Type: editItem?.transaction_type || "IN",
        Quantity: editItem?.quantity || "",
        Transaction_Date: editItem?.transaction_date ? editItem.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0],
        Notes: editItem?.notes || "",
        Employee_ID: editItem?.employee_id || "",
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

  const getTypeBadge = (type) => {
    switch (type?.toUpperCase()) {
      case "IN":
        return <Badge color="success">IN</Badge>;
      case "OUT":
        return <Badge color="danger">OUT</Badge>;
      default:
        return <Badge color="light">Unknown</Badge>;
    }
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId || !lookupData.employees) return "-";
    const employee = lookupData.employees.find(e => e.id === employeeId);
    return employee ? `${employee.name || ''} ${employee.surname || ''}`.trim() : "-";
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      
      const payload = {
        item_id: itemId,
        transaction_type: data.Transaction_Type,
        quantity: data.Quantity ? parseFloat(data.Quantity) : null,
        transaction_date: data.Transaction_Date,
        notes: data.Notes,
        employee_id: data.Employee_ID || null,
        center_id: currentUser?.center_id || 1,
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/inventoryTransactions/${editItem.id}`, payload);
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/inventoryTransactions`, payload);
      }

      showAlert(
        editItem ? "Transaction has been updated successfully" : "Transaction has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving transaction:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const transactionName = `${editItem.transaction_type || 'Unknown'} - ${editItem.quantity || 0} units on ${editItem.transaction_date || 'Unknown Date'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: transactionName,
      type: "transaction",
      message: "This transaction will be permanently removed and the item quantity will be adjusted."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/inventoryTransactions/${editItem.id}`);
      showAlert("Transaction has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Transaction Date",
        accessorKey: "transaction_date",
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
        header: "Type",
        accessorKey: "transaction_type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getTypeBadge(cell.getValue()),
      },
      {
        header: "Quantity",
        accessorKey: "quantity",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const quantity = cell.getValue();
          return quantity ? parseFloat(quantity).toFixed(2) : "-";
        },
      },
      {
        header: "Employee",
        accessorKey: "employee_id",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getEmployeeName(cell.getValue()),
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
    [lookupData.employees]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Transactions</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Transaction
          </Button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No transactions found. Click "Add Transaction" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={transactions}
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
          {editItem ? "Edit" : "Add"} Transaction
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Transaction_Date">
                    Transaction Date <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Transaction_Date"
                    control={control}
                    rules={{ required: "Transaction date is required" }}
                    render={({ field }) => (
                      <Input id="Transaction_Date" type="date" invalid={!!errors.Transaction_Date} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Transaction_Date && <FormFeedback>{errors.Transaction_Date.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Transaction_Type">
                    Transaction Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Transaction_Type"
                    control={control}
                    rules={{ required: "Transaction type is required" }}
                    render={({ field }) => (
                      <Input id="Transaction_Type" type="select" invalid={!!errors.Transaction_Type} disabled={isOrgExecutive} {...field}>
                        <option value="IN">IN (Stock Received)</option>
                        <option value="OUT">OUT (Stock Issued)</option>
                      </Input>
                    )}
                  />
                  {errors.Transaction_Type && <FormFeedback>{errors.Transaction_Type.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Quantity">
                    Quantity <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Quantity"
                    control={control}
                    rules={{ 
                      required: "Quantity is required",
                      min: { value: 0.01, message: "Quantity must be greater than 0" }
                    }}
                    render={({ field }) => (
                      <Input id="Quantity" type="number" step="0.01" invalid={!!errors.Quantity} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Quantity && <FormFeedback>{errors.Quantity.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Employee_ID">Employee</Label>
                  <Controller
                    name="Employee_ID"
                    control={control}
                    render={({ field }) => (
                      <Input id="Employee_ID" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Employee</option>
                        {(lookupData.employees || []).map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} {employee.surname}
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
                      <Input id="Notes" type="textarea" rows="5" disabled={isOrgExecutive} {...field} />
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
        title="Delete Transaction"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default TransactionsTab;

