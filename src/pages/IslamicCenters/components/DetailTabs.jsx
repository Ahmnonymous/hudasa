import React, { useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import MaintenanceTab from "./tabs/MaintenanceTab";
import SiteVisitsTab from "./tabs/SiteVisitsTab";

const DetailTabs = ({ center, centerId, maintenance, siteVisits, onUpdate, showAlert, lookupData = {} }) => {
  const [activeTab, setActiveTab] = useState("all");

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const tabs = [
    { id: "all", label: "Show All" },
    { id: "maintenance", label: "Maintenance" },
    { id: "siteVisits", label: "Site Visits" },
  ];

  if (!center) return null;

  return (
    <Card>
      <CardBody className="py-4">
        <Nav pills className="nav-pills-custom mb-1 d-flex flex-wrap border-bottom">
          {tabs.map((tab) => (
            <NavItem key={tab.id} className="me-2 mb-3">
              <NavLink
                className={classnames({ active: activeTab === tab.id })}
                onClick={() => toggleTab(tab.id)}
                style={{ cursor: "pointer", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              >
                <span>{tab.label}</span>
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        <TabContent activeTab={activeTab} className="mt-3">
          <TabPane tabId="all">
            <div className="border rounded p-3 mb-3">
              <MaintenanceTab
                centerId={centerId}
                maintenance={maintenance}
                onUpdate={onUpdate}
                showAlert={showAlert}
                lookupData={lookupData}
              />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <SiteVisitsTab
                centerId={centerId}
                siteVisits={siteVisits}
                onUpdate={onUpdate}
                showAlert={showAlert}
                lookupData={lookupData}
              />
            </div>
          </TabPane>

          <TabPane tabId="maintenance">
            <MaintenanceTab
              centerId={centerId}
              maintenance={maintenance}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="siteVisits">
            <SiteVisitsTab
              centerId={centerId}
              siteVisits={siteVisits}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>
        </TabContent>
      </CardBody>
    </Card>
  );
};

export default DetailTabs;

