import {
  FETCH_EMPLOYEES,
  FETCH_EMPLOYEES_SUCCESS,
  FETCH_EMPLOYEES_ERROR,
} from "./actionTypes";

const INIT_STATE = {
  employees: [],
  loading: false,
  error: null,
};

const employees = (state = INIT_STATE, action) => {
  switch (action.type) {
    case FETCH_EMPLOYEES:
      return { ...state, loading: true, error: null };
    case FETCH_EMPLOYEES_SUCCESS:
      return { ...state, loading: false, employees: action.payload };
    case FETCH_EMPLOYEES_ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default employees;
