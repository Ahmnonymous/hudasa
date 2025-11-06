import React from 'react';
import { Card, CardBody, Row, Col, Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';

const ReportsMenu = () => {
    const reportItems = [
        {
            id: 'applicant-details',
            title: 'Applicant Details',
            description: 'View comprehensive applicant information and demographics',
            icon: 'bx bx-user-plus',
            path: '/reports/applicant-details',
            color: 'primary'
        },
        {
            id: 'parent-questionnaire',
            title: 'Parent Questionnaire',
            description: 'Commitment insights, flagging and parental engagement analytics',
            icon: 'bx bx-analyse',
            path: '/reports/parent-questionnaire',
            color: 'info'
        },
        {
            id: 'total-financial',
            title: 'Total Financial Assistance',
            description: 'Complete financial assistance summary including food and cash assistance',
            icon: 'bx bx-money',
            path: '/reports/total-financial-assistance',
            color: 'success',
            hasSubItems: true,
            subItems: [
                {
                    id: 'financial-assistance',
                    title: 'Financial Assistance',
                    description: 'Cash and financial support provided to applicants',
                    icon: 'bx bx-credit-card',
                    path: '/reports/financial-assistance'
                },
                {
                    id: 'food-assistance',
                    title: 'Food Assistance',
                    description: 'Food hampers and meal support provided',
                    icon: 'bx bx-home',
                    path: '/reports/food-assistance'
                }
            ]
        },
        {
            id: 'home-visits',
            title: 'Home Visits',
            description: 'Records of home visits conducted by representatives',
            icon: 'bx bx-car',
            path: '/reports/home-visits',
            color: 'info'
        },
        {
            id: 'relationship-report',
            title: 'Relationship Report',
            description: 'Family members and dependents of applicants',
            icon: 'bx bx-group',
            path: '/reports/relationship-report',
            color: 'secondary'
        },
        {
            id: 'skills-matrix',
            title: 'Applicant Skills Report',
            description: 'Employee training courses, certifications, and expiry status',
            icon: 'bx bx-award',
            path: '/reports/skills-matrix',
            color: 'dark'
        }
    ];

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    {/* Header */}
                    <Row>
                        <Col lg={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">
                                    <i className="bx bx-bar-chart-alt-2 me-2"></i>
                                    Reports Dashboard
                                </h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link to="/dashboard">Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Reports</li>
                                    </ol>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Reports Navigation */}
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    <h5 className="card-title mb-4">
                                        <i className="bx bx-menu me-2"></i>
                                        Available Reports
                                    </h5>
                                    
                                    <Nav className="nav-pills nav-justified flex-column flex-sm-row" role="tablist">
                                        {reportItems.map((item) => (
                                            <React.Fragment key={item.id}>
                                                <NavItem>
                                                    <NavLink
                                                        tag={Link}
                                                        to={item.path}
                                                        className={`text-${item.color} border-${item.color} rounded-3 mb-2 mb-sm-0 me-sm-2`}
                                                    >
                                                        <i className={`${item.icon} me-2`}></i>
                                                        {item.title}
                                                    </NavLink>
                                                </NavItem>
                                            </React.Fragment>
                                        ))}
                                    </Nav>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Reports Grid */}
                    <Row>
                        {reportItems.map((item) => (
                            <Col key={item.id} lg={6} xl={4}>
                                <Card className="border">
                                    <CardBody>
                                        <div className="d-flex align-items-center mb-3">
                                            <div className={`avatar-sm rounded-circle bg-soft-${item.color} text-${item.color} me-3`}>
                                                <i className={`${item.icon} font-size-18`}></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">{item.title}</h6>
                                                <p className="text-muted mb-0 small">{item.description}</p>
                                            </div>
                                        </div>
                                        
                                        {item.hasSubItems && item.subItems && (
                                            <div className="mt-3">
                                                <h6 className="mb-2 small text-muted">Sub-reports:</h6>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {item.subItems.map((subItem) => (
                                                        <Link
                                                            key={subItem.id}
                                                            to={subItem.path}
                                                            className="btn btn-outline-secondary btn-sm"
                                                        >
                                                            <i className={`${subItem.icon} me-1`}></i>
                                                            {subItem.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="mt-3">
                                            <Link
                                                to={item.path}
                                                className={`btn btn-${item.color} btn-sm w-100`}
                                            >
                                                <i className="bx bx-show me-1"></i>
                                                View Report
                                            </Link>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
        </React.Fragment>
    );
};

export default ReportsMenu;
