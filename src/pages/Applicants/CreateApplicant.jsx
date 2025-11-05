import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { validateTabsAndNavigate } from "../../helpers/tabValidation";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TopRightAlert from "../../components/Common/TopRightAlert";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getHudasaUser, getAuditName } from "../../helpers/userStorage";
import { sanitizeTenDigit, tenDigitRule } from "../../helpers/phone";

const CreateApplicant = () => {
  document.title = "Create Applicant | Hudasa";

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const [alert, setAlert] = useState(null);
  const [lookupData, setLookupData] = useState({
    race: [],
    nationality: [],
    gender: [],
    fileCondition: [],
    fileStatus: [],
    educationLevel: [],
    maritalStatus: [],
    employmentStatus: [],
    suburb: [],
    dwellingType: [],
    dwellingStatus: [],
    healthConditions: [],
    skills: [],
    bornReligion: [],
    periodAsMuslim: [],
  });

  // Signature pad refs/state
  const signatureCanvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);

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

  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Scale the pointer to the canvas coordinate space to avoid offset when CSS scales the canvas
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
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

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    trigger,
    getValues,
  } = useForm({
    defaultValues: {
      Name: "",
      Surname: "",
      ID_Number: "",
      Nationality: "",
      Nationality_Expiry_Date: "",
      Gender: "",
      Race: "",
      Employment_Status: "",
      Skills: "",
      Highest_Education: "",
      Born_Religion_ID: "",
      Period_As_Muslim_ID: "",
      Cell_Number: "",
      Alternate_Number: "",
      Email_Address: "",
      Street_Address: "",
      Suburb: "",
      Dwelling_Type: "",
      Dwelling_Status: "",
      Health_Conditions: "",
      Marital_Status: "",
      Date_Intake: "",
      File_Number: "",
      File_Condition: "",
      File_Status: "",
      Signature: null,
      POPIA_Agreement: false, // boolean
    },
    mode: "onChange",           // Validate on change
    reValidateMode: "onChange", // Critical for checkboxes
    shouldUnregister: false,
  });

  useEffect(() => {
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      const [
        raceRes,
        nationalityRes,
        genderRes,
        fileConditionRes,
        fileStatusRes,
        educationLevelRes,
        maritalStatusRes,
        employmentStatusRes,
        suburbRes,
        dwellingTypeRes,
        dwellingStatusRes,
        healthConditionsRes,
        skillsRes,
        bornReligionRes,
        periodAsMuslimRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Race`),
        axiosApi.get(`${API_BASE_URL}/lookup/Nationality`),
        axiosApi.get(`${API_BASE_URL}/lookup/Gender`),
        axiosApi.get(`${API_BASE_URL}/lookup/File_Condition`),
        axiosApi.get(`${API_BASE_URL}/lookup/File_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Education_Level`),
        axiosApi.get(`${API_BASE_URL}/lookup/Marital_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Employment_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Suburb`),
        axiosApi.get(`${API_BASE_URL}/lookup/Dwelling_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/Dwelling_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Health_Conditions`),
        axiosApi.get(`${API_BASE_URL}/lookup/Skills`),
        axiosApi.get(`${API_BASE_URL}/lookup/Born_Religion`),
        axiosApi.get(`${API_BASE_URL}/lookup/Period_As_Muslim`),
      ]);

      setLookupData({
        race: raceRes.data || [],
        nationality: nationalityRes.data || [],
        gender: genderRes.data || [],
        fileCondition: fileConditionRes.data || [],
        fileStatus: fileStatusRes.data || [],
        educationLevel: educationLevelRes.data || [],
        maritalStatus: maritalStatusRes.data || [],
        employmentStatus: employmentStatusRes.data || [],
        suburb: suburbRes.data || [],
        dwellingType: dwellingTypeRes.data || [],
        dwellingStatus: dwellingStatusRes.data || [],
        healthConditions: healthConditionsRes.data || [],
        skills: skillsRes.data || [],
        bornReligion: bornReligionRes.data || [],
        periodAsMuslim: periodAsMuslimRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
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
        const formData = new FormData();
        formData.append("name", data.Name || "");
        formData.append("surname", data.Surname || "");
        formData.append("id_number", data.ID_Number || "");
        if (data.Nationality) formData.append("nationality", data.Nationality);
        if (data.Gender) formData.append("gender", data.Gender);
        if (data.Nationality_Expiry_Date) formData.append("nationality_expiry_date", data.Nationality_Expiry_Date);
        if (data.Race) formData.append("race", data.Race);
        if (data.Employment_Status) formData.append("employment_status", data.Employment_Status);
        if (data.Skills) formData.append("skills", data.Skills);
        if (data.Highest_Education) formData.append("highest_education_level", data.Highest_Education);
        formData.append("cell_number", data.Cell_Number || "");
        formData.append("alternate_number", data.Alternate_Number || "");
        formData.append("email_address", data.Email_Address || "");
        formData.append("street_address", data.Street_Address || "");
        if (data.Suburb) formData.append("suburb", data.Suburb);
        if (data.Dwelling_Type) formData.append("dwelling_type", data.Dwelling_Type);
        if (data.Dwelling_Status) formData.append("dwelling_status", data.Dwelling_Status);
        if (data.Born_Religion_ID) formData.append("born_religion_id", data.Born_Religion_ID);
        if (data.Period_As_Muslim_ID) formData.append("period_as_muslim_id", data.Period_As_Muslim_ID);
        if (data.Health_Conditions) formData.append("health", data.Health_Conditions);
        if (data.Marital_Status) formData.append("marital_status", data.Marital_Status);
        formData.append("date_intake", data.Date_Intake || new Date().toISOString().split("T")[0]);
        formData.append("file_number", data.File_Number || "");
        if (data.File_Condition) formData.append("file_condition", data.File_Condition);
        if (data.File_Status) formData.append("file_status", data.File_Status);
        formData.append("signature", signatureBlob, "signature.png");
        formData.append("popia_agreement", data.POPIA_Agreement ? "Y" : "N");
        formData.append("center_id", currentUser?.center_id || 1);
        formData.append("created_by", currentUser?.username || "system");

        await axiosApi.post(`${API_BASE_URL}/applicantDetails`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const payload = {
          name: data.Name,
          surname: data.Surname,
          id_number: data.ID_Number,
          nationality: data.Nationality && data.Nationality !== "" ? parseInt(data.Nationality) : null,
          gender: data.Gender && data.Gender !== "" ? parseInt(data.Gender) : null,
          nationality_expiry_date: data.Nationality_Expiry_Date || null,
          race: data.Race && data.Race !== "" ? parseInt(data.Race) : null,
          employment_status: data.Employment_Status && data.Employment_Status !== "" ? parseInt(data.Employment_Status) : null,
          skills: data.Skills && data.Skills !== "" ? parseInt(data.Skills) : null,
          highest_education_level: data.Highest_Education && data.Highest_Education !== "" ? parseInt(data.Highest_Education) : null,
          born_religion_id: data.Born_Religion_ID && data.Born_Religion_ID !== "" ? parseInt(data.Born_Religion_ID) : null,
          period_as_muslim_id: data.Period_As_Muslim_ID && data.Period_As_Muslim_ID !== "" ? parseInt(data.Period_As_Muslim_ID) : null,
          cell_number: data.Cell_Number || null,
          alternate_number: data.Alternate_Number || null,
          email_address: data.Email_Address || null,
          street_address: data.Street_Address || null,
          suburb: data.Suburb && data.Suburb !== "" ? parseInt(data.Suburb) : null,
          dwelling_type: data.Dwelling_Type && data.Dwelling_Type !== "" ? parseInt(data.Dwelling_Type) : null,
          dwelling_status: data.Dwelling_Status && data.Dwelling_Status !== "" ? parseInt(data.Dwelling_Status) : null,
          health: data.Health_Conditions && data.Health_Conditions !== "" ? parseInt(data.Health_Conditions) : null,
          marital_status: data.Marital_Status && data.Marital_Status !== "" ? parseInt(data.Marital_Status) : null,
          date_intake: data.Date_Intake || new Date().toISOString().split("T")[0],
          file_number: data.File_Number,
          file_condition: data.File_Condition && data.File_Condition !== "" ? parseInt(data.File_Condition) : null,
          file_status: data.File_Status && data.File_Status !== "" ? parseInt(data.File_Status) : null,
          popia_agreement: data.POPIA_Agreement ? "Y" : "N",
          center_id: currentUser?.center_id || 1,
          created_by: getAuditName(),
        };

        await axiosApi.post(`${API_BASE_URL}/applicantDetails`, payload);
      }

      showAlert("Applicant has been created successfully", "success");
      setTimeout(() => {
        navigate("/applicants");
      }, 1500);
    } catch (error) {
      console.error("Error creating applicant:", error);
      showAlert(error?.response?.data?.message || "Failed to create applicant", "danger");
    }
  };

  // Required fields including POPIA
  const requiredFields = ["Name", "Surname", "ID_Number", "File_Number", "POPIA_Agreement"];
  const fieldTabMap = {
    Name: "1",
    Surname: "1",
    ID_Number: "1",
    File_Number: "3",
    POPIA_Agreement: "3",
  };

  const handleValidatedSubmit = async () => {
    const ok = await validateTabsAndNavigate({
      requiredFields,
      fieldTabMap,
      trigger,
      getValues: (name) => getValues(name),
      setActiveTab,
      showAlert,
    });
    if (!ok) return;
    return handleSubmit(onSubmit)();
  };

  return (
    <div className="page-content">
      <Container fluid>
        <TopRightAlert alert={alert} onClose={() => setAlert(null)} />
        <Breadcrumbs title="Applicants" breadcrumbItem="Create New Applicant" />

        <Row>
          <Col xl={12}>
            <Card className="border shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0 fw-semibold font-size-16">
                    Create New Applicant
                  </h5>
                </div>
              </div>

              <CardBody className="p-4">
                <Form onSubmit={(e) => { e.preventDefault(); handleValidatedSubmit(); }}>
                  <Nav tabs className="nav-tabs-custom">
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

                  <TabContent activeTab={activeTab} className="p-4 border border-top-0">
                    {/* === TAB 1: PERSONAL INFO === */}
                    <TabPane tabId="1">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="Name">Name <span className="text-danger">*</span></Label>
                            <Controller
                              name="Name"
                              control={control}
                              rules={{ required: "Name is required" }}
                              render={({ field }) => (
                                <Input id="Name" type="text" invalid={!!errors.Name} {...field} />
                              )}
                            />
                            {errors.Name && <FormFeedback>{errors.Name.message}</FormFeedback>}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Surname">Surname <span className="text-danger">*</span></Label>
                            <Controller
                              name="Surname"
                              control={control}
                              rules={{ required: "Surname is required" }}
                              render={({ field }) => (
                                <Input id="Surname" type="text" invalid={!!errors.Surname} {...field} />
                              )}
                            />
                            {errors.Surname && <FormFeedback>{errors.Surname.message}</FormFeedback>}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="ID_Number">ID Number <span className="text-danger">*</span></Label>
                            <Controller
                              name="ID_Number"
                              control={control}
                              rules={{
                                required: "ID Number is required",
                                pattern: { value: /^\d{13}$/, message: "ID Number must be exactly 13 digits" },
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
                                />
                              )}
                            />
                            {errors.ID_Number && <FormFeedback>{errors.ID_Number.message}</FormFeedback>}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Nationality">Nationality</Label>
                            <Controller
                              name="Nationality"
                              control={control}
                              render={({ field }) => (
                                <Input id="Nationality" type="select" {...field}>
                                  <option value="">Select Nationality</option>
                                  {(lookupData.nationality || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        {(() => {
                          const selectedNationalityId = watch("Nationality");
                          const selected = (lookupData.nationality || []).find((n) => String(n.id) === String(selectedNationalityId));
                          const isSouthAfrican = (selected?.name || "").toLowerCase() === "south african";
                          return !isSouthAfrican ? (
                            <Col md={6}>
                              <FormGroup>
                                <Label for="Nationality_Expiry_Date">Passport Expiry Date</Label>
                                <Controller
                                  name="Nationality_Expiry_Date"
                                  control={control}
                                  render={({ field }) => (
                                    <Input id="Nationality_Expiry_Date" type="date" {...field} />
                                  )}
                                />
                              </FormGroup>
                            </Col>
                          ) : null;
                        })()}

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Gender">Gender</Label>
                            <Controller
                              name="Gender"
                              control={control}
                              render={({ field }) => (
                                <Input id="Gender" type="select" {...field}>
                                  <option value="">Select Gender</option>
                                  {(lookupData.gender || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                    <Col md={6}>
                      <FormGroup>
                        <Label for="Born_Religion_ID">Born Religion</Label>
                        <Controller
                          name="Born_Religion_ID"
                          control={control}
                          render={({ field }) => (
                            <Input id="Born_Religion_ID" type="select" {...field}>
                              <option value="">Select Religion</option>
                              {(lookupData.bornReligion || []).map((x) => (
                                <option key={x.id} value={x.id}>{x.name}</option>
                              ))}
                            </Input>
                          )}
                        />
                      </FormGroup>
                    </Col>

                    {(() => {
                      const bornRelId = watch("Born_Religion_ID");
                      const bornRel = (lookupData.bornReligion || []).find((r) => String(r.id) === String(bornRelId));
                      const isIslam = (bornRel?.name || "").toLowerCase() === "islam";
                      if (isIslam) return null;
                      return (
                        <Col md={6}>
                          <FormGroup>
                            <Label for="Period_As_Muslim_ID">Period as a Muslim</Label>
                            <Controller
                              name="Period_As_Muslim_ID"
                              control={control}
                              render={({ field }) => (
                                <Input id="Period_As_Muslim_ID" type="select" {...field}>
                                  <option value="">Select Period</option>
                                  {(lookupData.periodAsMuslim || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>
                      );
                    })()}

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Race">Race</Label>
                            <Controller
                              name="Race"
                              control={control}
                              render={({ field }) => (
                                <Input id="Race" type="select" {...field}>
                                  <option value="">Select Race</option>
                                  {(lookupData.race || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
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
                                <Input id="Employment_Status" type="select" {...field}>
                                  <option value="">Select Status</option>
                                  {(lookupData.employmentStatus || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Skills">Skills</Label>
                            <Controller
                              name="Skills"
                              control={control}
                              render={({ field }) => (
                                <Input id="Skills" type="select" {...field}>
                                  <option value="">Select Skills</option>
                                  {(lookupData.skills || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
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
                                <Input id="Highest_Education" type="select" {...field}>
                                  <option value="">Select Education</option>
                                  {(lookupData.educationLevel || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Marital_Status">Marital Status</Label>
                            <Controller
                              name="Marital_Status"
                              control={control}
                              render={({ field }) => (
                                <Input id="Marital_Status" type="select" {...field}>
                                  <option value="">Select Status</option>
                                  {(lookupData.maritalStatus || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Health_Conditions">Health Conditions</Label>
                            <Controller
                              name="Health_Conditions"
                              control={control}
                              render={({ field }) => (
                                <Input id="Health_Conditions" type="select" {...field}>
                                  <option value="">Select Condition</option>
                                  {(lookupData.healthConditions || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </TabPane>

                    {/* === TAB 2: CONTACT & ADDRESS === */}
                    <TabPane tabId="2">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="Cell_Number">Cell Number</Label>
                            <Controller
                              name="Cell_Number"
                              control={control}
                              rules={tenDigitRule(false, "Cell Number")}
                              render={({ field }) => (
                                <Input
                                  id="Cell_Number"
                                  type="text"
                                  maxLength={10}
                                  onInput={(e) => {
                                    e.target.value = sanitizeTenDigit(e.target.value);
                                    field.onChange(e);
                                  }}
                                  value={field.value}
                                  onBlur={field.onBlur}
                                  invalid={!!errors.Cell_Number}
                                />
                              )}
                            />
                            {errors.Cell_Number && <FormFeedback>{errors.Cell_Number.message}</FormFeedback>}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Alternate_Number">Alternate Number</Label>
                            <Controller
                              name="Alternate_Number"
                              control={control}
                              rules={tenDigitRule(false, "Alternate Number")}
                              render={({ field }) => (
                                <Input
                                  id="Alternate_Number"
                                  type="text"
                                  maxLength={10}
                                  onInput={(e) => {
                                    e.target.value = sanitizeTenDigit(e.target.value);
                                    field.onChange(e);
                                  }}
                                  value={field.value}
                                  onBlur={field.onBlur}
                                  invalid={!!errors.Alternate_Number}
                                />
                              )}
                            />
                            {errors.Alternate_Number && <FormFeedback>{errors.Alternate_Number.message}</FormFeedback>}
                          </FormGroup>
                        </Col>

                        <Col md={12}>
                          <FormGroup>
                            <Label for="Email_Address">Email Address</Label>
                            <Controller
                              name="Email_Address"
                              control={control}
                              render={({ field }) => (
                                <Input id="Email_Address" type="email" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Suburb">Suburb</Label>
                            <Controller
                              name="Suburb"
                              control={control}
                              render={({ field }) => (
                                <Input id="Suburb" type="select" {...field}>
                                  <option value="">Select Suburb</option>
                                  {(lookupData.suburb || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={12}>
                          <FormGroup>
                            <Label for="Street_Address">Street Address</Label>
                            <Controller
                              name="Street_Address"
                              control={control}
                              render={({ field }) => (
                                <Input id="Street_Address" type="text" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Dwelling_Type">Dwelling Type</Label>
                            <Controller
                              name="Dwelling_Type"
                              control={control}
                              render={({ field }) => (
                                <Input id="Dwelling_Type" type="select" {...field}>
                                  <option value="">Select Type</option>
                                  {(lookupData.dwellingType || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Dwelling_Status">Dwelling Status</Label>
                            <Controller
                              name="Dwelling_Status"
                              control={control}
                              render={({ field }) => (
                                <Input id="Dwelling_Status" type="select" {...field}>
                                  <option value="">Select Status</option>
                                  {(lookupData.dwellingStatus || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        {(() => {
                          const selectedDwellingTypeId = watch("Dwelling_Type");
                          const selected = (lookupData.dwellingType || []).find((d) => String(d.id) === String(selectedDwellingTypeId));
                          const isFlat = (selected?.name || "").toLowerCase() === "flat";
                          if (!isFlat) return null;
                          return (
                            <>
                              <Col md={6}>
                                <FormGroup>
                                  <Label for="Flat_Name">Flat Name</Label>
                                  <Controller
                                    name="Flat_Name"
                                    control={control}
                                    render={({ field }) => (
                                      <Input id="Flat_Name" type="text" {...field} />
                                    )}
                                  />
                                </FormGroup>
                              </Col>
                              <Col md={6}>
                                <FormGroup>
                                  <Label for="Flat_Number">Flat Number</Label>
                                  <Controller
                                    name="Flat_Number"
                                    control={control}
                                    render={({ field }) => (
                                      <Input id="Flat_Number" type="text" {...field} />
                                    )}
                                  />
                                </FormGroup>
                              </Col>
                            </>
                          );
                        })()}
                      </Row>
                    </TabPane>

                    {/* === TAB 3: FILE DETAILS === */}
                    <TabPane tabId="3">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="File_Number">File Number <span className="text-danger">*</span></Label>
                            <Controller
                              name="File_Number"
                              control={control}
                              rules={{ required: "File Number is required" }}
                              render={({ field }) => (
                                <Input id="File_Number" type="text" invalid={!!errors.File_Number} {...field} />
                              )}
                            />
                            {errors.File_Number && <FormFeedback>{errors.File_Number.message}</FormFeedback>}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Date_Intake">Date Intake</Label>
                            <Controller
                              name="Date_Intake"
                              control={control}
                              render={({ field }) => (
                                <Input id="Date_Intake" type="date" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="File_Condition">File Condition</Label>
                            <Controller
                              name="File_Condition"
                              control={control}
                              render={({ field }) => (
                                <Input id="File_Condition" type="select" {...field}>
                                  <option value="">Select Condition</option>
                                  {(lookupData.fileCondition || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="File_Status">File Status</Label>
                            <Controller
                              name="File_Status"
                              control={control}
                              render={({ field }) => (
                                <Input id="File_Status" type="select" {...field}>
                                  <option value="">Select Status</option>
                                  {(lookupData.fileStatus || []).map((x) => (
                                    <option key={x.id} value={x.id}>{x.name}</option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={12}>
                          <FormGroup>
                            <Label for="SignaturePad">Signature</Label>
                            <div
                              className="border rounded position-relative"
                              style={{ width: "100%", height: 200, background: "#fff" }}
                            >
                              <canvas
                                id="SignaturePad"
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

                        {/* POPIA AGREEMENT - FULLY WORKING */}
                        <Col md={12}>
                          <FormGroup check>
                            <Controller
                              name="POPIA_Agreement"
                              control={control}
                              rules={{ required: "You must agree to the POPIA terms to continue" }}
                              render={({ field }) => (
                                <Label check className="d-flex align-items-start">
                                  <Input
                                    type="checkbox"
                                    defaultChecked={false}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    invalid={!!errors.POPIA_Agreement}
                                    className="me-2 mt-1"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <span className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                                    By completing this application form, you acknowledge and consent to the collection, processing, and storage of your personal information in accordance with the Protection of Personal Information Act (POPIA), Act 4 of 2013. Your personal information will be used solely for the purpose of processing your application and facilitating your enrollment in the Madressa
                                  </span>
                                </Label>
                              )}
                            />
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

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <Button
                      type="button"
                      color="light"
                      onClick={() => navigate("/applicants")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button color="success" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Creating...
                        </>
                      ) : (
                        <>Create Applicant</>
                      )}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateApplicant;