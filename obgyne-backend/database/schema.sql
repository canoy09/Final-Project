-- 1.1.1 Admin Log In - database
-- Import in phpMyAdmin (XAMPP): Import tab -> choose this file -> Go.

CREATE DATABASE IF NOT EXISTS obgyne_clinic
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE obgyne_clinic;

-- Admin accounts (two roles: doctor and secretary).
-- Passwords are never stored as plain text, only as bcrypt hashes.
CREATE TABLE IF NOT EXISTS admins (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(100) NOT NULL,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  email           VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('doctor', 'secretary') NOT NULL,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  failed_attempts INT          NOT NULL DEFAULT 0,
  locked_until    DATETIME     NULL,
  last_login_at   DATETIME     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tokens that were logged out before they expired.
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        CHAR(36)  NOT NULL PRIMARY KEY,
  expires_at DATETIME  NOT NULL,
  revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admin accounts are created by running:  npm run seed
