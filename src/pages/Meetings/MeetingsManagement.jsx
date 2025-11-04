import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import MeetingListPanel from "./components/MeetingListPanel";
import MeetingSummary from "./components/MeetingSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";

const MeetingsManagement = () => {
  // Meta title
  document.title = "Meetings Management | Welfare App";

  // State management
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Detail data states
  const [tasks, setTasks] = useState([]);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    taskStatuses: [],
  });

  // Create form
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isSubmitting: createIsSubmitting },
    reset: resetCreateForm,
  } = useForm();

  // Fetch all meetings on mount
  useEffect(() => {
    fetchMeetings();
    fetchLookupData();
  }, []);

  // Fetch detail data when a meeting is selected
  useEffect(() => {
    if (selectedMeeting) {
      fetchMeetingDetails(selectedMeeting.id);
    }
  }, [selectedMeeting]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/hseqToolboxMeeting`);
      setMeetings(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedMeeting(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      showAlert("Failed to fetch meetings", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [taskStatusesRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Tasks_Status`),
      ]);

      setLookupData({
        taskStatuses: taskStatusesRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchMeetingDetails = async (meetingId) => {
    try {
      const [tasksRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/hseqToolboxMeetingTasks?meeting_id=${meetingId}`),
      ]);

      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      showAlert("Failed to fetch meeting details", "warning");
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  const getAlertIcon = (color) => {
    switch (color) {
      case "success":
        return "mdi mdi-check-all";
      case "danger":
        return "mdi mdi-block-helper";
      case "warning":
        return "mdi mdi-alert-outline";
      case "info":
        return "mdi mdi-alert-circle-outline";
      default:
        return "mdi mdi-information";
    }
  };

  const getAlertBackground = (color) => {
    switch (color) {
      case "success":
        return "#d4edda";
      case "danger":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      case "info":
        return "#d1ecf1";
      default:
        return "#f8f9fa";
    }
  };

  const getAlertBorder = (color) => {
    switch (color) {
      case "success":
        return "#c3e6cb";
      case "danger":
        return "#f5c6cb";
      case "warning":
        return "#ffeaa7";
      case "info":
        return "#bee5eb";
      default:
        return "#dee2e6";
    }
  };

  const handleMeetingSelect = (meeting) => {
    setSelectedMeeting(meeting);
    // Clear existing detail data to avoid showing stale records while fetching
    setTasks([]);
    // Fetch fresh detail data immediately for better UX
    if (meeting?.id) {
      fetchMeetingDetails(meeting.id);
    }
  };

  const handleMeetingUpdate = useCallback(() => {
    fetchMeetings();
    if (selectedMeeting) {
      fetchMeetingDetails(selectedMeeting.id);
    }
  }, [selectedMeeting]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedMeeting) {
      fetchMeetingDetails(selectedMeeting.id);
    }
  }, [selectedMeeting]);

  const filteredMeetings = meetings.filter((meeting) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (meeting.conducted_by || "").toLowerCase().includes(searchLower) ||
      (meeting.in_attendance || "").toLowerCase().includes(searchLower) ||
      (meeting.meeting_date || "").toLowerCase().includes(searchLower)
    );
  });

  const toggleCreateModal = () => {
    setCreateModalOpen(!createModalOpen);
    if (!createModalOpen) {
      resetCreateForm({
        Meeting_Date: "",
        Conducted_By: "",
        In_Attendance: "",
        Guests: "",
        Health_Discussions: "",
        Safety_Discussions: "",
        Quality_Discussions: "",
        Productivity_Discussions: "",
        Environment_Discussions: "",
        General_Discussion: "",
        Feedback: "",
      });
    }
  };

  const onCreateSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      
      const payload = {
        meeting_date: data.Meeting_Date,
        conducted_by: data.Conducted_By,
        in_attendance: data.In_Attendance,
        guests: data.Guests,
        health_discussions: data.Health_Discussions,
        safety_discussions: data.Safety_Discussions,
        quality_discussions: data.Quality_Discussions,
        productivity_discussions: data.Productivity_Discussions,
        environment_discussions: data.Environment_Discussions,
        general_discussion: data.General_Discussion,
        feedback: data.Feedback,
        center_id: currentUser?.center_id || 1,
        created_by: getAuditName(),
      };

      await axiosApi.post(`${API_BASE_URL}/hseqToolboxMeeting`, payload);
      showAlert("Meeting has been created successfully", "success");
      fetchMeetings();
      toggleCreateModal();
    } catch (error) {
      console.error("Error creating meeting:", error);
      showAlert(error?.response?.data?.error || "Failed to create meeting", "danger");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        {/* Alert Notification - Top Right */}
        {alert && (
          <div
            className="position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
          >
            <Alert
              color={alert.color}
              isOpen={!!alert}
              toggle={() => setAlert(null)}
              className="alert-dismissible fade show shadow-lg"
              role="alert"
              style={{
                opacity: 1,
                backgroundColor: getAlertBackground(alert.color),
                border: `1px solid ${getAlertBorder(alert.color)}`,
                color: "#000",
              }}
            >
              <i className={`${getAlertIcon(alert.color)} me-2`}></i>
              {alert.message}
            </Alert>
          </div>
        )}

        <Breadcrumbs title="Meetings" breadcrumbItem="Meetings Management" />

        <Row>
          {/* Left Panel - Meeting List */}
          <Col lg={3}>
            <MeetingListPanel
              meetings={filteredMeetings}
              selectedMeeting={selectedMeeting}
              onSelectMeeting={handleMeetingSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchMeetings}
              onCreateNew={() => setCreateModalOpen(true)}
            />
          </Col>

          {/* Main Panel - Meeting Details */}
          <Col lg={9}>
            {selectedMeeting ? (
              <>
                {/* Summary Metrics */}
                <SummaryMetrics
                  meetings={meetings}
                  tasks={tasks}
                />

                {/* Meeting Summary */}
                <MeetingSummary
                  meeting={selectedMeeting}
                  lookupData={lookupData}
                  onUpdate={handleMeetingUpdate}
                  showAlert={showAlert}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedMeeting.id}
                  meetingId={selectedMeeting.id}
                  tasks={tasks}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-calendar display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading meetings..." : "Select a meeting to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>

        {/* Create Meeting Modal */}
        <Modal isOpen={createModalOpen} toggle={toggleCreateModal} centered size="lg" backdrop="static">
          <ModalHeader toggle={toggleCreateModal}>
            <i className="bx bx-plus-circle me-2"></i>
            Create New Meeting
          </ModalHeader>

          <Form onSubmit={handleCreateSubmit(onCreateSubmit)}>
            <ModalBody>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Meeting_Date">
                      Meeting Date <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Meeting_Date"
                      control={createControl}
                      rules={{ required: "Meeting date is required" }}
                      render={({ field }) => (
                        <Input id="Meeting_Date" type="date" invalid={!!createErrors.Meeting_Date} {...field} />
                      )}
                    />
                    {createErrors.Meeting_Date && <FormFeedback>{createErrors.Meeting_Date.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Conducted_By">
                      Conducted By <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Conducted_By"
                      control={createControl}
                      rules={{ required: "Conducted by is required" }}
                      render={({ field }) => (
                        <Input id="Conducted_By" type="text" invalid={!!createErrors.Conducted_By} {...field} />
                      )}
                    />
                    {createErrors.Conducted_By && <FormFeedback>{createErrors.Conducted_By.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="In_Attendance">In Attendance</Label>
                    <Controller
                      name="In_Attendance"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="In_Attendance" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="Guests">Guests</Label>
                    <Controller
                      name="Guests"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Guests" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="Feedback">Feedback</Label>
                    <Controller
                      name="Feedback"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Feedback" type="textarea" rows="3" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>

            <ModalFooter className="d-flex justify-content-end">
              <Button color="light" onClick={toggleCreateModal} disabled={createIsSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              <Button color="success" type="submit" disabled={createIsSubmitting}>
                {createIsSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i> Create
                  </>
                )}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default MeetingsManagement;

