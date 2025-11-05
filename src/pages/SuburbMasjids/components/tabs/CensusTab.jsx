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
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser } from "../../../../helpers/userStorage";

const CensusTab = ({ masjidId, suburbId, census, onUpdate, showAlert, lookupData = {} }) => {
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

  useEffect(() => {
    if (editItem && modalOpen) {
      reset({
        population_size: editItem.population_size || "",
        muslim_population_size: editItem.muslim_population_size || "",
      });
    } else if (modalOpen) {
      reset({
        population_size: "",
        muslim_population_size: "",
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
      const currentUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      const formData = {
        ...data,
        suburb_id: suburbId,
        created_by: currentUser?.username || "system",
        updated_by: currentUser?.username || "system",
      };

      if (editItem) {
        await axiosApi.put(`${API_BASE_URL}/suburbCensus/${editItem.id}`, formData);
        showAlert("Census record updated successfully", "success");
      } else {
        await axiosApi.post(`${API_BASE_URL}/suburbCensus`, formData);
        showAlert("Census record created successfully", "success");
      }

      toggleModal();
      onUpdate();
    } catch (error) {
      console.error("Error saving census:", error);
      showAlert(
        error.response?.data?.error || "Failed to save census record",
        "danger"
      );
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const recordName = editItem.population_size || 'Unknown Population';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: recordName,
      type: "census record",
      message: "This census record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/suburbCensus/${editItem.id}`);
      showAlert("Census record deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Population Size",
        accessorKey: "population_size",
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
            {cell.getValue() || "-"}
          </span>
        ),
      },
      {
        header: "Muslim Population Size",
        accessorKey: "muslim_population_size",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
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
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
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
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    [handleEdit]
  );

  if (!masjidId || !suburbId) {
    return (
      <Alert color="info" className="d-flex align-items-center">
        <i className="bx bx-info-circle font-size-16 me-2"></i>
        Please select a masjid to view census records.
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Census Records</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Census
          </Button>
        )}
      </div>

      {census.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No census records found. Click "Add Census" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={census}
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
          {editItem ? "Edit" : "Add"} Census Record
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="population_size">Population Size</Label>
                  <Controller
                    name="population_size"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="population_size"
                        type="text"
                        placeholder="e.g., 50000"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="muslim_population_size">Muslim Population Size</Label>
                  <Controller
                    name="muslim_population_size"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="muslim_population_size"
                        type="text"
                        placeholder="e.g., 10000"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
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
        title="Delete Census Record"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default CensusTab;

