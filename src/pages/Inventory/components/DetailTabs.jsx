import React, { useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import TransactionsTab from "./tabs/TransactionsTab";

const DetailTabs = ({
  itemId,
  transactions,
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

  const transactionsForItem = (transactions || []).filter((x) => x.item_id === itemId);

  const tabs = [
    { id: "all", label: "Show All" },
    { id: "transactions", label: "Transactions" },
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
              <TransactionsTab
                itemId={itemId}
                transactions={transactionsForItem}
                lookupData={lookupData}
                onUpdate={onUpdate}
                showAlert={showAlert}
              />
            </div>
          </TabPane>

          <TabPane tabId="transactions">
            <TransactionsTab
              itemId={itemId}
              transactions={transactionsForItem}
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

