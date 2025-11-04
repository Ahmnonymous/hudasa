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

const INIT_STATE = {
  data: {},
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
};

const lookup = (state = INIT_STATE, action) => {
  switch (action.type) {
    // Fetch
    case FETCH_LOOKUP:
      return { ...state, loading: true, error: null };
    
    case FETCH_LOOKUP_SUCCESS:
      return {
        ...state,
        loading: false,
        data: {
          ...state.data,
          [action.payload.table]: action.payload.data,
        },
        error: null,
      };
    
    case FETCH_LOOKUP_ERROR:
      return { ...state, loading: false, error: action.payload };

    // Create
    case CREATE_LOOKUP:
      return { ...state, actionLoading: true, actionError: null };
    
    case CREATE_LOOKUP_SUCCESS:
      return { ...state, actionLoading: false, actionError: null };
    
    case CREATE_LOOKUP_ERROR:
      return { ...state, actionLoading: false, actionError: action.payload };

    // Update
    case UPDATE_LOOKUP:
      return { ...state, actionLoading: true, actionError: null };
    
    case UPDATE_LOOKUP_SUCCESS:
      return { ...state, actionLoading: false, actionError: null };
    
    case UPDATE_LOOKUP_ERROR:
      return { ...state, actionLoading: false, actionError: action.payload };

    // Delete
    case DELETE_LOOKUP:
      return { ...state, actionLoading: true, actionError: null };
    
    case DELETE_LOOKUP_SUCCESS:
      return { ...state, actionLoading: false, actionError: null };
    
    case DELETE_LOOKUP_ERROR:
      return { ...state, actionLoading: false, actionError: action.payload };

    default:
      return state;
  }
};

export default lookup;

