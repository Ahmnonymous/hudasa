import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

// //Import Scrollbar
import SimpleBar from "simplebar-react";

// MetisMenu
import MetisMenu from "metismenujs";
import { Link, useLocation } from "react-router-dom";
import withRouter from "../Common/withRouter";

//i18n
import { withTranslation } from "react-i18next";
import { useCallback } from "react";

// ✅ Import role-based access control helper
import { useRole } from "../../helpers/useRole";

const SidebarContent = (props) => {
  const ref = useRef();
  const path = useLocation();
  
  // ✅ Get user role information
  const { isAppAdmin, isHQ, isOrgAdmin, isOrgExecutive, isCaseworker, hasRole } = useRole();

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];
    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show"); // ul tag

        const parent3 = parent2.parentElement; // li tag

        if (parent3) {
          parent3.classList.add("mm-active"); // li
          parent3.childNodes[0].classList.add("mm-active"); //a
          const parent4 = parent3.parentElement; // ul
          if (parent4) {
            parent4.classList.add("mm-show"); // ul
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show"); // li
              parent5.childNodes[0].classList.add("mm-active"); // a tag
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.lenght && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");

          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active"); // li
            parent3.childNodes[0].classList.remove("mm-active");

            const parent4 = parent3.parentElement; // ul
            if (parent4) {
              parent4.classList.remove("mm-show"); // ul
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show"); // li
                parent5.childNodes[0].classList.remove("mm-active"); // a tag
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = path.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [path.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  // useEffect(() => {
  //   new MetisMenu("#side-menu");
  //   activeMenu();
  // }, []);
  useEffect(() => {
    const metisMenu = new MetisMenu("#side-menu");
    activeMenu();

    // Cleanup on component unmount
    return () => {
      metisMenu.dispose();
    };
  }, []);

  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  return (
    <React.Fragment>
      <SimpleBar className="h-100" ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">Pages</li>
            
            {/* ✅ Dashboard - All roles */}
            <li>
              <Link to="/dashboard">
                <i className="bx bx-bar-chart-alt-2"></i>
                <span>{props.t("Dashboard")}</span>
              </Link>
            </li>

            {/* ✅ Centers - App Admin ONLY (role 1) */}
            {isAppAdmin && (
              <li>
                <Link to="/centers">
                  <i className="bx bx-building"></i>
                  <span>{props.t("Center Management")}</span>
                </Link>
              </li>
            )}

            {/* ✅ Meetings - HQ & Org Admins only (roles 2,3) */}
            {hasRole([2, 3]) && (
              <li>
                <Link to="/meetings">
                  <i className="bx bx-calendar"></i>
                  <span>{props.t("Meetings Management")}</span>
                </Link>
              </li>
            )}

            {/* ✅ Suppliers - All except Caseworkers (roles 1,2,3,4) */}
            {hasRole([1, 2, 3, 4]) && (
              <li>
                <Link to="/suppliers">
                  <i className="bx bx-store"></i>
                  <span>{props.t("Supplier Management")}</span>
                </Link>
              </li>
            )}

            {/* ✅ Inventory - All except Caseworkers (roles 1,2,3,4) */}
            {hasRole([1, 2, 3, 4]) && (
              <li>
                <Link to="/inventory">
                  <i className="bx bx-box"></i>
                  <span>{props.t("Inventory Management")}</span>
                </Link>
              </li>
            )}

            {/* ✅ Create Applicant - Only Caseworker (role 5) can create applicants */}
            {hasRole([5]) && (
              <li>
                <Link to="/applicants/create">
                  <i className="bx bx-user-plus"></i>
                  <span>{props.t("Create Applicant")}</span>
                </Link>
              </li>
            )}

            {/* ✅ Applicant Details - All roles (1,2,3,4,5) */}
            <li>
              <Link to="/applicants">
                <i className="bx bx-user-check"></i>
                <span>{props.t("Applicant Details")}</span>
              </Link>
            </li>

            {/* ✅ Reports - App Admin, HQ, Org Admin (Org Executive and Caseworkers excluded) */}
            {hasRole([1, 2, 3]) && (
              <li>
                <Link to="/#" className="has-arrow ">
                  <i className="bx bx-file-find"></i>
                  <span>{props.t("Reports")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="/reports/applicant-details">
                    <i className="bx bx-user-plus"></i>
                    {props.t("Applicant Details")}
                  </Link>
                </li>
                <li>
                  <Link to="/reports/total-financial-assistance">
                    <i className="bx bx-money"></i>
                    {props.t("Total Assistance")}
                  </Link>
                </li>
                <li>
                  <Link to="/reports/financial-assistance">
                    <i className="bx bx-credit-card"></i>
                    {props.t("Financial Assistance")}
                  </Link>
                </li>
                <li>
                  <Link to="/reports/food-assistance">
                    <i className="bx bx-home"></i>
                    {props.t("Food Assistance")}
                  </Link>
                </li>
                <li>
                  <Link to="/reports/home-visits">
                    <i className="bx bx-car"></i>
                    {props.t("Home Visits")}
                  </Link>
                </li>
                <li>
                  <Link to="/reports/applicant-programs">
                    <i className="bx bx-book-open"></i>
                    {props.t("Applicant Programs")}
                  </Link>
                </li>
                <li>
                  <Link to="/reports/relationship-report">
                    <i className="bx bx-group"></i>
                    {props.t("Relationship Report")}
                  </Link>
                </li>
                <li>
                  <Link to="/reports/skills-matrix">
                    <i className="bx bxs-graduation"></i>
                    {props.t("Applicant Skills")}
                  </Link>
                </li>
              </ul>
              </li>
            )}

            {/* ✅ Lookup Setup - App Admin, HQ, Org Admin (Org Executive and Caseworkers excluded) */}
            {hasRole([1, 2, 3]) && (
              <li>
                <Link to="/lookups">
                  <i className="bx bx-list-ul"></i>
                  <span>{props.t("Lookup Setup")}</span>
                </Link>
              </li>
            )}

            {!isOrgExecutive && (
              <li>
                <Link to="/FileManager">
                  <i className="bx bx-folder"></i>
                  <span>{props.t("File Manager")}</span>
                </Link>
              </li>
            )}

            {!isOrgExecutive && (
              <li>
                <Link to="/chat">
                  <i className="bx bx-chat"></i>
                  <span>{props.t("Chat")}</span>
                </Link>
              </li>
            )}

            <li>
              <Link to="/policy-library">
                <i className="bx bx-file-blank"></i>
                <span>{props.t("Policy & Procedure")}</span>
              </Link>
            </li>
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  );
};

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
};

export default withRouter(withTranslation()(SidebarContent));
