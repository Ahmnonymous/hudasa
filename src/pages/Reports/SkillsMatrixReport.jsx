import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, CardBody, Row, Col, Table, Spinner, Alert, Button, Input, Badge, Collapse, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label } from 'reactstrap';
import { Link } from 'react-router-dom';
import axiosApi from '../../helpers/api_helper';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import { GET_SKILLS_MATRIX_REPORT, API_BASE_URL } from '../../helpers/url_helper';

const SkillsMatrixReport = () => {
    const [data, setData] = useState([]);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [filters, setFilters] = useState({
        status: ''
    });

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [groupBy, setGroupBy] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showGroupBy, setShowGroupBy] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchCenters();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await axiosApi.get(GET_SKILLS_MATRIX_REPORT, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch data');
            }
        } catch (err) {
            console.error('Error fetching skills matrix:', err);
            setError(err.response?.data?.message || 'Error fetching skills matrix');
        } finally {
            setLoading(false);
        }
    };

    const fetchCenters = async () => {
        try {
            const response = await axiosApi.get(`${API_BASE_URL}/centerDetail`);
            setCenters(response.data || []);
        } catch (err) {
            console.error('Error fetching centers for skills matrix report:', err);
        }
    };

    const getCenterName = (item) => {
        if (!item) return 'N/A';
        const centerId = item.center_id ?? item.Center_ID ?? item.centre_id ?? item.centreId ?? null;
        const fallbackName = item.center_name || item.centre_name || item.center || item.centerName || null;
        if (centerId !== null && centerId !== undefined) {
            const center = centers.find(c => Number(c.id || c.ID) === Number(centerId));
            if (center) {
                return center.organisation_name || center.Organisation_Name || center.center_name || center.Center_Name || center.name || `Center ${centerId}`;
            }
            return fallbackName || `Center ${centerId}`;
        }
        return fallbackName || 'N/A';
    };

    const getUniqueValues = (field) => {
        return [...new Set(data.map(item => item[field]).filter(Boolean))].sort();
    };

    const processedData = useMemo(() => {
        let result = [...data];

        if (searchTerm) {
            result = result.filter(item =>
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.institution_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.cell_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getCenterName(item).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.status) {
            result = result.filter(item => item.status === filters.status);
        }

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, filters, sortConfig, centers]);

    const groupedData = useMemo(() => {
        if (!groupBy) return null;

        const grouped = {};
        processedData.forEach(item => {
            const key = item[groupBy] || 'Not Specified';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });

        return grouped;
    }, [processedData, groupBy]);

    const paginatedData = useMemo(() => {
        if (groupBy) return processedData;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage, groupBy]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const exportToCSV = () => {
        const headers = [
            'Employee Name', 'Center', 'ID Number', 'Department', 'Contact', 'Course',
            'Institution', 'Date Conducted', 'Date Expired', 'Outcome', 'Status', 'Created By'
        ];

        const csvData = processedData.map(item => [
            `${item.name} ${item.surname}`,
            getCenterName(item),
            item.id_number || '',
            item.department_name || '',
            item.cell_number || '',
            item.course_name || '',
            item.institution_name || '',
            formatDate(item.date_conducted),
            formatDate(item.date_expired),
            item.program_outcome_name || '',
            item.status || '',
            item.created_by || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `skills_matrix_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const clearFilters = () => {
        setFilters({ status: '' });
        setSearchTerm('');
        setGroupBy('');
        setSortConfig({ key: null, direction: 'asc' });
        setShowFilters(false);
        setShowGroupBy(false);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <i className="bx bx-sort text-muted"></i>;
        return sortConfig.direction === 'asc' ? 
            <i className="bx bx-sort-up text-primary"></i> : 
            <i className="bx bx-sort-down text-primary"></i>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'Expired': { color: 'danger', icon: 'bx-x-circle' },
            'Coming Up Soon': { color: 'warning', icon: 'bx-error-circle' },
            'Still Valid': { color: 'success', icon: 'bx-check-circle' },
            'No Expiry': { color: 'info', icon: 'bx-infinite' }
        };
        
        const config = statusConfig[status] || { color: 'secondary', icon: 'bx-help-circle' };
        
        return (
            <Badge color={config.color} className="font-size-12">
                <i className={`bx ${config.icon} me-1`}></i>
                {status}
            </Badge>
        );
    };

    const statusCounts = {
        'All': data.length,
        'Expired': processedData.filter(item => item.status === 'Expired').length,
        'Coming Up Soon': processedData.filter(item => item.status === 'Coming Up Soon').length,
        'Still Valid': processedData.filter(item => item.status === 'Still Valid').length,
        'No Expiry': processedData.filter(item => item.status === 'No Expiry').length
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <Spinner color="primary" className="me-2" />
                        <span>Loading skills matrix report...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <Alert color="danger">
                        <h5>Error Loading Report</h5>
                        <p>{error}</p>
                        <Button color="primary" onClick={fetchData}>Retry</Button>
                    </Alert>
                </div>
            </div>
        );
    }

    document.title = "Applicant Skills Report | Hudasa";

    return (
        <div className="page-content">
            <Container fluid>
                <Breadcrumbs title="Reports" breadcrumbItem="Applicant Skills Report" />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <Row className="mb-3">
                                    <Col sm={6}>
                                        <div className="d-flex align-items-center">
                                            <h4 className="card-title mb-0">
                                                <i className="bx bx-medal me-2"></i>
                                                Applicant Skills Report
                                            </h4>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="text-sm-end">
                                            <UncontrolledDropdown className="d-inline-block">
                                                <DropdownToggle color="primary" caret style={{ borderRadius: 0 }}>
                                                    <i className="bx bx-cog me-1"></i>
                                                    Actions
                                                    {Object.values(filters).filter(Boolean).length > 0 && 
                                                        <Badge color="light" className="ms-1">{Object.values(filters).filter(Boolean).length}</Badge>
                                                    }
                                                </DropdownToggle>
                                                <DropdownMenu end>
                                                    <DropdownItem header>Report Functions</DropdownItem>
                                                    <DropdownItem onClick={exportToCSV}>
                                                        <i className="bx bx-download me-2"></i>
                                                        Export to CSV
                                                    </DropdownItem>
                                                    <DropdownItem divider />
                                                    <DropdownItem header>Filters & Grouping</DropdownItem>
                                                    <DropdownItem onClick={() => setShowFilters(!showFilters)}>
                                                        <i className="bx bx-filter-alt me-2"></i>
                                                        {showFilters ? 'Hide' : 'Show'} Filters
                                                        {Object.values(filters).filter(Boolean).length > 0 && 
                                                            <Badge color="danger" className="ms-1">{Object.values(filters).filter(Boolean).length}</Badge>
                                                        }
                                                    </DropdownItem>
                                                    <DropdownItem onClick={() => setShowGroupBy(!showGroupBy)}>
                                                        <i className="bx bx-group me-2"></i>
                                                        {showGroupBy ? 'Hide' : 'Show'} Group By
                                                        {groupBy && <Badge color="success" className="ms-1">Active</Badge>}
                                                    </DropdownItem>
                                                    <DropdownItem divider />
                                                    <DropdownItem onClick={clearFilters}>
                                                        <i className="bx bx-reset me-2"></i>
                                                        Clear All Filters
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </UncontrolledDropdown>
                                        </div>
                                    </Col>
                                </Row>

                                {loading && (
                                    <div className="text-center my-5">
                                        <Spinner color="primary" />
                                        <p className="mt-2 text-muted">Loading data...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        <i className="bx bx-error-circle me-2"></i>
                                        {error}
                                    </div>
                                )}

                                {/* Advanced Filters */}
                                <Collapse isOpen={showFilters}>
                                    <div className="border p-3 mb-3 bg-light">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="mb-0">
                                                <i className="bx bx-filter me-2"></i>
                                                Advanced Filters
                                            </h6>
                                            <Button 
                                                color="light" 
                                                size="sm"
                                                onClick={() => setShowFilters(false)}
                                            >
                                                <i className="bx bx-x"></i>
                                            </Button>
                                        </div>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Status</Label>
                                                    <Input
                                                        type="select"
                                                        value={filters.status}
                                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                                    >
                                                        <option value="">All</option>
                                                        {getUniqueValues('status').map(val => (
                                                            <option key={val} value={val}>{val}</option>
                                                        ))}
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </div>
                                </Collapse>

                                {/* Group By Control */}
                                <Collapse isOpen={showGroupBy}>
                                    <div className="border p-3 mb-3 bg-light">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="mb-0">
                                                <i className="bx bx-group me-2"></i>
                                                Group By Options
                                            </h6>
                                            <Button 
                                                color="light" 
                                                size="sm"
                                                onClick={() => setShowGroupBy(false)}
                                            >
                                                <i className="bx bx-x"></i>
                                            </Button>
                                        </div>
                                        <Row>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Group By (Control Break)</Label>
                                                    <Input
                                                        type="select"
                                                        value={groupBy}
                                                        onChange={(e) => setGroupBy(e.target.value)}
                                                    >
                                                        <option value="">No Grouping</option>
                                                        <option value="status">Status</option>
                                                        <option value="department_name">Department</option>
                                                        <option value="course_name">Course</option>
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </div>
                                </Collapse>

                                {/* Search and Pagination Controls */}
                                {!loading && !error && data.length > 0 && (
                                    <Row className="mb-2">
                                        <Col sm={2}>
                                            <select
                                                className="form-select pageSize mb-2"
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                {[10, 20, 30, 40, 50].map(pageSize => (
                                                    <option key={pageSize} value={pageSize}>
                                                        Show {pageSize}
                                                    </option>
                                                ))}
                                            </select>
                                        </Col>
                                        <Col sm={4}>
                                            <Input
                                                type="text"
                                                className="form-control search-box me-2 mb-2 d-inline-block"
                                                placeholder="Search Skills Matrix..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                )}

                                {!loading && !error && data.length === 0 && (
                                    <div className="alert alert-info" role="alert">
                                        <i className="bx bx-info-circle me-2"></i>
                                        No skills matrix data found.
                                    </div>
                                )}
                                {!loading && !error && data.length > 0 && (
                                    <>
                                        {groupBy && groupedData ? (
                                    Object.entries(groupedData).map(([groupKey, groupItems]) => (
                                        <div key={groupKey} className="mb-4">
                                            <div className="bg-primary bg-soft p-3 mb-2 rounded">
                                                <h5 className="mb-0">
                                                    <i className="bx bx-group me-2"></i>
                                                    {groupKey} 
                                                    <Badge color="primary" className="ms-2">{groupItems.length} records</Badge>
                                                </h5>
                                            </div>
                                            <div className="table-responsive" style={{ maxHeight: '600px', overflowX: 'auto', overflowY: 'auto' }}>
                                                <Table hover className="table-bordered table-nowrap table-sm" style={{ minWidth: '1500px' }}>
                                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                        <tr>
                                                            <th style={{minWidth: '150px'}}>Employee</th>
                                                            <th style={{minWidth: '160px'}}>Center</th>
                                                            <th style={{minWidth: '120px'}}>ID Number</th>
                                                            <th style={{minWidth: '120px'}}>Department</th>
                                                            <th style={{minWidth: '120px'}}>Contact</th>
                                                            <th style={{minWidth: '200px'}}>Course</th>
                                                            <th style={{minWidth: '200px'}}>Institution</th>
                                                            <th style={{minWidth: '100px'}}>Conducted</th>
                                                            <th style={{minWidth: '100px'}}>Expires</th>
                                                            <th style={{minWidth: '100px'}}>Outcome</th>
                                                            <th style={{minWidth: '120px'}}>Status</th>
                                                            <th style={{minWidth: '120px'}}>Created By</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {groupItems.map((item, index) => (
                                                            <tr key={index}>
                                                                <td><strong>{item.name} {item.surname}</strong></td>
                                                                <td>{getCenterName(item)}</td>
                                                                <td>{item.id_number || '-'}</td>
                                                                <td><Badge color="secondary">{item.department_name || 'N/A'}</Badge></td>
                                                                <td>{item.cell_number || '-'}</td>
                                                                <td><strong>{item.course_name || '-'}</strong></td>
                                                                <td>{item.institution_name || '-'}</td>
                                                                <td>{formatDate(item.date_conducted)}</td>
                                                                <td>
                                                                    {item.date_expired ? (
                                                                        <span className={
                                                                            item.status === 'Expired' ? 'text-danger fw-bold' :
                                                                            item.status === 'Coming Up Soon' ? 'text-warning fw-bold' :
                                                                            'text-success'
                                                                        }>
                                                                            {formatDate(item.date_expired)}
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>
                                                                <td><Badge color="primary">{item.program_outcome_name || '-'}</Badge></td>
                                                                <td>{getStatusBadge(item.status)}</td>
                                                                <td>{item.created_by || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '600px', overflowX: 'auto', overflowY: 'auto' }}>
                                        <Table hover className="table-bordered table-nowrap" style={{ minWidth: '1500px' }}>
                                            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                                                <tr>
                                                    <th style={{cursor: 'pointer', minWidth: '150px'}} onClick={() => handleSort('name')}>
                                                        Employee Name {getSortIcon('name')}
                                                    </th>
                                                    <th style={{cursor: 'pointer', minWidth: '160px'}} onClick={() => handleSort('center_id')}>
                                                        Center {getSortIcon('center_id')}
                                                    </th>
                                                    <th style={{minWidth: '120px'}}>ID Number</th>
                                                    <th style={{cursor: 'pointer', minWidth: '120px'}} onClick={() => handleSort('department_name')}>
                                                        Department {getSortIcon('department_name')}
                                                    </th>
                                                    <th style={{minWidth: '120px'}}>Contact</th>
                                                    <th style={{cursor: 'pointer', minWidth: '200px'}} onClick={() => handleSort('course_name')}>
                                                        Course {getSortIcon('course_name')}
                                                    </th>
                                                    <th style={{cursor: 'pointer', minWidth: '200px'}} onClick={() => handleSort('institution_name')}>
                                                        Institution {getSortIcon('institution_name')}
                                                    </th>
                                                    <th style={{cursor: 'pointer', minWidth: '100px'}} onClick={() => handleSort('date_conducted')}>
                                                        Date Conducted {getSortIcon('date_conducted')}
                                                    </th>
                                                    <th style={{cursor: 'pointer', minWidth: '100px'}} onClick={() => handleSort('date_expired')}>
                                                        Date Expired {getSortIcon('date_expired')}
                                                    </th>
                                                    <th style={{minWidth: '100px'}}>Outcome</th>
                                                    <th style={{cursor: 'pointer', minWidth: '120px'}} onClick={() => handleSort('status')}>
                                                        Status {getSortIcon('status')}
                                                    </th>
                                                    <th style={{minWidth: '120px'}}>Created By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <strong>{item.name} {item.surname}</strong>
                                                    </td>
                                                    <td>{getCenterName(item)}</td>
                                                    <td>{item.id_number || '-'}</td>
                                                    <td>
                                                        <Badge color="secondary">
                                                            {item.department_name || 'N/A'}
                                                        </Badge>
                                                    </td>
                                                    <td>{item.cell_number || '-'}</td>
                                                    <td>
                                                        <strong>{item.course_name || '-'}</strong>
                                                    </td>
                                                    <td>{item.institution_name || '-'}</td>
                                                    <td>{formatDate(item.date_conducted)}</td>
                                                    <td>
                                                        {item.date_expired ? (
                                                            <span className={
                                                                item.status === 'Expired' ? 'text-danger fw-bold' :
                                                                item.status === 'Coming Up Soon' ? 'text-warning fw-bold' :
                                                                'text-success'
                                                            }>
                                                                {formatDate(item.date_expired)}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td>
                                                        <Badge color="primary">
                                                            {item.program_outcome_name || '-'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {getStatusBadge(item.status)}
                                                    </td>
                                                    <td>{item.created_by || '-'}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                    {/* Pagination */}
                                    {!groupBy && processedData.length > 0 && (
                                        <Row className="mt-3">
                                            <Col sm={12} md={5}>
                                                <div className="dataTables_info">
                                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} Results
                                                </div>
                                            </Col>
                                            <Col sm={12} md={7}>
                                                <div className="dataTables_paginate paging_simple_numbers float-end">
                                                    <ul className="pagination mb-0">
                                                        <li className={`paginate_button page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                                            <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>
                                                                <i className="mdi mdi-chevron-left"></i>
                                                            </Link>
                                                        </li>
                                                        {[...Array(totalPages)].map((_, i) => {
                                                            const pageNum = i + 1;
                                                            if (
                                                                pageNum === 1 ||
                                                                pageNum === totalPages ||
                                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                            ) {
                                                                return (
                                                                    <li key={pageNum} className={`paginate_button page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                                        <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); setCurrentPage(pageNum); }}>
                                                                            {pageNum}
                                                                        </Link>
                                                                    </li>
                                                                );
                                                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                                return <li key={pageNum} className="paginate_button page-item disabled"><span className="page-link">...</span></li>;
                                                            }
                                                            return null;
                                                        })}
                                                        <li className={`paginate_button page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                            <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>
                                                                <i className="mdi mdi-chevron-right"></i>
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                        {processedData.length === 0 && !loading && (
                                            <div className="text-center py-5">
                                                <i className="bx bx-search-alt" style={{ fontSize: '3rem', color: '#999' }}></i>
                                                <p className="text-muted mt-3">No skills matrix records found matching your search criteria.</p>
                                                <Button color="primary" size="sm" onClick={clearFilters}>
                                                    Clear Filters
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default SkillsMatrixReport;

