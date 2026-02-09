CREATE DATABASE  IF NOT EXISTS `gestion_bee` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `gestion_bee`;
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: gestion_bee
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `absence_previsionnels`
--

DROP TABLE IF EXISTS `absence_previsionnels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `absence_previsionnels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `absence` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_depart` date NOT NULL,
  `heure_depart` time NOT NULL,
  `date_reprise` date NOT NULL,
  `heure_reprise` time NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `absence_previsionnels_employee_id_foreign` (`employee_id`),
  CONSTRAINT `absence_previsionnels_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `absence_previsionnels`
--

LOCK TABLES `absence_previsionnels` WRITE;
/*!40000 ALTER TABLE `absence_previsionnels` DISABLE KEYS */;
INSERT INTO `absence_previsionnels` VALUES (1,'Casseuse','2025-11-10','09:00:00','2025-11-11','09:00:00',1,'2025-11-02 19:48:36','2025-11-02 19:48:36');
/*!40000 ALTER TABLE `absence_previsionnels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `NomAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `PrenomAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SexeAgent` enum('Masculin','Feminin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `EmailAgent` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TelAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `AdresseAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `VilleAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CodePostalAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agents_emailagent_unique` (`EmailAgent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agents`
--

LOCK TABLES `agents` WRITE;
/*!40000 ALTER TABLE `agents` DISABLE KEYS */;
/*!40000 ALTER TABLE `agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `arrondis`
--

DROP TABLE IF EXISTS `arrondis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `arrondis` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `min` double(8,2) NOT NULL,
  `max` double(8,2) NOT NULL,
  `valeur_arrondi` double(8,2) NOT NULL,
  `type_arrondi` enum('Ajouter','Détruire') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `groupe_arrondi_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `arrondis_groupe_arrondi_id_foreign` (`groupe_arrondi_id`),
  CONSTRAINT `arrondis_groupe_arrondi_id_foreign` FOREIGN KEY (`groupe_arrondi_id`) REFERENCES `groupe_arrondi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arrondis`
--

LOCK TABLES `arrondis` WRITE;
/*!40000 ALTER TABLE `arrondis` DISABLE KEYS */;
/*!40000 ALTER TABLE `arrondis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `autorisations`
--

DROP TABLE IF EXISTS `autorisations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `autorisations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `autorisation_onas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_autorisation` date NOT NULL,
  `date_expiration` date NOT NULL,
  `date_alerte` date DEFAULT NULL,
  `vehicule_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `autorisations_vehicule_id_foreign` (`vehicule_id`),
  CONSTRAINT `autorisations_vehicule_id_foreign` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autorisations`
--

LOCK TABLES `autorisations` WRITE;
/*!40000 ALTER TABLE `autorisations` DISABLE KEYS */;
/*!40000 ALTER TABLE `autorisations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bon__entres`
--

DROP TABLE IF EXISTS `bon__entres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bon__entres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `emetteur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recepteur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bon__entres`
--

LOCK TABLES `bon__entres` WRITE;
/*!40000 ALTER TABLE `bon__entres` DISABLE KEYS */;
/*!40000 ALTER TABLE `bon__entres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bon__sourties`
--

DROP TABLE IF EXISTS `bon__sourties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bon__sourties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `emetteur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recepteur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bon__sourties`
--

LOCK TABLES `bon__sourties` WRITE;
/*!40000 ALTER TABLE `bon__sourties` DISABLE KEYS */;
/*!40000 ALTER TABLE `bon__sourties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bon_livraisons`
--

DROP TABLE IF EXISTS `bon_livraisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bon_livraisons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `validation_offer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modePaiement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bon_livraisons_client_id_foreign` (`client_id`),
  KEY `bon_livraisons_user_id_foreign` (`user_id`),
  CONSTRAINT `bon_livraisons_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `bon_livraisons_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bon_livraisons`
--

LOCK TABLES `bon_livraisons` WRITE;
/*!40000 ALTER TABLE `bon_livraisons` DISABLE KEYS */;
/*!40000 ALTER TABLE `bon_livraisons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calculs`
--

DROP TABLE IF EXISTS `calculs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calculs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `rubrique_id` bigint unsigned NOT NULL,
  `type_calcul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `formule_nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule_base` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule_taux` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule_montant` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_nombre` tinyint(1) NOT NULL DEFAULT '0',
  `report_base` tinyint(1) NOT NULL DEFAULT '0',
  `report_taux` tinyint(1) NOT NULL DEFAULT '0',
  `report_montant` tinyint(1) NOT NULL DEFAULT '0',
  `impression_nombre` tinyint(1) NOT NULL DEFAULT '0',
  `impression_base` tinyint(1) NOT NULL DEFAULT '0',
  `impression_taux` tinyint(1) NOT NULL DEFAULT '0',
  `impression_montant` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_nombre` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_base` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_taux` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_montant` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `calculs_rubrique_id_index` (`rubrique_id`),
  KEY `calculs_type_calcul_index` (`type_calcul`),
  KEY `calculs_gain_index` (`gain`),
  CONSTRAINT `calculs_rubrique_id_foreign` FOREIGN KEY (`rubrique_id`) REFERENCES `rubriques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calculs`
--

LOCK TABLES `calculs` WRITE;
/*!40000 ALTER TABLE `calculs` DISABLE KEYS */;
INSERT INTO `calculs` VALUES (1,1,'Nombre x Base','retenue','3 × 4','3','4',NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,'2025-11-02 19:43:45','2025-11-02 19:43:45');
/*!40000 ALTER TABLE `calculs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendries`
--

DROP TABLE IF EXISTS `calendries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendries`
--

LOCK TABLES `calendries` WRITE;
/*!40000 ALTER TABLE `calendries` DISABLE KEYS */;
INSERT INTO `calendries` VALUES (1,'calendrie','2025-10-29 07:50:23','2025-10-29 07:50:23');
/*!40000 ALTER TABLE `calendries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calibre`
--

DROP TABLE IF EXISTS `calibre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calibre` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `calibre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calibre`
--

LOCK TABLES `calibre` WRITE;
/*!40000 ALTER TABLE `calibre` DISABLE KEYS */;
/*!40000 ALTER TABLE `calibre` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `logoP` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chargement_commandes`
--

DROP TABLE IF EXISTS `chargement_commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chargement_commandes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicule_id` bigint unsigned NOT NULL,
  `conforme` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `statusChargemant` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarque` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `livreur_id` bigint unsigned NOT NULL,
  `commande_id` bigint unsigned NOT NULL,
  `dateLivraisonPrevue` date NOT NULL,
  `dateLivraisonReelle` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chargement_commandes_vehicule_id_foreign` (`vehicule_id`),
  KEY `chargement_commandes_livreur_id_foreign` (`livreur_id`),
  KEY `chargement_commandes_commande_id_foreign` (`commande_id`),
  CONSTRAINT `chargement_commandes_commande_id_foreign` FOREIGN KEY (`commande_id`) REFERENCES `commandes` (`id`),
  CONSTRAINT `chargement_commandes_livreur_id_foreign` FOREIGN KEY (`livreur_id`) REFERENCES `livreurs` (`id`),
  CONSTRAINT `chargement_commandes_vehicule_id_foreign` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chargement_commandes`
--

LOCK TABLES `chargement_commandes` WRITE;
/*!40000 ALTER TABLE `chargement_commandes` DISABLE KEYS */;
/*!40000 ALTER TABLE `chargement_commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chiffre_affaires`
--

DROP TABLE IF EXISTS `chiffre_affaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chiffre_affaires` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chiffre_affaires_client_id_foreign` (`client_id`),
  CONSTRAINT `chiffre_affaires_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chiffre_affaires`
--

LOCK TABLES `chiffre_affaires` WRITE;
/*!40000 ALTER TABLE `chiffre_affaires` DISABLE KEYS */;
/*!40000 ALTER TABLE `chiffre_affaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_groupe_client`
--

DROP TABLE IF EXISTS `client_groupe_client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_groupe_client` (
  `CodeClient` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Id_groupe` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`CodeClient`,`Id_groupe`),
  KEY `client_groupe_client_id_groupe_foreign` (`Id_groupe`),
  CONSTRAINT `client_groupe_client_codeclient_foreign` FOREIGN KEY (`CodeClient`) REFERENCES `clients` (`CodeClient`) ON DELETE CASCADE,
  CONSTRAINT `client_groupe_client_id_groupe_foreign` FOREIGN KEY (`Id_groupe`) REFERENCES `groupe_clients` (`Id_groupe`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_groupe_client`
--

LOCK TABLES `client_groupe_client` WRITE;
/*!40000 ALTER TABLE `client_groupe_client` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_groupe_client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `CodeClient` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `raison_sociale` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_client` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tele` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ville` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jour` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abreviation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_postal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logoC` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ice` int NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `zone_id` bigint unsigned NOT NULL,
  `region_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clients_codeclient_unique` (`CodeClient`),
  KEY `clients_user_id_foreign` (`user_id`),
  KEY `clients_zone_id_foreign` (`zone_id`),
  KEY `clients_region_id_foreign` (`region_id`),
  CONSTRAINT `clients_region_id_foreign` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `clients_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `clients_zone_id_foreign` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cnss_affiliations`
--

DROP TABLE IF EXISTS `cnss_affiliations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cnss_affiliations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `numero_cnss` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salaire` decimal(10,2) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` enum('Actif','Inactif','Suspendu') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Actif',
  `departement_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cnss_affiliations_departement_id_foreign` (`departement_id`),
  KEY `cnss_affiliations_employe_id_index` (`employe_id`),
  KEY `cnss_affiliations_statut_index` (`statut`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cnss_affiliations`
--

LOCK TABLES `cnss_affiliations` WRITE;
/*!40000 ALTER TABLE `cnss_affiliations` DISABLE KEYS */;
INSERT INTO `cnss_affiliations` VALUES (8,2,'122345',13626.00,'2026-02-05',NULL,'Actif',10,'2026-02-05 13:13:39','2026-02-05 13:14:47'),(9,5,'122345',6462.00,'2026-02-05',NULL,'Actif',10,'2026-02-05 13:52:50','2026-02-05 13:52:50'),(4,7,'295828564',8911.00,'2022-02-03',NULL,'Actif',11,'2026-02-03 13:53:02','2026-02-03 13:53:02'),(5,8,'477686953',12351.00,'2022-02-03',NULL,'Actif',11,'2026-02-03 13:53:02','2026-02-03 13:53:02'),(6,9,'331731754',9628.00,'2024-02-03',NULL,'Actif',11,'2026-02-03 13:53:02','2026-02-03 13:53:02'),(7,12,'1111111111111',10000.00,'2026-02-04',NULL,'Actif',7,'2026-02-03 15:06:22','2026-02-03 15:06:22');
/*!40000 ALTER TABLE `cnss_affiliations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cnss_documents`
--

DROP TABLE IF EXISTS `cnss_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cnss_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `operation_id` bigint unsigned DEFAULT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stored_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` bigint unsigned NOT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cnss_documents_employe_id_index` (`employe_id`),
  KEY `cnss_documents_uploaded_by_index` (`uploaded_by`),
  KEY `cnss_documents_operation_id_index` (`operation_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cnss_documents`
--

LOCK TABLES `cnss_documents` WRITE;
/*!40000 ALTER TABLE `cnss_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `cnss_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cnss_operations`
--

DROP TABLE IF EXISTS `cnss_operations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cnss_operations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `type_operation` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_operation` date NOT NULL,
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `montant` decimal(12,2) DEFAULT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cnss_operations_created_by_foreign` (`created_by`),
  KEY `cnss_operations_updated_by_foreign` (`updated_by`),
  KEY `cnss_operations_employe_id_index` (`employe_id`),
  KEY `cnss_operations_date_operation_index` (`date_operation`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cnss_operations`
--

LOCK TABLES `cnss_operations` WRITE;
/*!40000 ALTER TABLE `cnss_operations` DISABLE KEYS */;
INSERT INTO `cnss_operations` VALUES (1,2,'ATTESTATION','2026-02-06',NULL,NULL,'EN_COURS',NULL,1,1,'2026-02-06 15:40:14','2026-02-06 15:40:14');
/*!40000 ALTER TABLE `cnss_operations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes`
--

DROP TABLE IF EXISTS `commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dateSaisis` timestamp NOT NULL,
  `dateCommande` date NOT NULL,
  `datePreparationCommande` date DEFAULT NULL,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mode_payement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` bigint unsigned DEFAULT NULL,
  `site_id` bigint unsigned DEFAULT NULL,
  `fournisseur_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commandes_client_id_foreign` (`client_id`),
  KEY `commandes_site_id_foreign` (`site_id`),
  KEY `commandes_fournisseur_id_foreign` (`fournisseur_id`),
  KEY `commandes_user_id_foreign` (`user_id`),
  CONSTRAINT `commandes_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `commandes_fournisseur_id_foreign` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `commandes_site_id_foreign` FOREIGN KEY (`site_id`) REFERENCES `site_clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `commandes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes`
--

LOCK TABLES `commandes` WRITE;
/*!40000 ALTER TABLE `commandes` DISABLE KEYS */;
/*!40000 ALTER TABLE `commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comptes`
--

DROP TABLE IF EXISTS `comptes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comptes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designations` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_compte` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `devise` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rib` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `swift` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarque` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comptes`
--

LOCK TABLES `comptes` WRITE;
/*!40000 ALTER TABLE `comptes` DISABLE KEYS */;
/*!40000 ALTER TABLE `comptes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `constantes`
--

DROP TABLE IF EXISTS `constantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `constantes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_constante` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `memo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valeur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `visibilite` tinyint(1) NOT NULL DEFAULT '1',
  `group_constante_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `constantes_group_constante_id_foreign` (`group_constante_id`),
  CONSTRAINT `constantes_group_constante_id_foreign` FOREIGN KEY (`group_constante_id`) REFERENCES `group_constantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `constantes`
--

LOCK TABLES `constantes` WRITE;
/*!40000 ALTER TABLE `constantes` DISABLE KEYS */;
INSERT INTO `constantes` VALUES (1,'15','constante','type1','mémo1','12',1,1,'2025-10-29 13:08:32','2025-10-29 13:08:32');
/*!40000 ALTER TABLE `constantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_clients`
--

DROP TABLE IF EXISTS `contact_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `idClient` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_clients_idclient_foreign` (`idClient`),
  CONSTRAINT `contact_clients_idclient_foreign` FOREIGN KEY (`idClient`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_clients`
--

LOCK TABLES `contact_clients` WRITE;
/*!40000 ALTER TABLE `contact_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contract_types`
--

DROP TABLE IF EXISTS `contract_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contract_types_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract_types`
--

LOCK TABLES `contract_types` WRITE;
/*!40000 ALTER TABLE `contract_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `contract_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contrats`
--

DROP TABLE IF EXISTS `contrats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contrats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `numero_contrat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_contrat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `arret_prevu` date DEFAULT NULL,
  `duree_prevu` int DEFAULT NULL,
  `design` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `debut_le` date DEFAULT NULL,
  `arret_effectif` date DEFAULT NULL,
  `duree_effective` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `motif_depart` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dernier_jour_travaille` date DEFAULT NULL,
  `notification_rupture` date DEFAULT NULL,
  `engagement_procedure` date DEFAULT NULL,
  `signature_rupture_conventionnelle` date DEFAULT NULL,
  `transaction_en_cours` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contrats_employe_id_foreign` (`employe_id`),
  CONSTRAINT `contrats_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contrats`
--

LOCK TABLES `contrats` WRITE;
/*!40000 ALTER TABLE `contrats` DISABLE KEYS */;
INSERT INTO `contrats` VALUES (1,1,'3',NULL,'2025-12-17',NULL,'contrat3','2025-08-20','2025-08-30',NULL,'2025-10-29 07:47:49','2025-10-29 07:47:49',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `contrats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `declarations_cnss`
--

DROP TABLE IF EXISTS `declarations_cnss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `declarations_cnss` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `mois` int NOT NULL,
  `annee` int NOT NULL,
  `montant_total` decimal(12,2) NOT NULL,
  `statut` enum('EN_ATTENTE','DECLARE','PAYE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_ATTENTE',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `declarations_cnss`
--

LOCK TABLES `declarations_cnss` WRITE;
/*!40000 ALTER TABLE `declarations_cnss` DISABLE KEYS */;
INSERT INTO `declarations_cnss` VALUES (8,3,2026,3087.75,'DECLARE','2026-02-07 18:33:41','2026-02-07 18:33:41'),(7,1,2026,12744.50,'EN_ATTENTE','2026-02-06 13:19:13','2026-02-06 13:19:13');
/*!40000 ALTER TABLE `declarations_cnss` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departements`
--

DROP TABLE IF EXISTS `departements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `departements_parent_id_foreign` (`parent_id`),
  CONSTRAINT `departements_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `departements` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departements`
--

LOCK TABLES `departements` WRITE;
/*!40000 ALTER TABLE `departements` DISABLE KEYS */;
INSERT INTO `departements` VALUES (1,'INFO',NULL,NULL,NULL),(7,'Test',1,'2025-10-28 13:35:08','2025-10-28 13:35:08'),(10,'Département IT',NULL,'2026-02-03 13:51:48','2026-02-03 13:51:48'),(11,'Ressources Humaines',NULL,'2026-02-03 13:51:49','2026-02-03 13:51:49');
/*!40000 ALTER TABLE `departements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detail_motif_absences`
--

DROP TABLE IF EXISTS `detail_motif_absences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detail_motif_absences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_motif_absence_id` bigint unsigned DEFAULT NULL,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abreviation` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('payé','non payé') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'payé',
  `cause` enum('congé','maladie') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'congé',
  `commentaire` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detail_motif_absences_group_motif_absence_id_foreign` (`group_motif_absence_id`),
  CONSTRAINT `detail_motif_absences_group_motif_absence_id_foreign` FOREIGN KEY (`group_motif_absence_id`) REFERENCES `group_motif_absences` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detail_motif_absences`
--

LOCK TABLES `detail_motif_absences` WRITE;
/*!40000 ALTER TABLE `detail_motif_absences` DISABLE KEYS */;
INSERT INTO `detail_motif_absences` VALUES (1,1,'Casseuse','MTS','non payé','congé','ml;k,jnbh','2025-10-28 13:56:31','2025-10-28 13:56:31'),(4,1,'LAST equipement','hgcj','payé','congé','kjhbg','2025-11-02 15:22:18','2025-11-02 15:22:18');
/*!40000 ALTER TABLE `detail_motif_absences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `details_calendries`
--

DROP TABLE IF EXISTS `details_calendries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `details_calendries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `debut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `groupe_id` bigint unsigned NOT NULL,
  `groupe_horaire_id` bigint unsigned NOT NULL,
  `jourDebut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `details_calendries_groupe_id_foreign` (`groupe_id`),
  KEY `details_calendries_groupe_horaire_id_foreign` (`groupe_horaire_id`),
  CONSTRAINT `details_calendries_groupe_horaire_id_foreign` FOREIGN KEY (`groupe_horaire_id`) REFERENCES `horaire_periodiques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `details_calendries_groupe_id_foreign` FOREIGN KEY (`groupe_id`) REFERENCES `calendries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `details_calendries`
--

LOCK TABLES `details_calendries` WRITE;
/*!40000 ALTER TABLE `details_calendries` DISABLE KEYS */;
INSERT INTO `details_calendries` VALUES (3,'2025-10-01','2025-10-22',1,2,'Mercredi','2025-10-29 07:56:19','2025-10-29 07:56:19');
/*!40000 ALTER TABLE `details_calendries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `details_declaration_cnss`
--

DROP TABLE IF EXISTS `details_declaration_cnss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `details_declaration_cnss` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `declaration_cnss_id` bigint unsigned NOT NULL,
  `employe_id` bigint unsigned NOT NULL,
  `affiliation_cnss_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `details_declaration_cnss_declaration_cnss_id_foreign` (`declaration_cnss_id`),
  KEY `details_declaration_cnss_employe_id_foreign` (`employe_id`),
  KEY `details_declaration_cnss_affiliation_cnss_id_foreign` (`affiliation_cnss_id`)
) ENGINE=MyISAM AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `details_declaration_cnss`
--

LOCK TABLES `details_declaration_cnss` WRITE;
/*!40000 ALTER TABLE `details_declaration_cnss` DISABLE KEYS */;
INSERT INTO `details_declaration_cnss` VALUES (6,1,12,7,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(5,1,9,6,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(4,1,7,4,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(7,2,4,3,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(8,2,12,7,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(9,2,7,4,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(10,3,3,2,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(11,3,4,3,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(12,3,9,6,'2026-02-04 12:36:07','2026-02-04 12:36:07'),(13,4,4,3,'2026-02-04 13:25:03','2026-02-04 13:25:03'),(14,4,8,5,'2026-02-04 13:25:03','2026-02-04 13:25:03'),(15,4,9,6,'2026-02-04 13:25:03','2026-02-04 13:25:03'),(16,4,12,7,'2026-02-04 13:25:03','2026-02-04 13:25:03'),(17,4,7,4,'2026-02-04 13:25:03','2026-02-04 13:25:03'),(27,5,12,7,'2026-02-05 13:19:34','2026-02-05 13:19:34'),(26,5,9,6,'2026-02-05 13:19:34','2026-02-05 13:19:34'),(25,5,8,5,'2026-02-05 13:19:34','2026-02-05 13:19:34'),(24,5,7,4,'2026-02-05 13:19:34','2026-02-05 13:19:34'),(23,5,2,8,'2026-02-05 13:19:34','2026-02-05 13:19:34'),(35,6,12,7,'2026-02-06 13:16:35','2026-02-06 13:16:35'),(34,6,9,6,'2026-02-06 13:16:35','2026-02-06 13:16:35'),(33,6,5,9,'2026-02-06 13:16:35','2026-02-06 13:16:35'),(32,6,2,8,'2026-02-06 13:16:35','2026-02-06 13:16:35'),(36,6,7,4,'2026-02-06 13:16:35','2026-02-06 13:16:35'),(37,6,8,5,'2026-02-06 13:16:35','2026-02-06 13:16:35'),(50,7,12,7,'2026-02-07 18:49:02','2026-02-07 18:49:02'),(49,7,9,6,'2026-02-07 18:49:02','2026-02-07 18:49:02'),(48,7,8,5,'2026-02-07 18:49:02','2026-02-07 18:49:02'),(47,7,7,4,'2026-02-07 18:49:02','2026-02-07 18:49:02'),(46,7,5,9,'2026-02-07 18:49:02','2026-02-07 18:49:02'),(45,7,2,8,'2026-02-07 18:49:02','2026-02-07 18:49:02'),(44,8,8,5,'2026-02-07 18:33:41','2026-02-07 18:33:41');
/*!40000 ALTER TABLE `details_declaration_cnss` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `details_periodiques`
--

DROP TABLE IF EXISTS `details_periodiques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `details_periodiques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `numero_jour` int DEFAULT NULL,
  `libele` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horaire` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `groupe_horaire_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `details_periodiques_groupe_horaire_id_foreign` (`groupe_horaire_id`),
  CONSTRAINT `details_periodiques_groupe_horaire_id_foreign` FOREIGN KEY (`groupe_horaire_id`) REFERENCES `horaire_periodiques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `details_periodiques`
--

LOCK TABLES `details_periodiques` WRITE;
/*!40000 ALTER TABLE `details_periodiques` DISABLE KEYS */;
INSERT INTO `details_periodiques` VALUES (16,1,'Lundi',NULL,2,'2025-10-29 07:55:41','2025-10-29 07:55:41'),(17,2,'Mardi',NULL,2,'2025-10-29 07:55:41','2025-10-29 07:55:41'),(18,3,'Mercredi',NULL,2,'2025-10-29 07:55:41','2025-10-29 07:55:41'),(19,4,'Jeudi',NULL,2,'2025-10-29 07:55:41','2025-10-29 07:55:41'),(20,5,'Vendredi',NULL,2,'2025-10-29 07:55:41','2025-10-29 07:55:41');
/*!40000 ALTER TABLE `details_periodiques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `details_regles`
--

DROP TABLE IF EXISTS `details_regles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `details_regles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `heures_supplementaires` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `autre_supplement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plafond` decimal(10,2) NOT NULL,
  `numero_ordre` int NOT NULL,
  `regle_compensation_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `details_regles_regle_compensation_id_foreign` (`regle_compensation_id`),
  CONSTRAINT `details_regles_regle_compensation_id_foreign` FOREIGN KEY (`regle_compensation_id`) REFERENCES `regle_compensation` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `details_regles`
--

LOCK TABLES `details_regles` WRITE;
/*!40000 ALTER TABLE `details_regles` DISABLE KEYS */;
INSERT INTO `details_regles` VALUES (1,'0%','0','0',0.00,0,1,'2025-10-30 08:29:25','2025-10-30 08:29:25'),(2,'25%','0','0',0.00,0,1,'2025-10-30 08:29:25','2025-10-30 08:29:25'),(3,'50%','0','0',0.00,0,1,'2025-10-30 08:29:25','2025-10-30 08:29:25'),(4,'100%','0','0',0.00,0,1,'2025-10-30 08:29:25','2025-10-30 08:29:25'),(5,'0%','0','0',0.00,0,2,'2025-11-02 15:28:46','2025-11-02 15:28:46'),(6,'25%','0','0',0.00,0,2,'2025-11-02 15:28:46','2025-11-02 15:28:46'),(7,'50%','0','0',0.00,0,2,'2025-11-02 15:28:46','2025-11-02 15:28:46'),(8,'100%','0','0',0.00,0,2,'2025-11-02 15:28:46','2025-11-02 15:28:46');
/*!40000 ALTER TABLE `details_regles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devis`
--

DROP TABLE IF EXISTS `devis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devis` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `validation_offer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modePaiement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `devis_client_id_foreign` (`client_id`),
  KEY `devis_user_id_foreign` (`user_id`),
  CONSTRAINT `devis_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `devis_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devis`
--

LOCK TABLES `devis` WRITE;
/*!40000 ALTER TABLE `devis` DISABLE KEYS */;
/*!40000 ALTER TABLE `devis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employe_departement`
--

DROP TABLE IF EXISTS `employe_departement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employe_departement` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `departement_id` bigint unsigned NOT NULL,
  `date_début` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employe_departement_employe_id_foreign` (`employe_id`),
  KEY `employe_departement_departement_id_foreign` (`departement_id`),
  CONSTRAINT `employe_departement_departement_id_foreign` FOREIGN KEY (`departement_id`) REFERENCES `departements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employe_departement_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employe_departement`
--

LOCK TABLES `employe_departement` WRITE;
/*!40000 ALTER TABLE `employe_departement` DISABLE KEYS */;
INSERT INTO `employe_departement` VALUES (1,1,7,'2025-10-29',NULL,'2025-10-29 07:47:47','2025-10-29 07:47:47'),(2,12,7,'2026-02-03',NULL,'2026-02-03 13:58:23','2026-02-03 13:58:23'),(5,2,10,NULL,NULL,NULL,NULL),(6,3,10,NULL,NULL,NULL,NULL),(7,4,10,NULL,NULL,NULL,NULL),(8,5,10,NULL,NULL,NULL,NULL),(9,6,10,NULL,NULL,NULL,NULL),(10,7,11,NULL,NULL,NULL,NULL),(11,8,11,NULL,NULL,NULL,NULL),(12,9,11,NULL,NULL,NULL,NULL),(13,10,11,NULL,NULL,NULL,NULL),(14,11,11,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `employe_departement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_histories`
--

DROP TABLE IF EXISTS `employee_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `matricule` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `departement_id` bigint unsigned DEFAULT NULL,
  `departement_nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employe_id` bigint unsigned NOT NULL,
  `date_début` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `action` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_histories_departement_id_index` (`departement_id`),
  KEY `employee_histories_employe_id_index` (`employe_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_histories`
--

LOCK TABLES `employee_histories` WRITE;
/*!40000 ALTER TABLE `employee_histories` DISABLE KEYS */;
INSERT INTO `employee_histories` VALUES (1,'362','Idrissi','Fatima',7,'Test',1,'2025-10-29',NULL,'nouvelle entrée','2025-10-29 07:47:47','2025-10-29 07:47:47'),(2,'363','Lourini','Hiba',7,'Test',12,'2026-02-03',NULL,'nouvelle entrée','2026-02-03 13:58:23','2026-02-03 13:58:23'),(3,'363','Lourini','Hiba',7,'Test',13,'2026-02-03',NULL,'nouvelle entrée','2026-02-03 13:58:25','2026-02-03 13:58:25'),(4,'363','Lourini','Hiba',7,'Test',14,'2026-02-03',NULL,'nouvelle entrée','2026-02-03 13:58:26','2026-02-03 13:58:26');
/*!40000 ALTER TABLE `employee_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employes`
--

DROP TABLE IF EXISTS `employes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `matricule` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `num_badge` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prenom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lieu_naiss` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_naiss` date DEFAULT NULL,
  `cin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnss` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexe` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `situation_fm` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nb_enfants` int DEFAULT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ville` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pays` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_postal` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tel` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fonction` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationalite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `niveau` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `echelon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categorie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coeficients` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imputation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_entree` date DEFAULT NULL,
  `date_embauche` date DEFAULT NULL,
  `date_sortie` date DEFAULT NULL,
  `salaire_base` decimal(10,2) DEFAULT NULL,
  `remarque` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `url_img` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `centreCout` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departement_id` int DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `delivree_par` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `carte_sejour` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motif_depart` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dernier_jour_travaille` date DEFAULT NULL,
  `notification_rupture` date DEFAULT NULL,
  `engagement_procedure` date DEFAULT NULL,
  `signature_rupture_conventionnelle` date DEFAULT NULL,
  `transaction_en_cours` tinyint(1) DEFAULT NULL,
  `bulletin_modele` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaire_moyen` decimal(10,2) DEFAULT NULL,
  `salaire_reference_annuel` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employes`
--

LOCK TABLES `employes` WRITE;
/*!40000 ALTER TABLE `employes` DISABLE KEYS */;
INSERT INTO `employes` VALUES (1,'362','12','Idrissi','Fatima',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,'0678987653',NULL,'fatima.idrissi@outlook.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,7,1,'2025-10-29 07:47:47','2025-10-29 07:47:47',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'bulletin modèle',NULL,NULL),(2,'M-UKDTY','2846','Nom0-Département IT','[CNSS] Prenom0',NULL,'1993-02-03','PBQFWSXN','642274088','Homme','Célibataire',0,'Adresse Test 0',NULL,NULL,NULL,'0674366593',NULL,'empeOTYX@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-02-03',NULL,13626.00,NULL,NULL,NULL,10,1,'2026-02-03 13:53:01','2026-02-03 13:53:01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'M-LCFJ6','9139','Nom1-Département IT','[CNSS] Prenom1',NULL,'1991-02-03','R2Q7QGGO','371681730','Homme','Célibataire',0,'Adresse Test 1',NULL,NULL,NULL,'0648169530',NULL,'emp9Oe6B@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2023-02-03',NULL,10599.00,NULL,NULL,NULL,10,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'M-Y5HMJ','5847','Nom2-Département IT','[CNSS] Prenom2',NULL,'1988-02-03','MRCGDUSE','111308855','Homme','Célibataire',0,'Adresse Test 2',NULL,NULL,NULL,'0637180942',NULL,'empbDpMO@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2023-02-03',NULL,12857.00,NULL,NULL,NULL,10,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'M-PBXEV','7226','Nom3-Département IT','[NON-CNSS] Prenom3',NULL,'1996-02-03','LOUE1QNZ',NULL,'Homme','Célibataire',0,'Adresse Test 3',NULL,NULL,NULL,'0671410414',NULL,'empKWN6f@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2022-02-03',NULL,6462.00,NULL,NULL,NULL,10,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'M-4IFSM','4114','Nom4-Département IT','[NON-CNSS] Prenom4',NULL,'1986-02-03','VRRKI6MM',NULL,'Homme','Célibataire',0,'Adresse Test 4',NULL,NULL,NULL,'0665121814',NULL,'emplRIiV@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2022-02-03',NULL,7014.00,NULL,NULL,NULL,10,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,'M-42EUQ','1576','Nom0-Ressources Humaines','[CNSS] Prenom0',NULL,'1986-02-03','BLKQWPER','295828564','Homme','Célibataire',0,'Adresse Test 0',NULL,NULL,NULL,'0638753997',NULL,'emplG4C8@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2022-02-03',NULL,8911.00,NULL,NULL,NULL,11,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,'M-T5EZ3','407','Nom1-Ressources Humaines','[CNSS] Prenom1',NULL,'1993-02-03','GX6A9KZD','477686953','Homme','Célibataire',0,'Adresse Test 1',NULL,NULL,NULL,'0624646961',NULL,'emprhXgN@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2022-02-03',NULL,12351.00,NULL,NULL,NULL,11,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,'M-XVVUN','5007','Nom2-Ressources Humaines','[CNSS] Prenom2',NULL,'1988-02-03','XSWOWULQ','331731754','Homme','Célibataire',0,'Adresse Test 2',NULL,NULL,NULL,'0698074423',NULL,'emptyWeo@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2024-02-03',NULL,9628.00,NULL,NULL,NULL,11,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,'M-SM5JK','7784','Nom3-Ressources Humaines','[NON-CNSS] Prenom3',NULL,'1994-02-03','NCMMPZHF',NULL,'Homme','Célibataire',0,'Adresse Test 3',NULL,NULL,NULL,'0690203368',NULL,'empKil8p@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2022-02-03',NULL,9129.00,NULL,NULL,NULL,11,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,'M-JBRLI','9141','Nom4-Ressources Humaines','[NON-CNSS] Prenom4',NULL,'2004-02-03','3GN8MMMI',NULL,'Homme','Célibataire',0,'Adresse Test 4',NULL,NULL,NULL,'0657074259',NULL,'empZ2Ozt@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2021-02-03',NULL,11112.00,NULL,NULL,NULL,11,1,'2026-02-03 13:53:02','2026-02-03 13:53:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,'363','13','Lourini','Hiba','casablanca','2010-11-25',NULL,NULL,'female','single',0,NULL,NULL,NULL,NULL,'0605478549',NULL,'lourini_hiba@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,7,1,'2026-02-03 13:58:22','2026-02-03 13:58:22',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `employes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encaissements`
--

DROP TABLE IF EXISTS `encaissements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encaissements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `referencee` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_encaissement` date NOT NULL,
  `montant_total` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `comptes_id` bigint unsigned NOT NULL,
  `type_encaissement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `encaissements_comptes_id_foreign` (`comptes_id`),
  CONSTRAINT `encaissements_comptes_id_foreign` FOREIGN KEY (`comptes_id`) REFERENCES `comptes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encaissements`
--

LOCK TABLES `encaissements` WRITE;
/*!40000 ALTER TABLE `encaissements` DISABLE KEYS */;
/*!40000 ALTER TABLE `encaissements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrer_comptes`
--

DROP TABLE IF EXISTS `entrer_comptes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrer_comptes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint unsigned NOT NULL,
  `numero_cheque` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `datee` date NOT NULL,
  `mode_de_paiement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarque` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entrer_comptes_client_id_foreign` (`client_id`),
  CONSTRAINT `entrer_comptes_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrer_comptes`
--

LOCK TABLES `entrer_comptes` WRITE;
/*!40000 ALTER TABLE `entrer_comptes` DISABLE KEYS */;
/*!40000 ALTER TABLE `entrer_comptes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etat_recouvrements`
--

DROP TABLE IF EXISTS `etat_recouvrements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etat_recouvrements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint unsigned NOT NULL,
  `id_facture` bigint unsigned NOT NULL,
  `entrer_comptes_id` bigint unsigned NOT NULL,
  `reste` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etat_recouvrements_client_id_foreign` (`client_id`),
  KEY `etat_recouvrements_id_facture_foreign` (`id_facture`),
  KEY `etat_recouvrements_entrer_comptes_id_foreign` (`entrer_comptes_id`),
  CONSTRAINT `etat_recouvrements_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `etat_recouvrements_entrer_comptes_id_foreign` FOREIGN KEY (`entrer_comptes_id`) REFERENCES `entrer_comptes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `etat_recouvrements_id_facture_foreign` FOREIGN KEY (`id_facture`) REFERENCES `factures` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etat_recouvrements`
--

LOCK TABLES `etat_recouvrements` WRITE;
/*!40000 ALTER TABLE `etat_recouvrements` DISABLE KEYS */;
/*!40000 ALTER TABLE `etat_recouvrements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `factures`
--

DROP TABLE IF EXISTS `factures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `ref_BL` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_BC` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modePaiement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_ttc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` bigint unsigned NOT NULL,
  `id_devis` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `factures_client_id_foreign` (`client_id`),
  KEY `factures_id_devis_foreign` (`id_devis`),
  KEY `factures_user_id_foreign` (`user_id`),
  CONSTRAINT `factures_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `factures_id_devis_foreign` FOREIGN KEY (`id_devis`) REFERENCES `devis` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `factures_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `factures`
--

LOCK TABLES `factures` WRITE;
/*!40000 ALTER TABLE `factures` DISABLE KEYS */;
/*!40000 ALTER TABLE `factures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fournisseurs`
--

DROP TABLE IF EXISTS `fournisseurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fournisseurs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `CodeFournisseur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `raison_sociale` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tele` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ville` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abreviation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_postal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ice` bigint NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fournisseurs_codefournisseur_unique` (`CodeFournisseur`),
  KEY `fournisseurs_user_id_foreign` (`user_id`),
  CONSTRAINT `fournisseurs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fournisseurs`
--

LOCK TABLES `fournisseurs` WRITE;
/*!40000 ALTER TABLE `fournisseurs` DISABLE KEYS */;
/*!40000 ALTER TABLE `fournisseurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_agences`
--

DROP TABLE IF EXISTS `gp_agences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_agences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `banque_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_agences_banque_id_foreign` (`banque_id`),
  CONSTRAINT `gp_agences_banque_id_foreign` FOREIGN KEY (`banque_id`) REFERENCES `gp_banques` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_agences`
--

LOCK TABLES `gp_agences` WRITE;
/*!40000 ALTER TABLE `gp_agences` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_agences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_banques`
--

DROP TABLE IF EXISTS `gp_banques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_banques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_banques`
--

LOCK TABLES `gp_banques` WRITE;
/*!40000 ALTER TABLE `gp_banques` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_banques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_bon_sortie`
--

DROP TABLE IF EXISTS `gp_bon_sortie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_bon_sortie` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_sortie` date DEFAULT NULL,
  `heure_sortie` time DEFAULT NULL,
  `duree_estimee` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motif_sortie` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `responsable_nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsable_poste` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_autorisation` date DEFAULT NULL,
  `heure_retour` time DEFAULT NULL,
  `date_retour` date DEFAULT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_bon_sortie_employee_id_foreign` (`employee_id`),
  CONSTRAINT `gp_bon_sortie_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_bon_sortie`
--

LOCK TABLES `gp_bon_sortie` WRITE;
/*!40000 ALTER TABLE `gp_bon_sortie` DISABLE KEYS */;
INSERT INTO `gp_bon_sortie` VALUES (1,'2025-11-03','09:00:00','24.00','maladie','responsable',NULL,NULL,'09:00:00','2025-11-04',1,'2025-11-02 19:49:39','2025-11-02 19:49:39');
/*!40000 ALTER TABLE `gp_bon_sortie` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_bultin_model_constante`
--

DROP TABLE IF EXISTS `gp_bultin_model_constante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_bultin_model_constante` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bultin_model_id` bigint unsigned NOT NULL,
  `constante_id` bigint unsigned NOT NULL,
  `ordre` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_bultin_model_constante_bultin_model_id_foreign` (`bultin_model_id`),
  KEY `gp_bultin_model_constante_constante_id_foreign` (`constante_id`),
  CONSTRAINT `gp_bultin_model_constante_bultin_model_id_foreign` FOREIGN KEY (`bultin_model_id`) REFERENCES `gp_bultin_models` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `gp_bultin_model_constante_constante_id_foreign` FOREIGN KEY (`constante_id`) REFERENCES `constantes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_bultin_model_constante`
--

LOCK TABLES `gp_bultin_model_constante` WRITE;
/*!40000 ALTER TABLE `gp_bultin_model_constante` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_bultin_model_constante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_bultin_model_rubrique`
--

DROP TABLE IF EXISTS `gp_bultin_model_rubrique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_bultin_model_rubrique` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bultin_model_id` bigint unsigned NOT NULL,
  `rubrique_id` bigint unsigned NOT NULL,
  `ordre` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_bultin_model_rubrique_bultin_model_id_foreign` (`bultin_model_id`),
  KEY `gp_bultin_model_rubrique_rubrique_id_foreign` (`rubrique_id`),
  CONSTRAINT `gp_bultin_model_rubrique_bultin_model_id_foreign` FOREIGN KEY (`bultin_model_id`) REFERENCES `gp_bultin_models` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `gp_bultin_model_rubrique_rubrique_id_foreign` FOREIGN KEY (`rubrique_id`) REFERENCES `rubriques` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_bultin_model_rubrique`
--

LOCK TABLES `gp_bultin_model_rubrique` WRITE;
/*!40000 ALTER TABLE `gp_bultin_model_rubrique` DISABLE KEYS */;
INSERT INTO `gp_bultin_model_rubrique` VALUES (4,1,1,2,NULL,'2025-11-05 08:28:57');
/*!40000 ALTER TABLE `gp_bultin_model_rubrique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_bultin_models`
--

DROP TABLE IF EXISTS `gp_bultin_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_bultin_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `theme_bultin_model_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_bultin_models_theme_bultin_model_id_foreign` (`theme_bultin_model_id`),
  CONSTRAINT `gp_bultin_models_theme_bultin_model_id_foreign` FOREIGN KEY (`theme_bultin_model_id`) REFERENCES `gp_theme_bultin_model` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_bultin_models`
--

LOCK TABLES `gp_bultin_models` WRITE;
/*!40000 ALTER TABLE `gp_bultin_models` DISABLE KEYS */;
INSERT INTO `gp_bultin_models` VALUES (1,'bulletin modèle',1,'2025-10-29 07:59:50','2025-10-29 07:59:50');
/*!40000 ALTER TABLE `gp_bultin_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_calendriers_employes`
--

DROP TABLE IF EXISTS `gp_calendriers_employes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_calendriers_employes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `calendrier_id` bigint unsigned NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_calendriers_employes_employe_id_foreign` (`employe_id`),
  KEY `gp_calendriers_employes_calendrier_id_foreign` (`calendrier_id`),
  CONSTRAINT `gp_calendriers_employes_calendrier_id_foreign` FOREIGN KEY (`calendrier_id`) REFERENCES `calendries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gp_calendriers_employes_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_calendriers_employes`
--

LOCK TABLES `gp_calendriers_employes` WRITE;
/*!40000 ALTER TABLE `gp_calendriers_employes` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_calendriers_employes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_communes`
--

DROP TABLE IF EXISTS `gp_communes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_communes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ville_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_communes_ville_id_foreign` (`ville_id`),
  CONSTRAINT `gp_communes_ville_id_foreign` FOREIGN KEY (`ville_id`) REFERENCES `gp_villes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_communes`
--

LOCK TABLES `gp_communes` WRITE;
/*!40000 ALTER TABLE `gp_communes` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_communes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_comptes_bancaires`
--

DROP TABLE IF EXISTS `gp_comptes_bancaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_comptes_bancaires` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `agence_id` bigint unsigned DEFAULT NULL,
  `rib` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iban` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_comptes_bancaires_employe_id_foreign` (`employe_id`),
  KEY `gp_comptes_bancaires_agence_id_foreign` (`agence_id`),
  CONSTRAINT `gp_comptes_bancaires_agence_id_foreign` FOREIGN KEY (`agence_id`) REFERENCES `gp_agences` (`id`) ON DELETE SET NULL,
  CONSTRAINT `gp_comptes_bancaires_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_comptes_bancaires`
--

LOCK TABLES `gp_comptes_bancaires` WRITE;
/*!40000 ALTER TABLE `gp_comptes_bancaires` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_comptes_bancaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_conges`
--

DROP TABLE IF EXISTS `gp_conges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_conges` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `jours_cumules` decimal(5,2) NOT NULL DEFAULT '0.00',
  `jours_consomes` decimal(5,2) NOT NULL DEFAULT '0.00',
  `solde_actuel` decimal(5,2) NOT NULL DEFAULT '0.00',
  `last_update` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_conges_employe_id_foreign` (`employe_id`),
  CONSTRAINT `gp_conges_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_conges`
--

LOCK TABLES `gp_conges` WRITE;
/*!40000 ALTER TABLE `gp_conges` DISABLE KEYS */;
INSERT INTO `gp_conges` VALUES (1,2,18.00,0.00,18.00,'2026-02-03','2026-02-03 13:53:01','2026-02-03 13:53:01'),(2,3,54.00,0.00,54.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(3,4,54.00,0.00,54.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(4,5,72.00,0.00,72.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(5,6,72.00,0.00,72.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(6,7,72.00,0.00,72.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(7,8,72.00,0.00,72.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(8,9,36.00,0.00,36.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(9,10,72.00,0.00,72.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02'),(10,11,90.00,0.00,90.00,'2026-02-03','2026-02-03 13:53:02','2026-02-03 13:53:02');
/*!40000 ALTER TABLE `gp_conges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_demandes_conges`
--

DROP TABLE IF EXISTS `gp_demandes_conges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_demandes_conges` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `type_conge` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `nombre_jours` int DEFAULT NULL,
  `motif` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `piece_jointe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_attente','approuve','rejete') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_demandes_conges_employe_id_foreign` (`employe_id`),
  CONSTRAINT `gp_demandes_conges_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_demandes_conges`
--

LOCK TABLES `gp_demandes_conges` WRITE;
/*!40000 ALTER TABLE `gp_demandes_conges` DISABLE KEYS */;
INSERT INTO `gp_demandes_conges` VALUES (1,1,'maladie','2025-11-03','2025-11-05',3,'sd',NULL,'en_attente','2025-11-02 15:36:33','2025-11-02 15:36:33');
/*!40000 ALTER TABLE `gp_demandes_conges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_employe_bulletins`
--

DROP TABLE IF EXISTS `gp_employe_bulletins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_employe_bulletins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `bulletin_modele_id` bigint unsigned NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_employe_bulletins_employe_id_foreign` (`employe_id`),
  KEY `gp_employe_bulletins_bulletin_modele_id_foreign` (`bulletin_modele_id`),
  CONSTRAINT `gp_employe_bulletins_bulletin_modele_id_foreign` FOREIGN KEY (`bulletin_modele_id`) REFERENCES `gp_bultin_models` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gp_employe_bulletins_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_employe_bulletins`
--

LOCK TABLES `gp_employe_bulletins` WRITE;
/*!40000 ALTER TABLE `gp_employe_bulletins` DISABLE KEYS */;
INSERT INTO `gp_employe_bulletins` VALUES (1,1,1,'2025-06-24','2026-06-24',NULL,NULL);
/*!40000 ALTER TABLE `gp_employe_bulletins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_group_paie`
--

DROP TABLE IF EXISTS `gp_group_paie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_group_paie` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_group_paie`
--

LOCK TABLES `gp_group_paie` WRITE;
/*!40000 ALTER TABLE `gp_group_paie` DISABLE KEYS */;
INSERT INTO `gp_group_paie` VALUES (1,'groupe1','2025-10-29 13:17:44','2025-10-29 13:17:44');
/*!40000 ALTER TABLE `gp_group_paie` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_paie_rubrique`
--

DROP TABLE IF EXISTS `gp_paie_rubrique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_paie_rubrique` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_paie_id` bigint unsigned NOT NULL,
  `rubrique_id` bigint unsigned NOT NULL,
  `ordre` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_paie_rubrique_group_paie_id_foreign` (`group_paie_id`),
  KEY `gp_paie_rubrique_rubrique_id_foreign` (`rubrique_id`),
  CONSTRAINT `gp_paie_rubrique_group_paie_id_foreign` FOREIGN KEY (`group_paie_id`) REFERENCES `gp_group_paie` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `gp_paie_rubrique_rubrique_id_foreign` FOREIGN KEY (`rubrique_id`) REFERENCES `rubriques` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_paie_rubrique`
--

LOCK TABLES `gp_paie_rubrique` WRITE;
/*!40000 ALTER TABLE `gp_paie_rubrique` DISABLE KEYS */;
INSERT INTO `gp_paie_rubrique` VALUES (1,1,1,1,'2025-11-03 15:28:39','2025-11-03 15:28:39');
/*!40000 ALTER TABLE `gp_paie_rubrique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_pays`
--

DROP TABLE IF EXISTS `gp_pays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_pays` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_pays` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_pays`
--

LOCK TABLES `gp_pays` WRITE;
/*!40000 ALTER TABLE `gp_pays` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_pays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_postes`
--

DROP TABLE IF EXISTS `gp_postes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_postes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unite_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_postes_unite_id_foreign` (`unite_id`),
  CONSTRAINT `gp_postes_unite_id_foreign` FOREIGN KEY (`unite_id`) REFERENCES `gp_unites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_postes`
--

LOCK TABLES `gp_postes` WRITE;
/*!40000 ALTER TABLE `gp_postes` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_postes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_regle_employe`
--

DROP TABLE IF EXISTS `gp_regle_employe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_regle_employe` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employe_id` bigint unsigned NOT NULL,
  `regle_id` bigint unsigned NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_regle_employe_regle_id_foreign` (`regle_id`),
  KEY `gp_regle_employe_employe_id_regle_id_index` (`employe_id`,`regle_id`),
  CONSTRAINT `gp_regle_employe_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gp_regle_employe_regle_id_foreign` FOREIGN KEY (`regle_id`) REFERENCES `regle_compensation` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_regle_employe`
--

LOCK TABLES `gp_regle_employe` WRITE;
/*!40000 ALTER TABLE `gp_regle_employe` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_regle_employe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_services`
--

DROP TABLE IF EXISTS `gp_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_services` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `departement_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_services_departement_id_foreign` (`departement_id`),
  CONSTRAINT `gp_services_departement_id_foreign` FOREIGN KEY (`departement_id`) REFERENCES `departements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_services`
--

LOCK TABLES `gp_services` WRITE;
/*!40000 ALTER TABLE `gp_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_societes`
--

DROP TABLE IF EXISTS `gp_societes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_societes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `RaisonSocial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ICE` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NumeroCNSS` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NumeroFiscale` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `RegistreCommercial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `AdresseSociete` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_societes`
--

LOCK TABLES `gp_societes` WRITE;
/*!40000 ALTER TABLE `gp_societes` DISABLE KEYS */;
INSERT INTO `gp_societes` VALUES (1,'36','32158','36','2132','98','TANGER','2025-10-28 13:42:22','2025-10-28 13:42:22');
/*!40000 ALTER TABLE `gp_societes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_theme_bultin_model`
--

DROP TABLE IF EXISTS `gp_theme_bultin_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_theme_bultin_model` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `theme_par_defaut` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_theme_bultin_model`
--

LOCK TABLES `gp_theme_bultin_model` WRITE;
/*!40000 ALTER TABLE `gp_theme_bultin_model` DISABLE KEYS */;
INSERT INTO `gp_theme_bultin_model` VALUES (1,'Theme1','themes/v6igBqdY8yTcDSqYQNaA6Vs1SsvH5gPuRhGNYQvT.jpg',1,'2025-10-29 07:44:46','2025-10-29 07:44:50');
/*!40000 ALTER TABLE `gp_theme_bultin_model` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_unites`
--

DROP TABLE IF EXISTS `gp_unites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_unites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_unites_service_id_foreign` (`service_id`),
  CONSTRAINT `gp_unites_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `gp_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_unites`
--

LOCK TABLES `gp_unites` WRITE;
/*!40000 ALTER TABLE `gp_unites` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_unites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gp_villes`
--

DROP TABLE IF EXISTS `gp_villes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gp_villes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pays_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gp_villes_pays_id_foreign` (`pays_id`),
  CONSTRAINT `gp_villes_pays_id_foreign` FOREIGN KEY (`pays_id`) REFERENCES `gp_pays` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gp_villes`
--

LOCK TABLES `gp_villes` WRITE;
/*!40000 ALTER TABLE `gp_villes` DISABLE KEYS */;
/*!40000 ALTER TABLE `gp_villes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_constantes`
--

DROP TABLE IF EXISTS `group_constantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_constantes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_constantes_parent_id_foreign` (`parent_id`),
  CONSTRAINT `group_constantes_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `group_constantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_constantes`
--

LOCK TABLES `group_constantes` WRITE;
/*!40000 ALTER TABLE `group_constantes` DISABLE KEYS */;
INSERT INTO `group_constantes` VALUES (1,'constante 1',NULL,'2025-10-29 13:07:31','2025-11-03 14:27:16');
/*!40000 ALTER TABLE `group_constantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_motif_absences`
--

DROP TABLE IF EXISTS `group_motif_absences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_motif_absences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_motif_absences`
--

LOCK TABLES `group_motif_absences` WRITE;
/*!40000 ALTER TABLE `group_motif_absences` DISABLE KEYS */;
INSERT INTO `group_motif_absences` VALUES (1,'absence 1','2025-10-28 13:56:11','2025-11-03 14:46:54');
/*!40000 ALTER TABLE `group_motif_absences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_rubriques`
--

DROP TABLE IF EXISTS `group_rubriques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_rubriques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_rubriques`
--

LOCK TABLES `group_rubriques` WRITE;
/*!40000 ALTER TABLE `group_rubriques` DISABLE KEYS */;
INSERT INTO `group_rubriques` VALUES (1,'rubrique','2025-10-31 12:43:55','2025-10-31 12:43:55');
/*!40000 ALTER TABLE `group_rubriques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groupe_arrondi`
--

DROP TABLE IF EXISTS `groupe_arrondi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groupe_arrondi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HT` tinyint(1) NOT NULL DEFAULT '0',
  `HN` tinyint(1) NOT NULL DEFAULT '0',
  `PR` tinyint(1) NOT NULL DEFAULT '0',
  `HS_0` tinyint(1) NOT NULL DEFAULT '0',
  `HS_25` tinyint(1) NOT NULL DEFAULT '0',
  `HS_50` tinyint(1) NOT NULL DEFAULT '0',
  `HS_100` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groupe_arrondi`
--

LOCK TABLES `groupe_arrondi` WRITE;
/*!40000 ALTER TABLE `groupe_arrondi` DISABLE KEYS */;
INSERT INTO `groupe_arrondi` VALUES (1,'arrondi',0,1,0,0,1,0,0,'2025-10-30 09:20:55','2025-10-30 09:20:55');
/*!40000 ALTER TABLE `groupe_arrondi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groupe_clients`
--

DROP TABLE IF EXISTS `groupe_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groupe_clients` (
  `Id_groupe` bigint unsigned NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`Id_groupe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groupe_clients`
--

LOCK TABLES `groupe_clients` WRITE;
/*!40000 ALTER TABLE `groupe_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `groupe_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groupe_horaires`
--

DROP TABLE IF EXISTS `groupe_horaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groupe_horaires` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('fixe','automatique','flexible ouvrable') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abreviation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `couleur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groupe_horaires`
--

LOCK TABLES `groupe_horaires` WRITE;
/*!40000 ALTER TABLE `groupe_horaires` DISABLE KEYS */;
INSERT INTO `groupe_horaires` VALUES (1,'Horaire','fixe','HR','#9d3f3f','2025-10-29 07:51:04','2025-10-29 07:51:04');
/*!40000 ALTER TABLE `groupe_horaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `heures_travail`
--

DROP TABLE IF EXISTS `heures_travail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heures_travail` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `heures_normales` tinyint(1) NOT NULL DEFAULT '0',
  `ferie_paye` tinyint(1) NOT NULL DEFAULT '0',
  `absence_paye` tinyint(1) NOT NULL DEFAULT '0',
  `absence` tinyint(1) NOT NULL DEFAULT '0',
  `heures_sup_0` tinyint(1) NOT NULL DEFAULT '0',
  `heures_sup_25` tinyint(1) NOT NULL DEFAULT '0',
  `heures_sup_50` tinyint(1) NOT NULL DEFAULT '0',
  `heures_sup_100` tinyint(1) NOT NULL DEFAULT '0',
  `commentaire` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `heures_travail`
--

LOCK TABLES `heures_travail` WRITE;
/*!40000 ALTER TABLE `heures_travail` DISABLE KEYS */;
/*!40000 ALTER TABLE `heures_travail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horaire_exceptionnels`
--

DROP TABLE IF EXISTS `horaire_exceptionnels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horaire_exceptionnels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `horaire_id` bigint unsigned DEFAULT NULL,
  `horaire_periodique_id` bigint unsigned DEFAULT NULL,
  `jour_debut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `horaire_exceptionnels_employee_id_foreign` (`employee_id`),
  KEY `horaire_exceptionnels_horaire_id_foreign` (`horaire_id`),
  KEY `horaire_exceptionnels_horaire_periodique_id_foreign` (`horaire_periodique_id`),
  CONSTRAINT `horaire_exceptionnels_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `horaire_exceptionnels_horaire_id_foreign` FOREIGN KEY (`horaire_id`) REFERENCES `groupe_horaires` (`id`) ON DELETE CASCADE,
  CONSTRAINT `horaire_exceptionnels_horaire_periodique_id_foreign` FOREIGN KEY (`horaire_periodique_id`) REFERENCES `horaire_periodiques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horaire_exceptionnels`
--

LOCK TABLES `horaire_exceptionnels` WRITE;
/*!40000 ALTER TABLE `horaire_exceptionnels` DISABLE KEYS */;
INSERT INTO `horaire_exceptionnels` VALUES (1,1,'2025-10-01','2025-10-15',1,2,'Jeudi','2025-10-30 09:22:03','2025-10-30 09:22:03');
/*!40000 ALTER TABLE `horaire_exceptionnels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horaire_periodiques`
--

DROP TABLE IF EXISTS `horaire_periodiques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horaire_periodiques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `periode` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horaire_periodiques`
--

LOCK TABLES `horaire_periodiques` WRITE;
/*!40000 ALTER TABLE `horaire_periodiques` DISABLE KEYS */;
INSERT INTO `horaire_periodiques` VALUES (2,'Horaire périodique',5,'2025-10-29 07:55:41','2025-10-29 07:55:41');
/*!40000 ALTER TABLE `horaire_periodiques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horaires`
--

DROP TABLE IF EXISTS `horaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horaires` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `typePlageHoraire` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'obligatoire',
  `tauxPlageHoraire` int NOT NULL DEFAULT '0',
  `tauxType` enum('heure','jours') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'heure',
  `entreeDe` time NOT NULL DEFAULT '00:00:00',
  `entreeA` time NOT NULL DEFAULT '00:00:00',
  `penaliteEntree` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reposDe` time NOT NULL DEFAULT '00:00:00',
  `reposA` time NOT NULL DEFAULT '00:00:00',
  `deduireRepos` enum('Deduit','NonDeduit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dureeRepos` time NOT NULL DEFAULT '00:00:00',
  `sortieDe` time NOT NULL DEFAULT '00:00:00',
  `sortieA` time NOT NULL DEFAULT '00:00:00',
  `pointageAutomatique` tinyint(1) NOT NULL DEFAULT '0',
  `penaliteSortie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cumul` int NOT NULL DEFAULT '0',
  `jourTravaille` int NOT NULL DEFAULT '0',
  `couleur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#000000',
  `groupe_horaire_id` int DEFAULT NULL,
  `heureDebut` time DEFAULT NULL,
  `heureFin` time DEFAULT NULL,
  `horaireJournalier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `typeHoraire` int DEFAULT NULL,
  `veille` tinyint(1) NOT NULL DEFAULT '0',
  `jourPlus1` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horaires`
--

LOCK TABLES `horaires` WRITE;
/*!40000 ALTER TABLE `horaires` DISABLE KEYS */;
INSERT INTO `horaires` VALUES (1,'obligatoire',12,'heure','08:00:00','17:00:00','Faible','13:00:00','14:00:00','NonDeduit','01:00:00','14:00:00','00:00:00',0,NULL,0,0,'#fdf2cb',1,NULL,NULL,NULL,NULL,0,0,'2025-10-29 07:52:00','2025-10-29 07:52:00');
/*!40000 ALTER TABLE `horaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imprimables`
--

DROP TABLE IF EXISTS `imprimables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imprimables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imprimables`
--

LOCK TABLES `imprimables` WRITE;
/*!40000 ALTER TABLE `imprimables` DISABLE KEYS */;
/*!40000 ALTER TABLE `imprimables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jour_feries`
--

DROP TABLE IF EXISTS `jour_feries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jour_feries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('paye','non_paye') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duree` time DEFAULT NULL,
  `taux` decimal(8,2) DEFAULT NULL,
  `categorie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fix` tinyint(1) NOT NULL DEFAULT '0',
  `fix_day` int DEFAULT NULL,
  `fix_month` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jour_feries`
--

LOCK TABLES `jour_feries` WRITE;
/*!40000 ALTER TABLE `jour_feries` DISABLE KEYS */;
INSERT INTO `jour_feries` VALUES (1,'2025-11-15','jour férié','non_paye','23:00:00',6.00,'categorie',0,NULL,NULL,'2025-10-29 07:50:09','2025-10-31 10:23:07');
/*!40000 ALTER TABLE `jour_feries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligne__bon__entres`
--

DROP TABLE IF EXISTS `ligne__bon__entres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligne__bon__entres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `id_bon_Entre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `N_lot` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligne__bon__entres_produit_id_foreign` (`produit_id`),
  CONSTRAINT `ligne__bon__entres_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligne__bon__entres`
--

LOCK TABLES `ligne__bon__entres` WRITE;
/*!40000 ALTER TABLE `ligne__bon__entres` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligne__bon__entres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligne__bon__sourties`
--

DROP TABLE IF EXISTS `ligne__bon__sourties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligne__bon__sourties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `id_bon_Sourtie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `N_lot` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligne__bon__sourties_produit_id_foreign` (`produit_id`),
  CONSTRAINT `ligne__bon__sourties_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligne__bon__sourties`
--

LOCK TABLES `ligne__bon__sourties` WRITE;
/*!40000 ALTER TABLE `ligne__bon__sourties` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligne__bon__sourties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligne_commandes`
--

DROP TABLE IF EXISTS `ligne_commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligne_commandes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `commande_id` bigint unsigned NOT NULL,
  `produit_id` bigint unsigned NOT NULL,
  `quantite` bigint unsigned NOT NULL,
  `prix_unitaire` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligne_commandes_commande_id_foreign` (`commande_id`),
  KEY `ligne_commandes_produit_id_foreign` (`produit_id`),
  CONSTRAINT `ligne_commandes_commande_id_foreign` FOREIGN KEY (`commande_id`) REFERENCES `commandes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ligne_commandes_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligne_commandes`
--

LOCK TABLES `ligne_commandes` WRITE;
/*!40000 ALTER TABLE `ligne_commandes` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligne_commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligne_devis`
--

DROP TABLE IF EXISTS `ligne_devis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligne_devis` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `quantite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prix_vente` decimal(8,2) DEFAULT NULL,
  `id_devis` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligne_devis_produit_id_foreign` (`produit_id`),
  KEY `ligne_devis_id_devis_foreign` (`id_devis`),
  CONSTRAINT `ligne_devis_id_devis_foreign` FOREIGN KEY (`id_devis`) REFERENCES `devis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ligne_devis_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligne_devis`
--

LOCK TABLES `ligne_devis` WRITE;
/*!40000 ALTER TABLE `ligne_devis` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligne_devis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligne_factures`
--

DROP TABLE IF EXISTS `ligne_factures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligne_factures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `quantite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prix_vente` decimal(8,2) DEFAULT NULL,
  `id_facture` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligne_factures_produit_id_foreign` (`produit_id`),
  KEY `ligne_factures_id_facture_foreign` (`id_facture`),
  CONSTRAINT `ligne_factures_id_facture_foreign` FOREIGN KEY (`id_facture`) REFERENCES `factures` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ligne_factures_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligne_factures`
--

LOCK TABLES `ligne_factures` WRITE;
/*!40000 ALTER TABLE `ligne_factures` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligne_factures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligne_livraisons`
--

DROP TABLE IF EXISTS `ligne_livraisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligne_livraisons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `quantite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prix_vente` decimal(8,2) DEFAULT NULL,
  `id_ligne_livraisons` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligne_livraisons_produit_id_foreign` (`produit_id`),
  KEY `ligne_livraisons_id_ligne_livraisons_foreign` (`id_ligne_livraisons`),
  CONSTRAINT `ligne_livraisons_id_ligne_livraisons_foreign` FOREIGN KEY (`id_ligne_livraisons`) REFERENCES `ligne_livraisons` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ligne_livraisons_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligne_livraisons`
--

LOCK TABLES `ligne_livraisons` WRITE;
/*!40000 ALTER TABLE `ligne_livraisons` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligne_livraisons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligne_preparation_commandes`
--

DROP TABLE IF EXISTS `ligne_preparation_commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligne_preparation_commandes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `preparation_id` bigint unsigned NOT NULL,
  `produit_id` bigint unsigned NOT NULL,
  `quantite` bigint unsigned NOT NULL,
  `prix_unitaire` bigint unsigned NOT NULL,
  `lot` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligne_preparation_commandes_preparation_id_foreign` (`preparation_id`),
  KEY `ligne_preparation_commandes_produit_id_foreign` (`produit_id`),
  CONSTRAINT `ligne_preparation_commandes_preparation_id_foreign` FOREIGN KEY (`preparation_id`) REFERENCES `preparation_commandes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ligne_preparation_commandes_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligne_preparation_commandes`
--

LOCK TABLES `ligne_preparation_commandes` WRITE;
/*!40000 ALTER TABLE `ligne_preparation_commandes` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligne_preparation_commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligneencaissements`
--

DROP TABLE IF EXISTS `ligneencaissements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligneencaissements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entrer_comptes_id` bigint unsigned NOT NULL,
  `encaissements_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligneencaissements_entrer_comptes_id_foreign` (`entrer_comptes_id`),
  KEY `ligneencaissements_encaissements_id_foreign` (`encaissements_id`),
  CONSTRAINT `ligneencaissements_encaissements_id_foreign` FOREIGN KEY (`encaissements_id`) REFERENCES `encaissements` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ligneencaissements_entrer_comptes_id_foreign` FOREIGN KEY (`entrer_comptes_id`) REFERENCES `entrer_comptes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligneencaissements`
--

LOCK TABLES `ligneencaissements` WRITE;
/*!40000 ALTER TABLE `ligneencaissements` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligneencaissements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ligneentrercomptes`
--

DROP TABLE IF EXISTS `ligneentrercomptes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ligneentrercomptes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entrer_comptes_id` bigint unsigned NOT NULL,
  `client_id` bigint unsigned NOT NULL,
  `id_facture` bigint unsigned NOT NULL,
  `avance` decimal(8,2) DEFAULT NULL,
  `restee` decimal(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligneentrercomptes_entrer_comptes_id_foreign` (`entrer_comptes_id`),
  KEY `ligneentrercomptes_client_id_foreign` (`client_id`),
  KEY `ligneentrercomptes_id_facture_foreign` (`id_facture`),
  CONSTRAINT `ligneentrercomptes_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ligneentrercomptes_entrer_comptes_id_foreign` FOREIGN KEY (`entrer_comptes_id`) REFERENCES `entrer_comptes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ligneentrercomptes_id_facture_foreign` FOREIGN KEY (`id_facture`) REFERENCES `factures` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ligneentrercomptes`
--

LOCK TABLES `ligneentrercomptes` WRITE;
/*!40000 ALTER TABLE `ligneentrercomptes` DISABLE KEYS */;
/*!40000 ALTER TABLE `ligneentrercomptes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lignelivraisons`
--

DROP TABLE IF EXISTS `lignelivraisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lignelivraisons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `id_bon_Livraison` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lignelivraisons_produit_id_foreign` (`produit_id`),
  CONSTRAINT `lignelivraisons_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lignelivraisons`
--

LOCK TABLES `lignelivraisons` WRITE;
/*!40000 ALTER TABLE `lignelivraisons` DISABLE KEYS */;
/*!40000 ALTER TABLE `lignelivraisons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livreurs`
--

DROP TABLE IF EXISTS `livreurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livreurs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tele` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `livreurs_cin_unique` (`cin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livreurs`
--

LOCK TABLES `livreurs` WRITE;
/*!40000 ALTER TABLE `livreurs` DISABLE KEYS */;
/*!40000 ALTER TABLE `livreurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memos`
--

DROP TABLE IF EXISTS `memos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memos`
--

LOCK TABLES `memos` WRITE;
/*!40000 ALTER TABLE `memos` DISABLE KEYS */;
INSERT INTO `memos` VALUES (1,'mémo1','2025-10-31 12:45:02','2025-10-31 12:45:02');
/*!40000 ALTER TABLE `memos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memos_constantes`
--

DROP TABLE IF EXISTS `memos_constantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memos_constantes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memos_constantes`
--

LOCK TABLES `memos_constantes` WRITE;
/*!40000 ALTER TABLE `memos_constantes` DISABLE KEYS */;
INSERT INTO `memos_constantes` VALUES (1,'mémo1','2025-10-29 13:08:23','2025-10-29 13:08:23');
/*!40000 ALTER TABLE `memos_constantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2014_10_12_000000_create_users_table',1),(2,'2014_10_12_100000_create_password_reset_tokens_table',1),(3,'2019_08_19_000000_create_failed_jobs_table',1),(4,'2019_12_14_000001_create_personal_access_tokens_table',1),(5,'2024_02_14_090056_create_calibre',1),(6,'2024_02_14_090057_create_categories_table',1),(7,'2024_02_14_095626_create_produits_table',1),(8,'2024_02_14_113433_create_fournisseurs_table',1),(9,'2024_02_14_113443_create_regions_table',1),(10,'2024_02_14_113443_create_zones_table',1),(11,'2024_02_14_113445_create_clients_table',1),(12,'2024_02_14_113446_create_site_clients_table',1),(13,'2024_02_14_113502_create_commandes_table',1),(14,'2024_02_14_113507_create_ligne_commandes_table',1),(15,'2024_02_14_113514_create_status_commandes_table',1),(16,'2024_02_23_082128_create_roles_table',1),(17,'2024_02_23_082131_create_permissions_table',1),(18,'2024_02_23_082133_create_role_user_table',1),(19,'2024_02_23_082136_create_permission_role_table',1),(20,'2024_03_05_213408_create_livreurs_table',1),(21,'2024_03_05_213637_create_vehicules_table',1),(22,'2024_03_05_213654_create_objectifs_table',1),(23,'2024_03_05_213740_create_vehicule_livreurs_table',1),(24,'2024_03_08_072214_create_chiffre_affaires_table',1),(25,'2024_03_08_100736_create_reclamations_table',1),(26,'2024_03_14_095822_create_devis_table',1),(27,'2024_03_14_095823_create_ligne_devis_table',1),(28,'2024_03_14_095841_create_factures_table',1),(29,'2024_03_14_095842_create_entrer_comptes_table',1),(30,'2024_03_14_104358_permis',1),(31,'2024_03_15_095843_create_etat_recouvrements_table',1),(32,'2024_03_19_131551_create_stock_table',1),(33,'2024_03_19_131830_create_chargement_commandes_table',1),(34,'2024_03_19_131851_create_preparation_commandes_table',1),(35,'2024_03_19_131852_create_ligne_preparation_commandes_table',1),(36,'2024_03_20_144734_create_ligne_entrer_comptes_table',1),(37,'2024_04_02_141214_create_comptes_table',1),(38,'2024_04_02_141354_create_encaissements_table',1),(39,'2024_04_02_141425_create_ligneencaissements_table',1),(40,'2024_04_15_182302_create_agents_table',1),(41,'2024_04_16_144055_create_ligne_factures_table',1),(42,'2024_04_16_144124_create_bon__livraisons_table',1),(43,'2024_05_09_113954_create_ligne_livraisons_table',1),(44,'2024_05_20_094215_create_group_rubriques_table',1),(45,'2024_05_27_141912_create_autorisations_table',1),(46,'2024_05_29_095748_create_rubriques_table',1),(47,'2024_06_03_210221_create_vis_table',1),(48,'2024_06_05_142501_create_oeufcasses_table',1),(49,'2024_06_05_142519_create_oeuffini_semifinis_table',1),(50,'2024_07_19_134823_lignelivraisons',1),(51,'2024_08_05_085417_create_stock_magasins_table',1),(52,'2024_08_09_095154_create_stock__productions_table',1),(53,'2024_08_09_104000_create_bon__entres_table',1),(54,'2024_08_09_104011_create_bon__sourties_table',1),(55,'2024_08_09_104054_create_ligne__bon__entres_table',1),(56,'2024_08_09_132241_create_ligne__bon__sourties_table',1),(57,'2024_08_09_145915_create_offres_prix_table',1),(58,'2024_08_09_150030_create_offre_details_table',1),(59,'2024_08_12_095105_create_groupe_clients_table',1),(60,'2024_08_12_111242_client_groupe_client',1),(61,'2024_08_28_085627_create_offre_groupe_table',1),(62,'2024_09_04_093013_create_employes_table',1),(63,'2024_09_04_093041_create_departements_table',1),(64,'2024_09_04_102739_create_employes_departement_table',1),(65,'2024_09_10_084714_create_contact_clients_table',1),(66,'2024_09_20_151653_create_contrats_table',1),(67,'2024_10_03_114035_create_employee_histories_table',1),(68,'2024_11_26_085638_create_contract_types_table',1),(69,'2025_01_15_000001_add_calcul_fields_to_rubriques_table',1),(70,'2025_01_15_000002_add_is_complete_to_rubriques_table',1),(71,'2025_01_15_000003_create_types_calculs_table',1),(72,'2025_01_21_135613_create_group_motif_absences_table',1),(73,'2025_01_22_092855_create_detail_motif_absences_table',1),(74,'2025_01_24_110513_create_jour_feries_table',1),(75,'2025_01_30_151925_create_absence_previsionnels_table',1),(76,'2025_02_03_143750_create_groupe_horaires_table',1),(77,'2025_02_03_154813_create_horaires_table',1),(78,'2025_02_18_114457_create_horaire_periodiques_table',1),(79,'2025_02_18_125501_create_details_periodiques_table',1),(80,'2025_02_27_104850_create_calendries_table',1),(81,'2025_02_27_104956_create_details_calendries_table',1),(82,'2025_03_21_103103_create_regle_compensation_table',1),(83,'2025_03_21_142035_create_penalites_table',1),(84,'2025_03_25_125256_create_groupe_arrondi_table',1),(85,'2025_03_26_115334_create_arrondis_table',1),(86,'2025_04_08_170439_create_parametre_bases_table',1),(87,'2025_04_10_112719_create_details_regles_table',1),(88,'2025_04_11_164051_create_heure_travails_table',1),(89,'2025_04_15_114638_create_horaire_exceptionnels_table',1),(90,'2025_04_23_114927_create_group_constantes_table',1),(91,'2025_04_24_105126_create_type_constantes_table',1),(92,'2025_04_25_144401_create_gp_pays',1),(93,'2025_04_25_145016_creaye_gp_villes',1),(94,'2025_04_25_145051_create_gp_communes',1),(95,'2025_04_28_093519_create_gp_services_table',1),(96,'2025_04_28_093557_create_gp_unites_table',1),(97,'2025_04_28_093632_create_gp_postes_table',1),(98,'2025_04_30_112308_create_type_rubriques_table',1),(99,'2025_05_02_092606_create_gp_calendriers_employes_table',1),(100,'2025_05_02_093704_create_memos_table',1),(101,'2025_05_06_090943_create_constantes_table',1),(102,'2025_05_07_093039_create_memos_constantes_table',1),(103,'2025_05_14_091422_add_infos_supplementaires_to_employes_table',1),(104,'2025_05_14_113538_make_bulletin_modele_nullable_in_employes_table',1),(105,'2025_05_14_135953_add_details_to_contrats_table',1),(106,'2025_05_19_094946_create_gp_banques_table',1),(107,'2025_05_19_094948_create_gp_agences_table',1),(108,'2025_05_19_094948_create_gp_comptes_bancaires_table',1),(109,'2025_05_26_091539_create_imprimables_table',1),(110,'2025_05_26_110620_create_mois_clotures_table',1),(111,'2025_05_26_111701_create_rappel_salaires_table',1),(112,'2025_05_26_115125_create_proprietes_table',1),(113,'2025_05_28_091208_create_gp_societes_table',1),(114,'2025_05_29_101033_create_calculs_table',1),(115,'2025_05_29_135541_create_gp_regle_employe_table',1),(116,'2025_06_10_081212_create_gp_theme_bultin_model_table',1),(117,'2025_06_11_094126_create_gp_bultin_models_table',1),(118,'2025_06_11_094148_create_gp_bultin_model_rubrique_table',1),(119,'2025_06_11_094213_create_gp_bultin_model_constante_table',1),(120,'2025_06_11_145642_create_gp_employe_bulletins_table',1),(121,'2025_07_22_091259_create_gp_group_paie_table',1),(122,'2025_07_22_092719_create_gp_paie_rubrique',1),(123,'2025_08_07_140335_create_gp_bon_sortie_table',1),(124,'2025_09_15_154031_create_gp_conges_table',1),(125,'2025_09_18_101715_create_gp_demandes_conges_table',1),(126,'2026_02_03_153000_create_cnss_affiliations_table',2),(127,'2026_02_04_000001_create_declarations_cnss_table',3),(128,'2026_02_04_000002_create_details_declaration_cnss_table',4),(129,'2026_02_04_000003_make_cnss_declarations_global',5),(130,'2026_02_05_000001_create_cnss_documents_table',6),(131,'2026_02_05_000002_create_cnss_operations_table',7),(132,'2026_02_06_000001_add_operation_id_to_cnss_documents_table',8);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mois_clotures`
--

DROP TABLE IF EXISTS `mois_clotures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mois_clotures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mois_clotures`
--

LOCK TABLES `mois_clotures` WRITE;
/*!40000 ALTER TABLE `mois_clotures` DISABLE KEYS */;
/*!40000 ALTER TABLE `mois_clotures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objectifs`
--

DROP TABLE IF EXISTS `objectifs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objectifs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type_objectif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valeur` int NOT NULL,
  `periode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objectifs`
--

LOCK TABLES `objectifs` WRITE;
/*!40000 ALTER TABLE `objectifs` DISABLE KEYS */;
/*!40000 ALTER TABLE `objectifs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oeufcasses`
--

DROP TABLE IF EXISTS `oeufcasses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oeufcasses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `N_lot` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nbr_oeuf_cass` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Poid_moy_oeuf` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oeufcasses`
--

LOCK TABLES `oeufcasses` WRITE;
/*!40000 ALTER TABLE `oeufcasses` DISABLE KEYS */;
/*!40000 ALTER TABLE `oeufcasses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oeuffini_semifinis`
--

DROP TABLE IF EXISTS `oeuffini_semifinis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oeuffini_semifinis` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `eau_semifini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entier_semifini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `janne_semifini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blan_semifini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LC_semifini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oeufcongles_semifini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entier_fini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `janne_fini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blan_fini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LC_fini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oeufcongles_fini` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oeuffini_semifinis`
--

LOCK TABLES `oeuffini_semifinis` WRITE;
/*!40000 ALTER TABLE `oeuffini_semifinis` DISABLE KEYS */;
/*!40000 ALTER TABLE `oeuffini_semifinis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offre_details`
--

DROP TABLE IF EXISTS `offre_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offre_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `Prix` decimal(8,2) NOT NULL,
  `id_offre` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `offre_details_produit_id_foreign` (`produit_id`),
  KEY `offre_details_id_offre_foreign` (`id_offre`),
  CONSTRAINT `offre_details_id_offre_foreign` FOREIGN KEY (`id_offre`) REFERENCES `offres` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `offre_details_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offre_details`
--

LOCK TABLES `offre_details` WRITE;
/*!40000 ALTER TABLE `offre_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `offre_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offre_groupe_table`
--

DROP TABLE IF EXISTS `offre_groupe_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offre_groupe_table` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `Id_offre` bigint unsigned NOT NULL,
  `Id_groupe` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `offre_groupe_table_id_offre_foreign` (`Id_offre`),
  KEY `offre_groupe_table_id_groupe_foreign` (`Id_groupe`),
  CONSTRAINT `offre_groupe_table_id_groupe_foreign` FOREIGN KEY (`Id_groupe`) REFERENCES `groupe_clients` (`Id_groupe`) ON DELETE CASCADE,
  CONSTRAINT `offre_groupe_table_id_offre_foreign` FOREIGN KEY (`Id_offre`) REFERENCES `offres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offre_groupe_table`
--

LOCK TABLES `offre_groupe_table` WRITE;
/*!40000 ALTER TABLE `offre_groupe_table` DISABLE KEYS */;
/*!40000 ALTER TABLE `offre_groupe_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offres`
--

DROP TABLE IF EXISTS `offres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `Désignation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Offre_prix` decimal(8,2) NOT NULL,
  `Date_début` date NOT NULL,
  `Date_fin` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offres`
--

LOCK TABLES `offres` WRITE;
/*!40000 ALTER TABLE `offres` DISABLE KEYS */;
/*!40000 ALTER TABLE `offres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parametre_bases`
--

DROP TABLE IF EXISTS `parametre_bases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametre_bases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parametre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valeur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parametre_bases`
--

LOCK TABLES `parametre_bases` WRITE;
/*!40000 ALTER TABLE `parametre_bases` DISABLE KEYS */;
INSERT INTO `parametre_bases` VALUES (1,'parametre','12','Entier','pénalité','2025-10-30 09:21:22','2025-10-30 09:21:22');
/*!40000 ALTER TABLE `parametre_bases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `penalites`
--

DROP TABLE IF EXISTS `penalites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `penalites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('entree','sortie') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ecart_min` decimal(8,2) NOT NULL,
  `ecart_max` decimal(8,2) NOT NULL,
  `penalite` decimal(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `penalites`
--

LOCK TABLES `penalites` WRITE;
/*!40000 ALTER TABLE `penalites` DISABLE KEYS */;
/*!40000 ALTER TABLE `penalites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permis`
--

DROP TABLE IF EXISTS `permis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permis` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `livreur_id` bigint unsigned NOT NULL,
  `n_permis` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_permis` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_permis` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permis_livreur_id_foreign` (`livreur_id`),
  CONSTRAINT `permis_livreur_id_foreign` FOREIGN KEY (`livreur_id`) REFERENCES `livreurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permis`
--

LOCK TABLES `permis` WRITE;
/*!40000 ALTER TABLE `permis` DISABLE KEYS */;
/*!40000 ALTER TABLE `permis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_role`
--

DROP TABLE IF EXISTS `permission_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_role_role_id_permission_id_unique` (`role_id`,`permission_id`),
  KEY `permission_role_permission_id_foreign` (`permission_id`),
  CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=314 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_role`
--

LOCK TABLES `permission_role` WRITE;
/*!40000 ALTER TABLE `permission_role` DISABLE KEYS */;
INSERT INTO `permission_role` VALUES (2,1,2,NULL,NULL),(3,1,3,NULL,NULL),(4,1,4,NULL,NULL),(6,1,6,NULL,NULL),(7,1,7,NULL,NULL),(8,1,8,NULL,NULL),(9,1,9,NULL,NULL),(10,1,10,NULL,NULL),(11,1,11,NULL,NULL),(13,1,13,NULL,NULL),(14,1,14,NULL,NULL),(15,1,15,NULL,NULL),(17,1,17,NULL,NULL),(18,1,18,NULL,NULL),(20,1,20,NULL,NULL),(21,1,21,NULL,NULL),(22,1,22,NULL,NULL),(23,1,23,NULL,NULL),(24,1,24,NULL,NULL),(25,1,25,NULL,NULL),(26,1,26,NULL,NULL),(27,1,27,NULL,NULL),(28,1,28,NULL,NULL),(30,1,30,NULL,NULL),(31,1,31,NULL,NULL),(32,1,32,NULL,NULL),(33,1,33,NULL,NULL),(34,1,34,NULL,NULL),(35,1,35,NULL,NULL),(36,1,36,NULL,NULL),(38,1,38,NULL,NULL),(40,1,40,NULL,NULL),(41,1,41,NULL,NULL),(42,1,42,NULL,NULL),(44,1,44,NULL,NULL),(45,1,45,NULL,NULL),(46,1,46,NULL,NULL),(50,1,16,NULL,NULL),(51,1,19,NULL,NULL),(52,1,29,NULL,NULL),(55,1,1,NULL,NULL),(56,1,12,NULL,NULL),(58,1,39,NULL,NULL),(61,1,43,NULL,NULL),(62,2,1,NULL,NULL),(63,2,2,NULL,NULL),(64,2,3,NULL,NULL),(65,2,4,NULL,NULL),(70,2,9,NULL,NULL),(71,2,10,NULL,NULL),(72,2,11,NULL,NULL),(73,2,12,NULL,NULL),(74,2,13,NULL,NULL),(75,2,14,NULL,NULL),(76,2,15,NULL,NULL),(77,2,16,NULL,NULL),(78,2,17,NULL,NULL),(79,2,18,NULL,NULL),(80,2,19,NULL,NULL),(81,2,20,NULL,NULL),(82,2,21,NULL,NULL),(83,2,22,NULL,NULL),(84,2,23,NULL,NULL),(85,2,24,NULL,NULL),(86,2,25,NULL,NULL),(87,2,26,NULL,NULL),(88,2,27,NULL,NULL),(89,2,28,NULL,NULL),(90,2,29,NULL,NULL),(91,2,30,NULL,NULL),(92,2,31,NULL,NULL),(93,2,32,NULL,NULL),(99,2,40,NULL,NULL),(100,2,41,NULL,NULL),(101,2,42,NULL,NULL),(102,1,5,NULL,NULL),(103,2,5,NULL,NULL),(104,2,6,NULL,NULL),(105,2,7,NULL,NULL),(106,2,8,NULL,NULL),(107,2,33,NULL,NULL),(108,2,34,NULL,NULL),(109,2,35,NULL,NULL),(110,2,36,NULL,NULL),(111,2,43,NULL,NULL),(112,2,44,NULL,NULL),(113,2,45,NULL,NULL),(114,2,46,NULL,NULL),(116,1,47,NULL,NULL),(120,1,51,NULL,NULL),(121,1,52,NULL,NULL),(122,1,53,NULL,NULL),(123,1,54,NULL,NULL),(124,1,37,NULL,NULL),(125,1,55,NULL,NULL),(126,1,56,NULL,NULL),(127,1,57,NULL,NULL),(128,1,58,NULL,NULL),(129,1,59,NULL,NULL),(130,1,60,NULL,NULL),(131,1,61,NULL,NULL),(132,1,62,NULL,NULL),(133,1,63,NULL,NULL),(134,1,64,NULL,NULL),(135,1,65,NULL,NULL),(136,1,66,NULL,NULL),(137,2,47,NULL,NULL),(141,2,51,NULL,NULL),(143,2,53,NULL,NULL),(145,2,59,NULL,NULL),(149,2,39,NULL,NULL),(150,1,67,NULL,NULL),(151,1,68,NULL,NULL),(152,1,69,NULL,NULL),(153,1,70,NULL,NULL),(154,1,71,NULL,NULL),(155,1,72,NULL,NULL),(156,1,73,NULL,NULL),(157,1,74,NULL,NULL),(158,1,75,NULL,NULL),(159,1,76,NULL,NULL),(160,1,77,NULL,NULL),(161,1,78,NULL,NULL),(162,1,79,NULL,NULL),(163,1,80,NULL,NULL),(164,1,81,NULL,NULL),(165,1,82,NULL,NULL),(166,1,83,NULL,NULL),(167,1,84,NULL,NULL),(168,1,85,NULL,NULL),(169,1,86,NULL,NULL),(170,2,55,NULL,NULL),(171,2,56,NULL,NULL),(172,2,57,NULL,NULL),(173,2,58,NULL,NULL),(174,2,63,NULL,NULL),(178,2,71,NULL,NULL),(179,2,72,NULL,NULL),(180,2,73,NULL,NULL),(181,2,74,NULL,NULL),(182,2,75,NULL,NULL),(186,2,83,NULL,NULL),(187,2,84,NULL,NULL),(188,2,85,NULL,NULL),(189,2,86,NULL,NULL),(190,1,87,NULL,NULL),(191,1,88,NULL,NULL),(192,1,89,NULL,NULL),(193,1,90,NULL,NULL),(194,1,91,NULL,NULL),(195,1,92,NULL,NULL),(196,1,93,NULL,NULL),(197,1,94,NULL,NULL),(198,1,95,NULL,NULL),(199,1,96,NULL,NULL),(200,1,97,NULL,NULL),(201,1,98,NULL,NULL),(202,1,99,NULL,NULL),(203,1,100,NULL,NULL),(205,1,102,NULL,NULL),(206,1,103,NULL,NULL),(207,1,104,NULL,NULL),(208,1,105,NULL,NULL),(209,1,106,NULL,NULL),(210,1,107,NULL,NULL),(211,1,108,NULL,NULL),(213,1,110,NULL,NULL),(214,1,111,NULL,NULL),(215,1,112,NULL,NULL),(216,1,113,NULL,NULL),(217,1,114,NULL,NULL),(218,1,115,NULL,NULL),(219,1,116,NULL,NULL),(220,1,101,NULL,NULL),(221,1,109,NULL,NULL),(222,2,105,NULL,NULL),(223,2,106,NULL,NULL),(224,2,107,NULL,NULL),(225,2,108,NULL,NULL),(227,2,114,NULL,NULL),(228,2,115,NULL,NULL),(229,1,117,NULL,NULL),(230,1,118,NULL,NULL),(231,1,119,NULL,NULL),(232,1,120,NULL,NULL),(233,1,121,NULL,NULL),(234,1,122,NULL,NULL),(235,1,123,NULL,NULL),(236,1,124,NULL,NULL),(237,1,125,NULL,NULL),(238,1,126,NULL,NULL),(239,1,127,NULL,NULL),(240,1,128,NULL,NULL),(241,1,129,NULL,NULL),(242,1,130,NULL,NULL),(243,1,131,NULL,NULL),(244,1,132,NULL,NULL),(251,2,131,NULL,NULL),(252,2,119,NULL,NULL),(253,2,121,NULL,NULL),(258,2,126,NULL,NULL),(259,2,127,NULL,NULL),(260,2,124,NULL,NULL),(262,1,133,NULL,NULL),(269,1,134,NULL,NULL),(270,1,136,NULL,NULL),(272,1,137,NULL,NULL),(274,1,139,NULL,NULL),(276,1,141,NULL,NULL),(277,1,142,NULL,NULL),(278,1,143,NULL,NULL),(279,1,144,NULL,NULL),(280,1,145,NULL,NULL),(281,1,146,NULL,NULL),(282,1,147,NULL,NULL),(283,1,148,NULL,NULL),(284,1,138,NULL,NULL),(290,1,149,NULL,NULL),(291,1,150,NULL,NULL),(301,1,153,NULL,NULL),(305,1,157,NULL,NULL),(309,1,158,NULL,NULL),(311,1,155,NULL,NULL),(313,1,159,NULL,NULL);
/*!40000 ALTER TABLE `permission_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'view_all_products','2025-10-28 13:32:01','2025-10-28 13:32:01'),(2,'create_product','2025-10-28 13:32:01','2025-10-28 13:32:01'),(3,'edit_product','2025-10-28 13:32:01','2025-10-28 13:32:01'),(4,'delete_product','2025-10-28 13:32:01','2025-10-28 13:32:01'),(5,'view_all_livreurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(6,'create_livreurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(7,'update_livreurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(8,'delete_livreurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(9,'delete_fournisseurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(10,'update_fournisseurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(11,'create_fournisseurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(12,'view_all_fournisseurs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(13,'delete_user','2025-10-28 13:32:01','2025-10-28 13:32:01'),(14,'edit_user','2025-10-28 13:32:01','2025-10-28 13:32:01'),(15,'create_user','2025-10-28 13:32:01','2025-10-28 13:32:01'),(16,'view_all_users','2025-10-28 13:32:01','2025-10-28 13:32:01'),(17,'delete_clients','2025-10-28 13:32:01','2025-10-28 13:32:01'),(18,'update_clients','2025-10-28 13:32:01','2025-10-28 13:32:01'),(19,'view_all_clients','2025-10-28 13:32:01','2025-10-28 13:32:01'),(20,'create_clients','2025-10-28 13:32:01','2025-10-28 13:32:01'),(21,'view_all_vehicules','2025-10-28 13:32:01','2025-10-28 13:32:01'),(22,'update_vehicules','2025-10-28 13:32:01','2025-10-28 13:32:01'),(23,'create_vehicules','2025-10-28 13:32:01','2025-10-28 13:32:01'),(24,'delete_vehicules','2025-10-28 13:32:01','2025-10-28 13:32:01'),(25,'view_all_objectifs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(26,'create_objectifs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(27,'update_objectifs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(28,'delete_objectifs','2025-10-28 13:32:01','2025-10-28 13:32:01'),(29,'view_all_commandes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(30,'create_commandes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(31,'update_commandes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(32,'delete_commandes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(33,'view_all_employes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(34,'create_employes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(35,'update_employes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(36,'delete_employes','2025-10-28 13:32:01','2025-10-28 13:32:01'),(37,'view_emp_historique','2025-10-28 13:32:01','2025-10-28 13:32:01'),(38,'view_emp_contrats','2025-10-28 13:32:01','2025-10-28 13:32:01'),(39,'view_all_employee_histories','2025-10-28 13:32:01','2025-10-28 13:32:01'),(40,'create_employee_histories','2025-10-28 13:32:01','2025-10-28 13:32:01'),(41,'update_employee_histories','2025-10-28 13:32:01','2025-10-28 13:32:01'),(42,'delete_employee_histories','2025-10-28 13:32:01','2025-10-28 13:32:01'),(43,'view_all_contrats','2025-10-28 13:32:01','2025-10-28 13:32:01'),(44,'create_contrats','2025-10-28 13:32:01','2025-10-28 13:32:01'),(45,'update_contrats','2025-10-28 13:32:01','2025-10-28 13:32:01'),(46,'delete_contrats','2025-10-28 13:32:01','2025-10-28 13:32:01'),(47,'view_all_absences','2025-10-29 09:01:02','2025-10-29 09:01:02'),(48,'create_absences','2025-10-29 09:01:02','2025-10-29 09:01:02'),(49,'update_absences','2025-10-29 09:01:02','2025-10-29 09:01:02'),(50,'delete_absences','2025-10-29 09:01:02','2025-10-29 09:01:02'),(51,'view_all_jour_feries','2025-10-29 09:01:02','2025-10-29 09:01:02'),(52,'create_jour_feries','2025-10-29 09:01:02','2025-10-29 09:01:02'),(53,'update_jour_feries','2025-10-29 09:01:02','2025-10-29 09:01:02'),(54,'delete_jour_feries','2025-10-29 09:01:02','2025-10-29 09:01:02'),(55,'view_all_calendries','2025-10-29 12:28:50','2025-10-29 12:28:50'),(56,'create_calendries','2025-10-29 12:28:50','2025-10-29 12:28:50'),(57,'update_calendries','2025-10-29 12:28:50','2025-10-29 12:28:50'),(58,'delete_calendries','2025-10-29 12:28:50','2025-10-29 12:28:50'),(59,'view_all_horaires','2025-10-29 12:28:50','2025-10-29 12:28:50'),(60,'create_horaires','2025-10-29 12:28:50','2025-10-29 12:28:50'),(61,'update_horaires','2025-10-29 12:28:50','2025-10-29 12:28:50'),(62,'delete_horaires','2025-10-29 12:28:50','2025-10-29 12:28:50'),(63,'view_all_horaire_periodiques','2025-10-29 12:28:50','2025-10-29 12:28:50'),(64,'create_horaire_periodiques','2025-10-29 12:28:50','2025-10-29 12:28:50'),(65,'update_horaire_periodiques','2025-10-29 12:28:50','2025-10-29 12:28:50'),(66,'delete_horaire_periodiques','2025-10-29 12:28:50','2025-10-29 12:28:50'),(67,'view_all_rubriques','2025-10-29 13:40:51','2025-10-29 13:40:51'),(68,'create_rubriques','2025-10-29 13:40:51','2025-10-29 13:40:51'),(69,'update_rubriques','2025-10-29 13:40:51','2025-10-29 13:40:51'),(70,'delete_rubriques','2025-10-29 13:40:51','2025-10-29 13:40:51'),(71,'view_all_constantes','2025-10-29 13:40:51','2025-10-29 13:40:51'),(72,'create_constantes','2025-10-29 13:40:51','2025-10-29 13:40:51'),(73,'update_constantes','2025-10-29 13:40:52','2025-10-29 13:40:52'),(74,'delete_constantes','2025-10-29 13:40:52','2025-10-29 13:40:52'),(75,'view_all_groupes_paie','2025-10-29 13:40:52','2025-10-29 13:40:52'),(76,'create_groupes_paie','2025-10-29 13:40:52','2025-10-29 13:40:52'),(77,'update_groupes_paie','2025-10-29 13:40:52','2025-10-29 13:40:52'),(78,'delete_groupes_paie','2025-10-29 13:40:52','2025-10-29 13:40:52'),(79,'view_all_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(80,'create_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(81,'update_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(82,'delete_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(83,'view_all_theme_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(84,'create_theme_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(85,'update_theme_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(86,'delete_theme_bultin_models','2025-10-29 13:40:52','2025-10-29 13:40:52'),(87,'view_all_absence_previsionnels','2025-10-29 14:18:27','2025-10-29 14:18:27'),(88,'create_absence_previsionnels','2025-10-29 14:18:27','2025-10-29 14:18:27'),(89,'update_absence_previsionnels','2025-10-29 14:18:27','2025-10-29 14:18:27'),(90,'delete_absence_previsionnels','2025-10-29 14:18:27','2025-10-29 14:18:27'),(91,'view_all_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(92,'create_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(93,'update_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(94,'delete_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(95,'view_all_demandes_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(96,'create_demandes_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(97,'update_demandes_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(98,'delete_demandes_conges','2025-10-29 14:18:27','2025-10-29 14:18:27'),(99,'view_bulletin_paie','2025-10-29 14:18:27','2025-10-29 14:18:27'),(100,'view_valeur_base','2025-10-29 14:18:27','2025-10-29 14:18:27'),(101,'view_all_societes','2025-10-30 09:10:30','2025-10-30 09:10:30'),(102,'create_societes','2025-10-30 09:10:30','2025-10-30 09:10:30'),(103,'update_societes','2025-10-30 09:10:30','2025-10-30 09:10:30'),(104,'delete_societes','2025-10-30 09:10:30','2025-10-30 09:10:30'),(105,'view_all_bon_de_sortie','2025-10-30 09:10:30','2025-10-30 09:10:30'),(106,'create_bon_de_sortie','2025-10-30 09:10:30','2025-10-30 09:10:30'),(107,'update_bon_de_sortie','2025-10-30 09:10:30','2025-10-30 09:10:30'),(108,'delete_bon_de_sortie','2025-10-30 09:10:30','2025-10-30 09:10:30'),(109,'view_all_regle_compensation','2025-10-30 09:10:30','2025-10-30 09:10:30'),(110,'create_regle_compensation','2025-10-30 09:10:30','2025-10-30 09:10:30'),(111,'update_regle_compensation','2025-10-30 09:10:30','2025-10-30 09:10:30'),(112,'delete_regle_compensation','2025-10-30 09:10:30','2025-10-30 09:10:30'),(113,'view_all_penalites','2025-10-30 09:10:30','2025-10-30 09:10:30'),(114,'create_penalites','2025-10-30 09:10:30','2025-10-30 09:10:30'),(115,'update_penalites','2025-10-30 09:10:30','2025-10-30 09:10:30'),(116,'delete_penalites','2025-10-30 09:10:30','2025-10-30 09:10:30'),(117,'view_all_arrondis','2025-10-30 09:41:32','2025-10-30 09:41:32'),(118,'create_arrondis','2025-10-30 09:41:32','2025-10-30 09:41:32'),(119,'update_arrondis','2025-10-30 09:41:32','2025-10-30 09:41:32'),(120,'delete_arrondis','2025-10-30 09:41:32','2025-10-30 09:41:32'),(121,'view_all_parametre_base','2025-10-30 09:41:32','2025-10-30 09:41:32'),(122,'create_parametre_base','2025-10-30 09:41:32','2025-10-30 09:41:32'),(123,'update_parametre_base','2025-10-30 09:41:32','2025-10-30 09:41:32'),(124,'delete_parametre_base','2025-10-30 09:41:32','2025-10-30 09:41:32'),(125,'view_all_heure_travail','2025-10-30 09:41:32','2025-10-30 09:41:32'),(126,'create_heure_travail','2025-10-30 09:41:32','2025-10-30 09:41:32'),(127,'update_heure_travail','2025-10-30 09:41:32','2025-10-30 09:41:32'),(128,'delete_heure_travail','2025-10-30 09:41:32','2025-10-30 09:41:32'),(129,'view_all_horaire_exceptionnel','2025-10-30 09:41:32','2025-10-30 09:41:32'),(130,'create_horaire_exceptionnel','2025-10-30 09:41:32','2025-10-30 09:41:32'),(131,'update_horaire_exceptionnel','2025-10-30 09:41:32','2025-10-30 09:41:32'),(132,'delete_horaire_exceptionnel','2025-10-30 09:41:32','2025-10-30 09:41:32'),(133,'view_all_departements','2025-11-03 09:18:02','2025-11-03 09:18:02'),(134,'create_departements','2025-11-03 09:18:02','2025-11-03 09:18:02'),(135,'update_departements','2025-11-03 09:18:02','2025-11-03 09:18:02'),(136,'delete_departements','2025-11-03 09:18:02','2025-11-03 09:18:02'),(137,'view_all_group_motifs','2025-11-03 14:45:26','2025-11-03 14:45:26'),(138,'create_group_motifs','2025-11-03 14:45:26','2025-11-03 14:45:26'),(139,'update_group_motifs','2025-11-03 14:45:26','2025-11-03 14:45:26'),(140,'delete_group_motifs','2025-11-03 14:45:26','2025-11-03 14:45:26'),(141,'view_all_groupe_horaires','2025-11-03 14:45:26','2025-11-03 14:45:26'),(142,'create_groupe_horaires','2025-11-03 14:45:26','2025-11-03 14:45:26'),(143,'update_groupe_horaires','2025-11-03 14:45:26','2025-11-03 14:45:26'),(144,'delete_groupe_horaires','2025-11-03 14:45:26','2025-11-03 14:45:26'),(145,'view_all_group_constantes','2025-11-03 14:45:26','2025-11-03 14:45:26'),(146,'create_group_constantes','2025-11-03 14:45:26','2025-11-03 14:45:26'),(147,'update_group_constantes','2025-11-03 14:45:26','2025-11-03 14:45:26'),(148,'delete_group_constantes','2025-11-03 14:45:26','2025-11-03 14:45:26'),(149,'view_all_group_rubriques','2025-11-04 14:57:34','2025-11-04 14:57:34'),(150,'create_group_rubriques','2025-11-04 14:57:34','2025-11-04 14:57:34'),(151,'update_group_rubriques','2025-11-04 14:57:34','2025-11-04 14:57:34'),(152,'delete_group_rubriques','2025-11-04 14:57:34','2025-11-04 14:57:34'),(153,'view_groupes_paie_details','2025-11-04 15:16:20','2025-11-04 15:16:20'),(154,'create_groupes_paie_details','2025-11-04 15:16:20','2025-11-04 15:16:20'),(155,'update_groupes_paie_details','2025-11-04 15:16:20','2025-11-04 15:16:20'),(156,'delete_groupes_paie_details','2025-11-04 15:16:20','2025-11-04 15:16:20'),(157,'view_bultin_models_details','2025-11-04 15:16:20','2025-11-04 15:16:20'),(158,'create_bultin_models_details','2025-11-04 15:16:20','2025-11-04 15:16:20'),(159,'update_bultin_models_details','2025-11-04 15:16:20','2025-11-04 15:16:20'),(160,'delete_bultin_models_details','2025-11-04 15:16:20','2025-11-04 15:16:20');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',1,'API_TOKEN','68257a6b157c2c69f903d6b1aac1e4e90abcab73134845574be9fa65dd6929d6','[\"*\"]','2025-10-28 13:41:13',NULL,'2025-10-28 13:33:07','2025-10-28 13:41:13'),(2,'App\\Models\\User',1,'API_TOKEN','73f06d4dcdabed199f80741dccb00b5db3077f4d7203fe14449949d6e7c2ed07','[\"*\"]','2025-10-28 13:45:15',NULL,'2025-10-28 13:41:56','2025-10-28 13:45:15'),(3,'App\\Models\\User',1,'API_TOKEN','59f7b8c446214e4e6461c9f5383a37c32b0f25c7a25796a9465b769ff8c6843d','[\"*\"]','2025-10-28 13:49:24',NULL,'2025-10-28 13:48:34','2025-10-28 13:49:24'),(4,'App\\Models\\User',3,'API_TOKEN','940fa02f9550cee0888fb4f05ea8a44d11f0d316c45e5958e89197afd509b467','[\"*\"]','2025-10-28 13:51:38',NULL,'2025-10-28 13:50:30','2025-10-28 13:51:38'),(5,'App\\Models\\User',1,'API_TOKEN','51d8a2239b33112ac95f8f1d20d73d1e9520bb08a3d2fb37c766903d4b7bccc9','[\"*\"]','2025-10-28 13:55:00',NULL,'2025-10-28 13:51:26','2025-10-28 13:55:00'),(6,'App\\Models\\User',1,'API_TOKEN','e314a3876220fa65fbcbc9422cdcd2091269efe2935803a62437edbc8ed317a9','[\"*\"]','2025-10-28 13:57:12',NULL,'2025-10-28 13:55:22','2025-10-28 13:57:12'),(7,'App\\Models\\User',1,'API_TOKEN','533b0d9bc0bd7944a430e55cfc8fb0435d7c8827f9a0b9b6b5129be16e6fc743','[\"*\"]','2025-10-28 13:58:45',NULL,'2025-10-28 13:57:56','2025-10-28 13:58:45'),(8,'App\\Models\\User',1,'API_TOKEN','5c5af4a0d1e64d5c556039ab2bbc507df643caec1d300cf100d4b3d6a250ac5d','[\"*\"]','2025-10-28 13:59:11',NULL,'2025-10-28 13:58:51','2025-10-28 13:59:11'),(9,'App\\Models\\User',3,'API_TOKEN','04ce5af0909250eba2ba5ea704eb04bb64ac8dc84640e98f1e956b47c15c77a5','[\"*\"]','2025-10-28 14:00:07',NULL,'2025-10-28 14:00:04','2025-10-28 14:00:07'),(10,'App\\Models\\User',1,'API_TOKEN','7394b6728332dc24974a592912b46fc79292a4460934974f788618cab5371c1d','[\"*\"]','2025-10-28 14:25:20',NULL,'2025-10-28 14:00:15','2025-10-28 14:25:20'),(11,'App\\Models\\User',4,'API_TOKEN','890bccf975a4dc0c2d3d656fcaaa64814f43b2551e9bd47033b5abce33261801','[\"*\"]','2025-10-28 14:33:24',NULL,'2025-10-28 14:27:06','2025-10-28 14:33:24'),(12,'App\\Models\\User',4,'API_TOKEN','86a4c22a57ef608169d836d37693abe35fb01fdad673bf51e90e2d3966135875','[\"*\"]','2025-10-28 14:36:22',NULL,'2025-10-28 14:35:21','2025-10-28 14:36:22'),(13,'App\\Models\\User',4,'API_TOKEN','2c082efe27b28231b29533f03826c507491ec594e87a88a8a3c337764876be01','[\"*\"]','2025-10-28 14:39:41',NULL,'2025-10-28 14:36:29','2025-10-28 14:39:41'),(14,'App\\Models\\User',4,'API_TOKEN','1ba5e97a9c1402e068adbba81d8889b406671edf950689b5528ffeab377c3eb9','[\"*\"]','2025-10-29 07:42:26',NULL,'2025-10-28 14:39:50','2025-10-29 07:42:26'),(15,'App\\Models\\User',1,'API_TOKEN','e493ce6859b8c606f87579db411495f58715470b4c8587de7e6b7a4eb7c7a633','[\"*\"]','2025-10-29 09:02:45',NULL,'2025-10-29 07:43:52','2025-10-29 09:02:45'),(16,'App\\Models\\User',1,'API_TOKEN','cee1eb398a3a252f7a12078f3cd0dc82ca1164d821f4e9f231ce719424840a63','[\"*\"]','2025-10-29 13:03:32',NULL,'2025-10-29 09:03:02','2025-10-29 13:03:32'),(17,'App\\Models\\User',4,'API_TOKEN','882d97c91969eeaaaf3618f9df7b6fb44ae1dd6b1698966c584278c9dd78ef51','[\"*\"]','2025-10-29 13:04:13',NULL,'2025-10-29 13:04:11','2025-10-29 13:04:13'),(18,'App\\Models\\User',1,'API_TOKEN','9f5460516444215f7d11481f74c056e01a4e1b99ad5c97b5565b1bdc3a415cd8','[\"*\"]','2025-10-29 13:47:16',NULL,'2025-10-29 13:04:29','2025-10-29 13:47:16'),(19,'App\\Models\\User',4,'API_TOKEN','cd5f9cd5be8209ac1420a10bb08fad6c6fc7dbf26ed291a7c7db5d1b6541e0ba','[\"*\"]','2025-10-29 13:47:29',NULL,'2025-10-29 13:47:25','2025-10-29 13:47:29'),(20,'App\\Models\\User',1,'API_TOKEN','bf3ee5853b334d6bd9d9562705d7ed0f0d6b43cc57fdd1c965563a2ac4dfd066','[\"*\"]','2025-10-30 08:11:15',NULL,'2025-10-29 13:47:44','2025-10-30 08:11:15'),(21,'App\\Models\\User',1,'API_TOKEN','ab34d637f4677423b7034ae94ce2491992fe757adffa521b19df011be3ad4729','[\"*\"]','2025-10-30 09:15:19',NULL,'2025-10-30 08:14:09','2025-10-30 09:15:19'),(22,'App\\Models\\User',4,'API_TOKEN','7bd626e389147f15bdc9d09c56e3b2ff9498c2afba71f041aa7bd3f2d6976548','[\"*\"]','2025-10-30 09:15:30',NULL,'2025-10-30 09:15:26','2025-10-30 09:15:30'),(23,'App\\Models\\User',1,'API_TOKEN','7558b7b7bc9508c30f1b525f774434dbf44e3851d62dad19c2fad607ca1faea0','[\"*\"]','2025-10-30 09:19:45',NULL,'2025-10-30 09:15:52','2025-10-30 09:19:45'),(24,'App\\Models\\User',4,'API_TOKEN','7165f9814a90e8a8648ad1ba5136fed4daf75ce18b33fddf6db2149f06baed12','[\"*\"]','2025-10-30 09:22:15',NULL,'2025-10-30 09:20:14','2025-10-30 09:22:15'),(25,'App\\Models\\User',1,'API_TOKEN','874d57d0b0565d24e3879203dd805a6cc07dc004ec386ec140354ab6fab482d8','[\"*\"]','2025-10-30 09:51:47',NULL,'2025-10-30 09:22:28','2025-10-30 09:51:47'),(26,'App\\Models\\User',4,'API_TOKEN','e2e42f9a02070c94abd4c8abc958c6cd165c8552540c37cd1852096e2d5635cf','[\"*\"]','2025-10-30 09:51:58',NULL,'2025-10-30 09:51:57','2025-10-30 09:51:58'),(27,'App\\Models\\User',1,'API_TOKEN','4b15f9571ba98ec2ab4e428950547b37deca7270d403adc9d2f941e7543da137','[\"*\"]','2025-10-30 15:13:08',NULL,'2025-10-30 09:53:17','2025-10-30 15:13:08'),(28,'App\\Models\\User',4,'API_TOKEN','2360f8b78675495196e3e11ed31cc91f1056771e36e40729b3bfdd1aed1a147e','[\"*\"]','2025-10-30 15:15:18',NULL,'2025-10-30 15:15:15','2025-10-30 15:15:18'),(29,'App\\Models\\User',1,'API_TOKEN','0c1f88a831c22e9985525deeb43ae0eb0f05e71b3c2ee77b8888098d01c7753e','[\"*\"]','2025-10-31 08:10:39',NULL,'2025-10-30 15:15:32','2025-10-31 08:10:39'),(30,'App\\Models\\User',4,'API_TOKEN','83b336fc64457513dce6b5d1e955843091fd640bc4f05bfc425928eaaa48efad','[\"*\"]','2025-10-31 09:51:01',NULL,'2025-10-31 08:10:46','2025-10-31 09:51:01'),(31,'App\\Models\\User',4,'API_TOKEN','222bbe38872ecb624219d7ff2a0957aa09c43806d3fa0b1572c221d3da9c1f8e','[\"*\"]','2025-10-31 12:42:56',NULL,'2025-10-31 09:51:08','2025-10-31 12:42:56'),(32,'App\\Models\\User',1,'API_TOKEN','30c7804fae47e303796271247ca0176bd6c442b7f123fb0b50a6d86d078aaf48','[\"*\"]','2025-10-31 12:49:45',NULL,'2025-10-31 12:43:12','2025-10-31 12:49:45'),(33,'App\\Models\\User',1,'API_TOKEN','433c8bda81da05c7a14338852da3e36857206643126069ba99c7bc43151d15c0','[\"*\"]','2025-11-02 15:08:25',NULL,'2025-10-31 12:49:50','2025-11-02 15:08:25'),(34,'App\\Models\\User',1,'API_TOKEN','dd22f4efcad8057a8403ec8851d6fff27b55c42275e8b4aca6553861d86ad367','[\"*\"]','2025-11-05 09:36:41',NULL,'2025-11-02 15:08:30','2025-11-05 09:36:41'),(35,'App\\Models\\User',4,'API_TOKEN','b3295d6eed94e1b049e8dc32c9bb5f4bae4a3aaf29333188a40aabb8fbe8f77d','[\"*\"]','2025-11-05 09:43:50',NULL,'2025-11-05 09:36:49','2025-11-05 09:43:50'),(36,'App\\Models\\User',1,'API_TOKEN','a8f3389157c1b23f212679154f1ea796dd3bafc7427a86a64ce513d0f7cf0576','[\"*\"]','2025-11-05 10:13:26',NULL,'2025-11-05 10:07:23','2025-11-05 10:13:26'),(37,'App\\Models\\User',1,'API_TOKEN','bb047d871d5d5e45279b2ea35df51f6ae5a3e56c363c575e5e935e6cbd12c559','[\"*\"]','2025-11-05 10:55:54',NULL,'2025-11-05 10:13:36','2025-11-05 10:55:54'),(38,'App\\Models\\User',1,'API_TOKEN','8727129098138a61a8b5dc69ae78e4820711a8f44a019f9b5a5a99a4dc70f411','[\"*\"]','2025-11-07 07:14:24',NULL,'2025-11-05 10:57:10','2025-11-07 07:14:24'),(39,'App\\Models\\User',1,'API_TOKEN','530e7e2214e694f1de774da9e4880d4470af5c4e14be9c47c8b69df9e4743605','[\"*\"]','2025-11-17 13:39:10',NULL,'2025-11-17 12:48:45','2025-11-17 13:39:10'),(40,'App\\Models\\User',1,'API_TOKEN','b3674b3e3b6e8bceaec2376060ce827e6fb8e072c0e8cfc3c8798cfbab3bb508','[\"*\"]','2025-11-19 07:53:59',NULL,'2025-11-17 15:07:39','2025-11-19 07:53:59'),(41,'App\\Models\\User',1,'API_TOKEN','07d5eb79c80262a5ad4e5d8934b5621f745a6ba72d5fc7389bc68feb06a8b48b','[\"*\"]','2026-01-22 09:03:47',NULL,'2026-01-22 09:02:43','2026-01-22 09:03:47'),(42,'App\\Models\\User',1,'API_TOKEN','444ff933289a6ed642fc8e37e483cb3107548592a910151e98f550ca9a94ae7d','[\"*\"]','2026-01-26 10:50:23',NULL,'2026-01-26 10:50:11','2026-01-26 10:50:23'),(43,'App\\Models\\User',1,'API_TOKEN','72d4f8c48b6e84ca1c088615cc3448605463fe7cddbc2104a1f45d6914337ac7','[\"*\"]',NULL,NULL,'2026-01-26 10:50:12','2026-01-26 10:50:12'),(44,'App\\Models\\User',1,'API_TOKEN','9f19032a2bde2689636a75ee01da533c2348909a71b9eb867cd123d4269d1979','[\"*\"]',NULL,NULL,'2026-01-26 10:50:13','2026-01-26 10:50:13'),(45,'App\\Models\\User',1,'API_TOKEN','4175788204958231a6cd1b396a707166e3dc72873b204873eb9c60b4254f2f4b','[\"*\"]',NULL,NULL,'2026-01-26 10:50:14','2026-01-26 10:50:14'),(46,'App\\Models\\User',1,'API_TOKEN','1a4e622f3f50ebff35b028bf8b194702d9e1a08fc29f587a82899ded49047391','[\"*\"]',NULL,NULL,'2026-01-26 10:50:14','2026-01-26 10:50:14'),(47,'App\\Models\\User',1,'API_TOKEN','cdd83b6ca02bd460263788d3da053828bc3cc5c44280dc14aab7fe85db1b6b2a','[\"*\"]',NULL,NULL,'2026-01-26 10:50:15','2026-01-26 10:50:15'),(48,'App\\Models\\User',1,'API_TOKEN','541e42f98b08dab6bcde78843c9dc4baa25a3b19078fc0af49359facefa83567','[\"*\"]','2026-02-08 14:01:45',NULL,'2026-01-26 10:50:16','2026-02-08 14:01:45'),(49,'App\\Models\\User',1,'API_TOKEN','12592ae81587b0420ab14de66e843177a24b4a9b17b9d4a6a515ea740c3086c1','[\"*\"]','2026-01-31 14:48:23',NULL,'2026-01-31 14:48:09','2026-01-31 14:48:23'),(50,'App\\Models\\User',1,'API_TOKEN','345cb2a19a56bbd8d122dc6f4c08f1e66f492367ed1bc9886c11d93e6c5ce52d','[\"*\"]',NULL,NULL,'2026-01-31 14:48:11','2026-01-31 14:48:11'),(51,'App\\Models\\User',1,'API_TOKEN','a78cbc95676fa65c69ba6a01e84406e2de6c2928c51420eb21af962da46878c1','[\"*\"]',NULL,NULL,'2026-01-31 14:48:12','2026-01-31 14:48:12'),(52,'App\\Models\\User',1,'API_TOKEN','fa502016e226560629bd38878ab98778da7ef4257900d93b576788a0a4cff97c','[\"*\"]',NULL,NULL,'2026-01-31 14:48:12','2026-01-31 14:48:12'),(53,'App\\Models\\User',1,'API_TOKEN','59c8030f296cbf17532f9e42de07083002b8115573b51165715fb2b0236aae66','[\"*\"]','2026-01-31 14:49:35',NULL,'2026-01-31 14:48:13','2026-01-31 14:49:35'),(54,'App\\Models\\User',1,'API_TOKEN','0713af5e38713ca324933890737482d2d6f60cd22516e2d4e9bea931195f1154','[\"*\"]','2026-02-05 21:51:44',NULL,'2026-02-03 09:26:17','2026-02-05 21:51:44'),(55,'App\\Models\\User',1,'API_TOKEN','988f86c846d32be6839510edb24a599b1f2e40721e453c601411551690470e84','[\"*\"]',NULL,NULL,'2026-02-05 21:06:45','2026-02-05 21:06:45'),(56,'App\\Models\\User',1,'API_TOKEN','ad67150993887ab057e7bdfafba92d838a9f544ab5c810190ffff548d2bdff6c','[\"*\"]','2026-02-05 21:07:09',NULL,'2026-02-05 21:06:52','2026-02-05 21:07:09'),(57,'App\\Models\\User',1,'API_TOKEN','caecfd70190c0ee7e5311dbf69d3968da9f40f832c69bacfcd135d2ec2346438','[\"*\"]','2026-02-05 21:16:53',NULL,'2026-02-05 21:16:00','2026-02-05 21:16:53'),(58,'App\\Models\\User',1,'API_TOKEN','660059a54662e084d180755a54aa07efc8703a5f6131a63a6c7002be78a970a3','[\"*\"]','2026-02-05 22:10:37',NULL,'2026-02-05 22:10:37','2026-02-05 22:10:37'),(59,'App\\Models\\User',1,'API_TOKEN','027a4463326840214fcec5f29b8096f3b91dc193f36215f5f9f7d28389c2f440','[\"*\"]','2026-02-06 08:51:11',NULL,'2026-02-06 08:51:10','2026-02-06 08:51:11'),(60,'App\\Models\\User',1,'API_TOKEN','9fc6282dafd4ff6448ddf461ee0bbbb47467e8fe7a37349be04d83553fb6f6be','[\"*\"]','2026-02-06 08:51:33',NULL,'2026-02-06 08:51:33','2026-02-06 08:51:33'),(61,'App\\Models\\User',1,'API_TOKEN','f88730fb9e779c1cf2aab98331bd15544fedf6d46ce352b1b81034a75d848721','[\"*\"]','2026-02-06 10:38:56',NULL,'2026-02-06 10:38:55','2026-02-06 10:38:56'),(62,'App\\Models\\User',1,'API_TOKEN','8546fe8bc2c5830148e6b5410a959ef709b2909cc8679497533f5fa205c20c6b','[\"*\"]','2026-02-06 10:39:27',NULL,'2026-02-06 10:39:25','2026-02-06 10:39:27'),(63,'App\\Models\\User',1,'API_TOKEN','e7f315b44221da06f162bc38537bf106e792090ad9fd697117a31420a1421a61','[\"*\"]','2026-02-06 10:40:54',NULL,'2026-02-06 10:40:49','2026-02-06 10:40:54'),(64,'App\\Models\\User',1,'API_TOKEN','76cf1ef846174c4376086726b3eac008870f155a91599915805ecb29eae20c5d','[\"*\"]','2026-02-06 10:41:16',NULL,'2026-02-06 10:41:15','2026-02-06 10:41:16'),(65,'App\\Models\\User',1,'API_TOKEN','114e4796aa2ae451623f5801f4fd712b7a9bd33d446ac1aad6ed529403b7d170','[\"*\"]',NULL,NULL,'2026-02-06 10:41:26','2026-02-06 10:41:26'),(66,'App\\Models\\User',1,'API_TOKEN','c3ddbfd5570498fabb5f628b736f80c232b2c9a2d5a3ad7962a0122b5a495b0e','[\"*\"]','2026-02-06 10:42:18',NULL,'2026-02-06 10:42:17','2026-02-06 10:42:18'),(67,'App\\Models\\User',1,'API_TOKEN','35e0f1ebda474b651e6725605fa23a5f668c7b06134d1c5fbc019c97d84fdb44','[\"*\"]','2026-02-06 10:42:43',NULL,'2026-02-06 10:42:39','2026-02-06 10:42:43'),(68,'App\\Models\\User',1,'API_TOKEN','f1e26767f7f50a82541f79bd4457e90f779244ea2b670c16dd8d318afa363a80','[\"*\"]',NULL,NULL,'2026-02-06 10:46:35','2026-02-06 10:46:35'),(69,'App\\Models\\User',1,'API_TOKEN','53fa35df127bf7831aa8b2e66f894c1c4c58b0e2a626d555fac4a391992196fc','[\"*\"]','2026-02-06 10:47:18',NULL,'2026-02-06 10:47:03','2026-02-06 10:47:18'),(70,'App\\Models\\User',1,'API_TOKEN','55826c4c9c19e41d3ace912e6e860959b5069c603e11adf98d6a18670ce1cd8c','[\"*\"]','2026-02-06 10:47:33',NULL,'2026-02-06 10:47:33','2026-02-06 10:47:33'),(71,'App\\Models\\User',1,'API_TOKEN','c411bede24b1d7c3cc0d3429eeb2434239fa08875cce0801fcee6ac969198b77','[\"*\"]','2026-02-06 10:47:45',NULL,'2026-02-06 10:47:45','2026-02-06 10:47:45'),(72,'App\\Models\\User',1,'API_TOKEN','b8be3dd15c8ba45cabeb971e0154b1829d81a395847a5f933e54dc4b27a3c147','[\"*\"]','2026-02-06 10:47:59',NULL,'2026-02-06 10:47:59','2026-02-06 10:47:59'),(73,'App\\Models\\User',1,'API_TOKEN','57f02f40d72a49546f6683e54c3fc6c8e4889e050174a9f7c2b670db3a008c10','[\"*\"]','2026-02-06 10:49:43',NULL,'2026-02-06 10:49:43','2026-02-06 10:49:43'),(74,'App\\Models\\User',1,'API_TOKEN','db3ebb6a1e74634a91c15479fc6adee9a2a6b97503cbac23f1efaa9aaaa1423a','[\"*\"]','2026-02-06 10:50:46',NULL,'2026-02-06 10:50:45','2026-02-06 10:50:46'),(75,'App\\Models\\User',1,'API_TOKEN','a6148d7db287c1c2b88deb40bc2b356f2627a727501696caad1c9496d719a2a4','[\"*\"]','2026-02-06 10:52:11',NULL,'2026-02-06 10:52:10','2026-02-06 10:52:11'),(76,'App\\Models\\User',1,'API_TOKEN','01039e7c8c370bfa132afe981c5debf28b7c7b0123b06c5ba8ac85a1c69e6816','[\"*\"]','2026-02-06 10:52:26',NULL,'2026-02-06 10:52:26','2026-02-06 10:52:26'),(77,'App\\Models\\User',1,'API_TOKEN','86b1ab6dba2ca25eaae51f593c431c393c029b017fb6617c65e7cf7aeee655c4','[\"*\"]','2026-02-06 15:33:16',NULL,'2026-02-06 15:33:15','2026-02-06 15:33:16'),(78,'App\\Models\\User',1,'API_TOKEN','b349350f50583b2dae2553b74907de38ba0eb057b2daa985628bd6525fc96ca0','[\"*\"]','2026-02-06 15:33:29',NULL,'2026-02-06 15:33:29','2026-02-06 15:33:29');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preparation_commandes`
--

DROP TABLE IF EXISTS `preparation_commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preparation_commandes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `CodePreparation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `commande_id` bigint unsigned NOT NULL,
  `status_preparation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `datePreparationCommande` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `preparation_commandes_commande_id_foreign` (`commande_id`),
  CONSTRAINT `preparation_commandes_commande_id_foreign` FOREIGN KEY (`commande_id`) REFERENCES `commandes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preparation_commandes`
--

LOCK TABLES `preparation_commandes` WRITE;
/*!40000 ALTER TABLE `preparation_commandes` DISABLE KEYS */;
/*!40000 ALTER TABLE `preparation_commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produits`
--

DROP TABLE IF EXISTS `produits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `Code_produit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_quantite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `seuil_alerte` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_initial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `etat_produit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marque` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logoP` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prix_vente` decimal(8,2) DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `categorie_id` bigint unsigned NOT NULL,
  `calibre_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `produits_code_produit_unique` (`Code_produit`),
  KEY `produits_user_id_foreign` (`user_id`),
  KEY `produits_categorie_id_foreign` (`categorie_id`),
  KEY `produits_calibre_id_foreign` (`calibre_id`),
  CONSTRAINT `produits_calibre_id_foreign` FOREIGN KEY (`calibre_id`) REFERENCES `calibre` (`id`) ON DELETE CASCADE,
  CONSTRAINT `produits_categorie_id_foreign` FOREIGN KEY (`categorie_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `produits_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produits`
--

LOCK TABLES `produits` WRITE;
/*!40000 ALTER TABLE `produits` DISABLE KEYS */;
/*!40000 ALTER TABLE `produits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proprietes`
--

DROP TABLE IF EXISTS `proprietes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proprietes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `imprimable_id` bigint unsigned DEFAULT NULL,
  `mois_cloture_id` bigint unsigned DEFAULT NULL,
  `rappel_salaire_id` bigint unsigned DEFAULT NULL,
  `en_activite` tinyint(1) NOT NULL DEFAULT '0',
  `regularisation` tinyint(1) NOT NULL DEFAULT '0',
  `visible` tinyint(1) NOT NULL DEFAULT '0',
  `exclue_net_payer` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `proprietes_imprimable_id_foreign` (`imprimable_id`),
  KEY `proprietes_mois_cloture_id_foreign` (`mois_cloture_id`),
  KEY `proprietes_rappel_salaire_id_foreign` (`rappel_salaire_id`),
  CONSTRAINT `proprietes_imprimable_id_foreign` FOREIGN KEY (`imprimable_id`) REFERENCES `imprimables` (`id`) ON DELETE SET NULL,
  CONSTRAINT `proprietes_mois_cloture_id_foreign` FOREIGN KEY (`mois_cloture_id`) REFERENCES `mois_clotures` (`id`) ON DELETE SET NULL,
  CONSTRAINT `proprietes_rappel_salaire_id_foreign` FOREIGN KEY (`rappel_salaire_id`) REFERENCES `rappel_salaires` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proprietes`
--

LOCK TABLES `proprietes` WRITE;
/*!40000 ALTER TABLE `proprietes` DISABLE KEYS */;
/*!40000 ALTER TABLE `proprietes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rappel_salaires`
--

DROP TABLE IF EXISTS `rappel_salaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rappel_salaires` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rappel_salaires`
--

LOCK TABLES `rappel_salaires` WRITE;
/*!40000 ALTER TABLE `rappel_salaires` DISABLE KEYS */;
/*!40000 ALTER TABLE `rappel_salaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reclamations`
--

DROP TABLE IF EXISTS `reclamations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reclamations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint unsigned NOT NULL,
  `sujet` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_reclamation` datetime NOT NULL,
  `status_reclamation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `traitement_reclamation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `date_traitement` datetime DEFAULT NULL,
  `remarque` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reclamations_client_id_foreign` (`client_id`),
  CONSTRAINT `reclamations_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reclamations`
--

LOCK TABLES `reclamations` WRITE;
/*!40000 ALTER TABLE `reclamations` DISABLE KEYS */;
/*!40000 ALTER TABLE `reclamations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regions`
--

DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `region` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regions`
--

LOCK TABLES `regions` WRITE;
/*!40000 ALTER TABLE `regions` DISABLE KEYS */;
/*!40000 ALTER TABLE `regions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regle_compensation`
--

DROP TABLE IF EXISTS `regle_compensation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regle_compensation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequence_calcul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plafond_hn` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regle_compensation`
--

LOCK TABLES `regle_compensation` WRITE;
/*!40000 ALTER TABLE `regle_compensation` DISABLE KEYS */;
INSERT INTO `regle_compensation` VALUES (1,'Règle 1','Hebdomadaire',12.00,'2025-10-30 08:29:25','2025-10-30 08:29:25'),(2,'pénalité','Hebdomadaire',12.00,'2025-11-02 15:28:46','2025-11-02 15:28:46');
/*!40000 ALTER TABLE `regle_compensation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_user`
--

DROP TABLE IF EXISTS `role_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_user_user_id_role_id_unique` (`user_id`,`role_id`),
  KEY `role_user_role_id_foreign` (`role_id`),
  CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_user`
--

LOCK TABLES `role_user` WRITE;
/*!40000 ALTER TABLE `role_user` DISABLE KEYS */;
INSERT INTO `role_user` VALUES (1,1,1,NULL,NULL),(4,4,2,NULL,NULL);
/*!40000 ALTER TABLE `role_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','2025-10-28 13:32:01','2025-10-28 13:32:01'),(2,'utilisateur','2025-10-28 14:22:34','2025-10-28 14:22:34');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rubriques`
--

DROP TABLE IF EXISTS `rubriques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rubriques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `intitule` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_rubrique` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `memo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_complete` tinyint(1) NOT NULL DEFAULT '0',
  `calculs` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `formule_nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule_base` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule_taux` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formule_montant` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_nombre` tinyint(1) NOT NULL DEFAULT '0',
  `report_base` tinyint(1) NOT NULL DEFAULT '0',
  `report_taux` tinyint(1) NOT NULL DEFAULT '0',
  `report_montant` tinyint(1) NOT NULL DEFAULT '0',
  `impression_nombre` tinyint(1) NOT NULL DEFAULT '0',
  `impression_base` tinyint(1) NOT NULL DEFAULT '0',
  `impression_taux` tinyint(1) NOT NULL DEFAULT '0',
  `impression_montant` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_nombre` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_base` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_taux` tinyint(1) NOT NULL DEFAULT '0',
  `saisie_montant` tinyint(1) NOT NULL DEFAULT '0',
  `group_rubrique_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rubriques_group_rubrique_id_foreign` (`group_rubrique_id`),
  KEY `rubriques_calculs_index` (`calculs`),
  KEY `rubriques_gain_index` (`gain`),
  CONSTRAINT `rubriques_group_rubrique_id_foreign` FOREIGN KEY (`group_rubrique_id`) REFERENCES `group_rubriques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rubriques`
--

LOCK TABLES `rubriques` WRITE;
/*!40000 ALTER TABLE `rubriques` DISABLE KEYS */;
INSERT INTO `rubriques` VALUES (1,'15','test','type1','mémo1',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,1,'2025-11-02 19:43:44','2025-11-02 19:43:45'),(2,'15','test','type1','mémo1',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,0,0,0,0,0,0,0,1,'2025-11-02 19:43:46','2025-11-02 19:43:46');
/*!40000 ALTER TABLE `rubriques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_clients`
--

DROP TABLE IF EXISTS `site_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `CodeSiteclient` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `raison_sociale` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tele` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ville` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abreviation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_postal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ice` int NOT NULL,
  `logoSC` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `zone_id` bigint unsigned NOT NULL,
  `region_id` bigint unsigned NOT NULL,
  `client_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `site_clients_zone_id_foreign` (`zone_id`),
  KEY `site_clients_region_id_foreign` (`region_id`),
  KEY `site_clients_client_id_foreign` (`client_id`),
  CONSTRAINT `site_clients_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `site_clients_region_id_foreign` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `site_clients_zone_id_foreign` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_clients`
--

LOCK TABLES `site_clients` WRITE;
/*!40000 ALTER TABLE `site_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_commandes`
--

DROP TABLE IF EXISTS `status_commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status_commandes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_status` timestamp NOT NULL,
  `commande_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `status_commandes_commande_id_foreign` (`commande_id`),
  CONSTRAINT `status_commandes_commande_id_foreign` FOREIGN KEY (`commande_id`) REFERENCES `commandes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_commandes`
--

LOCK TABLES `status_commandes` WRITE;
/*!40000 ALTER TABLE `status_commandes` DISABLE KEYS */;
/*!40000 ALTER TABLE `status_commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `quantite` bigint unsigned NOT NULL,
  `seuil_minimal` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_produit_id_foreign` (`produit_id`),
  CONSTRAINT `stock_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock__productions`
--

DROP TABLE IF EXISTS `stock__productions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock__productions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `quantite` int NOT NULL,
  `n_lot` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fournisseur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock__productions_produit_id_foreign` (`produit_id`),
  CONSTRAINT `stock__productions_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock__productions`
--

LOCK TABLES `stock__productions` WRITE;
/*!40000 ALTER TABLE `stock__productions` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock__productions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_magasins`
--

DROP TABLE IF EXISTS `stock_magasins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_magasins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `produit_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `quantite` int NOT NULL,
  `n_lot` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fournisseur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_magasins_produit_id_foreign` (`produit_id`),
  CONSTRAINT `stock_magasins_produit_id_foreign` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_magasins`
--

LOCK TABLES `stock_magasins` WRITE;
/*!40000 ALTER TABLE `stock_magasins` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_magasins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_constantes`
--

DROP TABLE IF EXISTS `type_constantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_constantes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_constantes`
--

LOCK TABLES `type_constantes` WRITE;
/*!40000 ALTER TABLE `type_constantes` DISABLE KEYS */;
INSERT INTO `type_constantes` VALUES (1,'type1','2025-10-29 13:08:09','2025-10-29 13:08:09');
/*!40000 ALTER TABLE `type_constantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_rubriques`
--

DROP TABLE IF EXISTS `type_rubriques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_rubriques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_rubriques`
--

LOCK TABLES `type_rubriques` WRITE;
/*!40000 ALTER TABLE `type_rubriques` DISABLE KEYS */;
INSERT INTO `type_rubriques` VALUES (1,'type1','2025-10-31 12:44:44','2025-10-31 12:44:44');
/*!40000 ALTER TABLE `type_rubriques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `types_calculs`
--

DROP TABLE IF EXISTS `types_calculs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `types_calculs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modele_formule` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `champs_requis` json NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `exemple` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ordre` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `categorie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'standard',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `types_calculs_designation_unique` (`designation`),
  KEY `types_calculs_is_active_ordre_index` (`is_active`,`ordre`),
  KEY `types_calculs_categorie_index` (`categorie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `types_calculs`
--

LOCK TABLES `types_calculs` WRITE;
/*!40000 ALTER TABLE `types_calculs` DISABLE KEYS */;
/*!40000 ALTER TABLE `types_calculs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@example.com',NULL,'admin1234',NULL,NULL,'2025-10-28 13:32:01','2025-10-28 13:32:01'),(4,'user2','user2@outlook.com',NULL,'user21234',NULL,NULL,'2025-10-28 14:22:34','2025-10-28 14:25:19');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicule_livreurs`
--

DROP TABLE IF EXISTS `vehicule_livreurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicule_livreurs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `livreur_id` bigint unsigned NOT NULL,
  `vehicule_id` bigint unsigned NOT NULL,
  `date_debut_affectation` date NOT NULL,
  `date_fin_affectation` date DEFAULT NULL,
  `kilometrage_debut` int NOT NULL,
  `kilometrage_fin` int DEFAULT NULL,
  `heure` time NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicule_livreurs_livreur_id_foreign` (`livreur_id`),
  KEY `vehicule_livreurs_vehicule_id_foreign` (`vehicule_id`),
  CONSTRAINT `vehicule_livreurs_livreur_id_foreign` FOREIGN KEY (`livreur_id`) REFERENCES `livreurs` (`id`),
  CONSTRAINT `vehicule_livreurs_vehicule_id_foreign` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicule_livreurs`
--

LOCK TABLES `vehicule_livreurs` WRITE;
/*!40000 ALTER TABLE `vehicule_livreurs` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicule_livreurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicules`
--

DROP TABLE IF EXISTS `vehicules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `marque` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matricule` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacite` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicules_matricule_unique` (`matricule`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicules`
--

LOCK TABLES `vehicules` WRITE;
/*!40000 ALTER TABLE `vehicules` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vis`
--

DROP TABLE IF EXISTS `vis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vis` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_visite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `commentaire` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicule_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vis`
--

LOCK TABLES `vis` WRITE;
/*!40000 ALTER TABLE `vis` DISABLE KEYS */;
/*!40000 ALTER TABLE `vis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zones`
--

DROP TABLE IF EXISTS `zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `zone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zones`
--

LOCK TABLES `zones` WRITE;
/*!40000 ALTER TABLE `zones` DISABLE KEYS */;
/*!40000 ALTER TABLE `zones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-08 16:17:41
