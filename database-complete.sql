-- ============================================
-- Script Completo de Base de Datos
-- WavePos DTE-v2
-- Incluye: Todas las tablas + Catálogos + Datos
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- TABLAS PRINCIPALES DEL PROYECTO
-- ============================================

-- Tabla de empresas (Dependencia base)
CREATE TABLE IF NOT EXISTS empresas (
  id VARCHAR(255) PRIMARY KEY,
  nombre TEXT NOT NULL,
  nit TEXT,
  direccion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) UNIQUE NOT NULL,
  empresa_id VARCHAR(255) NOT NULL,
  nombre TEXT, 
  active INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id VARCHAR(255) PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT,
  nit TEXT,
  nrc TEXT,
  direccion TEXT,
  telefono TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active INT DEFAULT 1,
  tipo_persona TEXT,
  actividad_economica TEXT,
  numero_documento TEXT,
  tipo_documento TEXT,
  alias TEXT,
  nombre_comercial TEXT,
  clasificacion_tributaria TEXT,
  es_sujeto_excluido INT DEFAULT 0,
  pais TEXT,
  departamento TEXT,
  municipio TEXT
);

-- Tabla de formas de pago
CREATE TABLE IF NOT EXISTS formas_pago (
  id VARCHAR(255) PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de DTE
CREATE TABLE IF NOT EXISTS tipos_dte (
  codigo VARCHAR(255) PRIMARY KEY,
  nombre TEXT NOT NULL,
  habilitado INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  empresa_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active INT DEFAULT 1,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Tabla de sucursales
CREATE TABLE IF NOT EXISTS sucursales (
  id VARCHAR(255) PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  empresa_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active INT DEFAULT 1,
  ubicacion TEXT,
  tipo_sucursal TEXT,
  complemento TEXT,
  correo_electronico TEXT,
  departamento TEXT,
  municipio TEXT,
  codigo_mh TEXT,
  puntos_venta INT,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id VARCHAR(255) PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT,
  descripcion TEXT,
  precio_unitario DECIMAL(10,2) DEFAULT 0,
  unidad_medida TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active INT DEFAULT 1
);

-- Documento Factura
CREATE TABLE IF NOT EXISTS documento_factura (
  id INT AUTO_INCREMENT PRIMARY KEY,
  control_number VARCHAR(255) UNIQUE NOT NULL,
  tipo_dte VARCHAR(50) NOT NULL,
  codigo_generacion VARCHAR(255) UNIQUE,
  numero_control VARCHAR(255),
  numero_documento INT,
  receptor TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  ambiente VARCHAR(50) NOT NULL DEFAULT 'PRUEBAS',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_emision TIMESTAMP NULL,
  fecha_envio TIMESTAMP NULL,
  fecha_autorizacion TIMESTAMP NULL,
  empresa_id VARCHAR(255),
  cliente_id VARCHAR(255),
  estado VARCHAR(50) DEFAULT 'BORRADOR',
  dte_json LONGTEXT,
  dte_firmado LONGTEXT,
  sello_recibido TEXT,
  codigo_mensaje TEXT,
  descripcion_mensaje TEXT,
  observaciones TEXT,
  pdf_url TEXT,
  tipo_servicio_medico TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Configuración de usuario
CREATE TABLE IF NOT EXISTS user_config (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  telefono TEXT,
  zona_horaria VARCHAR(100) DEFAULT 'El Salvador (GMT-6)',
  rol VARCHAR(50) DEFAULT 'PROPIETARIO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Configuración empresa
CREATE TABLE IF NOT EXISTS empresa_config (
  id VARCHAR(255) PRIMARY KEY,
  empresa_id VARCHAR(255) NOT NULL,
  nombre_legal TEXT,
  nombre_comercial TEXT,
  nit TEXT,
  nrc TEXT,
  dui TEXT,
  actividad_economica_primaria TEXT,
  actividad_economica_secundaria TEXT,
  actividad_economica_terciaria TEXT,
  direccion TEXT,
  departamento TEXT,
  municipio TEXT,
  codigo_mh TEXT,
  puntos_venta INT DEFAULT 1,
  sitio_web TEXT,
  telefono TEXT,
  correo TEXT,
  logo_url TEXT,
  certificado_prueba TEXT,
  password_api_prueba TEXT,
  certificado_produccion TEXT,
  password_api_produccion TEXT,
  ambiente_pruebas_activo INT DEFAULT 1,
  ambiente_produccion_activo INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Certificados
CREATE TABLE IF NOT EXISTS empresa_certificados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id VARCHAR(255) UNIQUE NOT NULL,
  password_pri_prueba TEXT,
  password_pub_prueba TEXT,
  password_pri_produccion TEXT,
  password_pub_produccion TEXT,
  cert_path_prueba TEXT,
  cert_path_produccion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Tabla de Contingencias
CREATE TABLE IF NOT EXISTS contingencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id VARCHAR(255) NOT NULL,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NULL,
  codigo_motivo INT NOT NULL,
  descripcion_motivo TEXT,
  estado VARCHAR(50) DEFAULT 'ACTIVO',
  codigo_generacion VARCHAR(255),
  sello_recibido TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Tabla de DTEs (Compatibilidad)
CREATE TABLE IF NOT EXISTS dtes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  control_number VARCHAR(255) UNIQUE NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  tipo_dte VARCHAR(50),
  codigo_generacion VARCHAR(255) UNIQUE,
  numero_control VARCHAR(255),
  numero_documento INT,
  receptor TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  ambiente VARCHAR(50) NOT NULL DEFAULT 'PRUEBAS',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_emision TIMESTAMP NULL,
  fecha_envio TIMESTAMP NULL,
  fecha_autorizacion TIMESTAMP NULL,
  empresa_id VARCHAR(255),
  cliente_id VARCHAR(255),
  estado VARCHAR(50) DEFAULT 'BORRADOR',
  dte_json LONGTEXT,
  dte_firmado LONGTEXT,
  sello_recibido TEXT,
  codigo_mensaje TEXT,
  descripcion_mensaje TEXT,
  observaciones TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- ============================================
-- TABLAS DE CATÁLOGOS
-- ============================================

CREATE TABLE IF NOT EXISTS `cat_001_ambiente` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_002_tipo_dte` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_003_modelo_facturacion` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_004_tipo_transmision` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_005_tipo_contingencia` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_006_tipo_retencion` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_007_tipo_generacion` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_008_tipo_documento_identificacion` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_009_tipo_persona` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_010_tipo_establecimiento` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_011_pais` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_012_departamento` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_013_municipio` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL,
  `departamento_codigo` VARCHAR(10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_014_unidad_medida` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_015_condicion_operacion` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_016_forma_pago` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_017_plazo` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_018_incoterms` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_019_actividad_economica` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_020_tributo` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_021_tipo_item` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_022_regimen_fiscal` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_023_tipo_invalidacion` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_024_modalidad_transporte` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cat_025_tipo_documento_relacionado` (
  `codigo` VARCHAR(10) PRIMARY KEY,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERCIÓN DE DATOS DE CATÁLOGOS
-- ============================================

-- CAT-001: Ambiente de Destino
TRUNCATE TABLE `cat_001_ambiente`;
INSERT INTO `cat_001_ambiente` (`codigo`, `valor`) VALUES
('0', 'Modo prueba'),
('1', 'Modo producción');

-- CAT-002: Tipo de Documento
TRUNCATE TABLE `cat_002_tipo_dte`;
INSERT INTO `cat_002_tipo_dte` (`codigo`, `valor`) VALUES
('1', 'Factura'),
('3', 'Comprobante de crédito fiscal'),
('4', 'Nota de remisión'),
('5', 'Nota de crédito'),
('6', 'Nota de débito'),
('7', 'Comprobante de retención'),
('8', 'Comprobante de liquidación'),
('9', 'Documento contable de liquidación'),
('11', 'Factura de exportación'),
('14', 'Factura de sujeto excluido'),
('15', 'Comprobante de donación');

-- CAT-003: Modelo de Facturación
TRUNCATE TABLE `cat_003_modelo_facturacion`;
INSERT INTO `cat_003_modelo_facturacion` (`codigo`, `valor`) VALUES
('1', 'Modelo Facturación previo'),
('2', 'Modelo Facturación diferido');

-- CAT-004: Tipo de Transmisión
TRUNCATE TABLE `cat_004_tipo_transmision`;
INSERT INTO `cat_004_tipo_transmision` (`codigo`, `valor`) VALUES
('1', 'Transmisión normal'),
('2', 'Transmisión por contingencia');

-- CAT-005: Tipo de Contingencia
TRUNCATE TABLE `cat_005_tipo_contingencia`;
INSERT INTO `cat_005_tipo_contingencia` (`codigo`, `valor`) VALUES
('1', 'No disponibilidad de sistema del MH'),
('2', 'No disponibilidad de sistema del emisor'),
('3', 'Falla en el suministro de servicio de Internet del Emisor'),
('4', 'Falla en el suministro de servicio de energía eléctrica del emisor que impida la transmisión de los DTE'),
('5', 'Otro (deberá digitar un máximo de 500 caracteres explicando el motivo)');

-- CAT-006: Tipo de Retención
TRUNCATE TABLE `cat_006_tipo_retencion`;
INSERT INTO `cat_006_tipo_retencion` (`codigo`, `valor`) VALUES
('22', 'Retención IVA 1%'),
('C4', 'Retención IVA 13%'),
('C9', 'Otras Retenciones IVA casos especiales');

-- CAT-007: Tipo de Generación
TRUNCATE TABLE `cat_007_tipo_generacion`;
INSERT INTO `cat_007_tipo_generacion` (`codigo`, `valor`) VALUES
('1', 'Generación automática'),
('2', 'Generación manual');

-- CAT-008: Tipo de Documento de Identificación
TRUNCATE TABLE `cat_008_tipo_documento_identificacion`;
INSERT INTO `cat_008_tipo_documento_identificacion` (`codigo`, `valor`) VALUES
('13', 'DUI'),
('36', 'NIT'),
('37', 'Otro');

-- CAT-009: Tipo de Persona
TRUNCATE TABLE `cat_009_tipo_persona`;
INSERT INTO `cat_009_tipo_persona` (`codigo`, `valor`) VALUES
('1', 'Natural'),
('2', 'Jurídica');

-- CAT-010: Tipo de Establecimiento
TRUNCATE TABLE `cat_010_tipo_establecimiento`;
INSERT INTO `cat_010_tipo_establecimiento` (`codigo`, `valor`) VALUES
('01', 'Casa Matriz'),
('02', 'Sucursal'),
('04', 'Punto de venta'),
('07', 'Punto de venta - Mercado'),
('20', 'Otro');

-- CAT-011: País (principales)
TRUNCATE TABLE `cat_011_pais`;
INSERT INTO `cat_011_pais` (`codigo`, `valor`) VALUES
('9000', 'El Salvador'),
('9001', 'Guatemala'),
('9002', 'Honduras'),
('9003', 'Nicaragua'),
('9004', 'Costa Rica'),
('9005', 'Panamá'),
('9006', 'México'),
('9007', 'Estados Unidos'),
('9008', 'Canadá');

-- CAT-012: Departamento
TRUNCATE TABLE `cat_012_departamento`;
INSERT INTO `cat_012_departamento` (`codigo`, `valor`) VALUES
('01', 'Ahuachapán'),
('02', 'Santa Ana'),
('03', 'Sonsonate'),
('04', 'Chalatenango'),
('05', 'La Libertad'),
('06', 'San Salvador'),
('07', 'Cuscatlán'),
('08', 'La Paz'),
('09', 'Cabañas'),
('10', 'San Vicente'),
('11', 'Usulután'),
('12', 'San Miguel'),
('13', 'Morazán'),
('14', 'La Unión');

-- CAT-013: Municipio (ejemplos de San Salvador)
TRUNCATE TABLE `cat_013_municipio`;
INSERT INTO `cat_013_municipio` (`codigo`, `valor`, `departamento_codigo`) VALUES
('0601', 'San Salvador', '06'),
('0602', 'Aguilares', '06'),
('0603', 'Apopa', '06'),
('0604', 'Ayutuxtepeque', '06'),
('0605', 'Cuscatancingo', '06'),
('0606', 'Delgado', '06'),
('0607', 'El Paisnal', '06'),
('0608', 'Guazapa', '06'),
('0609', 'Ilopango', '06'),
('0610', 'Mejicanos', '06'),
('0611', 'Nejapa', '06'),
('0612', 'Panchimalco', '06'),
('0613', 'Rosario de Mora', '06'),
('0614', 'San Marcos', '06'),
('0615', 'San Martín', '06'),
('0616', 'Santiago Texacuangos', '06'),
('0617', 'Santo Tomás', '06'),
('0618', 'Soyapango', '06'),
('0619', 'Tonacatepeque', '06');

-- CAT-014: Unidad de Medida
TRUNCATE TABLE `cat_014_unidad_medida`;
INSERT INTO `cat_014_unidad_medida` (`codigo`, `valor`) VALUES
('59', 'Unidad'),
('99', 'Otros');

-- CAT-015: Condición de Operación
TRUNCATE TABLE `cat_015_condicion_operacion`;
INSERT INTO `cat_015_condicion_operacion` (`codigo`, `valor`) VALUES
('1', 'Contado'),
('2', 'Crédito'),
('3', 'Otro');

-- CAT-016: Forma de Pago
TRUNCATE TABLE `cat_016_forma_pago`;
INSERT INTO `cat_016_forma_pago` (`codigo`, `valor`) VALUES
('01', 'Billetes y monedas'),
('02', 'Tarjeta Débito/Crédito'),
('03', 'Cheque'),
('04', 'Transferencia Depósito Bancario'),
('05', 'Otro');

-- CAT-017: Plazo
TRUNCATE TABLE `cat_017_plazo`;
INSERT INTO `cat_017_plazo` (`codigo`, `valor`) VALUES
('01', 'Días'),
('02', 'Meses'),
('03', 'Años');

-- CAT-018: Incoterms
TRUNCATE TABLE `cat_018_incoterms`;
INSERT INTO `cat_018_incoterms` (`codigo`, `valor`) VALUES
('EXW', 'EXW - En fábrica'),
('FCA', 'FCA - Franco transportista'),
('CPT', 'CPT - Transporte pagado hasta'),
('CIP', 'CIP - Transporte y seguro pagados hasta'),
('DAT', 'DAT - Entregada en terminal'),
('DAP', 'DAP - Entregada en lugar'),
('DDP', 'DDP - Entregada derechos pagados'),
('FAS', 'FAS - Franco al costado del buque'),
('FOB', 'FOB - Franco a bordo'),
('CFR', 'CFR - Coste y flete'),
('CIF', 'CIF - Coste, seguro y flete');

-- CAT-019: Actividad Económica (principales)
TRUNCATE TABLE `cat_019_actividad_economica`;
INSERT INTO `cat_019_actividad_economica` (`codigo`, `valor`) VALUES
('10005', 'Comercio al por mayor y al por menor'),
('10001', 'Agricultura, ganadería, caza, silvicultura y pesca'),
('10002', 'Explotación de minas y canteras'),
('10003', 'Industrias manufactureras'),
('10004', 'Suministro de electricidad, gas, vapor y aire acondicionado'),
('10006', 'Transporte y almacenamiento'),
('10007', 'Actividades de alojamiento y de servicio de comidas'),
('10008', 'Información y comunicaciones'),
('10009', 'Actividades financieras y de seguros'),
('10010', 'Actividades inmobiliarias'),
('10011', 'Actividades profesionales, científicas y técnicas'),
('10012', 'Actividades de servicios administrativos y de apoyo'),
('10013', 'Administración pública y defensa'),
('10014', 'Enseñanza'),
('10015', 'Actividades de atención de la salud humana'),
('10016', 'Actividades artísticas, de entretenimiento y recreativas'),
('10017', 'Otras actividades de servicios');

-- CAT-020: Tributo
TRUNCATE TABLE `cat_020_tributo`;
INSERT INTO `cat_020_tributo` (`codigo`, `valor`) VALUES
('20', 'Impuesto al Valor Agregado');

-- CAT-021: Tipo de Ítem
TRUNCATE TABLE `cat_021_tipo_item`;
INSERT INTO `cat_021_tipo_item` (`codigo`, `valor`) VALUES
('1', 'Bien'),
('2', 'Servicio'),
('3', 'Ambos (Bien y Servicio)'),
('4', 'Otros tributos');

-- CAT-022: Régimen Fiscal
TRUNCATE TABLE `cat_022_regimen_fiscal`;
INSERT INTO `cat_022_regimen_fiscal` (`codigo`, `valor`) VALUES
('01', 'Régimen General'),
('02', 'Régimen Simplificado'),
('03', 'Sujeto Excluido');

-- CAT-023: Tipo de Invalidación
TRUNCATE TABLE `cat_023_tipo_invalidacion`;
INSERT INTO `cat_023_tipo_invalidacion` (`codigo`, `valor`) VALUES
('1', 'Anulación por emisor'),
('2', 'Anulación por receptor');

-- CAT-024: Modalidad de Transporte
TRUNCATE TABLE `cat_024_modalidad_transporte`;
INSERT INTO `cat_024_modalidad_transporte` (`codigo`, `valor`) VALUES
('1', 'Transporte propio'),
('2', 'Transporte de terceros');

-- CAT-025: Tipo de Documento Relacionado
TRUNCATE TABLE `cat_025_tipo_documento_relacionado`;
INSERT INTO `cat_025_tipo_documento_relacionado` (`codigo`, `valor`) VALUES
('01', 'Factura'),
('03', 'Comprobante de Crédito Fiscal'),
('04', 'Nota de Remisión'),
('05', 'Nota de Crédito'),
('06', 'Nota de Débito'),
('11', 'Factura de Exportación'),
('14', 'Factura de Sujeto Excluido');

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Tipos de DTE
INSERT INTO tipos_dte (codigo, nombre, habilitado) VALUES
('FAC', 'Factura', 1),
('CCF', 'Comprobante Crédito Fiscal', 1),
('NCR', 'Nota de Crédito', 1),
('NDB', 'Nota de Débito', 1),
('FSE', 'Factura de Sujeto Excluido', 1),
('FEX', 'Factura de Exportación', 1),
('REM', 'Nota de Remisión', 1),
('CRT', 'Comprobante de Retención', 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Formas de pago
INSERT INTO formas_pago (id, nombre) VALUES
('fp1', 'Efectivo'),
('fp2', 'Cheque'),
('fp3', 'Transferencia'),
('fp4', 'Tarjeta de Crédito'),
('fp5', 'Tarjeta de Débito')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
