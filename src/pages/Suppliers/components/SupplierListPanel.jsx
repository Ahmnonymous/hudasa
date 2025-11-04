import React from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Spinner,
} from "reactstrap";
import { useRole } from "../../../helpers/useRole";

const SupplierListPanel = ({
  suppliers,
  selectedSupplier,
  onSelectSupplier,
  searchTerm,
  onSearchChange,
  loading,
  onRefresh,
  onCreateClick,
}) => {
  const { isOrgExecutive } = useRole();

  return (
    <Card className="border shadow-sm h-100">
      <CardBody className="p-0 d-flex flex-column">
        {/* Header */}
        <div className="p-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="card-title mb-0 fw-semibold font-size-14">
                <i className="bx bx-store me-2 text-primary"></i>
                Suppliers List
              </h6>
            </div>
            {/* Hide Add button for Org Executive (view-only) */}
            {!isOrgExecutive && (
              <Button 
                color="primary" 
                size="sm" 
                onClick={onCreateClick} 
                className="btn-sm"
                title="Create New Supplier"
              >
                <i className="bx bx-plus font-size-12"></i>
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="position-relative">
            <Input
              type="text"
              placeholder="Search by name or registration..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-control form-control-sm"
            />
            <i className="bx bx-search-alt position-absolute top-50 end-0 translate-middle-y me-3 text-muted font-size-14"></i>
          </div>
        </div>

        {/* Supplier List - Fixed Height Scrollable */}
        <div className="flex-grow-1 p-3" style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}>
          {loading && (
            <div className="text-center py-4">
              <Spinner color="primary" size="sm" />
              <p className="mt-2 text-muted font-size-12">Loading...</p>
            </div>
          )}

          {!loading && suppliers.length === 0 && (
            <div className="text-center py-4">
              <i className="bx bx-search-alt font-size-24 text-muted mb-2"></i>
              <h6 className="font-size-13 mb-1">No Suppliers Found</h6>
              <p className="text-muted mb-0 font-size-11">Try adjusting your search</p>
            </div>
          )}

          {!loading && suppliers.length > 0 && (
            <div className="d-flex flex-column gap-2">
              {suppliers.map((supplier, index) => {
                const isSelected = selectedSupplier?.id === supplier.id;
                return (
                  <div
                    key={supplier.id}
                    className={`rounded border ${
                      isSelected 
                        ? 'border-primary bg-primary text-white shadow-sm' 
                        : 'border-light'
                    }`}
                    onClick={() => onSelectSupplier(supplier)}
                    style={{ 
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      padding: "12px 16px",
                      color: "inherit"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.classList.add('bg-light', 'border-primary', 'shadow-sm');
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.classList.remove('bg-light', 'border-primary', 'shadow-sm');
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <h6 className={`mb-1 font-size-13 fw-semibold ${
                          isSelected ? 'text-white' : ''
                        }`} style={{ color: "inherit" }}>
                          {supplier.name}
                        </h6>
                        <p className={`mb-0 font-size-11 ${
                          isSelected ? 'text-white-50' : 'text-muted'
                        }`}>
                          {supplier.registration_no || supplier.contact_person || "N/A"}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <i className="bx bx-check-circle font-size-16 text-white"></i>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default SupplierListPanel;