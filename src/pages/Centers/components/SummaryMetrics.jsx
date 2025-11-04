import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const SummaryMetrics = ({ centers, audits }) => {
  // Calculate metrics
  const totalCenters = centers.length;
  
  const recentAudits = audits.filter((audit) => {
    const auditDate = new Date(audit.audit_date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return auditDate >= sixMonthsAgo;
  }).length;

  const centersWithNPO = centers.filter(c => c.npo_number).length;

  const totalAudits = audits.length;

  const metrics = [
    {
      title: "Total Centers",
      value: totalCenters,
      icon: "bx-building",
      color: "primary",
      bgColor: "#556ee6",
    },
    {
      title: "With NPO Number",
      value: centersWithNPO,
      icon: "bx-check-shield",
      color: "success",
      bgColor: "#34c38f",
    },
    {
      title: "Total Audits",
      value: totalAudits,
      icon: "bx-clipboard",
      color: "info",
      bgColor: "#50a5f1",
    },
    {
      title: "Recent Audits (6M)",
      value: recentAudits,
      icon: "bx-time-five",
      color: "warning",
      bgColor: "#f1b44c",
    },
  ];

  return (
    <Row>
      {metrics.map((metric, index) => (
        <Col xl={3} md={6} sm={12} key={index}>
          <Card className="mini-stats-wid mb-3">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium mb-2">{metric.title}</p>
                  <h4 className="mb-0">{metric.value}</h4>
                </div>
                <div className="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                  <span className="avatar-title rounded-circle" style={{ backgroundColor: metric.bgColor }}>
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

