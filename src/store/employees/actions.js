import {
  FETCH_EMPLOYEES,
  FETCH_EMPLOYEES_SUCCESS,
  FETCH_EMPLOYEES_ERROR,
  CREATE_EMPLOYEE,
  UPDATE_EMPLOYEE,
  DELETE_EMPLOYEE
} from "./actionTypes";

export const fetchEmployees = () => ({ type: FETCH_EMPLOYEES });
export const fetchEmployeesSuccess = (employees) => ({ type: FETCH_EMPLOYEES_SUCCESS, payload: employees });
export const fetchEmployeesError = (error) => ({ type: FETCH_EMPLOYEES_ERROR, payload: error });

export const createEmployee = (employee) => ({ type: CREATE_EMPLOYEE, payload: employee });
export const updateEmployee = (employee) => ({ type: UPDATE_EMPLOYEE, payload: employee });
export const deleteEmployee = (id) => ({ type: DELETE_EMPLOYEE, payload: id });
