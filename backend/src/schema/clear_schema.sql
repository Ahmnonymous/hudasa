BEGIN;

-- ===============================================================
-- 1) Madressah applicants (cascades into Conduct/Survey/etc.)
-- ===============================================================
DELETE FROM parent_questionnaire;
DELETE FROM Survey;
DELETE FROM Conduct_Assessment;
DELETE FROM Academic_Results;
DELETE FROM Islamic_Results;
DELETE FROM Madressah_Application;

-- ===============================================================
-- 2) Applicant module
--    (remove dependents first, then the applicant records)
-- ===============================================================
DELETE FROM Programs
WHERE Person_Trained_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Attachments
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Food_Assistance
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Financial_Assistance
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Home_Visit
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Tasks
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Comments
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Relationships
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Applicant_Income
WHERE Financial_Assessment_ID IN (
    SELECT ID FROM Financial_Assessment
    WHERE File_ID IN (SELECT ID FROM Applicant_Details)
);

DELETE FROM Applicant_Expense
WHERE Financial_Assessment_ID IN (
    SELECT ID FROM Financial_Assessment
    WHERE File_ID IN (SELECT ID FROM Applicant_Details)
);

DELETE FROM Financial_Assessment
WHERE File_ID IN (SELECT ID FROM Applicant_Details);

DELETE FROM Applicant_Details;

-- ===============================================================
-- 3) Employee module (preserve App Admin)
-- ===============================================================
WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Inventory_Transactions
WHERE Employee_ID IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Programs
WHERE Communicated_by IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Messages
WHERE Sender_ID IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Conversation_Participants
WHERE Employee_ID IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Personal_Files
WHERE Employee_ID IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Folders
WHERE Employee_ID IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Employee_Skills
WHERE Employee_ID IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Employee_Initiative
WHERE Employee_ID IN (SELECT ID FROM removable_employees);

WITH removable_employees AS (
    SELECT ID FROM Employee WHERE User_Type <> 1
)
DELETE FROM Employee_Appraisal
WHERE Employee_ID IN (SELECT ID FROM removable_employees);

DELETE FROM Employee
WHERE User_Type <> 1;

-- ===============================================================
-- 4) Center dependents, then centers (finalized order)
-- ===============================================================
DELETE FROM Inventory_Transactions;
DELETE FROM Inventory_Items;

DELETE FROM Supplier_Document;
DELETE FROM Supplier_Evaluation;
DELETE FROM Supplier_Profile;

DELETE FROM Service_Rating;

DELETE FROM HSEQ_Toolbox_Meeting_Tasks;
DELETE FROM HSEQ_Toolbox_Meeting;

DELETE FROM Maintenance;

DELETE FROM Messages;
DELETE FROM Conversation_Participants;
DELETE FROM Conversations;

DELETE FROM Personal_Files;
DELETE FROM Folders;

DELETE FROM Center_Audits;

DELETE FROM Policy_and_Procedure;

DELETE FROM Suburb_Masjids;
DELETE FROM Suburb_Concerns;
DELETE FROM Suburb_Census;

DELETE FROM Center_Detail;

-- ===============================================================
-- 5) Masjids (already handled above via Suburb_Masjids delete)
-- ===============================================================

COMMIT;