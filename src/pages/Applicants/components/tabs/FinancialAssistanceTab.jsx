import React, { useState, useMemo } from "react";
import { Button } from "reactstrap";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../../helpers/userStorage";
import FinancialAssistanceModal from "../FinancialAssistanceModal";

const FinancialAssistanceTab = ({ applicantId, applicant, relationships = [], financialAssistance, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState(null);

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  const toggleAssistanceModal = () => {
    setAssistanceModalOpen((prev) => {
      if (prev) {
        setSelectedAssistance(null);
      }
      return !prev;
    });
  };

  const handleAdd = () => {
    setSelectedAssistance(null);
    setAssistanceModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedAssistance(item);
    setAssistanceModalOpen(true);
  };

  const handleSaveAssistance = async (formValues, editItem) => {
    try {
      const currentUser = getHudasaUser();

      const payload = {
        file_id: applicantId,
        assistance_type: formValues.Assistance_Type ? parseInt(formValues.Assistance_Type, 10) : null,
        financial_amount: formValues.Financial_Amount ? parseFloat(formValues.Financial_Amount) : 0,
        date_of_assistance: formValues.Date_of_Assistance || null,
        assisted_by: formValues.Assisted_By ? parseInt(formValues.Assisted_By, 10) : null,
        sector: formValues.Sector || "",
        program: formValues.Program || "",
        project: formValues.Project || "",
        give_to: formValues.Give_To || "",
      };

      // 🔹 Auto-attach created_by / updated_by fields from localStorage
      const persistedUser = JSON.parse(localStorage.getItem("UmmahAidUser"));
      if (editItem) {
        payload.updated_by = persistedUser?.username || currentUser?.username || getAuditName();
        await axiosApi.put(`${API_BASE_URL}/financialAssistance/${editItem.id}`, payload);
        showAlert("Financial assistance has been updated successfully", "success");
      } else {
        payload.created_by = persistedUser?.username || currentUser?.username || getAuditName();
        await axiosApi.post(`${API_BASE_URL}/financialAssistance`, payload);
        showAlert("Financial assistance has been added successfully", "success");
      }

      onUpdate();
      return true;
    } catch (error) {
      console.error("Error saving financial assistance:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
      throw error;
    }
  };

  const handleDelete = () => {
    if (!selectedAssistance) return;

    const assistanceName = `${getLookupName(lookupData?.assistanceTypes || [], selectedAssistance.assistance_type)} - ${
      selectedAssistance.financial_amount || "Unknown Amount"
    }`;
    
    showDeleteConfirmation({
      id: selectedAssistance.id,
      name: assistanceName,
      type: "financial assistance",
      message: "This financial assistance record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/financialAssistance/${selectedAssistance.id}`);
      showAlert("Financial assistance has been deleted successfully", "success");
      onUpdate();
      setAssistanceModalOpen(false);
      setSelectedAssistance(null);
    });
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
  };

  const recipientOptions = useMemo(() => {
    const options = [];
    const sanitize = (value) => (value || "").replace(/\s+/g, " ").trim();

    if (applicant) {
      const applicantName = sanitize(`${applicant?.name || ""} ${applicant?.surname || ""}`) || sanitize(applicant?.preferred_name) || "Applicant";
      options.push({
        key: `applicant-${applicant?.id ?? "self"}`,
        value: applicantName,
        label: `${applicantName} (Applicant)`,
      });
    }

    (relationships || []).forEach((rel) => {
      const relName = sanitize(`${rel?.name || ""} ${rel?.surname || ""}`) || sanitize(rel?.relative_name) || "Unknown";
      const relationshipTypeName = getLookupName(lookupData?.relationshipTypes || [], rel?.relationship_type);
      options.push({
        key: `relationship-${rel?.id ?? relName}`,
        value: relName,
        label: relationshipTypeName && relationshipTypeName !== "-" ? `${relName} (${relationshipTypeName})` : relName,
      });
    });

    return options;
  }, [applicant, relationships, lookupData?.relationshipTypes]);

  const columns = useMemo(
    () => [
      {
        header: "Assistance Type",
        accessorKey: "assistance_type",
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
            {getLookupName(lookupData.assistanceTypes, cell.getValue())}
          </span>
        ),
      },
      {
        header: "Date",
        accessorKey: "date_of_assistance",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Amount",
        accessorKey: "financial_amount",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const amount = parseFloat(cell.getValue()) || 0;
          return `R ${amount.toFixed(2)}`;
        },
      },
      {
        header: "Assisted By",
        accessorKey: "assisted_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const empId = cell.getValue();
          const emp = (lookupData.employees || []).find((e) => e.id == empId);
          return emp ? `${emp.name || ''} ${emp.surname || ''}`.trim() : "-";
        },
      },
      {
        header: "Sector",
        accessorKey: "sector",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Program",
        accessorKey: "program",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Project",
        accessorKey: "project",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Given To",
        accessorKey: "give_to",
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
        <h5 className="mb-0">Financial Assistance</h5>
        {!isOrgExecutive && (
          <div className="d-flex gap-2">
            <Button color="primary" size="sm" onClick={handleAdd}>
              <i className="bx bx-plus me-1"></i> Add Financial Assistance
            </Button>
          </div>
        )}
      </div>

      {financialAssistance.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No financial assistance records found. Click "Add Financial Assistance" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={financialAssistance}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      <FinancialAssistanceModal
        isOpen={assistanceModalOpen}
        toggle={toggleAssistanceModal}
        lookupData={lookupData}
        recipientOptions={recipientOptions}
        isOrgExecutive={isOrgExecutive}
        editItem={selectedAssistance}
        onSave={handleSaveAssistance}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Financial Assistance"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default FinancialAssistanceTab;

