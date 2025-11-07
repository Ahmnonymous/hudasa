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
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const FinancialAssistanceTab = ({ applicantId, applicant, relationships = [], financialAssistance, lookupData, onUpdate, showAlert }) => {
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
        Assistance_Type: editItem?.assistance_type || "",
        Financial_Amount: editItem?.financial_amount || "",
        Date_of_Assistance: editItem?.date_of_assistance || "",
        Assisted_By: editItem?.assisted_by || "",
        Sector: editItem?.sector || "",
        Program: editItem?.program || "",
        Project: editItem?.project || "",
        Give_To: editItem?.give_to || "",
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

      const payload = {
        file_id: applicantId,
        assistance_type: data.Assistance_Type ? parseInt(data.Assistance_Type) : null,
        financial_amount: data.Financial_Amount ? parseFloat(data.Financial_Amount) : 0,
        date_of_assistance: data.Date_of_Assistance || null,
        assisted_by: data.Assisted_By ? parseInt(data.Assisted_By) : null,
        sector: data.Sector || "",
        program: data.Program || "",
        project: data.Project || "",
        give_to: data.Give_To || "",
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/financialAssistance/${editItem.id}`, payload);
        showAlert("Financial assistance has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/financialAssistance`, payload);
        showAlert("Financial assistance has been added successfully", "success");
      }

      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving financial assistance:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const assistanceName = `${getLookupName(lookupData.assistanceTypes, editItem.assistance_type)} - ${editItem.amount || 'Unknown Amount'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: assistanceName,
      type: "financial assistance",
      message: "This financial assistance record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/financialAssistance/${editItem.id}`);
      showAlert("Financial assistance has been deleted successfully", "success");
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

  const recipientOptions = useMemo(() => {
    const options = [];
    const sanitize = (value) => (value || "").replace(/\s+/g, " ").trim();

    if (applicant) {
      const applicantName = sanitize(`${applicant?.name || ""} ${applicant?.surname || ""}`) || sanitize(applicant?.preferred_name) || "Applicant";
      options.push({
        key: `applicant-${applicant?.id ?? "self"}`,
        value: applicantName,
        label: `${applicantName} (Applicant)`,
      });
    }

    (relationships || []).forEach((rel) => {
      const relName = sanitize(`${rel?.name || ""} ${rel?.surname || ""}`) || sanitize(rel?.relative_name) || "Unknown";
      const relationshipTypeName = getLookupName(lookupData?.relationshipTypes || [], rel?.relationship_type);
      options.push({
        key: `relationship-${rel?.id ?? relName}`,
        value: relName,
        label: relationshipTypeName && relationshipTypeName !== "-" ? `${relName} (${relationshipTypeName})` : relName,
      });
    });

    return options;
  }, [applicant, relationships, lookupData?.relationshipTypes]);

  const columns = useMemo(
    () => [
      {
        header: "Assistance Type",
        accessorKey: "assistance_type",
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
            {getLookupName(lookupData.assistanceTypes, cell.getValue())}
          </span>
        ),
      },
      {
        header: "Date",
        accessorKey: "date_of_assistance",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Amount",
        accessorKey: "financial_amount",
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
        header: "Sector",
        accessorKey: "sector",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Program",
        accessorKey: "program",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Project",
        accessorKey: "project",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Given To",
        accessorKey: "give_to",
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
    [lookupData, handleEdit]
  );

  const totalAmount = financialAssistance.reduce(
    (sum, item) => sum + (parseFloat(item.financial_amount) || 0),
    0
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Financial Assistance</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Financial Assistance
          </Button>
        )}
      </div>

      {financialAssistance.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No financial assistance records found. Click "Add Financial Assistance" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={financialAssistance}
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
          {editItem ? "Edit" : "Add"} Financial Assistance
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Assistance_Type">
                    Assistance Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Assistance_Type"
                    control={control}
                    rules={{ required: "Assistance type is required" }}
                    render={({ field }) => (
                      <Input id="Assistance_Type" type="select" invalid={!!errors.Assistance_Type} disabled={isOrgExecutive} {...field}>
                        <option value="">Select Type</option>
                        {lookupData.assistanceTypes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.Assistance_Type && <FormFeedback>{errors.Assistance_Type.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Financial_Amount">
                    Amount (R) <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Financial_Amount"
                    control={control}
                    rules={{ required: "Amount is required", min: { value: 0, message: "Amount must be positive" } }}
                    render={({ field }) => (
                      <Input id="Financial_Amount" type="number" step="0.01" invalid={!!errors.Financial_Amount} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.Financial_Amount && <FormFeedback>{errors.Financial_Amount.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Date_of_Assistance">Date of Assistance</Label>
                  <Controller
                    name="Date_of_Assistance"
                    control={control}
                    render={({ field }) => <Input id="Date_of_Assistance" type="date" disabled={isOrgExecutive} {...field} />}
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

              <Col md={6}>
                <FormGroup>
                  <Label for="Sector">Sector</Label>
                  <Controller
                    name="Sector"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="Sector"
                        type="text"
                        placeholder="Enter sector"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Program">Program</Label>
                  <Controller
                    name="Program"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="Program"
                        type="text"
                        placeholder="Enter program"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Project">Project</Label>
                  <Controller
                    name="Project"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="Project"
                        type="text"
                        placeholder="Enter project"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Give_To">Given To</Label>
                  <Controller
                    name="Give_To"
                    control={control}
                    render={({ field }) => {
                      const optionList = recipientOptions.some((option) => option.value === field.value)
                        ? recipientOptions
                        : field.value
                        ? [...recipientOptions, { key: "existing-recipient", value: field.value, label: field.value }]
                        : recipientOptions;

                      return (
                        <Input
                          id="Give_To"
                          type="select"
                          disabled={isOrgExecutive}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          innerRef={field.ref}
                        >
                          <option value="">Select recipient</option>
                          {optionList.map((option) => (
                            <option key={option.key} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Input>
                      );
                    }}
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
        title="Delete Financial Assistance"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default FinancialAssistanceTab;

