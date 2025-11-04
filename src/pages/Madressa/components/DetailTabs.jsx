import React, { useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import { useRole } from "../../../helpers/useRole";
import ConductAssessmentTab from "./tabs/ConductAssessmentTab";
import AcademicResultsTab from "./tabs/AcademicResultsTab";
import IslamicResultsTab from "./tabs/IslamicResultsTab";
import SurveyTab from "./tabs/SurveyTab";

const DetailTabs = ({
  application,
  conductAssessments,
  academicResults,
  islamicResults,
  surveys,
  onUpdate,
  showAlert,
  lookupData,
}) => {
  const { isOrgExecutive } = useRole();
  const [activeTab, setActiveTab] = useState("all");

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const tabs = [
    { id: "all", label: "Show All" },
    { id: "conduct", label: "Conduct Assessment" },
    { id: "academic", label: "Academic Results" },
    { id: "islamic", label: "Islamic Results" },
    { id: "survey", label: "Survey" },
  ];

  if (!application) {
    return null;
  }

  return (
    <Card className="border shadow-sm">
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
              <ConductAssessmentTab
                application={application}
                conductAssessments={conductAssessments}
                onUpdate={onUpdate}
                showAlert={showAlert}
                lookupData={lookupData}
              />
            </div>

            <div className="border rounded p-3 mb-3">
              <AcademicResultsTab
                application={application}
                academicResults={academicResults}
                onUpdate={onUpdate}
                showAlert={showAlert}
                lookupData={lookupData}
              />
            </div>

            <div className="border rounded p-3 mb-3">
              <IslamicResultsTab
                application={application}
                islamicResults={islamicResults}
                onUpdate={onUpdate}
                showAlert={showAlert}
                lookupData={lookupData}
              />
            </div>

            <div className="border rounded p-3 mb-3">
              <SurveyTab
                application={application}
                surveys={surveys}
                onUpdate={onUpdate}
                showAlert={showAlert}
                lookupData={lookupData}
              />
            </div>
          </TabPane>

          <TabPane tabId="conduct">
            <ConductAssessmentTab
              application={application}
              conductAssessments={conductAssessments}
              onUpdate={onUpdate}
              showAlert={showAlert}
              lookupData={lookupData}
            />
          </TabPane>

          <TabPane tabId="academic">
            <AcademicResultsTab
              application={application}
              academicResults={academicResults}
              onUpdate={onUpdate}
              showAlert={showAlert}
              lookupData={lookupData}
            />
          </TabPane>

          <TabPane tabId="islamic">
            <IslamicResultsTab
              application={application}
              islamicResults={islamicResults}
              onUpdate={onUpdate}
              showAlert={showAlert}
              lookupData={lookupData}
            />
          </TabPane>

          <TabPane tabId="survey">
            <SurveyTab
              application={application}
              surveys={surveys}
              onUpdate={onUpdate}
              showAlert={showAlert}
              lookupData={lookupData}
            />
          </TabPane>
        </TabContent>
      </CardBody>
    </Card>
  );
};

export default DetailTabs;

