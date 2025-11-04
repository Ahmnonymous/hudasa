import React, { useState, useEffect } from "react";
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
  Card,
  CardBody,
  Table,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const FinancialAssessmentTab = ({ applicantId, financialAssessment, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [modalOpen, setModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editIncomeItem, setEditIncomeItem] = useState(null);
  const [editExpenseItem, setEditExpenseItem] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);

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
    control: incomeControl,
    handleSubmit: handleIncomeSubmit,
    formState: { errors: incomeErrors, isSubmitting: isIncomeSubmitting },
    reset: resetIncome,
  } = useForm();

  const {
    control: expenseControl,
    handleSubmit: handleExpenseSubmit,
    formState: { errors: expenseErrors, isSubmitting: isExpenseSubmitting },
    reset: resetExpense,
  } = useForm();

  useEffect(() => {
    if (financialAssessment) {
      fetchIncomeExpense();
    }
  }, [financialAssessment]);

  const fetchIncomeExpense = async () => {
    if (!financialAssessment) return;

    try {
      const [incomeRes, expenseRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/applicantIncome?financial_assessment_id=${financialAssessment.id}`),
        axiosApi.get(`${API_BASE_URL}/applicantExpense?financial_assessment_id=${financialAssessment.id}`),
      ]);

      setIncomes(incomeRes.data || []);
      setExpenses(expenseRes.data || []);
    } catch (error) {
      console.error("Error fetching income/expense:", error);
    }
  };

  const createFinancialAssessment = async () => {
    try {
      const currentUser = getHudasaUser();

      const payload = {
        file_id: applicantId,
        total_income: 0,
        total_expenses: 0,
        disposable_income: 0,
        created_by: getAuditName(),
      };

      await axiosApi.post(`${API_BASE_URL}/financialAssessment`, payload);
      showAlert("Financial assessment has been created successfully", "success");
      onUpdate();
    } catch (error) {
      console.error("Error creating financial assessment:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const toggleIncomeModal = () => {
    setIncomeModalOpen(!incomeModalOpen);
    if (incomeModalOpen) {
      setEditIncomeItem(null);
    }
  };

  const toggleExpenseModal = () => {
    setExpenseModalOpen(!expenseModalOpen);
    if (expenseModalOpen) {
      setEditExpenseItem(null);
    }
  };

  const handleAddIncome = () => {
    setEditIncomeItem(null);
    resetIncome({ Income_Type_ID: "", Amount: "", Description: "" });
    setIncomeModalOpen(true);
  };

  const handleEditIncome = (item) => {
    setEditIncomeItem(item);
    resetIncome({
      Income_Type_ID: item.income_type_id || "",
      Amount: item.amount || "",
      Description: item.description || "",
    });
    setIncomeModalOpen(true);
  };

  const handleAddExpense = () => {
    setEditExpenseItem(null);
    resetExpense({ Expense_Type_ID: "", Amount: "", Description: "" });
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (item) => {
    setEditExpenseItem(item);
    resetExpense({
      Expense_Type_ID: item.expense_type_id || "",
      Amount: item.amount || "",
      Description: item.description || "",
    });
    setExpenseModalOpen(true);
  };

  const onSubmitIncome = async (data) => {
    try {
      const currentUser = getHudasaUser();

      const payload = {
        financial_assessment_id: financialAssessment.id,
        income_type_id: data.Income_Type_ID ? parseInt(data.Income_Type_ID) : null,
        amount: data.Amount ? parseFloat(data.Amount) : 0,
        description: data.Description,
      };

      if (editIncomeItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/applicantIncome/${editIncomeItem.id}`, payload);
        showAlert("Income has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/applicantIncome`, payload);
        showAlert("Income has been added successfully", "success");
      }

      fetchIncomeExpense();
      onUpdate();
      toggleIncomeModal();
    } catch (error) {
      console.error("Error saving income:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const onSubmitExpense = async (data) => {
    try {
      const currentUser = getHudasaUser();

      const payload = {
        financial_assessment_id: financialAssessment.id,
        expense_type_id: data.Expense_Type_ID ? parseInt(data.Expense_Type_ID) : null,
        amount: data.Amount ? parseFloat(data.Amount) : 0,
        description: data.Description,
      };

      if (editExpenseItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/applicantExpense/${editExpenseItem.id}`, payload);
        showAlert("Expense has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/applicantExpense`, payload);
        showAlert("Expense has been added successfully", "success");
      }

      fetchIncomeExpense();
      onUpdate();
      toggleExpenseModal();
    } catch (error) {
      console.error("Error saving expense:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDeleteIncome = () => {
    if (!editIncomeItem) return;

    const incomeName = `${getLookupName(lookupData.incomeTypes, editIncomeItem.income_type)} - ${editIncomeItem.amount || 'Unknown Amount'}`;
    
    showDeleteConfirmation({
      id: editIncomeItem.id,
      name: incomeName,
      type: "income record",
      message: "This income record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/applicantIncome/${editIncomeItem.id}`);
      showAlert("Income has been deleted successfully", "success");
      fetchIncomeExpense();
      onUpdate();
      if (incomeModalOpen) {
        setIncomeModalOpen(false);
      }
    });
  };

  const handleDeleteExpense = () => {
    if (!editExpenseItem) return;

    const expenseName = `${getLookupName(lookupData.expenseTypes, editExpenseItem.expense_type)} - ${editExpenseItem.amount || 'Unknown Amount'}`;
    
    showDeleteConfirmation({
      id: editExpenseItem.id,
      name: expenseName,
      type: "expense record",
      message: "This expense record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/applicantExpense/${editExpenseItem.id}`);
      showAlert("Expense has been deleted successfully", "success");
      fetchIncomeExpense();
      onUpdate();
      if (expenseModalOpen) {
        setExpenseModalOpen(false);
      }
    });
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
  };

  if (!financialAssessment) {
    return (
      <div className="text-center my-5">
        <i className="bx bx-calculator display-1 text-muted"></i>
        <h5 className="mt-3 text-muted">No Financial Assessment Found</h5>
        <p className="text-muted">Create a financial assessment to track income and expenses.</p>
        <Button color="primary" onClick={createFinancialAssessment}>
          <i className="bx bx-plus me-1"></i> Create Financial Assessment
        </Button>
      </div>
    );
  }

  const totalIncome = parseFloat(financialAssessment.total_income) || 0;
  const totalExpenses = parseFloat(financialAssessment.total_expenses) || 0;
  const disposableIncome = parseFloat(financialAssessment.disposable_income) || 0;

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Finance</h5>
      </div>
    
      <Row>
        <Col lg={4}>
          <Card className="mini-stats-wid card-animate shadow-sm border-0">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium mb-2">Total Income</p>
                  <h4 className="mb-0 text-success">R {totalIncome.toFixed(2)}</h4>
                </div>
                <div className="flex-shrink-0 align-self-center">
                  <div className="avatar-sm rounded-circle bg-soft-success mini-stat-icon">
                    <span className="avatar-title rounded-circle bg-soft-success">
                      <i className="bx bx-trending-up font-size-24 text-success"></i>
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mini-stats-wid card-animate shadow-sm border-0">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium mb-2">Total Expenses</p>
                  <h4 className="mb-0 text-danger">R {totalExpenses.toFixed(2)}</h4>
                </div>
                <div className="flex-shrink-0 align-self-center">
                  <div className="avatar-sm rounded-circle bg-soft-danger mini-stat-icon">
                    <span className="avatar-title rounded-circle bg-soft-danger">
                      <i className="bx bx-trending-down font-size-24 text-danger"></i>
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mini-stats-wid card-animate shadow-sm border-0">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium mb-2">Disposable Income</p>
                  <h4 className={`mb-0 ${disposableIncome >= 0 ? "text-success" : "text-danger"}`}>
                    R {disposableIncome.toFixed(2)}
                  </h4>
                </div>
                <div className="flex-shrink-0 align-self-center">
                  <div
                    className={`avatar-sm rounded-circle ${
                      disposableIncome >= 0 ? "bg-soft-success" : "bg-soft-danger"
                    } mini-stat-icon`}
                  >
                    <span
                      className={`avatar-title rounded-circle ${
                        disposableIncome >= 0 ? "bg-soft-success" : "bg-soft-danger"
                      }`}
                    >
                      <i
                        className={`bx bx-wallet font-size-24 ${
                          disposableIncome >= 0 ? "text-success" : "text-danger"
                        }`}
                      ></i>
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className="shadow-sm border-0">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Income</h5>
                {!isOrgExecutive && (
                  <Button color="success" size="sm" onClick={handleAddIncome}>
                    <i className="bx bx-plus me-1"></i> Add Income
                  </Button>
                )}
              </div>

              <div className="table-responsive">
                <Table className="table table-bordered table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center text-muted">
                          No income items
                        </td>
                      </tr>
                    ) : (
                      incomes.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span
                              style={{ cursor: "pointer" }}
                              className="text-decoration-none"
                              onClick={() => handleEditIncome(item)}
                              onMouseOver={(e) => e.currentTarget.classList.add("text-primary", "text-decoration-underline")}
                              onMouseOut={(e) => e.currentTarget.classList.remove("text-primary", "text-decoration-underline")}
                            >
                              {getLookupName(lookupData.incomeTypes, item.income_type_id)}
                            </span>
                          </td>
                          <td>R {parseFloat(item.amount || 0).toFixed(2)}</td>
                          <td>{item.description || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm border-0">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Expenses</h5>
                {!isOrgExecutive && (
                  <Button color="danger" size="sm" onClick={handleAddExpense}>
                    <i className="bx bx-plus me-1"></i> Add Expense
                  </Button>
                )}
              </div>

              <div className="table-responsive">
                <Table className="table table-bordered table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center text-muted">
                          No expense items
                        </td>
                      </tr>
                    ) : (
                      expenses.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span
                              style={{ cursor: "pointer" }}
                              className="text-decoration-none"
                              onClick={() => handleEditExpense(item)}
                              onMouseOver={(e) => e.currentTarget.classList.add("text-primary", "text-decoration-underline")}
                              onMouseOut={(e) => e.currentTarget.classList.remove("text-primary", "text-decoration-underline")}
                            >
                              {getLookupName(lookupData.expenseTypes, item.expense_type_id)}
                            </span>
                          </td>
                          <td>R {parseFloat(item.amount || 0).toFixed(2)}</td>
                          <td>{item.description || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Income Modal */}
      <Modal isOpen={incomeModalOpen} toggle={toggleIncomeModal} centered backdrop="static">
        <ModalHeader toggle={toggleIncomeModal}>
          <i className={`bx ${editIncomeItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editIncomeItem ? "Edit" : "Add"} Income
        </ModalHeader>

        <Form onSubmit={handleIncomeSubmit(onSubmitIncome)}>
          <ModalBody>
            <FormGroup>
              <Label for="Income_Type_ID">
                Income Type <span className="text-danger">*</span>
              </Label>
              <Controller
                name="Income_Type_ID"
                control={incomeControl}
                rules={{ required: "Income type is required" }}
                render={({ field }) => (
                  <Input id="Income_Type_ID" type="select" invalid={!!incomeErrors.Income_Type_ID} disabled={isOrgExecutive} {...field}>
                    <option value="">Select Type</option>
                    {lookupData.incomeTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Input>
                )}
              />
              {incomeErrors.Income_Type_ID && <FormFeedback>{incomeErrors.Income_Type_ID.message}</FormFeedback>}
            </FormGroup>

            <FormGroup>
              <Label for="Amount">
                Amount (R) <span className="text-danger">*</span>
              </Label>
              <Controller
                name="Amount"
                control={incomeControl}
                rules={{ required: "Amount is required", min: { value: 0, message: "Amount must be positive" } }}
                render={({ field }) => (
                  <Input id="Amount" type="number" step="0.01" invalid={!!incomeErrors.Amount} disabled={isOrgExecutive} {...field} />
                )}
              />
              {incomeErrors.Amount && <FormFeedback>{incomeErrors.Amount.message}</FormFeedback>}
            </FormGroup>

            <FormGroup>
              <Label for="Description">Description</Label>
              <Controller
                name="Description"
                control={incomeControl}
                render={({ field }) => <Input id="Description" type="textarea" rows="3" disabled={isOrgExecutive} {...field} />}
              />
            </FormGroup>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editIncomeItem && !isOrgExecutive && (
                <Button color="danger" onClick={handleDeleteIncome} type="button" disabled={isIncomeSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button color="light" onClick={toggleIncomeModal} disabled={isIncomeSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              {!isOrgExecutive && (
                <Button color="success" type="submit" disabled={isIncomeSubmitting}>
                  {isIncomeSubmitting ? (
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

      {/* Expense Modal */}
      <Modal isOpen={expenseModalOpen} toggle={toggleExpenseModal} centered backdrop="static">
        <ModalHeader toggle={toggleExpenseModal}>
          <i className={`bx ${editExpenseItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editExpenseItem ? "Edit" : "Add"} Expense
        </ModalHeader>

        <Form onSubmit={handleExpenseSubmit(onSubmitExpense)}>
          <ModalBody>
            <FormGroup>
              <Label for="Expense_Type_ID">
                Expense Type <span className="text-danger">*</span>
              </Label>
              <Controller
                name="Expense_Type_ID"
                control={expenseControl}
                rules={{ required: "Expense type is required" }}
                render={({ field }) => (
                  <Input id="Expense_Type_ID" type="select" invalid={!!expenseErrors.Expense_Type_ID} disabled={isOrgExecutive} {...field}>
                    <option value="">Select Type</option>
                    {lookupData.expenseTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Input>
                )}
              />
              {expenseErrors.Expense_Type_ID && <FormFeedback>{expenseErrors.Expense_Type_ID.message}</FormFeedback>}
            </FormGroup>

            <FormGroup>
              <Label for="Amount">
                Amount (R) <span className="text-danger">*</span>
              </Label>
              <Controller
                name="Amount"
                control={expenseControl}
                rules={{ required: "Amount is required", min: { value: 0, message: "Amount must be positive" } }}
                render={({ field }) => (
                  <Input id="Amount" type="number" step="0.01" invalid={!!expenseErrors.Amount} disabled={isOrgExecutive} {...field} />
                )}
              />
              {expenseErrors.Amount && <FormFeedback>{expenseErrors.Amount.message}</FormFeedback>}
            </FormGroup>

            <FormGroup>
              <Label for="Description">Description</Label>
              <Controller
                name="Description"
                control={expenseControl}
                render={({ field }) => <Input id="Description" type="textarea" rows="3" disabled={isOrgExecutive} {...field} />}
              />
            </FormGroup>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editExpenseItem && !isOrgExecutive && (
                <Button color="danger" onClick={handleDeleteExpense} type="button" disabled={isExpenseSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button color="light" onClick={toggleExpenseModal} disabled={isExpenseSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              {!isOrgExecutive && (
                <Button color="success" type="submit" disabled={isExpenseSubmitting}>
                  {isExpenseSubmitting ? (
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
        title="Delete Record"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default FinancialAssessmentTab;

