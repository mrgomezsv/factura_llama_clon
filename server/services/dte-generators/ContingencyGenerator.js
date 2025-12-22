const BaseGenerator = require('./BaseGenerator');

class ContingencyGenerator extends BaseGenerator {
    /**
     * Generar JSON del Evento de Contingencia
     * @param {Object} data - Datos para el evento
     * @param {Object} data.empresaConfig - Configuración de la empresa
     * @param {Object} data.contingencia - Datos del periodo (inicio, fin, motivo)
     * @param {Array} data.dtes - Lista de DTEs emitidos durante la contingencia
     */
    generate(data) {
        const { empresaConfig, contingencia, dtes, ambiente = 'PRUEBAS' } = data;

        const codigoGeneracion = this.generateUUID();
        const fechaEmi = new Date(); // Fecha de reporte

        const dteJson = {
            identificacion: {
                version: 3,
                ambiente: ambiente === 'PRODUCCIÓN' ? '01' : '00',
                codigoGeneracion: codigoGeneracion,
                fTransmision: this.formatDateIso(fechaEmi),
                hTransmision: this.formatTimeIso(fechaEmi)
            },
            emisor: {
                nit: empresaConfig.nit,
                nombre: empresaConfig.nombre_legal || empresaConfig.nombre_comercial || 'EMISOR PRUEBA',
                nombreResponsable: empresaConfig.nombre_legal || 'RESPONSABLE PRUEBA',
                tipoDocResponsable: '36', // NIT
                numeroDocResponsable: empresaConfig.nit,
                tipoEstablecimiento: '01',
                codEstableMH: String(empresaConfig.codigo_mh || '0000').substring(0, 4),
                codPuntoVenta: '0001',
                telefono: empresaConfig.telefono || '22222222',
                correo: empresaConfig.correo || 'test@test.com'
            },
            detalleDTE: dtes.map((dte, index) => ({
                noItem: index + 1,
                codigoGeneracion: dte.codigo_generacion || dte.codigoGeneracion,
                tipoDoc: dte.tipo_dte || dte.tipoDte
            })),
            motivo: {
                fInicio: this.formatDateIso(contingencia.fecha_inicio),
                hInicio: this.formatTimeIso(contingencia.fecha_inicio),
                fFin: this.formatDateIso(contingencia.fecha_fin),
                hFin: this.formatTimeIso(contingencia.fecha_fin),
                tipoContingencia: parseInt(contingencia.codigo_motivo) || 1,
                motivoContingencia: contingencia.descripcion_motivo || 'Falla de conexión'
            }
        };

        return {
            dteJson,
            codigoGeneracion
        };
    }

    formatDateIso(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    formatTimeIso(date) {
        const d = new Date(date);
        return d.toTimeString().split(' ')[0];
    }
}

module.exports = ContingencyGenerator;
