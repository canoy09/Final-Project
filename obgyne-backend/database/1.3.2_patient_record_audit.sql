-- WBS 1.3.2 Edit and update patient records.
-- Import after 1.3.1_patient_records.sql. Adds an audit trail; existing data is preserved.
USE obgyne_clinic;

CREATE TABLE IF NOT EXISTS patient_record_audit (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_id      INT UNSIGNED NOT NULL,
  editor_admin_id INT UNSIGNED NULL,
  changes         JSON NOT NULL,
  changed_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_patient_record_audit_patient_date (patient_id, changed_at),
  CONSTRAINT fk_patient_audit_patient
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
  CONSTRAINT fk_patient_audit_editor
    FOREIGN KEY (editor_admin_id) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
