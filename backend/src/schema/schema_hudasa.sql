-- ============================================================================
-- Hudasa Madressa Module Schema
-- Separate module for Madressa (Islamic school) student management
-- ============================================================================
-- This schema sits alongside the existing welfare system
-- All tables include center_id for multi-tenant isolation
-- All tables include audit fields (created_by, created_on, updated_by, updated_on)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MADRESSA_APPLICATION
-- Core table for madressah student applications
-- Links to Relationships table (parent/guardian)
-- ----------------------------------------------------------------------------
CREATE TABLE Madressa_Application (
    id BIGSERIAL PRIMARY KEY,
    applicant_relationship_id BIGINT NOT NULL,
    chronic_condition VARCHAR(255),
    blood_type VARCHAR(50),
    family_doctor VARCHAR(255),
    contact_details VARCHAR(50),
    allegies VARCHAR(255),
    chronic_medication_required VARCHAR(255),
    allergy_medication_required VARCHAR(255),
    center_id BIGINT NOT NULL,
    created_by VARCHAR(255),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_madressa_app_relationship FOREIGN KEY (applicant_relationship_id) REFERENCES Relationships(ID) ON DELETE CASCADE,
    CONSTRAINT fk_madressa_app_center FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_madressa_app_relationship ON Madressa_Application (applicant_relationship_id);
CREATE INDEX idx_madressa_app_center ON Madressa_Application (center_id);

-- ----------------------------------------------------------------------------
-- 2. CONDUCT_ASSESSMENT
-- Behavioral/conduct assessment for madressah students
-- Links to Madressa_Application
-- ----------------------------------------------------------------------------
CREATE TABLE Conduct_Assessment (
    id BIGSERIAL PRIMARY KEY,
    madressah_app_id BIGINT NOT NULL,
    question1 VARCHAR(255),
    question2 VARCHAR(255),
    question3 VARCHAR(255),
    question4 VARCHAR(255),
    question5 VARCHAR(255),
    jumah VARCHAR(255),
    eid VARCHAR(255),
    inclination VARCHAR(255),
    comment_on_character VARCHAR(255),
    center_id BIGINT NOT NULL,
    created_by VARCHAR(255),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_conduct_assessment_madressa FOREIGN KEY (madressah_app_id) REFERENCES Madressa_Application(id) ON DELETE CASCADE,
    CONSTRAINT fk_conduct_assessment_center FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_conduct_assessment_madressa ON Conduct_Assessment (madressah_app_id);
CREATE INDEX idx_conduct_assessment_center ON Conduct_Assessment (center_id);

-- ----------------------------------------------------------------------------
-- 3. ACADEMIC_RESULTS
-- Academic report cards for madressah students
-- Links to Madressa_Application
-- ----------------------------------------------------------------------------
CREATE TABLE Academic_Results (
    id BIGSERIAL PRIMARY KEY,
    madressah_app_id BIGINT NOT NULL,
    school VARCHAR(255),
    grade VARCHAR(50),
    term VARCHAR(50),
    subject1 VARCHAR(10),
    subject1ave VARCHAR(10),
    subject1name VARCHAR(100),
    subject2 VARCHAR(10),
    subject2ave VARCHAR(10),
    subject2name VARCHAR(100),
    subject3 VARCHAR(10),
    subject3ave VARCHAR(10),
    subject3name VARCHAR(100),
    subject4 VARCHAR(10),
    subject4ave VARCHAR(10),
    subject4name VARCHAR(100),
    subject5 VARCHAR(10),
    subject5ave VARCHAR(10),
    subject5name VARCHAR(100),
    subject6 VARCHAR(10),
    subject6ave VARCHAR(10),
    subject6name VARCHAR(100),
    subject7 VARCHAR(10),
    subject7ave VARCHAR(10),
    subject7name VARCHAR(100),
    subject8 VARCHAR(10),
    subject8ave VARCHAR(10),
    subject8name VARCHAR(100),
    subject9 VARCHAR(10),
    subject9ave VARCHAR(10),
    subject9name VARCHAR(100),
    days_absent VARCHAR(100),
    comments TEXT,
    report_upload BYTEA,
    report_upload_filename VARCHAR(255),
    report_upload_mime VARCHAR(255),
    report_upload_size INT,
    center_id BIGINT NOT NULL,
    created_by VARCHAR(255),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_academic_results_madressa FOREIGN KEY (madressah_app_id) REFERENCES Madressa_Application(id) ON DELETE CASCADE,
    CONSTRAINT fk_academic_results_center FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_academic_results_madressa ON Academic_Results (madressah_app_id);
CREATE INDEX idx_academic_results_center ON Academic_Results (center_id);
CREATE INDEX idx_academic_results_term ON Academic_Results (term, grade);

-- ----------------------------------------------------------------------------
-- 4. ISLAMIC_RESULTS
-- Islamic studies report cards for madressah students
-- Links to Madressa_Application
-- ----------------------------------------------------------------------------
CREATE TABLE Islamic_Results (
    id BIGSERIAL PRIMARY KEY,
    madressah_app_id BIGINT NOT NULL,
    grade VARCHAR(50),
    term VARCHAR(50),
    subject1 VARCHAR(10),
    subject1ave VARCHAR(10),
    subject1name VARCHAR(100),
    subject2 VARCHAR(10),
    subject2ave VARCHAR(10),
    subject2name VARCHAR(100),
    subject3 VARCHAR(10),
    subject3ave VARCHAR(10),
    subject3name VARCHAR(100),
    subject4 VARCHAR(10),
    subject4ave VARCHAR(10),
    subject4name VARCHAR(100),
    subject5 VARCHAR(10),
    subject5ave VARCHAR(10),
    subject5name VARCHAR(100),
    subject6 VARCHAR(10),
    subject6ave VARCHAR(10),
    subject6name VARCHAR(100),
    subject7 VARCHAR(10),
    subject7ave VARCHAR(10),
    subject7name VARCHAR(100),
    subject8 VARCHAR(10),
    subject8ave VARCHAR(10),
    subject8name VARCHAR(100),
    subject9 VARCHAR(10),
    subject9ave VARCHAR(10),
    subject9name VARCHAR(100),
    days_absent VARCHAR(100),
    comments TEXT,
    report_upload BYTEA,
    report_upload_filename VARCHAR(255),
    report_upload_mime VARCHAR(255),
    report_upload_size INT,
    center_id BIGINT NOT NULL,
    created_by VARCHAR(255),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_islamic_results_madressa FOREIGN KEY (madressah_app_id) REFERENCES Madressa_Application(id) ON DELETE CASCADE,
    CONSTRAINT fk_islamic_results_center FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_islamic_results_madressa ON Islamic_Results (madressah_app_id);
CREATE INDEX idx_islamic_results_center ON Islamic_Results (center_id);
CREATE INDEX idx_islamic_results_term ON Islamic_Results (term, grade);

-- ----------------------------------------------------------------------------
-- 5. SURVEY
-- 19-question survey for madressah applications
-- Links to Madressa_Application
-- ----------------------------------------------------------------------------
CREATE TABLE Survey (
    id BIGSERIAL PRIMARY KEY,
    madressah_app_id BIGINT NOT NULL,
    question1 VARCHAR(255),
    question2 VARCHAR(255),
    question3 VARCHAR(255),
    question4 VARCHAR(255),
    question5 TEXT,
    question6 VARCHAR(255),
    question7 VARCHAR(255),
    question8 VARCHAR(255),
    question9 VARCHAR(255),
    question10 VARCHAR(255),
    question11 VARCHAR(255),
    question12 VARCHAR(255),
    question13 VARCHAR(255),
    question14 VARCHAR(255),
    question15 TEXT,
    question16 VARCHAR(255),
    question17 VARCHAR(255),
    question18 VARCHAR(255),
    question19 VARCHAR(255),
    center_id BIGINT NOT NULL,
    created_by VARCHAR(255),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_survey_madressa FOREIGN KEY (madressah_app_id) REFERENCES Madressa_Application(id) ON DELETE CASCADE,
    CONSTRAINT fk_survey_center FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE INDEX idx_survey_madressa ON Survey (madressah_app_id);
CREATE INDEX idx_survey_center ON Survey (center_id);

-- ============================================================================
-- End of Schema
-- ============================================================================

