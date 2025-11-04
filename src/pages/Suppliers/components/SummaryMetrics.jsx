import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const SummaryMetrics = ({ evaluations, documents }) => {
  const totalEvaluations = evaluations.length;
  const totalDocuments = documents.length;
  
  // Calculate average evaluation score
  const avgScore = evaluations.length > 0 
    ? evaluations.reduce((sum, evaluation) => sum + (Number(evaluation.overall_score) || 0), 0) / evaluations.length
    : 0;

  // Count evaluations by status
  const approvedEvaluations = evaluations.filter(evaluation => evaluation.status?.toLowerCase() === 'approved').length;
  const pendingEvaluations = evaluations.filter(evaluation => evaluation.status?.toLowerCase() === 'pending').length;

  const metrics = [
    {
      title: "Total Evaluations",
      value: totalEvaluations,
      icon: "bx-clipboard",
      color: "primary"
    },
    {
      title: "Approved",
      value: approvedEvaluations,
      icon: "bx-check-circle",
      color: "success"
    },
    {
      title: "Pending",
      value: pendingEvaluations,
      icon: "bx-time",
      color: "warning"
    },
    {
      title: "Documents",
      value: totalDocuments,
      icon: "bx-file",
      color: "info"
    },
  ];

  return (
    <Row className="mb-3">
      {metrics.map((metric, index) => (
        <Col xl={3} md={6} sm={12} key={index}>
          <Card className="mini-stats-wid">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium">
                    {metric.title}
                  </p>
                  <h4 className="mb-0">{metric.value}</h4>
                </div>
                <div className="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                  <span className={`avatar-title rounded-circle bg-${metric.color}`}>
                    <i className={`bx ${metric.icon} font-size-24`}></i>
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default SummaryMetrics;