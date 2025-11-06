import { useEffect, useMemo, useState } from "react";
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
  Badge,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";

const expectationOptions = [
  "We hope our child will learn about Islam and eventually embrace the faith",
  "We are interested in moral and character development (Akhlaq)",
  "We are primarily interested in the welfare and material benefits provided",
  "We want our child to be safe after school and be part of a safe community",
  "We are grateful for the support and meals provided",
  "Other (please specify)"
];

const priorDurationOptions = [
  "Less than 1 month (new enrolment)",
  "1–3 months",
  "4–6 months",
  "7–12 months",
  "2 years",
  "3 years",
  "4 years",
  "5 years",
  "6 years",
  "7 years",
  "8 years",
  "9 years",
  "10 years",
  "11 years",
  "12 years",
  "More than 12 years",
  "Not sure / irregular attendance"
];

const futureEngagementOptions = [
  "Until they understand basic Islamic values and teachings",
  "Until they are ready to embrace Islam, Insha’Allah",
  "Until they complete the full Madressa curriculum",
  "As long as they continue to benefit morally and socially",
  "As long as welfare and support services are available",
  "For a fixed period (e.g. until they are in school, 6 months – 1 year)",
  "Undecided"
];

const attendanceFrequencyOptions = [
  "1 day per week",
  "2 days per week",
  "3 days per week",
  "4 days per week",
  "5 days per week",
  "6 days per week",
  "7 days per week",
  "Flexible / Varies weekly",
  "Only weekends (Saturday & Sunday)",
  "Only weekdays (Monday to Friday)",
  "Not sure / irregular attendance",
  "Other (please specify)"
];

const commitmentOptions = [
  "Fully Committed – I will ensure my child attends regularly and arrives on time without fail.",
  "Mostly Committed – I will do my best to ensure regular attendance and punctuality, with occasional challenges.",
  "Somewhat Committed – I may face difficulties ensuring consistent attendance or punctuality.",
  "Not Committed – I cannot guarantee regular attendance or punctuality at this time."
];

const policySupportOptions = [
  "Fully Willing – I support all policies and rules and will reinforce them at home.",
  "Willing with Conditions – I generally support the policies but have specific concerns.",
  "Unsure – I need more clarity before committing to support.",
  "Not Willing – I do not agree with the current policies and rules."
];

const communicationOptions = [
  "WhatsApp Message",
  "Email Report",
  "Phone Call",
  "In-person Meeting",
  "Printed Report sent via child",
  "Online Portal or App",
  "No updates needed",
  "Other (please specify)"
];

const engagementOptions = [
  "Yes, I’m willing to attend and participate",
  "Yes, but only occasionally",
  "No, I’m unable to attend",
  "Unsure at this time"
];

const contributionOptions = [
  "Volunteering time or skills",
  "Donating physical resources (books, stationery, etc.)",
  "Financial support or sponsorship",
  "Offering professional expertise (e.g. teaching, counselling)",
  "Helping with facility maintenance or upgrades",
  "Promoting Madressa initiatives in the community",
  "Not able to contribute at this time",
  "Other (please specify)"
];

const medicalConsentOptions = [
  "Yes, I authorise emergency medical treatment",
  "Yes, but only basic first aid until I am contacted",
  "Yes, but only after verbal consent via phone",
  "No, I do not authorise any medical treatment"
];

const mediaConsentOptions = [
  "Yes, I consent to photos and videos for all promotional use",
  "Yes, but only group photos (no individual close-ups)",
  "Yes, but only for internal newsletters or donor reports",
  "Yes, but exclude social media platforms",
  "No, I do not consent to any media use"
];

const policyComplianceOptions = [
  "Yes, I fully agree to comply with all policies and procedures",
  "Yes, but I would like clarification on certain policies",
  "Yes, pending review of the full policy document",
  "No, I do not agree with certain policies"
];

const contributionAmountOptions = [
  "R200 – Full contribution",
  "R150 – Partial contribution",
  "R100 – Partial contribution",
  "R50 – Token contribution",
  "Unable to contribute at this time",
  "Other amount (please specify)"
];

