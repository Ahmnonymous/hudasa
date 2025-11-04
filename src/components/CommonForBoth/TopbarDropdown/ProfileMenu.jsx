import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";

//i18n
import { withTranslation } from "react-i18next";

// Redux
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import withRouter from "../../Common/withRouter";

// users
import user1 from "../../../assets/images/users/avatar-1.jpg";

const ProfileMenu = (props) => {
  // Declare a new state variable, which we'll call "menu"
  const [menu, setMenu] = useState(false);

  const [username, setusername] = useState("Admin");
  const [userId, setUserId] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userFullName, setUserFullName] = useState("");

  const fetchEmployeeAvatar = useCallback(async (employeeId) => {
    try {
      const response = await axiosApi.get(`${API_BASE_URL}/employee/${employeeId}`);
      const employee = response.data;
      
      if (employee?.employee_avatar) {
        setUserAvatar(employee.employee_avatar);
      }
      
      // Set full name for fallback avatar
      if (employee?.name && employee?.surname) {
        setUserFullName(`${employee.name} ${employee.surname}`);
      }
    } catch (error) {
      console.error("Error fetching employee avatar:", error);
      // Don't show error to user, just use default avatar
    }
  }, []);

  useEffect(() => {
    // Get user data from HudasaUser in localStorage
    const userDataStr = localStorage.getItem("HudasaUser");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setusername(userData.username || userData.email || "Admin");
        setUserId(userData.user_id || userData.id);
        
        // Fetch employee details to get avatar
        if (userData.user_id || userData.id) {
          fetchEmployeeAvatar(userData.user_id || userData.id);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    // Fallback to authUser if HudasaUser not found
    else if (localStorage.getItem("authUser")) {
      if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.email);
      } else if (
        import.meta.env.VITE_APP_DEFAULTAUTH === "fake" ||
        import.meta.env.VITE_APP_DEFAULTAUTH === "jwt"
      ) {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.username);
      }
    }
  }, [props.success, userId, fetchEmployeeAvatar]);

  // Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdate = () => {
      // Only refetch if we have a userId (is the logged-in user)
      if (userId) {
        fetchEmployeeAvatar(userId);
      }
    };

    window.addEventListener("employeeAvatarUpdated", handleAvatarUpdate);
    
    return () => {
      window.removeEventListener("employeeAvatarUpdated", handleAvatarUpdate);
    };
  }, [userId, fetchEmployeeAvatar]);

  // Generate fallback avatar URL if no custom avatar
  const avatarUrl = userAvatar || 
    (userFullName 
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&size=40&background=1976d2&color=ffffff&bold=true`
      : user1);

  return (
    <React.Fragment>
      <Dropdown
        isOpen={menu}
        toggle={() => setMenu(!menu)}
        className="d-inline-block"
      >
        <DropdownToggle
          className="btn header-item "
          id="page-header-user-dropdown"
          tag="button"
        >
          <img
            className="rounded-circle header-profile-user"
            src={avatarUrl}
            alt="Header Avatar"
          />
          <span className="d-none d-xl-inline-block ms-2 me-1">{username}</span>
          <i className="mdi mdi-chevron-down d-none d-xl-inline-block" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <Link 
            to={userId ? `/employees/profile/${userId}` : "/profile"} 
            className="dropdown-item"
          >
            <i className="bx bx-user font-size-16 align-middle me-1" />
            {props.t("Profile")}
          </Link>
          <div className="dropdown-divider" />
          <Link to="/logout" className="dropdown-item">
            <i className="bx bx-power-off font-size-16 align-middle me-1 text-danger" />
            <span>{props.t("Logout")}</span>
          </Link>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  );
};

ProfileMenu.propTypes = {
  success: PropTypes.any,
  t: PropTypes.any,
};

const mapStatetoProps = (state) => {
  const { error, success } = state.Profile;
  return { error, success };
};

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(ProfileMenu))
);
