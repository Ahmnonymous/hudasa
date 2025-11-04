import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const SummaryMetrics = ({ meetings, tasks }) => {
  // Calculate metrics
  const totalMeetings = meetings.length;
  
  const recentMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.meeting_date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return meetingDate >= threeMonthsAgo;
  }).length;

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(task => 
    task.status && String(task.status).toLowerCase() === "1" || 
    (task.status_name && task.status_name.toLowerCase() === "complete")
  ).length;

  const metrics = [
    {
      title: "Total Meetings",
      value: totalMeetings,
      icon: "bx-calendar",
      color: "primary",
      bgColor: "#556ee6",
    },
    {
      title: "Recent (3M)",
      value: recentMeetings,
      icon: "bx-time-five",
      color: "info",
      bgColor: "#50a5f1",
    },
    {
      title: "Total Tasks",
      value: totalTasks,
      icon: "bx-task",
      color: "warning",
      bgColor: "#f1b44c",
    },
    {
      title: "Completed Tasks",
      value: completedTasks,
      icon: "bx-check-circle",
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