const halalPreferenceOptions = [
  "Yes, strictly Halal only",
  "Yes, Halal preferred but flexible if not available",
  "No, child does not follow Halal dietary guidelines",
  "Unsure / Prefer to discuss further"
];

const worshipOptions = [
  "Only attends Islamic places of worship (Masjid, Madressa)",
  "Attends Islamic and other religious places (e.g. Christian church, Shembe Church/ Ancestor events etc)",
  "Primarily attends non-Islamic places of worship",
  "Attends religious events occasionally, not regularly",
  "Does not attend any place of worship"
];

const fastingOptions = [
  "Yes, we fully support our child observing Islamic practices including fasting",
  "Yes, if the child chooses to fast and is physically able",
  "Yes, but only partial fasting or symbolic participation",
  "No, we do not permit fasting or religious observance",
  "Undecided / Prefer to discuss further"
];

const nameChangeOptions = [
  "We fully support the name change and will use the Muslim name at home and in public",
  "We support the name change but will continue using the birth name in some settings",
  "We are open to the idea but would prefer to understand the significance first",
  "We do not support changing the child’s name for religious reasons"
];

const burialOptions = [
  "Yes, we fully consent to an Islamic burial in accordance with Shariah",
  "Yes, if the child has embraced Islam before passing",
  "We are open to discussing this further with the Madressa",
  "No, we prefer burial according to our family’s religious tradition"
];

const parentInterestOptions = [
  "Yes, I’m actively seeking knowledge and spiritual growth",
  "Yes, I’m curious and would like to learn more",
  "I’m open to learning if resources or sessions are available",
  "I support my child’s learning but am not personally interested",
  "No, I do not have interest at this time",
  "Prefer not to answer"
];

const renderFlagBadge = (flagLevel) => {
  if (!flagLevel) return <Badge color="secondary">Unknown</Badge>;
  const normalized = flagLevel.toLowerCase();
  if (normalized === "green") return <Badge color="success">Green</Badge>;
  if (normalized === "amber") return <Badge color="warning">Amber</Badge>;
  return <Badge color="danger">Red</Badge>;
};

