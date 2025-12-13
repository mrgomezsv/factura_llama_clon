const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'factura_llama_clon_db',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
};

async function setupCatalogs() {
    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Conectado a la base de datos para configurar catálogos.');

        // --- Definición de Catálogos ---
        // Cada objeto define: nombre_tabla, descripcion, y los datos iniciales
        const catalogs = [
            {
                tableName: 'cat_001_ambiente',
                description: 'CAT-001 Ambiente de Destino',
                data: [
                    ['00', 'Pruebas'],
                    ['01', 'Producción']
                ]
            },
            {
                tableName: 'cat_002_tipo_dte',
                description: 'CAT-002 Tipo de Documento',
                data: [
                    ['01', 'Factura'],
                    ['03', 'Comprobante de Crédito Fiscal'],
                    ['04', 'Nota de Remisión'],
                    ['05', 'Nota de Crédito'],
                    ['06', 'Nota de Débito'],
                    ['07', 'Comprobante de Retención'],
                    ['11', 'Factura de Exportación'],
                    ['14', 'Factura de Sujeto Excluido']
                ]
            },
            {
                tableName: 'cat_003_modelo_facturacion',
                description: 'CAT-003 Modelo de Facturación',
                data: [
                    ['1', 'Previo'],
                    ['2', 'Diferido']
                ]
            },
            {
                tableName: 'cat_004_tipo_transmision',
                description: 'CAT-004 Tipo de Transmisión',
                data: [
                    ['1', 'Normal'],
                    ['2', 'Contingencia']
                ]
            },
            {
                tableName: 'cat_005_tipo_contingencia',
                description: 'CAT-005 Tipo de Contingencia',
                data: [
                    ['1', 'No disponibilidad de sistema del emisor'],
                    ['2', 'No disponibilidad de sistema del receptor (MH)'],
                    ['3', 'Falla en suministro de energía eléctrica'],
                    ['4', 'Falla en servicio de telecomunicaciones'],
                    ['5', 'Otras causas']
                ]
            },
            {
                tableName: 'cat_006_tipo_retencion',
                description: 'CAT-006 Tipo de Retención',
                data: [
                    ['22', 'IVA Retención'],
                    ['C3', 'Otras Retenciones']
                    // Nota: Verificar códigos exactos vigentes
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
                    ['01', 'Errores en los montos, cantidades'],
                    ['02', 'Errores de información del receptor del documento'],
                    ['03', 'Errores de información del emisor del documento'],
                    ['04', 'Otros']
                ]
            },
            {
                tableName: 'cat_009_tipo_moneda',
                description: 'CAT-009 Tipo de Moneda',
                data: [
                    ['USD', 'Dólar Estadounidense'],
                    ['SVC', 'Colón Salvadoreño'],
                    ['EUR', 'Euro']
                ]
            },
            {
                tableName: 'cat_010_tipo_establecimiento',
                description: 'CAT-010 Tipo de Establecimiento',
                data: [
                    ['01', 'Sucursal / Agencia'],
                    ['02', 'Casa Matriz'],
                    ['04', 'Bodega'],
                    ['20', 'Otro']
                ]
            },
            {
                tableName: 'cat_011_regimen',
                description: 'CAT-011 Régimen',
                data: [
                    ['IV', 'Impuesto al Valor Agregado']
                    // Otros regímenes según necesidad
                ]
            },
            {
                tableName: 'cat_012_departamento',
                description: 'CAT-012 Departamento',
                data: [
                    ['01', 'Ahuachapán'],
                    ['02', 'Santa Ana'],
                    ['03', 'Sonsonate'],
                    ['04', 'Chalatenango'],
                    ['05', 'La Libertad'],
                    ['06', 'San Salvador'],
                    ['07', 'Cuscatlán'],
                    ['08', 'La Paz'],
                    ['09', 'Cabañas'],
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
                    ['01', 'San Salvador', '06'], // Cod, Nombre, Padre (Depto)
                    ['14', 'Soyapango', '06'],
                    ['06', 'Santa Tecla', '05'],
                    ['01', 'Santa Ana', '02'],
                    ['01', 'San Miguel', '12']
                ],
                hierarchical: true // Indica que tiene columna parent_code
            },
            {
                tableName: 'cat_014_unidad_medida',
                description: 'CAT-014 Unidad de Medida',
                data: [
                    ['59', 'Unidad'],
                    ['58', 'Kilogramo'],
                    ['57', 'Libra'],
                    ['39', 'Metro'],
                    ['99', 'Otros']
                ]
            },
            {
                tableName: 'cat_015_tributo',
                description: 'CAT-015 Tributo',
                data: [
                    ['20', 'IVA 13%'],
                    ['C3', 'Otras Retenciones'],
                    ['59', 'Turismo']
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
                    ['01', 'Billetes y monedas'],
                    ['02', 'Tarjeta de Débito'],
                    ['03', 'Tarjeta de Crédito'],
                    ['04', 'Cheque'],
                    ['05', 'Transferencia / Depósito bancario'],
                    ['06', 'Vale o Cupón'],
                    ['07', 'Dinero electrónico'],
                    ['08', 'Monedero electrónico'],
                    ['99', 'Otros']
                ]
            },
            {
                tableName: 'cat_018_plazo',
                description: 'CAT-018 Plazo',
                data: [
                    ['01', 'Días'],
                    ['02', 'Meses'],
                    ['03', 'Años']
                ]
            },
            {
                tableName: 'cat_019_actividad_economica',
                description: 'CAT-019 Actividad Económica',
                data: [
                    ['6201', 'Actividades de programación informática'],
                    ['6202', 'Consultoría informática'],
                    ['4741', 'Venta al por menor de computadoras']
                ]
            },
            {
                tableName: 'cat_020_pais',
                description: 'CAT-020 País',
                data: [
                    ['9300', 'EL SALVADOR'],
                    ['9200', 'GUATEMALA'],
                    ['9230', 'HONDURAS'],
                    ['9250', 'NICARAGUA'],
                    ['9060', 'COSTA RICA'],
                    ['9210', 'ESTADOS UNIDOS'],
                    ['9140', 'ESPAÑA']
                ]
            },
            {
                tableName: 'cat_021_domicilio_fiscal',
                description: 'CAT-021 Domicilio Fiscal',
                data: [
                    ['1', 'Domicilio Fiscal'],
                    ['2', 'Sucursal']
                ]
            },
            {
                tableName: 'cat_022_tipo_documento_identidad',
                description: 'CAT-022 Tipo de Documento de Identidad',
                data: [
                    ['36', 'NIT'],
                    ['13', 'DUI'],
                    ['02', 'Carnet de Residente'],
                    ['03', 'Pasaporte'],
                    ['37', 'Otro']
                ]
            },
            {
                tableName: 'cat_023_modo_transporte',
                description: 'CAT-023 Modo de Transporte',
                data: [
                    ['1', 'Marítimo'],
                    ['2', 'Aéreo'],
                    ['3', 'Terrestre'],
                    ['4', 'Ferroviario'],
                    ['5', 'Multimodal'],
                    ['6', 'Fijo'],
                    ['7', 'Correo']
                ]
            },
            {
                tableName: 'cat_024_incoterms',
                description: 'CAT-024 Incoterms',
                data: [
                    ['CFR', 'COSTO Y FLETE (PUERTO DE DESTINO CONVENIDO)'],
                    ['CIF', 'COSTO, SEGURO Y FLETE (PUERTO DE DESTINO CONVENIDO)'],
                    ['CIP', 'TRANSPORTE Y SEGURO PAGADOS HASTA (LUGAR DE DESTINO CONVENIDO)'],
                    ['CPT', 'TRANSPORTE PAGADO HASTA (LUGAR DE DESTINO CONVENIDO)'],
                    ['DAF', 'ENTREGADA EN FRONTERA (LUGAR CONVENIDO)'],
                    ['DAP', 'ENTREGADA EN LUGAR (LUGAR DE DESTINO CONVENIDO)'],
                    ['DAT', 'ENTREGADA EN TERMINAL (PUERTO DE DESTINO O LUGAR CONVENIDO)'],
                    ['DDP', 'ENTREGADA DERECHOS PAGADOS (LUGAR DE DESTINO CONVENIDO)'],
                    ['DDU', 'ENTREGADA DERECHOS NO PAGADOS (LUGAR DE DESTINO CONVENIDO)'],
                    ['DEQ', 'ENTREGADA EN MUELLE (PUERTO DE DESTINO CONVENIDO)'],
                    ['DES', 'ENTREGADA SOBRE BUQUE (PUERTO DE DESTINO CONVENIDO)'],
                    ['EXW', 'EN FÁBRICA (LUGAR CONVENIDO)'],
                    ['FAS', 'FRANCO AL COSTADO DEL BUQUE (PUERTO DE CARGA CONVENIDO)'],
                    ['FCA', 'FRANCO TRANSPORTISTA (LUGAR CONVENIDO)'],
                    ['FOB', 'FRANCO A BORDO (PUERTO DE CARGA CONVENIDO)']
                ]
            },
            {
                tableName: 'cat_025_recinto_fiscal',
                description: 'CAT-025 Recinto Fiscal',
                data: [
                    ['01', 'Acajutla'],
                    ['02', 'San Bartolo'],
                    ['03', 'Aeropuerto Monseñor Romero']
                    // Nota: Lista parcial común, lista completa puede ser extensa
                ]
            },
            {
                tableName: 'cat_026_regimen_aduanero',
                description: 'CAT-026 Régimen Aduanero',
                data: [
                    ['INT', 'DEFINITIVAS DE INGRESO'],
                    ['EXP', 'DEFINITIVAS DE SALIDA'],
                    ['TEM', 'TEMPORALES'],
                    ['LIB', 'LIBERATORIOS']
                ]
            },
            {
                tableName: 'cat_027_tipo_persona',
                description: 'CAT-027 Tipo de Persona',
                data: [
                    ['1', 'Natural'],
                    ['2', 'Jurídica']
                ]
            },
            {
                tableName: 'cat_028_tipo_servicio_medico',
                description: 'CAT-028 Tipo de Servicio Médico',
                data: [
                    ['1', 'Cirugía'],
                    ['2', 'Consulta'],
                    ['3', 'Odontología'],
                    ['4', 'Hospitalización'],
                    ['5', 'Laboratorio'],
                    ['6', 'Rayos X']
                ]
            },
            {
                tableName: 'cat_029_ubicacion',
                description: 'CAT-029 Ubicación',
                data: [
                    ['1', 'Ubicación Física'],
                    ['2', 'Ubicación Virtual']
                ]
            }
        ];

        // --- Creación de Tablas e Inserción ---
        for (const catalog of catalogs) {
            console.log(`🔨 Procesando ${catalog.description}...`);

            // 1. Crear Tabla
            // Campos extra para jerarquía si aplica
            const hierarchyColumn = catalog.hierarchical ? ', parent_code VARCHAR(20)' : '';

            const createQuery = `
        CREATE TABLE IF NOT EXISTS ${catalog.tableName} (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(20) NOT NULL UNIQUE,
          descripcion TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
          ${hierarchyColumn}
        );
      `;

            await client.query(createQuery);

            // 2. Insertar Datos
            for (const row of catalog.data) {
                // row[0] = codigo, row[1] = descripcion, row[2] = parent_code (si existe)
                const codigo = row[0];
                const description = row[1];
                const parentCode = row[2] || null;

                if (catalog.hierarchical) {
                    const insertQuery = `
                INSERT INTO ${catalog.tableName} (codigo, descripcion, parent_code)
                VALUES ($1, $2, $3)
                ON CONFLICT (codigo) DO UPDATE SET 
                  descripcion = EXCLUDED.descripcion,
                  parent_code = EXCLUDED.parent_code;
            `;
                    await client.query(insertQuery, [codigo, description, parentCode]);
                } else {
                    const insertQuery = `
                INSERT INTO ${catalog.tableName} (codigo, descripcion)
                VALUES ($1, $2)
                ON CONFLICT (codigo) DO UPDATE SET 
                  descripcion = EXCLUDED.descripcion;
            `;
                    await client.query(insertQuery, [codigo, description]);
                }
            }
        }

        console.log('✅ Todos los catálogos han sido configurados exitosamente.');

    } catch (error) {
        console.error('❌ Error configurando catálogos:', error);
    } finally {
        await client.end();
    }
}

setupCatalogs();
