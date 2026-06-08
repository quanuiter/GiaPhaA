-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 08, 2026 at 10:55 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `giaphadb`
--

-- --------------------------------------------------------

--
-- Table structure for table `achievement`
--

CREATE TABLE `achievement` (
  `id` int(11) NOT NULL,
  `memberId` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `level` varchar(191) NOT NULL,
  `year` int(11) NOT NULL,
  `description` text NOT NULL,
  `issuedBy` varchar(200) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `achievement`
--

INSERT INTO `achievement` (`id`, `memberId`, `type`, `level`, `year`, `description`, `issuedBy`, `createdAt`) VALUES
(1, 7, 'education', 'province', 1845, 'Đỗ thi Hương, được phong Thầy đồ dạy học trong vùng', NULL, '2026-04-21 13:31:51.201'),
(2, 21, 'medical', 'local', 1950, 'Được phong danh hiệu \"Lương y từ mẫu\" trong vùng', NULL, '2026-04-21 13:31:51.303'),
(3, 25, 'military', 'national', 1968, 'Huân chương Chiến sĩ vẻ vang hạng Nhất (truy tặng)', 'Nhà nước Việt Nam', '2026-04-21 13:31:51.327'),
(4, 27, 'military', 'national', 1965, 'Huân chương Chiến sĩ giải phóng (truy tặng)', 'Mặt trận Dân tộc Giải phóng', '2026-04-21 13:31:51.333'),
(5, 33, 'education', 'national', 1983, 'Tốt nghiệp Kỹ sư loại Giỏi Đại học Bách khoa Hà Nội', 'Đại học Bách khoa Hà Nội', '2026-04-21 13:31:51.356'),
(6, 38, 'business', 'province', 2005, 'Doanh nhân tiêu biểu tỉnh Thanh Hóa', 'UBND tỉnh Thanh Hóa', '2026-04-21 13:31:51.368'),
(7, 42, 'teaching', 'national', 2010, 'Nhà giáo Ưu tú', 'Bộ Giáo dục và Đào tạo', '2026-04-21 13:31:51.373'),
(8, 43, 'business', 'province', 2022, 'Giải Nhì cuộc thi Startup Việt Nam', 'Bộ KH&CN', '2026-04-21 13:31:51.378'),
(9, 45, 'art', 'province', 2026, 'Múa', 'UBNDT', '2026-06-08 06:40:13.650'),
(10, 51, 'sport', 'province', 2026, '123', '', '2026-06-08 08:12:13.809');

-- --------------------------------------------------------

--
-- Table structure for table `auditlog`
--

CREATE TABLE `auditlog` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `memberId` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `tableName` varchar(50) NOT NULL,
  `recordId` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `treeId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `value` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `treeId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `type`, `value`, `label`, `isActive`, `sortOrder`, `treeId`) VALUES
(1, 'hometown', 'hanoi', 'Hà Nội', 1, 0, 1),
(2, 'hometown', 'hochiminh', 'TP. Hồ Chí Minh', 1, 1, 1),
(3, 'hometown', 'danang', 'Đà Nẵng', 1, 2, 1),
(4, 'hometown', 'haiphong', 'Hải Phòng', 1, 3, 1),
(5, 'hometown', 'cantho', 'Cần Thơ', 1, 4, 1),
(7, 'occupation', 'farmer', 'Nông dân', 1, 0, 1),
(8, 'occupation', 'worker', 'Công nhân', 1, 1, 1),
(9, 'occupation', 'teacher', 'Giáo viên', 1, 2, 1),
(10, 'occupation', 'doctor', 'Bác sĩ', 1, 3, 1),
(11, 'occupation', 'engineer', 'Kỹ sư', 1, 4, 1),
(12, 'occupation', 'business', 'Kinh doanh', 1, 5, 1),
(13, 'occupation', 'military', 'Quân nhân', 1, 6, 1),
(14, 'occupation', 'retired', 'Nghỉ hưu', 1, 7, 1),
(15, 'occupation', 'student', 'Sinh viên / Học sinh', 1, 8, 1),
(17, 'marital_status', 'living', 'Đang sống chung', 1, 0, 1),
(18, 'marital_status', 'divorced', 'Ly hôn', 1, 1, 1),
(19, 'marital_status', 'widowed', 'Góa', 1, 2, 1),
(20, 'achievement_type', 'education', 'Giáo dục', 1, 0, 1),
(21, 'achievement_type', 'sport', 'Thể thao', 1, 1, 1),
(22, 'achievement_type', 'art', 'Nghệ thuật', 1, 2, 1),
(23, 'achievement_type', 'science', 'Khoa học', 1, 3, 1),
(24, 'achievement_type', 'business', 'Kinh Doanh', 1, 4, 1),
(25, 'achievement_type', 'social', 'Cống hiến xã hội', 1, 5, 1),
(26, 'achievement_type', 'military', 'Quân sự', 1, 6, 1),
(27, 'achievement_type', 'medical', 'Y tế', 1, 7, 1),
(28, 'achievement_type', 'teaching', 'Giáo dục', 1, 8, 1),
(30, 'achievement_level', 'local', 'Cơ sở', 1, 0, 1),
(31, 'achievement_level', 'province', 'Tỉnh / Thành phố', 1, 1, 1),
(32, 'achievement_level', 'national', 'Quốc gia', 1, 2, 1),
(33, 'death_cause', 'natural', 'Bệnh tự nhiên', 1, 0, 1),
(34, 'death_cause', 'accident_traffic', 'Tai nạn giao thông', 1, 1, 1),
(35, 'death_cause', 'accident_work', 'Tai nạn lao động', 1, 2, 1),
(36, 'death_cause', 'critical_illness', 'Bệnh hiểm nghèo', 1, 3, 1),
(37, 'death_cause', 'old_age', 'Tuổi già', 1, 4, 1),
(38, 'death_cause', 'sudden_death', 'Đột tử', 1, 5, 1),
(39, 'death_cause', 'natural_disaster', 'Thiên tai', 1, 6, 1),
(40, 'death_cause', 'epidemic', 'Dịch bệnh', 1, 7, 1),
(41, 'death_cause', 'surgery', 'Phẫu thuật', 1, 8, 1),
(42, 'death_cause', 'war', 'Chiến tranh', 1, 9, 1),
(43, 'death_cause', 'poisoning', 'Ngộ độc', 1, 10, 1),
(45, 'burial_place', 'cemetery', 'Nghĩa trang', 1, 0, 1),
(46, 'burial_place', 'temple', 'Chùa / Nhà thờ', 1, 1, 1),
(47, 'burial_place', 'home', 'Tại gia', 1, 2, 1),
(49, 'event_type', 'anniversary', 'Ngày giỗ', 1, 1, 1),
(51, 'event_type', 'hoilang', 'Hội Làng', 1, 3, 1),
(52, 'event_type', 'Lienhoan', 'Liên hoan', 1, 4, 1),
(53, 'hometown', 'dongnai', 'Đồng Nai', 1, 5, 1);

