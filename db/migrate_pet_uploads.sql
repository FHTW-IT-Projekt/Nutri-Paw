USE nutripaw;

CREATE TABLE IF NOT EXISTS pet_uploads (
  upload_id   INT AUTO_INCREMENT PRIMARY KEY,
  pet_id      INT NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  note        TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_upload_pet
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
