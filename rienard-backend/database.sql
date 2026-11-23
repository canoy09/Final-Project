-- I-import sa phpMyAdmin (XAMPP) o i-run sa SQL tab
CREATE DATABASE IF NOT EXISTS obgyne_clinic
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE obgyne_clinic;

-- Account ng pasyente
CREATE TABLE IF NOT EXISTS patients (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Linked profile ng pasyente
CREATE TABLE IF NOT EXISTS patient_profiles (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL UNIQUE,
  first_name VARCHAR(80)  NOT NULL,
  last_name  VARCHAR(80)  NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
