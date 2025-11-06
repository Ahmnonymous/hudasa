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
  Alert,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getAuditName } from "../../../../helpers/userStorage";

const MaintenanceTab = ({ centerId, maintenance, onUpdate, showAlert, lookupData = {} }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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

  useEffect(() => {
    if (editItem && modalOpen) {
      reset({
        type_of_maintenance: editItem.type_of_maintenance || "",
        date_of_maintenance: editItem.date_of_maintenance || "",
        description_of_maintenance: editItem.description_of_maintenance || "",
        cost: editItem.cost || "",
        supplier: editItem.supplier || "",
      });
      setSelectedFile(null);
    } else if (modalOpen) {
      reset({
        type_of_maintenance: "",
        date_of_maintenance: "",
        description_of_maintenance: "",
        cost: "",
        supplier: "",
      });
      setSelectedFile(null);
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setEditItem(null);
      setSelectedFile(null);
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleFileChange = (e, onChange) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onChange(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getLookupName = (lookupArray, name) => {
    if (!name) return "-";
    const item = lookupArray?.find((l) => l.name === name);
    return item ? item.name : name;
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key !== "upload" && data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      if (selectedFile) {
        formData.append("upload", selectedFile);
        formData.append("upload_filename", selectedFile.name);
        formData.append("upload_mime", selectedFile.type);
        formData.append("upload_size", selectedFile.size);
      }

      formData.append("center_detail_id", centerId);
      formData.append("created_by", getAuditName());
      formData.append("updated_by", getAuditName());

      if (editItem) {
        formData.append("updated_by", getAuditName());
        await axiosApi.put(
          `${API_BASE_URL}/maintenance/${editItem.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        showAlert("Maintenance record updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/maintenance`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Maintenance record created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving maintenance:", error);
      showAlert(
        error.response?.data?.error || "Failed to save maintenance record",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const recordName = editItem.type_of_maintenance || 'Unknown Type';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: recordName,
      type: "maintenance record",
      message: "This maintenance record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/maintenance/${editItem.id}`);
      showAlert("Maintenance record deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        id: "type_of_maintenance",
        header: "Type",
        accessorKey: "type_of_maintenance",
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
            {getLookupName(lookupData?.maintenanceTypes, cell.getValue())}
          </span>
        ),
      },
      {
        id: "date_of_maintenance",
        header: "Date",
        accessorKey: "date_of_maintenance",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        id: "cost",
        header: "Cost",
        accessorKey: "cost",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const cost = cell.getValue();
          return cost ? `R ${parseFloat(cost).toFixed(2)}` : "-";
        },
      },
      {
        id: "supplier",
        header: "Supplier",
        accessorKey: "supplier",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "upload_filename",
        header: "Upload",
        accessorKey: "upload_filename",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const filename = cell.getValue();
          const rowId = cell.row.original.id;
          return filename ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/maintenance/${rowId}/upload`}
                target="_blank"
                rel="noopener noreferrer"
                title="View"
              >
                <i
                  className="bx bx-show text-success"
                  style={{ cursor: "pointer", fontSize: "16px" }}
                ></i>
              </a>
            </div>
          ) : (
            "-"
          );
        },
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
      {
        id: "updated_by",
        header: "Updated By",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        id: "updated_at",
        header: "Updated On",
        accessorKey: "updated_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    [lookupData, handleEdit]
  );

  if (!centerId) {
    return (
      <Alert color="info" className="d-flex align-items-center">
        <i className="bx bx-info-circle font-size-16 me-2"></i>
        Please select a center to view maintenance records.
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Maintenance Records</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Maintenance
          </Button>
        )}
      </div>

      {maintenance.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No maintenance records found. Click "Add Maintenance" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={maintenance}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      <Modal
        isOpen={modalOpen}
        toggle={toggleModal}
        centered
        backdrop="static"
        size="lg"
      >
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Maintenance Record
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="type_of_maintenance">Type of Maintenance</Label>
                  <Controller
                    name="type_of_maintenance"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="type_of_maintenance"
                        type="select"
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select maintenance type</option>
                        {(lookupData?.maintenanceTypes || []).map((type) => (
                          <option key={type.id || type.name} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="date_of_maintenance">Date of Maintenance</Label>
                  <Controller
                    name="date_of_maintenance"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="date_of_maintenance"
                        type="date"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="description_of_maintenance">Description</Label>
                  <Controller
                    name="description_of_maintenance"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="description_of_maintenance"
                        type="textarea"
                        rows="3"
                        placeholder="Describe the maintenance work"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="cost">Cost</Label>
                  <Controller
                    name="cost"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="supplier">Supplier</Label>
                  <Controller
                    name="supplier"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="supplier"
                        type="text"
                        placeholder="Supplier name"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="upload">
                    {editItem ? "Replace Upload (Optional)" : "Upload Document"}
                  </Label>
                  <Controller
                    name="upload"
                    control={control}
                    render={({ field: { onChange, ...field } }) => (
                      <Input
                        id="upload"
                        type="file"
                        disabled={isOrgExecutive}
                        onChange={(e) => handleFileChange(e, onChange)}
                        {...field}
                      />
                    )}
                  />
                  {selectedFile && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{selectedFile.name}</div>
                          <small className="text-muted">
                            {formatFileSize(selectedFile.size)} • Selected file
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  {editItem?.upload_filename && !selectedFile && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bx bx-file font-size-24 text-primary me-2"></i>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{editItem.upload_filename || "upload"}</div>
                          <small className="text-muted">
                            {editItem.upload_size ? formatFileSize(editItem.upload_size) : ""} • Current file
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </FormGroup>
              </Col>
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
        title="Delete Maintenance Record"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default MaintenanceTab;

