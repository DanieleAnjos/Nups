-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: nups.c3o2qsaeqjve.us-east-2.rds.amazonaws.com    Database: nups_db
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `AjusteEstoques`
--

DROP TABLE IF EXISTS `AjusteEstoques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AjusteEstoques` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produtoId` int NOT NULL,
  `data` datetime NOT NULL,
  `quantidade` int NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `produtoId` (`produtoId`),
  CONSTRAINT `AjusteEstoques_ibfk_1` FOREIGN KEY (`produtoId`) REFERENCES `Produto` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AjusteEstoques`
--

LOCK TABLES `AjusteEstoques` WRITE;
/*!40000 ALTER TABLE `AjusteEstoques` DISABLE KEYS */;
/*!40000 ALTER TABLE `AjusteEstoques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Avisos`
--

DROP TABLE IF EXISTS `Avisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Avisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assunto` varchar(255) NOT NULL,
  `mensagem` varchar(255) NOT NULL,
  `data` date NOT NULL,
  `tipo` enum('lembrete','alerta','administrativo') NOT NULL DEFAULT 'lembrete',
  `profissionalId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profissionalId` (`profissionalId`),
  CONSTRAINT `Avisos_ibfk_1` FOREIGN KEY (`profissionalId`) REFERENCES `profissional` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Avisos`
--

LOCK TABLES `Avisos` WRITE;
/*!40000 ALTER TABLE `Avisos` DISABLE KEYS */;
INSERT INTO `Avisos` VALUES (1,'Reunião','Convocamos todos para reunião de hoje as 14h.','2025-02-23','administrativo',1,'2025-02-21 00:22:35','2025-02-23 23:21:37'),(4,'Lembrete','teste','2025-02-21','lembrete',1,'2025-02-21 11:51:23','2025-02-21 11:51:41'),(9,'Teste','Teste','2025-02-25','lembrete',1,'2025-02-25 12:17:15','2025-02-25 12:17:15'),(10,'Reunião','A reunião do serviço social será amanhã as 19h','2025-02-27','lembrete',1,'2025-02-26 18:12:33','2025-02-26 18:12:33');
/*!40000 ALTER TABLE `Avisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Documentos`
--

DROP TABLE IF EXISTS `Documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `caminho` varchar(255) NOT NULL,
  `pacienteId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pacienteId` (`pacienteId`),
  CONSTRAINT `Documentos_ibfk_1` FOREIGN KEY (`pacienteId`) REFERENCES `Pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Documentos`
--

LOCK TABLES `Documentos` WRITE;
/*!40000 ALTER TABLE `Documentos` DISABLE KEYS */;
INSERT INTO `Documentos` VALUES (2,'LaboratÃ³rio B2 parte 1 Qualidade de Software (1).pdf','1739055652497.pdf',1,'2025-02-08 23:00:52','2025-02-08 23:00:52'),(5,'relatorio.pdf','1739275600325.pdf',1,'2025-02-11 12:06:40','2025-02-11 12:06:40');
/*!40000 ALTER TABLE `Documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Eventos`
--

DROP TABLE IF EXISTS `Eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `localizacao` varchar(255) NOT NULL,
  `dataHoraInicio` datetime NOT NULL,
  `dataHoraFim` datetime NOT NULL,
  `link` text,
  `privacidade` enum('público','privado','restrito') NOT NULL DEFAULT 'público',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `subTitulo` varchar(255) NOT NULL,
  `etiqueta` varchar(255) NOT NULL,
  `autor` varchar(255) NOT NULL,
  `status` enum('ativo','cancelado','concluído') NOT NULL DEFAULT 'ativo',
  `destaque` tinyint(1) DEFAULT '0',
  `capacidadeMaxima` int DEFAULT NULL,
  `imagePath` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Eventos`
--

LOCK TABLES `Eventos` WRITE;
/*!40000 ALTER TABLE `Eventos` DISABLE KEYS */;
INSERT INTO `Eventos` VALUES (4,'Como está sua rotina depois da volta às aulas?','A volta às aulas marca o retorno à rotina estruturada de estudos, trabalho e outras responsabilidades diárias. Para muitos, esse período pode ser um desafio, exigindo reajustes na organização do tempo e no equilíbrio entre as tarefas escolares, profissionais e pessoais. É comum sentir-se sobrecarregado nas primeiras semanas, mas pequenas mudanças podem tornar esse processo mais tranquilo.\r\n\r\n7 maneiras de tornar a rotina pós-volta às aulas mais tranquila\r\nEstabelecer horários fixos de sono – Criar uma rotina regular de sono melhora a disposição e o desempenho acadêmico.\r\nUtilizar técnicas de gestão de tempo – Métodos como o Pomodoro ajudam a otimizar o estudo e evitar a fadiga mental.\r\nManter um ambiente de estudo organizado – Reduzir distrações e organizar materiais melhora o foco e a produtividade.\r\nDefinir metas alcançáveis – Criar pequenos objetivos diários mantém a motivação e facilita o cumprimento das tarefas.\r\nEquilibrar estudo e lazer – Reservar momentos para descanso evita o esgotamento e melhora o rendimento nos estudos.\r\nRevisar e ajustar a rotina semanalmente – Adaptar o planejamento conforme as necessidades reduz o estresse e melhora a eficiência.\r\nCriar um sistema de recompensas – Estabelecer pequenas recompensas após concluir tarefas pode tornar a rotina mais motivadora.\r\nO período pós-volta às aulas pode ser desafiador, mas algumas estratégias tornam a rotina mais equilibrada. Ajustar horários, organizar materiais e planejar o tempo de maneira eficiente são passos fundamentais para evitar sobrecarga e manter a produtividade.\r\n\r\nCada pessoa tem um ritmo próprio, e pequenas mudanças podem fazer grande diferença. Implementar hábitos consistentes e revisar periodicamente o planejamento garantem uma adaptação mais tranquila ao longo do semestre.\r\n\r\nReferências:\r\nAmerican Psychological Association – https://www.apa.org\r\nNational Sleep Foundation – https://www.sleepfoundation.org\r\nHarvard Business Review – https://hbr.org\r\nPrinceton University Neuroscience Institute – https://pni.princeton.edu\r\nMIT Sloan Management Review – https://sloanreview.mit.edu\r\n\r\n','Salvador / BA','2025-02-16 19:40:00','2025-02-16 22:40:00','https://bateriayuasa.com.br/bateria-yuasa-ytx4l-bs-ay50-ttr125-biz-c100-titan-125-jog-50.html','','2025-02-16 19:40:28','2025-02-16 22:06:12','Rotina de volta às aulas','Produtividade','Dane','ativo',0,NULL,'1739734828506.png');
/*!40000 ALTER TABLE `Eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Imagems`
--

DROP TABLE IF EXISTS `Imagems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Imagems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventoId` int NOT NULL,
  `path` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eventoId` (`eventoId`),
  CONSTRAINT `Imagems_ibfk_1` FOREIGN KEY (`eventoId`) REFERENCES `Eventos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Imagems`
--

LOCK TABLES `Imagems` WRITE;
/*!40000 ALTER TABLE `Imagems` DISABLE KEYS */;
/*!40000 ALTER TABLE `Imagems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Noticias`
--

DROP TABLE IF EXISTS `Noticias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Noticias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `subTitulo` varchar(255) NOT NULL,
  `etiqueta` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `autor` varchar(255) NOT NULL,
  `imagePath` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Noticias`
--

LOCK TABLES `Noticias` WRITE;
/*!40000 ALTER TABLE `Noticias` DISABLE KEYS */;
INSERT INTO `Noticias` VALUES (1,'Teste','Teste1','Produtividade','<h3 class=\"wp-block-heading\">Destralhe</h3>\r\n<p>A regra &eacute; clara: n&atilde;o &eacute; poss&iacute;vel organizar tralha. O primeiro passo &eacute; definitivamente fazer a sele&ccedil;&atilde;o do que preciso ou quero manter comigo e ver se tem a vers&atilde;o para Kindle. Simples assim. Nem tudo estou comprando no Kindle agora, pois n&atilde;o estou usando o livro no momento. Nesse caso, eu coloco na minha lista de desejos para n&atilde;o esquecer dele.</p>\r\n<h3 class=\"wp-block-heading\">O que ainda pretendo ler?</h3>\r\n<p>Existem alguns que n&atilde;o v&atilde;o para a biblioteca comunit&aacute;ria e eu quero ler ainda. Nesse caso, separo para ler nos pr&oacute;ximos meses e pretendo vender ou doar antes de viajar. Existem outros que n&atilde;o tenho mais interesse e j&aacute; podem ir para essa fase de descarte.</p>\r\n<h3 class=\"wp-block-heading\">Estou evitando comprar livros f&iacute;sicos</h3>\r\n<p>Esse momento chegou! Eu realmente estou evitando comprar livros f&iacute;sicos, a n&atilde;o ser que eu tenha a mais absoluta certeza de que vou l&ecirc;-los nos pr&oacute;ximos meses e que ou eu necessariamente vou lev&aacute;-lo comigo ou vou deixar com toda a certeza, depois de ler. Por exemplo, na semana passada eu comprei um livro com t&eacute;cnicas de leitura. Eu quero ler o livro f&iacute;sico, manusear, fazer marca&ccedil;&otilde;es. O livro &eacute; &oacute;timo mas eu posso t&ecirc;-lo no Kindle para refer&ecirc;ncia, futuramente, ou comprar a vers&atilde;o dele em ingl&ecirc;s, quando estiver fora. Mas o que eu usei aqui para ler eu posso dar de presente para uma prima que ama livros tanto quanto eu, porque sei que ela vai amar. E para cada livro eu tenho feito esse exerc&iacute;cio de pensar para quem eu posso d&aacute;-lo depois de ler, seja uma pessoa, a biblioteca comunit&aacute;ria ou outra finalidade.</p>\r\n<h3 class=\"wp-block-heading\">Manter em casa o que pretendo levar ou ler antes de mudar</h3>\r\n<p>Eu tenho tr&ecirc;s estantes aqui no meu apartamento e tenho mantido os livros que quero ler ainda ou levar comigo na mudan&ccedil;a. Os livros que ficar&atilde;o no Brasil eu estou levando para o escrit&oacute;rio aos poucos. A ideia &eacute; fazer essa separa&ccedil;&atilde;o e centralizar tudo l&aacute; para facilitar qualquer log&iacute;stica posterior.</p>\r\n<p>De verdade, muito livro eu pretendo comprar em ingl&ecirc;s, l&aacute; fora. Fica at&eacute; mais barato. O que n&atilde;o quero &eacute; deixar de ter um exemplar raro, especialmente nativo brasileiro, como livros do Florestan Fernandes, Carlos Nelson Coutinho e outros que n&atilde;o s&atilde;o t&atilde;o f&aacute;ceis de encontrar em livrarias estrangeiras. Mas tamb&eacute;m sempre existe a possibilidade de vir para c&aacute; todo ano e ir levando os livros aos poucos. Vamos ver. Por hora, o que tenho feito &eacute; essa primeira sele&ccedil;&atilde;o e quis compartilhar com voc&ecirc;s.</p>\r\n<h3 class=\"wp-block-heading\">&nbsp;7 maneiras de mudar sua rela&ccedil;&atilde;o com produtividade e finan&ccedil;as</h3>\r\n<ol>\r\n<li style=\"list-style-type: none;\">\r\n<ol class=\"wp-block-list\">\r\n<li><strong>Definir metas flex&iacute;veis</strong>&nbsp;&ndash; Ter objetivos &eacute; importante, mas permitir ajustes evita a frustra&ccedil;&atilde;o de um plano r&iacute;gido que n&atilde;o se adapta &agrave; realidade.</li>\r\n<li><strong>Evitar a autoavalia&ccedil;&atilde;o baseada no dinheiro</strong>&nbsp;&ndash; Seu valor n&atilde;o depende de quanto voc&ecirc; ganha ou economiza; foque na rela&ccedil;&atilde;o saud&aacute;vel com suas finan&ccedil;as.</li>\r\n<li><strong>Trabalhar com pr****esen&ccedil;a, n&atilde;o com ansiedade</strong>&nbsp;&ndash; Fazer as tarefas com aten&ccedil;&atilde;o plena melhora a qualidade do trabalho e reduz o cansa&ccedil;o mental.</li>\r\n<li><strong>Aceitar que nem tudo pode ser controlado</strong>&nbsp;&ndash; Planejamento &eacute; essencial, mas imprevistos fazem parte do fluxo da vida e n&atilde;o devem ser motivo de estresse excessivo.</li>\r\n<li><strong>Desacelerar para decidir melhor</strong>&nbsp;&ndash; Tomar decis&otilde;es financeiras com calma reduz a chance de compras impulsivas e investimentos arriscados.</li>\r\n<li><strong>Criar espa&ccedil;os de descanso real</strong>&nbsp;&ndash; Momentos sem telas, sem prazos e sem cobran&ccedil;as ajudam a recarregar a energia para tarefas importantes.</li>\r\n<li><strong>Cultivar contentamento no presente</strong> &ndash; Valorizar o que j&aacute; foi conquistado reduz a sensa&ccedil;&atilde;o constante de que algo ainda est&aacute; faltando.</li>\r\n</ol>\r\n</li>\r\n</ol>\r\n<p>&gt;</p>\r\n<p>&gt;</p>','Dane','1739759717466.png','2025-02-17 02:35:17','2025-02-17 12:30:19');
/*!40000 ALTER TABLE `Noticias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notificacaos`
--

DROP TABLE IF EXISTS `Notificacaos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notificacaos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mensagem` varchar(255) NOT NULL,
  `dataEnvio` datetime NOT NULL,
  `profissionalId` int DEFAULT NULL,
  `lida` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profissionalId` (`profissionalId`),
  CONSTRAINT `Notificacaos_ibfk_1` FOREIGN KEY (`profissionalId`) REFERENCES `profissional` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notificacaos`
--

LOCK TABLES `Notificacaos` WRITE;
/*!40000 ALTER TABLE `Notificacaos` DISABLE KEYS */;
INSERT INTO `Notificacaos` VALUES (1,'Você realizou um novo atendimento para o paciente 1, matrícula: 2.','2025-02-08 20:39:00',1,1,'2025-02-08 20:39:00','2025-02-10 15:50:02'),(2,'Você recebeu um novo encaminhamento referente ao paciente Maria Lucia.','2025-02-08 20:56:06',2,1,'2025-02-08 20:56:06','2025-02-09 12:40:03'),(3,'Você recebeu um novo encaminhamento referente ao paciente Amada Lucia Souza.','2025-02-08 20:59:33',2,1,'2025-02-08 20:59:33','2025-02-09 12:41:14'),(4,'Você recebeu um novo encaminhamento referente ao paciente Amada Lucia Souza.','2025-02-09 12:21:14',2,1,'2025-02-09 12:21:14','2025-02-09 12:43:48'),(5,'O encaminhamento do paciente Amada Lucia Souza foi cancelado.','2025-02-09 12:26:15',2,1,'2025-02-09 12:26:15','2025-02-09 12:45:07'),(6,'Você recebeu um novo encaminhamento referente ao paciente João da Silva.','2025-02-10 15:51:20',3,0,'2025-02-10 15:51:20','2025-02-10 15:51:20'),(7,'Você recebeu um novo encaminhamento referente ao paciente João Vitor.','2025-02-11 10:00:20',3,0,'2025-02-11 10:00:20','2025-02-11 10:00:20'),(8,'Você recebeu um novo encaminhamento referente ao paciente Patricia Soares.','2025-02-12 11:34:09',2,1,'2025-02-12 11:34:09','2025-02-18 17:59:14'),(9,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-12 11:47:05',3,0,'2025-02-12 11:47:05','2025-02-12 11:47:05'),(10,'O encaminhamento do paciente Pedro Henrique Buarque foi cancelado.','2025-02-13 11:58:25',2,1,'2025-02-13 11:58:25','2025-02-18 17:59:11'),(11,'O encaminhamento do paciente José Santos foi cancelado.','2025-02-13 12:25:57',3,0,'2025-02-13 12:25:57','2025-02-13 12:25:57'),(12,'O encaminhamento do paciente Patricia Soares foi cancelado.','2025-02-13 12:26:03',2,1,'2025-02-13 12:26:03','2025-02-18 17:59:08'),(13,'Você recebeu um novo encaminhamento referente ao paciente Pedro Henrique.','2025-02-13 12:40:03',3,0,'2025-02-13 12:40:03','2025-02-13 12:40:03'),(14,'Você recebeu um novo encaminhamento referente ao paciente daeb.','2025-02-15 21:03:28',3,0,'2025-02-15 21:03:28','2025-02-15 21:03:28'),(15,'O encaminhamento do paciente daeb foi cancelado.','2025-02-15 21:03:48',3,0,'2025-02-15 21:03:48','2025-02-15 21:03:48'),(16,'Você recebeu um novo encaminhamento referente ao paciente 1.','2025-02-15 21:32:40',2,1,'2025-02-15 21:32:40','2025-02-18 17:59:04'),(17,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-15 21:55:56',2,1,'2025-02-15 21:55:56','2025-02-18 17:59:00'),(18,'O encaminhamento do paciente 1 foi cancelado.','2025-02-15 21:56:06',2,1,'2025-02-15 21:56:06','2025-02-17 15:29:30'),(19,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-15 22:36:21',4,0,'2025-02-15 22:36:21','2025-02-15 22:36:21'),(20,'Você realizou um novo atendimento para o paciente 11, matrícula: 19.','2025-02-16 23:42:11',3,0,'2025-02-16 23:42:11','2025-02-16 23:42:11'),(21,'Você realizou um novo atendimento para o paciente 1, matrícula: 2.','2025-02-17 15:06:26',2,1,'2025-02-17 15:06:26','2025-02-17 15:29:25'),(22,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-18 18:02:06',3,0,'2025-02-18 18:02:06','2025-02-18 18:02:06'),(23,'Você recebeu um novo encaminhamento referente ao paciente Maria Joana.','2025-02-18 18:03:45',2,1,'2025-02-18 18:03:45','2025-02-18 18:04:05'),(24,'O encaminhamento do paciente José Santos foi cancelado.','2025-02-19 02:00:42',3,0,'2025-02-19 02:00:42','2025-02-19 02:00:42'),(25,'O encaminhamento do paciente José Santos foi cancelado.','2025-02-19 02:00:48',2,1,'2025-02-19 02:00:48','2025-02-21 12:42:10'),(26,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-19 02:15:09',4,0,'2025-02-19 02:15:09','2025-02-19 02:15:09'),(27,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-19 02:16:13',3,0,'2025-02-19 02:16:13','2025-02-19 02:16:13'),(28,'Você recebeu um novo encaminhamento referente ao paciente BAD.','2025-02-19 02:55:45',4,0,'2025-02-19 02:55:45','2025-02-19 02:55:45'),(29,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-19 10:39:29',3,0,'2025-02-19 10:39:29','2025-02-19 10:39:29'),(30,'Você realizou um novo atendimento para o paciente 1, matrícula: 2.','2025-02-23 20:33:26',1,0,'2025-02-23 20:33:26','2025-02-23 20:33:26'),(31,'O encaminhamento do paciente José Santos foi cancelado.','2025-02-23 20:58:00',3,0,'2025-02-23 20:58:00','2025-02-23 20:58:00'),(32,'O encaminhamento do paciente José Santos foi cancelado.','2025-02-23 20:58:07',3,0,'2025-02-23 20:58:07','2025-02-23 20:58:07'),(33,'Você recebeu um novo encaminhamento referente ao paciente José Santos.','2025-02-23 20:58:47',2,0,'2025-02-23 20:58:47','2025-02-23 20:58:47'),(34,'O encaminhamento do paciente José Santos foi cancelado.','2025-02-23 21:11:12',2,0,'2025-02-23 21:11:12','2025-02-23 21:11:12'),(35,'O encaminhamento do paciente Pedro Henrique foi cancelado.','2025-02-23 21:12:20',3,0,'2025-02-23 21:12:20','2025-02-23 21:12:20'),(36,'O encaminhamento do paciente Maria Joana foi cancelado.','2025-03-01 12:04:57',2,0,'2025-03-01 12:04:57','2025-03-01 12:04:57'),(37,'Você recebeu um novo encaminhamento referente ao paciente Maria Joana.','2025-03-01 12:05:21',3,0,'2025-03-01 12:05:21','2025-03-01 12:05:21'),(38,'Você realizou um novo atendimento para o paciente 1, matrícula: 2.','2025-03-01 18:03:07',1,0,'2025-03-01 18:03:07','2025-03-01 18:03:07');
/*!40000 ALTER TABLE `Notificacaos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pacientes`
--

DROP TABLE IF EXISTS `Pacientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pacientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `matricula` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `dataNascimento` datetime NOT NULL,
  `sexo` enum('Masculino','Feminino','Outro') NOT NULL,
  `escolaridade` enum('Ensino Fundamental','Ensino Médio','Superior') DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `cep` varchar(255) DEFAULT NULL,
  `bairro` varchar(255) DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `numero` varchar(255) DEFAULT NULL,
  `complemento` varchar(255) DEFAULT NULL,
  `cpf` varchar(255) NOT NULL,
  `rg` varchar(255) DEFAULT NULL,
  `telefone` varchar(255) DEFAULT NULL,
  `tipoTelefone` enum('Celular','Residencial','Comercial') DEFAULT NULL,
  `nomeContato` varchar(255) DEFAULT NULL,
  `telefoneContato` varchar(255) DEFAULT NULL,
  `parentesco` enum('Pai','Mãe','Filho','Cônjuge','Outro') DEFAULT NULL,
  `escala` varchar(255) DEFAULT NULL,
  `periodoEscala` varchar(255) DEFAULT NULL,
  `porteArma` tinyint(1) DEFAULT NULL,
  `trabalhoArmado` tinyint(1) DEFAULT NULL,
  `armaPessoal` tinyint(1) DEFAULT NULL,
  `planoSaude` varchar(255) DEFAULT NULL,
  `cartaoSus` varchar(255) DEFAULT NULL,
  `alergia` tinyint(1) DEFAULT NULL,
  `alergiaMedicamento` varchar(255) DEFAULT NULL,
  `doenca` tinyint(1) DEFAULT NULL,
  `descricaoDoenca` varchar(255) DEFAULT NULL,
  `medicamentos` varchar(255) DEFAULT NULL,
  `tipoMedicamento` varchar(255) DEFAULT NULL,
  `seguroVida` varchar(255) DEFAULT NULL,
  `comoConheceuEmpresa` varchar(255) DEFAULT NULL,
  `terapia` tinyint(1) DEFAULT NULL,
  `terapiaPeriodo` varchar(255) DEFAULT NULL,
  `terapiaMotivo` varchar(255) DEFAULT NULL,
  `filhos` text,
  `quantidadeFilhos` varchar(255) DEFAULT NULL,
  `moradia` varchar(255) DEFAULT NULL,
  `familiaDeficiencias` tinyint(1) DEFAULT NULL,
  `deficiencia` varchar(255) DEFAULT NULL,
  `atividadeFisica` tinyint(1) DEFAULT NULL,
  `tipoAtividadeFisica` varchar(255) DEFAULT NULL,
  `observacoes` text,
  `relatorio` text,
  `imagePath` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Ativo',
  `statusPaciente` enum('Em Atendimento','Abandono de Tratamento','Alta') DEFAULT 'Em Atendimento',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `possuiFilhos` tinyint(1) DEFAULT NULL,
  `relacaoSupervisor` varchar(255) DEFAULT NULL,
  `postoServico` varchar(255) DEFAULT NULL,
  `tempoServico` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pacientes`
--

LOCK TABLES `Pacientes` WRITE;
/*!40000 ALTER TABLE `Pacientes` DISABLE KEYS */;
INSERT INTO `Pacientes` VALUES (1,2,'Maria Joana','1987-05-01 00:00:00','Feminino','Superior','Rua Jornalista Archimedes Gonzaga','40240-290','Engenho Velho de Brotas','Salvador','BA','145','','08378395057','487851409','71999999999','Celular','Fernanda','71986541236','Mãe','',NULL,NULL,NULL,NULL,'','',NULL,'',NULL,NULL,NULL,'','','',NULL,'','',NULL,'','',NULL,'',NULL,'','','','1739188068569.jpg','Ativo','Em Atendimento','2025-02-08 20:29:24','2025-02-10 11:47:48',NULL,NULL,NULL,NULL),(11,19,'José Santos','2000-02-08 00:00:00','Masculino','Ensino Médio','Rua Jornalista Archimedes Gonzaga','40240-290','Engenho Velho de Brotas','Salvador','BA','188','','00000000006','487851403','71999999999','Celular','',NULL,'Pai','','',1,0,0,'','',0,'',0,NULL,NULL,'','','',0,'','','[{\"nome\":\"lara\",\"idade\":\"5\"},{\"nome\":\"dane\",\"idade\":\"7\"}]','','',0,'',0,'','','',NULL,'Ativo','Em Atendimento','2025-02-15 19:22:02','2025-02-15 19:49:26',1,'',NULL,NULL);
/*!40000 ALTER TABLE `Pacientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Produto`
--

DROP TABLE IF EXISTS `Produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Produto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `categoria` enum('Papelaria','Higiene','Alimentos','Eletrônicos','Limpeza','Outros') NOT NULL,
  `fornecimento` varchar(255) NOT NULL,
  `quantidade_inicial` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Produto`
--

LOCK TABLES `Produto` WRITE;
/*!40000 ALTER TABLE `Produto` DISABLE KEYS */;
INSERT INTO `Produto` VALUES (10,'Caneta','teste','Papelaria','ddd',30,'2025-02-24 12:07:04','2025-02-24 13:12:44'),(14,'Café','Tsege','Alimentos','dddddddd',10,'2025-02-28 23:41:47','2025-02-28 23:42:12');
/*!40000 ALTER TABLE `Produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Sessions`
--

DROP TABLE IF EXISTS `Sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sessions` (
  `sid` varchar(36) NOT NULL,
  `expires` datetime DEFAULT NULL,
  `data` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Sessions`
--

LOCK TABLES `Sessions` WRITE;
/*!40000 ALTER TABLE `Sessions` DISABLE KEYS */;
INSERT INTO `Sessions` VALUES ('-Y-7Gs7_1sIVQqZHET28AeMOzAuDl-mE','2025-03-03 20:22:24','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:22:24.770Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:22:24','2025-03-02 20:22:24'),('0g-uz4050rbqRew8a6PQwTLcA16JR9F2','2025-03-03 20:38:13','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:38:13.370Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:38:12','2025-03-02 20:38:13'),('0knlmjHS9-DPgYElIg9vtJrjGb-G17Nx','2025-03-03 20:19:50','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:19:50.006Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:19:49','2025-03-02 20:19:50'),('2Qq58feThuyr-gU-nQVHQdmkfjprRtwh','2025-03-03 20:38:10','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:38:10.855Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:38:11','2025-03-02 20:38:11'),('2RAEK3QzbsLJv5Zd9Cy2pWU0qhVi2Ijq','2025-03-03 20:46:29','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:46:29.480Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:46:29','2025-03-02 20:46:29'),('6dKCF55oARqpY_nBGr6zQi7r2gL8jteP','2025-03-03 19:55:34','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T19:55:34.661Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 19:55:34','2025-03-02 19:55:34'),('6u5E3MOEsXA4pDNXU66wl3fEhfGaW7Ot','2025-03-03 20:12:31','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:31.568Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:12:31','2025-03-02 20:12:31'),('8iJNn3pXQaWTooeVkCdfsA174DghIC9b','2025-03-03 20:12:22','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:22.189Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:12:22','2025-03-02 20:12:22'),('8kTJC9QfmZhB0KYoGp_9YsiGqEFFcOSg','2025-03-03 20:44:12','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:44:12.627Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:44:12','2025-03-02 20:44:12'),('a9I54V11RZgLyzGVMD1c_IGCp_LWhvFD','2025-03-03 20:12:31','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:31.581Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:12:31','2025-03-02 20:12:31'),('AbR8LsVRFYUqlu5sh_6b9EYy2DR_c50X','2025-03-03 20:12:34','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:34.732Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:12:34','2025-03-02 20:12:34'),('ADvOMO2hBuaGTWQJnlejCwsw0vjaURVc','2025-03-03 20:46:31','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:46:31.877Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:46:31','2025-03-02 20:46:32'),('AtYejq6jKYJlIRiYO8BZF2-OzFWDwcLp','2025-03-03 20:22:16','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:22:16.775Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:22:16','2025-03-02 20:22:16'),('BLqIXiPHp7zuNumOlH946dhrj_6B0WEI','2025-03-03 20:38:13','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:38:13.384Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:38:13','2025-03-02 20:38:13'),('c4CUkfm0RCNAellLotH54hy_JdgwU05N','2025-03-03 20:38:13','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:38:13.377Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:38:13','2025-03-02 20:38:13'),('cwapIEHOqznWDckEPcZy4JKLqMv5ghPN','2025-03-03 19:51:50','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T19:51:50.869Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 19:51:50','2025-03-02 19:51:50'),('dHVQSaEEM854n2o-DgMLYFBm4nGWCjNE','2025-03-03 20:13:45','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:13:45.711Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:13:46','2025-03-02 20:13:46'),('Hd3Vnkdpmzs2JG9XkxoM_YKIaZTMAK6F','2025-03-03 20:35:41','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:35:41.975Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:35:42','2025-03-02 20:35:42'),('INCToXySsFkVgE1cGwAOZ9ENhlOs60A-','2025-03-03 20:35:39','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:35:39.579Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:35:39','2025-03-02 20:35:39'),('jLv11PyOw8lr_g1lwBhU40NjXrHWuIuH','2025-03-03 20:44:10','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:44:10.179Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:44:10','2025-03-02 20:44:10'),('kgCPkv1cgF9mqt13fF1jBUS5opl5k2dY','2025-03-03 20:22:16','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:22:16.788Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:22:17','2025-03-02 20:22:17'),('Ko4XCKI_r5v8iTu9Ox4ikPvFbcr-1oJV','2025-03-03 20:22:24','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:22:24.762Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:22:24','2025-03-02 20:22:24'),('lBjkh2slx4-bw08OLbzyj9rnNHKdN_aj','2025-03-03 20:35:41','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:35:41.982Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:35:42','2025-03-02 20:35:42'),('LLf7H2iK-okmNbbb0HVu3luIXthUEPz3','2025-03-03 23:07:49','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T22:33:15.413Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 22:33:15','2025-03-02 23:07:49'),('m20nRiyyeSBq16Qv0_v1dreeMyi2ltVs','2025-03-03 20:46:31','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:46:31.889Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:46:32','2025-03-02 20:46:32'),('maObGBBdarqz6uP0b8TcfCR3hP0YMq2S','2025-03-03 20:19:50','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:19:50.016Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:19:50','2025-03-02 20:19:50'),('MgzYB2RJKE5wawudG3kCdRgnuERDVGxZ','2025-03-03 20:44:10','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:44:10.206Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:44:10','2025-03-02 20:44:10'),('NgsRyf7DEb3Tja4mH5FOXC-5oEiTjl5O','2025-03-03 20:12:34','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:34.739Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:12:34','2025-03-02 20:12:34'),('Of0ibSmgfylF5Va8IGBL92_Q43glOw46','2025-03-03 19:51:58','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T19:51:58.077Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 19:51:58','2025-03-02 19:51:58'),('Ojx4yOQMEoOLw6Eragvfn7xjBwOqxvRh','2025-03-03 19:36:44','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T19:36:44.041Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2},\"flash\":{}}','2025-03-02 19:36:42','2025-03-02 19:36:44'),('pMvJYuWkMyTRzjiVvHzJb9XjYpXY6fxp','2025-03-03 20:52:49','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:52:03.795Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2},\"flash\":{}}','2025-03-02 20:51:31','2025-03-02 20:52:49'),('pQBBdfCVupJsqvjnZ74vvnbAt8vP3fqV','2025-03-03 20:12:28','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:28.339Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:12:28','2025-03-02 20:12:28'),('rKvbHQFUDQKMBkkq56T8gKYC7-T-eFcS','2025-03-03 20:35:39','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:35:39.554Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:35:39','2025-03-02 20:35:39'),('rnjTN-MnE2TzEzc88JXui5pxi6lK0iU9','2025-03-03 20:12:22','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:22.216Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:12:22','2025-03-02 20:12:22'),('RVfABNySf6mAZl-kL5g8TRpVuycCLlqc','2025-03-03 20:13:45','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:13:45.697Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:13:45','2025-03-02 20:13:45'),('s3ph5xKXZreUeTjm2slSxIH85GYE_HRA','2025-03-03 20:19:50','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:19:50.024Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:19:50','2025-03-02 20:19:50'),('S98cKuc0-W9HnPzgrgNHkTT3FXO4bfUc','2025-03-03 20:44:12','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:44:12.620Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:44:12','2025-03-02 20:44:12'),('TsdQBggAwHovMTvSy2dg6WH-m7zxeF-7','2025-03-03 20:12:31','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:31.574Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:12:31','2025-03-02 20:12:31'),('UpLJBYofIVp0KzY0EtOkfc-BqYEegL_I','2025-03-03 20:13:45','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:13:45.704Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:13:45','2025-03-02 20:13:45'),('UpSfmb5Q3X0nU7ySB9PN6NtqdTFCowI6','2025-03-03 20:12:34','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:12:34.724Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:12:34','2025-03-02 20:12:34'),('uTipIPM_i6FwnsGVi4JlUPeOCxdYnufc','2025-03-03 20:35:41','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:35:41.967Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"passport\":{\"user\":2}}','2025-03-02 20:35:41','2025-03-02 20:35:42'),('Vw9cdAzAnBVP-YGiPYYjvABppxeo2AkA','2025-03-03 20:22:24','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:22:24.777Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:22:24','2025-03-02 20:22:24'),('WgWOw-LDwQWEN7w12BEFPFDlhGC_THeA','2025-03-03 20:44:12','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:44:12.634Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:44:12','2025-03-02 20:44:12'),('wnH78skrBe1pG--gw6mAWigCRTmxPnvL','2025-03-03 20:46:31','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:46:31.883Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:46:32','2025-03-02 20:46:32'),('x-g7Znh3e7lf463BFNrixN5nR6tfnNNY','2025-03-03 20:19:46','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:19:46.897Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{}}','2025-03-02 20:19:47','2025-03-02 20:19:47'),('Yf4ScFMMtZyEndPq0PBtHoXo_GoC7WLu','2025-03-03 20:38:10','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:38:10.826Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:38:10','2025-03-02 20:38:10'),('YlDTdwL9Lpm8cHHyrsXoSukwUTV6H-I_','2025-03-03 20:22:16','{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-03T20:22:16.782Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"strict\"},\"flash\":{\"error_msg\":[\"Você precisa estar logado para acessar essa página.\"]}}','2025-03-02 20:22:17','2025-03-02 20:22:17');
/*!40000 ALTER TABLE `Sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atendimento`
--

DROP TABLE IF EXISTS `atendimento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atendimento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomePaciente` varchar(255) NOT NULL,
  `matriculaPaciente` int NOT NULL,
  `assuntoAtendimento` varchar(255) NOT NULL,
  `registroAtendimento` text NOT NULL,
  `dataAtendimento` datetime NOT NULL,
  `pacienteId` int NOT NULL,
  `profissionalId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pacienteId` (`pacienteId`),
  KEY `profissionalId` (`profissionalId`),
  CONSTRAINT `atendimento_ibfk_1289` FOREIGN KEY (`pacienteId`) REFERENCES `Pacientes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `atendimento_ibfk_1290` FOREIGN KEY (`profissionalId`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendimento`
--

LOCK TABLES `atendimento` WRITE;
/*!40000 ALTER TABLE `atendimento` DISABLE KEYS */;
INSERT INTO `atendimento` VALUES (3,'11',19,'Teste ','teste','2025-02-16 23:42:11',11,3,'2025-02-16 23:42:11','2025-02-16 23:42:11'),(4,'1',2,'Acolhimento','a servidora foi acolhida','2025-02-17 15:06:25',1,2,'2025-02-17 15:06:25','2025-02-17 15:06:25'),(5,'1',2,'cc','cc','2025-02-23 20:33:25',1,1,'2025-02-23 20:33:25','2025-02-23 20:33:25'),(6,'1',2,'jjjjjjjjjjjj','hhhhhhhhhhhh','2025-03-01 18:03:06',1,1,'2025-03-01 18:03:06','2025-03-01 18:03:06');
/*!40000 ALTER TABLE `atendimento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discussao_casos`
--

DROP TABLE IF EXISTS `discussao_casos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discussao_casos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `atendimentoId` int NOT NULL,
  `conteudo` text NOT NULL,
  `autor` int NOT NULL,
  `dataHora` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `atendimentoId` (`atendimentoId`),
  KEY `autor` (`autor`),
  CONSTRAINT `discussao_casos_ibfk_1255` FOREIGN KEY (`atendimentoId`) REFERENCES `atendimento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `discussao_casos_ibfk_1256` FOREIGN KEY (`autor`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discussao_casos`
--

LOCK TABLES `discussao_casos` WRITE;
/*!40000 ALTER TABLE `discussao_casos` DISABLE KEYS */;
/*!40000 ALTER TABLE `discussao_casos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encaminhamento`
--

DROP TABLE IF EXISTS `encaminhamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encaminhamento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomePaciente` varchar(255) NOT NULL,
  `data` date NOT NULL,
  `matriculaPaciente` varchar(255) NOT NULL,
  `telefonePaciente` varchar(255) NOT NULL,
  `assuntoAcolhimento` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `visto` tinyint(1) DEFAULT '0',
  `profissionalIdEnvio` int NOT NULL,
  `profissionalIdRecebido` int NOT NULL,
  `atendimentoId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `numeroProcesso` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `profissionalIdEnvio` (`profissionalIdEnvio`),
  KEY `profissionalIdRecebido` (`profissionalIdRecebido`),
  KEY `atendimentoId` (`atendimentoId`),
  CONSTRAINT `encaminhamento_ibfk_1921` FOREIGN KEY (`profissionalIdEnvio`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `encaminhamento_ibfk_1922` FOREIGN KEY (`profissionalIdRecebido`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `encaminhamento_ibfk_1923` FOREIGN KEY (`atendimentoId`) REFERENCES `atendimento` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encaminhamento`
--

LOCK TABLES `encaminhamento` WRITE;
/*!40000 ALTER TABLE `encaminhamento` DISABLE KEYS */;
INSERT INTO `encaminhamento` VALUES (14,'José Santos','2025-02-18','19','71986541236','Acolhimento psicossocial','ddddcccccccccc',1,1,4,NULL,'2025-02-19 02:15:09','2025-02-23 21:23:37','789452/2025'),(18,'Maria Joana','2025-03-01','2','71999999999','Acolhimento psicossocial','ffffffccccccccc',0,1,3,NULL,'2025-03-01 12:05:21','2025-03-01 12:06:00',NULL);
/*!40000 ALTER TABLE `encaminhamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escalas`
--

DROP TABLE IF EXISTS `escalas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escalas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `horarioInicio` time NOT NULL,
  `horarioFim` time NOT NULL,
  `adminId` int NOT NULL,
  `dataCriacao` datetime NOT NULL,
  `dataAtualizacao` datetime NOT NULL,
  `profissional_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `adminId` (`adminId`),
  KEY `profissional_id` (`profissional_id`),
  CONSTRAINT `escalas_ibfk_1` FOREIGN KEY (`adminId`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `escalas_ibfk_2` FOREIGN KEY (`profissional_id`) REFERENCES `profissional` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escalas`
--

LOCK TABLES `escalas` WRITE;
/*!40000 ALTER TABLE `escalas` DISABLE KEYS */;
INSERT INTO `escalas` VALUES (1,'2025-02-10','07:00:00','13:00:00',2,'2025-02-09 12:56:48','2025-02-09 12:56:48',NULL),(2,'2025-02-10','08:00:00','11:00:00',3,'2025-02-11 00:56:48','2025-02-11 00:56:48',NULL);
/*!40000 ALTER TABLE `escalas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fluxoAtendimentos`
--

DROP TABLE IF EXISTS `fluxoAtendimentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fluxoAtendimentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomePaciente` varchar(255) NOT NULL,
  `data` date NOT NULL,
  `matriculaPaciente` varchar(255) NOT NULL,
  `numeroProcesso` varchar(11) DEFAULT NULL,
  `telefonePaciente` varchar(255) NOT NULL,
  `assuntoAcolhimento` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `visto` tinyint(1) DEFAULT '0',
  `profissionalIdEnvio` int NOT NULL,
  `profissionalIdRecebido` int NOT NULL,
  `atendimentoId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profissionalIdEnvio` (`profissionalIdEnvio`),
  KEY `profissionalIdRecebido` (`profissionalIdRecebido`),
  KEY `atendimentoId` (`atendimentoId`),
  CONSTRAINT `fluxoAtendimentos_ibfk_1474` FOREIGN KEY (`profissionalIdEnvio`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fluxoAtendimentos_ibfk_1475` FOREIGN KEY (`profissionalIdRecebido`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fluxoAtendimentos_ibfk_1476` FOREIGN KEY (`atendimentoId`) REFERENCES `atendimento` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fluxoAtendimentos`
--

LOCK TABLES `fluxoAtendimentos` WRITE;
/*!40000 ALTER TABLE `fluxoAtendimentos` DISABLE KEYS */;
INSERT INTO `fluxoAtendimentos` VALUES (2,'José Santos','2025-02-15','19','789471/2026','71999999999','teste','teste',0,3,4,NULL,'2025-02-15 22:36:20','2025-02-15 22:36:37'),(3,'BAD','2025-02-18','21','','71996898036','teste','FD',0,3,4,NULL,'2025-02-19 02:55:44','2025-02-19 02:55:44');
/*!40000 ALTER TABLE `fluxoAtendimentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensagem`
--

DROP TABLE IF EXISTS `mensagem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensagem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `remetenteId` int NOT NULL,
  `destinatarioId` int DEFAULT NULL,
  `destinatarioCargo` enum('Assistente social','Administrador','Psicólogo','Psiquiatra') DEFAULT NULL,
  `assunto` varchar(255) NOT NULL,
  `corpo` text NOT NULL,
  `visualizada` tinyint(1) DEFAULT '0',
  `respondida` tinyint(1) DEFAULT '0',
  `arquivada` tinyint(1) DEFAULT '0',
  `arquivo` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `remetenteId` (`remetenteId`),
  KEY `destinatarioId` (`destinatarioId`),
  CONSTRAINT `mensagem_ibfk_1` FOREIGN KEY (`remetenteId`) REFERENCES `profissional` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `mensagem_ibfk_2` FOREIGN KEY (`destinatarioId`) REFERENCES `profissional` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensagem`
--

LOCK TABLES `mensagem` WRITE;
/*!40000 ALTER TABLE `mensagem` DISABLE KEYS */;
INSERT INTO `mensagem` VALUES (1,1,3,NULL,'teste','teste',1,0,0,NULL,'2025-02-15 23:10:07','2025-02-15 23:10:38'),(2,1,4,NULL,'teste','teste',1,0,0,NULL,'2025-02-15 23:25:04','2025-02-15 23:25:20'),(4,1,2,NULL,'teste','teste',1,0,1,'uploads\\arquivos\\1739663648352.pdf','2025-02-15 23:54:08','2025-02-16 00:44:48'),(5,1,2,NULL,'teste','teste',1,0,1,'/arquivos/1739664212774.pdf','2025-02-16 00:03:32','2025-02-25 00:30:16'),(6,2,1,'Administrador','Re: teste','teste envio',1,1,0,'/arquivos/1739666609731.pdf','2025-02-16 00:43:29','2025-02-16 00:43:55'),(8,1,2,NULL,'Demanda','dona maria ',1,0,0,'/arquivos/1739901333735.pdf','2025-02-18 17:55:33','2025-02-18 17:55:52'),(9,2,1,'Administrador','Re: Demanda','Obrigado adm',1,1,0,NULL,'2025-02-18 17:58:02','2025-02-18 17:58:19'),(10,1,2,NULL,'Acolhimento de disparos ','Gostaria de receber notícias sobre o acolhimento tal',1,0,0,NULL,'2025-02-20 16:03:52','2025-02-20 16:04:15'),(11,2,1,'Administrador','Re: Acolhimento de disparos ','Pronto ',1,1,0,NULL,'2025-02-20 16:04:40','2025-02-20 16:05:04');
/*!40000 ALTER TABLE `mensagem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocorrencias_diarias`
--

DROP TABLE IF EXISTS `ocorrencias_diarias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocorrencias_diarias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `relatorio` text NOT NULL,
  `horarioChegada` time NOT NULL,
  `horarioSaida` time DEFAULT NULL,
  `profissionalId` int NOT NULL,
  `dataCriacao` datetime NOT NULL,
  `dataAtualizacao` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profissionalId` (`profissionalId`),
  CONSTRAINT `ocorrencias_diarias_ibfk_1` FOREIGN KEY (`profissionalId`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocorrencias_diarias`
--

LOCK TABLES `ocorrencias_diarias` WRITE;
/*!40000 ALTER TABLE `ocorrencias_diarias` DISABLE KEYS */;
INSERT INTO `ocorrencias_diarias` VALUES (7,'2025-02-17','shshs','10:00:00','14:00:00',1,'2025-02-23 21:43:34','2025-03-01 12:15:08');
/*!40000 ALTER TABLE `ocorrencias_diarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profissional`
--

DROP TABLE IF EXISTS `profissional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profissional` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `matricula` int DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `dataAdmissao` date NOT NULL,
  `cargo` enum('Desenvolvimento','Administrador','Adm','Assistente social','Assistente social Supervisor','Psicólogo','Psiquiatra') NOT NULL,
  `vinculo` enum('Servidor','Voluntario') NOT NULL,
  `cpf` varchar(255) NOT NULL,
  `dataNascimento` date NOT NULL,
  `sexo` varchar(255) NOT NULL,
  `estadoCivil` enum('Casado','Solteiro','Divorciado') DEFAULT NULL,
  `cep` varchar(255) NOT NULL,
  `endereco` varchar(255) NOT NULL,
  `bairro` varchar(255) NOT NULL,
  `cidade` varchar(255) NOT NULL,
  `estado` enum('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') NOT NULL,
  `numero` varchar(255) NOT NULL,
  `complemento` varchar(255) DEFAULT NULL,
  `telefone` varchar(255) NOT NULL,
  `tipoTelefone` enum('Celular','Residencial','Comercial') NOT NULL,
  `imagePath` varchar(255) DEFAULT NULL,
  `contatoEmergenciaNome` varchar(255) DEFAULT NULL,
  `telefoneContatoEmergencia` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Ativo',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profissional_matricula_unique` (`matricula`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profissional`
--

LOCK TABLES `profissional` WRITE;
/*!40000 ALTER TABLE `profissional` DISABLE KEYS */;
INSERT INTO `profissional` VALUES (1,'Admin Interno2',12,'daniele.lims02@gmail.com','2024-10-09','Administrador','Servidor','000.000.000-02','1990-02-01','Masculino','Solteiro','40240-290','Rua Exemplo 100','Centro','Cidade Exemplo','SP','100','','99999999999','Celular','1739269534747.jpeg','','','Ativo','2025-02-08 19:53:31','2025-02-11 10:25:35'),(2,'Maria Lucia Matos',4,'maria@gmail.com','2025-02-08','Psicólogo','Servidor','075.010.535-61','1897-02-07','Feminino',NULL,'40240-290','Rua Jornalista Archimedes Gonzaga','Engenho Velho de Brotas','Salvador','BA','188','Casa','71996898036','Celular','1739054092247.jpeg','Fabio','8378395057','Ativo','2025-02-08 20:40:33','2025-02-12 12:05:24'),(3,'Fernando Santos dos Santos',408,'ferdinandogms@gmail.com','2025-02-10','Assistente social','Servidor','748.356.065-74','1985-11-19','Masculino',NULL,'40240-290','Rua Jornalista Archimedes Gonzaga','Engenho Velho de Brotas','Salvador','BA','188','Casa','71999999999','Celular','1739805464592.jpg','Fabio','8378395057','Ativo','2025-02-10 11:04:04','2025-02-17 15:17:44'),(4,'Daniele',18,'daniele.lims02@gmail.com','2025-02-15','Assistente social','Servidor','000.000.000-00','1998-12-12','Feminino',NULL,'40240-290','Rua Jornalista Archimedes Gonzaga','Engenho Velho de Brotas','Salvador','BA','11','','71999999999','Celular','1740335486649.jpg','Matheus','71996898036','Ativo','2025-02-15 22:21:33','2025-02-23 18:34:24'),(7,'João Pedro dos Santos',407,'ferdinandogms@gmail.com','2008-08-16','Assistente social','Servidor','734.356.065-75','1986-11-12','Masculino',NULL,'41260-300','Rua Artêmio Castro Valente','Canabrava','Salvador','BA','998','','71988204906','Celular','1740593328020.jpg','FERNANDO S SANTOS','71993484926','Ativo','2025-02-26 18:08:48','2025-02-26 18:09:25');
/*!40000 ALTER TABLE `profissional` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas_sala`
--

DROP TABLE IF EXISTS `reservas_sala`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas_sala` (
  `id` int NOT NULL AUTO_INCREMENT,
  `salaId` int NOT NULL,
  `data` date NOT NULL,
  `horarioInicial` time NOT NULL,
  `horarioFinal` time NOT NULL,
  `profissionalId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `salaId` (`salaId`),
  KEY `profissionalId` (`profissionalId`),
  CONSTRAINT `reservas_sala_ibfk_1229` FOREIGN KEY (`salaId`) REFERENCES `salas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `reservas_sala_ibfk_1230` FOREIGN KEY (`profissionalId`) REFERENCES `profissional` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas_sala`
--

LOCK TABLES `reservas_sala` WRITE;
/*!40000 ALTER TABLE `reservas_sala` DISABLE KEYS */;
INSERT INTO `reservas_sala` VALUES (11,3,'2025-03-03','19:43:00','21:43:00',4,'2025-03-02 20:43:34','2025-03-02 20:43:34');
/*!40000 ALTER TABLE `reservas_sala` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salas`
--

DROP TABLE IF EXISTS `salas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `capacidade` int NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salas`
--

LOCK TABLES `salas` WRITE;
/*!40000 ALTER TABLE `salas` DISABLE KEYS */;
INSERT INTO `salas` VALUES (1,'Sala 1',15,'teste','2025-02-11 00:39:39','2025-02-16 23:49:31'),(3,'Sala 2',20,'teste','2025-02-11 00:43:44','2025-02-16 23:48:16');
/*!40000 ALTER TABLE `salas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpires` datetime DEFAULT NULL,
  `profissionalId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profissionalId` (`profissionalId`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`profissionalId`) REFERENCES `profissional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'admin','$argon2id$v=19$m=65536,t=3,p=4$0Z779AJuAxZJMGFg6miT8w$UQijqa+WLYJiaKEbSHTf/PkJTApo2rbpGYOKgeMKJDE','23eb07416647627855187d50daf13f194299ca91d76abc190628c9ac9f8bb916','2025-02-20 13:14:32',1,'2025-02-08 19:53:55','2025-02-20 12:14:32'),(3,'maria','$argon2id$v=19$m=65536,t=3,p=4$Gt0uRlc2ZvUwluIExg9lwQ$uy6os5wChlxNt37qfLSUg8JziarOZ04Xy6Kwdm7Et+w',NULL,NULL,2,'2025-02-09 12:27:22','2025-02-09 12:27:22'),(4,'fernando','$argon2id$v=19$m=65536,t=3,p=4$E2zVkh7p2mG9XAY8qYsjiQ$YNB0c09ef9RbQlFq5zXRC7f0meiSjXOhU2RLRDVYA7I','348c0daeca45085535287acc329fa7a180b95bcdd91c55e5eaca3bd3c80c3acb','2025-02-26 19:09:44',3,'2025-02-10 11:04:28','2025-02-26 18:09:44'),(5,'daniele','$argon2id$v=19$m=65536,t=3,p=4$8C8Th/08zIcyTqj3z9UHzg$J3mHXQ8abFbl/d3IC6M4BUBTackgW2eP58E7u2p1pn0','81674a5eb9b3b832ce389087b664fed60c78f10f4efc701b5ab62dbc28143775','2025-02-21 13:09:19',4,'2025-02-15 22:21:57','2025-02-21 12:09:19');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-02 20:27:32
