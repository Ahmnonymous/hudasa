import {
  FETCH_LOOKUP,
  FETCH_LOOKUP_SUCCESS,
  FETCH_LOOKUP_ERROR,
  CREATE_LOOKUP,
  CREATE_LOOKUP_SUCCESS,
  CREATE_LOOKUP_ERROR,
  UPDATE_LOOKUP,
  UPDATE_LOOKUP_SUCCESS,
  UPDATE_LOOKUP_ERROR,
  DELETE_LOOKUP,
  DELETE_LOOKUP_SUCCESS,
  DELETE_LOOKUP_ERROR,
} from "./actionTypes";

// Fetch lookup
export const fetchLookup = (table) => ({
  type: FETCH_LOOKUP,
  payload: table,
});

export const fetchLookupSuccess = (table, data) => ({
  type: FETCH_LOOKUP_SUCCESS,
  payload: { table, data },
});

export const fetchLookupError = (error) => ({
  type: FETCH_LOOKUP_ERROR,
  payload: error,
});

// Create lookup
export const createLookup = (table, data) => ({
  type: CREATE_LOOKUP,
  payload: { table, data },
});

export const createLookupSuccess = () => ({
  type: CREATE_LOOKUP_SUCCESS,
});

export const createLookupError = (error) => ({
  type: CREATE_LOOKUP_ERROR,
  payload: error,
});

// Update lookup
export const updateLookup = (table, id, data) => ({
  type: UPDATE_LOOKUP,
  payload: { table, id, data },
});

export const updateLookupSuccess = () => ({
  type: UPDATE_LOOKUP_SUCCESS,
});

export const updateLookupError = (error) => ({
  type: UPDATE_LOOKUP_ERROR,
  payload: error,
});

// Delete lookup
export const deleteLookup = (table, id) => ({
  type: DELETE_LOOKUP,
  payload: { table, id },
});

export const deleteLookupSuccess = () => ({
  type: DELETE_LOOKUP_SUCCESS,
});

export const deleteLookupError = (error) => ({
  type: DELETE_LOOKUP_ERROR,
  payload: error,
});