-- --------------------------------------------------------

--
-- Table structure for table `death`
--

CREATE TABLE `death` (
  `id` int(11) NOT NULL,
  `memberId` int(11) NOT NULL,
  `deathDate` datetime(3) NOT NULL,
  `cause` varchar(191) NOT NULL DEFAULT 'natural',
  `burialPlace` varchar(191) NOT NULL DEFAULT 'cemetery',
  `longevity` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `death`
--

INSERT INTO `death` (`id`, `memberId`, `deathDate`, `cause`, `burialPlace`, `longevity`, `note`, `createdAt`) VALUES
(1, 1, '1845-05-10 00:00:00.000', 'old_age', 'cemetery', 77, 'Thủy Tổ dòng họ Ngô', '2026-04-21 13:31:51.130'),
(2, 2, '1850-11-22 00:00:00.000', 'old_age', 'cemetery', 78, NULL, '2026-04-21 13:31:51.137'),
(3, 3, '1870-03-18 00:00:00.000', 'old_age', 'cemetery', 77, NULL, '2026-04-21 13:31:51.148'),
(4, 4, '1875-08-05 00:00:00.000', 'old_age', 'cemetery', 79, NULL, '2026-04-21 13:31:51.151'),
(5, 5, '1818-06-12 00:00:00.000', 'critical_illness', 'cemetery', 22, 'Mất trẻ do bệnh phổi', '2026-04-21 13:31:51.156'),
(6, 6, '1878-10-15 00:00:00.000', 'old_age', 'cemetery', 78, NULL, '2026-04-21 13:31:51.161'),
(7, 7, '1898-07-20 00:00:00.000', 'old_age', 'temple', 76, NULL, '2026-04-21 13:31:51.188'),
(8, 8, '1903-01-10 00:00:00.000', 'old_age', 'temple', 78, NULL, '2026-04-21 13:31:51.195'),
(9, 9, '1903-06-12 00:00:00.000', 'old_age', 'cemetery', 77, NULL, '2026-04-21 13:31:51.209'),
(10, 11, '1882-04-10 00:00:00.000', 'critical_illness', 'cemetery', 30, 'Mất sớm do bệnh hiểm nghèo', '2026-04-21 13:31:51.221'),
(11, 10, '1924-11-05 00:00:00.000', 'old_age', 'cemetery', 75, NULL, '2026-04-21 13:31:51.229'),
(12, 12, '1935-09-15 00:00:00.000', 'old_age', 'cemetery', 77, NULL, '2026-04-21 13:31:51.237'),
(13, 13, '1933-08-15 00:00:00.000', 'old_age', 'cemetery', 78, NULL, '2026-04-21 13:31:51.246'),
(14, 14, '1950-07-22 00:00:00.000', 'old_age', 'cemetery', 75, NULL, '2026-04-21 13:31:51.257'),
(15, 15, '1955-02-25 00:00:00.000', 'old_age', 'cemetery', 77, NULL, '2026-04-21 13:31:51.261'),
(16, 16, '1960-11-05 00:00:00.000', 'old_age', 'cemetery', 74, NULL, '2026-04-21 13:31:51.269'),
(17, 17, '1965-08-20 00:00:00.000', 'old_age', 'cemetery', 76, NULL, '2026-04-21 13:31:51.272'),
(18, 18, '1968-06-30 00:00:00.000', 'old_age', 'cemetery', 78, NULL, '2026-04-21 13:31:51.277'),
(19, 19, '1945-03-15 00:00:00.000', 'epidemic', 'cemetery', 42, 'Mất trong nạn đói Ất Dậu 1945', '2026-04-21 13:31:51.284'),
(20, 20, '1987-12-05 00:00:00.000', 'old_age', 'cemetery', 80, NULL, '2026-04-21 13:31:51.286'),
(21, 21, '1984-04-10 00:00:00.000', 'old_age', 'temple', 78, NULL, '2026-04-21 13:31:51.295'),
(22, 22, '1990-11-10 00:00:00.000', 'old_age', 'temple', 80, NULL, '2026-04-21 13:31:51.298'),
(23, 23, '1986-02-28 00:00:00.000', 'old_age', 'cemetery', 78, NULL, '2026-04-21 13:31:51.308'),
(24, 24, '1988-05-20 00:00:00.000', 'old_age', 'cemetery', 76, NULL, '2026-04-21 13:31:51.312'),
(25, 25, '1968-02-15 00:00:00.000', 'war', 'cemetery', 38, 'Liệt sĩ chống Mỹ, mặt trận Quảng Trị', '2026-04-21 13:31:51.322'),
(26, 26, '2018-08-10 00:00:00.000', 'old_age', 'cemetery', 84, NULL, '2026-04-21 13:31:51.325'),
(27, 27, '1965-11-08 00:00:00.000', 'war', 'cemetery', 32, 'Liệt sĩ chống Mỹ, chưa lập gia đình', '2026-04-21 13:31:51.330'),
(28, 28, '2020-03-20 00:00:00.000', 'old_age', 'cemetery', 84, NULL, '2026-04-21 13:31:51.336'),
(29, 29, '1975-05-10 00:00:00.000', 'accident_work', 'cemetery', 37, 'Tai nạn lao động tại nhà máy', '2026-04-21 13:31:51.339'),
(30, 30, '2015-09-15 00:00:00.000', 'old_age', 'cemetery', 78, NULL, '2026-04-21 13:31:51.346'),
(31, 51, '2026-06-08 05:12:00.000', 'Bệnh tự nhiên', 'Nghĩa trang', 3, '123', '2026-06-08 08:12:03.221'),
(32, 45, '2026-05-31 23:06:00.000', '', '', 34, '', '2026-06-08 08:31:27.697');

-- --------------------------------------------------------

--
-- Table structure for table `familyevent`
--

CREATE TABLE `familyevent` (
  `id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `name` varchar(200) NOT NULL,
  `lunarDate` varchar(20) DEFAULT NULL,
  `eventDate` datetime(3) NOT NULL,
  `location` varchar(300) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `relatedMemberId` int(11) DEFAULT NULL,
  `canDelete` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `treeId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `familyevent`
--

INSERT INTO `familyevent` (`id`, `type`, `name`, `lunarDate`, `eventDate`, `location`, `note`, `relatedMemberId`, `canDelete`, `createdAt`, `treeId`) VALUES
(1, 'anniversary', 'Ngày giỗ: Ngô Phúc Tổ', '5/4', '1845-05-10 00:00:00.000', NULL, 'Giỗ Thủy Tổ dòng họ Ngô', 1, 0, '2026-04-21 13:31:51.400', 1),
(2, 'anniversary', 'Ngày giỗ: Ngô Văn Thành', '18/1', '1968-02-15 00:00:00.000', NULL, 'Liệt sĩ chống Mỹ', 25, 0, '2026-04-21 13:31:51.401', 1),
(3, 'anniversary', 'Ngày giỗ: Ngô Văn Vinh', '15/10', '1965-11-08 00:00:00.000', NULL, 'Liệt sĩ chống Mỹ', 27, 0, '2026-04-21 13:31:51.402', 1),
(4, 'anniversary', 'Ngày giỗ: Ngô Văn Hưng', '2/2', '1945-03-15 00:00:00.000', NULL, 'Mất trong nạn đói 1945', 19, 0, '2026-04-21 13:31:51.404', 1),
(5, 'meeting', 'Họp họ thường niên 2026', NULL, '2026-02-01 00:00:00.000', 'Nhà thờ họ Ngô, Hoằng Lộc, Hoằng Hóa, Thanh Hóa', 'Họp họ đầu xuân Bính Ngọ', NULL, 1, '2026-04-21 13:31:51.405', 1),
(6, 'meeting', 'Lễ Thanh minh 2026', NULL, '2026-04-04 00:00:00.000', 'Nghĩa trang dòng họ, Hoằng Hóa, Thanh Hóa', 'Tảo mộ thanh minh', NULL, 1, '2026-04-21 13:31:51.406', 1),
(7, 'other', 'Trùng tu nhà thờ họ', NULL, '2025-06-15 00:00:00.000', 'Nhà thờ họ Ngô, Hoằng Lộc', 'Dự kiến hoàn thành cuối năm 2025', NULL, 1, '2026-04-21 13:31:51.407', 1),
(8, 'other', 'Kỷ niệm 200 năm thành lập họ', '11/05/2026', '2026-06-25 00:00:00.000', 'Nhà thờ tổ', '', NULL, 1, '2026-05-31 15:04:40.962', 1),
(9, 'Họp họ', 'dadasd', '11/05/2026', '2026-06-25 00:00:00.000', '', '', NULL, 1, '2026-06-03 13:52:30.357', 3),
(10, 'anniversary', 'Ngày giỗ: Ngô Minh Châu', NULL, '2026-06-08 05:12:00.000', NULL, 'Tự động tạo từ ngày mất', 51, 0, '2026-06-08 08:12:03.225', 1),
(11, 'anniversary', 'Ngày giỗ: Ngô Thị Mai', NULL, '2026-05-31 23:06:00.000', NULL, 'Tự động tạo từ ngày mất', 45, 0, '2026-06-08 08:31:27.702', 1);

-- --------------------------------------------------------

--
-- Table structure for table `familytree`
--

CREATE TABLE `familytree` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `logoUrl` varchar(500) DEFAULT NULL,
  `bannerUrl` varchar(500) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `createdBy` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `familytree`
--

INSERT INTO `familytree` (`id`, `name`, `description`, `logoUrl`, `bannerUrl`, `status`, `createdBy`, `createdAt`, `updatedAt`) VALUES
(1, 'Gia Phả Họ Ngô', 'Gia phả dòng họ Ngô — quê gốc Hoằng Hóa, Thanh Hóa. Truy nguyên từ thế kỷ 18.', NULL, NULL, 'active', 1, '2026-04-21 13:31:51.117', '2026-04-21 13:31:51.117'),
(3, 'Gia Phả Họ Nguyễn', '', NULL, NULL, 'active', 1, '2026-05-26 02:03:26.011', '2026-05-26 02:03:26.011');

-- --------------------------------------------------------

--
-- Table structure for table `marriage`
--

CREATE TABLE `marriage` (
  `id` int(11) NOT NULL,
  `husbandId` int(11) NOT NULL,
  `wifeId` int(11) NOT NULL,
  `marriageDate` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'living',
  `divorceDate` datetime(3) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `treeId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `marriage`
--

INSERT INTO `marriage` (`id`, `husbandId`, `wifeId`, `marriageDate`, `status`, `divorceDate`, `note`, `createdAt`, `updatedAt`, `treeId`) VALUES
(1, 1, 2, '1790-01-15 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.128', '2026-04-21 13:31:51.128', 1),
(2, 3, 4, '1818-01-10 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.145', '2026-04-21 13:31:51.145', 1),
(3, 7, 8, '1846-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.173', '2026-04-21 13:31:51.173', 1),
(4, 10, 11, '1872-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.220', '2026-04-21 13:31:51.220', 1),
(5, 10, 12, '1884-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.227', '2026-04-21 13:31:51.227', 1),
(6, 14, 15, '1900-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.255', '2026-04-21 13:31:51.255', 1),
(7, 16, 17, '1910-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.268', '2026-04-21 13:31:51.268', 1),
(8, 19, 20, '1928-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.283', '2026-04-21 13:31:51.283', 1),
(9, 21, 22, '1933-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.293', '2026-04-21 13:31:51.293', 1),
(10, 25, 26, '1956-01-15 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.321', '2026-04-21 13:31:51.321', 1),
(11, 30, 31, '1963-01-01 00:00:00.000', 'widowed', NULL, NULL, '2026-04-21 13:31:51.345', '2026-04-21 13:31:51.345', 1),
(12, 33, 34, '1985-05-01 00:00:00.000', 'living', NULL, NULL, '2026-04-21 13:31:51.354', '2026-04-21 13:31:51.354', 1),
(13, 36, 35, '1983-06-01 00:00:00.000', 'divorced', '1990-03-15 00:00:00.000', 'Ly hôn do bất đồng quan điểm sống', '2026-04-21 13:31:51.362', '2026-04-21 13:31:51.362', 1),
(14, 37, 35, '1993-01-10 00:00:00.000', 'living', NULL, NULL, '2026-04-21 13:31:51.363', '2026-04-21 13:31:51.363', 1),
(15, 38, 39, '1990-06-01 00:00:00.000', 'divorced', '2026-06-01 00:00:00.000', '', '2026-04-21 13:31:51.367', '2026-06-08 08:19:01.404', 1),
(16, 40, 41, '1992-01-01 00:00:00.000', 'living', NULL, NULL, '2026-04-21 13:31:51.371', '2026-04-21 13:31:51.371', 1),
(17, 43, 44, '2017-12-25 00:00:00.000', 'living', NULL, NULL, '2026-04-21 13:31:51.377', '2026-04-21 13:31:51.377', 1),
(18, 46, 47, '2020-05-01 00:00:00.000', 'living', NULL, NULL, '2026-04-21 13:31:51.384', '2026-04-21 13:31:51.384', 1),
(19, 48, 49, '2021-06-15 00:00:00.000', 'living', NULL, NULL, '2026-04-21 13:31:51.388', '2026-04-21 13:31:51.388', 1),
(22, 66, 51, '2026-06-08 00:00:00.000', 'living', NULL, NULL, '2026-06-08 08:14:24.886', '2026-06-08 08:14:24.886', 1);

-- --------------------------------------------------------

--
-- Table structure for table `member`
--

CREATE TABLE `member` (
  `id` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `gender` varchar(191) NOT NULL,
  `birthDate` datetime(3) DEFAULT NULL,
  `birthPlace` varchar(200) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `hometown` varchar(200) DEFAULT NULL,
  `generation` int(11) NOT NULL DEFAULT 1,
  `avatarUrl` varchar(500) DEFAULT NULL,
  `isDeceased` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `fatherId` int(11) DEFAULT NULL,
  `motherId` int(11) DEFAULT NULL,
  `treeId` int(11) NOT NULL,
  `address` varchar(300) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `birthDateLunar` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `isAdopted` tinyint(1) NOT NULL DEFAULT 0,
  `phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `member`
--

INSERT INTO `member` (`id`, `fullName`, `nickname`, `gender`, `birthDate`, `birthPlace`, `occupation`, `hometown`, `generation`, `avatarUrl`, `isDeceased`, `createdAt`, `updatedAt`, `fatherId`, `motherId`, `treeId`, `address`, `bio`, `birthDateLunar`, `email`, `isAdopted`, `phone`) VALUES
(1, 'Ngô Phúc Tổ', NULL, 'male', '1768-03-15 00:00:00.000', 'Hoằng Hóa, Thanh Hóa', 'Nông dân', 'Thanh Hóa', 1, '/uploads/1778389539765.png', 1, '2026-04-21 13:31:51.124', '2026-05-10 05:05:39.772', NULL, NULL, 1, NULL, 'Thủy Tổ dòng họ Ngô, khai cơ lập nghiệp tại Hoằng Hóa, Thanh Hóa.', NULL, NULL, 0, NULL),
(2, 'Trần Thị Ngọc', NULL, 'female', '1772-08-20 00:00:00.000', NULL, NULL, 'Thanh Hóa', 1, NULL, 1, '2026-04-21 13:31:51.125', '2026-04-21 13:31:51.139', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(3, 'Ngô Văn Đức', NULL, 'male', '1793-06-10 00:00:00.000', NULL, 'Nông dân', 'Thanh Hóa', 2, NULL, 1, '2026-04-21 13:31:51.142', '2026-04-21 13:31:51.150', 1, 2, 1, NULL, 'Trưởng nam, nối nghiệp cha trông coi ruộng vườn dòng tộc.', NULL, NULL, 0, NULL),
(4, 'Lê Thị Hoa', NULL, 'female', '1796-02-18 00:00:00.000', NULL, NULL, 'Nghệ An', 2, NULL, 1, '2026-04-21 13:31:51.144', '2026-04-21 13:31:51.153', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(5, 'Ngô Văn Hiền', NULL, 'male', '1796-09-01 00:00:00.000', NULL, NULL, 'Thanh Hóa', 2, NULL, 1, '2026-04-21 13:31:51.154', '2026-04-21 13:31:51.157', 1, 2, 1, NULL, 'Mất sớm do bệnh, chưa lập gia đình.', NULL, NULL, 0, NULL),
(6, 'Ngô Thị Lan', NULL, 'female', '1800-12-25 00:00:00.000', NULL, NULL, 'Thanh Hóa', 2, NULL, 1, '2026-04-21 13:31:51.159', '2026-04-21 13:31:51.162', 1, 2, 1, NULL, 'Gả về họ Phạm ở Ninh Bình.', NULL, NULL, 0, NULL),
(7, 'Ngô Văn Trung', NULL, 'male', '1822-03-15 00:00:00.000', NULL, 'Thầy đồ', 'Thanh Hóa', 3, NULL, 1, '2026-04-21 13:31:51.164', '2026-04-21 13:31:51.191', 3, 4, 1, NULL, 'Đỗ thi Hương, dạy chữ Hán trong làng.', NULL, NULL, 0, NULL),
(8, 'Phạm Thị Mai', NULL, 'female', '1825-07-08 00:00:00.000', NULL, NULL, 'Ninh Bình', 3, NULL, 1, '2026-04-21 13:31:51.166', '2026-04-21 13:31:51.197', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(9, 'Ngô Thị Bích', NULL, 'female', '1826-05-30 00:00:00.000', NULL, NULL, 'Thanh Hóa', 3, NULL, 1, '2026-04-21 13:31:51.205', '2026-04-21 13:31:51.211', 3, 4, 1, NULL, 'Gả về họ Lê ở Nghệ An.', NULL, NULL, 0, NULL),
(10, 'Ngô Văn Khánh', NULL, 'male', '1849-02-14 00:00:00.000', NULL, 'Thương nhân', 'Thanh Hóa', 4, NULL, 1, '2026-04-21 13:31:51.214', '2026-04-21 13:31:51.233', 7, 8, 1, NULL, 'Buôn bán đường dài Thanh Hóa – Thăng Long. Vợ cả mất sớm, tục huyền vợ thứ.', NULL, NULL, 0, NULL),
(11, 'Nguyễn Thị Duyên', NULL, 'female', '1852-08-30 00:00:00.000', NULL, NULL, 'Hà Nội', 4, NULL, 1, '2026-04-21 13:31:51.217', '2026-04-21 13:31:51.223', NULL, NULL, 1, NULL, 'Vợ cả ông Khánh, mất sớm do bệnh.', NULL, NULL, 0, NULL),
(12, 'Bùi Thị Nhàn', NULL, 'female', '1858-03-05 00:00:00.000', NULL, NULL, 'Thanh Hóa', 4, NULL, 1, '2026-04-21 13:31:51.225', '2026-04-21 13:31:51.240', NULL, NULL, 1, NULL, 'Vợ kế ông Khánh, hết lòng nuôi cả con chồng.', NULL, NULL, 0, NULL),
(13, 'Ngô Thị Sen', NULL, 'female', '1855-11-20 00:00:00.000', NULL, NULL, 'Thanh Hóa', 4, NULL, 1, '2026-04-21 13:31:51.243', '2026-04-21 13:31:51.249', 7, 8, 1, NULL, NULL, NULL, NULL, 0, NULL),
(14, 'Ngô Văn Lợi', NULL, 'male', '1875-05-18 00:00:00.000', NULL, 'Nông dân', 'Thanh Hóa', 5, NULL, 1, '2026-04-21 13:31:51.252', '2026-04-21 13:31:51.259', 10, 11, 1, NULL, 'Con vợ cả, trưởng nam nối dõi.', NULL, NULL, 0, NULL),
(15, 'Vũ Thị Thơ', NULL, 'female', '1878-04-02 00:00:00.000', NULL, NULL, 'Nghệ An', 5, NULL, 1, '2026-04-21 13:31:51.254', '2026-04-21 13:31:51.263', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(16, 'Ngô Văn Phú', NULL, 'male', '1886-09-12 00:00:00.000', NULL, 'Thương nhân', 'Thanh Hóa', 5, NULL, 1, '2026-04-21 13:31:51.265', '2026-04-21 13:31:51.270', 10, 12, 1, NULL, 'Con vợ thứ, theo nghiệp buôn bán của cha.', NULL, NULL, 0, NULL),
(17, 'Trương Thị Liễu', NULL, 'female', '1889-05-10 00:00:00.000', NULL, NULL, 'Thanh Hóa', 5, NULL, 1, '2026-04-21 13:31:51.266', '2026-04-21 13:31:51.273', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(18, 'Ngô Thị Hạnh', NULL, 'female', '1890-01-25 00:00:00.000', NULL, NULL, 'Thanh Hóa', 5, NULL, 1, '2026-04-21 13:31:51.275', '2026-04-21 13:31:51.278', 10, 12, 1, NULL, 'Gả về họ Hoàng ở Hà Tĩnh.', NULL, NULL, 0, NULL),
(19, 'Ngô Văn Hưng', NULL, 'male', '1903-04-25 00:00:00.000', NULL, 'Nông dân', 'Thanh Hóa', 6, NULL, 1, '2026-04-21 13:31:51.280', '2026-04-21 13:31:51.285', 14, 15, 1, NULL, 'Mất trong nạn đói Ất Dậu 1945, để lại vợ góa nuôi 4 con nhỏ.', '10/3 Quý Mão', NULL, 0, NULL),
(20, 'Nguyễn Thị Lệ', NULL, 'female', '1907-10-08 00:00:00.000', NULL, NULL, 'Thanh Hóa', 6, NULL, 1, '2026-04-21 13:31:51.281', '2026-04-21 13:31:51.288', NULL, NULL, 1, NULL, 'Góa chồng năm 38 tuổi, một mình nuôi 4 con trưởng thành.', NULL, NULL, 0, NULL),
(21, 'Ngô Văn Tâm', NULL, 'male', '1906-08-20 00:00:00.000', NULL, 'Thầy thuốc', 'Thanh Hóa', 6, NULL, 1, '2026-04-21 13:31:51.290', '2026-04-21 13:31:51.296', 14, 15, 1, NULL, 'Thầy thuốc Đông y, chữa bệnh cho dân làng.', NULL, NULL, 0, NULL),
(22, 'Đào Thị Minh', NULL, 'female', '1910-04-15 00:00:00.000', NULL, NULL, 'Thanh Hóa', 6, NULL, 1, '2026-04-21 13:31:51.291', '2026-04-21 13:31:51.300', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(23, 'Ngô Thị Phương', NULL, 'female', '1908-06-14 00:00:00.000', NULL, NULL, 'Thanh Hóa', 6, NULL, 1, '2026-04-21 13:31:51.306', '2026-04-21 13:31:51.309', 14, 15, 1, NULL, 'Gả về họ Lê ở Hà Nội.', NULL, NULL, 0, NULL),
(24, 'Ngô Văn Quang', NULL, 'male', '1912-11-08 00:00:00.000', NULL, 'Thợ mộc', 'Thanh Hóa', 6, NULL, 1, '2026-04-21 13:31:51.311', '2026-04-21 13:31:51.314', 16, 17, 1, NULL, 'Nhánh con ông Phú, nghệ nhân đồ gỗ.', NULL, NULL, 0, NULL),
(25, 'Ngô Văn Thành', NULL, 'male', '1930-01-10 00:00:00.000', NULL, 'Quân nhân', 'Thanh Hóa', 7, NULL, 1, '2026-04-21 13:31:51.316', '2026-04-21 13:31:51.323', 19, 20, 1, NULL, 'Tham gia kháng chiến chống Mỹ, hy sinh anh dũng tại mặt trận Quảng Trị.', '12/12 Kỷ Tỵ', NULL, 0, NULL),
(26, 'Hoàng Thị Lý', NULL, 'female', '1934-06-18 00:00:00.000', NULL, NULL, 'Hà Nội', 7, NULL, 1, '2026-04-21 13:31:51.319', '2026-04-21 13:31:51.326', NULL, NULL, 1, NULL, 'Góa chồng liệt sĩ, một mình nuôi con khôn lớn.', NULL, NULL, 0, NULL),
(27, 'Ngô Văn Vinh', NULL, 'male', '1933-03-22 00:00:00.000', NULL, 'Quân nhân', 'Thanh Hóa', 7, NULL, 1, '2026-04-21 13:31:51.329', '2026-04-21 13:31:51.332', 19, 20, 1, NULL, 'Hy sinh tại chiến trường miền Nam, chưa kịp lập gia đình.', NULL, NULL, 0, NULL),
(28, 'Ngô Thị Hòa', NULL, 'female', '1936-07-15 00:00:00.000', NULL, NULL, 'Thanh Hóa', 7, NULL, 1, '2026-04-21 13:31:51.334', '2026-04-21 13:31:51.337', 19, 20, 1, NULL, 'Gả về họ Trần ở Nghệ An.', NULL, NULL, 0, NULL),
(29, 'Ngô Văn Dương', NULL, 'male', '1938-12-05 00:00:00.000', NULL, 'Công nhân', 'Thanh Hóa', 7, NULL, 1, '2026-04-21 13:31:51.338', '2026-04-21 13:31:51.340', 19, 20, 1, NULL, 'Làm công nhân nhà máy, mất do tai nạn lao động.', NULL, NULL, 0, NULL),
(30, 'Ngô Văn Đạo', NULL, 'male', '1937-05-22 00:00:00.000', NULL, 'Giáo viên', 'Thanh Hóa', 7, NULL, 1, '2026-04-21 13:31:51.341', '2026-04-21 13:31:51.348', 21, 22, 1, NULL, 'Giáo viên cấp 2, dạy Toán và Lý.', NULL, NULL, 0, NULL),
(31, 'Lê Thị Vân', NULL, 'female', '1940-09-10 00:00:00.000', NULL, NULL, 'Nghệ An', 7, NULL, 0, '2026-04-21 13:31:51.343', '2026-04-21 13:31:51.343', NULL, NULL, 1, NULL, 'Hiện sống cùng con trai tại Thanh Hóa.', NULL, NULL, 0, NULL),
(32, 'Ngô Thị Cúc', NULL, 'female', '1940-11-30 00:00:00.000', NULL, NULL, 'Thanh Hóa', 7, NULL, 0, '2026-04-21 13:31:51.350', '2026-04-21 13:31:51.350', 21, 22, 1, NULL, 'Gả về họ Đặng ở Hà Nội. Hiện còn sống, 86 tuổi.', NULL, NULL, 0, NULL),
(33, 'Ngô Văn Hùng', NULL, 'male', '1958-07-15 00:00:00.000', NULL, 'Kỹ sư', 'Thanh Hóa', 8, NULL, 0, '2026-04-21 13:31:51.351', '2026-04-21 13:31:51.351', 25, 26, 1, '45 Lê Lai, TP. Thanh Hóa', 'Kỹ sư xây dựng, tốt nghiệp Đại học Bách khoa Hà Nội.', NULL, 'ngohung@example.com', 0, '0912345001'),
(34, 'Phạm Thị Ngân', NULL, 'female', '1962-03-20 00:00:00.000', NULL, 'Giáo viên', 'Hà Nội', 8, NULL, 0, '2026-04-21 13:31:51.353', '2026-04-21 13:31:51.353', NULL, NULL, 1, NULL, NULL, NULL, 'pngan@example.com', 0, '0912345002'),
(35, 'Ngô Thị Hạnh', NULL, 'female', '1960-10-12 00:00:00.000', NULL, 'Kế toán', 'Thanh Hóa', 8, NULL, 0, '2026-04-21 13:31:51.357', '2026-04-21 13:31:51.357', 25, 26, 1, NULL, 'Ly hôn chồng đầu (1990), tái hôn hạnh phúc (1993).', NULL, NULL, 0, '0912345003'),
(36, 'Lý Văn Bình', NULL, 'male', '1958-02-28 00:00:00.000', NULL, 'Công nhân', 'Hà Nội', 8, NULL, 0, '2026-04-21 13:31:51.359', '2026-04-21 13:31:51.359', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(37, 'Trương Văn Đại', NULL, 'male', '1960-08-15 00:00:00.000', NULL, 'Kỹ sư', 'Thanh Hóa', 8, NULL, 0, '2026-04-21 13:31:51.360', '2026-04-21 13:31:51.360', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(38, 'Ngô Văn Tình', NULL, 'male', '1963-01-05 00:00:00.000', NULL, 'Kinh doanh', 'Thanh Hóa', 8, NULL, 0, '2026-04-21 13:31:51.364', '2026-04-21 13:31:51.364', 25, 26, 1, NULL, 'Con nuôi bà Lý, gốc họ Trần. Được nhận nuôi từ nhỏ do cha mẹ ruột mất sớm.', NULL, 'ngotinh@example.com', 1, '0912345004'),
(39, 'Bùi Thị Lan', NULL, 'female', '1966-07-22 00:00:00.000', NULL, NULL, 'Hà Nội', 8, NULL, 0, '2026-04-21 13:31:51.366', '2026-04-21 13:31:51.366', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(40, 'Ngô Văn Nam', NULL, 'male', '1965-04-18 00:00:00.000', NULL, 'Nông dân', 'Thanh Hóa', 8, NULL, 0, '2026-04-21 13:31:51.369', '2026-04-21 13:31:51.369', 30, 31, 1, NULL, 'Ở lại quê canh tác ruộng vườn, chăm sóc mẹ già.', NULL, NULL, 0, '0912345005'),
(41, 'Trần Thị Hoa', NULL, 'female', '1968-09-05 00:00:00.000', NULL, NULL, 'Thanh Hóa', 8, NULL, 0, '2026-04-21 13:31:51.370', '2026-04-21 13:31:51.370', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(42, 'Ngô Thị Xuân', NULL, 'female', '1967-03-28 00:00:00.000', NULL, 'Giáo viên', 'Hà Nội', 8, NULL, 0, '2026-04-21 13:31:51.372', '2026-04-21 13:31:51.372', 30, 31, 1, '78 Hoàng Hoa Thám, Hà Nội', 'Sống độc thân, cống hiến cho ngành giáo dục. Nhận danh hiệu Nhà giáo Ưu tú.', NULL, 'ngoxuan@example.com', 0, '0912345006'),
(43, 'Ngô Văn Minh', NULL, 'male', '1988-11-08 00:00:00.000', NULL, 'Kỹ sư IT', 'Thanh Hóa', 9, NULL, 0, '2026-04-21 13:31:51.374', '2026-04-21 13:31:51.374', 33, 34, 1, '120 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'Giám đốc startup công nghệ, tốt nghiệp ĐH Bách khoa HN.', NULL, 'ngominh@example.com', 0, '0988001001'),
(44, 'Trần Thị Trang', NULL, 'female', '1991-05-15 00:00:00.000', NULL, 'Dược sĩ', 'Hà Nội', 9, NULL, 0, '2026-04-21 13:31:51.376', '2026-04-21 13:31:51.376', NULL, NULL, 1, NULL, NULL, NULL, 'trang.tt@example.com', 0, '0988001002'),
(45, 'Ngô Thị Mai', NULL, 'female', '1992-08-20 00:00:00.000', NULL, 'Kiến trúc sư', 'Hà Nội', 9, NULL, 1, '2026-04-21 13:31:51.379', '2026-06-08 08:31:27.700', 33, 34, 1, '50 Kim Mã, Ba Đình, Hà Nội', 'Kiến trúc sư, đang tập trung phát triển sự nghiệp.', NULL, 'maiarchitect@example.com', 0, '0988001003'),
(46, 'Ngô Gia Khang', NULL, 'male', '1993-06-10 00:00:00.000', NULL, 'Doanh nhân', 'Thanh Hóa', 9, NULL, 0, '2026-04-21 13:31:51.381', '2026-04-21 13:31:51.381', 38, 39, 1, NULL, 'Nối nghiệp kinh doanh của cha, mở rộng ra TP.HCM.', NULL, 'khang.ngo@example.com', 0, '0988001004'),
(47, 'Đặng Thị Linh', NULL, 'female', '1996-02-14 00:00:00.000', NULL, 'Marketing', 'TP. Hồ Chí Minh', 9, NULL, 0, '2026-04-21 13:31:51.383', '2026-04-21 13:31:51.383', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, '0988001005'),
(48, 'Ngô Văn Tùng', NULL, 'male', '1994-09-22 00:00:00.000', NULL, 'Giáo viên', 'Thanh Hóa', 9, NULL, 0, '2026-04-21 13:31:51.385', '2026-04-21 13:31:51.385', 40, 41, 1, NULL, 'Giáo viên dạy Toán THPT tại Thanh Hóa.', NULL, 'tungngo@example.com', 0, '0988001006'),
(49, 'Nguyễn Thị Hằng', NULL, 'female', '1996-12-30 00:00:00.000', NULL, 'Y tá', 'Thanh Hóa', 9, NULL, 0, '2026-04-21 13:31:51.386', '2026-04-21 13:31:51.386', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, '0988001007'),
(50, 'Ngô Gia Bảo', NULL, 'male', '2020-05-15 00:00:00.000', NULL, NULL, 'Hà Nội', 10, NULL, 0, '2026-04-21 13:31:51.389', '2026-04-21 13:31:51.389', 43, 44, 1, NULL, 'Đang học lớp 1.', NULL, NULL, 0, NULL),
(51, 'Ngô Minh Châu', NULL, 'female', '2023-08-10 00:00:00.000', NULL, NULL, 'Hà Nội', 10, NULL, 1, '2026-04-21 13:31:51.391', '2026-06-08 08:12:03.223', 43, 44, 1, NULL, NULL, NULL, NULL, 0, NULL),
(52, 'Ngô Đức An', NULL, 'male', '2022-03-20 00:00:00.000', NULL, NULL, 'TP. Hồ Chí Minh', 10, NULL, 0, '2026-04-21 13:31:51.393', '2026-04-21 13:31:51.393', 46, 47, 1, NULL, NULL, NULL, NULL, 0, NULL),
(53, 'Ngô An Nhiên', NULL, 'female', '2025-01-15 00:00:00.000', NULL, NULL, 'TP. Hồ Chí Minh', 10, NULL, 0, '2026-04-21 13:31:51.394', '2026-04-21 13:31:51.394', 46, 47, 1, NULL, 'Mới 1 tuổi.', NULL, NULL, 0, NULL),
(54, 'Ngô Minh Anh', NULL, 'female', '2024-07-05 00:00:00.000', NULL, NULL, 'Thanh Hóa', 10, NULL, 0, '2026-04-21 13:31:51.396', '2026-04-21 13:31:51.396', 48, 49, 1, NULL, NULL, NULL, NULL, 0, NULL),
(55, 'Ngô Hải Đăng', NULL, 'male', '2026-01-10 00:00:00.000', NULL, NULL, 'Thanh Hóa', 10, NULL, 0, '2026-04-21 13:31:51.398', '2026-04-21 13:31:51.398', 48, 49, 1, NULL, 'Mới sinh tháng 1/2026.', NULL, NULL, 0, NULL),
(66, 'Nguyen van A', NULL, 'male', NULL, NULL, NULL, NULL, 10, NULL, 0, '2026-06-08 08:14:24.862', '2026-06-08 08:14:24.862', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL),
(67, 'fsdfsdfsdfsfds', NULL, 'male', NULL, NULL, NULL, NULL, 9, NULL, 0, '2026-06-08 08:31:43.197', '2026-06-08 08:31:43.197', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `systemconfig`
--

CREATE TABLE `systemconfig` (
  `key` varchar(100) NOT NULL,
  `value` varchar(500) NOT NULL,
  `description` varchar(300) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL,
  `updatedBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `systemconfig`
--

INSERT INTO `systemconfig` (`key`, `value`, `description`, `updatedAt`, `updatedBy`) VALUES
('avatarMaxMB', '5', 'Dung lượng ảnh đại diện tối đa (MB)', '2026-04-21 13:31:51.107', NULL),
('bannerMaxMB', '10', 'Dung lượng banner tối đa (MB)', '2026-04-21 13:31:51.114', NULL),
('logoMaxMB', '2', 'Dung lượng logo tối đa (MB)', '2026-04-21 13:31:51.111', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `treeconfig`
--

CREATE TABLE `treeconfig` (
  `id` int(11) NOT NULL,
  `treeId` int(11) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `treeconfig`
--

INSERT INTO `treeconfig` (`id`, `treeId`, `key`, `value`) VALUES
(1, 1, 'maxGenDisplay', '10'),
(2, 1, 'reminderDays', '30'),
(3, 1, 'maxBloodGen', '3'),
(7, 3, 'maxGenDisplay', '10'),
(8, 3, 'reminderDays', '7'),
(9, 3, 'maxBloodGen', '3');

-- --------------------------------------------------------

--
-- Table structure for table `treeuser`
--

CREATE TABLE `treeuser` (
  `id` int(11) NOT NULL,
  `treeId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'viewer',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `treeuser`
--

INSERT INTO `treeuser` (`id`, `treeId`, `userId`, `role`, `createdAt`) VALUES
(1, 1, 1, 'admin', '2026-04-21 13:31:51.117'),
(2, 1, 2, 'editor', '2026-04-21 13:31:51.117'),
(5, 3, 1, 'admin', '2026-05-26 02:03:26.020'),
(6, 1, 4, 'editor', '2026-06-03 14:08:13.787'),
(10, 1, 3, 'viewer', '2026-06-08 07:54:57.254');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `memberId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `passwordHash`, `status`, `memberId`, `createdAt`, `updatedAt`) VALUES
(1, 'admin', '$2b$10$k4zIYXhWEZ8gEvS1fFYiseXbQQVBBusr3jCJCmxVcFGVI6pttWp6.', 'active', NULL, '2026-04-21 13:31:50.975', '2026-04-21 13:31:50.975'),
(2, 'editor1', '$2b$10$M8lvaADhvV5AjGeyzc2Wo.VwhuhZZZDqVSnvxNAXExHeJlFwUxDVO', 'active', NULL, '2026-04-21 13:31:51.049', '2026-04-21 13:31:51.049'),
(3, 'viewer1', '$2b$10$Rdosk32IX00DvaQM/BDTQO51c5W6DLui.gVRvK/0Snp6jeuNc3JxS', 'active', NULL, '2026-04-21 13:31:51.105', '2026-04-21 13:31:51.105'),
(4, 'quan123', '$2b$10$nTunQO3QAWk.aZr2JdeQB.cU19FbEC4B8XBiBK77DASHIhYfSpP26', 'active', NULL, '2026-06-03 14:07:44.725', '2026-06-03 14:07:44.725');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('18c80e95-e0cc-43ff-918d-fe37b700cbdb', 'b732ed5b3f10bf8fe7b60f68b0cf14d8409b4c56be1cd2b30c939d26ed923764', '2026-04-21 13:31:50.458', '20260313033216_add_multi_tree', NULL, NULL, '2026-04-21 13:31:50.166', 1),
('7f8dd751-80e5-44e5-837d-394a63ecd840', '29cad1e161be8409c53ca05ff0382731e94785dcb884745b2d0469d3d245cf6f', '2026-04-21 13:31:50.466', '20260421130302_add_missing_columns', NULL, NULL, '2026-04-21 13:31:50.459', 1),
('cf1c462d-9460-4197-bb3f-1661639f9cba', '62b3e80f4ed3aea44e8b74031affe04cb6a3c716b6fad1dcb1af9f5da721e65a', '2026-04-21 13:31:50.164', '20260313022013_init', NULL, NULL, '2026-04-21 13:31:49.741', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `achievement`
--
ALTER TABLE `achievement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Achievement_memberId_fkey` (`memberId`);

--
-- Indexes for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AuditLog_userId_fkey` (`userId`),
  ADD KEY `AuditLog_memberId_fkey` (`memberId`),
  ADD KEY `AuditLog_treeId_idx` (`treeId`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Category_treeId_idx` (`treeId`);

--
-- Indexes for table `death`
--
ALTER TABLE `death`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Death_memberId_key` (`memberId`);

--
-- Indexes for table `familyevent`
--
ALTER TABLE `familyevent`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FamilyEvent_relatedMemberId_fkey` (`relatedMemberId`),
  ADD KEY `FamilyEvent_treeId_idx` (`treeId`);

--
-- Indexes for table `familytree`
--
ALTER TABLE `familytree`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FamilyTree_createdBy_fkey` (`createdBy`);

--
-- Indexes for table `marriage`
--
ALTER TABLE `marriage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Marriage_husbandId_fkey` (`husbandId`),
  ADD KEY `Marriage_wifeId_fkey` (`wifeId`),
  ADD KEY `Marriage_treeId_idx` (`treeId`);

--
-- Indexes for table `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Member_fatherId_idx` (`fatherId`),
  ADD KEY `Member_motherId_idx` (`motherId`),
  ADD KEY `Member_generation_idx` (`generation`),
  ADD KEY `Member_treeId_idx` (`treeId`);

--
-- Indexes for table `systemconfig`
--
ALTER TABLE `systemconfig`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `treeconfig`
--
ALTER TABLE `treeconfig`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `TreeConfig_treeId_key_key` (`treeId`,`key`),
  ADD KEY `TreeConfig_treeId_idx` (`treeId`);

--
-- Indexes for table `treeuser`
--
ALTER TABLE `treeuser`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `TreeUser_treeId_userId_key` (`treeId`,`userId`),
  ADD KEY `TreeUser_treeId_idx` (`treeId`),
  ADD KEY `TreeUser_userId_idx` (`userId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_username_key` (`username`),
  ADD UNIQUE KEY `User_memberId_key` (`memberId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `achievement`
--
ALTER TABLE `achievement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `auditlog`
--
ALTER TABLE `auditlog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `death`
--
ALTER TABLE `death`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `familyevent`
--
ALTER TABLE `familyevent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `familytree`
--
ALTER TABLE `familytree`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `marriage`
--
ALTER TABLE `marriage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `member`
--
ALTER TABLE `member`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `treeconfig`
--
ALTER TABLE `treeconfig`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `treeuser`
--
ALTER TABLE `treeuser`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `achievement`
--
ALTER TABLE `achievement`
  ADD CONSTRAINT `Achievement_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD CONSTRAINT `AuditLog_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `AuditLog_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `familytree` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `death`
--
ALTER TABLE `death`
  ADD CONSTRAINT `Death_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `familyevent`
--
ALTER TABLE `familyevent`
  ADD CONSTRAINT `FamilyEvent_relatedMemberId_fkey` FOREIGN KEY (`relatedMemberId`) REFERENCES `member` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FamilyEvent_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `familytree` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `familytree`
--
ALTER TABLE `familytree`
  ADD CONSTRAINT `FamilyTree_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `marriage`
--
ALTER TABLE `marriage`
  ADD CONSTRAINT `Marriage_husbandId_fkey` FOREIGN KEY (`husbandId`) REFERENCES `member` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Marriage_wifeId_fkey` FOREIGN KEY (`wifeId`) REFERENCES `member` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `member`
--
ALTER TABLE `member`
  ADD CONSTRAINT `Member_fatherId_fkey` FOREIGN KEY (`fatherId`) REFERENCES `member` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Member_motherId_fkey` FOREIGN KEY (`motherId`) REFERENCES `member` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Member_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `familytree` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `treeconfig`
--
ALTER TABLE `treeconfig`
  ADD CONSTRAINT `TreeConfig_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `familytree` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `treeuser`
--
ALTER TABLE `treeuser`
  ADD CONSTRAINT `TreeUser_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `familytree` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `TreeUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `User_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
