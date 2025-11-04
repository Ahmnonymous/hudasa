import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, CardBody, Row, Col, Table, Spinner, Alert, Button, Input, Label, FormGroup, Badge, Collapse, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import axiosApi from '../../helpers/api_helper';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import { GET_APPLICANT_DETAILS_REPORT } from '../../helpers/url_helper';

const ApplicantDetailsReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Advanced Filters
    const [filters, setFilters] = useState({
        fileStatus: '',
        employmentStatus: '',
        gender: '',
        race: '',
        nationality: '',
        fileCondition: '',
        maritalStatus: '',
        dwellingType: ''
    });

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Group By
    const [groupBy, setGroupBy] = useState('');

    // UI State
    const [showFilters, setShowFilters] = useState(false);
    const [showGroupBy, setShowGroupBy] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await axiosApi.get(GET_APPLICANT_DETAILS_REPORT, {
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
            console.error('Error fetching applicant details:', err);
            setError(err.response?.data?.message || 'Error fetching applicant details');
        } finally {
            setLoading(false);
        }
    };

    // Get unique values for filters
    const getUniqueValues = (field) => {
        return [...new Set(data.map(item => item[field]).filter(Boolean))].sort();
    };

    // Filter, Search, and Sort Data
    const processedData = useMemo(() => {
        let result = [...data];

        // Apply search
        if (searchTerm) {
            result = result.filter(item => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    item.name?.toLowerCase().includes(searchLower) ||
                    item.surname?.toLowerCase().includes(searchLower) ||
                    item.file_number?.toLowerCase().includes(searchLower) ||
                    item.id_number?.toLowerCase().includes(searchLower) ||
                    item.cell_number?.toLowerCase().includes(searchLower) ||
                    item.alternate_number?.toLowerCase().includes(searchLower) ||
                    item.email_address?.toLowerCase().includes(searchLower) ||
                    item.street_address?.toLowerCase().includes(searchLower) ||
                    item.flat_name?.toLowerCase().includes(searchLower) ||
                    item.flat_number?.toLowerCase().includes(searchLower) ||
                    item.gender_name?.toLowerCase().includes(searchLower) ||
                    item.race_name?.toLowerCase().includes(searchLower) ||
                    item.nationality_name?.toLowerCase().includes(searchLower) ||
                    item.file_status_name?.toLowerCase().includes(searchLower) ||
                    item.file_condition_name?.toLowerCase().includes(searchLower) ||
                    item.employment_status_name?.toLowerCase().includes(searchLower) ||
                    item.marital_status_name?.toLowerCase().includes(searchLower) ||
                    item.education_level_name?.toLowerCase().includes(searchLower) ||
                    item.suburb_name?.toLowerCase().includes(searchLower) ||
                    item.dwelling_type_name?.toLowerCase().includes(searchLower) ||
                    item.dwelling_status_name?.toLowerCase().includes(searchLower) ||
                    item.health_condition_name?.toLowerCase().includes(searchLower) ||
                    item.skills_name?.toLowerCase().includes(searchLower) ||
                    item.popia_agreement?.toLowerCase().includes(searchLower) ||
                    item.created_by?.toLowerCase().includes(searchLower) ||
                    item.born_religion_name?.toLowerCase().includes(searchLower) ||
                    item.period_as_muslim_name?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Apply filters
        if (filters.fileStatus) {
            result = result.filter(item => item.file_status_name === filters.fileStatus);
        }
        if (filters.employmentStatus) {
            result = result.filter(item => item.employment_status_name === filters.employmentStatus);
        }
        if (filters.gender) {
            result = result.filter(item => item.gender_name === filters.gender);
        }
        if (filters.race) {
            result = result.filter(item => item.race_name === filters.race);
        }
        if (filters.nationality) {
            result = result.filter(item => item.nationality_name === filters.nationality);
        }
        if (filters.fileCondition) {
            result = result.filter(item => item.file_condition_name === filters.fileCondition);
        }
        if (filters.maritalStatus) {
            result = result.filter(item => item.marital_status_name === filters.maritalStatus);
        }
        if (filters.dwellingType) {
            result = result.filter(item => item.dwelling_type_name === filters.dwellingType);
        }

        // Apply sorting
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
    }, [data, searchTerm, filters, sortConfig]);

    // Group data if groupBy is selected
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

    // Paginate data
    const paginatedData = useMemo(() => {
        if (groupBy) return processedData; // Don't paginate grouped data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return processedData.slice(startIndex, endIndex);
    }, [processedData, currentPage, itemsPerPage, groupBy]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortConfig]);

    // Handle sorting
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = [
            'File Number', 'Name', 'Surname', 'ID Number', 'Gender', 'Race', 'Nationality',
            'Employment Status', 'File Status', 'File Condition', 'Marital Status',
            'Education Level', 'Cell Number', 'Alternate Number', 'Email', 'Suburb', 'Address', 
            'Dwelling Type', 'Dwelling Status', 'Health Condition', 'Skills', 'Date Intake', 
            'Nationality Expiry', 'POPIA Agreement', 'Created By', 'Created At'
        ];

        const csvData = processedData.map(item => [
            item.file_number || '',
            item.name || '',
            item.surname || '',
            item.id_number || '',
            item.gender_name || '',
            item.race_name || '',
            item.nationality_name || '',
            item.employment_status_name || '',
            item.file_status_name || '',
            item.file_condition_name || '',
            item.marital_status_name || '',
            item.education_level_name || '',
            item.cell_number || '',
            item.alternate_number || '',
            item.email_address || '',
            item.suburb_name || '',
            item.street_address || '',
            item.dwelling_type_name || '',
            item.dwelling_status_name || '',
            item.health_condition_name || '',
            item.skills_name || '',
            formatDate(item.date_intake),
            formatDate(item.nationality_expiry_date),
            item.popia_agreement || '',
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
        link.download = `applicant_details_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            fileStatus: '',
            employmentStatus: '',
            gender: '',
            race: '',
            nationality: '',
            fileCondition: '',
            maritalStatus: '',
            dwellingType: ''
        });
        setSearchTerm('');
        setGroupBy('');
        setSortConfig({ key: null, direction: 'asc' });
        setShowFilters(false);
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
                        <span>Loading applicant details...</span>
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

    document.title = "Applicant Details Report | Hudasa";

    return (
        <div className="page-content">
            <Container fluid>
                <Breadcrumbs title="Reports" breadcrumbItem="Applicant Details Report" />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <Row className="mb-3">
                                    <Col sm={6}>
                                        <div className="d-flex align-items-center">
                                            <h4 className="card-title mb-0">
                                <i className="bx bx-user-plus me-2"></i>
                                Applicant Details Report
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
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>File Status</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.fileStatus}
                                                            onChange={(e) => setFilters({...filters, fileStatus: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('file_status_name').map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>Employment Status</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.employmentStatus}
                                                            onChange={(e) => setFilters({...filters, employmentStatus: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('employment_status_name').map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>Gender</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.gender}
                                                            onChange={(e) => setFilters({...filters, gender: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('gender_name').map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>File Condition</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.fileCondition}
                                                            onChange={(e) => setFilters({...filters, fileCondition: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('file_condition_name').map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>Race</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.race}
                                                            onChange={(e) => setFilters({...filters, race: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('race_name').map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>Nationality</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.nationality}
                                                            onChange={(e) => setFilters({...filters, nationality: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('nationality_name').map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>Marital Status</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.maritalStatus}
                                                            onChange={(e) => setFilters({...filters, maritalStatus: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('marital_status_name').map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                    </Col>
                                                <Col md={3}>
                                                    <FormGroup>
                                                        <Label>Dwelling Type</Label>
                                                        <Input
                                                            type="select"
                                                            value={filters.dwellingType}
                                                            onChange={(e) => setFilters({...filters, dwellingType: e.target.value})}
                                                        >
                                                            <option value="">All</option>
                                                            {getUniqueValues('dwelling_type_name').map(val => (
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
                                                        <option value="file_status_name">File Status</option>
                                                        <option value="employment_status_name">Employment Status</option>
                                                        <option value="gender_name">Gender</option>
                                                        <option value="race_name">Race</option>
                                                        <option value="nationality_name">Nationality</option>
                                                        <option value="file_condition_name">File Condition</option>
                                                        <option value="marital_status_name">Marital Status</option>
                                                        <option value="suburb_name">Suburb</option>
                                                        <option value="dwelling_type_name">Dwelling Type</option>
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
                                                placeholder="Search Applicant Details..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                    </Col>
                                </Row>
                                )}

                                {!loading && !error && data.length === 0 && (
                                    <div className="alert alert-info" role="alert">
                                        <i className="bx bx-info-circle me-2"></i>
                                        No applicant data found.
                                    </div>
                                )}
                                {!loading && !error && data.length > 0 && (
                                    <>
                                        {groupBy && groupedData ? (
                                            // Grouped View with Control Breaks
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
                                                        <Table hover className="table-bordered table-nowrap table-sm" style={{ minWidth: '3000px' }}>
                                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                        <tr>
                                                            <th style={{cursor: 'pointer', minWidth: '120px'}} onClick={() => handleSort('file_number')}>
                                                                File # {getSortIcon('file_number')}
                                                            </th>
                                                            <th style={{cursor: 'pointer', minWidth: '150px'}} onClick={() => handleSort('name')}>
                                                                Name {getSortIcon('name')}
                                                            </th>
                                                            <th style={{minWidth: '120px'}}>ID Number</th>
                                                            <th style={{minWidth: '80px'}}>Gender</th>
                                                            <th style={{minWidth: '80px'}}>Race</th>
                                                            <th style={{minWidth: '120px'}}>Nationality</th>
                                                            <th style={{minWidth: '100px'}}>Nat. Expiry</th>
                                                            <th style={{minWidth: '150px'}}>Employment</th>
                                                            <th style={{minWidth: '100px'}}>File Status</th>
                                                            <th style={{minWidth: '100px'}}>Condition</th>
                                                            <th style={{minWidth: '120px'}}>Marital Status</th>
                                                            <th style={{minWidth: '150px'}}>Education</th>
                                                            <th style={{minWidth: '120px'}}>Cell Number</th>
                                                            <th style={{minWidth: '120px'}}>Alt. Number</th>
                                                            <th style={{minWidth: '200px'}}>Email</th>
                                                            <th style={{minWidth: '120px'}}>Suburb</th>
                                                            <th style={{minWidth: '250px'}}>Address</th>
                                                            <th style={{minWidth: '120px'}}>Dwelling Type</th>
                                                            <th style={{minWidth: '120px'}}>Dwelling Status</th>
                                                            <th style={{minWidth: '120px'}}>Health</th>
                                                            <th style={{minWidth: '120px'}}>Skills</th>
                                                            <th style={{minWidth: '100px'}}>Date Intake</th>
                                                            <th style={{minWidth: '100px'}}>POPIA</th>
                                                            <th style={{minWidth: '120px'}}>Created By</th>
                                                            <th style={{minWidth: '100px'}}>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                                        {groupItems.map((item) => (
                                                <tr key={item.id}>
                                                                <td><strong>{item.file_number || '-'}</strong></td>
                                                                <td>{item.name} {item.surname}</td>
                                                                <td><small>{item.id_number || '-'}</small></td>
                                                                <td><Badge color="secondary">{item.gender_name || '-'}</Badge></td>
                                                                <td>{item.race_name || '-'}</td>
                                                                <td>{item.nationality_name || '-'}</td>
                                                                <td>{formatDate(item.nationality_expiry_date)}</td>
                                                                <td>
                                                                    <Badge color={item.employment_status_name === 'Unemployed' ? 'danger' : 
                                                                        item.employment_status_name?.includes('Employed') ? 'success' : 'secondary'}>
                                                                        {item.employment_status_name || '-'}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    <Badge color={item.file_status_name === 'Active' ? 'success' : 'secondary'}>
                                                                        {item.file_status_name || '-'}
                                                                    </Badge>
                                                    </td>
                                                    <td>
                                                                    <Badge color={item.file_condition_name === 'High Risk' ? 'danger' : 
                                                                        item.file_condition_name === 'Caution' ? 'warning' : 'success'}>
                                                                        {item.file_condition_name || '-'}
                                                                    </Badge>
                                                    </td>
                                                                <td>{item.marital_status_name || '-'}</td>
                                                                <td>{item.education_level_name || '-'}</td>
                                                                <td>{item.cell_number || '-'}</td>
                                                                <td>{item.alternate_number || '-'}</td>
                                                                <td><small>{item.email_address || '-'}</small></td>
                                                                <td>{item.suburb_name || '-'}</td>
                                                                <td><small>{item.street_address || '-'}</small></td>
                                                                <td>{item.dwelling_type_name || '-'}</td>
                                                                <td>{item.dwelling_status_name || '-'}</td>
                                                                <td>{item.health_condition_name || '-'}</td>
                                                                <td>{item.skills_name || '-'}</td>
                                                                <td>{formatDate(item.date_intake)}</td>
                                                                <td>{item.popia_agreement || '-'}</td>
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
                                                <Table hover className="table-bordered table-nowrap" style={{ minWidth: '3000px' }}>
                                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                                                        <tr>
                                                            <th style={{cursor: 'pointer', minWidth: '120px', whiteSpace: 'nowrap'}} onClick={() => handleSort('file_number')}>
                                                                File Number {getSortIcon('file_number')}
                                                            </th>
                                                            <th style={{cursor: 'pointer', minWidth: '150px'}} onClick={() => handleSort('name')}>
                                                                Name {getSortIcon('name')}
                                                            </th>
                                                            <th style={{minWidth: '120px'}}>ID Number</th>
                                                            <th style={{minWidth: '80px'}}>Gender</th>
                                                            <th style={{minWidth: '80px'}}>Race</th>
                                                            <th style={{minWidth: '120px'}}>Nationality</th>
                                                            <th style={{minWidth: '100px'}}>Nat. Expiry</th>
                                                            <th style={{cursor: 'pointer', minWidth: '150px'}} onClick={() => handleSort('employment_status_name')}>
                                                                Employment {getSortIcon('employment_status_name')}
                                                            </th>
                                                            <th style={{cursor: 'pointer', minWidth: '100px'}} onClick={() => handleSort('file_status_name')}>
                                                                File Status {getSortIcon('file_status_name')}
                                                            </th>
                                                            <th style={{cursor: 'pointer', minWidth: '100px'}} onClick={() => handleSort('file_condition_name')}>
                                                                Condition {getSortIcon('file_condition_name')}
                                                            </th>
                                                            <th style={{minWidth: '120px'}}>Marital Status</th>
                                                            <th style={{minWidth: '150px'}}>Education Level</th>
                                                            <th style={{minWidth: '120px'}}>Cell Number</th>
                                                            <th style={{minWidth: '120px'}}>Alt. Number</th>
                                                            <th style={{minWidth: '200px'}}>Email Address</th>
                                                            <th style={{minWidth: '120px'}}>Suburb</th>
                                                            <th style={{minWidth: '250px'}}>Street Address</th>
                                                            <th style={{minWidth: '120px'}}>Dwelling Type</th>
                                                            <th style={{minWidth: '120px'}}>Dwelling Status</th>
                                                            <th style={{minWidth: '120px'}}>Health Condition</th>
                                                            <th style={{minWidth: '120px'}}>Skills</th>
                                                            <th style={{minWidth: '100px'}}>Date Intake</th>
                                                            <th style={{minWidth: '100px'}}>POPIA Agreement</th>
                                                            <th style={{minWidth: '120px'}}>Created By</th>
                                                            <th style={{minWidth: '100px'}}>Created At</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedData.map((item) => (
                                                            <tr key={item.id}>
                                                                <td><strong>{item.file_number || '-'}</strong></td>
                                                                <td>{item.name} {item.surname}</td>
                                                                <td>{item.id_number || '-'}</td>
                                                                <td><Badge color="secondary">{item.gender_name || '-'}</Badge></td>
                                                                <td>{item.race_name || '-'}</td>
                                                                <td>{item.nationality_name || '-'}</td>
                                                                <td>{formatDate(item.nationality_expiry_date)}</td>
                                                                <td>
                                                                    <Badge color={item.employment_status_name === 'Unemployed' ? 'danger' : 
                                                                        item.employment_status_name?.includes('Employed') ? 'success' : 'secondary'}>
                                                                        {item.employment_status_name || '-'}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    <Badge color={item.file_status_name === 'Active' ? 'success' : 'secondary'}>
                                                                        {item.file_status_name || '-'}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    <Badge color={item.file_condition_name === 'High Risk' ? 'danger' : 
                                                                        item.file_condition_name === 'Caution' ? 'warning' : 'success'}>
                                                                        {item.file_condition_name || '-'}
                                                                    </Badge>
                                                                </td>
                                                                <td>{item.marital_status_name || '-'}</td>
                                                                <td>{item.education_level_name || '-'}</td>
                                                                <td>{item.cell_number || '-'}</td>
                                                                <td>{item.alternate_number || '-'}</td>
                                                                <td><small>{item.email_address || '-'}</small></td>
                                                                <td>{item.suburb_name || '-'}</td>
                                                                <td><small>{item.street_address || '-'}</small></td>
                                                                <td>{item.dwelling_type_name || '-'}</td>
                                                                <td>{item.dwelling_status_name || '-'}</td>
                                                                <td>{item.health_condition_name || '-'}</td>
                                                                <td>{item.skills_name || '-'}</td>
                                                                <td>{formatDate(item.date_intake)}</td>
                                                                <td>{item.popia_agreement || '-'}</td>
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
                                                        <ul className="pagination pagination-rounded mb-0">
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
                                                <p className="text-muted mt-3">No applicants found matching your search criteria.</p>
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

export default ApplicantDetailsReport;
