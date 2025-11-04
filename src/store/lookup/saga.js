import { call, put, takeEvery } from "redux-saga/effects";
import {
  FETCH_LOOKUP,
  CREATE_LOOKUP,
  UPDATE_LOOKUP,
  DELETE_LOOKUP,
} from "./actionTypes";
import {
  fetchLookupSuccess,
  fetchLookupError,
  createLookupSuccess,
  createLookupError,
  updateLookupSuccess,
  updateLookupError,
  deleteLookupSuccess,
  deleteLookupError,
  fetchLookup,
} from "./actions";
import { get, post, put as putApi, del } from "../../helpers/api_helper";

// Fetch lookup data
function* fetchLookupSaga({ payload: table }) {
  try {
    const data = yield call(() => get(`/lookup/${table}`));
    yield put(fetchLookupSuccess(table, data));
  } catch (error) {
    yield put(fetchLookupError(error.message));
  }
}

// Create lookup entry
function* createLookupSaga({ payload }) {
  const { table, data } = payload;
  try {
    yield call(() => post(`/lookup/${table}`, data));
    yield put(createLookupSuccess());
    yield put(fetchLookup(table)); // Reload data
  } catch (error) {
    yield put(createLookupError(error.message));
  }
}

// Update lookup entry
function* updateLookupSaga({ payload }) {
  const { table, id, data } = payload;
  try {
    yield call(() => putApi(`/lookup/${table}/${id}`, data));
    yield put(updateLookupSuccess());
    yield put(fetchLookup(table)); // Reload data
  } catch (error) {
    yield put(updateLookupError(error.message));
  }
}

// Delete lookup entry
function* deleteLookupSaga({ payload }) {
  const { table, id } = payload;
  try {
    yield call(() => del(`/lookup/${table}/${id}`));
    yield put(deleteLookupSuccess());
    yield put(fetchLookup(table)); // Reload data
  } catch (error) {
    yield put(deleteLookupError(error.message));
  }
}

export default function* lookupSaga() {
  yield takeEvery(FETCH_LOOKUP, fetchLookupSaga);
  yield takeEvery(CREATE_LOOKUP, createLookupSaga);
  yield takeEvery(UPDATE_LOOKUP, updateLookupSaga);
  yield takeEvery(DELETE_LOOKUP, deleteLookupSaga);
}

