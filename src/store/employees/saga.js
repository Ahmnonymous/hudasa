import { call, put, takeEvery } from "redux-saga/effects";
import { FETCH_EMPLOYEES, CREATE_EMPLOYEE, UPDATE_EMPLOYEE, DELETE_EMPLOYEE } from "./actionTypes";
import { fetchEmployeesSuccess, fetchEmployeesError, fetchEmployees } from "./actions";
import { get, post, put as putApi, del } from "../../helpers/api_helper";

function* fetchEmployeesSaga() {
  try {
    const employees = yield call(() => get("/employee"));
    yield put(fetchEmployeesSuccess(employees));
  } catch (error) {
    yield put(fetchEmployeesError(error.message));
  }
}

function* createEmployeeSaga({ payload }) {
  try {
    yield call(() => post("/employee", payload));
    yield put(fetchEmployees()); // reload
  } catch (error) {
    yield put(fetchEmployeesError(error.message));
  }
}

function* updateEmployeeSaga({ payload }) {
  try {
    yield call(() => putApi(`/employee/${payload.id}`, payload));
    yield put(fetchEmployees());
  } catch (error) {
    yield put(fetchEmployeesError(error.message));
  }
}

function* deleteEmployeeSaga({ payload }) {
  try {
    yield call(() => del(`/employee/${payload}`));
    yield put(fetchEmployees());
  } catch (error) {
    yield put(fetchEmployeesError(error.message));
  }
}

export default function* employeesSaga() {
  yield takeEvery(FETCH_EMPLOYEES, fetchEmployeesSaga);
  yield takeEvery(CREATE_EMPLOYEE, createEmployeeSaga);
  yield takeEvery(UPDATE_EMPLOYEE, updateEmployeeSaga);
  yield takeEvery(DELETE_EMPLOYEE, deleteEmployeeSaga);
}
