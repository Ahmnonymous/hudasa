import React from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Spinner,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../../helpers/useRole";

const ApplicantListPanel = ({
  applicants,
  selectedApplicant,
  onSelectApplicant,
  searchTerm,
  onSearchChange,
  loading,
  onRefresh,
}) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const navigate = useNavigate();

  return (
    <Card className="border shadow-sm h-100">
      <CardBody className="p-0 d-flex flex-column">
        {/* Header */}
        <div className="p-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="card-title mb-0 fw-semibold font-size-14">
              <i className="bx bx-user me-2 text-primary"></i>
                Applicant List
              </h6>
            </div>
            {!isOrgExecutive && (
              <Button 
                color="primary" 
                size="sm" 
                onClick={() => navigate("/applicants/create")} 
                className="btn-sm"
                title="Create New Applicant"
              >
                <i className="bx bx-plus font-size-12"></i>
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="position-relative">
            <Input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-control form-control-sm"
            />
            <i className="bx bx-search-alt position-absolute top-50 end-0 translate-middle-y me-3 text-muted font-size-14"></i>
          </div>
        </div>

        {/* Applicant List - Fixed Height Scrollable */}
        <div className="flex-grow-1 p-3" style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}>
          {loading && (
            <div className="text-center py-4">
              <Spinner color="primary" size="sm" />
              <p className="mt-2 text-muted font-size-12">Loading...</p>
            </div>
          )}

          {!loading && applicants.length === 0 && (
            <div className="text-center py-4">
              <i className="bx bx-search-alt font-size-24 text-muted mb-2"></i>
              <h6 className="font-size-13 mb-1">No Applicants Found</h6>
              <p className="text-muted mb-0 font-size-11">Try adjusting your search</p>
            </div>
          )}

          {!loading && applicants.length > 0 && (
            <div className="d-flex flex-column gap-2">
              {applicants.map((applicant, index) => {
                const isSelected = selectedApplicant?.id === applicant.id;
                return (
                  <div
                    key={applicant.id}
                    className={`rounded border ${
                      isSelected 
                        ? 'border-primary bg-primary text-white shadow-sm' 
                        : 'border-light'
                    }`}
                    onClick={() => onSelectApplicant(applicant)}
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
                          {applicant.name} {applicant.surname}
                        </h6>
                        <p className={`mb-0 font-size-11 ${
                          isSelected ? 'text-white-50' : 'text-muted'
                        }`}>
                          {applicant.id_number || "N/A"}
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

export default ApplicantListPanel;
