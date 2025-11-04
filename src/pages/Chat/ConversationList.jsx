import React, { useState } from "react";
import { Input, Button, Spinner, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import SimpleBar from "simplebar-react";
import { Link } from "react-router-dom";
import { useRole } from "../../helpers/useRole";

const ConversationList = ({
  conversations,
  currentConversation,
  onConversationSelect,
  onCreateConversation,
  onDeleteConversation,
  loading,
  currentUser
}) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [searchTerm, setSearchTerm] = useState("");

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConversationIcon = (type) => {
    switch(type) {
      case "Group":
        return "bx-group";
      case "Direct":
        return "bx-user";
      default:
        return "bx-chat";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="chat-leftsidebar me-lg-4">
      <div>
        {/* Header */}
        <div className="py-4 border-bottom">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <h5 className="font-size-16 mb-0">Conversations</h5>
              <p className="text-muted mb-0">
                <i className="mdi mdi-circle text-success align-middle me-1"></i>
                {currentUser?.name || "User"}
              </p>
            </div>
            <div>
              {/* Org Executive can create conversations */}
              <Button
                color="primary"
                size="sm"
                onClick={onCreateConversation}
                title="New Conversation"
              >
                <i className="bx bx-plus"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="search-box chat-search-box py-4">
          <div className="position-relative">
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bx bx-search-alt search-icon"></i>
          </div>
        </div>

        {/* Conversations List */}
        <div className="chat-leftsidebar-nav">
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <div className="mt-2 text-muted">Loading conversations...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-5">
              <i className="bx bx-chat display-4 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">No conversations found</h5>
              <p className="text-muted">Start a new conversation</p>
              <Button color="primary" size="sm" onClick={onCreateConversation}>
                <i className="bx bx-plus me-1"></i>
                New Conversation
              </Button>
            </div>
          ) : (
            <SimpleBar style={{ maxHeight: "calc(100vh - 400px)" }}>
              <ul className="list-unstyled chat-list">
                {filteredConversations.map((conversation) => (
                  <li
                    key={conversation.id}
                    className={currentConversation?.id === conversation.id ? "active" : ""}
                  >
                    <Link
                      to="#"
                      onClick={() => onConversationSelect(conversation)}
                      className="d-block"
                    >
                      <div className="d-flex align-items-start">
                        <div className="avatar-xs me-3 align-self-center">
                          <span className="avatar-title rounded-circle bg-primary text-white">
                            <i className={`bx ${getConversationIcon(conversation.type)}`}></i>
                          </span>
                        </div>

                        <div className="flex-grow-1 overflow-hidden">
                          <h5 className="text-truncate font-size-14 mb-1">
                            {conversation.title || "Untitled Conversation"}
                          </h5>
                          <p className="text-truncate mb-0 text-muted">
                            <i className={`bx ${getConversationIcon(conversation.type)} me-1`}></i>
                            {conversation.type || "Chat"}
                          </p>
                        </div>

                         <div className="text-end">
                           <p className="text-muted font-size-11 mb-1">
                             {formatDate(conversation.updated_at)}
                           </p>
                          {/* Org Executive can delete conversations */}
                          <UncontrolledDropdown 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                              <DropdownToggle 
                                tag="button"
                                className="btn btn-link text-muted p-0 font-size-16"
                                style={{ border: 'none', background: 'none' }}
                              >
                                <i className="bx bx-dots-vertical-rounded"></i>
                              </DropdownToggle>
                              <DropdownMenu end>
                                <DropdownItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (window.confirm("Are you sure you want to delete this conversation?")) {
                                      onDeleteConversation(conversation.id);
                                    }
                                  }}
                                  className="text-danger"
                                >
                                  <i className="bx bx-trash me-2"></i>
                                  Delete
                                </DropdownItem>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                         </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SimpleBar>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationList;

