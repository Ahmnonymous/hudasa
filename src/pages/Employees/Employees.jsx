import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "reactstrap";

// Skote components
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";

// Redux actions
import { fetchEmployees } from "../../store/employees/actions";

const Employees = () => {
  const dispatch = useDispatch();

  // ✅ Select fields separately (prevents memoization warning)
  const employees = useSelector((state) => state.Employees.employees);
  const loading = useSelector((state) => state.Employees.loading);
  const error = useSelector((state) => state.Employees.error);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
      },
      {
        header: "Username",
        accessorKey: "username",
        enableSorting: true,
      },
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
      },
      {
        header: "Surname",
        accessorKey: "surname",
        enableSorting: true,
      },
      {
        header: "User Type",
        accessorKey: "user_type",
        enableSorting: true,
      },
      {
        header: "Department",
        accessorKey: "department",
        enableSorting: true,
      },
    ],
    []
  );

  // Meta title
  document.title = "Employees | Weflare App";

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Breadcrumbs title="Employees" breadcrumbItem="Employee List" />

        {loading && (
          <div className="text-center my-3">
            <Spinner color="primary" />
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <TableContainer
            columns={columns}
            data={employees || []}
            isGlobalFilter={true}
            isPagination={true}
            SearchPlaceholder="Search employees..."
            pagination="pagination"
            paginationWrapper="dataTables_paginate paging_simple_numbers"
            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
          />
        )}
      </div>
    </div>
  );
};

Employees.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default Employees;
