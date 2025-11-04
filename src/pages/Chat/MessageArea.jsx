import React, { useState, useRef, useEffect } from "react";
import { Card, Input, Button, Row, Col, Spinner, UncontrolledTooltip } from "reactstrap";
import SimpleBar from "simplebar-react";
import { useRole } from "../../helpers/useRole";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../helpers/url_helper";

const MessageArea = ({ conversation, messages, onSendMessage, loading, currentUser }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.getScrollElement();
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim() || selectedFile) {
      onSendMessage({
        message_text: messageText.trim(),
        file: selectedFile,
      });
      setMessageText("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleViewAttachment = (messageId) => {
    window.open(`${API_STREAM_BASE_URL}/messages/${messageId}/view-attachment`, "_blank");
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped = {};
    messages.forEach(message => {
      const dateKey = new Date(message.created_at).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });
    return grouped;
  };

  const groupedMessages = groupMessagesByDate();

  if (!conversation) {
    return (
      <div className="w-100 user-chat">
        <Card>
          <div className="d-flex align-items-center justify-content-center" style={{ height: "calc(100vh - 250px)" }}>
            <div className="text-center">
              <i className="bx bx-chat display-1 text-muted mb-3"></i>
              <h5 className="text-muted">Select a conversation to start messaging</h5>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-100 user-chat">
      <Card>
        {/* Header */}
        <div className="p-4 border-bottom" style={{ flexShrink: 0 }}>
          <Row>
            <Col md={8} xs={9}>
              <h5 className="font-size-15 mb-1">{conversation.title || "Conversation"}</h5>
              <p className="text-muted mb-0">
                <i className={`bx ${conversation.type === "Group" ? "bx-group" : "bx-chat"} me-1`}></i>
                {conversation.type || "Chat"}
              </p>
            </Col>
          </Row>
        </div>

        {/* Messages Area */}
        <div>
          <div className="chat-conversation p-3 bg-light">
            <SimpleBar ref={scrollRef} style={{ height: "calc(100vh - 400px)" }}>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                  <div className="mt-2 text-muted">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bx bx-message-dots display-4 text-muted mb-3"></i>
                  <h6 className="text-muted">No messages yet</h6>
                  <p className="text-muted">Start the conversation by sending a message</p>
                </div>
              ) : (
                <div>
                  {Object.keys(groupedMessages).map((dateKey) => (
                    <div key={dateKey}>
                      {/* Date Divider */}
                      <div className="text-center my-3">
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1 shadow-sm" style={{ fontSize: "0.7rem" }}>
                          {formatDate(dateKey)}
                        </span>
                      </div>

                      {/* Messages for this date */}
                      {groupedMessages[dateKey].map((message) => {
                        const isMine = message.sender_id == currentUser?.id; // Use loose equality to handle string/number mismatch
                        return (
                           <div
                            key={message.id}
                            className={`d-flex mb-2 ${isMine ? "justify-content-end" : "justify-content-start"}`}
                          >
                            <div
                              className="message-bubble"
                              style={{
                                maxWidth: "65%",
                                minWidth: "80px",
                                transition: "opacity 0.2s ease"
                              }}
                            >
                              <div
                                className={`px-3 py-2 rounded-3 shadow-sm ${isMine ? "bg-success-subtle" : "bg-body"}`}
                                style={{
                                  borderRadius: isMine ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
                                  border: isMine ? "none" : "1px solid var(--bs-border-color)",
                                }}
                              >
                                {/* Sender Name (for received messages in group chats) */}
                                {!isMine && conversation.type === "Group" && (
                                  <div className="mb-1">
                                    <small className="fw-bold" style={{ fontSize: "0.7rem", color: "var(--bs-primary)" }}>
                                      {message.created_by || "Unknown"}
                                    </small>
                                  </div>
                                )}
                                
                                {/* Message Text */}
                                {message.message_text && (
                                  <p className="mb-1" style={{ fontSize: "0.875rem", wordWrap: "break-word", lineHeight: "1.4" }}>
                                    {message.message_text}
                                  </p>
                                )}

                                {/* Attachment */}
                                {message.attachment_filename && (
                                  <div 
                                    className={`message-attachment mt-2 p-2 rounded ${isMine ? "bg-success-subtle" : "bg-light"}`}
                                    style={{ 
                                      border: "1px solid var(--bs-border-color)",
                                      opacity: 0.9
                                    }}
                                  >
                                    <div className="d-flex align-items-center">
                                      <i className="bx bx-file font-size-20 text-primary me-2"></i>
                                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                        <h6 className="mb-0 font-size-12 text-truncate">{message.attachment_filename}</h6>
                                        <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                                          {formatFileSize(message.attachment_size)}
                                        </small>
                                      </div>
                                      <Button
                                        color="link"
                                        size="sm"
                                        className="p-0 ms-2"
                                        onClick={() => handleViewAttachment(message.id)}
                                      >
                                        <i className="bx bx-show font-size-18 text-primary"></i>
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Time - Bottom right corner of bubble */}
                                <div className={`d-flex align-items-center gap-1 ${message.message_text ? "mt-1" : "mt-0"} ${isMine ? "justify-content-end" : "justify-content-start"}`}>
                                  <small className="text-muted" style={{ fontSize: "0.6rem" }}>
                                    {formatTime(message.created_at)}
                                  </small>
                                  {isMine && (
                                    <i 
                                      className={`bx bx-check-double ${message.read_status === "Read" ? "text-primary" : "text-secondary"}`} 
                                      style={{ fontSize: "14px", marginLeft: "2px" }}
                                    ></i>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </SimpleBar>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="selected-file-preview p-3 border-top bg-body">
              <div className="d-flex align-items-center">
                <i className="bx bx-file font-size-24 text-primary me-2"></i>
                <div className="flex-grow-1">
                  <h6 className="mb-0">{selectedFile.name}</h6>
                  <small className="text-muted">{formatFileSize(selectedFile.size)}</small>
                </div>
                <Button
                  color="light"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <i className="bx bx-x"></i>
                </Button>
              </div>
            </div>
          )}

          {/* Input Area - WhatsApp Style - Org Executive can send messages */}
          <div className="p-2 chat-input-section border-top bg-body" style={{ flexShrink: 0 }}>
            <Row className="g-2 align-items-end">
              <Col className="col-auto">
                <label htmlFor="fileInput" style={{ cursor: "pointer", marginBottom: 0 }}>
                  <Button
                    color="light"
                    className="btn-icon rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "38px", height: "38px", padding: 0 }}
                    type="button"
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <i className="bx bx-paperclip font-size-18 text-muted" id="AttachTooltip"></i>
                  </Button>
                  <UncontrolledTooltip placement="top" target="AttachTooltip">
                    Attach File
                  </UncontrolledTooltip>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="fileInput"
                  className="d-none"
                  onChange={handleFileChange}
                />
              </Col>
              <Col>
                <Input
                  type="textarea"
                  rows="1"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="chat-input"
                  placeholder="Type a message..."
                  style={{ 
                    resize: "none", 
                    borderRadius: "20px",
                    fontSize: "0.875rem",
                    padding: "8px 16px",
                    minHeight: "38px"
                  }}
                />
              </Col>
              <Col className="col-auto">
                <Button
                  type="button"
                  color="primary"
                  onClick={handleSend}
                  disabled={!messageText.trim() && !selectedFile}
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px", padding: 0 }}
                >
                  <i className="bx bx-send font-size-16"></i>
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </Card>

      {/* Custom Styles for WhatsApp-like Messages */}
      <style jsx>{`
        /* Simple hover effect - just background color change */
        .message-bubble:hover {
          opacity: 0.9;
          transition: opacity 0.2s ease;
        }

        /* Custom scrollbar for chat */
        .chat-conversation :global(.simplebar-scrollbar)::before {
          background-color: var(--bs-secondary-color);
        }

        /* Dark mode adjustments */
        [data-bs-theme="dark"] .bg-success-subtle {
          background-color: rgba(25, 135, 84, 0.25) !important;
        }

        [data-bs-theme="dark"] .message-bubble .shadow-sm {
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3) !important;
        }

        /* Read status styling */
        .read-status-read {
          color: var(--bs-primary) !important;
        }

        .read-status-unread {
          color: var(--bs-secondary-color) !important;
        }
      `}</style>
    </div>
  );
};

export default MessageArea;
