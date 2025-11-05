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
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";

const RelationshipsTab = ({ applicantId, relationships, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

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
  } = useForm();

  useEffect(() => {
    if (modalOpen) {
      reset({
        Relationship_Type: editItem?.relationship_type || "",
        Name: editItem?.name || "",
        Surname: editItem?.surname || "",
        ID_Number: editItem?.id_number || "",
        Date_of_Birth: editItem?.date_of_birth || "",
        Employment_Status: editItem?.employment_status || "",
        Gender: editItem?.gender || "",
        Highest_Education: editItem?.highest_education || "",
        Health_Condition: editItem?.health_condition || "",
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
    setEditItem(item);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();

      const payload = {
        file_id: applicantId,
        relationship_type: data.Relationship_Type ? parseInt(data.Relationship_Type) : null,
        name: data.Name,
        surname: data.Surname,
        id_number: data.ID_Number,
        date_of_birth: data.Date_of_Birth || null,
        employment_status: data.Employment_Status ? parseInt(data.Employment_Status) : null,
        gender: data.Gender ? parseInt(data.Gender) : null,
        highest_education: data.Highest_Education ? parseInt(data.Highest_Education) : null,
        health_condition: data.Health_Condition ? parseInt(data.Health_Condition) : null,
      };

      if (editItem) {
        payload.updated_by = getAuditName();
        await axiosApi.put(`${API_BASE_URL}/relationships/${editItem.id}`, payload);
        showAlert("Relationship has been updated successfully", "success");
      } else {
        payload.created_by = getAuditName();
        await axiosApi.post(`${API_BASE_URL}/relationships`, payload);
        showAlert("Relationship has been added successfully", "success");
      }

      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving relationship:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const relationshipName = `${editItem.relative_name || 'Unknown Name'} - ${getLookupName(lookupData.relationshipTypes, editItem.relationship_type)}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: relationshipName,
      type: "relationship",
      message: "This relationship record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/relationships/${editItem.id}`);
      showAlert("Relationship has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
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
            style={{ cursor: "pointer", color: "inherit" }}
            onClick={() => handleEdit(cell.row.original)}
            onMouseOver={(e) => {
              e.currentTarget.classList.add('text-primary', 'text-decoration-underline');
            }}
            onMouseOut={(e) => {
              e.currentTarget.classList.remove('text-primary', 'text-decoration-underline');
            }}
          >
            {cell.getValue()} {cell.row.original.surname}
          </span>
        ),
      },
      {
        header: "Relationship",
        accessorKey: "relationship_type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(lookupData.relationshipTypes, cell.getValue()),
      },
      {
        header: "ID Number",
        accessorKey: "id_number",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Date of Birth",
        accessorKey: "date_of_birth",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const dob = cell.getValue();
          return dob ? new Date(dob).toLocaleDateString() : "-";
        },
      },
      {
        header: "Gender",
        accessorKey: "gender",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(lookupData.gender, cell.getValue()),
      },
      {
        header: "Employment Status",
        accessorKey: "employment_status",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(lookupData.employmentStatus, cell.getValue()),
      },
      {
        header: "Highest Education",
        accessorKey: "highest_education",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(lookupData.educationLevel, cell.getValue()),
      },
      {
        header: "Health Condition",
        accessorKey: "health_condition",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => getLookupName(lookupData.healthConditions, cell.getValue()),
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
    [lookupData, handleEdit]
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Relationships</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Relationship
          </Button>
        )}
      </div>

      {relationships.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No relationships found. Click "Add Relationship" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={relationships}
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
          {editItem ? "Edit" : "Add"} Relationship
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Relationship_Type">
                    Relationship Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Relationship_Type"
                    control={control}
                    rules={{ required: "Relationship type is required" }}
                    render={({ field }) => (
                      <Input id="Relationship_Type" type="select" invalid={!!errors.Relationship_Type} disabled={isOrgExecutive} {...field}>
                        <option value="">Select Type</option>
                        {lookupData.relationshipTypes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.Relationship_Type && <FormFeedback>{errors.Relationship_Type.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Name">
                    Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Name"
                    control={control}
                    rules={{ required: "Name is required" }}
                    render={({ field }) => <Input id="Name" type="text" invalid={!!errors.Name} disabled={isOrgExecutive} {...field} />}
                  />
                  {errors.Name && <FormFeedback>{errors.Name.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Surname">
                    Surname <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Surname"
                    control={control}
                    rules={{ required: "Surname is required" }}
                    render={({ field }) => <Input id="Surname" type="text" invalid={!!errors.Surname} disabled={isOrgExecutive} {...field} />}
                  />
                  {errors.Surname && <FormFeedback>{errors.Surname.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="ID_Number">ID Number</Label>
                  <Controller
                    name="ID_Number"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^\d{13}$/,
                        message: "ID Number must be exactly 13 digits",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        id="ID_Number"
                        type="text"
                        maxLength={13}
                        onInput={(e) => {
                          e.target.value = (e.target.value || "").replace(/\D/g, "").slice(0, 13);
                          field.onChange(e);
                        }}
                        value={field.value}
                        onBlur={field.onBlur}
                        invalid={!!errors.ID_Number}
                        disabled={isOrgExecutive}
                      />
                    )}
                  />
                  {errors.ID_Number && <FormFeedback>{errors.ID_Number.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Date_of_Birth">Date of Birth</Label>
                  <Controller
                    name="Date_of_Birth"
                    control={control}
                    render={({ field }) => <Input id="Date_of_Birth" type="date" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Gender">Gender</Label>
                  <Controller
                    name="Gender"
                    control={control}
                    render={({ field }) => (
                      <Input id="Gender" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Gender</option>
                        {lookupData.gender.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Employment_Status">Employment Status</Label>
                  <Controller
                    name="Employment_Status"
                    control={control}
                    render={({ field }) => (
                      <Input id="Employment_Status" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Status</option>
                        {lookupData.employmentStatus.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Highest_Education">Highest Education</Label>
                  <Controller
                    name="Highest_Education"
                    control={control}
                    render={({ field }) => (
                      <Input id="Highest_Education" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Level</option>
                        {lookupData.educationLevel.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Health_Condition">Health Condition</Label>
                  <Controller
                    name="Health_Condition"
                    control={control}
                    render={({ field }) => (
                      <Input id="Health_Condition" type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select Condition</option>
                        {lookupData.healthConditions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
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
        title="Delete Relationship"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default RelationshipsTab;

