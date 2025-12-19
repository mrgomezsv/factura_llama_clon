
const axios = require('axios');

async function reproduce() {
    try {
        const payload = {
            tipoDte: 'FAC',
            empresaId: 'e_1712345678901', // PLEASE REPLACE WITH VALID ID IF NEEDED, but middleware might block if not authenticated. 
            // Better to mock the internal service call or use a valid token if testing via HTTP.
            // Since we don't have a token easily, we might need to invoke the generator directly 
            // OR use the DteBuilder directly to see the JSON output.

            // Let's rely on unit testing the generator logic instead of full HTTP if possible,
            // or use a mock request data structure passed to the generator.
            cliente: {
                tipoDocumento: '36',
                numeroDocumento: '02101006781134',
                nombre: 'JOAQUIN ANDRES VIDES AGREDA',
                correo: 'test@test.com',
                direccion: 'San Salvador',
                departamento: '06',
                municipio: '14'
            },
            items: [
                {
                    cantidad: 1,
                    precio: 34.5044, // Using the values from the log that caused issues
                    descuento: 0,
                    tipoVenta: 'Gravada',
                    descripcion: 'Jeans Azul',
                    unidad: 'Unidad',
                    tributos: ['20'] // This triggered "Valor ingresado no es de los permitidos"
                },
                {
                    cantidad: 1,
                    precio: 4.4159,
                    descuento: 0,
                    tipoVenta: 'Gravada',
                    descripcion: 'Camisa',
                    unidad: 'Unidad',
                    tributos: ['20']
                }
            ],
            totales: {
                // ... fill with approximate values to trigger logic
                subTotal: 38.92,
                iva: 5.06,
                totalPagar: 43.980000000000004 // This caused the 'not a multiple of 0.01' error
            },
            empresaConfig: {
                codigoMH: 'M001P001',
                nombre_legal: 'The Legends',
                nit: '06230805241079',
                nrc: '3439132',
                actividad_economica_primaria: '56101',
                direccion: 'San Salvador',
                telefono: '22222222',
                correo: 'facturacion@test.com.sv'
            },
            ambiente: 'PRUEBAS'
        };

        const FacturaGenerator = require('./server/services/dte-generators/FacturaGenerator');
        const generator = new FacturaGenerator();

        console.log("Generating with precision issues...");
        const result = generator.generate(payload);

        console.log("JSON Result:");
        console.log(JSON.stringify(result.dteJson, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

reproduce();
