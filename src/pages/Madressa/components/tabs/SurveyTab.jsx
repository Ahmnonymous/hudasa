import React, { useState, useEffect, useMemo } from "react";
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
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getAuditName } from "../../../../helpers/userStorage";

const SurveyTab = ({ application, surveys, onUpdate, showAlert, lookupData = {} }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete,
  } = useDeleteConfirmation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  // Question options
  const questionOptions = {
    question1: [
      { value: "We are grateful for the support and meals provided", label: "We are grateful for the support and meals provided" },
      { value: "We are interested in moral and character development (Akhlaq)", label: "We are interested in moral and character development (Akhlaq)" },
      { value: "We are primarily interested in the welfare and material benefits provided", label: "We are primarily interested in the welfare and material benefits provided" },
      { value: "We hope our child will learn about Islam and eventually embrace the faith", label: "We hope our child will learn about Islam and eventually embrace the faith" },
      { value: "We want our child to be safe after school and be part of a safe community", label: "We want our child to be safe after school and be part of a safe community" },
    ],
    question2: [
      { value: "1-4 Years", label: "1-4 Years" },
      { value: "1-3 months", label: "1-3 months" },
      { value: "4-7 Years", label: "4-7 Years" },
      { value: "4-6 months", label: "4-6 months" },
      { value: "7-11 Years", label: "7-11 Years" },
      { value: "7-12 months", label: "7-12 months" },
      { value: "Less than 1 month (new enrolment)", label: "Less than 1 month (new enrolment)" },
      { value: "More than 11 years", label: "More than 11 years" },
      { value: "Not sure / irregular attendance", label: "Not sure / irregular attendance" },
    ],
    question3: [
      { value: "As long as they continue to benefit morally and socially", label: "As long as they continue to benefit morally and socially" },
      { value: "As long as welfare and support services are available", label: "As long as welfare and support services are available" },
      { value: "For a fixed period (e.g. until they are in school, 6 months - 1 year)", label: "For a fixed period (e.g. until they are in school, 6 months - 1 year)" },
      { value: "Undecided", label: "Undecided" },
      { value: "Until they are ready to embrace Islam, Insha'Allah", label: "Until they are ready to embrace Islam, Insha'Allah" },
      { value: "Until they complete the full Madressa curriculum", label: "Until they complete the full Madressa curriculum" },
      { value: "Until they understand basic Islamic values and teachings", label: "Until they understand basic Islamic values and teachings" },
    ],
    question4: [
      { value: "1 day per week", label: "1 day per week" },
      { value: "2 days per week", label: "2 days per week" },
      { value: "3 days per week", label: "3 days per week" },
      { value: "4 days per week", label: "4 days per week" },
      { value: "5 days per week", label: "5 days per week" },
      { value: "6 days per week", label: "6 days per week" },
      { value: "7 days per week", label: "7 days per week" },
      { value: "Flexible / Varies weekly", label: "Flexible / Varies weekly" },
      { value: "Only weekdays (Monday to Friday)", label: "Only weekdays (Monday to Friday)" },
      { value: "Only weekends (Saturday & Sunday)", label: "Only weekends (Saturday & Sunday)" },
    ],
    question5: [
      { value: "Fully Committed - I will ensure my child attends regularly and arrives on time without fail.", label: "Fully Committed - I will ensure my child attends regularly and arrives on time without fail." },
      { value: "Mostly Committed - I will do my best to ensure regular attendance and punctuality, with occasional challenges.", label: "Mostly Committed - I will do my best to ensure regular attendance and punctuality, with occasional challenges." },
      { value: "Not Committed - I cannot guarantee regular attendance or punctuality at this time.", label: "Not Committed - I cannot guarantee regular attendance or punctuality at this time." },
      { value: "Somewhat Committed - I may face difficulties ensuring consistent attendance or punctuality.", label: "Somewhat Committed - I may face difficulties ensuring consistent attendance or punctuality." },
    ],
    question6: [
      { value: "Fully Willing - I support all policies and rules and will reinforce them at home.", label: "Fully Willing - I support all policies and rules and will reinforce them at home." },
      { value: "Not Willing - I do not agree with the current policies and rules.", label: "Not Willing - I do not agree with the current policies and rules." },
      { value: "Unsure - I need more clarity before committing to support.", label: "Unsure - I need more clarity before committing to support." },
      { value: "Willing with Conditions - I generally support the policies but have specific concerns.", label: "Willing with Conditions - I generally support the policies but have specific concerns." },
    ],
    question7: [
      { value: "Email Report", label: "Email Report" },
      { value: "In-person Meeting", label: "In-person Meeting" },
      { value: "No updates needed", label: "No updates needed" },
      { value: "Online Portal or App", label: "Online Portal or App" },
      { value: "Phone Call", label: "Phone Call" },
      { value: "Printed Report sent via child", label: "Printed Report sent via child" },
      { value: "WhatsApp Message", label: "WhatsApp Message" },
    ],
    question8: [
      { value: "No, I'm unable to attend", label: "No, I'm unable to attend" },
      { value: "Unsure at this time", label: "Unsure at this time" },
      { value: "Yes, I'm willing to attend and participate", label: "Yes, I'm willing to attend and participate" },
      { value: "Yes, but only occasionally", label: "Yes, but only occasionally" },
    ],
    question9: [
      { value: "Donating physical resources (books, stationery, etc.)", label: "Donating physical resources (books, stationery, etc.)" },
      { value: "Financial support or sponsorship", label: "Financial support or sponsorship" },
      { value: "Helping with facility maintenance or upgrades", label: "Helping with facility maintenance or upgrades" },
      { value: "Not able to contribute at this time", label: "Not able to contribute at this time" },
      { value: "Offering professional expertise (e.g. teaching, counselling)", label: "Offering professional expertise (e.g. teaching, counselling)" },
      { value: "Promoting Madressa initiatives in the community", label: "Promoting Madressa initiatives in the community" },
      { value: "Volunteering time or skills", label: "Volunteering time or skills" },
    ],
    question10: [
      { value: "No, I do not authorise any medical treatment", label: "No, I do not authorise any medical treatment" },
      { value: "Yes, l authorise emergency medical treatment", label: "Yes, l authorise emergency medical treatment" },
      { value: "Yes, but only after verbal consent via phone", label: "Yes, but only after verbal consent via phone" },
      { value: "Yes, but only basic first aid until I am contacted", label: "Yes, but only basic first aid until I am contacted" },
    ],
    question11: [
      { value: "No, I do not consent to any media use", label: "No, I do not consent to any media use" },
      { value: "Yes, I consent to photos and videos for all promotional use", label: "Yes, I consent to photos and videos for all promotional use" },
      { value: "Yes, but exclude social media platforms", label: "Yes, but exclude social media platforms" },
      { value: "Yes, but only for internal newsletters or donor reports", label: "Yes, but only for internal newsletters or donor reports" },
      { value: "Yes, but only group photos (no individual close-ups)", label: "Yes, but only group photos (no individual close-ups)" },
    ],
    question12: [
      { value: "No, I do not agree with certain policies", label: "No, I do not agree with certain policies" },
      { value: "Yes, I fully agree to comply with all policies and procedures", label: "Yes, I fully agree to comply with all policies and procedures" },
      { value: "Yes, but I would like clarification on certain policies", label: "Yes, but I would like clarification on certain policies" },
      { value: "Yes, pending review of the full policy document", label: "Yes, pending review of the full policy document" },
    ],
    question13: [
      { value: "R100 - Partial contribution", label: "R100 - Partial contribution" },
      { value: "R150 - Partial contribution", label: "R150 - Partial contribution" },
      { value: "R200 - Full contribution", label: "R200 - Full contribution" },
      { value: "R50 - Token contribution", label: "R50 - Token contribution" },
      { value: "Unable to contribute at this time", label: "Unable to contribute at this time" },
    ],
    question14: [
      { value: "No, child does not follow Halal dietary guidelines", label: "No, child does not follow Halal dietary guidelines" },
      { value: "Unsure / Prefer to discuss further", label: "Unsure / Prefer to discuss further" },
      { value: "Yes, Halal preferred but flexible if not available", label: "Yes, Halal preferred but flexible if not available" },
      { value: "Yes, strictly Halal only", label: "Yes, strictly Halal only" },
    ],
    question15: [
      { value: "Attends Islamic and other religious places (e.g. Christian church, Shembe Church/ Ancestor events etc", label: "Attends Islamic and other religious places (e.g. Christian church, Shembe Church/ Ancestor events etc" },
      { value: "Attends religious events occasionally, not regularly", label: "Attends religious events occasionally, not regularly" },
      { value: "Does not attend any place of worship", label: "Does not attend any place of worship" },
      { value: "Only attends Islamic places of worship (Masjid, Madressa)", label: "Only attends Islamic places of worship (Masjid, Madressa)" },
      { value: "Primarily attends non-Islamic places of worship", label: "Primarily attends non-Islamic places of worship" },
    ],
    question16: [
      { value: "No. we do not permit fasting or religious observance", label: "No. we do not permit fasting or religious observance" },
      { value: "Undecided / Prefer to discuss further", label: "Undecided / Prefer to discuss further" },
      { value: "Yes, but only partial fasting or symbolic participation", label: "Yes, but only partial fasting or symbolic participation" },
      { value: "Yes, if the child chooses to fast and is physically able", label: "Yes, if the child chooses to fast and is physically able" },
      { value: "Yes, we fully support our child observing Islamic practices including fasting", label: "Yes, we fully support our child observing Islamic practices including fasting" },
    ],
    question17: [
      { value: "We are open to the idea but would prefer to understand the significance first", label: "We are open to the idea but would prefer to understand the significance first" },
      { value: "We do not support changing the child's name for religious reasons", label: "We do not support changing the child's name for religious reasons" },
      { value: "We fully support the name change and will use the Muslim name at home and in public", label: "We fully support the name change and will use the Muslim name at home and in public" },
      { value: "We support the name change but will continue using the birth name in some settings", label: "We support the name change but will continue using the birth name in some settings" },
    ],
    question18: [
      { value: "No, we prefer burial according to our family's religious tradition", label: "No, we prefer burial according to our family's religious tradition" },
      { value: "We are open to discussing this further with the Madressa", label: "We are open to discussing this further with the Madressa" },
      { value: "Yes, if the child has embraced Islam before passing", label: "Yes, if the child has embraced Islam before passing" },
      { value: "Yes, we fully consent to an Islamic burial in accordance with Shariah", label: "Yes, we fully consent to an Islamic burial in accordance with Shariah" },
    ],
    question19: [
      { value: "I support my child's learning but am not personally interested", label: "I support my child's learning but am not personally interested" },
      { value: "I'm open to learning if resources or sessions are available", label: "I'm open to learning if resources or sessions are available" },
      { value: "No, I do not have interest at this time", label: "No, I do not have interest at this time" },
      { value: "Prefer not to answer", label: "Prefer not to answer" },
      { value: "Yes, I'm actively seeking knowledge and spiritual growth", label: "Yes, I'm actively seeking knowledge and spiritual growth" },
      { value: "Yes, I'm curious and would like to learn more", label: "Yes, I'm curious and would like to learn more" },
    ],
  };

  // Question labels
  const questionLabels = {
    question1: "1. What are your expectations from the Madressa program?",
    question2: "2. How long has your child been to Madressa?",
    question3: "3. For how long would you like your child to attend Madressa?",
    question4: "4. How many days a week can your child attend madressa?",
    question5: "5. What is your commitment to ensuring your Childs regular attendance and punctuality",
    question6: "6. Are you willing to support the MADRESSA's policies and rules",
    question7: "7. How would you like to recieve updates on your Child's progress?",
    question8: "8. Are you weilling to attend parent-teacher meetings and participate in madressa events?",
    question9: "9. How can you contribute to the MADRESSA community?",
    question10: "10. Do you authorise the Madressa to provide medical treatment in case of an emergency?",
    question11: "11. Do you consent to the Madressa taking photographs or videos of your child for promotional purposes",
    question12: "12. Are you willing to comply with the Madressa's policies and procedures?",
    question13: "13. The Madressa expenses are R200 a month. How much would you like to contribute?",
    question14: "14. Does your child eat Halal food?",
    question15: "15. Does your child attend any place of worship or religious event?",
    question16: "16. Will you allow your child to follow Islamic practices like fasting during the month of Ramadaan?",
    question17: "17. If your child wants to adopt a Muslim name, how will you respond?",
    question18: "18. Will you consent to an Islamic burial for your child?",
    question19: "19. Do you have any interest in learning about Islam? (Yes/ No)",
  };

  useEffect(() => {
    if (editItem && modalOpen) {
      reset({
        question1: editItem.question1 || "",
        question2: editItem.question2 || "",
        question3: editItem.question3 || "",
        question4: editItem.question4 || "",
        question5: editItem.question5 || "",
        question6: editItem.question6 || "",
        question7: editItem.question7 || "",
        question8: editItem.question8 || "",
        question9: editItem.question9 || "",
        question10: editItem.question10 || "",
        question11: editItem.question11 || "",
        question12: editItem.question12 || "",
        question13: editItem.question13 || "",
        question14: editItem.question14 || "",
        question15: editItem.question15 || "",
        question16: editItem.question16 || "",
        question17: editItem.question17 || "",
        question18: editItem.question18 || "",
        question19: editItem.question19 || "",
      });
    } else if (modalOpen) {
      reset({
        question1: "",
        question2: "",
        question3: "",
        question4: "",
        question5: "",
        question6: "",
        question7: "",
        question8: "",
        question9: "",
        question10: "",
        question11: "",
        question12: "",
        question13: "",
        question14: "",
        question15: "",
        question16: "",
        question17: "",
        question18: "",
        question19: "",
      });
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
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

  const onSubmit = async (data) => {
    try {
      const formData = {
        ...data,
        madressah_app_id: application.id,
        created_by: getAuditName(),
        updated_by: getAuditName(),
      };

      if (editItem) {
        formData.updated_by = getAuditName();
        await axiosApi.put(
          `${API_BASE_URL}/survey/${editItem.id}`,
          formData
        );
        showAlert("Survey updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/survey`, formData);
        showAlert("Survey created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving survey:", error);
      showAlert(
        error.response?.data?.error || "Failed to save survey",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const surveyName = editItem.question1 
      ? editItem.question1.substring(0, 50) + (editItem.question1.length > 50 ? '...' : '') 
      : 'Survey';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: surveyName,
      type: "survey",
      message: "This survey will be permanently removed from the system."
    }, async () => {
      try {
        await axiosApi.delete(`${API_BASE_URL}/survey/${editItem.id}`);
        showAlert("Survey has been deleted successfully", "success");
        onUpdate();
        if (modalOpen) {
          setModalOpen(false);
        }
      } catch (error) {
        console.error("Error deleting survey:", error);
        showAlert(error?.response?.data?.message || "Failed to delete survey", "danger");
        throw error;
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        id: "question1",
        header: "Expectations",
        accessorKey: "question1",
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
            {cell.getValue() ? (cell.getValue().length > 50 ? `${cell.getValue().substring(0, 50)}...` : cell.getValue()) : "-"}
          </span>
        ),
      },
      {
        id: "question2",
        header: "Duration",
        accessorKey: "question2",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "question13",
        header: "Contribution",
        accessorKey: "question13",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "created_by",
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "created_at",
        header: "Created On",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    [handleEdit]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Survey</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Survey
          </Button>
        )}
      </div>

      {surveys && surveys.length > 0 ? (
        <TableContainer
          columns={columns}
          data={surveys || []}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      ) : (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No surveys found. Click "Add Survey" to create one.
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="xl" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Survey
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((num) => {
                const questionKey = `question${num}`;
                return (
                  <Col md={12} key={num}>
                    <FormGroup>
                      <Label for={questionKey}>{questionLabels[questionKey]}</Label>
                      <Controller
                        name={questionKey}
                        control={control}
                        render={({ field }) => (
                          <Input
                            id={questionKey}
                            type="select"
                            disabled={isOrgExecutive}
                            {...field}
                          >
                            <option value="">Select an answer</option>
                            {questionOptions[questionKey]?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                );
              })}
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
                  <i className="bx bx-trash me-1"></i> Delete
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
        title="Delete Survey"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default SurveyTab;
