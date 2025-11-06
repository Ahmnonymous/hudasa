import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Row,
  Col,
  Spinner,
  Alert,
  Button,
  Table,
  Badge,
  Input,
  Label,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Collapse
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import TableContainer from "../../components/Common/TableContainer";

const renderFlagBadge = (flagLevel) => {
  const normalized = (flagLevel || "unknown").toLowerCase();
  switch (normalized) {
    case "green":
      return <Badge color="success">Green</Badge>;
    case "amber":
      return <Badge color="warning">Amber</Badge>;
    case "red":
      return <Badge color="danger">Red</Badge>;
    default:
      return <Badge color="secondary">Unknown</Badge>;
  }
};

const ParentQuestionnaireReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalsByCenter: [],
    totalsByGrade: [],
    commitmentDistribution: [],
    narrative: ""
  });
  const [flagged, setFlagged] = useState([]);
  const [filters, setFilters] = useState({
    center: "all",
    grade: "all",
    flag: "all"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    document.title = "Parent Questionnaire Reports | Hudasa";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, flagsRes] = await Promise.all([
          axiosApi.get(`${API_BASE_URL}/parent-questionnaire/reports`),
          axiosApi.get(`${API_BASE_URL}/parent-questionnaire/flags`)
        ]);

        setSummary({
          totalsByCenter: summaryRes.data?.totalsByCenter || [],
          totalsByGrade: summaryRes.data?.totalsByGrade || [],
          commitmentDistribution:
            summaryRes.data?.commitmentDistribution || [],
          narrative: summaryRes.data?.narrative || ""
        });
        setFlagged(flagsRes.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching parent questionnaire reports:", err);
        setError(
          err?.response?.data?.error ||
            "Failed to load parent questionnaire reports."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const centerOptions = useMemo(() => {
  const centers = summary.totalsByCenter
    .filter((item) => item.center_id !== null && item.center_id !== undefined)
    .map((item) => ({
      value: item.center_id,
      label: item.center_name && item.center_name.trim().length > 0
        ? item.center_name
        : `Center ${item.center_id}`
    }));

  const uniqueCenters = centers.filter(
    (center, index, self) =>
      index === self.findIndex((c) => String(c.value) === String(center.value))
  );

  return [{ value: "all", label: "All Centers" }, ...uniqueCenters];
  }, [summary.totalsByCenter]);

  const gradeOptions = useMemo(() => {
  const grades = summary.totalsByGrade
    .map((item) => item.grade)
    .filter((grade) => grade && grade.trim().length > 0)
    .filter((value, idx, arr) => arr.indexOf(value) === idx)
    .sort((a, b) => a.localeCompare(b));

  return [{ value: "all", label: "All Grades" }, ...grades.map((grade) => ({ value: grade, label: grade }))];
  }, [summary.totalsByGrade]);

  const filteredCommitmentByCenter = useMemo(() => {
    return summary.totalsByCenter
      .filter((item) =>
        filters.center === "all"
          ? true
          : String(item.center_id) === String(filters.center)
      )
      .map((item) => ({
        ...item,
        high: item.high || 0,
        moderate: item.moderate || 0,
        low: item.low || 0
      }));
  }, [summary.totalsByCenter, filters.center]);

  const filteredCommitmentByGrade = useMemo(() => {
    return summary.totalsByGrade
      .filter((item) =>
        filters.grade === "all"
          ? true
          : item.grade?.toString() === filters.grade.toString()
      )
      .map((item) => ({
        ...item,
        high: item.high || 0,
        moderate: item.moderate || 0,
        low: item.low || 0
      }));
  }, [summary.totalsByGrade, filters.grade]);

  const filteredFlagged = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return flagged
      .filter((item) =>
        filters.center === "all"
          ? true
          : String(item.center_id) === String(filters.center)
      )
      .filter((item) =>
        filters.grade === "all"
          ? true
          : (item.academic_grade || "").toString() ===
            filters.grade.toString()
      )
      .filter((item) =>
        filters.flag === "all"
          ? true
          : (item.flag_level || "").toLowerCase() ===
            filters.flag.toLowerCase()
      )
      .filter((item) => {
        if (!normalizedSearch) return true;
        const centerName =
          item.center_name || `Center ${item.center_id || ""}`;
        const attendance = item.attendance_frequency || "";
        const notes = Array.isArray(item.inconsistency_flags)
          ? item.inconsistency_flags.join(" ")
          : "";
        return (
          centerName.toLowerCase().includes(normalizedSearch) ||
          attendance.toLowerCase().includes(normalizedSearch) ||
          notes.toLowerCase().includes(normalizedSearch)
        );
      });
  }, [flagged, filters, searchTerm]);

  const flaggedColumns = useMemo(
    () => [
      {
        id: "center_name",
        header: "Centre",
        accessorKey: "center_name",
        enableSorting: true,
        cell: (cell) =>
          cell.getValue() || `Center ${cell.row.original.center_id || "-"}`
      },
      {
        id: "attendance_frequency",
        header: "Attendance Intent",
        accessorKey: "attendance_frequency",
        enableSorting: true,
        cell: (cell) => cell.getValue() || "-"
      },
      {
        id: "commitment_score",
        header: "Score",
        accessorKey: "commitment_score",
        enableSorting: true,
        cell: (cell) => (
          <Badge color="info">{cell.getValue() ?? "-"}</Badge>
        )
      },
      {
        id: "flag_level",
        header: "Flag Level",
        accessorKey: "flag_level",
        enableSorting: false,
        cell: (cell) => renderFlagBadge(cell.getValue())
      },
      {
        id: "inconsistency_flags",
        header: "Notes",
        accessorKey: "inconsistency_flags",
        enableSorting: false,
        cell: (cell) => {
          const flags = cell.getValue();
          if (!Array.isArray(flags) || flags.length === 0) {
            return <span className="text-muted">None</span>;
          }
          return (
            <ul className="mb-0 ps-3">
              {flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          );
        }
      },
      {
        id: "updated_at",
        header: "Last Updated",
        accessorKey: "updated_at",
        enableSorting: true,
        cell: (cell) =>
          cell.getValue()
            ? new Date(cell.getValue()).toLocaleString()
            : "-"
      }
    ],
    []
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const exportFlaggedToCSV = () => {
    if (!filteredFlagged.length) return;
    const headers = [
      "Center",
      "Attendance Intent",
      "Commitment Score",
      "Flag Level",
      "Inconsistencies",
      "Updated At"
    ];
    const rows = filteredFlagged.map((row) => [
      row.center_name || `Center ${row.center_id}`,
      row.attendance_frequency || "",
      row.commitment_score ?? "",
      row.flag_level || "",
      Array.isArray(row.inconsistency_flags)
        ? row.inconsistency_flags.join(" | ")
        : "",
      row.updated_at ? new Date(row.updated_at).toLocaleString() : ""
    ]);
    const csvContent = [headers, ...rows]
      .map((line) => line.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `parent_questionnaire_flags_${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    link.click();
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "400px" }}
          >
            <Spinner color="primary" className="me-2" />
            <span>Loading parent questionnaire insights...</span>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <Container fluid>
          <Alert color="danger" className="shadow-sm border-0">
            <h5 className="mb-2">Unable to load Parent Questionnaire Reports</h5>
            <p className="mb-3">{error}</p>
            <Button color="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs
          title="Reports"
          breadcrumbItem="Parent Questionnaire Reports"
        />

        <Row className="g-3 mb-4">
          <Col lg={12}>
            <Card className="shadow-sm border-0">
              <CardBody className="py-4">
                <Row className="align-items-center g-3">
                  <Col md={6}>
                    <h4 className="card-title mb-0">
                      <i className="bx bx-group me-2" />
                      Parent Questionnaire Insights
                    </h4>
                  </Col>
                  <Col md={6} className="text-md-end">
                    <UncontrolledDropdown className="d-inline-block me-2">
                      <DropdownToggle color="light" caret>
                        Filter &amp; Export
                      </DropdownToggle>
              <DropdownMenu end>
                        <DropdownItem header>Filters</DropdownItem>
                        <DropdownItem toggle={false}>
                          <div className="mb-2">
                            <Label className="form-label">Centre</Label>
                            <Input
                              type="select"
                              value={filters.center}
                              onChange={(e) =>
                                handleFilterChange("center", e.target.value)
                              }
                            >
                              {centerOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Input>
                          </div>
                        </DropdownItem>
                        <DropdownItem toggle={false}>
                          <div className="mb-2">
                            <Label className="form-label">Grade</Label>
                            <Input
                              type="select"
                              value={filters.grade}
                              onChange={(e) =>
                                handleFilterChange("grade", e.target.value)
                              }
                            >
                              {gradeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Input>
                          </div>
                        </DropdownItem>
                <DropdownItem onClick={() => setShowFilters((prev) => !prev)}>
                  <i className="bx bx-filter-alt me-2" />
                  {showFilters ? "Hide" : "Show"} Filters
                </DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={exportFlaggedToCSV}>
                          <i className="bx bx-download me-2" />
                          Export Flagged (Excel)
                        </DropdownItem>
                        <DropdownItem onClick={printReport}>
                          <i className="bx bx-printer me-2" />
                          Print / Save as PDF
                        </DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                    <Button
                      color="secondary"
                      onClick={() =>
                        setFilters({ center: "all", grade: "all", flag: "all" })
                      }
                    >
                      <i className="bx bx-reset me-2" />
                      Reset Filters
                    </Button>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Collapse isOpen={showFilters} className="mb-4">
          <Card className="shadow-sm border-0">
            <CardBody className="py-4">
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Label className="form-label">Centre</Label>
                  <Input
                    type="select"
                    value={filters.center}
                    onChange={(e) => handleFilterChange("center", e.target.value)}
                  >
                    {centerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col md={4}>
                  <Label className="form-label">Grade</Label>
                  <Input
                    type="select"
                    value={filters.grade}
                    onChange={(e) => handleFilterChange("grade", e.target.value)}
                  >
                    {gradeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col md={4}>
                  <Label className="form-label">Flag Level</Label>
                  <Input
                    type="select"
                    value={filters.flag}
                    onChange={(e) => handleFilterChange("flag", e.target.value)}
                  >
                    <option value="all">All Flags</option>
                    <option value="green">Green</option>
                    <option value="amber">Amber</option>
                    <option value="red">Red</option>
                  </Input>
                </Col>
                <Col md={4}>
                  <Label className="form-label">Search</Label>
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search centre, intent, or notes"
                  />
                </Col>
                <Col md="auto">
                  <Button
                    color="secondary"
                    onClick={() => {
                      setFilters({ center: "all", grade: "all", flag: "all" });
                      setSearchTerm("");
                    }}
                  >
                    <i className="bx bx-reset me-1" />
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Collapse>

        <Row className="g-4 mb-4">
          <Col lg={8}>
            <Card className="shadow-sm border-0 h-100">
              <CardBody className="py-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">
                    <i className="bx bxs-traffic-barrier me-2" />
                    Flagged Responses
                  </h5>
                  <Badge color="danger">
                    {filteredFlagged.length} flagged households
                  </Badge>
                </div>
                {filteredFlagged.length ? (
                  <TableContainer
                    columns={flaggedColumns}
                    data={filteredFlagged}
                    isGlobalFilter={false}
                    isPagination
                    isCustomPageSize
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-bordered align-middle dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    enableColumnFilters={false}
                  />
                ) : (
                  <div className="alert alert-success mb-0">
                    <i className="bx bx-check-circle me-2" />
                    No flagged responses for the selected filters.
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 h-100">
              <CardBody className="d-flex flex-column">
                <h5 className="mb-3">
                  <i className="bx bx-line-chart me-2" />
                  Commitment Summary
                </h5>
                {summary.commitmentDistribution.length ? (
                  <ul className="list-unstyled flex-grow-1">
                    {summary.commitmentDistribution.map((item) => (
                      <li
                        key={item.category}
                        className="d-flex justify-content-between align-items-center py-2 border-bottom"
                      >
                        <span className="text-capitalize">
                          {item.category} Commitment
                        </span>
                        <div>
                          <Badge color="primary" className="me-2">
                            {item.total}
                          </Badge>
                          <span className="text-muted">
                            {item.percentage}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="alert alert-info mb-0">
                    No commitment data available.
                  </div>
                )}
                <div className="bg-light rounded p-3 mt-3">
                  <h6 className="text-muted text-uppercase mb-2">
                    Narrative Insight
                  </h6>
                  <p className="mb-0">{summary.narrative}</p>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <CardBody className="py-4">
                <h5 className="mb-3">
                  <i className="bx bx-building-house me-2" />
                  Commitment by Centre
                </h5>
                <div className="table-responsive">
                  <Table className="table table-sm table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Centre</th>
                        <th>Total</th>
                        <th>High</th>
                        <th>Moderate</th>
                        <th>Low</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommitmentByCenter.length ? (
                        filteredCommitmentByCenter.map((row) => (
                          <tr key={row.center_id}>
                            <td>{row.center_name || `Center ${row.center_id}`}</td>
                            <td>{row.total}</td>
                            <td>{row.high}</td>
                            <td>{row.moderate}</td>
                            <td>{row.low}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">
                            No data for selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <CardBody className="py-4">
                <h5 className="mb-3">
                  <i className="bx bxs-book-content me-2" />
                  Commitment by Grade
                </h5>
                <div className="table-responsive">
                  <Table className="table table-sm table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Grade</th>
                        <th>Total</th>
                        <th>High</th>
                        <th>Moderate</th>
                        <th>Low</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommitmentByGrade.length ? (
filteredCommitmentByGrade.map((row) => (
                          <tr key={row.grade || "N/A"}>
                            <td>{row.grade || "N/A"}</td>
                            <td>{row.total}</td>
                            <td>{row.high}</td>
                            <td>{row.moderate}</td>
                            <td>{row.low}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">
                            No data for selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ParentQuestionnaireReports;

