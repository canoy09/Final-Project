-- WBS 1.3.1 View patient health records - additive migration.
-- Import in phpMyAdmin (XAMPP): select the obgyne_clinic database -> Import -> choose this file -> Go.
-- Existing tables (admins, revoked_tokens, appointments) are NOT touched.
USE obgyne_clinic;

-- Personal details. patient_code is the clinic's patient ID shown to staff (e.g. P-0001).
CREATE TABLE IF NOT EXISTS patients (
  id                       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_code             VARCHAR(12)  NOT NULL,
  full_name                VARCHAR(150) NOT NULL,
  birth_date               DATE         NOT NULL,
  civil_status             VARCHAR(20)  NULL,
  contact_number           VARCHAR(40)  NULL,
  email                    VARCHAR(100) NULL,
  address                  VARCHAR(255) NULL,
  occupation               VARCHAR(100) NULL,
  emergency_contact_name   VARCHAR(150) NULL,
  emergency_contact_number VARCHAR(40)  NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patients_code (patient_code),
  INDEX idx_patients_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical history: one row per patient (a patient may have none yet).
CREATE TABLE IF NOT EXISTS medical_histories (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_id          INT UNSIGNED NOT NULL,
  blood_type          VARCHAR(5)   NULL,
  allergies           TEXT NULL,
  chronic_conditions  TEXT NULL,
  past_surgeries      TEXT NULL,
  current_medications TEXT NULL,
  family_history      TEXT NULL,
  gravida             TINYINT UNSIGNED NULL,   -- number of pregnancies
  para                TINYINT UNSIGNED NULL,   -- number of deliveries
  last_menstrual_period DATE NULL,
  notes               TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_history_patient (patient_id),
  CONSTRAINT fk_history_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Previous check-ups (consultations). 1.4.1 follow-ups will link to these rows.
CREATE TABLE IF NOT EXISTS checkups (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_id              INT UNSIGNED NOT NULL,
  checkup_date            DATE         NOT NULL,
  service                 VARCHAR(150) NOT NULL,
  weight_kg               DECIMAL(5,2) NULL,
  blood_pressure          VARCHAR(10)  NULL,
  gestational_age_weeks   TINYINT UNSIGNED NULL,
  findings                TEXT NULL,
  treatment               TEXT NULL,
  next_visit_date         DATE NULL,
  attended_by             VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_checkups_patient_date (patient_id, checkup_date),
  CONSTRAINT fk_checkups_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample (fictional) patients are added by:  npm run seed:patients
