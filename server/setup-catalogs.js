const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
};

async function setupCatalogs() {
    let connection; // Declare connection outside try block for finally access
    try {
        connection = await mysql.createConnection(dbConfig);

        // Verificar si ya existen datos (usando cat_001_ambiente y cat_019_actividad_economica como referencia)
        const [tables] = await connection.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('cat_001_ambiente', 'cat_019_actividad_economica')", [dbConfig.database]);

        const tableExists = tables.some(t => t.TABLE_NAME === 'cat_001_ambiente');
        const cat019Exists = tables.some(t => t.TABLE_NAME === 'cat_019_actividad_economica');

        if (tableExists && cat019Exists) {
            const [rows] = await connection.query("SELECT COUNT(*) as count FROM cat_001_ambiente");

            if (rows[0].count > 0) {
                console.log('✅ Los catálogos ya están cargados en la base de datos. Omitiendo configuración.');
                await connection.end();
                return;
            }
        }

        console.log('✅ Conectado a la base de datos para configurar catálogos.');

        // --- Definición de Catálogos ---
        // Cada objeto define: nombre_tabla, descripcion, y los datos iniciales
        const catalogs = [
            {
                tableName: 'cat_001_ambiente',
                description: 'CAT-001 Ambiente de Destino',
                data: [
                    ['0', 'Modo prueba'],
                    ['1', 'Modo producción']
                ]
            },
            {
                tableName: 'cat_002_tipo_dte',
                description: 'CAT-002 Tipo de Documento',
                data: [
                    ['1', 'Factura'],
                    ['3', 'Comprobante de crédito fiscal'],
                    ['4', 'Nota de remisión'],
                    ['5', 'Nota de crédito'],
                    ['6', 'Nota de débito'],
                    ['7', 'Comprobante de retención'],
                    ['8', 'Comprobante de liquidación'],
                    ['9', 'Documento contable de liquidación'],
                    ['11', 'Factura de exportación'],
                    ['14', 'Factura de sujeto excluido'],
                    ['15', 'Comprobante de donación']
                ]
            },
            {
                tableName: 'cat_003_modelo_facturacion',
                description: 'CAT-003 Modelo de Facturación',
                data: [
                    ['1', 'Modelo Facturación previo'],
                    ['2', 'Modelo Facturación diferido']
                ]
            },
            {
                tableName: 'cat_004_tipo_transmision',
                description: 'CAT-004 Tipo de Transmisión',
                data: [
                    ['1', 'Transmisión normal'],
                    ['2', 'Transmisión por contingencia']
                ]
            },
            {
                tableName: 'cat_005_tipo_contingencia',
                description: 'CAT-005 Tipo de Contingencia',
                data: [
                    ['1', 'No disponibilidad de sistema del MH'],
                    ['2', 'No disponibilidad de sistema del emisor'],
                    ['3', 'Falla en el suministro de servicio de Internet del Emisor'],
                    ['4', 'Falla en el suministro de servicio de energía eléctrica del emisor que impida la transmisión de los DTE'],
                    ['5', 'Otro (deberá digitar un máximo de 500 caracteres explicando el motivo)']
                ]
            },
            {
                tableName: 'cat_006_tipo_retencion',
                description: 'CAT-006 Tipo de Retención',
                data: [
                    ['22', 'Retención IVA 1%'],
                    ['C4', 'Retención IVA 13%'],
                    ['C9', 'Otras Retenciones IVA casos especiales']
                ]
            },
            {
                tableName: 'cat_007_tipo_generacion',
                description: 'CAT-007 Tipo de Generación',
                data: [
                    ['1', 'Físico'],
                    ['2', 'Electrónico']
                ]
            },
            {
                tableName: 'cat_008_tipo_invalidacion',
                description: 'CAT-008 Tipo de Invalidación',
                data: [
                    ['N/A', 'Catálogo eliminado'],
                ]
            },
            {
                tableName: 'cat_009_tipo_establecimiento',
                description: 'CAT-009 Tipo de establecimiento',
                data: [
                    ['1', 'Sucursal'],
                    ['2', 'Casa Matriz'],
                    ['4', 'Bodega'],
                    ['7', 'Patio']
                ]
            },
            {
                tableName: 'cat_010_tipo_establecimiento_medico',
                description: 'CAT-010 Código tipo de Servicio (Médico)',
                data: [
                    ['1', 'Cirugía'],
                    ['2', 'Operación'],
                    ['3', 'Tratamiento médico'],
                    ['4', 'Cirugía Instituto Salvadoreño de Bienestar Magisterial'],
                    ['5', 'Operación Instituto Salvadoreño de Bienestar Magisterial'],
                    ['6', 'Tratamiento médico Instituto Salvadoreño de Bienestar Magisterial']
                ]
            },
            {
                tableName: 'cat_011_tipo_item',
                description: 'CAT-011 Tipo de Item',
                data: [
                    ['1', 'Bien'],
                    ['2', 'Servicio'],
                    ['3', 'Ambos (Bienes y Servicios, incluye los dos inherente a los Productos o servicios)'],
                    ['4', 'Otros tributos por item']
                ]
            },
            {
                tableName: 'cat_012_departamento',
                description: 'CAT-012 Departamento',
                data: [
                    ['0', 'Otro (Para extranjeros)'],
                    ['1', 'Ahuachapán'],
                    ['2', 'Santa Ana'],
                    ['3', 'Sonsonate'],
                    ['4', 'Chalatenango'],
                    ['5', 'La Libertad'],
                    ['6', 'San Salvador'],
                    ['7', 'Cuscatlán'],
                    ['8', 'La Paz'],
                    ['9', 'Cabañas'],
                    ['10', 'San Vicente'],
                    ['11', 'Usulután'],
                    ['12', 'San Miguel'],
                    ['13', 'Morazán'],
                    ['14', 'La Unión']
                ]
            },
            {
                tableName: 'cat_013_municipio',
                description: 'CAT-013 Municipio',
                // Se incluyen ejemplos principales, idealmente se carga CSV completo
                data: [
                    ['0', 'Otro (Para extranjeros)'],
                    ['13', 'AHUACHAPAN NORTE'],
                    ['14', 'AHUACHAPAN CENTRO'],
                    ['15', 'AHUACHAPAN SUR'],
                    ['14', 'SANTA ANA NORTE'],
                    ['15', 'SANTA ANA CENTRO'],
                    ['16', 'SANTA ANA ESTE'],
                    ['17', 'SANTA ANA OESTE'],
                    ['17', 'SONSONATE NORTE'],
                    ['18', 'SONSONATE CENTRO'],
                    ['19', 'SONSONATE ESTE'],
                    ['20', 'SONSONATE OESTE'],
                    ['34', 'CHALATENANGO NORTE'],
                    ['35', 'CHALATENANGO CENTRO'],
                    ['36', 'CHALATENANGO SUR'],
                    ['23', 'LA LIBERTAD NORTE'],
                    ['24', 'LA LIBERTAD CENTRO'],
                    ['25', 'LA LIBERTAD OESTE'],
                    ['26', 'LA LIBERTAD ESTE'],
                    ['27', 'LA LIBERTAD COSTA'],
                    ['28', 'LA LIBERTAD SUR'],
                    ['20', 'SAN SALVADOR NORTE'],
                    ['21', 'SAN SALVADOR OESTE'],
                    ['22', 'SAN SALVADOR ESTE'],
                    ['23', 'SAN SALVADOR CENTRO'],
                    ['24', 'SAN SALVADOR SUR'],
                    ['17', 'CUSCATLAN NORTE'],
                    ['18', 'CUSCATLAN SUR'],
                    ['23', 'LA PAZ OESTE'],
                    ['24', 'LA PAZ CENTRO'],
                    ['25', 'LA PAZ ESTE'],
                    ['10', 'CABAÑAS OESTE'],
                    ['11', 'CABAÑAS ESTE'],
                    ['14', 'SAN VICENTE NORTE'],
                    ['15', 'SAN VICENTE SUR'],
                    ['24', 'USULUTAN NORTE'],
                    ['25', 'USULUTAN ESTE'],
                    ['26', 'USULUTAN OESTE'],
                    ['21', 'SAN MIGUEL NORTE'],
                    ['22', 'SAN MIGUEL CENTRO'],
                    ['23', 'SAN MIGUEL OESTE'],
                    ['27', 'MORAZAN NORTE'],
                    ['28', 'MORAZAN SUR'],
                    ['19', 'LA UNION NORTE'],
                    ['20', 'LA UNION SUR']
                ],
            },
            {
                tableName: 'cat_014_unidad_medida',
                description: 'CAT-014 Unidad de Medida',
                data: [
                    ['1', 'metro'],
                    ['2', 'Yarda'],
                    ['6', 'milímetro'],
                    ['9', 'kilómetro cuadrado'],
                    ['10', 'Hectárea'],
                    ['13', 'metro cuadrado'],
                    ['15', 'Vara cuadrada'],
                    ['18', 'metro cúbico'],
                    ['20', 'Barril'],
                    ['22', 'Galón'],
                    ['23', 'Litro'],
                    ['24', 'Botella'],
                    ['26', 'Mililitro'],
                    ['30', 'Tonelada'],
                    ['32', 'Quintal'],
                    ['33', 'Arroba'],
                    ['34', 'Kilogramo'],
                    ['36', 'Libra'],
                    ['37', 'Onza troy'],
                    ['38', 'Onza'],
                    ['39', 'Gramo'],
                    ['40', 'Miligramo'],
                    ['42', 'Megawatt'],
                    ['43', 'Kilowatt'],
                    ['44', 'Watt'],
                    ['45', 'Megavoltio-amperio'],
                    ['46', 'Kilovoltio-amperio'],
                    ['47', 'Voltio-amperio'],
                    ['49', 'Gigawatt-hora'],
                    ['50', 'Megawatt-hora'],
                    ['51', 'Kilowatt-hora'],
                    ['52', 'Watt-hora'],
                    ['53', 'Kilovoltio'],
                    ['54', 'Voltio'],
                    ['55', 'Millar'],
                    ['56', 'Medio millar'],
                    ['57', 'Ciento'],
                    ['58', 'Docena'],
                    ['59', 'Unidad'],
                    ['99', 'Otra']
                ]
            },
            {
                tableName: 'cat_015_tributo',
                description: 'CAT-015 Tributo',
                data: [
                    // 1 - TRIBUTOS APLICADOS POR ÍTEMS REFLEJADOS EN EL RESUMEN DEL DTE
                    ['20', 'Impuesto al Valor Agregado 13%'],
                    ['C3', 'Impuesto al Valor Agregado (exportaciones) 0%'],
                    ['59', 'Turismo: por alojamiento (5%)'],
                    ['71', 'Turismo: salida del país por vía aérea $7.00'],
                    ['D1', 'FOVIAL ($0.20 Ctvs. por galón)'],
                    ['C8', 'COTRANS ($0.10 Ctvs. por galón)'],
                    ['D5', 'Otras tasas casos especiales'],
                    ['D4', 'Otros impuestos casos especiales'],

                    // 2 - TRIBUTOS APLICADOS POR ÍTEMS REFLEJADOS EN EL CUERPO DEL DOCUMENTO
                    ['A8', 'Impuesto Especial al Combustible (0%, 0.5%, 1%)'],
                    ['57', 'Impuesto industria de Cemento'],
                    ['90', 'Impuesto especial a la primera matrícula'],
                    ['A6', 'Impuesto ad-valorem, armas de fuego, municiones explosivas y artículos similares'],

                    // 3 - TRIBUTOS APLICADOS POR ÍTEMS REFLEJADOS EN EL USO INFORMATIVO
                    ['C5', 'Impuesto ad-valorem por diferencial de precios de bebidas alcohólicas (8%)'],
                    ['C6', 'Impuesto ad-valorem por diferencial de precios al tabaco cigarrillos (39%)'],
                    ['C7', 'Impuesto ad-valorem por diferencial de precios al tabaco cigarros (100%)'],
                    ['19', 'Fabricante de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante'],
                    ['28', 'Importador de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante'],
                    ['31', 'Detallistas o Expendedores de Bebidas Alcohólicas'],
                    ['32', 'Fabricante de Cerveza'],
                    ['33', 'Importador de Cerveza'],
                    ['34', 'Fabricante de Productos de Tabaco'],
                    ['35', 'Importador de Productos de Tabaco'],
                    ['36', 'Fabricante de Armas de Fuego, Municiones y Artículos Similares'],
                    ['37', 'Importador de Arma de Fuego, Munición y Artículos Similares'],
                    ['38', 'Fabricante de Explosivos'],
                    ['39', 'Importador de Explosivos'],
                    ['42', 'Fabricante de Productos Pirotécnicos'],
                    ['43', 'Importador de Productos Pirotécnicos'],
                    ['44', 'Productor de Tabaco'],
                    ['50', 'Distribuidor de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante'],
                    ['51', 'Bebidas Alcohólicas'],
                    ['52', 'Cerveza'],
                    ['53', 'Productos del Tabaco'],
                    ['54', 'Bebidas Carbonatadas o Gaseosas Simples o Endulzadas'],
                    ['55', 'Otros Específicos'],
                    ['58', 'Alcohol'],
                    ['77', 'Importador de Jugos, Néctares, Bebidas con Jugo y Refrescos'],
                    ['78', 'Distribuidor de Jugos, Néctares, Bebidas con Jugo y Refrescos'],
                    ['79', 'Sobre Llamadas Telefónicas Provenientes del Exterior'],
                    ['85', 'Detallista de Jugos, Néctares, Bebidas con Jugo y Refrescos'],
                    ['86', 'Fabricante de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas'],
                    ['91', 'Fabricante de Jugos, Néctares, Bebidas con Jugo y Refrescos'],
                    ['92', 'Importador de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas'],
                    ['A1', 'Específicos y Ad-Valorem'],
                    ['A5', 'Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulantes'],
                    ['A7', 'Alcohol Etílico'],
                    ['A9', 'Sacos Sintéticos']
                ]
            },
            {
                tableName: 'cat_016_condicion_operacion',
                description: 'CAT-016 Condición de la Operación',
                data: [
                    ['1', 'Contado'],
                    ['2', 'Crédito'],
                    ['3', 'Otro']
                ]
            },
            {
                tableName: 'cat_017_forma_pago',
                description: 'CAT-017 Forma de Pago',
                data: [
                    ['1', 'Billetes y monedas'],
                    ['2', 'Tarjeta Débito'],
                    ['3', 'Tarjeta Crédito'],
                    ['4', 'Cheque'],
                    ['5', 'Transferencia-Depósito Bancario'],
                    ['8', 'Dinero electrónico'],
                    ['9', 'Monedero electrónico'],
                    ['11', 'Bitcoin'],
                    ['12', 'Otras Criptomonedas'],
                    ['13', 'Cuentas por pagar del receptor'],
                    ['14', 'Giro bancario'],
                    ['99', 'Otros (se debe indicar el medio de pago)']
                ]
            },
            {
                tableName: 'cat_018_plazo',
                description: 'CAT-018 Plazo',
                data: [
                    ['1', 'Días'],
                    ['2', 'Meses'],
                    ['3', 'Años']
                ]
            },
            {
                tableName: 'cat_019_actividad_economica',
                description: 'CAT-019 Actividad Económica',
                data: [
                    // 1 - AGRICULTURA, GANADERÍA, SILVICULTURA Y PESCA
                    // PRODUCCIÓN AGRÍCOLA, PECUARIA, CAZA Y ACTIVIDADES DE SERVICIOS CONEXAS
                    ['01111', 'Cultivo de cereales excepto arroz y para forrajes'],
                    ['01112', 'Cultivo de legumbres'],
                    ['01113', 'Cultivo de semillas oleaginosas'],
                    ['01114', 'Cultivo de plantas para la preparación de semillas'],
                    ['01119', 'Cultivo de otros cereales excepto arroz y forrajeros n.c.p.'],
                    ['01120', 'Cultivo de arroz'],
                    ['01131', 'Cultivo de raíces y tubérculos'],
                    ['01132', 'Cultivo de brotes, bulbos, vegetales tubérculos y cultivos similares'],
                    ['01133', 'Cultivo hortícola de fruto'],
                    ['01134', 'Cultivo de hortalizas de hoja y otras hortalizas n.c.p.'],
                    ['01140', 'Cultivo de caña de azúcar'],
                    ['01150', 'Cultivo de tabaco'],
                    ['01161', 'Cultivo de algodón'],
                    ['01162', 'Cultivo de fibras vegetales excepto algodón'],
                    ['01191', 'Cultivo de plantas no perennes para la producción de semillas y flores'],
                    ['01192', 'Cultivo de cereales y pastos para la alimentación animal'],
                    ['01199', 'Producción de cultivos no estacionales n.c.p.'],
                    ['01220', 'Cultivo de frutas tropicales'],
                    ['01230', 'Cultivo de cítricos'],
                    ['01240', 'Cultivo de frutas de pepita y hueso'],
                    ['01251', 'Cultivo de frutas n.c.p.'],
                    ['01252', 'Cultivo de otros frutos y nueces de árboles y arbustos'],
                    ['01260', 'Cultivo de frutos oleaginosos'],
                    ['01271', 'Cultivo de café'],
                    ['01272', 'Cultivo de plantas para la elaboración de bebidas excepto café'],
                    ['01281', 'Cultivo de especias y aromáticas'],
                    ['01282', 'Cultivo de plantas para la obtención de productos medicinales y farmacéuticos'],
                    ['01291', 'Cultivo de árboles de hule (caucho) para la obtención de látex'],
                    ['01292', 'Cultivo de plantas para la obtención de productos químicos y colorantes'],
                    ['01299', 'Producción de cultivos perennes n.c.p.'],
                    ['01300', 'Propagación de plantas'],
                    ['01301', 'Cultivo de plantas y flores ornamentales'],
                    ['01410', 'Cría y engorde de ganado bovino'],
                    ['01420', 'Cría de caballos y otros equinos'],
                    ['01440', 'Cría de ovejas y cabras'],
                    ['01450', 'Cría de cerdos'],
                    ['01460', 'Cría de aves de corral y producción de huevos'],
                    ['01491', 'Cría de abejas apicultura para la obtención de miel y otros productos apícolas'],
                    ['01492', 'Cría de conejos'],
                    ['01493', 'Cría de iguanas y garrobos'],
                    ['01494', 'Cría de mariposas y otros insectos'],
                    ['01499', 'Cría y obtención de productos animales n.c.p.'],
                    ['01500', 'Cultivo de productos agrícolas en combinación con la cría de animales'],
                    ['01611', 'Servicios de maquinaria agrícola'],
                    ['01612', 'Control de plagas'],
                    ['01613', 'Servicios de riego'],
                    ['01614', 'Servicios de contratación de mano de obra para la agricultura'],
                    ['01619', 'Servicios agrícolas n.c.p.'],
                    ['01621', 'Actividades para mejorar la reproducción, el crecimiento y el rendimiento de los animales y sus productos'],
                    ['01622', 'Servicios de mano de obra pecuaria'],
                    ['01629', 'Servicios pecuarios n.c.p.'],
                    ['01631', 'Labores post cosecha de preparación de los productos agrícolas para su comercialización o para la industria'],
                    ['01632', 'Servicio de beneficio de café'],
                    ['01633', 'Servicio de beneficiado de plantas textiles (incluye el beneficiado cuando este es realizado en la misma explotación agropecuaria)'],
                    ['01640', 'Tratamiento de semillas para la propagación'],
                    // 2 -SILVICULTURA Y EXTRACCIÓN DE MADERA
                    ['01700', 'Caza ordinaria y mediante trampas, repoblación de animales de caza y servicios conexos'],
                    ['02100', 'Silvicultura y otras actividades forestales'],
                    ['02200', 'Extracción de madera'],
                    ['02300', 'Recolección de productos diferentes a la madera'],
                    ['02400', 'Servicios de apoyo a la silvicultura'],
                    // 3 - PESCA Y ACUICULTURA
                    ['03110', 'Pesca marítima de altura y costera'],
                    ['03120', 'Pesca de agua dulce'],
                    ['03210', 'Acuicultura marítima'],
                    ['03220', 'Acuicultura de agua dulce'],
                    ['03300', 'Servicios de apoyo a la pesca y acuicultura'],
                    // 5 - EXPLOTACIÓN DE MINAS Y CANTERAS
                    // EXTRACCIÓN CARBÓN DE PIEDRA Y LIGNITO
                    ['05100', 'Extracción de hulla'],
                    ['05200', 'Extracción y aglomeración de lignito'],

                    // 6 - EXTRACCIÓN DE PETRÓLEO CRUDO Y GAS NATURAL
                    ['06100', 'Extracción de petróleo crudo'],
                    ['06200', 'Extracción de gas natural'],

                    // 7 - EXTRACCIÓN DE MINERALES METALÍFEROS
                    ['07100', 'Extracción de minerales de hierro'],
                    ['07210', 'Extracción de minerales de uranio y torio'],
                    ['07290', 'Extracción de minerales metalíferos no ferrosos'],

                    // 8 - EXPLOTACIÓN DE OTRAS MINAS Y CANTERAS
                    ['08100', 'Extracción de piedra, arena y arcilla'],
                    ['08910', 'Extracción de minerales para la fabricación de abonos y productos químicos'],
                    ['08920', 'Extracción y aglomeración de turba'],
                    ['08930', 'Extracción de sal'],
                    ['08990', 'Explotación de otras minas y canteras n.c.p.'],

                    // 9 - ACTIVIDADES DE SERVICIOS DE APOYO A LA EXPLOTACIÓN DE MINAS Y CANTERAS
                    ['09100', 'Actividades de apoyo a la extracción de petróleo y gas natural'],
                    ['09900', 'Actividades de apoyo a la explotación de minas y canteras'],

                    // 10 - INDUSTRIAS MANUFACTURERAS / ELABORACIÓN DE PRODUCTOS ALIMENTICIOS
                    ['10101', 'Servicio de rastros y mataderos de bovinos y porcinos'],
                    ['10102', 'Matanza y procesamiento de bovinos y porcinos'],
                    ['10103', 'Matanza y procesamientos de aves de corral'],
                    ['10104', 'Elaboración y conservación de embutidos y tripas naturales'],
                    ['10105', 'Servicios de conservación y empaque de carnes'],
                    ['10106', 'Elaboración y conservación de grasas y aceites animales'],
                    ['10107', 'Servicios de molienda de carne'],
                    ['10108', 'Elaboración de productos de carne n.c.p.'],
                    ['10201', 'Procesamiento y conservación de pescado, crustáceos y moluscos'],
                    ['10209', 'Fabricación de productos de pescado n.c.p.'],
                    ['10301', 'Elaboración de jugos de frutas y hortalizas'],
                    ['10302', 'Elaboración y envase de jaleas, mermeladas y frutas deshidratadas'],
                    ['10309', 'Elaboración de productos de frutas y hortalizas n.c.p.'],
                    ['10401', 'Fabricación de aceites y grasas vegetales y animales comestibles'],
                    ['10402', 'Fabricación de aceites y grasas vegetales y animales no comestibles'],
                    ['10409', 'Servicio de maquilado de aceites'],
                    ['10501', 'Fabricación de productos lácteos excepto sorbetes y quesos sustitutos'],
                    ['10502', 'Fabricación de sorbetes y helados'],
                    ['10503', 'Fabricación de quesos'],
                    ['10611', 'Molienda de cereales'],
                    ['10612', 'Elaboración de cereales para el desayuno y similares'],
                    ['10613', 'Servicios de beneficiado de productos agrícolas n.c.p. (excluye Beneficio de azúcar rama 1072 y beneficio de café rama 0163)'],
                    ['10621', 'Fabricación de almidón'],
                    ['10628', 'Servicio de molienda de maíz húmedo molino para nixtamal'],
                    ['10711', 'Elaboración de tortillas'],
                    ['10712', 'Fabricación de pan, galletas y barquillos'],
                    ['10713', 'Fabricación de repostería'],
                    ['10721', 'Ingenios azucareros'],
                    ['10722', 'Molienda de caña de azúcar para la elaboración de dulces'],
                    ['10723', 'Elaboración de jarabes de azúcar y otros similares'],
                    ['10724', 'Maquilado de azúcar de caña'],
                    ['10730', 'Fabricación de cacao, chocolates y productos de confitería'],
                    ['10740', 'Elaboración de macarrones, fideos, y productos farináceos similares'],
                    ['10750', 'Elaboración de comidas y platos preparados para la reventa en locales y/o para exportación'],
                    ['10791', 'Elaboración de productos de café'],
                    ['10792', 'Elaboración de especies, sazonadores y condimentos'],
                    ['10793', 'Elaboración de sopas, cremas y consomé'],
                    ['10794', 'Fabricación de bocadillos tostados y/o fritos'],
                    ['10799', 'Elaboración de productos alimenticios n.c.p.'],
                    ['10800', 'Elaboración de alimentos preparados para animales'],

                    // 11 - ELABORACIÓN DE BEBIDAS
                    ['11012', 'Fabricación de aguardiente y licores'],
                    ['11020', 'Elaboración de vinos'],
                    ['11030', 'Fabricación de cerveza'],
                    ['11041', 'Fabricación de aguas gaseosas'],
                    ['11042', 'Fabricación y envasado de agua'],
                    ['11043', 'Elaboración de refrescos'],
                    ['11048', 'Maquilado de aguas gaseosas'],
                    ['11049', 'Elaboración de bebidas no alcohólicas'],

                    // 12 - ELABORACIÓN DE PRODUCTOS DE TABACO
                    ['12000', 'Elaboración de productos de tabaco'],

                    // 13 - FABRICACIÓN DE PRODUCTOS TEXTILES
                    ['13111', 'Preparación de fibras textiles'],
                    ['13112', 'Fabricación de hilados'],
                    ['13120', 'Fabricación de telas'],
                    ['13130', 'Acabado de productos textiles'],
                    ['13910', 'Fabricación de tejidos de punto y ganchillo'],
                    ['13921', 'Fabricación de productos textiles para el hogar'],
                    ['13922', 'Sacos, bolsas y otros artículos textiles'],
                    ['13929', 'Fabricación de artículos confeccionados con materiales textiles, excepto prendas de vestir n.c.p.'],
                    ['13930', 'Fabricación de tapices y alfombras'],
                    ['13941', 'Fabricación de cuerdas de henequén y otras fibras naturales (lazos, pitas)'],
                    ['13942', 'Fabricación de redes de diversos materiales'],
                    ['13948', 'Maquilado de productos trenzables de cualquier material (petates, sillas, etc.)'],
                    ['13991', 'Fabricación de adornos, etiquetas y otros artículos para prendas de vestir'],
                    ['13992', 'Servicio de bordados en artículos y prendas de tela'],
                    ['13999', 'Fabricación de productos textiles n.c.p.'],

                    // 14 - FABRICACIÓN DE PRENDAS DE VESTIR
                    ['14101', 'Fabricación de ropa interior, para dormir y similares'],
                    ['14102', 'Fabricación de ropa para niños'],
                    ['14103', 'Fabricación de prendas de vestir para ambos sexos'],
                    ['14104', 'Confección de prendas a medida'],
                    ['14105', 'Fabricación de prendas de vestir para deportes'],
                    ['14106', 'Elaboración de artesanías de uso personal confeccionadas especialmente de materiales textiles'],
                    ['14108', 'Maquilado de prendas de vestir, accesorios y otros'],
                    ['14109', 'Fabricación de prendas y accesorios de vestir n.c.p.'],
                    ['14200', 'Fabricación de artículos de piel'],
                    ['14301', 'Fabricación de calcetines, calcetas, medias (panty house) y otros similares'],
                    ['14302', 'Fabricación de ropa interior de tejido de punto'],
                    ['14309', 'Fabricación de prendas de vestir de tejido de punto n.c.p.'],

                    // 15 - FABRICACIÓN DE CUEROS Y PRODUCTOS CONEXOS
                    ['15110', 'Curtido y adobo de cueros; adobo y teñido de pieles'],
                    ['15121', 'Fabricación de maletas, bolsos de mano y otros artículos de marroquinería'],
                    ['15122', 'Fabricación de monturas, accesorios y vainas talabartería'],
                    ['15123', 'Fabricación de artesanías principalmente de cuero natural y sintético'],
                    ['15128', 'Maquilado de artículos de cuero natural, sintético y de otros materiales'],
                    ['15201', 'Fabricación de calzado'],
                    ['15202', 'Fabricación de partes y accesorios de calzado'],
                    ['15208', 'Maquilado de partes y accesorios de calzado'],

                    // 16 - PRODUCCIÓN DE MADERA Y PRODUCTOS DE MADERA
                    ['16100', 'Aserradero y acepilladura de madera'],
                    ['16210', 'Fabricación de madera laminada, terciada, enchapada y contrachapada, paneles para la construcción'],
                    ['16220', 'Fabricación de partes y piezas de carpintería para edificios y construcciones'],
                    ['16230', 'Fabricación de envases y recipientes de madera'],
                    ['16292', 'Fabricación de artesanías de madera, semillas, materiales trenzables'],
                    ['16299', 'Fabricación de productos de madera, corcho, paja y materiales trenzables n.c.p.'],

                    // 17 - FABRICACIÓN DE PAPEL Y PRODUCTOS DE PAPEL
                    ['17010', 'Fabricación de pasta de madera, papel y cartón'],
                    ['17020', 'Fabricación de papel y cartón ondulado y envases de papel y cartón'],
                    ['17091', 'Fabricación de artículos de papel y cartón de uso personal y doméstico'],
                    ['17092', 'Fabricación de productos de papel n.c.p.'],

                    // 18 - IMPRESIÓN Y REPRODUCCIÓN DE GRABACIONES
                    ['18110', 'Impresión'],
                    ['18120', 'Servicios relacionados con la impresión'],
                    ['18200', 'Reproducción de grabaciones'],

                    // 19 - FABRICACIÓN DE COQUE Y PRODUCTOS DE REFINACIÓN DE PETRÓLEO
                    ['19100', 'Fabricación de productos de hornos de coque'],
                    ['19201', 'Fabricación de combustible'],
                    ['19202', 'Fabricación de aceites y lubricantes'],

                    // 20 - FABRICACIÓN DE SUSTANCIAS Y PRODUCTOS QUÍMICOS
                    ['20111', 'Fabricación de materias primas para la fabricación de colorantes'],
                    ['20112', 'Fabricación de materiales curtientes'],
                    ['20113', 'Fabricación de gases industriales'],
                    ['20114', 'Fabricación de alcohol etílico'],
                    ['20119', 'Fabricación de sustancias químicas básicas'],
                    ['20120', 'Fabricación de abonos y fertilizantes'],
                    ['20130', 'Fabricación de plástico y caucho en formas primarias'],
                    ['20210', 'Fabricación de plaguicidas y otros productos químicos de uso agropecuario'],
                    ['20220', 'Fabricación de pinturas, barnices y productos de revestimiento similares; tintas de imprenta y masillas'],
                    ['20231', 'Fabricación de jabones, detergentes y similares para limpieza'],
                    ['20232', 'Fabricación de perfumes, cosméticos y productos de higiene y cuidado personal, incluyendo tintes, champú, etc.'],
                    ['20291', 'Fabricación de tintas y colores para escribir y pintar; fabricación de cintas para impresoras'],
                    ['20292', 'Fabricación de productos pirotécnicos, explosivos y municiones'],
                    ['20299', 'Fabricación de productos químicos n.c.p.'],
                    ['20300', 'Fabricación de fibras artificiales'],

                    // 21 - PRODUCTOS FARMACÉUTICOS
                    ['21001', 'Manufactura de productos farmacéuticos, sustancias químicas y productos botánicos'],
                    ['21008', 'Maquilado de medicamentos'],

                    // 22 - PRODUCTOS DE CAUCHO Y PLÁSTICO
                    ['22110', 'Fabricación de cubiertas y cámaras; renovación y recauchutado de cubiertas'],
                    ['22190', 'Fabricación de otros productos de caucho'],
                    ['22201', 'Fabricación de envases plásticos'],
                    ['22202', 'Fabricación de productos plásticos para uso personal o doméstico'],
                    ['22208', 'Maquila de plásticos'],
                    ['22209', 'Fabricación de productos plásticos n.c.p.'],

                    // 23 - PRODUCTOS MINERALES NO METÁLICOS
                    ['23101', 'Fabricación de vidrio'],
                    ['23102', 'Fabricación de recipientes y envases de vidrio'],
                    ['23108', 'Servicio de maquilado'],
                    ['23109', 'Fabricación de productos de vidrio n.c.p.'],
                    ['23910', 'Fabricación de productos refractarios'],
                    ['23920', 'Fabricación de productos de arcilla para la construcción'],
                    ['23931', 'Fabricación de productos de cerámica y porcelana no refractaria'],
                    ['23932', 'Fabricación de productos de cerámica y porcelana n.c.p.'],
                    ['23940', 'Fabricación de cemento, cal y yeso'],
                    ['23950', 'Fabricación de artículos de hormigón, cemento y yeso'],
                    ['23960', 'Corte, tallado y acabado de la piedra'],
                    ['23990', 'Fabricación de productos minerales no metálicos n.c.p.'],

                    // 24 - FABRICACIÓN DE METALES COMUNES
                    ['24100', 'Industrias básicas de hierro y acero'],
                    ['24200', 'Fabricación de productos primarios de metales preciosos y metales no ferrosos'],
                    ['24310', 'Fundición de hierro y acero'],
                    ['24320', 'Fundición de metales no ferrosos'],

                    // 25 - PRODUCTOS DERIVADOS DE METAL
                    ['25111', 'Fabricación de productos metálicos para uso estructural'],
                    ['25118', 'Servicio de maquila para la fabricación de estructuras metálicas'],
                    ['25120', 'Fabricación de tanques, depósitos y recipientes de metal'],
                    ['25130', 'Fabricación de generadores de vapor, excepto calderas de agua caliente para calefacción central'],
                    ['25200', 'Fabricación de armas y municiones'],
                    ['25910', 'Forjado, prensado, estampado y laminado de metales; pulvimetalurgia'],
                    ['25920', 'Tratamiento y revestimiento de metales'],
                    ['25930', 'Fabricación de artículos de cuchillería, herramientas de mano y artículos de ferretería'],
                    ['25991', 'Fabricación de envases y artículos conexos de metal'],
                    ['25992', 'Fabricación de artículos metálicos de uso personal y/o doméstico'],
                    ['25999', 'Fabricación de productos elaborados de metal n.c.p.'],

                    // 26 - INFORMÁTICA, ELECTRÓNICA Y ÓPTICA
                    ['26100', 'Fabricación de componentes electrónicos'],
                    ['26200', 'Fabricación de computadoras y equipo conexo'],
                    ['26300', 'Fabricación de equipo de comunicaciones'],
                    ['26400', 'Fabricación de aparatos electrónicos de consumo para audio, video radio y televisión'],
                    ['26510', 'Fabricación de instrumentos y aparatos para medir, verificar, ensayar, navegar y de control de procesos industriales'],
                    ['26520', 'Fabricación de relojes y piezas de relojes'],
                    ['26600', 'Fabricación de equipo médico de irradiación y equipo electrónico de uso médico y terapéutico'],
                    ['26700', 'Fabricación de instrumentos de óptica y equipo fotográfico'],
                    ['26800', 'Fabricación de medios magnéticos y ópticos'],

                    // 27 - EQUIPO ELÉCTRICO
                    ['27100', 'Fabricación de motores, generadores, transformadores eléctricos, aparatos de distribución y control de electricidad'],
                    ['27200', 'Fabricación de pilas, baterías y acumuladores'],
                    ['27310', 'Fabricación de cables de fibra óptica'],
                    ['27320', 'Fabricación de otros hilos y cables eléctricos'],
                    ['27330', 'Fabricación de dispositivos de cableados'],
                    ['27400', 'Fabricación de equipo eléctrico de iluminación'],
                    ['27500', 'Fabricación de aparatos de uso doméstico'],
                    ['27900', 'Fabricación de otros tipos de equipo eléctrico'],

                    // 28 - MAQUINARIA Y EQUIPO NCP
                    ['28110', 'Fabricación de motores y turbinas, excepto motores para aeronaves, vehículos automotores y motocicletas'],
                    ['28120', 'Fabricación de equipo hidráulico'],
                    ['28130', 'Fabricación de otras bombas, compresores, grifos y válvulas'],
                    ['28140', 'Fabricación de cojinetes, engranajes, trenes de engranajes y piezas de transmisión'],
                    ['28150', 'Fabricación de hornos y quemadores'],
                    ['28160', 'Fabricación de equipo de elevación y manipulación'],
                    ['28170', 'Fabricación de maquinaria y equipo de oficina'],
                    ['28180', 'Fabricación de herramientas manuales'],
                    ['28190', 'Fabricación de otros tipos de maquinaria de uso general'],
                    ['28210', 'Fabricación de maquinaria agropecuaria y forestal'],
                    ['28220', 'Fabricación de máquinas para conformar metales y maquinaria herramienta'],
                    ['28230', 'Fabricación de maquinaria metalúrgica'],
                    ['28240', 'Fabricación de maquinaria para la explotación de minas y canteras y para obras de construcción'],
                    ['28250', 'Fabricación de maquinaria para la elaboración de alimentos, bebidas y tabaco'],
                    ['28260', 'Fabricación de maquinaria para la elaboración de productos textiles, prendas de vestir y cueros'],
                    ['28291', 'Fabricación de máquinas para imprenta'],
                    ['28299', 'Fabricación de maquinaria de uso especial n.c.p.'],

                    // 29 - VEHÍCULOS AUTOMOTORES
                    ['29100', 'Fabricación vehículos automotores'],
                    ['29200', 'Fabricación de carrocerías para vehículos automotores; fabricación de remolques y semiremolques'],
                    ['29300', 'Fabricación de partes, piezas y accesorios para vehículos automotores'],

                    // 30 - OTROS EQUIPOS DE TRANSPORTE
                    ['30110', 'Fabricación de buques'],
                    ['30120', 'Construcción y reparación de embarcaciones de recreo'],
                    ['30200', 'Fabricación de locomotoras y de material rodante'],
                    ['30300', 'Fabricación de aeronaves y naves espaciales'],
                    ['30400', 'Fabricación de vehículos militares de combate'],
                    ['30910', 'Fabricación de motocicletas'],
                    ['30920', 'Fabricación de bicicletas y sillones de ruedas para inválidos'],
                    ['30990', 'Fabricación de equipo de transporte n.c.p.'],

                    // 31 - MUEBLES
                    ['31001', 'Fabricación de colchones y somier'],
                    ['31002', 'Fabricación de muebles y otros productos de madera a medida'],
                    ['31008', 'Servicios de maquilado de muebles'],
                    ['31009', 'Fabricación de muebles n.c.p.'],

                    // 32 - OTRAS INDUSTRIAS MANUFACTURERAS
                    ['32110', 'Fabricación de joyas platerías y joyerías'],
                    ['32120', 'Fabricación de joyas de imitación (fantasía) y artículos conexos'],
                    ['32200', 'Fabricación de instrumentos musicales'],
                    ['32301', 'Fabricación de artículos de deporte'],
                    ['32308', 'Servicio de maquila de productos deportivos'],
                    ['32401', 'Fabricación de juegos de mesa y de salón'],
                    ['32402', 'Servicio de maquilado de juguetes y juegos'],
                    ['32409', 'Fabricación de juegos y juguetes n.c.p.'],
                    ['32500', 'Fabricación de instrumentos y materiales médicos y odontológicos'],
                    ['32901', 'Fabricación de lápices, bolígrafos, sellos y artículos de librería en general'],
                    ['32902', 'Fabricación de escobas, cepillos, pinceles y similares'],
                    ['32903', 'Fabricación de artesanías de materiales diversos'],
                    ['32904', 'Fabricación de artículos de uso personal y domésticos n.c.p.'],
                    ['32905', 'Fabricación de accesorios para las confecciones y la marroquinería n.c.p.'],
                    ['32908', 'Servicios de maquila n.c.p.'],
                    ['32909', 'Fabricación de productos manufacturados n.c.p.'],

                    // 33 - REPARACIÓN E INSTALACIÓN DE MAQUINARIA Y EQUIPO
                    ['33110', 'Reparación y mantenimiento de productos elaborados de metal'],
                    ['33120', 'Reparación y mantenimiento de maquinaria'],
                    ['33130', 'Reparación y mantenimiento de equipo electrónico y óptico'],
                    ['33140', 'Reparación y mantenimiento de equipo eléctrico'],
                    ['33150', 'Reparación y mantenimiento de equipo de transporte, excepto vehículos automotores'],
                    ['33190', 'Reparación y mantenimiento de equipos n.c.p.'],
                    ['33200', 'Instalación de maquinaria y equipo industrial'],

                    // 35 - SUMINISTROS DE ELECTRICIDAD, GAS, VAPOR Y AIRE ACONDICIONADO
                    ['35101', 'Generación de energía eléctrica'],
                    ['35102', 'Transmisión de energía eléctrica'],
                    ['35103', 'Distribución de energía eléctrica'],
                    ['35200', 'Fabricación de gas, distribución de combustibles gaseosos por tuberías'],
                    ['35300', 'Suministro de vapor y agua caliente'],

                    // 36 - SUMINISTRO DE AGUA, ALCANTARILLADO, DESECHOS Y SANEAMIENTO
                    ['36000', 'Captación, tratamiento y suministro de agua'],
                    ['37000', 'Evacuación de aguas residuales (alcantarillado)'],
                    ['38110', 'Recolección y transporte de desechos sólidos proveniente de hogares y sector urbano'],
                    ['38120', 'Recolección de desechos peligrosos'],
                    ['38210', 'Tratamiento y eliminación de desechos inicuos'],
                    ['38220', 'Tratamiento y eliminación de desechos peligrosos'],
                    ['38301', 'Reciclaje de desperdicios y desechos textiles'],
                    ['38302', 'Reciclaje de desperdicios y desechos de plástico y caucho'],
                    ['38303', 'Reciclaje de desperdicios y desechos de vidrio'],
                    ['38304', 'Reciclaje de desperdicios y desechos de papel y cartón'],
                    ['38305', 'Reciclaje de desperdicios y desechos metálicos'],
                    ['38309', 'Reciclaje de desperdicios y desechos no metálicos n.c.p.'],
                    ['39000', 'Actividades de Saneamiento y otros Servicios de Gestión de Desechos'],

                    // 41 - CONSTRUCCIÓN DE EDIFICIOS
                    ['41001', 'Construcción de edificios residenciales'],
                    ['41002', 'Construcción de edificios no residenciales'],

                    // 42 - OBRAS DE INGENIERÍA CIVIL
                    ['42100', 'Construcción de carreteras, calles y caminos'],
                    ['42200', 'Construcción de proyectos de servicio público'],
                    ['42900', 'Construcción de obras de ingeniería civil n.c.p.'],

                    // 43 - ACTIVIDADES ESPECIALIZADAS DE CONSTRUCCIÓN
                    ['43110', 'Demolición'],
                    ['43120', 'Preparación de terreno'],
                    ['43210', 'Instalaciones eléctricas'],
                    ['43220', 'Instalación de fontanería, calefacción y aire acondicionado'],
                    ['43290', 'Otras instalaciones para obras de construcción'],
                    ['43300', 'Terminación y acabado de edificios'],
                    ['43900', 'Otras actividades especializadas de construcción'],
                    ['43901', 'Fabricación de techos y materiales diversos'],

                    // 45 - COMERCIO AL POR MAYOR Y MENOR; REPARACIÓN DE VEHÍCULOS
                    ['45100', 'Venta de vehículos automotores'],
                    ['45201', 'Reparación mecánica de vehículos automotores'],
                    ['45202', 'Reparaciones eléctricas del automotor y recarga de baterías'],
                    ['45203', 'Enderezado y pintura de vehículos automotores'],
                    ['45204', 'Reparaciones de radiadores, escapes y silenciadores'],
                    ['45205', 'Reparación y reconstrucción de vías, stop y otros artículos de fibra de vidrio'],
                    ['45206', 'Reparación de llantas de vehículos automotores'],
                    ['45207', 'Polarizado de vehículos (mediante la adhesión de papel especial a los vidrios)'],
                    ['45208', 'Lavado y pasteado de vehículos (carwash)'],
                    ['45209', 'Reparaciones de vehículos n.c.p.'],
                    ['45211', 'Remolque de vehículos automotores'],
                    ['45301', 'Venta de partes, piezas y accesorios nuevos para vehículos automotores'],
                    ['45302', 'Venta de partes, piezas y accesorios usados para vehículos automotores'],
                    ['45401', 'Venta de motocicletas'],
                    ['45402', 'Venta de repuestos, piezas y accesorios de motocicletas'],
                    ['45403', 'Mantenimiento y reparación de motocicletas'],

                    // 46 - COMERCIO AL POR MAYOR, EXCEPTO VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS (Parte 1) ---
                    ['46100', 'Venta al por mayor a cambio de retribución o por contrata'],
                    ['46201', 'Venta al por mayor de materias primas agrícolas'],
                    ['46202', 'Venta al por mayor de productos de la silvicultura'],
                    ['46203', 'Venta al por mayor de productos pecuarios y de granja'],
                    ['46211', 'Venta de productos para uso agropecuario'],
                    ['46291', 'Venta al por mayor de granos básicos (cereales, leguminosas)'],
                    ['46292', 'Venta al por mayor de semillas mejoradas para cultivo'],
                    ['46293', 'Venta al por mayor de café oro y uva'],
                    ['46294', 'Venta al por mayor de caña de azúcar'],
                    ['46295', 'Venta al por mayor de flores, plantas y otros productos naturales'],
                    ['46296', 'Venta al por mayor de productos agrícolas'],
                    ['46297', 'Venta al por mayor de ganado bovino (vivo)'],
                    ['46298', 'Venta al por mayor de animales porcinos, ovinos, caprino, canículas, apícolas, avícolas vivos'],
                    ['46299', 'Venta de otras especies vivas del reino animal'],
                    ['46301', 'Venta al por mayor de alimentos'],
                    ['46302', 'Venta al por mayor de bebidas'],
                    ['46303', 'Venta al por mayor de tabaco'],
                    ['46371', 'Venta al por mayor de frutas, hortalizas (verduras), legumbres y tubérculos'],
                    ['46372', 'Venta al por mayor de pollos, gallinas destazadas, pavos y otras aves'],
                    ['46373', 'Venta al por mayor de carne bovina y porcina, productos de carne y embutidos'],
                    ['46374', 'Venta al por mayor de huevos'],
                    ['46375', 'Venta al por mayor de productos lácteos'],
                    ['46376', 'Venta al por mayor de productos farináceos de panadería (pan dulce, cakes, repostería, etc.)'],
                    ['46377', 'Venta al por mayor de pastas alimenticias, aceites y grasas comestibles vegetal y animal'],
                    ['46378', 'Venta al por mayor de sal comestible'],
                    ['46379', 'Venta al por mayor de azúcar'],
                    ['46391', 'Venta al por mayor de abarrotes (vinos, licores, productos alimenticios envasados, etc.)'],
                    ['46392', 'Venta al por mayor de aguas gaseosas'],
                    ['46393', 'Venta al por mayor de agua purificada'],
                    ['46394', 'Venta al por mayor de refrescos y otras bebidas, líquidas o en polvo'],
                    ['46395', 'Venta al por mayor de cerveza y licores'],
                    ['46396', 'Venta al por mayor de hielo'],
                    ['46411', 'Venta al por mayor de hilados, tejidos y productos textiles de mercería'],
                    ['46412', 'Venta al por mayor de artículos textiles excepto confecciones para el hogar'],
                    ['46413', 'Venta al por mayor de confecciones textiles para el hogar'],
                    ['46414', 'Venta al por mayor de prendas de vestir y accesorios de vestir'],
                    ['46415', 'Venta al por mayor de ropa usada'],
                    ['46416', 'Venta al por mayor de calzado'],
                    ['46417', 'Venta al por mayor de artículos de marroquinería y talabartería'],
                    ['46418', 'Venta al por mayor de artículos de peletería'],
                    ['46419', 'Venta al por mayor de otros artículos textiles n.c.p.'],
                    ['46471', 'Venta al por mayor de instrumentos musicales'],
                    ['46472', 'Venta al por mayor de colchones, almohadas, cojines, etc.'],
                    ['46473', 'Venta al por mayor de artículos de aluminio para el hogar y para otros usos'],
                    ['46474', 'Venta al por mayor de depósitos y otros artículos plásticos para el hogar y otros usos, incluyendo los desechables de durapax y no desechables'],
                    ['46475', 'Venta al por mayor de cámaras fotográficas, accesorios y materiales'],
                    ['46482', 'Venta al por mayor de medicamentos, artículos y otros productos de uso veterinario'],
                    ['46483', 'Venta al por mayor de productos y artículos de belleza y de uso personal'],
                    ['46484', 'Venta de productos farmacéuticos y medicinales'],
                    ['46491', 'Venta al por mayor de productos medicinales, cosméticos, perfumería y productos de limpieza'],
                    ['46492', 'Venta al por mayor de relojes y artículos de joyería'],
                    ['46493', 'Venta al por mayor de electrodomésticos y artículos del hogar excepto bazar; artículos de iluminación'],
                    ['46494', 'Venta al por mayor de artículos de bazar y similares'],
                    ['46495', 'Venta al por mayor de artículos de óptica'],
                    ['46496', 'Venta al por mayor de revistas, periódicos, libros, artículos de librería y artículos de papel y cartón en general'],
                    ['46497', 'Venta de artículos deportivos, juguetes y rodados'],
                    ['46498', 'Venta al por mayor de productos usados para el hogar o el uso personal'],
                    ['46499', 'Venta al por mayor de enseres domésticos y de uso personal n.c.p.'],
                    ['46500', 'Venta al por mayor de bicicletas, partes, accesorios y otros'],
                    ['46510', 'Venta al por mayor de computadoras, equipo periférico y programas informáticos'],
                    ['46520', 'Venta al por mayor de equipos de comunicación'],
                    ['46530', 'Venta al por mayor de maquinaria y equipo agropecuario, accesorios, partes y suministros'],
                    ['46590', 'Venta de equipos e instrumentos de uso profesional y científico y aparatos de medida y control'],
                    ['46591', 'Venta al por mayor de maquinaria equipo, accesorios y materiales para la industria de la madera y sus productos'],
                    ['46592', 'Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria gráfica y del papel, cartón y productos de papel y cartón'],
                    ['46593', 'Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria de productos químicos, plástico y caucho'],
                    ['46594', 'Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria metálica y de sus productos'],
                    ['46595', 'Venta al por mayor de equipamiento para uso médico, odontológico, veterinario y servicios conexos'],
                    ['46596', 'Venta al por mayor de maquinaria, equipo, accesorios y partes para la industria de la alimentación'],
                    ['46597', 'Venta al por mayor de maquinaria, equipo y accesorios para la industria textil, confecciones y cuero'],
                    ['46598', 'Venta al por mayor de maquinaria, equipo y accesorios para la construcción y explotación de minas y canteras'],
                    ['46599', 'Venta al por mayor de otro tipo de maquinaria y equipo con sus accesorios y partes'],
                    ['46610', 'Venta al por mayor de otros combustibles sólidos, líquidos, gaseosos y de productos conexos'],
                    ['46612', 'Venta al por mayor de combustibles para automotores, aviones, barcos, maquinaria y otros'],
                    ['46613', 'Venta al por mayor de lubricantes, grasas y otros aceites para automotores, maquinaria industrial, etc.'],
                    ['46614', 'Venta al por mayor de gas propano'],
                    ['46615', 'Venta al por mayor de leña y carbón'],
                    ['46620', 'Venta al por mayor de metales y minerales metalíferos'],
                    ['46631', 'Venta al por mayor de puertas, ventanas, vitrinas y similares'],
                    ['46632', 'Venta al por mayor de artículos de ferretería y pinturerías'],
                    ['46633', 'Vidrierías'],
                    ['46634', 'Venta al por mayor de maderas'],
                    ['46639', 'Venta al por mayor de materiales para la construcción n.c.p.'],
                    ['46691', 'Venta al por mayor de sal industrial sin yodar'],
                    ['46692', 'Venta al por mayor de productos intermedios y desechos de origen textil'],
                    ['46693', 'Venta al por mayor de productos intermedios y desechos de origen metálico'],
                    ['46694', 'Venta al por mayor de productos intermedios y desechos de papel y cartón'],

                    // COMERCIO AL POR MAYOR, EXCEPTO VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS (Parte 2) ---
                    ['46695', 'Venta al por mayor fertilizantes, abonos, agroquímicos y productos similares'],
                    ['46696', 'Venta al por mayor de productos intermedios y desechos de origen plástico'],
                    ['46697', 'Venta al por mayor de tintas para imprenta, productos curtientes y materias y productos colorantes'],
                    ['46698', 'Venta de productos intermedios y desechos de origen químico y de caucho'],
                    ['46699', 'Venta al por mayor de productos intermedios y desechos n.c.p.'],
                    ['46701', 'Venta de algodón en oro'],
                    ['46900', 'Venta al por mayor de otros productos'],
                    ['46901', 'Venta al por mayor de cohetes y otros productos pirotécnicos'],
                    ['46902', 'Venta al por mayor de artículos diversos para consumo humano'],
                    ['46903', 'Venta al por mayor de armas de fuego, municiones y accesorios'],
                    ['46904', 'Venta al por mayor de toldos y tiendas de campaña de cualquier material'],
                    ['46905', 'Venta al por mayor de exhibidores publicitarios y rótulos'],
                    ['46906', 'Venta al por mayor de artículos promocionales diversos'],

                    // 47- COMERCIO AL POR MENOR, EXCEPTO VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS ---
                    ['47111', 'Venta en supermercados'],
                    ['47112', 'Venta en tiendas de artículos de primera necesidad'],
                    ['47119', 'Almacenes (venta de diversos artículos)'],
                    ['47120', 'Almacenes (venta de diversos artículos), y venta de vehículos automotores y motocicletas'],
                    ['47190', 'Venta al por menor de otros productos en comercios no especializados'],
                    ['47199', 'Venta de establecimientos no especializados con surtido compuesto principalmente de alimentos, bebidas y tabaco'],
                    ['47211', 'Venta al por menor de frutas y hortalizas'],
                    ['47212', 'Venta al por menor de carnes, embutidos y productos de granja'],
                    ['47213', 'Venta al por menor de pescado y mariscos'],
                    ['47214', 'Venta al por menor de productos lácteos'],
                    ['47215', 'Venta al por menor de productos de panadería, repostería y galletas'],
                    ['47216', 'Venta al por menor de huevos'],
                    ['47217', 'Venta al por menor de carnes y productos cárnicos'],
                    ['47218', 'Venta al por menor de granos básicos y otros'],
                    ['47219', 'Venta al por menor de alimentos n.c.p.'],
                    ['47221', 'Venta al por menor de hielo'],
                    ['47223', 'Venta de bebidas no alcohólicas, para su consumo fuera del establecimiento'],
                    ['47224', 'Venta de bebidas alcohólicas, para su consumo fuera del establecimiento'],
                    ['47225', 'Venta de bebidas alcohólicas para su consumo dentro del establecimiento'],
                    ['47230', 'Venta al por menor de tabaco'],
                    ['47300', 'Venta de combustibles, lubricantes y otros (gasolineras)'],
                    ['47411', 'Venta al por menor de computadoras y equipo periférico'],
                    ['47412', 'Venta de equipo y accesorios de telecomunicación'],
                    ['47420', 'Venta al por menor de equipo de audio y video'],
                    ['47510', 'Venta al por menor de hilados, tejidos y productos textiles de mercería; confecciones para el hogar y textiles n.c.p.'],
                    ['47521', 'Venta al por menor de productos de madera'],
                    ['47522', 'Venta al por menor de artículos de ferretería'],
                    ['47523', 'Venta al por menor de productos de pinturerías'],
                    ['47524', 'Venta al por menor en vidrierías'],
                    ['47529', 'Venta al por menor de materiales de construcción y artículos conexos'],
                    ['47530', 'Venta al por menor de tapices, alfombras y revestimientos de paredes y pisos en comercios especializados'],
                    ['47591', 'Venta al por menor de muebles'],
                    ['47592', 'Venta al por menor de artículos de bazar'],
                    ['47593', 'Venta al por menor de aparatos electrodomésticos, repuestos y accesorios'],
                    ['47594', 'Venta al por menor de artículos eléctricos y de iluminación'],
                    ['47598', 'Venta al por menor de instrumentos musicales'],
                    ['47610', 'Venta al por menor de libros, periódicos y artículos de papelería en comercios especializados'],
                    ['47620', 'Venta al por menor de discos láser, cassettes, cintas de video y otros'],
                    ['47630', 'Venta al por menor de productos y equipos de deporte'],
                    ['47631', 'Venta al por menor de bicicletas, accesorios y repuestos'],
                    ['47640', 'Venta al por menor de juegos y juguetes en comercios especializados'],
                    ['47711', 'Venta al por menor de prendas de vestir y accesorios de vestir'],
                    ['47712', 'Venta al por menor de calzado'],
                    ['47713', 'Venta al por menor de artículos de peletería, marroquinería y talabartería'],
                    ['47721', 'Venta al por menor de medicamentos farmacéuticos y otros materiales y artículos de uso médico, odontológico y veterinario'],
                    ['47722', 'Venta al por menor de productos cosméticos y de tocador'],
                    ['47731', 'Venta al por menor de productos de joyería, bisutería, óptica, relojería'],
                    ['47732', 'Venta al por menor de plantas, semillas, animales y artículos conexos'],
                    ['47733', 'Venta al por menor de combustibles de uso doméstico (gas propano y gas licuado)'],
                    ['47734', 'Venta al por menor de artesanías, artículos cerámicos y recuerdos en general'],
                    ['47735', 'Venta al por menor de ataúdes, lápidas y cruces, trofeos, artículos religiosos en general'],
                    ['47736', 'Venta al por menor de armas de fuego, municiones y accesorios'],
                    ['47737', 'Venta al por menor de artículos de cohetería y pirotécnicos'],
                    ['47738', 'Venta al por menor de artículos desechables de uso personal y doméstico (servilletas, papel higiénico, pañales, toallas sanitarias, etc.)'],
                    ['47739', 'Venta al por menor de otros productos n.c.p.'],
                    ['47741', 'Venta al por menor de artículos usados'],
                    ['47742', 'Venta al por menor de textiles y confecciones usados'],
                    ['47743', 'Venta al por menor de libros, revistas, papel y cartón usados'],
                    ['47749', 'Venta al por menor de productos usados n.c.p.'],
                    ['47811', 'Venta al por menor de frutas, verduras y hortalizas'],
                    ['47814', 'Venta al por menor de productos lácteos'],
                    ['47815', 'Venta al por menor de productos de panadería, galletas y similares'],
                    ['47816', 'Venta al por menor de bebidas'],
                    ['47818', 'Venta al por menor en tiendas de mercado y puestos'],
                    ['47821', 'Venta al por menor de hilados, tejidos y productos textiles de mercería en puestos de mercados y ferias'],
                    ['47822', 'Venta al por menor de artículos textiles excepto confecciones para el hogar en puestos de mercados y ferias'],
                    ['47823', 'Venta al por menor de confecciones textiles para el hogar en puestos de mercados y ferias'],
                    ['47824', 'Venta al por menor de prendas de vestir, accesorios de vestir y similares en puestos de mercados y ferias'],
                    ['47825', 'Venta al por menor de ropa usada'],
                    ['47826', 'Venta al por menor de calzado, artículos de marroquinería y talabartería en puestos de mercados y ferias'],
                    ['47827', 'Venta al por menor de artículos de marroquinería y talabartería en puestos de mercados y ferias'],
                    ['47829', 'Venta al por menor de artículos textiles n.c.p. en puestos de mercados y ferias'],
                    ['47891', 'Venta al por menor de animales, flores y productos conexos en puestos de feria y mercados'],
                    ['47892', 'Venta al por menor de productos medicinales, cosméticos, de tocador y de limpieza en puestos de ferias y mercados'],
                    ['47893', 'Venta al por menor de artículos de bazar en puestos de ferias y mercados'],
                    ['47894', 'Venta al por menor de artículos de papel, envases, libros, revistas y conexos en puestos de feria y mercados'],
                    ['47895', 'Venta al por menor de materiales de construcción, electrodomésticos, accesorios para autos y similares en puestos de feria y mercados'],
                    ['47896', 'Venta al por menor de equipos accesorios para las comunicaciones en puestos de feria y mercados'],
                    ['47899', 'Venta al por menor en puestos de feria y mercados n.c.p.'],
                    ['47910', 'venta al por menor por correo o internet'],
                    ['47990', 'Otros tipos de venta al por menor no realizad, en almacenes, puestos de venta o mercado'],

                    // 49- TRANSPORTE Y ALMACENAMIENTO ---
                    // Transporte por vía terrestre y tuberías
                    ['49110', 'Transporte interurbano de pasajeros por ferrocarril'],
                    ['49120', 'Transporte de carga por ferrocarril'],
                    ['49211', 'Transporte de pasajeros urbanos e interurbano mediante buses'],
                    ['49212', 'Transporte de pasajeros interdepartamental mediante microbuses'],
                    ['49213', 'Transporte de pasajeros urbanos e interurbano mediante microbuses'],
                    ['49214', 'Transporte de pasajeros interdepartamental mediante buses'],
                    ['49221', 'Transporte internacional de pasajeros'],
                    ['49222', 'Transporte de pasajeros mediante taxis y autos con chofer'],
                    ['49223', 'Transporte escolar'],
                    ['49225', 'Transporte de pasajeros para excursiones'],
                    ['49226', 'Servicios de transporte de personal'],
                    ['49229', 'Transporte de pasajeros por vía terrestre n.c.p.'],
                    ['49231', 'Transporte de carga urbano'],
                    ['49232', 'Transporte nacional de carga'],
                    ['49233', 'Transporte de carga internacional'],
                    ['49234', 'Servicios de mudanza'],
                    ['49235', 'Alquiler de vehículos de carga con conductor'],
                    ['49300', 'Transporte por oleoducto o gasoducto'],

                    // 50- Transporte por vía acuática
                    ['50110', 'Transporte de pasajeros marítimo y de cabotaje'],
                    ['50120', 'Transporte de carga marítimo y de cabotaje'],
                    ['50211', 'Transporte de pasajeros por vías de navegación interiores'],
                    ['50212', 'Alquiler de equipo de transporte de pasajeros por vías de navegación interior con conductor'],
                    ['50220', 'Transporte de carga por vías de navegación interiores'],

                    // 51- Transporte por vía aérea
                    ['51100', 'Transporte aéreo de pasajeros'],
                    ['51201', 'Transporte de carga por vía aérea'],
                    ['51202', 'Alquiler de equipo de aerotransporte con operadores para el propósito de transportar carga'],

                    // 52- Almacenamiento y actividades de apoyo al transporte
                    ['52101', 'Alquiler de instalaciones de almacenamiento en zonas francas'],
                    ['52102', 'Alquiler de silos para conservación y almacenamiento de granos'],
                    ['52103', 'Alquiler de instalaciones con refrigeración para almacenamiento y conservación de alimentos y otros productos'],
                    ['52109', 'Alquiler de bodegas para almacenamiento y depósito n.c.p.'],
                    ['52211', 'Servicio de garaje y estacionamiento'],
                    ['52212', 'Servicios de terminales para el transporte por vía terrestre'],
                    ['52219', 'Servicios para el transporte por vía terrestre n.c.p.'],
                    ['52220', 'Servicios para el transporte acuático'],
                    ['52230', 'Servicios para el transporte aéreo'],
                    ['52240', 'Manipulación de carga'],
                    ['52290', 'Servicios para el transporte n.c.p.'],
                    ['52291', 'Agencias de tramitaciones aduanales'],

                    // 53- ACTIVIDADES POSTALES Y DE MENSAJERÍA
                    ['53100', 'Servicios de correo nacional'],
                    ['53200', 'Actividades de correo distintas a las actividades postales nacionales'],
                    ['53201', 'Agencia privada de correo y encomiendas'],

                    // 55- ACTIVIDADES DE ALOJAMIENTO Y DE SERVICIO DE COMIDAS
                    // Alojamiento
                    ['55101', 'Actividades de alojamiento para estancias cortas'],
                    ['55102', 'Hoteles'],
                    ['55200', 'Actividades de campamentos, parques de vehículos de recreo y parques de caravanas'],
                    ['55900', 'Alojamiento n.c.p.'],

                    // 56- Servicio de comidas y bebidas
                    ['56101', 'Restaurantes'],
                    ['56106', 'Pupusería'],
                    ['56107', 'Actividades varias de restaurantes'],
                    ['56108', 'Comedores'],
                    ['56109', 'Merenderos ambulantes'],
                    ['56210', 'Preparación de comida para eventos especiales'],
                    ['56291', 'Servicios de provisión de comidas por contrato'],
                    ['56292', 'Servicios de concesión de cafetines y chalet en empresas e instituciones'],
                    ['56299', 'Servicios de preparación de comidas n.c.p.'],
                    ['56301', 'Servicio de expendio de bebidas en salones y bares'],
                    ['56302', 'Servicio de expendio de bebidas en puestos callejeros, mercados y ferias'],

                    // 58- INFORMACIÓN Y COMUNICACIONES
                    // Actividades de edición
                    ['58110', 'Edición de libros, folletos, partituras y otras ediciones distintas a estas'],
                    ['58120', 'Edición de directorios y listas de correos'],
                    ['58130', 'Edición de periódicos, revistas y otras publicaciones periódicas'],
                    ['58190', 'Otras actividades de edición'],
                    ['58200', 'Edición de programas informáticos (software)'],

                    // 59- PRODUCCIÓN AUDIOVISUAL, SONIDO Y MÚSICA
                    ['59110', 'Actividades de producción cinematográfica'],
                    ['59120', 'Actividades de post producción de películas, videos y programas de televisión'],
                    ['59130', 'Actividades de distribución de películas cinematográficas, videos y programas de televisión'],
                    ['59140', 'Actividades de exhibición de películas cinematográficas y cintas de vídeo'],
                    ['59200', 'Actividades de edición y grabación de música'],

                    // 60- PROGRAMACIÓN Y TRANSMISIÓN
                    ['60100', 'Servicios de difusiones de radio'],
                    ['60201', 'Actividades de programación y difusión de televisión abierta'],
                    ['60202', 'Actividades de suscripción y difusión de televisión por cable y/o suscripción'],
                    ['60299', 'Servicios de televisión, incluye televisión por cable'],
                    ['60900', 'Programación y transmisión de radio y televisión'],

                    // 61- TELECOMUNICACIONES
                    ['61101', 'Servicio de telefonía'],
                    ['61102', 'Servicio de Internet'],
                    ['61103', 'Servicio de telefonía fija'],
                    ['61109', 'Servicio de Internet n.c.p.'],
                    ['61201', 'Servicios de telefonía celular'],
                    ['61202', 'Servicios de Internet inalámbrico'],
                    ['61209', 'Servicios de telecomunicaciones inalámbrico n.c.p.'],
                    ['61301', 'Telecomunicaciones satelitales'],
                    ['61309', 'Comunicación vía satélite n.c.p.'],
                    ['61900', 'Actividades de telecomunicación n.c.p.'],

                    // 62- PROGRAMACIÓN INFORMÁTICA Y CONSULTORÍA
                    ['62010', 'Programación Informática'],
                    ['62020', 'Consultorías y gestión de servicios informáticos'],
                    ['62090', 'Otras actividades de tecnología de información y servicios de computadora'],

                    // 63- SERVICIOS DE INFORMACIÓN
                    ['63110', 'Procesamiento de datos y Actividades relacionadas'],
                    ['63120', 'Portales WEB'],
                    ['63910', 'Servicios de Agencias de Noticias'],
                    ['63990', 'Otros servicios de información n.c.p.'],

                    // 64- ACTIVIDADES FINANCIERAS Y DE SEGUROS
                    // Servicios financieros excepto seguros y fondos de pensiones
                    ['64110', 'Servicios provistos por el Banco Central de El Salvador'],
                    ['64190', 'Bancos'],
                    ['64192', 'Entidades dedicadas al envío de remesas'],
                    ['64199', 'Otras entidades financieras'],
                    ['64200', 'Actividades de sociedades de cartera'],
                    ['64300', 'Fideicomisos, fondos y otras fuentes de financiamiento'],
                    ['64910', 'Arrendamientos financieros'],
                    ['64920', 'Asociaciones cooperativas de ahorro y crédito dedicadas a la intermediación financiera'],
                    ['64921', 'Instituciones emisoras de tarjetas de crédito y otros'],
                    ['64922', 'Tipos de crédito n.c.p.'],
                    ['64928', 'Prestamistas y casas de empeño'],
                    ['64990', 'Actividades de servicios financieros, excepto la financiación de planes de seguros y de pensiones n.c.p.'],

                    // 65- Seguros, reaseguros y fondos de pensiones
                    ['65110', 'Planes de seguros de vida'],
                    ['65120', 'Planes de seguro excepto de vida'],
                    ['65199', 'Seguros generales de todo tipo'],
                    ['65200', 'Planes de seguro'],
                    ['65300', 'Planes de pensiones'],

                    // 66- Actividades auxiliares financieras
                    ['66110', 'Administración de mercados financieros (Bolsa de Valores)'],
                    ['66120', 'Actividades bursátiles (Corredores de Bolsa)'],
                    ['66190', 'Actividades auxiliares de la intermediación financiera n.c.p.'],
                    ['66210', 'Evaluación de riesgos y daños'],
                    ['66220', 'Actividades de agentes y corredores de seguros'],
                    ['66290', 'Otras actividades auxiliares de seguros y fondos de pensiones'],
                    ['66300', 'Actividades de administración de fondos'],

                    // 68- ACTIVIDADES INMOBILIARIAS
                    ['68101', 'Servicio de alquiler y venta de lotes en cementerios'],
                    ['68109', 'Actividades inmobiliarias realizadas con bienes propios o arrendados n.c.p.'],
                    ['68200', 'Actividades Inmobiliarias Realizadas a Cambio de una Retribución o por Contrata'],

                    // 69- ACTIVIDADES PROFESIONALES, CIENTÍFICAS Y TÉCNICAS
                    ['69100', 'Actividades jurídicas'],
                    ['69200', 'Actividades de contabilidad, teneduría de libros y auditoría; asesoramiento en materia de impuestos'],

                    // 70- Oficinas centrales y consultoría
                    ['70100', 'Actividades de oficinas centrales de sociedades de cartera'],
                    ['70200', 'Actividades de consultoría en gestión empresarial'],

                    // 71- Arquitectura e ingeniería
                    ['71101', 'Servicios de arquitectura y planificación urbana y servicios conexos'],
                    ['71102', 'Servicios de ingeniería'],
                    ['71103', 'Servicios de agrimensura, topografía, cartografía, prospección y geofísica y servicios conexos'],
                    ['71200', 'Ensayos y análisis técnicos'],

                    // 72- Investigación científica y desarrollo
                    ['72100', 'Investigaciones y desarrollo experimental en el campo de las ciencias naturales y la ingeniería'],
                    ['72199', 'Investigaciones científicas'],
                    ['72200', 'Investigaciones y desarrollo experimental en el campo de las ciencias sociales y las humanidades científica y desarrollo'],

                    // 73- Publicidad y estudios de mercado
                    ['73100', 'Publicidad'],
                    ['73200', 'Investigación de mercados y realización de encuestas de opinión pública'],

                    // 74- Otras actividades profesionales
                    ['74100', 'Actividades de diseño especializado'],
                    ['74200', 'Actividades de fotografía'],
                    ['74900', 'Servicios profesionales y científicos n.c.p.'],

                    // 75- Veterinarias
                    ['75000', 'Actividades veterinarias'],

                    // 76- ACTIVIDADES DE SERVICIOS ADMINISTRATIVOS Y DE APOYO
                    // Alquiler y arrendamiento
                    ['77101', 'Alquiler de equipo de transporte terrestre'],
                    ['77102', 'Alquiler de equipo de transporte acuático'],
                    ['77103', 'Alquiler de equipo de transporte por vía aérea'],
                    ['77210', 'Alquiler y arrendamiento de equipo de recreo y deportivo'],
                    ['77220', 'Alquiler de cintas de video y discos'],
                    ['77290', 'Alquiler de otros efectos personales y enseres domésticos'],
                    ['77300', 'Alquiler de maquinaria y equipo'],
                    ['77400', 'Arrendamiento de productos de propiedad intelectual'],

                    // 78- Empleo
                    ['78100', 'Obtención y dotación de personal'],
                    ['78200', 'Actividades de las agencias de trabajo temporal'],
                    ['78300', 'Dotación de recursos humanos y gestión; gestión de las funciones de recursos humanos'],

                    // 79- Agencias de viajes y reservas
                    ['79110', 'Actividades de agencias de viajes y organizadores de viajes; actividades de asistencia a turistas'],
                    ['79120', 'Actividades de los operadores turísticos'],
                    ['79900', 'Otros servicios de reservas y actividades relacionadas'],

                    // 80- Investigación y seguridad
                    ['80100', 'Servicios de seguridad privados'],
                    ['80201', 'Actividades de servicios de sistemas de seguridad'],
                    ['80202', 'Actividades para la prestación de sistemas de seguridad'],
                    ['80300', 'Actividades de investigación'],

                    // 81- Servicios a edificios y paisajismo
                    ['81100', 'Actividades combinadas de mantenimiento de edificios e instalaciones'],
                    ['81210', 'Limpieza general de edificios'],
                    ['81290', 'Otras actividades combinadas de mantenimiento de edificios e instalaciones n.c.p.'],
                    ['81300', 'Servicio de jardinería'],

                    // 82- Administrativas y apoyo a oficinas
                    ['82110', 'Servicios administrativos de oficinas'],
                    ['82190', 'Servicio de fotocopiado y similares, excepto en imprentas'],
                    ['82200', 'Actividades de las centrales de llamadas (call center)'],
                    ['82300', 'Organización de convenciones y ferias de negocios'],
                    ['82910', 'Actividades de agencias de cobro y oficinas de crédito'],
                    ['82921', 'Servicios de envase y empaque de productos alimenticios'],
                    ['82922', 'Servicios de envase y empaque de productos medicinales'],
                    ['82929', 'Servicio de envase y empaque n.c.p.'],
                    ['82990', 'Actividades de apoyo empresariales n.c.p.'],

                    // 83- ADMINISTRACIÓN PÚBLICA Y DEFENSA
                    ['84110', 'Actividades de la Administración Pública en general'],
                    ['84111', 'Alcaldías Municipales'],
                    ['84120', 'Regulación de las actividades de prestación de servicios sanitarios, educativos, culturales y otros servicios sociales, excepto seguridad social'],
                    ['84130', 'Regulación y facilitación de la actividad económica'],
                    ['84210', 'Actividades de administración y funcionamiento del Ministerio de Relaciones Exteriores'],
                    ['84220', 'Actividades de defensa'],
                    ['84230', 'Actividades de mantenimiento del orden público y de seguridad'],
                    ['84300', 'Actividades de planes de seguridad social de afiliación obligatoria'],

                    // 85- ENSEÑANZA
                    ['85101', 'Guardería educativa'],
                    ['85102', 'Enseñanza preescolar o parvularia'],
                    ['85103', 'Enseñanza primaria'],
                    ['85104', 'Servicio de educación preescolar y primaria integrada'],
                    ['85211', 'Enseñanza secundaria tercer ciclo (7°, 8° y 9°)'],
                    ['85212', 'Enseñanza secundaria de formación general bachillerato'],
                    ['85221', 'Enseñanza secundaria de formación técnica y profesional'],
                    ['85222', 'Enseñanza secundaria de formación técnica y profesional integrada con enseñanza primaria'],
                    ['85301', 'Enseñanza superior universitaria'],
                    ['85302', 'Enseñanza superior no universitaria'],
                    ['85303', 'Enseñanza superior integrada a educación secundaria y/o primaria'],
                    ['85410', 'Educación deportiva y recreativa'],
                    ['85420', 'Educación cultural'],
                    ['85490', 'Otros tipos de enseñanza n.c.p.'],
                    ['85499', 'Enseñanza formal'],
                    ['85500', 'Servicios de apoyo a la enseñanza'],

                    // 86- SALUD HUMANA Y ASISTENCIA SOCIAL
                    // Atención de la salud humana
                    ['86100', 'Actividades de hospitales'],
                    ['86201', 'Clínicas médicas'],
                    ['86202', 'Servicios de Odontología'],
                    ['86203', 'Servicios médicos'],
                    ['86901', 'Servicios de análisis y estudios de diagnóstico'],
                    ['86902', 'Actividades de atención de la salud humana'],
                    ['86909', 'Otros Servicio relacionados con la salud n.c.p.'],

                    // 87- Atención de enfermería en instituciones
                    ['87100', 'Residencias de ancianos con atención de enfermería'],
                    ['87200', 'Instituciones dedicadas al tratamiento del retraso mental, problemas de salud mental y el uso indebido de sustancias nocivas'],
                    ['87300', 'Instituciones dedicadas al cuidado de ancianos y discapacitados'],
                    ['87900', 'Actividades de asistencia a niños y jóvenes'],
                    ['87901', 'Otras actividades de atención en instituciones'],

                    // 88- Asistencia social sin alojamiento
                    ['88100', 'Actividades de asistencia sociales sin alojamiento para ancianos y discapacitados'],
                    ['88900', 'Servicios sociales sin alojamiento n.c.p.'],

                    // 89- ARTES, ENTRETENIMIENTO Y RECREACIÓN
                    ['90000', 'Actividades creativas artísticas y de esparcimiento'],
                    ['91010', 'Actividades de bibliotecas y archivos'],
                    ['91020', 'Actividades de museos y preservación de lugares y edificios históricos'],
                    ['91030', 'Actividades de jardines botánicos, zoológicos y de reservas naturales'],
                    ['92000', 'Actividades de juegos y apuestas'],
                    ['93110', 'Gestión de instalaciones deportivas'],
                    ['93120', 'Actividades de clubes deportivos'],
                    ['93190', 'Otras actividades deportivas'],
                    ['93210', 'Actividades de parques de atracciones y parques temáticos'],
                    ['93291', 'Discotecas y salas de baile'],
                    ['93298', 'Centros vacacionales'],
                    ['93299', 'Actividades de esparcimiento n.c.p.'],

                    // 90- OTRAS ACTIVIDADES DE SERVICIOS
                    // Asociaciones
                    ['94110', 'Actividades de organizaciones empresariales y de empleadores'],
                    ['94120', 'Actividades de organizaciones profesionales'],
                    ['94200', 'Actividades de sindicatos'],
                    ['94910', 'Actividades de organizaciones religiosas'],
                    ['94920', 'Actividades de organizaciones políticas'],
                    ['94990', 'Actividades de asociaciones n.c.p.'],

                    // 91- Reparación de computadoras y efectos personales
                    ['95110', 'Reparación de computadoras y equipo periférico'],
                    ['95120', 'Reparación de equipo de comunicación'],
                    ['95210', 'Reparación de aparatos electrónicos de consumo'],
                    ['95220', 'Reparación de aparatos doméstico y equipo de hogar y jardín'],
                    ['95230', 'Reparación de calzado y artículos de cuero'],
                    ['95240', 'Reparación de muebles y accesorios para el hogar'],
                    ['95291', 'Reparación de instrumentos musicales'],
                    ['95292', 'Servicios de cerrajería y copiado de llaves'],
                    ['95293', 'Reparación de joyas y relojes'],
                    ['95294', 'Reparación de bicicletas, sillas de ruedas y rodados n.c.p.'],
                    ['95299', 'Reparaciones de enseres personales n.c.p.'],

                    // 92- Servicios personales
                    ['96010', 'Lavado y limpieza de prendas de tela y de piel, incluso la limpieza en seco'],
                    ['96020', 'Peluquería y otros tratamientos de belleza'],
                    ['96030', 'Pompas fúnebres y actividades conexas'],
                    ['96091', 'Servicios de sauna y otros servicios para la estética corporal n.c.p.'],
                    ['96092', 'Servicios n.c.p.'],

                    // 97- ACTIVIDADES DE LOS HOGARES COMO EMPLEADORES
                    ['97000', 'Actividad de los hogares en calidad de empleadores de personal doméstico'],

                    // 98- ACTIVIDADES INDIFERENCIADAS DE PRODUCCIÓN DE BIENES Y SERVICIOS DE LOS HOGARES
                    ['98100', 'Actividades indiferenciadas de producción de bienes de los hogares privados para uso propio'],
                    ['98200', 'Actividades indiferenciadas de producción de servicios de los hogares privados para uso propio'],

                    // 99- ORGANIZACIONES Y ÓRGANOS EXTRATERRITORIALES
                    ['99000', 'Actividades de organizaciones y órganos extraterritoriales'],

                    // 100- EMPLEADOS Y OTRAS PERSONAS NATURALES
                    ['10001', 'Empleados'],
                    ['10002', 'Pensionado'],
                    ['10003', 'Estudiante'],
                    ['10004', 'Desempleado'],
                    ['10005', 'Otros'],
                    ['10006', 'Comerciante']

                ]
            },
            {
                tableName: 'cat_020_pais',
                description: 'CAT-020 País',
                data: [
                    ['AF', 'Afganistán'],
                    ['AX', 'Aland'],
                    ['AL', 'Albania'],
                    ['DE', 'Alemania'],
                    ['AD', 'Andorra'],
                    ['AO', 'Angola'],
                    ['AI', 'Anguila'],
                    ['AQ', 'Antártica'],
                    ['AG', 'Antigua y Barbuda'],
                    ['AW', 'Aruba'],
                    ['SA', 'Arabia Saudita'],
                    ['DZ', 'Argelia'],
                    ['AR', 'Argentina'],
                    ['AM', 'Armenia'],
                    ['AU', 'Australia'],
                    ['AT', 'Austria'],
                    ['AZ', 'Azerbaiyán'],
                    ['BS', 'Bahamas'],
                    ['BH', 'Bahrein'],
                    ['BD', 'Bangladesh'],
                    ['BB', 'Barbados'],
                    ['BE', 'Bélgica'],
                    ['BZ', 'Belice'],
                    ['BJ', 'Benin'],
                    ['BM', 'Bermudas'],
                    ['BY', 'Bielorrusia'],
                    ['BO', 'Bolivia'],
                    ['BQ', 'Bonaire, Sint Eustatius and Saba'],
                    ['BA', 'Bosnia-Herzegovina'],
                    ['BW', 'Botswana'],
                    ['BR', 'Brasil'],
                    ['BN', 'Brunei'],
                    ['BG', 'Bulgaria'],
                    ['BF', 'Burkina Faso'],
                    ['BI', 'Burundi'],
                    ['BT', 'Bután'],
                    ['CV', 'Cabo Verde'],
                    ['KY', 'Caimán, Islas'],
                    ['KH', 'Camboya'],
                    ['CM', 'Camerún'],
                    ['CA', 'Canadá'],
                    ['CF', 'Centroafricana, República'],
                    ['TD', 'Chad'],
                    ['CL', 'Chile'],
                    ['CN', 'China'],
                    ['CY', 'Chipre'],
                    ['VA', 'Ciudad del Vaticano'],
                    ['CO', 'Colombia'],
                    ['KM', 'Comoras'],
                    ['CG', 'Congo'],
                    ['CI', 'Costa de Marfil'],
                    ['CR', 'Costa Rica'],
                    ['HR', 'Croacia'],
                    ['CU', 'Cuba'],
                    ['CW', 'Curazao'],
                    ['DK', 'Dinamarca'],
                    ['DM', 'Dominica'],
                    ['DJ', 'Djiboutí'],
                    ['EC', 'Ecuador'],
                    ['EG', 'Egipto'],
                    ['SV', 'El Salvador'],
                    ['AE', 'Emiratos Árabes Unidos'],
                    ['ER', 'Eritrea'],
                    ['SK', 'Eslovaquia'],
                    ['SI', 'Eslovenia'],
                    ['ES', 'España'],
                    ['US', 'Estados Unidos'],
                    ['EE', 'Estonia'],
                    ['ET', 'Etiopía'],
                    ['FJ', 'Fiji'],
                    ['PH', 'Filipinas'],
                    ['FI', 'Finlandia'],
                    ['FR', 'Francia'],
                    ['GA', 'Gabón'],
                    ['GM', 'Gambia'],
                    ['GE', 'Georgia'],
                    ['GH', 'Ghana'],
                    ['GI', 'Gibraltar'],
                    ['GD', 'Granada'],
                    ['GR', 'Grecia'],
                    ['GL', 'Groenlandia'],
                    ['GP', 'Guadalupe'],
                    ['GU', 'Guam'],
                    ['GT', 'Guatemala'],
                    ['GF', 'Guayana Francesa'],
                    ['GG', 'Guernsey'],
                    ['GN', 'Guinea'],
                    ['GQ', 'Guinea Ecuatorial'],
                    ['GW', 'Guinea-Bissau'],
                    ['GY', 'Guyana'],
                    ['HT', 'Haití'],
                    ['HN', 'Honduras'],
                    ['HK', 'Hong Kong'],
                    ['HU', 'Hungría'],
                    ['IN', 'India'],
                    ['ID', 'Indonesia'],
                    ['IQ', 'Irak'],
                    ['IE', 'Irlanda'],
                    ['BV', 'Isla Bouvet'],
                    ['IM', 'Isla de Man'],
                    ['NF', 'Isla Norfolk'],
                    ['IS', 'Islandia'],
                    ['CX', 'Islas Navidad'],
                    ['CC', 'Islas Cocos'],
                    ['CK', 'Islas Cook'],
                    ['FO', 'Islas Faroe'],
                    ['GS', 'Islas Georgias d. S.-Sandwich d. S.'],
                    ['HM', 'Islas Heard y McDonald'],
                    ['FK', 'Islas Malvinas (Falkland)'],
                    ['MP', 'Islas Marianas del Norte'],
                    ['MH', 'Islas Marshall'],
                    ['PN', 'Islas Pitcairn'],
                    ['TC', 'Islas Turcas y Caicos'],
                    ['UM', 'Islas Ultramarinas de E.E.U.U'],
                    ['VI', 'Islas Vírgenes'],
                    ['IL', 'Israel'],
                    ['IT', 'Italia'],
                    ['JM', 'Jamaica'],
                    ['JP', 'Japón'],
                    ['JE', 'Jersey'],
                    ['JO', 'Jordania'],
                    ['KZ', 'Kazajistán'],
                    ['KE', 'Kenia'],
                    ['KG', 'Kirguistán'],
                    ['KI', 'Kiribati'],
                    ['KW', 'Kuwait'],
                    ['LA', 'Laos, República Democrática'],
                    ['LS', 'Lesotho'],
                    ['LV', 'Letonia'],
                    ['LB', 'Líbano'],
                    ['LR', 'Liberia'],
                    ['LY', 'Libia'],
                    ['LI', 'Liechtenstein'],
                    ['LT', 'Lituania'],
                    ['LU', 'Luxemburgo'],
                    ['MO', 'Macao'],
                    ['MK', 'Macedonia'],
                    ['MG', 'Madagascar'],
                    ['MY', 'Malasia'],
                    ['MW', 'Malawi'],
                    ['MV', 'Maldivas'],
                    ['ML', 'Malí'],
                    ['MT', 'Malta'],
                    ['MA', 'Marruecos'],
                    ['MQ', 'Martinica e.a.'],
                    ['MU', 'Mauricio'],
                    ['MR', 'Mauritania'],
                    ['YT', 'Mayotte'],
                    ['MX', 'México'],
                    ['FM', 'Micronesia'],
                    ['MD', 'Moldavia, República de'],
                    ['MC', 'Mónaco'],
                    ['MN', 'Mongolia'],
                    ['ME', 'Montenegro'],
                    ['MS', 'Montserrat'],
                    ['MZ', 'Mozambique'],
                    ['MM', 'Myanmar'],
                    ['NA', 'Namibia'],
                    ['NR', 'Nauru'],
                    ['NP', 'Nepal'],
                    ['NI', 'Nicaragua'],
                    ['NE', 'Níger'],
                    ['NG', 'Nigeria'],
                    ['NU', 'Niue'],
                    ['NO', 'Noruega'],
                    ['NC', 'Nueva Caledonia'],
                    ['NZ', 'Nueva Zelanda'],
                    ['OM', 'Omán'],
                    ['NL', 'Países Bajos'],
                    ['PK', 'Pakistán'],
                    ['PW', 'Palaos'],
                    ['PS', 'Palestina'],
                    ['PA', 'Panamá'],
                    ['PG', 'Papúa, Nueva Guinea'],
                    ['PY', 'Paraguay'],
                    ['PE', 'Perú'],
                    ['PF', 'Polinesia Francesa'],
                    ['PL', 'Polonia'],
                    ['PT', 'Portugal'],
                    ['PR', 'Puerto Rico'],
                    ['QA', 'Qatar'],
                    ['GB', 'Reino Unido'],
                    ['KP', 'Rep. Democrática popular de Corea'],
                    ['CZ', 'República Checa'],
                    ['KR', 'República de Corea'],
                    ['CD', 'República Democrática del Congo'],
                    ['DO', 'República Dominicana'],
                    ['IR', 'República Islámica de Irán'],
                    ['RE', 'Reunión'],
                    ['RW', 'Ruanda'],
                    ['RO', 'Rumania'],
                    ['RU', 'Rusia'],
                    ['EH', 'Sahara Occidental'],
                    ['BL', 'Saint Barthélemy'],
                    ['MF', 'Saint Martin (French part)'],
                    ['SB', 'Salomón, Islas'],
                    ['WS', 'Samoa'],
                    ['AS', 'Samoa Americana'],
                    ['KN', 'San Cristóbal y Nieves'],
                    ['SM', 'San Marino'],
                    ['PM', 'San Pedro y Miquelón'],
                    ['VC', 'San Vicente y las Granadinas'],
                    ['SH', 'Santa Elena'],
                    ['LC', 'Santa Lucía'],
                    ['ST', 'Santo Tomé y Príncipe'],
                    ['SN', 'Senegal'],
                    ['RS', 'Serbia'],
                    ['SC', 'Seychelles'],
                    ['SL', 'Sierra Leona'],
                    ['SG', 'Singapur'],
                    ['SX', 'Sint Maarten (Dutch part)'],
                    ['SY', 'Siria'],
                    ['SO', 'Somalia'],
                    ['SS', 'South Sudan'],
                    ['LK', 'Sri Lanka'],
                    ['ZA', 'Sudáfrica'],
                    ['SD', 'Sudán'],
                    ['SE', 'Suecia'],
                    ['CH', 'Suiza'],
                    ['SR', 'Surinám'],
                    ['SJ', 'Svalbard y Jan Mayen'],
                    ['SZ', 'Swazilandia'],
                    ['TH', 'Tailandia'],
                    ['TW', 'Taiwan, Provincia de China'],
                    ['TZ', 'Tanzania, República Unida de'],
                    ['TJ', 'Tayikistán'],
                    ['IO', 'Territorio Británico Océano Indico'],
                    ['TF', 'Territorios Australes Franceses'],
                    ['TL', 'Timor Oriental'],
                    ['TG', 'Togo'],
                    ['TK', 'Tokelau'],
                    ['TO', 'Tonga'],
                    ['TT', 'Trinidad y Tobago'],
                    ['TN', 'Túnez'],
                    ['TM', 'Turkmenistán'],
                    ['TR', 'Turquía'],
                    ['TV', 'Tuvalu'],
                    ['UA', 'Ucrania'],
                    ['UG', 'Uganda'],
                    ['UY', 'Uruguay'],
                    ['UZ', 'Uzbekistán'],
                    ['VU', 'Vanuatu'],
                    ['VE', 'Venezuela'],
                    ['VN', 'Vietnam'],
                    ['VG', 'Islas Vírgenes Británicas'],
                    ['WF', 'Wallis y Fortuna, Islas'],
                    ['YE', 'Yemen'],
                    ['ZM', 'Zambia'],
                    ['ZW', 'Zimbabue']
                ]
            },
            {
                tableName: 'cat_021_otros_documentos_asociados',
                description: 'CAT-021 Otros Documentos Asociados',
                data: [
                    ['1', 'Emisor'],
                    ['2', 'Receptor'],
                    ['3', 'Médico (solo aplica para contribuyentes obligados a la presentación de F-958)'],
                    ['4', 'Transporte (solo aplica para Factura de exportación)']
                ]
            },
            {
                tableName: 'cat_022_tipo_documento_identificacion_receptor',
                description: 'CAT-022 Tipo de documento de identificación del Receptor',
                data: [
                    ['36', 'NIT'],
                    ['13', 'DUI'],
                    ['37', 'Otro'],
                    ['03', 'Pasaporte'],
                    ['02', 'Carnet de Residente']
                ]
            },
            {
                tableName: 'cat_023_tipo_documento_contingencia',
                description: 'CAT-023 Tipo de Documento en Contingencia',
                data: [
                    ['01', 'Factura Electrónico'],
                    ['03', 'Comprobante de Crédito Fiscal Electrónico'],
                    ['04', 'Nota de Remisión Electrónica'],
                    ['05', 'Nota de Crédito Electrónica'],
                    ['06', 'Nota de Débito Electrónica'],
                    ['11', 'Factura de Exportación Electrónica'],
                    ['14', 'Factura de Sujeto Excluido Electrónica']
                ]
            },
            {
                tableName: 'cat_024_tipo_invalidacion',
                description: 'CAT-024 Tipo de Invalidación',
                data: [
                    ['1', 'Error en la Información del Documento Tributario Electrónico a invalidar.'],
                    ['2', 'Rescindir de la operación realizada.'],
                    ['3', 'Otro']
                ]
            },
            {
                tableName: 'cat_025_titulo_remision_bienes',
                description: 'CAT-025 Título a que se remiten los bienes',
                data: [
                    ['01', 'Depósito'],
                    ['02', 'Propiedad'],
                    ['03', 'Consignación'],
                    ['04', 'Traslado'],
                    ['05', 'Otros']
                ]
            },
            {
                tableName: 'cat_026_tipo_donacion',
                description: 'CAT-026 Tipo de Donación',
                data: [
                    ['1', 'Efectivo'],
                    ['2', 'Bien'],
                    ['3', 'Servicio']
                ]
            },
            {
                tableName: 'cat_027_recinto_fiscal',
                description: 'CAT-027 Recinto Fiscal',
                data: [
                    ['01', 'Terrestre San Bartolo'],
                    ['02', 'Marítima de Acajutla'],
                    ['03', 'Aérea De Comalapa'],
                    ['04', 'Terrestre Las Chinamas'],
                    ['05', 'Terrestre La Hachadura'],
                    ['06', 'Terrestre Santa Ana'],
                    ['07', 'Terrestre San Cristóbal'],
                    ['08', 'Terrestre Anguiatú'],
                    ['09', 'Terrestre El Amatillo'],
                    ['10', 'Marítima La Unión'],
                    ['11', 'Terrestre El Poy'],
                    ['12', 'Terrestre Metalío'],
                    ['15', 'Fardos Postales'],
                    ['16', 'Z.F. San Marcos'],
                    ['17', 'Z.F. El Pedregal'],
                    ['18', 'Z.F. San Bartolo'],
                    ['20', 'Z.F. Exportsalva'],
                    ['21', 'Z.F. American Park'],
                    ['23', 'Z.F. Internacional'],
                    ['24', 'Z.F. Diez'],
                    ['26', 'Z.F. Miramar'],
                    ['27', 'Z.F. Santo Tomas'],
                    ['28', 'Z.F. Santa Tecla'],
                    ['29', 'Z.F. Santa Ana'],
                    ['30', 'Z.F. La Concordia'],
                    ['31', 'Aérea Ilopango'],
                    ['32', 'Z.F. Pipil'],
                    ['33', 'Puerto Barillas'],
                    ['34', 'Z.F. Calvo Conservas'],
                    ['35', 'Feria Internacional'],
                    ['36', 'Aduana El Papalón'],
                    ['37', 'Z.F. Sam-Li'],
                    ['38', 'Z.F. San José'],
                    ['39', 'Z.F. Las Mercedes'],
                    ['40', 'Z.F. EMCO'],
                    ['41', 'Z.F. Gigante'],
                    ['71', 'Aldesa'],
                    ['72', 'Agdosa Merliot'],
                    ['73', 'Bodesa'],
                    ['76', 'Delegacion DHL'],
                    ['77', 'Transauto'],
                    ['80', 'Nejapa'],
                    ['81', 'Almaconsa'],
                    ['83', 'Agdosa Apopa'],
                    ['85', 'Gutiérrez Courier Y Cargo'],
                    ['99', 'San Bartolo Envío Hn/Gt']
                ]
            },
            {
                tableName: 'cat_028_regimen',
                description: 'CAT-028 Régimen',
                data: [
                    ['EX-1.1000.000', 'Exportación Definitiva, Exportación Definitiva, Régimen Común'],
                    ['EX-1.1040.000', 'Exportación Definitiva, Exportación Definitiva Sustitución de Mercancías, Régimen Común'],
                    ['EX-1.1041.020', 'Exportación Definitiva, Proveniente de Franquicia Provisional, Franq. Presidenciales exento de DAI'],
                    ['EX-1.1041.021', 'Exportación Definitiva, Proveniente de Franquicia Provisional, Franq. Presidenciales exento de DAI e IVA'],
                    ['EX-1.1048.025', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Maquinaria y Equipo LZF. DPA'],
                    ['EX-1.1048.031', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Distribución Internacional'],
                    ['EX-1.1048.032', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Operaciones Internacionales de Logística'],
                    ['EX-1.1048.033', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Centro Internacional de llamadas (Call Center)'],
                    ['EX-1.1048.034', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Tecnologías de Información LSI'],
                    ['EX-1.1048.035', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Investigación y Desarrollo LSI'],
                    ['EX-1.1048.036', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Reparación y Mantenimiento de Embarcaciones Marítimas LSI'],
                    ['EX-1.1048.037', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Reparación y Mantenimiento de Aeronaves LSI'],
                    ['EX-1.1048.038', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Procesos Empresariales LSI'],
                    ['EX-1.1048.039', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Servicios Medico-Hospitalarios LSI'],
                    ['EX-1.1048.040', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Servicios Financieros Internacionales LSI'],
                    ['EX-1.1048.043', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Reparación y Mantenimiento de Contenedores LSI'],
                    ['EX-1.1048.044', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Reparación de Equipos Tecnológicos LSI'],
                    ['EX-1.1048.054', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Atención Ancianos y Convalecientes LSI'],
                    ['EX-1.1048.055', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Telemedicina LSI'],
                    ['EX-1.1048.056', 'Exportación Definitiva, Proveniente de Franquicia Definitiva, Cinematografía LSI'],
                    ['EX-1.1052.000', 'Exportación Definitiva de DPA con origen en Compras Locales, Régimen Común'],
                    ['EX-1.1054.000', 'Exportación Definitiva de Zona Franca con origen en Compras Locales, Régimen Común'],
                    ['EX-1.1100.000', 'Exportación Definitiva de Envíos de Socorro, Régimen Común'],
                    ['EX-1.1200.000', 'Exportación Definitiva de Envíos Postales, Régimen Común'],
                    ['EX-1.1300.000', 'Exportación Definitiva Envíos que requieren despacho urgente, Régimen Común'],
                    ['EX-1.1400.000', 'Exportación Definitiva Courier, Régimen Común'],
                    ['EX-1.1400.011', 'Exportación Definitiva Courier, Muestras Sin Valor Comercial'],
                    ['EX-1.1400.012', 'Exportación Definitiva Courier, Material Publicitario'],
                    ['EX-1.1400.017', 'Exportación Definitiva Courier, Declaración de Documentos'],
                    ['EX-1.1500.000', 'Exportación Definitiva Menaje de casa, Régimen Común'],
                    ['EX-2.2100.000', 'Exportación Temporal para Perfeccionamiento Pasivo, Régimen Común'],
                    ['EX-2.2200.000', 'Exportación Temporal con Reimportación en el mismo estado, Régimen Común'],
                    ['EX-2.2400.000', 'Traslados Definitivos'],
                    ['EX-3.3050.000', 'Re-Exportación Proveniente de Importación Temporal, Régimen Común'],
                    ['EX-3.3051.000', 'Re-Exportación Proveniente de Tiendas Libres, Régimen Común'],
                    ['EX-3.3052.000', 'Re-Exportación Proveniente de Admisión Temporal para Perfeccionamiento Activo, Régimen Común'],
                    ['EX-3.3053.000', 'Re-Exportación Proveniente de Admisión Temporal, Régimen Común'],
                    ['EX-3.3054.000', 'Re-Exportación Proveniente de Régimen de Zona Franca, Régimen Común'],
                    ['EX-3.3055.000', 'Re-Exportación Proveniente de Admisión Temporal para Perfeccionamiento Activo con Garantía, Régimen Común'],
                    ['EX-3.3056.000', 'Re-Exportación Proveniente de Admisión Temporal Distribución Internacional Parque de Servicios, Régimen Común'],
                    ['EX-3.3056.057', 'Re-Exportación Proveniente de Admisión Temporal Distribución Internacional Parque de Servicios, Remisión entre Usuarios Directos del Mismo Parque de Servicios'],
                    ['EX-3.3056.058', 'Re-Exportación Proveniente de Admisión Temporal Distribución Internacional Parque de Servicios, Remisión entre Usuarios Directos de Diferente Parque de Servicios'],
                    ['EX-3.3056.072', 'Re-Exportación Proveniente de Admisión Temporal Distribución Internacional Parque de Servicios, Decreto 738 Eléctricos e Híbridos'],
                    ['EX-3.3057.000', 'Re-Exportación Proveniente de Admisión Temporal Operaciones Internacional de Logística Parque de Servicios, Régimen Común'],
                    ['EX-3.3057.057', 'Re-Exportación Proveniente de Admisión Temporal Operaciones Internacional de Logística Parque de Servicios, Remisión entre Usuarios Directos del Mismo Parque de Servicios'],
                    ['EX-3.3057.058', 'Re-Exportación Proveniente de Admisión Temporal Operaciones Internacional de Logística Parque de Servicios, Remisión entre Usuarios Directos de Diferente Parque de Servicios'],
                    ['EX-3.3058.033', 'Re-Exportación Proveniente de Admisión Temporal Centro Servicio LSI, Centro Internacional de llamadas (Call Center)'],
                    ['EX-3.3058.036', 'Re-Exportación Proveniente de Admisión Temporal Centro Servicio LSI, Reparación y Mantenimiento de Embarcaciones Marítimas LSI'],
                    ['EX-3.3058.037', 'Re-Exportación Proveniente de Admisión Temporal Centro Servicio LSI, Reparación y Mantenimiento de Aeronaves LSI'],
                    ['EX-3.3058.043', 'Re-Exportación Proveniente de Admisión Temporal Centro Servicio LSI, Reparación y Mantenimiento de Contenedores LSI'],
                    ['EX-3.3059.000', 'Re-Exportación Proveniente de Admisión Temporal Reparación de Equipo Tecnológico Parque de Servicios, Régimen Común'],
                    ['EX-3.3059.057', 'Re-Exportación Proveniente de Admisión Temporal Reparación de Equipo Tecnológico Parque de Servicios, Remisión entre Usuarios Directos del Mismo Parque de Servicios'],
                    ['EX-3.3059.058', 'Re-Exportación Proveniente de Admisión Temporal Reparación de Equipo Tecnológico Parque de Servicios, Remisión entre Usuarios Directos de Diferente Parque de Servicios'],
                    ['EX-3.3070.000', 'Re-Exportación Proveniente de Depósito., Régimen Común'],
                    ['EX-3.3070.072', 'Re-Exportación Proveniente de Depósito., Decreto 738 Eléctricos e Híbridos'],
                    ['EX-3.3071.000', 'Reexp. Prov. de Deposito.'],
                    ['EX-3.3052.000', 'Reexp. Prov. de Adm Temp. para Perfeccionamiento Activo'],
                    ['EX-3.3054.000', 'Reexp. Prov. de Regimen de Zona Franca'],
                    ['EX-3.3055.000', 'Reexp. Prov.de Adm.Temporal para Perfeccionamiento Activo con Garantía'],
                    ['EX-3.3056.000', 'Re-Exp. Prov.de Adm.Temporal Ley de Servi. Internacionales'],
                    ['EX-3.3057.000', 'Reexportación Prov. de Centro de Servicio LSI']
                ]
            },
            {
                tableName: 'cat_029_tipo_persona',
                description: 'CAT-029 Tipo de persona',
                data: [
                    ['1', 'Persona Natural'],
                    ['2', 'Persona Jurídica']
                ]
            },
            {
                tableName: 'cat_030_transporte',
                description: 'CAT-030 Transporte',
                data: [
                    ['1', 'TERRESTRE'],
                    ['2', 'AÉREO'],
                    ['3', 'MARÍTIMO'],
                    ['4', 'FERREO'],
                    ['5', 'MULTIMODAL'],
                    ['6', 'CORREO']
                ]
            },
            {
                tableName: 'cat_031_incoterms',
                description: 'CAT-031 INCOTERMS',
                data: [
                    ['01', 'EXW-En fabrica'],
                    ['02', 'FCA-Libre transportista'],
                    ['03', 'CPT-Transporte pagado hasta'],
                    ['04', 'CIP-Transporte y seguro pagado hasta'],
                    ['05', 'DAP-Entrega en el lugar'],
                    ['06', 'DPU-Entregado en el lugar descargado'],
                    ['07', 'DDP-Entrega con impuestos pagados'],
                    ['08', 'FAS-Libre al costado del buque'],
                    ['09', 'FOB-Libre a bordo'],
                    ['10', 'CFR-Costo y flete'],
                    ['11', 'CIF- Costo seguro y flete']
                ]
            },
            {
                tableName: 'cat_032_domicilio_fiscal',
                description: 'CAT-032 Domicilio Fiscal',
                data: [
                    ['1', 'Domiciliado'],
                    ['2', 'No Domiciliado']
                ]
            }
        ];

        // --- Creación de Tablas e Inserción ---
        for (const catalog of catalogs) {
            console.log(`🔨 Procesando ${catalog.description}...`);
            // Crear tabla si no existe
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS ${catalog.tableName} (
    codigo VARCHAR(255) PRIMARY KEY,
        valor TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
`;
            await connection.query(createTableQuery);

            console.log(`🔹 Insertando datos en ${catalog.tableName} (${catalog.description})...`);

            // Insertar datos
            for (const item of catalog.data) {
                // MySQL usa INSERT IGNORE en lugar de ON CONFLICT DO NOTHING
                const insertQuery = `INSERT IGNORE INTO ${catalog.tableName} (codigo, valor) VALUES(?, ?)`;
                await connection.query(insertQuery, [item[0], item[1]]);
            }
        }

        console.log('🎉 Carga de catálogos completada exitosamente.');
        await connection.end();
    } catch (error) {
        console.error('❌ Error configurando catálogos:', error);
        if (connection) await connection.end().catch(() => { }); // Asegurar cierre
        process.exit(1);
    }
}

// Ejecutar directamente si es el script principal
if (require.main === module) {
    setupCatalogs();
}

module.exports = { setupCatalogs };
