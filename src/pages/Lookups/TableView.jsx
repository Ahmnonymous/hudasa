import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Alert,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import { useRole } from "../../helpers/useRole";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";

// Redux actions
import {
  fetchLookup,
  createLookup,
  updateLookup,
  deleteLookup,
} from "../../store/actions";

const TableView = () => {
  const { table } = useParams();
  const dispatch = useDispatch();
  const { isOrgExecutive } = useRole(); // Read-only check

  const { data, loading, error } = useSelector((state) => state.Lookup);
  const tableData = data[table] || [];

  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // --- Lookup Dialog State ---
  const [alert, setAlert] = useState(null);
  const nameInputRef = useRef(null);

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
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (table) {
      dispatch(fetchLookup(table));
    }
  }, [table, dispatch]);

  // Focus + reset logic for dialog
  useEffect(() => {
    if (showDialog) {
      reset({ name: editItem?.name || "" });
      setTimeout(() => {
        if (nameInputRef.current) nameInputRef.current.focus();
      }, 100);
    }
  }, [showDialog, editItem, reset]);

  // --- Dialog alert helpers ---
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
      case "primary":
        return "mdi mdi-bullseye-arrow";
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
      case "primary":
        return "#cce5ff";
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
      case "primary":
        return "#b8daff";
      default:
        return "#dee2e6";
    }
  };

  // --- Table logic ---
  const handleAdd = () => {
    setEditItem(null);
    setShowDialog(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowDialog(true);
  };

  const handleSave = async (formData) => {
    try {
      // Get current user from localStorage
      const currentUser = getHudasaUser();
      
      // Add audit fields based on workspace rules
      const payload = { ...formData };
      if (editItem) {
        payload.updated_by = getAuditName();
      } else {
        payload.created_by = getAuditName();
      }

      if (editItem) {
        await dispatch(updateLookup(table, editItem.id, payload));
      } else {
        await dispatch(createLookup(table, payload));
      }

      await dispatch(fetchLookup(table));
      showAlert(
        `${formatTableName(table)} has been ${
          editItem ? "updated" : "added"
        } successfully.`,
        "success"
      );

      setShowDialog(false);
      setEditItem(null);
    } catch (err) {
      console.error("Save failed:", err);
      showAlert(err?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = async (item) => {
    try {
      await dispatch(deleteLookup(table, item.id));
      await dispatch(fetchLookup(table));
      showAlert(`${formatTableName(table)} has been deleted successfully.`, "success");
      setShowDialog(false);
      setEditItem(null);
    } catch (err) {
      console.error("Delete failed:", err);
      showAlert(err?.message || "Delete failed", "danger");
    }
  };

  const handleDeleteClick = () => {
    if (!editItem) return;

    const itemName = editItem.name || editItem.title || `${formatTableName(table)} #${editItem.id}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: itemName,
      type: formatTableName(table).toLowerCase(),
      message: `This ${formatTableName(table).toLowerCase()} will be permanently removed from the system.`
    }, async () => {
      await handleDelete(editItem);
    });
  };

  const handleClose = () => {
    reset({ name: "" });
    setShowDialog(false);
  };

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => (
          <span
            style={{ cursor: "default", color: "inherit", textDecoration: "none" }}
            onClick={() => handleEdit(cell.row.original)}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#0d6efd";
              e.currentTarget.style.textDecoration = "underline";
              e.currentTarget.style.cursor = "pointer";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "inherit";
              e.currentTarget.style.textDecoration = "none";
              e.currentTarget.style.cursor = "default";
            }}
          >
            {cell.getValue()}
          </span>
        ),
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created On",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Updated By",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated On",
        accessorKey: "updated_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
    ],
    [tableData]
  );

  const formatTableName = (tableName) => tableName.replace(/_/g, " ");
  document.title = `${formatTableName(table)} | Lookup Setup`;

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="Lookup Setup" breadcrumbItem={formatTableName(table)} />

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <Row className="mb-3">
                  <Col sm={6}>
                    <div className="d-flex align-items-center">
                      <Link to="/lookups" className="btn btn-light btn-sm me-2">
                        <i className="bx bx-arrow-back"></i> Back
                      </Link>
                      <h4 className="card-title mb-0">
                        {formatTableName(table)}
                        {isOrgExecutive && <span className="ms-2 badge bg-info">Read Only</span>}
                      </h4>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="text-sm-end">
                      {!isOrgExecutive && (
                        <Button color="primary" style={{ borderRadius: 0 }} onClick={handleAdd}>
                          <i className="mdi mdi-plus me-1"></i> Add New
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>

                {loading && (
                  <div className="text-center my-5">
                    <Spinner color="primary" />
                    <p className="mt-2 text-muted">Loading data...</p>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bx bx-error-circle me-2"></i>
                    {error}
                  </div>
                )}

                {!loading && tableData.length === 0 && (
                  <div className="alert alert-info" role="alert">
                    <i className="bx bx-info-circle me-2"></i>
                    No {formatTableName(table)} found. Click "Add New" to create one.
                  </div>
                )}

                {!loading && !error && tableData.length !== 0 && (
                  <TableContainer
                    columns={columns}
                    data={tableData || []}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder={`Search ${formatTableName(table)}...`}
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Merged LookupDialog */}
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

        <Modal isOpen={showDialog} toggle={handleClose} centered size="md" backdrop="static">
          <ModalHeader toggle={handleClose}>
            <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
            {editItem ? "Edit" : "Add New"} {formatTableName(table)}
          </ModalHeader>

          <Form onSubmit={handleSubmit(handleSave)}>
            <ModalBody>
              <FormGroup>
                <Label for="name">
                  Name <span className="text-danger">*</span>
                </Label>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: "Name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" },
                    maxLength: { value: 100, message: "Name must not exceed 100 characters" },
                    pattern: {
                      value: /^[a-zA-Z0-9\s\-_.,()]+$/,
                      message: "Name contains invalid characters",
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      id="name"
                      placeholder="Enter name"
                      invalid={!!errors.name}
                      innerRef={nameInputRef}
                      {...field}
                    />
                  )}
                />
                {errors.name && <FormFeedback>{errors.name.message}</FormFeedback>}
              </FormGroup>
            </ModalBody>

            <ModalFooter className="d-flex justify-content-between">
              <div>
                {editItem && !isOrgExecutive && (
                  <Button color="danger" onClick={handleDeleteClick} disabled={isSubmitting}>
                    <i className="bx bx-trash me-1"></i> Delete
                  </Button>
                )}
              </div>

              <div>
                <Button
                  color="light"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="me-2"
                >
                  <i className="bx bx-x label-icon"></i> Cancel
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
          title={`Delete ${formatTableName(table)}`}
          message={deleteItem?.message}
          itemName={deleteItem?.name}
          itemType={deleteItem?.type}
          loading={deleteLoading}
        />

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Container>
    </div>
  );
};

export default TableView;
