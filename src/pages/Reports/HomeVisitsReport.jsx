import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, CardBody, Row, Col, Table, Spinner, Alert, Button, Input, Label, FormGroup, Badge, Collapse, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import axiosApi from '../../helpers/api_helper';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import { GET_HOME_VISITS_REPORT } from '../../helpers/url_helper';

const HomeVisitsReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [groupBy, setGroupBy] = useState('');
    const [showGroupBy, setShowGroupBy] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await axiosApi.get(GET_HOME_VISITS_REPORT, {
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
            console.error('Error fetching home visits:', err);
            setError(err.response?.data?.message || 'Error fetching home visits');
        } finally {
            setLoading(false);
        }
    };

    const processedData = useMemo(() => {
        let result = [...data];

        if (searchTerm) {
            result = result.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.representative?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.cell_number?.toLowerCase().includes(searchTerm.toLowerCase())
            );
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
    }, [data, searchTerm, sortConfig]);

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
    }, [searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const exportToCSV = () => {
        const headers = [
            'File Number', 'Name', 'Surname', 'Cell Number', 'Visit Date',
            'Representative', 'Comments', 'Created By', 'Created At'
        ];

        const csvData = processedData.map(item => [
            item.file_number || '',
            item.name || '',
            item.surname || '',
            item.cell_number || '',
            formatDate(item.visit_date),
            item.representative || '',
            item.comments || '',
            item.created_by || '',
            formatDate(item.created_at)
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `home_visits_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setGroupBy('');
        setSortConfig({ key: null, direction: 'asc' });
        setShowGroupBy(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <i className="bx bx-sort text-muted"></i>;
        return sortConfig.direction === 'asc' ? 
            <i className="bx bx-sort-up text-primary"></i> : 
            <i className="bx bx-sort-down text-primary"></i>;
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <Spinner color="primary" className="me-2" />
                        <span>Loading home visits report...</span>
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

    return (
        <div className="page-content">
            <Container fluid>
                <Breadcrumbs title="Reports" breadcrumbItem="Home Visits Report" />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <Row className="mb-3">
                                    <Col sm={6}>
                                        <div className="d-flex align-items-center">
                                            <h4 className="card-title mb-0">
                                <i className="bx bx-car me-2"></i>
                                Home Visits Report
                            </h4>
                            </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="text-sm-end">
                                            <UncontrolledDropdown className="d-inline-block">
                                                <DropdownToggle color="primary" caret style={{ borderRadius: 0 }}>
                                                    <i className="bx bx-cog me-1"></i>
                                                    Actions
                                                </DropdownToggle>
                                                <DropdownMenu end>
                                                    <DropdownItem header>Report Functions</DropdownItem>
                                                    <DropdownItem onClick={exportToCSV}>
                                                        <i className="bx bx-download me-2"></i>
                                                        Export to CSV
                                                    </DropdownItem>
                                                    <DropdownItem divider />
                                                    <DropdownItem header>Filters & Grouping</DropdownItem>
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
                                                        <option value="representative">Representative</option>
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
                                                placeholder="Search Home Visits..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                    </Col>
                                </Row>
                                )}

                                {!loading && !error && data.length === 0 && (
                                    <div className="alert alert-info" role="alert">
                                        <i className="bx bx-info-circle me-2"></i>
                                        No home visit data found.
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
                                                <Table hover className="table-bordered table-nowrap table-sm" style={{ minWidth: '1200px' }}>
                                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                        <tr>
                                                            <th style={{minWidth: '120px'}}>File #</th>
                                                            <th style={{minWidth: '150px'}}>Name</th>
                                                            <th style={{minWidth: '120px'}}>Contact</th>
                                                            <th style={{minWidth: '100px'}}>Visit Date</th>
                                                            <th style={{minWidth: '150px'}}>Representative</th>
                                                            <th style={{minWidth: '300px'}}>Comments</th>
                                                            <th style={{minWidth: '120px'}}>Created By</th>
                                                            <th style={{minWidth: '100px'}}>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                                        {groupItems.map((item, index) => (
                                                <tr key={index}>
                                                                <td><strong>{item.file_number || '-'}</strong></td>
                                                                <td>{item.name} {item.surname}</td>
                                                    <td>{item.cell_number || '-'}</td>
                                                    <td>{formatDate(item.visit_date)}</td>
                                                                <td>{item.representative || '-'}</td>
                                                                <td><small>{item.comments || '-'}</small></td>
                                                                <td>{item.created_by || '-'}</td>
                                                    <td>{formatDate(item.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                                        </div>
                                                        </div>
                                    ))
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '600px', overflowX: 'auto', overflowY: 'auto' }}>
                                        <Table hover className="table-bordered table-nowrap" style={{ minWidth: '1200px' }}>
                                            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                                                <tr>
                                                    <th style={{cursor: 'pointer', minWidth: '120px'}} onClick={() => handleSort('file_number')}>
                                                        File Number {getSortIcon('file_number')}
                                                    </th>
                                                    <th style={{cursor: 'pointer', minWidth: '150px'}} onClick={() => handleSort('name')}>
                                                        Name {getSortIcon('name')}
                                                    </th>
                                                    <th style={{minWidth: '120px'}}>Cell Number</th>
                                                    <th style={{cursor: 'pointer', minWidth: '100px'}} onClick={() => handleSort('visit_date')}>
                                                        Visit Date {getSortIcon('visit_date')}
                                                    </th>
                                                    <th style={{cursor: 'pointer', minWidth: '150px'}} onClick={() => handleSort('representative')}>
                                                        Representative {getSortIcon('representative')}
                                                    </th>
                                                    <th style={{minWidth: '300px'}}>Comments</th>
                                                    <th style={{minWidth: '120px'}}>Created By</th>
                                                    <th style={{cursor: 'pointer', minWidth: '100px'}} onClick={() => handleSort('created_at')}>
                                                        Created Date {getSortIcon('created_at')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.map((item, index) => (
                                                    <tr key={index}>
                                                        <td><strong>{item.file_number || '-'}</strong></td>
                                                        <td>{item.name} {item.surname}</td>
                                                        <td>{item.cell_number || '-'}</td>
                                                        <td>{formatDate(item.visit_date)}</td>
                                                        <td>{item.representative || '-'}</td>
                                                        <td><small>{item.comments || '-'}</small></td>
                                                        <td>{item.created_by || '-'}</td>
                                                    <td>{formatDate(item.created_at)}</td>
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
                                                <p className="text-muted mt-3">No home visit records found matching your search criteria.</p>
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

export default HomeVisitsReport;
