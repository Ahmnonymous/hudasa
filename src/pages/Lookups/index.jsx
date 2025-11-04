import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const Lookups = () => {
  // Grouped lookup categories
  const lookupGroups = [
    {
      title: "Applicant Details",
      color: "primary",
      icon: "bxs-user-circle",
      categories: [
        { name: "Nationality", table: "Nationality", icon: "bxs-flag-alt" },
        { name: "Gender", table: "Gender", icon: "bxs-user" },
        { name: "Race", table: "Race", icon: "bxs-group" },
        { name: "Employment Status", table: "Employment_Status", icon: "bxs-briefcase" },
        { name: "Skills", table: "Skills", icon: "bxs-wrench" },
        { name: "Education Level", table: "Education_Level", icon: "bxs-book" },
        { name: "Suburb", table: "Suburb", icon: "bxs-map" },
        { name: "Dwelling Type", table: "Dwelling_Type", icon: "bxs-building-house" },
        { name: "Dwelling Status", table: "Dwelling_Status", icon: "bxs-home" },
        { name: "Health Conditions", table: "Health_Conditions", icon: "bxs-first-aid" },
        { name: "Marital Status", table: "Marital_Status", icon: "bxs-heart" },
        { name: "Born Religion", table: "Born_Religion", icon: "bxs-card" },
        { name: "Period As Muslim", table: "Period_As_Muslim", icon: "bxs-calendar" },
        { name: "File Condition", table: "File_Condition", icon: "bxs-detail" },
        { name: "File Status", table: "File_Status", icon: "bxs-file" },
      ],
    },
    {
      title: "Employee Set Up",
      color: "success",
      icon: "bxs-briefcase-alt",
      categories: [
        { name: "Employee Details", table: "Employees", icon: "bxs-user-pin" },
        { name: "Departments", table: "Departments", icon: "bxs-building" },
        { name: "Training Courses", table: "Training_Courses", icon: "bxs-book-open" },
        { name: "Training Institutions", table: "Training_Institutions", icon: "bxs-school" },
      ],
    },
    {
      title: "Applicant Sub Details",
      color: "info",
      icon: "bxs-detail",
      categories: [
        { name: "Tasks Status", table: "Tasks_Status", icon: "bxs-checkbox-checked" },
        { name: "Assistance Types", table: "Assistance_Types", icon: "bxs-heart" },
        { name: "Relationship Types", table: "Relationship_Types", icon: "bxs-group" },
        { name: "Programs", table: "Programs", icon: "bxs-folder-open" },
        { name: "Hampers", table: "Hampers", icon: "bxs-basket" },
        { name: "Means of Communication", table: "Means_of_communication", icon: "bxs-conversation" },
      ],
    },
    {
      title: "Employee Training",
      color: "secondary",
      icon: "bxs-graduation",
      categories: [
        { name: "Training Outcomes", table: "Training_Outcome", icon: "bxs-award" },
        { name: "Training Levels", table: "Training_Level", icon: "bxs-layer" },
        { name: "Blood Types", table: "Blood_Type", icon: "bxs-droplet" },
        { name: "User Types", table: "User_Types", icon: "bxs-user-x" },
      ],
    },
    {
      title: "Financial Setup",
      color: "warning",
      icon: "bxs-dollar-circle",
      categories: [
        { name: "Income Types", table: "Income_Type", icon: "bxs-wallet" },
        { name: "Expense Types", table: "Expense_Type", icon: "bxs-credit-card" },
      ],
    },
    {
      title: "Policy Setup",
      color: "danger",
      icon: "bxs-file-blank",
      categories: [
        { name: "Policy Procedure Types", table: "Policy_Procedure_Type", icon: "bxs-file-find" },
        { name: "Policy Procedure Fields", table: "Policy_Procedure_Field", icon: "bxs-grid-alt" },
        { name: "Policy and Procedure", table: "Policy_And_Procedure", icon: "bxs-file-doc", customRoute: "/lookups/policy-and-procedure" },
      ],
    },
    {
      title: "Supplier Setup",
      color: "dark",
      icon: "bxs-store-alt",
      categories: [
        { name: "Supplier Categories", table: "Supplier_Category", icon: "bxs-truck" },
      ],
    },
  ];

  // Meta title
  document.title = "Lookup Setup | Welfare App";

   // Render a group as a card (with optional two-column layout)
   const renderGroupCard = (group, groupIndex, twoColumns = false) => (
     <Card key={groupIndex} className="mb-3 flex-grow-1">
       <CardBody className="p-0">
         {/* Section Header */}
         <div className="section-header d-flex align-items-center px-3 py-2 border-bottom">
           <div className="me-2">
             <i className={`bx ${group.icon} text-${group.color}`} style={{ fontSize: "1.5rem" }}></i>
           </div>
           <div>
             <h6 className="mb-0">{group.title}</h6>
           </div>
         </div>
 
         {/* Lookup List */}
         <div className="lookup-list">
           {twoColumns ? (
             <div className="grid-container">
               {group.categories.map((category, index) => {
                 const isLeftColumn = index % 2 === 0;
                 const isLastItem = index === group.categories.length - 1;
                 return (
                   <div key={index} className={`grid-item ${isLeftColumn ? 'left-col' : 'right-col'}`}>
                     <Link
                       to={category.customRoute || `/lookups/${category.table}`}
                       className={`lookup-item d-flex align-items-center px-3 py-2 text-body ${isLastItem ? 'last-item' : ''}`}
                       style={{ textDecoration: "none", fontSize: "0.875rem" }}
                     >
                       <div className="lookup-icon me-2">
                         <i className={`bx ${category.icon} text-${group.color}`}></i>
                       </div>
                       <div className="flex-grow-1">
                         <span>{category.name}</span>
                       </div>
                       <div className="lookup-arrow">
                         <i className="bx bx-chevron-right text-muted"></i>
                       </div>
                     </Link>
                   </div>
                 );
               })}
             </div>
           ) : (
             group.categories.map((category, index) => (
               <Link
                 key={index}
                 to={category.customRoute || `/lookups/${category.table}`}
                 className="lookup-item d-flex align-items-center px-3 py-2 text-body"
                 style={{ textDecoration: "none", fontSize: "0.875rem" }}
               >
                 <div className="lookup-icon me-2">
                   <i className={`bx ${category.icon} text-${group.color}`}></i>
                 </div>
                 <div className="flex-grow-1">
                   <span>{category.name}</span>
                 </div>
                 <div className="lookup-arrow">
                   <i className="bx bx-chevron-right text-muted"></i>
                 </div>
               </Link>
             ))
           )}
         </div>
       </CardBody>
     </Card>
   );

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="Administration" breadcrumbItem="Lookup Setup" />

         {/* Full-width Row for the largest group: Applicant Details (2 columns) */}
         <Row className="mb-3">
           <Col lg={12}>
             {renderGroupCard(lookupGroups[0], 0, true)}
           </Col>
         </Row>

        {/* Balanced Row for remaining groups: Split into two columns with similar total items */}
        <Row className="g-3 h-100">
          {/* Left Column: Employee Set Up (4 items) + Applicant Sub Details (6 items) = 10 items */}
          <Col lg={6} className="d-flex flex-column">
            {renderGroupCard(lookupGroups[1], 1)} {/* Employee Set Up */}
            {renderGroupCard(lookupGroups[2], 2)} {/* Applicant Sub Details */}
            <div className="flex-grow-1"></div> {/* Spacer to fill remaining space */}
          </Col>

          {/* Right Column: Employee Training (4) + Financial (2) + Policy (2) + Supplier (1) = 9 items */}
          <Col lg={6} className="d-flex flex-column">
            {renderGroupCard(lookupGroups[3], 3)} {/* Employee Training */}
            {renderGroupCard(lookupGroups[4], 4)} {/* Financial Setup */}
            {renderGroupCard(lookupGroups[5], 5)} {/* Policy Setup */}
            {renderGroupCard(lookupGroups[6], 6)} {/* Supplier Setup */}
            <div className="flex-grow-1"></div> {/* Spacer to fill remaining space */}
          </Col>
        </Row>
      </Container>

      <style jsx="true">{`
        .lookup-item {
          border-bottom: 1px solid #f0f0f0;
          transition: all 0.2s ease;
        }
        .lookup-item.last-item {
          border-bottom: none;
        }
        .lookup-item:hover {
          background-color: rgba(0, 0, 0, 0.03);
        }
        .lookup-item:hover .lookup-arrow i {
          transform: translateX(3px);
          color: #556ee6;
        }
        .lookup-arrow i {
          transition: all 0.2s ease;
          font-size: 1rem;
        }
        .lookup-icon i {
          font-size: 1.1rem;
        }
        .flex-grow-1 {
          flex-grow: 1;
        }
        /* Grid-specific styles for two-column layout */
        .grid-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .grid-item.left-col {
          border-right: 1px solid #f0f0f0;
        }
        .grid-item.right-col {
          border-right: none;
        }
        .grid-item .lookup-item {
          border-right: none; /* Override for left-col items */
        }
        .grid-item.left-col .lookup-item {
          border-left: none;
        }
        /* For the last row (odd number of items), ensure no extra borders */
        .grid-item:last-child .lookup-item {
          border-bottom: none;
        }
        .grid-item:nth-last-child(1).left-col {
          border-right: none;
        }
      `}</style>
    </div>
  );
};

export default Lookups;