import React from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";

const NewConversationModal = ({
  isOpen,
  toggle,
  employees,
  currentUser,
  onSubmit,
  showAlert,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      type: "Group",
      participants: [],
    },
  });

  const conversationType = watch("type");

  const handleFormSubmit = async (data) => {
    try {
      if (data.type === "Group" && (!data.participants || data.participants.length === 0)) {
        showAlert("Please select at least one participant for a group conversation", "warning");
        return;
      }

      const participantIds = data.participants ? data.participants.map(p => p.value) : [];
      
      await onSubmit({
        title: data.title,
        type: data.type,
        participants: participantIds,
      });

      reset();
    } catch (error) {
      console.error("Error creating conversation:", error);
      showAlert("Failed to create conversation", "danger");
    }
  };

  // Filter out current user from the employee list
  const employeeOptions = employees
    .filter(employee => employee.id != currentUser?.id) // Use loose equality to handle string/number mismatch
    .map(employee => ({
      value: employee.id,
      label: `${employee.name} ${employee.surname}`,
    }));

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" size="md">
      <ModalHeader toggle={toggle}>
        <i className="bx bx-plus-circle me-2"></i>
        New Conversation
      </ModalHeader>

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <ModalBody>
          <FormGroup>
            <Label for="title">
              Conversation Title <span className="text-danger">*</span>
            </Label>
            <Controller
              name="title"
              control={control}
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter conversation title"
                  invalid={!!errors.title}
                  {...field}
                />
              )}
            />
            {errors.title && <FormFeedback>{errors.title.message}</FormFeedback>}
          </FormGroup>

          <FormGroup>
            <Label for="type">
              Conversation Type <span className="text-danger">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Type is required" }}
              render={({ field }) => (
                <Input id="type" type="select" invalid={!!errors.type} {...field}>
                  <option value="Group">Group</option>
                  <option value="Direct">Direct</option>
                  <option value="Announcement">Announcement</option>
                </Input>
              )}
            />
            {errors.type && <FormFeedback>{errors.type.message}</FormFeedback>}
            <small className="text-muted">
              {conversationType === "Group" && "Group chat with multiple participants"}
              {conversationType === "Direct" && "One-on-one conversation"}
              {conversationType === "Announcement" && "Broadcast messages to all"}
            </small>
          </FormGroup>

          {conversationType === "Group" && (
            <FormGroup>
              <Label for="participants">
                Participants <span className="text-danger">*</span>
              </Label>
              <Controller
                name="participants"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti
                    options={employeeOptions}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select participants..."
                  />
                )}
              />
              <small className="text-muted">
                Select employees to add to this conversation
              </small>
            </FormGroup>
          )}

          {conversationType === "Direct" && (
            <FormGroup>
              <Label for="participants">
                Select Participant <span className="text-danger">*</span>
              </Label>
              <Controller
                name="participants"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti
                    options={employeeOptions}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select one person..."
                  />
                )}
              />
              <small className="text-muted">
                Select one person for direct messaging
              </small>
            </FormGroup>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            color="light"
            onClick={() => {
              reset();
              toggle();
            }}
            disabled={isSubmitting}
          >
            <i className="bx bx-x me-1"></i>
            Cancel
          </Button>
          <Button color="success" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Creating...
              </>
            ) : (
              <>
                <i className="bx bx-check me-1"></i>
                Create Conversation
              </>
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default NewConversationModal;

