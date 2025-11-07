import React, { useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import { useRole } from "../../../helpers/useRole";
import CommentsTab from "./tabs/CommentsTab";
// import TasksTab from "./tabs/TasksTab";
import RelationshipsTab from "./tabs/RelationshipsTab";
import HomeVisitsTab from "./tabs/HomeVisitsTab";
import FinancialAssistanceTab from "./tabs/FinancialAssistanceTab";
import FoodAssistanceTab from "./tabs/FoodAssistanceTab";
import AttachmentsTab from "./tabs/AttachmentsTab";
// import ProgramsTab from "./tabs/ProgramsTab";
import FinancialAssessmentTab from "./tabs/FinancialAssessmentTab";

const DetailTabs = ({
  applicantId,
  applicant,
  comments,
  tasks,
  relationships,
  homeVisits,
  financialAssistance,
  foodAssistance,
  attachments,
  programs,
  financialAssessment,
  lookupData,
  onUpdate,
  showAlert,
}) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [activeTab, setActiveTab] = useState("all");

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const currentId = Number(applicantId);
  const safeNum = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));

  const commentsForApplicant = (comments || []).filter((x) => safeNum(x.file_id) === currentId);
  // const tasksForApplicant = (tasks || []).filter((x) => safeNum(x.file_id) === currentId);
  const relationshipsForApplicant = (relationships || []).filter((x) => safeNum(x.file_id) === currentId);
  const homeVisitsForApplicant = (homeVisits || []).filter((x) => safeNum(x.file_id) === currentId);
  const financialAssistanceForApplicant = (financialAssistance || []).filter((x) => safeNum(x.file_id) === currentId);
  const foodAssistanceForApplicant = (foodAssistance || []).filter((x) => safeNum(x.file_id) === currentId);
  const attachmentsForApplicant = (attachments || []).filter((x) => safeNum(x.file_id) === currentId);
  const programsForApplicant = (programs || []).filter((x) => safeNum(x.person_trained_id) === currentId);
  const financialAssessmentForApplicant = Array.isArray(financialAssessment)
    ? (financialAssessment || []).find((x) => safeNum(x.file_id) === currentId) || null
    : financialAssessment || null;

  const tabs = [
    { id: "all", label: "Show All" },
    { id: "comments", label: "Comments" },
    // { id: "tasks", label: "Tasks" },
    { id: "relationships", label: "Relationships" },
    { id: "homeVisits", label: "Home Visits" },
    { id: "financialAid", label: "Financial Aid" },
    { id: "foodAid", label: "Food Aid" },
    { id: "files", label: "Files" },
    // { id: "programs", label: "Programs" },
    { id: "finance", label: "Finance" },
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
              <CommentsTab applicantId={applicantId} comments={commentsForApplicant} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            {/* <div className="border rounded p-3 mb-3">
              <TasksTab applicantId={applicantId} tasks={tasksForApplicant} onUpdate={onUpdate} showAlert={showAlert} />
            </div> */}
            
            <div className="border rounded p-3 mb-3">
              <RelationshipsTab applicantId={applicantId} relationships={relationshipsForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <HomeVisitsTab applicantId={applicantId} homeVisits={homeVisitsForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
          <FinancialAssistanceTab
            applicantId={applicantId}
            applicant={applicant}
            relationships={relationshipsForApplicant}
            financialAssistance={financialAssistanceForApplicant}
            lookupData={lookupData}
            onUpdate={onUpdate}
            showAlert={showAlert}
          />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <FoodAssistanceTab applicantId={applicantId} foodAssistance={foodAssistanceForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <AttachmentsTab applicantId={applicantId} attachments={attachmentsForApplicant} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <FinancialAssessmentTab applicantId={applicantId} financialAssessment={financialAssessmentForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
          </TabPane>
          <TabPane tabId="comments">
            <CommentsTab
              applicantId={applicantId}
              comments={commentsForApplicant}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          {/* <TabPane tabId="tasks">
            <TasksTab
              applicantId={applicantId}
              tasks={tasksForApplicant}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane> */}

          <TabPane tabId="relationships">
            <RelationshipsTab
              applicantId={applicantId}
              relationships={relationshipsForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="homeVisits">
            <HomeVisitsTab
              applicantId={applicantId}
              homeVisits={homeVisitsForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="financialAid">
            <FinancialAssistanceTab
              applicantId={applicantId}
              applicant={applicant}
              relationships={relationshipsForApplicant}
              financialAssistance={financialAssistanceForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="foodAid">
            <FoodAssistanceTab
              applicantId={applicantId}
              foodAssistance={foodAssistanceForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="files">
            <AttachmentsTab
              applicantId={applicantId}
              attachments={attachmentsForApplicant}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          {/* <TabPane tabId="programs">
            <ProgramsTab
              applicantId={applicantId}
              programs={programsForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane> */}

          <TabPane tabId="finance">
            <FinancialAssessmentTab
              applicantId={applicantId}
              financialAssessment={financialAssessmentForApplicant}
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

