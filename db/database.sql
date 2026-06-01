CREATE DATABASE IF NOT EXISTS nutripaw;
USE nutripaw;

CREATE TABLE IF NOT EXISTS users (
user_id INT AUTO_INCREMENT PRIMARY KEY,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100) NOT NULL,
email VARCHAR(150) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
  pet_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL,
  race VARCHAR(100),
  colour VARCHAR(50),
  age INT,
  gender VARCHAR(20),
  diagnosis VARCHAR(255),
  medication VARCHAR(255),
  behaviour VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pet_owner
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS food_entries (
food_entry_id INT AUTO_INCREMENT PRIMARY KEY,
pet_id INT NOT NULL,
food_type VARCHAR(100) NOT NULL,
amount DECIMAL(6,2) NOT NULL,
food_time TIME NOT NULL,
entry_date DATE NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_food_pet
FOREIGN KEY (pet_id) REFERENCES pets(pet_id)
ON DELETE CASCADE
ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS medications (
medication_id INT AUTO_INCREMENT PRIMARY KEY,
pet_id INT NOT NULL,
medication_name VARCHAR(100) NOT NULL,
medication_type VARCHAR(50) NOT NULL,
dosage VARCHAR(50) NOT NULL,
start_date DATE NOT NULL,
end_date DATE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_medication_pet
FOREIGN KEY (pet_id) REFERENCES pets(pet_id)
ON DELETE CASCADE
ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS feeding_events (
event_id INT AUTO_INCREMENT PRIMARY KEY,
pet_id INT NOT NULL,
task_id VARCHAR(50),
schedule_time VARCHAR(20),
fed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_feeding_event_pet
FOREIGN KEY (pet_id) REFERENCES pets(pet_id)
ON DELETE CASCADE
ON UPDATE CASCADE
);

-- Testuser: max@example.com / test1234
INSERT INTO users (first_name, last_name, email, password_hash)
VALUES ('Max', 'Mustermann', 'max@example.com', '$2b$10$W7JudPskQz5duqO8HvFuGeTw8e/QWEJBDdgdOQ4NYiIhck8i1rCVq')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

ALTER TABLE pets 
ADD COLUMN dietary_restrictions TEXT,
ADD COLUMN medical_notes TEXT,
ADD COLUMN weight VARCHAR(50);

ALTER TABLE users ADD COLUMN role ENUM('owner', 'sitter') NOT NULL DEFAULT 'owner';


DESCRIBE users;

DESCRIBE pets;

USE nutripaw;

DESCRIBE users;
SHOW COLUMNS FROM users;

USE nutripaw;
SHOW COLUMNS FROM users;

ALTER TABLE users 
ADD COLUMN reminder_active TINYINT(1) DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE pets  ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE pets ADD COLUMN castrated BOOLEAN DEFAULT FALSE;

-- table for weight tracking for medicalHistory
CREATE TABLE IF NOT EXISTS weight_history (
    weight_id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    entry_date DATE NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pet_access (
    access_id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('co-owner', 'sitter', 'shared') NOT NULL DEFAULT 'shared',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_pet_user (pet_id, user_id),
    
    CONSTRAINT fk_access_pet
        FOREIGN KEY (pet_id) REFERENCES pets(pet_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_access_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
