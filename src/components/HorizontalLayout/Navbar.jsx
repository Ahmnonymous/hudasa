import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { Collapse } from "reactstrap";
import { Link } from "react-router-dom";
import withRouter from "../Common/withRouter";
import classname from "classnames";

//i18n
import { withTranslation } from "react-i18next";

import { connect } from "react-redux";

// ✅ Import role-based access control helper
import { useRole } from "../../helpers/useRole";

const Navbar = (props) => {
  const [management, setManagement] = useState(false);
  const [reports, setReports] = useState(false);
  
  // ✅ Get user role information
  const { hasRole, isAppAdmin, isOrgExecutive } = useRole();

  useEffect(() => {
    var matchingMenuItem = null;
    var ul = document.getElementById("navigation");
    var items = ul.getElementsByTagName("a");
    removeActivation(items);
    for (var i = 0; i < items.length; ++i) {
      if (window.location.pathname === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  });

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;
      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        if (parent.classList.contains("active")) {
          parent.classList.remove("active");
        }
      }
    }
  };

  function activateParentDropdown(item) {
    item.classList.add("active");
    const parent = item.parentElement;
    if (parent) {
      parent.classList.add("active"); // li
      const parent2 = parent.parentElement;
      parent2.classList.add("active"); // li
      const parent3 = parent2.parentElement;
      if (parent3) {
        parent3.classList.add("active"); // li
        const parent4 = parent3.parentElement;
        if (parent4) {
          parent4.classList.add("active"); // li
          const parent5 = parent4.parentElement;
          if (parent5) {
            parent5.classList.add("active"); // li
            const parent6 = parent5.parentElement;
            if (parent6) {
              parent6.classList.add("active"); // li
            }
          }
        }
      }
    }
    return false;
  }

  return (
    <React.Fragment>
      <div className="topnav">
        <div className="container-fluid">
          <nav
            className="navbar navbar-light navbar-expand-lg topnav-menu"
            id="navigation"
          >
            <Collapse
              isOpen={props.leftMenu}
              className="navbar-collapse"
              id="topnav-menu-content"
            >
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link to="/dashboard" className="nav-link">
                    <i className="bx bx-bar-chart-alt-2 me-2"></i>
                    {props.t("Dashboard")}
                  </Link>
                </li>

                {/* ✅ Management - All except Caseworkers (roles 1,2,3,4) */}
                {hasRole([1, 2, 3, 4]) && (
                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        setManagement(!management);
                      }}
                    >
                      <i className="bx bx-buildings me-2"></i>
                      {props.t("Management")} <div className="arrow-down"></div>
                    </Link>
                    <div className={classname("dropdown-menu", { show: management })}>
                      {isAppAdmin && (
                        <Link to="/centers" className="dropdown-item">
                          <i className="bx bx-building me-2"></i>
                          {props.t("Center Management")}
                        </Link>
                      )}
                      {hasRole([2, 3]) && (
                        <Link to="/meetings" className="dropdown-item">
                          <i className="bx bx-calendar me-2"></i>
                          {props.t("Meetings Management")}
                        </Link>
                      )}
                      <Link to="/suppliers" className="dropdown-item">
                        <i className="bx bx-store me-2"></i>
                        {props.t("Supplier Management")}
                      </Link>
                      <Link to="/inventory" className="dropdown-item">
                        <i className="bx bx-box me-2"></i>
                        {props.t("Inventory Management")}
                      </Link>
                    </div>
                  </li>
                )}

                {/* ✅ Create Applicant - Only Caseworker (role 5) can create applicants */}
                {hasRole([5]) && (
                  <li className="nav-item">
                    <Link to="/applicants/create" className="nav-link">
                      <i className="bx bx-user-plus me-2"></i>
                      {props.t("Create Applicant")}
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <Link to="/applicants" className="nav-link">
                    <i className="bx bx-user-check me-2"></i>
                    {props.t("Applicant Details")}
                        </Link>
                </li>

                {/* ✅ Reports - App Admin, HQ, Org Admin (Org Executive and Caseworkers excluded) */}
                {hasRole([1, 2, 3]) && (
                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        setReports(!reports);
                      }}
                    >
                      <i className="bx bx-file-find me-2"></i>
                      {props.t("Reports")} <div className="arrow-down"></div>
                    </Link>
                    <div className={classname("dropdown-menu", { show: reports })}>
                      <Link to="/reports/applicant-details" className="dropdown-item">
                        {props.t("Applicant Details")}
                      </Link>
                      <Link to="/reports/total-financial-assistance" className="dropdown-item">
                        {props.t("Total Assistance")}
                      </Link>
                      <Link to="/reports/financial-assistance" className="dropdown-item">
                        {props.t("Financial Assistance")}
                      </Link>
                      <Link to="/reports/food-assistance" className="dropdown-item">
                        {props.t("Food Assistance")}
                      </Link>
                      <Link to="/reports/home-visits" className="dropdown-item">
                        {props.t("Home Visits")}
                      </Link>
                      <Link to="/reports/relationship-report" className="dropdown-item">
                        {props.t("Relationship Report")}
                      </Link>
                      <Link to="/reports/skills-matrix" className="dropdown-item">
                        {props.t("Applicant Skills")}
                      </Link>
                    </div>
                  </li>
                )}

                {/* ✅ Lookup Setup - App Admin, HQ, Org Admin (Org Executive and Caseworkers excluded) */}
                {hasRole([1, 2, 3]) && (
                  <li className="nav-item">
                    <Link to="/lookups" className="nav-link">
                      <i className="bx bx-list-ul me-2"></i>
                      {props.t("Lookup Setup")}
                    </Link>
                  </li>
                )}

                {!isOrgExecutive && (
                  <li className="nav-item">
                    <Link to="/FileManager" className="nav-link">
                      <i className="bx bx-folder me-2"></i>
                      {props.t("File Manager")}
                        </Link>
                  </li>
                )}

                {!isOrgExecutive && (
                  <li className="nav-item">
                    <Link to="/chat" className="nav-link">
                      <i className="bx bx-chat me-2"></i>
                      {props.t("Chat")}
                          </Link>
                  </li>
                )}
              </ul>
            </Collapse>
          </nav>
        </div>
      </div>
    </React.Fragment>
  );
};

Navbar.propTypes = {
  leftMenu: PropTypes.any,
  location: PropTypes.any,
  menuOpen: PropTypes.any,
  t: PropTypes.any,
};

const mapStatetoProps = (state) => {
  const { leftMenu } = state.Layout;
  return { leftMenu };
};

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(Navbar))
);
