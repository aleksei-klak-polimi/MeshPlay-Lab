-- Seed script for development database

-- Reset tables
DELETE FROM LobbyUser;
DELETE FROM Lobby;
DELETE FROM Game;
DELETE FROM User;

ALTER TABLE User AUTO_INCREMENT = 1;
ALTER TABLE Game AUTO_INCREMENT = 1;
ALTER TABLE Lobby AUTO_INCREMENT = 1;

-- Inserts sample Users and Games

-- -------------------------------
-- Users
-- -------------------------------
INSERT INTO `User` (`username`, `password_hash`, `created_at`)
VALUES
('alice', '$2b$10$EXAMPLEHASHALICE1234567890123456789012345678901234567890', NOW()),
('bob',   '$2b$10$EXAMPLEHASHBOB1234567890123456789012345678901234567890', NOW()),
('carol', '$2b$10$EXAMPLEHASHCAROL1234567890123456789012345678901234567890', NOW());

-- Note: replace password_hash values with real bcrypt hashes during testing

-- -------------------------------
-- Games
-- -------------------------------
INSERT INTO `Game` (`codeName`, `name`, `description`, `min_players`, `max_players`, `assets_url`, `version`, `created_at`)
VALUES
('simple_card', 'Simple Card Game', 'A basic card game to practice turn-taking.', 2, 4, '/assets/simple_card/', '1.0', NOW()),
('poker', 'Poker', 'Standard poker game for multiple players.', 2, 10, '/assets/poker/', '1.0', NOW()),
('blackjack', 'Blackjack', 'Classic blackjack game against dealer.', 1, 6, '/assets/blackjack/', '1.0', NOW());
