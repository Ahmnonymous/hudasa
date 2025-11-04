import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const SummaryMetrics = ({ items, transactions }) => {
  // Calculate metrics
  const totalItems = items.length;
  
  const lowStockItems = items.filter((item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const minStock = parseFloat(item.min_stock) || 0;
    return quantity > 0 && quantity <= minStock;
  }).length;

  const outOfStockItems = items.filter((item) => {
    const quantity = parseFloat(item.quantity) || 0;
    return quantity <= 0;
  }).length;

  const recentTransactions = transactions.filter((trans) => {
    const transDate = new Date(trans.transaction_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return transDate >= thirtyDaysAgo;
  }).length;

  const metrics = [
    {
      title: "Total Items",
      value: totalItems,
      icon: "bx-box",
      color: "primary",
      bgColor: "#556ee6",
    },
    {
      title: "Low Stock",
      value: lowStockItems,
      icon: "bx-error-circle",
      color: "warning",
      bgColor: "#f1b44c",
    },
    {
      title: "Out of Stock",
      value: outOfStockItems,
      icon: "bx-x-circle",
      color: "danger",
      bgColor: "#f46a6a",
    },
    {
      title: "Recent Transactions",
      value: recentTransactions,
      icon: "bx-transfer",
      color: "success",
      bgColor: "#34c38f",
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

