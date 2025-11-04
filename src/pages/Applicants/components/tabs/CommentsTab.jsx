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
import { getHudasaUser, getAuditName, getUserFullName } from "../../../../helpers/userStorage";

const CommentsTab = ({ applicantId, comments, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const currentUser = getHudasaUser();

  // Robust creator match: handles username, full name, and audit formats like "John Doe (jdoe)"
  const isCreatedByCurrentUser = (createdByRaw) => {
    const createdBy = (createdByRaw || "").toString().trim().toLowerCase();
    if (!createdBy) return false;
    const username = (currentUser?.username || "").toString().trim().toLowerCase();
    const fullName = (getUserFullName?.() || "").toString().trim().toLowerCase();
    const auditName = (getAuditName?.() || "").toString().trim().toLowerCase();
    const auditUsername = (auditName.match(/\(([^)]+)\)/)?.[1] || "").toLowerCase();
    const createdByUsername = (createdBy.match(/\(([^)]+)\)/)?.[1] || "").toLowerCase();
    const candidates = new Set([
      username,
      fullName,
      auditName,
      auditUsername,
    ].filter(Boolean));
    if (candidates.has(createdBy)) return true;
    if (createdByUsername && candidates.has(createdByUsername)) return true;
    // Loose contains check to survive minor formatting differences
    for (const c of candidates) {
      if (c && (createdBy.includes(c) || c.includes(createdBy))) return true;
    }
    return false;
  };

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
  } = useForm({
    defaultValues: {
      Comment: "",
    },
  });

  useEffect(() => {
    if (modalOpen) {
      reset({
        Comment: editItem?.comment || "",
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
    // Only creator can edit
    if (!isCreatedByCurrentUser(item?.created_by)) return;
    setEditItem(item);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();

      const payload = {
        file_id: applicantId,
        comment: data.Comment,
        // Default to existing comment_date when editing; else use today's date
        comment_date: editItem?.comment_date || new Date().toISOString().split("T")[0],
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/comments/${editItem.id}`, payload);
        showAlert("Comment has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/comments`, payload);
        showAlert("Comment has been added successfully", "success");
      }

      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving comment:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const commentName = editItem.comment ? editItem.comment.substring(0, 50) + (editItem.comment.length > 50 ? '...' : '') : 'Unknown Comment';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: commentName,
      type: "comment",
      message: "This comment will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/comments/${editItem.id}`);
      showAlert("Comment has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Comment",
        accessorKey: "comment",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const row = cell.row.original;
          const createdAt = row.created_at || row.comment_date;
          const updatedAt = row.updated_at;
          const isEdited = !!row.updated_by && !!row.updated_at && row.updated_at !== row.created_at;
          const canEdit = !isOrgExecutive && isCreatedByCurrentUser(row.created_by);
          const creatorName = row.created_by || getUserFullName() || currentUser?.username || "-";
          const initials = (() => {
            const n = (creatorName || "").trim();
            if (!n) return "--";
            const parts = n.split(/\s+/);
            const first = parts[0]?.[0] || "";
            const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
            return (first + last).toUpperCase();
          })();
          const formatDT = (d) => {
            if (!d) return "-";
            const date = new Date(d);
            const dateStr = date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase();
            const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
            return `${dateStr} (${timeStr})`;
          };
          return (
            <div className="d-flex align-items-start">
              <div
                className="me-2 rounded-circle bg-secondary text-white text-center shadow-sm"
                style={{ width: 34, minWidth: 34, height: 34, lineHeight: "34px", fontSize: 11, fontWeight: 700 }}
                title={creatorName}
              >
                {initials}
              </div>
              <div className="flex-grow-1">
                <div className="position-relative border rounded bg-light px-2 py-2 shadow-sm" style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
                  <div className="d-flex">
                    <div className="flex-grow-1 text-dark" style={{ lineHeight: 1.4 }}>
                      {cell.getValue()}
                      {isEdited && <span className="ms-2 text-muted">(edited)</span>}
                    </div>
                    {canEdit && (
                      <Button color="light" size="sm" className="ms-2" onClick={() => handleEdit(row)} title="Edit">
                        <i className="bx bx-edit"></i>
                      </Button>
                    )}
                    {!canEdit && (
                      <span className="ms-2 text-muted" title="Only the creator can edit">
                        <i className="bx bx-lock"></i>
                      </span>
                    )}
                  </div>
                  <div className="mt-1 d-flex flex-wrap gap-2 small text-muted">
                    <span>
                      <strong>{creatorName}</strong> • {formatDT(createdAt)}
                    </span>
                    {isEdited && (
                      <span>
                        Updated by <strong>{row.updated_by || "-"}</strong> on {formatDT(updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
    ],
    [isOrgExecutive, currentUser]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Comments</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Comment
          </Button>
        )}
      </div>

      {/* Controls are provided by TableContainer for consistency with other tabs */}

      {comments.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No comments found. Click "Add Comment" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={(comments || []).slice().sort((a, b) => {
            const ad = new Date(a.created_at || a.comment_date || 0).getTime();
            const bd = new Date(b.created_at || b.comment_date || 0).getTime();
            return bd - ad; // latest first
          })}
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
          {editItem ? "Edit" : "Add"} Comment
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="Comment">
                    Comment <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Comment"
                    control={control}
                    rules={{ required: "Comment is required" }}
                    render={({ field }) => (
                      <Input
                        id="Comment"
                        type="textarea"
                        rows="5"
                        invalid={!!errors.Comment}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.Comment && <FormFeedback>{errors.Comment.message}</FormFeedback>}
                </FormGroup>
              </Col>

              {/* Comment date is auto-managed: current date on create, preserved on edit */}
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
        title="Delete Comment"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default CommentsTab;

