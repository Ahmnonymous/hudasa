import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
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
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useForm, Controller } from "react-hook-form";
import DeleteConfirmationModal from "../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../helpers/useRole";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../../helpers/userStorage";
import { sanitizeTenDigit, tenDigitRule } from "../../../helpers/phone";

const ApplicantSummary = ({ applicant, lookupData, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const signatureCanvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [hideExistingSignature, setHideExistingSignature] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");

  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Map pointer to canvas coordinate space (fix cursor/draw offset when canvas is CSS-scaled)
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const startSignature = (e) => {
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const { x, y } = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsSigning(true);
    setSignatureDrawn(true);
  };

  const drawSignature = (e) => {
    if (!isSigning) return;
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endSignature = (e) => {
    if (!isSigning) return;
    e.preventDefault();
    setIsSigning(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDrawn(false);
  };

  const dataURLToBlob = (dataURL) => {
    const parts = dataURL.split(",");
    const byteString = atob(parts[1]);
    const mimeString = parts[0].match(/:(.*?);/)[1];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
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
    watch,
  } = useForm();

  useEffect(() => {
    if (applicant && modalOpen) {
      reset({
        Name: applicant.name || "",
        Surname: applicant.surname || "",
        ID_Number: applicant.id_number || "",
        Race: applicant.race || "",
        Nationality: applicant.nationality || "",
        Nationality_Expiry_Date: applicant.nationality_expiry_date || "",
        Gender: applicant.gender || "",
        Born_Religion_ID: applicant.born_religion_id || "",
        Period_As_Muslim_ID: applicant.period_as_muslim_id || "",
        File_Number: applicant.file_number || "",
        File_Condition: applicant.file_condition || "",
        File_Status: applicant.file_status || "",
        Date_Intake: applicant.date_intake || "",
        Highest_Education_Level: applicant.highest_education_level || "",
        Marital_Status: applicant.marital_status || "",
        Employment_Status: applicant.employment_status || "",
        Cell_Number: applicant.cell_number || "",
        Alternate_Number: applicant.alternate_number || "",
        Email_Address: applicant.email_address || "",
        Suburb: applicant.suburb || "",
        Street_Address: applicant.street_address || "",
        Dwelling_Type: applicant.dwelling_type || "",
        Flat_Name: applicant.flat_name || "",
        Flat_Number: applicant.flat_number || "",
        Dwelling_Status: applicant.dwelling_status || "",
        Health: applicant.health || "",
        Skills: applicant.skills || "",
        POPIA_Agreement: applicant.popia_agreement === "Y",
        Signature: null,
      });
      setHideExistingSignature(false);
      // Load existing signature preview via authenticated request
      const hasExisting = applicant && (applicant.signature === 'exists' || applicant.signature_filename);
      if (hasExisting) {
        axiosApi
          .get(`${API_BASE_URL}/applicantDetails/${applicant.id}/download-signature`, { responseType: 'blob' })
          .then((res) => {
            const url = URL.createObjectURL(res.data);
            setSignaturePreviewUrl(url);
          })
          .catch(() => {
            setSignaturePreviewUrl("");
            setHideExistingSignature(true);
          });
      } else {
        setSignaturePreviewUrl("");
      }
    }
    return () => {
      if (signaturePreviewUrl) URL.revokeObjectURL(signaturePreviewUrl);
    };
  }, [applicant, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setActiveTab("1");
    }
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getHudasaUser();
      let signatureBlob = null;
      if (signatureCanvasRef.current && signatureDrawn) {
        const dataUrl = signatureCanvasRef.current.toDataURL("image/png");
        signatureBlob = dataURLToBlob(dataUrl);
      }
      const hasSignature = !!signatureBlob;

      if (hasSignature) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("name", data.Name || "");
        formData.append("surname", data.Surname || "");
        formData.append("id_number", data.ID_Number || "");
        
        if (data.Race && data.Race !== "") formData.append("race", data.Race);
        if (data.Nationality && data.Nationality !== "") formData.append("nationality", data.Nationality);
        if (data.Nationality_Expiry_Date) formData.append("nationality_expiry_date", data.Nationality_Expiry_Date);
        if (data.Gender && data.Gender !== "") formData.append("gender", data.Gender);
        if (data.Born_Religion_ID && data.Born_Religion_ID !== "") formData.append("born_religion_id", data.Born_Religion_ID);
        if (data.Period_As_Muslim_ID && data.Period_As_Muslim_ID !== "") formData.append("period_as_muslim_id", data.Period_As_Muslim_ID);
        
        formData.append("file_number", data.File_Number || "");
        if (data.File_Condition && data.File_Condition !== "") formData.append("file_condition", data.File_Condition);
        if (data.File_Status && data.File_Status !== "") formData.append("file_status", data.File_Status);
        if (data.Date_Intake) formData.append("date_intake", data.Date_Intake);
        if (data.Highest_Education_Level && data.Highest_Education_Level !== "") formData.append("highest_education_level", data.Highest_Education_Level);
        if (data.Marital_Status && data.Marital_Status !== "") formData.append("marital_status", data.Marital_Status);
        if (data.Employment_Status && data.Employment_Status !== "") formData.append("employment_status", data.Employment_Status);
        
        formData.append("cell_number", data.Cell_Number || "");
        formData.append("alternate_number", data.Alternate_Number || "");
        formData.append("email_address", data.Email_Address || "");
        if (data.Suburb && data.Suburb !== "") formData.append("suburb", data.Suburb);
        formData.append("street_address", data.Street_Address || "");
        if (data.Dwelling_Type && data.Dwelling_Type !== "") formData.append("dwelling_type", data.Dwelling_Type);
        formData.append("flat_name", data.Flat_Name || "");
        formData.append("flat_number", data.Flat_Number || "");
        if (data.Dwelling_Status && data.Dwelling_Status !== "") formData.append("dwelling_status", data.Dwelling_Status);
        if (data.Health && data.Health !== "") formData.append("health", data.Health);
        if (data.Skills && data.Skills !== "") formData.append("skills", data.Skills);
        
        formData.append("signature", signatureBlob, "signature.png");
        formData.append("popia_agreement", data.POPIA_Agreement ? "Y" : "N");
        formData.append("updated_by", currentUser?.username || "system");

        await axiosApi.put(`${API_BASE_URL}/applicantDetails/${applicant.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Use regular JSON payload
        const payload = {
          name: data.Name,
          surname: data.Surname,
          id_number: data.ID_Number,
          race: data.Race && data.Race !== "" ? parseInt(data.Race) : null,
          nationality: data.Nationality && data.Nationality !== "" ? parseInt(data.Nationality) : null,
          nationality_expiry_date: data.Nationality_Expiry_Date || null,
          gender: data.Gender && data.Gender !== "" ? parseInt(data.Gender) : null,
          born_religion_id: data.Born_Religion_ID && data.Born_Religion_ID !== "" ? parseInt(data.Born_Religion_ID) : null,
          period_as_muslim_id: data.Period_As_Muslim_ID && data.Period_As_Muslim_ID !== "" ? parseInt(data.Period_As_Muslim_ID) : null,
          file_number: data.File_Number,
          file_condition: data.File_Condition && data.File_Condition !== "" ? parseInt(data.File_Condition) : null,
          file_status: data.File_Status && data.File_Status !== "" ? parseInt(data.File_Status) : null,
          date_intake: data.Date_Intake || null,
          highest_education_level: data.Highest_Education_Level && data.Highest_Education_Level !== "" ? parseInt(data.Highest_Education_Level) : null,
          marital_status: data.Marital_Status && data.Marital_Status !== "" ? parseInt(data.Marital_Status) : null,
          employment_status: data.Employment_Status && data.Employment_Status !== "" ? parseInt(data.Employment_Status) : null,
          cell_number: data.Cell_Number || null,
          alternate_number: data.Alternate_Number || null,
          email_address: data.Email_Address || null,
          suburb: data.Suburb && data.Suburb !== "" ? parseInt(data.Suburb) : null,
          street_address: data.Street_Address || null,
          dwelling_type: data.Dwelling_Type && data.Dwelling_Type !== "" ? parseInt(data.Dwelling_Type) : null,
          flat_name: data.Flat_Name || null,
          flat_number: data.Flat_Number || null,
          dwelling_status: data.Dwelling_Status && data.Dwelling_Status !== "" ? parseInt(data.Dwelling_Status) : null,
          health: data.Health && data.Health !== "" ? parseInt(data.Health) : null,
          skills: data.Skills && data.Skills !== "" ? parseInt(data.Skills) : null,
          popia_agreement: data.POPIA_Agreement ? "Y" : "N",
          updated_by: getAuditName(),
        };

        await axiosApi.put(`${API_BASE_URL}/applicantDetails/${applicant.id}`, payload);
      }
      
      showAlert("Applicant has been updated successfully", "success");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error updating applicant:", error);
      showAlert(error?.response?.data?.message || "Failed to update applicant", "danger");
    }
  };

  const handleDelete = () => {
    const applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || 'Unknown Applicant';
    
    showDeleteConfirmation({
      id: applicant.id,
      name: applicantName,
      type: "applicant",
      message: "This applicant and all associated data will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/applicantDetails/${applicant.id}`);
      showAlert("Applicant has been deleted successfully", "success");
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  return (
    <>
      <Card className="border shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0 fw-semibold font-size-16">
              <i className="bx bx-user me-2 text-primary"></i>
              Applicant Summary
              {isOrgExecutive && <span className="ms-2 badge bg-info">Read Only</span>}
            </h5>
            {!isOrgExecutive && (
              <Button color="primary" size="sm" onClick={toggleModal} className="btn-sm">
                <i className="bx bx-edit-alt me-1"></i> Edit
              </Button>
            )}
          </div>
        </div>

        <CardBody className="py-3">
          {/* Flat summary grid: 4 fields per row */}
          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Name</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.name || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Surname</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.surname || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">File Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.file_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">ID Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.id_number || "-"}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Date Intake</p>
              <p className="mb-2 fw-medium font-size-12">{formatDate(applicant.date_intake)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Race</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.race, applicant.race)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Nationality</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.nationality, applicant.nationality)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Gender</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.gender, applicant.gender)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Marital Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.maritalStatus, applicant.marital_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Employment Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.employmentStatus, applicant.employment_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Born Religion</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.bornReligion, applicant.born_religion_id)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Period as Muslim</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.periodAsMuslim, applicant.period_as_muslim_id)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Cell Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.cell_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Alternate Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.alternate_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Email Address</p>
              <p className="mb-2 fw-medium font-size-12 text-break">{applicant.email_address || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Suburb</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.suburb, applicant.suburb)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Street Address</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.street_address || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Dwelling Type</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.dwellingType, applicant.dwelling_type)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Dwelling Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.dwellingStatus, applicant.dwelling_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Education Level</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.educationLevel, applicant.highest_education_level)}</p>
            </Col>
          </Row>

          <Row className="mb-0">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">File Condition</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.fileCondition, applicant.file_condition)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">File Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.fileStatus, applicant.file_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Health Condition</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.healthConditions, applicant.health)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Skills</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.skills, applicant.skills)}</p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="xl" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-edit me-2"></i>
          Edit Applicant - {applicant.name} {applicant.surname}
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "1" })}
                  onClick={() => toggleTab("1")}
                  style={{ cursor: "pointer" }}
                >
                  Personal Info
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "2" })}
                  onClick={() => toggleTab("2")}
                  style={{ cursor: "pointer" }}
                >
                  Contact & Address
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "3" })}
                  onClick={() => toggleTab("3")}
                  style={{ cursor: "pointer" }}
                >
                  File Details
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab} className="pt-3">
              <TabPane tabId="1">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Name <span className="text-danger">*</span></Label>
                      <Controller
                        name="Name"
                        control={control}
                        rules={{ required: "Name is required" }}
                        render={({ field }) => <Input type="text" invalid={!!errors.Name} {...field} />}
                      />
                      {errors.Name && <FormFeedback>{errors.Name.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Surname <span className="text-danger">*</span></Label>
                      <Controller
                        name="Surname"
                        control={control}
                        rules={{ required: "Surname is required" }}
                        render={({ field }) => <Input type="text" invalid={!!errors.Surname} {...field} />}
                      />
                      {errors.Surname && <FormFeedback>{errors.Surname.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>ID Number</Label>
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
                            type="text"
                            maxLength={13}
                            onInput={(e) => {
                              e.target.value = (e.target.value || "").replace(/\D/g, "").slice(0, 13);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.ID_Number}
                          />
                        )}
                      />
                      {errors.ID_Number && <FormFeedback>{errors.ID_Number.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Race</Label>
                      <Controller
                        name="Race"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Race</option>
                            {lookupData.race.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Nationality</Label>
                      <Controller
                        name="Nationality"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Nationality</option>
                            {lookupData.nationality.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  {(() => {
                    const selectedNationalityId = watch("Nationality");
                    const selected = lookupData.nationality.find((n) => String(n.id) === String(selectedNationalityId));
                    const isSouthAfrican = (selected?.name || "").toLowerCase() === "south african";
                    return !isSouthAfrican ? (
                      <Col md={4}>
                        <FormGroup>
                          <Label>Passport Expiry Date</Label>
                          <Controller
                            name="Nationality_Expiry_Date"
                            control={control}
                            render={({ field }) => <Input type="date" {...field} />}
                          />
                        </FormGroup>
                      </Col>
                    ) : null;
                  })()}
                  <Col md={4}>
                    <FormGroup>
                      <Label>Gender</Label>
                      <Controller
                        name="Gender"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
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
                  <Col md={4}>
                    <FormGroup>
                      <Label>Born Religion</Label>
                      <Controller
                        name="Born_Religion_ID"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Religion</option>
                            {lookupData.bornReligion.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  {(() => {
                    const bornRelId = watch("Born_Religion_ID");
                    const bornRel = lookupData.bornReligion.find((r) => String(r.id) === String(bornRelId));
                    const isIslam = (bornRel?.name || "").toLowerCase() === "islam";
                    if (isIslam) return null;
                    return (
                      <Col md={4}>
                        <FormGroup>
                          <Label>Period as Muslim</Label>
                          <Controller
                            name="Period_As_Muslim_ID"
                            control={control}
                            render={({ field }) => (
                              <Input type="select" {...field}>
                                <option value="">Select Period</option>
                                {lookupData.periodAsMuslim.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </Input>
                            )}
                          />
                        </FormGroup>
                      </Col>
                    );
                  })()}
                  <Col md={4}>
                    <FormGroup>
                      <Label>Education Level</Label>
                      <Controller
                        name="Highest_Education_Level"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
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
                  <Col md={4}>
                    <FormGroup>
                      <Label>Marital Status</Label>
                      <Controller
                        name="Marital_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Status</option>
                            {lookupData.maritalStatus.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Employment Status</Label>
                      <Controller
                        name="Employment_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
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
                  <Col md={4}>
                    <FormGroup>
                      <Label>Health Condition</Label>
                      <Controller
                        name="Health"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
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
                  <Col md={4}>
                    <FormGroup>
                      <Label>Skills</Label>
                      <Controller
                        name="Skills"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Skills</option>
                            {lookupData.skills.map((item) => (
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
              </TabPane>

              <TabPane tabId="2">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Cell Number</Label>
                      <Controller
                        name="Cell_Number"
                        control={control}
                        rules={tenDigitRule(false, "Cell Number")}
                        render={({ field }) => (
                          <Input
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Cell_Number}
                            {...field}
                          />
                        )}
                      />
                      {errors.Cell_Number && <FormFeedback>{errors.Cell_Number.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Alternate Number</Label>
                      <Controller
                        name="Alternate_Number"
                        control={control}
                        rules={tenDigitRule(false, "Alternate Number")}
                        render={({ field }) => (
                          <Input
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            onInput={(e) => {
                              e.target.value = sanitizeTenDigit(e.target.value);
                              field.onChange(e);
                            }}
                            value={field.value}
                            onBlur={field.onBlur}
                            invalid={!!errors.Alternate_Number}
                            {...field}
                          />
                        )}
                      />
                      {errors.Alternate_Number && <FormFeedback>{errors.Alternate_Number.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Email Address</Label>
                      <Controller
                        name="Email_Address"
                        control={control}
                        render={({ field }) => <Input type="email" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Suburb</Label>
                      <Controller
                        name="Suburb"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Suburb</option>
                            {lookupData.suburb.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Street Address</Label>
                      <Controller
                        name="Street_Address"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Dwelling Type</Label>
                      <Controller
                        name="Dwelling_Type"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Type</option>
                            {lookupData.dwellingType.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Dwelling Status</Label>
                      <Controller
                        name="Dwelling_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Status</option>
                            {lookupData.dwellingStatus.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  {(() => {
                    const selectedDwellingTypeId = watch("Dwelling_Type");
                    const selected = lookupData.dwellingType.find((d) => String(d.id) === String(selectedDwellingTypeId));
                    const isFlat = (selected?.name || "").toLowerCase() === "flat";
                    if (!isFlat) return null;
                    return (
                      <>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Flat Name</Label>
                            <Controller
                              name="Flat_Name"
                              control={control}
                              render={({ field }) => <Input type="text" {...field} />}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Flat Number</Label>
                            <Controller
                              name="Flat_Number"
                              control={control}
                              render={({ field }) => <Input type="text" {...field} />}
                            />
                          </FormGroup>
                        </Col>
                      </>
                    );
                  })()}
                </Row>
              </TabPane>

              <TabPane tabId="3">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>File Number</Label>
                      <Controller
                        name="File_Number"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>File Condition</Label>
                      <Controller
                        name="File_Condition"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Condition</option>
                            {lookupData.fileCondition.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>File Status</Label>
                      <Controller
                        name="File_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Status</option>
                            {lookupData.fileStatus.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Date Intake</Label>
                      <Controller
                        name="Date_Intake"
                        control={control}
                        render={({ field }) => <Input type="date" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Signature</Label>
                      {/* Existing signature preview (if available) */}
                      {(() => {
                        const hasExisting = !!signaturePreviewUrl && !hideExistingSignature && !signatureDrawn;
                        if (!hasExisting) return null;
                        return (
                          <div className="mb-2">
                            <small className="text-muted d-block mb-1">Current signature</small>
                            <img
                              src={signaturePreviewUrl}
                              alt="Current signature"
                              style={{ maxWidth: '100%', maxHeight: 200, border: '1px solid #eee', background: '#fff' }}
                              onError={() => setHideExistingSignature(true)}
                            />
                          </div>
                        );
                      })()}
                      <div
                        className="border rounded position-relative"
                        style={{ width: "100%", height: 200, background: "#fff" }}
                      >
                        <canvas
                          ref={signatureCanvasRef}
                          width={800}
                          height={200}
                          style={{ width: "100%", height: "200px", touchAction: "none", cursor: "crosshair" }}
                          onMouseDown={startSignature}
                          onMouseMove={drawSignature}
                          onMouseUp={endSignature}
                          onMouseLeave={endSignature}
                          onTouchStart={startSignature}
                          onTouchMove={drawSignature}
                          onTouchEnd={endSignature}
                        />
                      </div>
                      <div className="mt-2 d-flex gap-2">
                        <Button type="button" color="secondary" onClick={clearSignature} size="sm">
                          Clear
                        </Button>
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup check>
                      <Label check className="d-flex align-items-start">
                        <Controller
                          name="POPIA_Agreement"
                          control={control}
                          rules={{ required: "You must agree to the POPIA terms to continue" }}
                          render={({ field }) => (
                            <Input
                              type="checkbox"
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              onBlur={field.onBlur}
                              name={field.name}
                              innerRef={field.ref}
                              className="me-2 mt-1"
                              style={{ flexShrink: 0 }}
                              invalid={!!errors.POPIA_Agreement}
                            />
                          )}
                        />
                        <span className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                          By completing this application form, you acknowledge and consent to the collection, processing, and storage of your personal information in accordance with the Protection of Personal Information Act (POPIA), Act 4 of 2013. Your personal information will be used solely for the purpose of processing your application and facilitating your enrollment in the Madressa
                        </span>
                      </Label>
                      {errors.POPIA_Agreement && (
                        <FormFeedback className="d-block">
                          {errors.POPIA_Agreement.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>
            </TabContent>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {!isOrgExecutive && (
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
        title="Delete Applicant"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default ApplicantSummary;