const MultiSelectDropdown = ({
  options = [],
  value = [],
  onChange,
  onBlur,
  disabled,
  placeholder,
  invalid
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (option) => {
    const exists = value.includes(option);
    const nextValue = exists
      ? value.filter((item) => item !== option)
      : [...value, option];
    onChange(nextValue);
  };

  const label =
    value.length === 0
      ? placeholder || "Select options"
      : value.length === 1
      ? value[0]
      : `${value.length} selected`;

  return (
    <Dropdown isOpen={isOpen} toggle={toggle} className="w-100">
      <DropdownToggle
        caret
        color={invalid ? "danger" : "outline-secondary"}
        className={`w-100 text-start ${invalid ? "bg-danger bg-opacity-10" : ""}`}
        onBlur={onBlur}
      >
        {label}
      </DropdownToggle>
      <DropdownMenu className="w-100" style={{ maxHeight: "260px", overflowY: "auto" }}>
        {options.map((option) => {
          const checked = value.includes(option);
          return (
            <DropdownItem
              key={option}
              toggle={false}
              className="d-flex align-items-center"
              onClick={() => handleSelect(option)}
            >
              <Input
                type="checkbox"
                className="me-2"
                checked={checked}
                onChange={() => handleSelect(option)}
                disabled={disabled}
              />
              <span className="flex-grow-1">{option}</span>
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
};

const ParentQuestionnaireTab = ({
  application,
  questionnaires,
  onUpdate,
  showAlert
}) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

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
    watch
  } = useForm({
    defaultValues: {
      expectations: [],
      expectations_other: "",
      prior_duration: "",
      future_engagement: "",
      attendance_frequency: "",
      attendance_frequency_other: "",
      commitment_level: "",
      policy_support: "",
      communication_channel: "",
      communication_channel_other: "",
      engagement_level: "",
      contribution_type: "",
      contribution_other: "",
      medical_consent: "",
      media_consent: "",
      policy_compliance: "",
      monthly_contribution: "",
      monthly_contribution_other: "",
      halal_preference: "",
      worship_attendance: "",
      fasting_support: "",
      name_change_support: "",
      burial_consent: "",
      parent_interest: ""
    }
  });

  const watchExpectations = watch("expectations") || [];
  const watchAttendanceFrequency = watch("attendance_frequency") || "";
  const watchCommunicationChannel = watch("communication_channel") || "";
  const watchContributionType = watch("contribution_type") || "";
  const watchMonthlyContribution = watch("monthly_contribution") || "";

  useEffect(() => {
    if (editItem && modalOpen) {
      reset({
        expectations: Array.isArray(editItem.expectations)
          ? editItem.expectations
          : [],
        expectations_other: editItem.expectations_other || "",
        prior_duration: editItem.prior_duration || "",
        future_engagement: editItem.future_engagement || "",
        attendance_frequency: editItem.attendance_frequency || "",
        attendance_frequency_other: editItem.attendance_frequency_other || "",
        commitment_level: editItem.commitment_level || "",
        policy_support: editItem.policy_support || "",
        communication_channel: editItem.communication_channel || "",
        communication_channel_other: editItem.communication_channel_other || "",
        engagement_level: editItem.engagement_level || "",
        contribution_type: editItem.contribution_type || "",
        contribution_other: editItem.contribution_other || "",
        medical_consent: editItem.medical_consent || "",
        media_consent: editItem.media_consent || "",
        policy_compliance: editItem.policy_compliance || "",
        monthly_contribution: editItem.monthly_contribution || "",
        monthly_contribution_other: editItem.monthly_contribution_other || "",
        halal_preference: editItem.halal_preference || "",
        worship_attendance: editItem.worship_attendance || "",
        fasting_support: editItem.fasting_support || "",
        name_change_support: editItem.name_change_support || "",
        burial_consent: editItem.burial_consent || "",
        parent_interest: editItem.parent_interest || ""
      });
    } else if (modalOpen) {
      reset();
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen((prev) => !prev);
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

  const formatExpectations = (values = []) =>
    values && values.length ? values.join(", ") : "-";

  const onSubmit = async (formValues) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      const formData = {
        madressah_app_id: application.id,
        expectations: formValues.expectations || [],
        expectations_other: formValues.expectations_other?.trim() || "",
        prior_duration: formValues.prior_duration || "",
        future_engagement: formValues.future_engagement || "",
        attendance_frequency: formValues.attendance_frequency || "",
        attendance_frequency_other:
          formValues.attendance_frequency_other?.trim() || "",
        commitment_level: formValues.commitment_level || "",
        policy_support: formValues.policy_support || "",
        communication_channel: formValues.communication_channel || "",
        communication_channel_other:
          formValues.communication_channel_other?.trim() || "",
        engagement_level: formValues.engagement_level || "",
        contribution_type: formValues.contribution_type || "",
        contribution_other: formValues.contribution_other?.trim() || "",
        medical_consent: formValues.medical_consent || "",
        media_consent: formValues.media_consent || "",
        policy_compliance: formValues.policy_compliance || "",
        monthly_contribution: formValues.monthly_contribution || "",
        monthly_contribution_other:
          formValues.monthly_contribution_other?.trim() || "",
        halal_preference: formValues.halal_preference || "",
        worship_attendance: formValues.worship_attendance || "",
        fasting_support: formValues.fasting_support || "",
        name_change_support: formValues.name_change_support || "",
        burial_consent: formValues.burial_consent || "",
        parent_interest: formValues.parent_interest || ""
      };

      if (editItem) {
        formData.updated_by = currentUser?.username || "system";
        await axiosApi.put(
          `${API_BASE_URL}/parent-questionnaire/${editItem.id}`,
          formData
        );
        showAlert("Parent questionnaire updated successfully", "success");
      } else {
        formData.created_by = currentUser?.username || "system";
        await axiosApi.post(`${API_BASE_URL}/parent-questionnaire`, formData);
        showAlert("Parent questionnaire created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving parent questionnaire:", error);
      showAlert(
        error?.response?.data?.error || "Failed to save parent questionnaire",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    showDeleteConfirmation(
      {
        id: editItem.id,
        name: `Questionnaire #${editItem.id}`,
        type: "Parent Questionnaire",
        message: "This parent questionnaire will be permanently removed."
      },
      async () => {
        try {
          await axiosApi.delete(
            `${API_BASE_URL}/parent-questionnaire/${editItem.id}`
          );
          showAlert("Parent questionnaire deleted successfully", "success");
          onUpdate();
          if (modalOpen) {
            setModalOpen(false);
          }
        } catch (error) {
          console.error("Error deleting parent questionnaire:", error);
          showAlert(
            error?.response?.data?.error || "Failed to delete questionnaire",
            "danger"
          );
          throw error;
        }
      }
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "expectations",
        header: "Expectations",
        accessorKey: "expectations",
        enableSorting: false,
        cell: (cell) => (
          <span
            role="button"
            className="text-decoration-underline text-primary"
            onClick={() => handleEdit(cell.row.original)}
          >
            {formatExpectations(cell.getValue())}
          </span>
        )
      },
      {
        id: "attendance_frequency",
        header: "Attendance Intent",
        accessorKey: "attendance_frequency",
        enableSorting: true,
        cell: (cell) => cell.getValue() || "-"
      },
      {
        id: "commitment_score",
        header: "Commitment Score",
        accessorKey: "commitment_score",
        enableSorting: true,
        cell: (cell) => cell.getValue() ?? "-"
      },
      {
        id: "flag_level",
        header: "Flag Level",
        accessorKey: "flag_level",
        enableSorting: true,
        cell: (cell) => renderFlagBadge(cell.getValue())
      },
      {
        id: "created_at",
        header: "Updated",
        accessorKey: "updated_at",
        enableSorting: true,
        cell: (cell) => {
          const value = cell.getValue() || cell.row.original.created_at;
          return value ? new Date(value).toLocaleString() : "-";
        }
      }
    ],
    []
  );

  const expectationsRequireOther =
    Array.isArray(watchExpectations) &&
    watchExpectations.some((value) => value?.includes("Other"));

  const attendanceNeedsOther = watchAttendanceFrequency.includes("Other");

  const communicationNeedsOther = watchCommunicationChannel.includes("Other");

  const contributionNeedsOther = watchContributionType.includes("Other");

  const monthlyContributionNeedsOther =
    watchMonthlyContribution.includes("Other");

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Parent Questionnaire</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1" /> Add Questionnaire
          </Button>
        )}
      </div>

      {questionnaires && questionnaires.length > 0 ? (
        <TableContainer
          columns={columns}
          data={questionnaires}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      ) : (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No questionnaire responses captured yet. Click "Add Questionnaire" to
          record parent input.
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        toggle={toggleModal}
        centered
        size="xl"
        backdrop="static"
      >
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`} />
          {editItem ? "Edit Parent Questionnaire" : "Add Parent Questionnaire"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="expectations">
                    1. What are your expectations from the Madressa program?
                  </Label>
                  <Controller
                    name="expectations"
                    control={control}
                    rules={{
                      validate: (value) =>
                        value && value.length > 0
                          ? true
                          : "Select at least one expectation"
                    }}
                    render={({ field }) => (
                      <MultiSelectDropdown
                        options={expectationOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isOrgExecutive}
                        placeholder="Select expectations"
                        invalid={!!errors.expectations}
                      />
                    )}
                  />
                  {errors.expectations && (
                    <div className="invalid-feedback d-block">
                      {errors.expectations.message}
                    </div>
                  )}
                </FormGroup>
              </Col>

              {expectationsRequireOther && (
                <Col md={12}>
                  <FormGroup>
                    <Label for="expectations_other">Other (please specify)</Label>
                    <Controller
                      name="expectations_other"
                      control={control}
                      rules={{
                        validate: (value) =>
                          expectationsRequireOther
                            ? value?.trim()
                              ? true
                              : "Provide details when selecting Other"
                            : true
                      }}
                      render={({ field }) => (
                        <Input
                          id="expectations_other"
                          type="text"
                          placeholder="Describe other expectations"
                          disabled={isOrgExecutive}
                          invalid={!!errors.expectations_other}
                          {...field}
                        />
                      )}
                    />
                    <FormFeedback>
                      {errors.expectations_other?.message}
                    </FormFeedback>
                  </FormGroup>
                </Col>
              )}

              <Col md={6}>
                <FormGroup>
                  <Label for="prior_duration">
                    2. How long has your child been to Madressa?
                  </Label>
                  <Controller
                    name="prior_duration"
                    control={control}
                    rules={{ required: "Please select a duration" }}
                    render={({ field }) => (
                      <Input
                        id="prior_duration"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.prior_duration}
                        {...field}
                      >
                        <option value="">Select duration</option>
                        {priorDurationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.prior_duration?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="future_engagement">
                    3. For how long would you like your child to attend Madressa?
                  </Label>
                  <Controller
                    name="future_engagement"
                    control={control}
                    rules={{ required: "Please select an option" }}
                    render={({ field }) => (
                      <Input
                        id="future_engagement"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.future_engagement}
                        {...field}
                      >
                        <option value="">Select preferred duration</option>
                        {futureEngagementOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>
                    {errors.future_engagement?.message}
                  </FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="attendance_frequency">
                    4. How many days a week can your child attend Madressa?
                  </Label>
                  <Controller
                    name="attendance_frequency"
                    control={control}
                    rules={{ required: "Please select attendance frequency" }}
                    render={({ field }) => (
                      <Input
                        id="attendance_frequency"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.attendance_frequency}
                        {...field}
                      >
                        <option value="">Select frequency</option>
                        {attendanceFrequencyOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>
                    {errors.attendance_frequency?.message}
                  </FormFeedback>
                </FormGroup>
              </Col>

              {attendanceNeedsOther && (
                <Col md={6}>
                  <FormGroup>
                    <Label for="attendance_frequency_other">
                      Please specify attendance intent
                    </Label>
                    <Controller
                      name="attendance_frequency_other"
                      control={control}
                      rules={{
                        validate: (value) =>
                          attendanceNeedsOther
                            ? value?.trim()
                              ? true
                              : "Provide attendance details"
                            : true
                      }}
                      render={({ field }) => (
                        <Input
                          id="attendance_frequency_other"
                          type="text"
                          placeholder="Describe attendance frequency"
                          disabled={isOrgExecutive}
                          invalid={!!errors.attendance_frequency_other}
                          {...field}
                        />
                      )}
                    />
                    <FormFeedback>
                      {errors.attendance_frequency_other?.message}
                    </FormFeedback>
                  </FormGroup>
                </Col>
              )}

              <Col md={6}>
                <FormGroup>
                  <Label for="commitment_level">
                    5. What is your commitment to ensuring attendance and punctuality?
                  </Label>
                  <Controller
                    name="commitment_level"
                    control={control}
                    rules={{ required: "Please select commitment level" }}
                    render={({ field }) => (
                      <Input
                        id="commitment_level"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.commitment_level}
                        {...field}
                      >
                        <option value="">Select commitment</option>
                        {commitmentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.commitment_level?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="policy_support">
                    6. Are you willing to support the Madressa's policies and rules?
                  </Label>
                  <Controller
                    name="policy_support"
                    control={control}
                    rules={{ required: "Please select an option" }}
                    render={({ field }) => (
                      <Input
                        id="policy_support"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.policy_support}
                        {...field}
                      >
                        <option value="">Select willingness level</option>
                        {policySupportOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.policy_support?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="communication_channel">
                    7. How would you like to receive updates on your child's progress?
                  </Label>
                  <Controller
                    name="communication_channel"
                    control={control}
                    rules={{ required: "Select a communication channel" }}
                    render={({ field }) => (
                      <Input
                        id="communication_channel"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.communication_channel}
                        {...field}
                      >
                        <option value="">Select channel</option>
                        {communicationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>
                    {errors.communication_channel?.message}
                  </FormFeedback>
                </FormGroup>
              </Col>

              {communicationNeedsOther && (
                <Col md={6}>
                  <FormGroup>
                    <Label for="communication_channel_other">
                      Preferred communication details
                    </Label>
                    <Controller
                      name="communication_channel_other"
                      control={control}
                      rules={{
                        validate: (value) =>
                          communicationNeedsOther
                            ? value?.trim()
                              ? true
                              : "Provide communication details"
                            : true
                      }}
                      render={({ field }) => (
                        <Input
                          id="communication_channel_other"
                          type="text"
                          placeholder="Specify preferred channel"
                          disabled={isOrgExecutive}
                          invalid={!!errors.communication_channel_other}
                          {...field}
                        />
                      )}
                    />
                    <FormFeedback>
                      {errors.communication_channel_other?.message}
                    </FormFeedback>
                  </FormGroup>
                </Col>
              )}

              <Col md={6}>
                <FormGroup>
                  <Label for="engagement_level">
                    8. Are you willing to attend parent-teacher meetings?
                  </Label>
                  <Controller
                    name="engagement_level"
                    control={control}
                    rules={{ required: "Please select an option" }}
                    render={({ field }) => (
                      <Input
                        id="engagement_level"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.engagement_level}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {engagementOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.engagement_level?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="contribution_type">
                    9. How can you contribute to the Madressa community?
                  </Label>
                  <Controller
                    name="contribution_type"
                    control={control}
                    rules={{ required: "Select a contribution option" }}
                    render={({ field }) => (
                      <Input
                        id="contribution_type"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.contribution_type}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {contributionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>
                    {errors.contribution_type?.message}
                  </FormFeedback>
                </FormGroup>
              </Col>

              {contributionNeedsOther && (
                <Col md={6}>
                  <FormGroup>
                    <Label for="contribution_other">
                      Contribution details
                    </Label>
                    <Controller
                      name="contribution_other"
                      control={control}
                      rules={{
                        validate: (value) =>
                          contributionNeedsOther
                            ? value?.trim()
                              ? true
                              : "Describe your contribution"
                            : true
                      }}
                      render={({ field }) => (
                        <Input
                          id="contribution_other"
                          type="text"
                          placeholder="Describe how you can contribute"
                          disabled={isOrgExecutive}
                          invalid={!!errors.contribution_other}
                          {...field}
                        />
                      )}
                    />
                    <FormFeedback>
                      {errors.contribution_other?.message}
                    </FormFeedback>
                  </FormGroup>
                </Col>
              )}

              <Col md={6}>
                <FormGroup>
                  <Label for="medical_consent">
                    10. Do you authorise emergency medical treatment?
                  </Label>
                  <Controller
                    name="medical_consent"
                    control={control}
                    rules={{ required: "Select medical consent preference" }}
                    render={({ field }) => (
                      <Input
                        id="medical_consent"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.medical_consent}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {medicalConsentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.medical_consent?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="media_consent">
                    11. Do you consent to photographs or videos for promotional purposes?
                  </Label>
                  <Controller
                    name="media_consent"
                    control={control}
                    rules={{ required: "Select media consent preference" }}
                    render={({ field }) => (
                      <Input
                        id="media_consent"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.media_consent}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {mediaConsentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.media_consent?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="policy_compliance">
                    12. Are you willing to comply with Madressa policies?
                  </Label>
                  <Controller
                    name="policy_compliance"
                    control={control}
                    rules={{ required: "Select policy compliance preference" }}
                    render={({ field }) => (
                      <Input
                        id="policy_compliance"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.policy_compliance}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {policyComplianceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.policy_compliance?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="monthly_contribution">
                    13. Monthly contribution preference
                  </Label>
                  <Controller
                    name="monthly_contribution"
                    control={control}
                    rules={{ required: "Select contribution amount" }}
                    render={({ field }) => (
                      <Input
                        id="monthly_contribution"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.monthly_contribution}
                        {...field}
                      >
                        <option value="">Select amount</option>
                        {contributionAmountOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>
                    {errors.monthly_contribution?.message}
                  </FormFeedback>
                </FormGroup>
              </Col>

              {monthlyContributionNeedsOther && (
                <Col md={6}>
                  <FormGroup>
                    <Label for="monthly_contribution_other">
                      Contribution details
                    </Label>
                    <Controller
                      name="monthly_contribution_other"
                      control={control}
                      rules={{
                        validate: (value) =>
                          monthlyContributionNeedsOther
                            ? value?.trim()
                              ? true
                              : "Provide contribution amount"
                            : true
                      }}
                      render={({ field }) => (
                        <Input
                          id="monthly_contribution_other"
                          type="text"
                          placeholder="Specify amount"
                          disabled={isOrgExecutive}
                          invalid={!!errors.monthly_contribution_other}
                          {...field}
                        />
                      )}
                    />
                    <FormFeedback>
                      {errors.monthly_contribution_other?.message}
                    </FormFeedback>
                  </FormGroup>
                </Col>
              )}

              <Col md={6}>
                <FormGroup>
                  <Label for="halal_preference">
                    14. Does your child eat Halal food?
                  </Label>
                  <Controller
                    name="halal_preference"
                    control={control}
                    rules={{ required: "Select dietary preference" }}
                    render={({ field }) => (
                      <Input
                        id="halal_preference"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.halal_preference}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {halalPreferenceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.halal_preference?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="worship_attendance">
                    15. Does your child attend any place of worship or religious event?
                  </Label>
                  <Controller
                    name="worship_attendance"
                    control={control}
                    rules={{ required: "Select attendance preference" }}
                    render={({ field }) => (
                      <Input
                        id="worship_attendance"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.worship_attendance}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {worshipOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>
                    {errors.worship_attendance?.message}
                  </FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="fasting_support">
                    16. Will you allow your child to observe Islamic practices like fasting?
                  </Label>
                  <Controller
                    name="fasting_support"
                    control={control}
                    rules={{ required: "Select fasting preference" }}
                    render={({ field }) => (
                      <Input
                        id="fasting_support"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.fasting_support}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {fastingOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.fasting_support?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="name_change_support">
                    17. If your child wants to adopt a Muslim name, how will you respond?
                  </Label>
                  <Controller
                    name="name_change_support"
                    control={control}
                    rules={{ required: "Select name change preference" }}
                    render={({ field }) => (
                      <Input
                        id="name_change_support"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.name_change_support}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {nameChangeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>
                    {errors.name_change_support?.message}
                  </FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="burial_consent">
                    18. Will you consent to an Islamic burial for your child?
                  </Label>
                  <Controller
                    name="burial_consent"
                    control={control}
                    rules={{ required: "Select burial consent preference" }}
                    render={({ field }) => (
                      <Input
                        id="burial_consent"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.burial_consent}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {burialOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.burial_consent?.message}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="parent_interest">
                    19. Do you have any interest in learning about Islam?
                  </Label>
                  <Controller
                    name="parent_interest"
                    control={control}
                    rules={{ required: "Select parent interest option" }}
                    render={({ field }) => (
                      <Input
                        id="parent_interest"
                        type="select"
                        disabled={isOrgExecutive}
                        invalid={!!errors.parent_interest}
                        {...field}
                      >
                        <option value="">Select option</option>
                        {parentInterestOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  <FormFeedback>{errors.parent_interest?.message}</FormFeedback>
                </FormGroup>
              </Col>

              {Array.isArray(editItem?.inconsistency_flags) &&
                editItem.inconsistency_flags.length > 0 && (
                  <Col md={12}>
                    <div className="alert alert-warning">
                      <h6 className="mb-2">
                        <i className="bx bx-error me-2" />
                        Inconsistency Flags
                      </h6>
                      <ul className="mb-0 ps-3">
                        {editItem.inconsistency_flags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  </Col>
                )}
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
                  <i className="bx bx-trash me-1" />
                  Delete
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
                <i className="bx bx-x me-1" />
                Cancel
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
                      <i className="bx bx-save me-1" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Parent Questionnaire"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default ParentQuestionnaireTab;

