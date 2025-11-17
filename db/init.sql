SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Table `User`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `User` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(63) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Game`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Game` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `codeName` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `min_players` SMALLINT NOT NULL,
  `max_players` SMALLINT NOT NULL,
  `assets_url` VARCHAR(255) NULL DEFAULT NULL,
  `version` VARCHAR(20) NULL DEFAULT '1.0',
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `codeName_UNIQUE` (`codeName` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Lobby`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Lobby` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `game_id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('waiting', 'in_progress', 'finished') NOT NULL DEFAULT 'waiting',
  `max_players` INT NOT NULL,
  `current_players` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `metadata_json` JSON NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE,
  INDEX `fk_Lobby_1_idx` (`game_id` ASC) VISIBLE,
  CONSTRAINT `fk_Lobby_1`
    FOREIGN KEY (`game_id`)
    REFERENCES `Game` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `LobbyUser`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `LobbyUser` (
  `userId` BIGINT NOT NULL,
  `lobbyId` BIGINT NOT NULL,
  `joined_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `role` ENUM('owner', 'player', 'spectator') NULL DEFAULT 'player',
  PRIMARY KEY (`userId`, `lobbyId`),
  INDEX `fk_LobbyUser_2_idx` (`lobbyId` ASC) VISIBLE,
  CONSTRAINT `fk_LobbyUser_1`
    FOREIGN KEY (`userId`)
    REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_LobbyUser_2`
    FOREIGN KEY (`lobbyId`)
    REFERENCES `Lobby` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
