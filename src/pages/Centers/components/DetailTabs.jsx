import React, { useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import AuditsTab from "./tabs/AuditsTab";
import MaintenanceTab from "./tabs/MaintenanceTab";

const DetailTabs = ({
  centerId,
  audits,
  maintenance,
  lookupData,
  onUpdate,
  showAlert,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const auditsForCenter = (audits || []).filter((x) => String(x.center_id) === String(centerId));
  const maintenanceForCenter = (maintenance || []).filter((x) => String(x.center_detail_id) === String(centerId));

  const tabs = [
    { id: "all", label: "Show All" },
    { id: "audits", label: "Audits" },
    { id: "maintenance", label: "Maintenance" },
  ];

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
              <AuditsTab
                centerId={centerId}
                audits={auditsForCenter}
                lookupData={lookupData}
                onUpdate={onUpdate}
                showAlert={showAlert}
              />
            </div>
            <div className="border rounded p-3 mb-3">
              <MaintenanceTab
                centerId={centerId}
                maintenance={maintenanceForCenter}
                lookupData={lookupData}
                onUpdate={onUpdate}
                showAlert={showAlert}
              />
            </div>
          </TabPane>

          <TabPane tabId="audits">
            <AuditsTab
              centerId={centerId}
              audits={auditsForCenter}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="maintenance">
            <MaintenanceTab
              centerId={centerId}
              maintenance={maintenanceForCenter}
              lookupData={lookupData}
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

