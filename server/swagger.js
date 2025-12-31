const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WavePos DTE API',
            version: '1.0.0',
            description: `
API para la generación y gestión de Documentos Tributarios Electrónicos (DTE) de El Salvador.

## Autenticación

Esta API soporta dos tipos de autenticación:

1. **API Key** (para integraciones externas): Usar header \`X-API-Key\`
2. **JWT Bearer Token** (para el frontend): Usar header \`Authorization: Bearer {token}\`

## Tipos de DTE Soportados

- **01** - Factura
- **03** - Comprobante de Crédito Fiscal (CCF)
- **04** - Nota de Remisión
- **05** - Nota de Crédito
- **06** - Nota de Débito
- **07** - Comprobante de Retención
- **11** - Factura de Exportación
- **14** - Factura de Sujeto Excluido

## Ambientes

- **Producción**: https://lap-api-fe.thetecwave.com
      `,
            contact: {
                name: 'Soporte API',
                email: 'soporte@thetecwave.com'
            },
            license: {
                name: 'Privado',
            }
        },
        servers: [
            {
                url: 'https://lap-api-fe.thetecwave.com',
                description: 'Servidor de Producción'
            },
            {
                url: 'http://localhost:50400',
                description: 'Servidor de Desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API Key para integraciones externas (POS, ERP, etc.)'
                },
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Token obtenido del endpoint /api/auth/login'
                }
            },
            schemas: {
                // Esquema de Cliente
                Cliente: {
                    type: 'object',
                    required: ['nit', 'nombre'],
                    properties: {
                        nit: {
                            type: 'string',
                            description: 'NIT del cliente (sin guiones)',
                            example: '06140506901013'
                        },
                        nrc: {
                            type: 'string',
                            description: 'NRC del cliente (opcional)',
                            example: '1234567'
                        },
                        nombre: {
                            type: 'string',
                            description: 'Nombre o razón social del cliente',
                            example: 'EMPRESA EJEMPLO S.A. DE C.V.'
                        },
                        nombreComercial: {
                            type: 'string',
                            description: 'Nombre comercial (opcional)',
                            example: 'Empresa Ejemplo'
                        },
                        correo: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico del cliente',
                            example: 'cliente@example.com'
                        },
                        telefono: {
                            type: 'string',
                            description: 'Teléfono del cliente',
                            example: '2222-2222'
                        },
                        direccion: {
                            type: 'string',
                            description: 'Dirección completa del cliente',
                            example: 'San Salvador, El Salvador'
                        }
                    }
                },
                // Esquema de Item/Producto
                Item: {
                    type: 'object',
                    required: ['cantidad', 'descripcion', 'precioUnitario'],
                    properties: {
                        numItem: {
                            type: 'integer',
                            description: 'Número de ítem (se genera automáticamente si no se proporciona)',
                            example: 1
                        },
                        tipoItem: {
                            type: 'integer',
                            description: '1=Bien, 2=Servicio, 3=Ambos, 4=Otros',
                            example: 1,
                            enum: [1, 2, 3, 4]
                        },
                        cantidad: {
                            type: 'number',
                            description: 'Cantidad del producto/servicio',
                            example: 2
                        },
                        codigo: {
                            type: 'string',
                            description: 'Código del producto (opcional)',
                            example: 'PROD001'
                        },
                        descripcion: {
                            type: 'string',
                            description: 'Descripción del producto/servicio',
                            example: 'Producto de ejemplo'
                        },
                        precioUnitario: {
                            type: 'number',
                            format: 'float',
                            description: 'Precio unitario del producto',
                            example: 10.50
                        },
                        montoDescu: {
                            type: 'number',
                            format: 'float',
                            description: 'Monto de descuento (opcional)',
                            example: 0
                        },
                        ventaGravada: {
                            type: 'number',
                            format: 'float',
                            description: 'Monto de venta gravada (se calcula automáticamente)',
                            example: 21.00
                        }
                    }
                },
                // Request para generar DTE
                GenerarDTERequest: {
                    type: 'object',
                    required: ['tipoDte', 'cliente', 'items'],
                    properties: {
                        tipoDte: {
                            type: 'string',
                            description: 'Código del tipo de DTE',
                            example: '01',
                            enum: ['01', '03', '04', '05', '06', '07', '11', '14']
                        },
                        cliente: {
                            $ref: '#/components/schemas/Cliente'
                        },
                        items: {
                            type: 'array',
                            description: 'Lista de productos/servicios',
                            items: {
                                $ref: '#/components/schemas/Item'
                            },
                            minItems: 1
                        },
                        formaPago: {
                            type: 'string',
                            description: 'Forma de pago (01=Contado, 02=Crédito, 03=Otro)',
                            example: '01',
                            enum: ['01', '02', '03']
                        },
                        condicionOperacion: {
                            type: 'integer',
                            description: '1=Contado, 2=Crédito, 3=Otro',
                            example: 1,
                            enum: [1, 2, 3]
                        },
                        observaciones: {
                            type: 'string',
                            description: 'Observaciones adicionales (opcional)',
                            example: 'Entrega inmediata'
                        }
                    }
                },
                // Response de DTE generado
                DTEResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        dteId: {
                            type: 'string',
                            description: 'ID interno del DTE',
                            example: 'dte_1735660000_abc123'
                        },
                        codigoGeneracion: {
                            type: 'string',
                            description: 'Código de generación del DTE',
                            example: 'ABC12345-DEF6-7890-GHIJ-KLMNOPQRSTUV'
                        },
                        numeroControl: {
                            type: 'string',
                            description: 'Número de control del DTE',
                            example: 'DTE-01-00000001-00000001'
                        },
                        selloRecibido: {
                            type: 'string',
                            description: 'Sello de recepción del Ministerio de Hacienda',
                            example: 'XYZ789...'
                        },
                        estado: {
                            type: 'string',
                            description: 'Estado del DTE',
                            example: 'PROCESADO',
                            enum: ['PROCESADO', 'RECHAZADO', 'CONTINGENCIA']
                        },
                        pdfUrl: {
                            type: 'string',
                            format: 'uri',
                            description: 'URL para descargar el PDF del DTE',
                            example: 'https://lap-api-fe.thetecwave.com/api/dtes/dte_123/pdf?tipoDte=01'
                        },
                        mensajeHacienda: {
                            type: 'string',
                            description: 'Mensaje de respuesta del Ministerio de Hacienda',
                            example: 'PROCESADO'
                        }
                    }
                },
                // Error Response
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Mensaje de error',
                            example: 'API Key inválida'
                        },
                        details: {
                            type: 'object',
                            description: 'Detalles adicionales del error (opcional)'
                        }
                    }
                },
                // Login Request
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'usuario@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'password123'
                        }
                    }
                },
                // Login Response
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            description: 'JWT Token para autenticación',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        },
                        user: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    example: 'user_123'
                                },
                                email: {
                                    type: 'string',
                                    example: 'usuario@example.com'
                                },
                                displayName: {
                                    type: 'string',
                                    example: 'Usuario Ejemplo'
                                },
                                empresaId: {
                                    type: 'string',
                                    example: 'emp_123'
                                }
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'API Externa',
                description: 'Endpoints para integraciones externas (POS, ERP, etc.)'
            },
            {
                name: 'Autenticación',
                description: 'Endpoints para login y registro'
            },
            {
                name: 'DTEs',
                description: 'Gestión de Documentos Tributarios Electrónicos'
            },
            {
                name: 'Clientes',
                description: 'Gestión de clientes'
            },
            {
                name: 'Contingencias',
                description: 'Gestión de contingencias'
            },
            {
                name: 'Salud',
                description: 'Endpoints de salud y monitoreo'
            }
        ],
        paths: {
            '/api/health': {
                get: {
                    tags: ['Salud'],
                    summary: 'Verificar estado del servicio',
                    description: 'Endpoint para verificar que el servicio está funcionando correctamente',
                    responses: {
                        '200': {
                            description: 'Servicio funcionando correctamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: {
                                                type: 'string',
                                                example: 'ok'
                                            },
                                            database: {
                                                type: 'string',
                                                example: 'connected'
                                            },
                                            time: {
                                                type: 'string',
                                                format: 'date-time'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/auth/login': {
                post: {
                    tags: ['Autenticación'],
                    summary: 'Iniciar sesión',
                    description: 'Autenticar usuario y obtener JWT token',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/LoginRequest'
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Login exitoso',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/LoginResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Credenciales inválidas',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ErrorResponse'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/auth/register': {
                post: {
                    tags: ['Autenticación'],
                    summary: 'Registrar nueva cuenta',
                    description: 'Crear una nueva cuenta de usuario y empresa',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password', 'displayName'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            example: 'nuevo@example.com'
                                        },
                                        password: {
                                            type: 'string',
                                            format: 'password',
                                            minLength: 6,
                                            example: 'password123'
                                        },
                                        displayName: {
                                            type: 'string',
                                            example: 'Mi Empresa'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Cuenta creada exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/LoginResponse'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Datos inválidos o email ya registrado',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ErrorResponse'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/v1/external/generar': {
                post: {
                    tags: ['API Externa'],
                    summary: 'Generar DTE (API Externa)',
                    description: `
Endpoint principal para generar DTEs desde sistemas externos (POS, ERP, etc.).

**Importante**: Este endpoint requiere un API Key que debe ser solicitado al administrador.

**Flujo**:
1. Enviar datos del DTE con API Key
2. El sistema valida los datos
3. Genera el JSON del DTE según normativa MH
4. Firma el DTE
5. Envía a Ministerio de Hacienda
6. Retorna respuesta con sello de recepción y PDF
          `,
                    security: [
                        {
                            ApiKeyAuth: []
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/GenerarDTERequest'
                                },
                                examples: {
                                    factura: {
                                        summary: 'Factura (01)',
                                        value: {
                                            tipoDte: '01',
                                            cliente: {
                                                nit: '06140506901013',
                                                nombre: 'CLIENTE EJEMPLO S.A. DE C.V.',
                                                correo: 'cliente@example.com',
                                                telefono: '2222-2222',
                                                direccion: 'San Salvador, El Salvador'
                                            },
                                            items: [
                                                {
                                                    cantidad: 2,
                                                    descripcion: 'Producto de ejemplo',
                                                    precioUnitario: 10.50
                                                },
                                                {
                                                    cantidad: 1,
                                                    descripcion: 'Servicio de instalación',
                                                    precioUnitario: 50.00
                                                }
                                            ],
                                            formaPago: '01',
                                            condicionOperacion: 1
                                        }
                                    },
                                    ccf: {
                                        summary: 'Crédito Fiscal (03)',
                                        value: {
                                            tipoDte: '03',
                                            cliente: {
                                                nit: '06140506901013',
                                                nrc: '1234567',
                                                nombre: 'EMPRESA CLIENTE S.A. DE C.V.',
                                                correo: 'facturacion@cliente.com',
                                                direccion: 'San Salvador, El Salvador'
                                            },
                                            items: [
                                                {
                                                    cantidad: 10,
                                                    codigo: 'PROD001',
                                                    descripcion: 'Producto gravado',
                                                    precioUnitario: 25.00
                                                }
                                            ],
                                            formaPago: '02',
                                            condicionOperacion: 2
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'DTE generado exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/DTEResponse'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Datos inválidos',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ErrorResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'API Key inválida o no proporcionada',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ErrorResponse'
                                    },
                                    example: {
                                        error: 'API Key inválida'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Error del servidor',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ErrorResponse'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/dtes/{id}/pdf': {
                get: {
                    tags: ['DTEs'],
                    summary: 'Descargar PDF del DTE',
                    description: 'Obtener el PDF de un DTE generado',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'ID del DTE',
                            schema: {
                                type: 'string',
                                example: 'dte_123'
                            }
                        },
                        {
                            name: 'tipoDte',
                            in: 'query',
                            required: false,
                            description: 'Tipo de DTE (opcional, ayuda a optimizar la búsqueda)',
                            schema: {
                                type: 'string',
                                example: '01'
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'PDF del DTE',
                            content: {
                                'application/pdf': {
                                    schema: {
                                        type: 'string',
                                        format: 'binary'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'DTE no encontrado',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ErrorResponse'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: [] // No usamos anotaciones en archivos, todo está aquí
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
