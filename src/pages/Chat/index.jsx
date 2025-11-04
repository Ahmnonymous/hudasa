import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";

// Import Components
import ConversationList from "./ConversationList";
import MessageArea from "./MessageArea";
import NewConversationModal from "./NewConversationModal";

const Chat = () => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Modal states
  const [newConversationModal, setNewConversationModal] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState(null);

  // Current user
  const currentUser = getHudasaUser();

  // Meta title
  document.title = "Chat | Hudasa";

  // Fetch conversations and employees on mount
  useEffect(() => {
    fetchConversations();
    fetchEmployees();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/conversations`);
      
      // ✅ Backend now handles filtering - App Admin sees all, others see only their center
      // No frontend filtering needed (backend enforces it)
      setConversations(response.data);
      
      // Set first conversation as active if none selected
      if (!currentConversation && response.data.length > 0) {
        setCurrentConversation(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      showAlert("Failed to load conversations", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosApi.get(`${API_BASE_URL}/employee`);
      
      // ✅ App Admin can chat with users from any center, others only within their center
      const userType = parseInt(currentUser?.user_type);
      const isAppAdmin = userType === 1; // App Admin (role 1)
      
      const centerEmployees = isAppAdmin 
        ? response.data // App Admin sees all employees
        : (currentUser?.center_id
          ? response.data.filter(e => e.center_id === currentUser.center_id)
          : response.data);

      setEmployees(centerEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/messages`);
      
      // Filter messages for this conversation (handle both string and number IDs)
      const conversationMessages = response.data.filter(
        m => m.conversation_id == conversationId
      );

      // Sort by created_at
      conversationMessages.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      setMessages(conversationMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      showAlert("Failed to load messages", "danger");
    } finally {
      setMessagesLoading(false);
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

  const handleConversationSelect = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleSendMessage = async (messageData) => {
    const tempMessageId = `temp-${Date.now()}`;
    
    try {
      const payload = {
        conversation_id: currentConversation.id,
        sender_id: currentUser?.id,
        message_text: messageData.message_text,
        read_status: "Unread",
        center_id: currentUser?.center_id, // Backend will handle App Admin (null center_id)
        created_by: getAuditName(),
      };

      // Optimistic update - add message to UI immediately
      const tempMessage = {
        id: tempMessageId,
        ...payload,
        created_at: new Date().toISOString(),
        attachment_filename: messageData.file ? messageData.file.name : null,
      };
      setMessages(prev => [...prev, tempMessage]);

      // Handle file attachment if present
      if (messageData.file) {
        const formData = new FormData();
        formData.append("conversation_id", payload.conversation_id);
        formData.append("sender_id", payload.sender_id);
        formData.append("message_text", payload.message_text);
        formData.append("read_status", payload.read_status);
        // Only append center_id if it's not null (App Admin has null center_id)
        if (payload.center_id !== null && payload.center_id !== undefined) {
          formData.append("center_id", payload.center_id);
        }
        formData.append("created_by", payload.created_by);
        formData.append("attachment", messageData.file);

        await axiosApi.post(`${API_BASE_URL}/messages`, formData);
      } else {
        await axiosApi.post(`${API_BASE_URL}/messages`, payload);
      }

      // Refresh messages from server to get the actual ID and any server-side updates
      await fetchMessages(currentConversation.id);
    } catch (error) {
      console.error("Error sending message:", error);
      showAlert("Failed to send message", "danger");
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
    }
  };

  const handleCreateConversation = async (conversationData) => {
    try {
      const payload = {
        title: conversationData.title,
        type: conversationData.type,
        center_id: currentUser?.center_id, // Backend will handle App Admin (null center_id)
        created_by: getAuditName(),
      };

      const response = await axiosApi.post(`${API_BASE_URL}/conversations`, payload);
      const newConversation = response.data;

      // Add participants
      if (conversationData.participants && conversationData.participants.length > 0) {
        for (const employeeId of conversationData.participants) {
          await axiosApi.post(`${API_BASE_URL}/conversationParticipants`, {
            conversation_id: newConversation.id,
            employee_id: employeeId,
            joined_date: new Date().toISOString().split('T')[0],
            center_id: currentUser?.center_id, // Backend will handle App Admin (null center_id)
            created_by: getAuditName(),
          });
        }
      }

      showAlert("Conversation created successfully", "success");
      fetchConversations();
      setNewConversationModal(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      showAlert("Failed to create conversation", "danger");
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await axiosApi.delete(`${API_BASE_URL}/conversations/${conversationId}`);
      showAlert("Conversation deleted successfully", "success");
      fetchConversations();
      
      // Clear current conversation if it was deleted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      showAlert("Failed to delete conversation", "danger");
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Apps" breadcrumbItem="Chat" />

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

          <Row>
            <Col lg="12">
              <div className="d-lg-flex">
                {/* Conversation List - Left Sidebar */}
                <ConversationList
                  conversations={conversations}
                  currentConversation={currentConversation}
                  onConversationSelect={handleConversationSelect}
                  onCreateConversation={() => setNewConversationModal(true)}
                  onDeleteConversation={handleDeleteConversation}
                  loading={loading}
                  currentUser={currentUser}
                />

                {/* Message Area - Main Content */}
                <MessageArea
                  conversation={currentConversation}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  loading={messagesLoading}
                  currentUser={currentUser}
                />
              </div>
            </Col>
          </Row>

          {/* Modals */}
          <NewConversationModal
            isOpen={newConversationModal}
            toggle={() => setNewConversationModal(!newConversationModal)}
            employees={employees}
            currentUser={currentUser}
            onSubmit={handleCreateConversation}
            showAlert={showAlert}
          />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Chat;

