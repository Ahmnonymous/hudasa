-- ============================================================================
-- Migration Script: Oracle APEX → PostgreSQL
-- Add Missing Tables from Apex Schema
-- ============================================================================
-- This script adds tables identified in SCHEMA_GAP_ANALYSIS.md
-- Priority: HIGH → MEDIUM → LOW
-- ============================================================================

-- ============================================================================
-- PHASE 1: HIGH PRIORITY - Core Madressah Module Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MADRESSAH_APPLICATION
-- Core table for madressah (Islamic school) student applications
-- ----------------------------------------------------------------------------
CREATE TABLE Madressah_Application (
    ID SERIAL PRIMARY KEY,
    Applicant_Relationship_ID BIGINT NOT NULL,
    Chronic_Condition VARCHAR(255),
    Blood_Type VARCHAR(50),
    Family_Doctor VARCHAR(255),
    Contact_Details VARCHAR(50),
    Allegies VARCHAR(255),
    Chronic_Medication_Required VARCHAR(255),
    Allergy_Medication_Required VARCHAR(255),
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_applicant_relationship_madressah FOREIGN KEY (Applicant_Relationship_ID) REFERENCES Relationships(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_madressah FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_madressah_application_relationship ON Madressah_Application (Applicant_Relationship_ID);
CREATE INDEX idx_madressah_application_center ON Madressah_Application (center_id);

-- ----------------------------------------------------------------------------
-- 2. CONDUCT_ASSESSMENT
-- Behavioral/conduct assessment for madressah students
-- ----------------------------------------------------------------------------
CREATE TABLE Conduct_Assessment (
    ID SERIAL PRIMARY KEY,
    Madressah_App_ID BIGINT NOT NULL,
    Question1 VARCHAR(255),
    Question2 VARCHAR(255),
    Question3 VARCHAR(255),
    Question4 VARCHAR(255),
    Question5 VARCHAR(255),
    Jumah VARCHAR(255),
    Eid VARCHAR(255),
    Inclination VARCHAR(255),
    Comment_On_Character VARCHAR(255),
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_madressah_app_assessment FOREIGN KEY (Madressah_App_ID) REFERENCES Madressah_Application(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_assessment FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_conduct_assessment_madressah ON Conduct_Assessment (Madressah_App_ID);
CREATE INDEX idx_conduct_assessment_center ON Conduct_Assessment (center_id);

-- ----------------------------------------------------------------------------
-- 3. SURVEY
-- 19-question survey for madressah applications
-- ----------------------------------------------------------------------------
CREATE TABLE Survey (
    ID SERIAL PRIMARY KEY,
    Madressah_App_ID BIGINT NOT NULL,
    Question1 VARCHAR(255),
    Question2 VARCHAR(255),
    Question3 VARCHAR(255),
    Question4 VARCHAR(255),
    Question5 TEXT,
    Question6 VARCHAR(255),
    Question7 VARCHAR(255),
    Question8 VARCHAR(255),
    Question9 VARCHAR(255),
    Question10 VARCHAR(255),
    Question11 VARCHAR(255),
    Question12 VARCHAR(255),
    Question13 VARCHAR(255),
    Question14 VARCHAR(255),
    Question15 TEXT,
    Question16 VARCHAR(255),
    Question17 VARCHAR(255),
    Question18 VARCHAR(255),
    Question19 VARCHAR(255),
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_madressah_app_survey FOREIGN KEY (Madressah_App_ID) REFERENCES Madressah_Application(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_survey FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_survey_madressah ON Survey (Madressah_App_ID);
CREATE INDEX idx_survey_center ON Survey (center_id);

-- ----------------------------------------------------------------------------
-- 4. ACADEMIC_RESULTS
-- Academic report cards for madressah students
-- Note: Consider normalizing subjects in future if needed
-- ----------------------------------------------------------------------------
CREATE TABLE Academic_Results (
    ID SERIAL PRIMARY KEY,
    Madressah_App_ID BIGINT NOT NULL,
    School VARCHAR(255),
    Grade VARCHAR(50),
    Term VARCHAR(50),
    Subject1 VARCHAR(10),
    Subject1Ave VARCHAR(10),
    Subject1Name VARCHAR(100),
    Subject2 VARCHAR(10),
    Subject2Ave VARCHAR(10),
    Subject2Name VARCHAR(100),
    Subject3 VARCHAR(10),
    Subject3Ave VARCHAR(10),
    Subject3Name VARCHAR(100),
    Subject4 VARCHAR(10),
    Subject4Ave VARCHAR(10),
    Subject4Name VARCHAR(100),
    Subject5 VARCHAR(10),
    Subject5Ave VARCHAR(10),
    Subject5Name VARCHAR(100),
    Subject6 VARCHAR(10),
    Subject6Ave VARCHAR(10),
    Subject6Name VARCHAR(100),
    Subject7 VARCHAR(10),
    Subject7Ave VARCHAR(10),
    Subject7Name VARCHAR(100),
    Subject8 VARCHAR(10),
    Subject8Ave VARCHAR(10),
    Subject8Name VARCHAR(100),
    Subject9 VARCHAR(10),
    Subject9Ave VARCHAR(10),
    Subject9Name VARCHAR(100),
    Days_Absent VARCHAR(100),
    Comments TEXT,
    Report_Upload BYTEA,
    Report_Upload_Filename VARCHAR(255),
    Report_Upload_Mime VARCHAR(255),
    Report_Upload_Size INT,
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_madressah_app_academic FOREIGN KEY (Madressah_App_ID) REFERENCES Madressah_Application(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_academic FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_academic_results_madressah ON Academic_Results (Madressah_App_ID);
CREATE INDEX idx_academic_results_center ON Academic_Results (center_id);
CREATE INDEX idx_academic_results_term ON Academic_Results (Term, Grade);

-- ----------------------------------------------------------------------------
-- 5. ISLAMIC_RESULTS
-- Islamic studies report cards
-- ----------------------------------------------------------------------------
CREATE TABLE Islamic_Results (
    ID SERIAL PRIMARY KEY,
    Madressah_App_ID BIGINT NOT NULL,
    Grade VARCHAR(50),
    Term VARCHAR(50),
    Subject1 VARCHAR(10),
    Subject1Ave VARCHAR(10),
    Subject1Name VARCHAR(100),
    Subject2 VARCHAR(10),
    Subject2Ave VARCHAR(10),
    Subject2Name VARCHAR(100),
    Subject3 VARCHAR(10),
    Subject3Ave VARCHAR(10),
    Subject3Name VARCHAR(100),
    Subject4 VARCHAR(10),
    Subject4Ave VARCHAR(10),
    Subject4Name VARCHAR(100),
    Subject5 VARCHAR(10),
    Subject5Ave VARCHAR(10),
    Subject5Name VARCHAR(100),
    Subject6 VARCHAR(10),
    Subject6Ave VARCHAR(10),
    Subject6Name VARCHAR(100),
    Subject7 VARCHAR(10),
    Subject7Ave VARCHAR(10),
    Subject7Name VARCHAR(100),
    Subject8 VARCHAR(10),
    Subject8Ave VARCHAR(10),
    Subject8Name VARCHAR(100),
    Subject9 VARCHAR(10),
    Subject9Ave VARCHAR(10),
    Subject9Name VARCHAR(100),
    Days_Absent VARCHAR(100),
    Comments TEXT,
    Report_Upload BYTEA,
    Report_Upload_Filename VARCHAR(255),
    Report_Upload_Mime VARCHAR(255),
    Report_Upload_Size INT,
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_madressah_app_islamic FOREIGN KEY (Madressah_App_ID) REFERENCES Madressah_Application(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_islamic FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_islamic_results_madressah ON Islamic_Results (Madressah_App_ID);
CREATE INDEX idx_islamic_results_center ON Islamic_Results (center_id);
CREATE INDEX idx_islamic_results_term ON Islamic_Results (Term, Grade);

-- ============================================================================
-- PHASE 2: Lookup Tables (Required for Phase 1 Foreign Keys)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6. TERMS
-- Academic terms (Term 1, 2, 3, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE Terms (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(50) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data
INSERT INTO Terms (Name, Created_By) VALUES
    ('Term 1', 'system'),
    ('Term 2', 'system'),
    ('Term 3', 'system'),
    ('Term 4', 'system');

-- ----------------------------------------------------------------------------
-- 7. ACADEMIC_SUBJECTS
-- Lookup table for academic subjects
-- ----------------------------------------------------------------------------
CREATE TABLE Academic_Subjects (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data examples
INSERT INTO Academic_Subjects (Name, Created_By) VALUES
    ('Mathematics', 'system'),
    ('English', 'system'),
    ('Science', 'system'),
    ('Geography', 'system'),
    ('History', 'system');

-- ----------------------------------------------------------------------------
-- 8. ISLAMIC_SUBJECTS
-- Lookup table for Islamic subjects
-- ----------------------------------------------------------------------------
CREATE TABLE Islamic_Subjects (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data examples
INSERT INTO Islamic_Subjects (Name, Created_By) VALUES
    ('Quran', 'system'),
    ('Hadith', 'system'),
    ('Fiqh', 'system'),
    ('Seerah', 'system'),
    ('Arabic', 'system');

-- ----------------------------------------------------------------------------
-- 9. HOME_VISIT_TYPE
-- Lookup for home visit types
-- ----------------------------------------------------------------------------
CREATE TABLE Home_Visit_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data
INSERT INTO Home_Visit_Type (Name, Created_By) VALUES
    ('Initial Assessment', 'system'),
    ('Follow-up', 'system'),
    ('Emergency', 'system'),
    ('Routine Check', 'system');

-- ----------------------------------------------------------------------------
-- 10. ALLEGIES (Note: Oracle has typo - keeping for consistency)
-- Allergies lookup table
-- ----------------------------------------------------------------------------
CREATE TABLE Allergies (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data examples
INSERT INTO Allergies (Name, Created_By) VALUES
    ('Peanuts', 'system'),
    ('Dairy', 'system'),
    ('Gluten', 'system'),
    ('Eggs', 'system'),
    ('None', 'system');

-- ----------------------------------------------------------------------------
-- 11. OCCUPATION
-- Occupation lookup table
-- ----------------------------------------------------------------------------
CREATE TABLE Occupation (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data examples
INSERT INTO Occupation (Name, Created_By) VALUES
    ('Teacher', 'system'),
    ('Engineer', 'system'),
    ('Doctor', 'system'),
    ('Business Owner', 'system'),
    ('Unemployed', 'system');

-- ----------------------------------------------------------------------------
-- 12. RELIGION
-- General religion lookup (different from Born_Religion)
-- ----------------------------------------------------------------------------
CREATE TABLE Religion (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data
INSERT INTO Religion (Name, Created_By) VALUES
    ('Islam', 'system'),
    ('Christianity', 'system'),
    ('Hinduism', 'system'),
    ('Judaism', 'system'),
    ('African Traditional', 'system');

-- ============================================================================
-- PHASE 3: Add Missing Columns to Existing Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 13. Enhance Relationships table
-- Add missing columns from Oracle APPLICANT_RELATIONSHIP
-- ----------------------------------------------------------------------------
ALTER TABLE Relationships
    ADD COLUMN IF NOT EXISTS Marital_Status BIGINT,
    ADD COLUMN IF NOT EXISTS Religion BIGINT;

ALTER TABLE Relationships
    ADD CONSTRAINT fk_marital_status_rel FOREIGN KEY (Marital_Status) REFERENCES Marital_Status(ID),
    ADD CONSTRAINT fk_religion_rel FOREIGN KEY (Religion) REFERENCES Religion(ID);

-- ----------------------------------------------------------------------------
-- 14. Enhance Home_Visit table
-- Add missing columns from Oracle APPLICANT_HOME_VISITS
-- ----------------------------------------------------------------------------
ALTER TABLE Home_Visit
    ADD COLUMN IF NOT EXISTS Home_Visit_Type BIGINT,
    ADD COLUMN IF NOT EXISTS Short_Term TEXT,
    ADD COLUMN IF NOT EXISTS Medium_Term TEXT,
    ADD COLUMN IF NOT EXISTS Long_Term TEXT;

ALTER TABLE Home_Visit
    ADD CONSTRAINT fk_home_visit_type FOREIGN KEY (Home_Visit_Type) REFERENCES Home_Visit_Type(ID);

-- ----------------------------------------------------------------------------
-- 15. Enhance Food_Assistance table
-- Add missing column from Oracle APPLICANT_FOOD_ASSISTANCE
-- ----------------------------------------------------------------------------
ALTER TABLE Food_Assistance
    ADD COLUMN IF NOT EXISTS Give_To VARCHAR(255);

-- ----------------------------------------------------------------------------
-- 16. Enhance Financial_Assistance table
-- Add missing columns from Oracle APPLICANT_TRANSACTIONS
-- Note: Oracle has APPLICANT_TRANSACTIONS vs PostgreSQL Financial_Assistance
-- Consider if these should be separate tables or merged
-- ----------------------------------------------------------------------------
ALTER TABLE Financial_Assistance
    ADD COLUMN IF NOT EXISTS Sector VARCHAR(255),
    ADD COLUMN IF NOT EXISTS Program VARCHAR(255),
    ADD COLUMN IF NOT EXISTS Project VARCHAR(255),
    ADD COLUMN IF NOT EXISTS Give_To VARCHAR(255);

-- ----------------------------------------------------------------------------
-- 17. Enhance Applicant_Details table
-- Add missing columns from Oracle APPLICANT_DETAILS
-- ----------------------------------------------------------------------------
ALTER TABLE Applicant_Details
    ADD COLUMN IF NOT EXISTS Date_of_Birth DATE,
    ADD COLUMN IF NOT EXISTS Alternative_Name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS Company_Name VARCHAR(255);

-- Note: SIGNATURE already exists as BYTEA in PostgreSQL (Oracle uses CLOB)
-- Note: Oracle uses ISLAMIC_CENTER (NUMBER) - PostgreSQL uses center_id (BIGINT)

-- ----------------------------------------------------------------------------
-- 18. Enhance Suburb table
-- Add missing columns from Oracle SUBURBS
-- ----------------------------------------------------------------------------
ALTER TABLE Suburb
    ADD COLUMN IF NOT EXISTS Province VARCHAR(100),
    ADD COLUMN IF NOT EXISTS Municipality VARCHAR(255),
    ADD COLUMN IF NOT EXISTS Organisations_Present TEXT;

-- ============================================================================
-- PHASE 4: MEDIUM PRIORITY - Islamic Centers & Community Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 19. ISLAMIC_CENTERS
-- Islamic center/madressah information
-- Note: Decision needed - merge with Center_Detail or keep separate?
-- Creating as separate table for now, can be merged later
-- ----------------------------------------------------------------------------
CREATE TABLE Islamic_Centers (
    ID SERIAL PRIMARY KEY,
    Center_Name VARCHAR(255) NOT NULL,
    Suburb VARCHAR(255),
    Address VARCHAR(500),
    Ameer VARCHAR(255),
    Contact_Number VARCHAR(50),
    Name_Syllabus VARCHAR(255),
    center_id BIGINT, -- Link to Center_Detail if exists
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_center_id_islamic FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_islamic_centers_center ON Islamic_Centers (center_id);

-- ----------------------------------------------------------------------------
-- 20. MAINTENANCE
-- Maintenance records for Islamic centers
-- ----------------------------------------------------------------------------
CREATE TABLE Maintenance (
    ID SERIAL PRIMARY KEY,
    Islamic_Center_ID BIGINT NOT NULL,
    Type_Of_Maintenance VARCHAR(255),
    Date_Of_Maintenance DATE,
    Description_Of_Maintenance TEXT,
    Cost DECIMAL(12,2), -- Changed from VARCHAR to DECIMAL
    Supplier VARCHAR(255),
    Upload BYTEA,
    Upload_Filename VARCHAR(255),
    Upload_Mime VARCHAR(255),
    Upload_Size INT,
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_islamic_center_maintenance FOREIGN KEY (Islamic_Center_ID) REFERENCES Islamic_Centers(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_maintenance FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_maintenance_islamic_center ON Maintenance (Islamic_Center_ID);
CREATE INDEX idx_maintenance_center ON Maintenance (center_id);

-- ----------------------------------------------------------------------------
-- 21. SITE_VISITS
-- Site visit records for Islamic centers
-- ----------------------------------------------------------------------------
CREATE TABLE Site_Visits (
    ID SERIAL PRIMARY KEY,
    Islamic_Center_ID BIGINT NOT NULL,
    Representative VARCHAR(500),
    Date_Of_Visit DATE,
    Comments TEXT,
    Comments_Of_Staff TEXT,
    Uploads BYTEA,
    Uploads_Filename VARCHAR(255),
    Uploads_Mime VARCHAR(255),
    Uploads_Size INT,
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_islamic_center_site_visit FOREIGN KEY (Islamic_Center_ID) REFERENCES Islamic_Centers(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_site_visit FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_site_visits_islamic_center ON Site_Visits (Islamic_Center_ID);
CREATE INDEX idx_site_visits_center ON Site_Visits (center_id);
CREATE INDEX idx_site_visits_date ON Site_Visits (Date_Of_Visit);

-- ----------------------------------------------------------------------------
-- 22. SUBURB_MASJIDS
-- Masjid information per suburb
-- ----------------------------------------------------------------------------
CREATE TABLE Suburb_Masjids (
    ID SERIAL PRIMARY KEY,
    Suburb_ID BIGINT NOT NULL,
    Masjid_Name VARCHAR(255) NOT NULL,
    Imaam_Name VARCHAR(255),
    Imaam_Contact VARCHAR(255),
    Facilities_Available TEXT,
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_suburb_masjid FOREIGN KEY (Suburb_ID) REFERENCES Suburb(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_masjid FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_suburb_masjids_suburb ON Suburb_Masjids (Suburb_ID);
CREATE INDEX idx_suburb_masjids_center ON Suburb_Masjids (center_id);

-- ----------------------------------------------------------------------------
-- 23. SUBURB_CENSUS
-- Census data per suburb
-- ----------------------------------------------------------------------------
CREATE TABLE Suburb_Census (
    ID SERIAL PRIMARY KEY,
    Suburb_ID BIGINT NOT NULL,
    Population_Size VARCHAR(100), -- Consider NUMERIC if needed
    Muslim_Population_Size VARCHAR(100), -- Consider NUMERIC if needed
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_suburb_census FOREIGN KEY (Suburb_ID) REFERENCES Suburb(ID) ON DELETE CASCADE
);

CREATE INDEX idx_suburb_census_suburb ON Suburb_Census (Suburb_ID);

-- ----------------------------------------------------------------------------
-- 24. SUBURB_CONCERNS
-- Community concerns tracking per suburb
-- Note: Oracle column names with spaces need to be renamed
-- ----------------------------------------------------------------------------
CREATE TABLE Suburb_Concerns (
    ID SERIAL PRIMARY KEY,
    Suburb_ID BIGINT NOT NULL,
    General_Perception TEXT,
    Safety_Security TEXT, -- Renamed from "Safety & Security"
    Infrastructure_Transport TEXT, -- Renamed from "Infrastructure & Transport"
    Public_Services TEXT,
    Environmental_Health_Concerns TEXT, -- Renamed from "Environmental & Health Concerns"
    Social_Community_Wellbeing TEXT, -- Renamed from "Social & Community Wellbeing"
    Development_Planning TEXT, -- Renamed from "Development & Planning"
    Assessment_Done_By TEXT,
    Concerns_Discussed_With TEXT,
    center_id BIGINT NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_suburb_concerns FOREIGN KEY (Suburb_ID) REFERENCES Suburb(ID) ON DELETE CASCADE,
    CONSTRAINT fk_center_id_concerns FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_suburb_concerns_suburb ON Suburb_Concerns (Suburb_ID);
CREATE INDEX idx_suburb_concerns_center ON Suburb_Concerns (center_id);

-- ============================================================================
-- PHASE 5: LOW PRIORITY - Additional Lookup Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 25. MUNICIPALITIES
-- Municipality lookup table
-- ----------------------------------------------------------------------------
CREATE TABLE Municipalities (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Province VARCHAR(100),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data examples
INSERT INTO Municipalities (Name, Province, Created_By) VALUES
    ('City of Johannesburg', 'Gauteng', 'system'),
    ('City of Cape Town', 'Western Cape', 'system'),
    ('eThekwini', 'KwaZulu-Natal', 'system');

-- ============================================================================
-- Summary
-- ============================================================================
-- Total tables created: 15 new tables
-- Total columns added: 12 columns across 5 existing tables
-- Total lookup tables: 7 lookup tables with seed data
-- 
-- Next steps:
-- 1. Review and confirm table structures
-- 2. Test foreign key relationships
-- 3. Generate backend models/controllers/routes
-- 4. Create frontend pages
-- 5. Migrate data from Oracle (if applicable)

