import React, { useEffect, useState } from "react";
import {
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
  Button,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";

const defaultValues = {
  Assistance_Type: "",
  Financial_Amount: "",
  Date_of_Assistance: "",
  Assisted_By: "",
  Sector: "",
  Program: "",
  Project: "",
  Give_To: "",
};

const FinancialAssistanceModal = ({
  isOpen,
  toggle,
  lookupData = {},
  recipientOptions = [],
  isOrgExecutive,
  editItem,
  onSave,
  onDelete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
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
    } else {
      reset(defaultValues);
    }
  }, [isOpen, editItem, reset]);

  const handleSave = async (values) => {
    try {
      setIsSubmitting(true);
      const result = await onSave(values, editItem);
      if (result !== false) {
        toggle();
      }
    } catch (error) {
      // Error handling is managed in parent via showAlert
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static">
      <ModalHeader toggle={toggle}>
        <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
        {editItem ? "Edit" : "Add"} Financial Assistance
      </ModalHeader>

      <Form onSubmit={handleSubmit(handleSave)}>
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
                    <Input
                      id="Assistance_Type"
                      type="select"
                      invalid={!!errors.Assistance_Type}
                      disabled={isOrgExecutive}
                      {...field}
                    >
                      <option value="">Select Type</option>
                      {(lookupData?.assistanceTypes || []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Input>
                  )}
                />
                {errors.Assistance_Type && (
                  <FormFeedback>{errors.Assistance_Type.message}</FormFeedback>
                )}
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
                  rules={{
                    required: "Amount is required",
                    min: { value: 0, message: "Amount must be positive" },
                  }}
                  render={({ field }) => (
                    <Input
                      id="Financial_Amount"
                      type="number"
                      step="0.01"
                      invalid={!!errors.Financial_Amount}
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
                {errors.Financial_Amount && (
                  <FormFeedback>{errors.Financial_Amount.message}</FormFeedback>
                )}
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Date_of_Assistance">Date of Assistance</Label>
                <Controller
                  name="Date_of_Assistance"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="Date_of_Assistance"
                      type="date"
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
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
                    <Input
                      id="Assisted_By"
                      type="select"
                      disabled={isOrgExecutive}
                      {...field}
                    >
                      <option value="">Select Employee</option>
                      {(lookupData?.employees || []).map((emp) => (
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
                    const optionList = recipientOptions.some(
                      (option) => option.value === field.value
                    )
                      ? recipientOptions
                      : field.value
                      ? [
                          ...recipientOptions,
                          {
                            key: "existing-recipient",
                            value: field.value,
                            label: field.value,
                          },
                        ]
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
              <Button
                color="danger"
                onClick={onDelete}
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
              onClick={toggle}
              disabled={isSubmitting}
              className="me-2"
            >
              <i className="bx bx-x me-1"></i> Cancel
            </Button>
            {!isOrgExecutive && (
              <Button color="success" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
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
  );
};

export default FinancialAssistanceModal;

