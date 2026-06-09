USE nutripaw;


INSERT INTO users (first_name, last_name, email, password_hash, role) 
VALUES 
('Anna', 'Schmidt', 'anna.sitter@example.com', '$2b$10$W7JudPskQz5duqO8HvFuGeTw8e/QWEJBDdgdOQ4NYiIhck8i1rCVq', 'sitter')
ON DUPLICATE KEY UPDATE email=email;


INSERT INTO pets (owner_id, name, species, race, colour, age, gender, weight, castrated, dietary_restrictions, medical_notes, food_schedule_times)
VALUES 
(1, 'Buddy', 'Dog', 'Golden Retriever', 'Golden', 4, 'Male', '32.5', TRUE, 'No chicken, allergic', 'Prone to ear infections', '08:00, 18:00'),
(1, 'Luna', 'Cat', 'Maine Coon', 'Silver Tabby', 7, 'Female', '6.2', TRUE, 'None', 'Needs daily thyroid medication', '07:00, 19:00');

INSERT INTO pet_access (pet_id, user_id, role)
VALUES 
(2, 2, 'sitter'); 

INSERT INTO medications (pet_id, medication_name, medication_type, dosage, start_date, end_date, schedule_times, week_days)
VALUES 
(2, 'Felimazole', 'Pill', '2.5mg', '2023-05-01', NULL, '07:00, 19:00', 'all'),
(1, 'Apoquel', 'Pill', '16mg', CURRENT_DATE - INTERVAL 7 DAY, CURRENT_DATE + INTERVAL 7 DAY, '08:00', 'all');


INSERT INTO weight_history (pet_id, weight, entry_date)
VALUES 
(1, 34.0, CURRENT_DATE - INTERVAL 90 DAY),
(1, 33.5, CURRENT_DATE - INTERVAL 60 DAY),
(1, 32.8, CURRENT_DATE - INTERVAL 30 DAY),
(1, 32.5, CURRENT_DATE);


INSERT INTO food_entries (pet_id, food_type, amount, food_time, entry_date)
VALUES 
(1, 'Dry Kibble - Beef', 200.00, '08:00:00', CURRENT_DATE - INTERVAL 1 DAY),
(1, 'Dry Kibble - Beef', 200.00, '18:00:00', CURRENT_DATE - INTERVAL 1 DAY),
(2, 'Wet Food - Salmon', 85.00, '07:00:00', CURRENT_DATE - INTERVAL 1 DAY),
(2, 'Wet Food - Salmon', 85.00, '19:00:00', CURRENT_DATE - INTERVAL 1 DAY);


INSERT INTO feeding_events (pet_id, task_id, schedule_time, fed_at)
VALUES 
(1, 'food', '08:00', CURRENT_TIMESTAMP - INTERVAL 4 HOUR),
(2, 'food', '07:00', CURRENT_TIMESTAMP - INTERVAL 5 HOUR);


INSERT INTO medication_events (pet_id, task_id, schedule_time, medicated_at)
VALUES 
(2, '1', '07:00', CURRENT_TIMESTAMP - INTERVAL 5 HOUR),
(1, '2', '08:00', CURRENT_TIMESTAMP - INTERVAL 4 HOUR);


INSERT INTO pet_uploads (pet_id, filename, file_url, mime_type, note)
VALUES 
(1, 'rabies_vax_2024.pdf', '/uploads/pets/rabies_vax_2024.pdf', 'application/pdf', 'Valid until 2027'),
(2, 'bloodwork_results.jpg', '/uploads/pets/bloodwork_results.jpg', 'image/jpeg', 'Annual thyroid check');

ALTER TABLE pets ADD COLUMN food_schedule_times VARCHAR(255) DEFAULT '08:00, 18:00';