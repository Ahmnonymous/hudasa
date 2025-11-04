const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ? Middlewares
app.use(cors());
app.use(express.json());

// ===========================
// ?? ROUTE IMPORTS
// ===========================

// ?? Auth & Lookup
const authRoutes = require("./routes/authRoutes");
const lookupRoutes = require("./routes/lookupRoutes");

// ?? Communication
const foldersRoutes = require("./routes/foldersRoutes");
const messagesRoutes = require("./routes/messagesRoutes");
const conversationParticipantsRoutes = require("./routes/conversationParticipantsRoutes");
const conversationsRoutes = require("./routes/conversationsRoutes");

// ?? Inventory
const inventoryTransactionsRoutes = require("./routes/inventoryTransactionsRoutes");
const inventoryItemsRoutes = require("./routes/inventoryItemsRoutes");

// ?? Supplier
const supplierDocumentRoutes = require("./routes/supplierDocumentRoutes");
const supplierEvaluationRoutes = require("./routes/supplierEvaluationRoutes");
const supplierProfileRoutes = require("./routes/supplierProfileRoutes");
const serviceRatingRoutes = require("./routes/serviceRatingRoutes");

// ?? Applicant / Beneficiary
const applicantExpenseRoutes = require("./routes/applicantExpenseRoutes");
const applicantIncomeRoutes = require("./routes/applicantIncomeRoutes");
const financialAssessmentRoutes = require("./routes/financialAssessmentRoutes");
const programsRoutes = require("./routes/programsRoutes");
const attachmentsRoutes = require("./routes/attachmentsRoutes");
const foodAssistanceRoutes = require("./routes/foodAssistanceRoutes");
const financialAssistanceRoutes = require("./routes/financialAssistanceRoutes");
const homeVisitRoutes = require("./routes/homeVisitRoutes");
const relationshipsRoutes = require("./routes/relationshipsRoutes");
const tasksRoutes = require("./routes/tasksRoutes");
const commentsRoutes = require("./routes/commentsRoutes");
const applicantDetailsRoutes = require("./routes/applicantDetailsRoutes");
const hseqToolboxMeetingTasksRoutes = require("./routes/hseqToolboxMeetingTasksRoutes");
const hseqToolboxMeetingRoutes = require("./routes/hseqToolboxMeetingRoutes");
const employeeSkillsRoutes = require("./routes/employeeSkillsRoutes");
const employeeInitiativeRoutes = require("./routes/employeeInitiativeRoutes");
const employeeAppraisalRoutes = require("./routes/employeeAppraisalRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const policyAndProcedureRoutes = require("./routes/policyAndProcedureRoutes");
const trainingCoursesRoutes = require("./routes/trainingCoursesRoutes");
const trainingInstitutionsRoutes = require("./routes/trainingInstitutionsRoutes");
const centerAuditsRoutes = require("./routes/centerAuditsRoutes");
const centerDetailRoutes = require("./routes/centerDetailRoutes");

// ?? Personal Files
const personalFilesRoutes = require("./routes/personalFilesRoutes");

// ?? Reports
const reportsRoutes = require("./routes/reportsRoutes");

// ?? Dashboard
const dashboardRoutes = require("./routes/dashboardRoutes");

// ===========================
// ?? ROUTE REGISTRATION
// ===========================

// ?? Auth & Lookup
app.use("/api/auth", authRoutes);
app.use("/api/lookup", lookupRoutes);

// ?? Communication
app.use("/api/folders", foldersRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/conversationParticipants", conversationParticipantsRoutes);
app.use("/api/conversations", conversationsRoutes);

// ?? Inventory
app.use("/api/inventoryItems", inventoryItemsRoutes);
app.use("/api/inventoryTransactions", inventoryTransactionsRoutes);

// ?? Supplier
app.use("/api/supplierDocument", supplierDocumentRoutes);
app.use("/api/supplierEvaluation", supplierEvaluationRoutes);
app.use("/api/supplierProfile", supplierProfileRoutes);
app.use("/api/serviceRating", serviceRatingRoutes);

// ?? Applicant / Beneficiary
app.use("/api/applicantExpense", applicantExpenseRoutes);
app.use("/api/applicantIncome", applicantIncomeRoutes);
app.use("/api/financialAssessment", financialAssessmentRoutes);
app.use("/api/programs", programsRoutes);
app.use("/api/attachments", attachmentsRoutes);
app.use("/api/foodAssistance", foodAssistanceRoutes);
app.use("/api/financialAssistance", financialAssistanceRoutes);
app.use("/api/homeVisit", homeVisitRoutes);
app.use("/api/relationships", relationshipsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/applicantDetails", applicantDetailsRoutes);

// ?? Employee / HSEQ
app.use("/api/employee", employeeRoutes);
app.use("/api/employeeAppraisal", employeeAppraisalRoutes);
app.use("/api/employeeInitiative", employeeInitiativeRoutes);
app.use("/api/employeeSkills", employeeSkillsRoutes);
app.use("/api/hseqToolboxMeeting", hseqToolboxMeetingRoutes);
app.use("/api/hseqToolboxMeetingTasks", hseqToolboxMeetingTasksRoutes);

// ?? Training & Centers
app.use("/api/trainingInstitutions", trainingInstitutionsRoutes);
app.use("/api/trainingCourses", trainingCoursesRoutes);
app.use("/api/centerDetail", centerDetailRoutes);
app.use("/api/centerAudits", centerAuditsRoutes);
app.use("/api/policyAndProcedure", policyAndProcedureRoutes);

// ?? Personal Files
app.use("/api/personalFiles", personalFilesRoutes);

// ?? Reports
app.use("/api/reports", reportsRoutes);

// ?? Dashboard
app.use("/api/dashboard", dashboardRoutes);

// ? Export app for testing
module.exports = app;

// ? Server Start (only if not in test environment)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`?? Server running on port ${PORT}`));
}