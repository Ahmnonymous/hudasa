import React, { useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import CensusTab from "./tabs/CensusTab";
import ConcernsTab from "./tabs/ConcernsTab";

const DetailTabs = ({ masjid, masjidId, census, concerns, onUpdate, showAlert, lookupData }) => {
  const [activeTab, setActiveTab] = useState("all");

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const tabs = [
    { id: "all", label: "Show All" },
    { id: "census", label: "Census" },
    { id: "concerns", label: "Concerns" },
  ];

  if (!masjid) return null;

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
              <CensusTab
                masjidId={masjidId}
                suburbId={masjid?.suburb_id}
                census={census}
                onUpdate={onUpdate}
                showAlert={showAlert}
              />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <ConcernsTab
                masjidId={masjidId}
                suburbId={masjid?.suburb_id}
                concerns={concerns}
                onUpdate={onUpdate}
                showAlert={showAlert}
              />
            </div>
          </TabPane>

          <TabPane tabId="census">
            <CensusTab
              masjidId={masjidId}
              suburbId={masjid?.suburb_id}
              census={census}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="concerns">
            <ConcernsTab
              masjidId={masjidId}
              suburbId={masjid?.suburb_id}
              concerns={concerns}
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

