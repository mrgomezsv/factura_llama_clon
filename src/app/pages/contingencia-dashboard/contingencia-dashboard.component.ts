import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DteService } from '../../services/dte.service';
import { DTE } from '../../models/dte.model';

@Component({
    selector: 'app-contingencia-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './contingencia-dashboard.component.html',
    styleUrls: ['./contingencia-dashboard.component.scss']
})
export class ContingenciaDashboardComponent implements OnInit {
    contingenciaActiva: any = null;
    contingenciaPendienteReporte: any = null;
    dtesPendientes: DTE[] = [];

    mostrarModalInicio = false;
    motivoSeleccionado = '1';
    descripcionMotivo = '';

    constructor(private dteService: DteService) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos() {
        this.dteService.getContingenciaActiva().subscribe(res => {
            if (res) {
                this.contingenciaActiva = res;
                this.cargarDtes(res.id);
            } else {
                this.contingenciaActiva = null;
                // Si no hay activa, buscar si hay alguna pendiente de reporte
                this.dteService.getContingenciasPendientes().subscribe(pendientes => {
                    if (pendientes && pendientes.length > 0) {
                        this.contingenciaPendienteReporte = pendientes[0];
                    } else {
                        this.contingenciaPendienteReporte = null;
                    }
                });
            }
        });
    }

    cargarDtes(id: number) {
        this.dteService.getDtesContingencia(id).subscribe(res => {
            this.dtesPendientes = res.map(d => DTE.fromJson({
                controlNumber: d.control_number,
                tipo: this.getTipoNombre(d.tipo_dte),
                receptor: d.receptor,
                total: d.total,
                fechaEmision: d.fecha_emision,
                numeroControl: d.numero_control
            }));
        });
    }

    iniciarContingencia() {
        this.dteService.iniciarContingencia({
            codigoMotivo: this.motivoSeleccionado,
            descripcionMotivo: this.descripcionMotivo
        }).subscribe(res => {
            this.contingenciaActiva = res;
            this.mostrarModalInicio = false;
            alert('Modo contingencia activado. Los DTEs se guardarán localmente.');
        });
    }

    finalizarContingencia() {
        if (confirm('¿Finalizar el periodo de contingencia?')) {
            this.dteService.finalizarContingencia(this.contingenciaActiva.id).subscribe(res => {
                this.contingenciaPendienteReporte = res;
                this.contingenciaActiva = null;
                alert('Contingencia finalizada. Por favor envíe el reporte al MH.');
            });
        }
    }

    reportarContingencia() {
        const id = this.contingenciaPendienteReporte.id;
        this.dteService.reportarContingencia(id).subscribe({
            next: (res) => {
                alert('Reporte enviado con éxito. Sello: ' + res.mhResponse.selloRecibido);
                this.contingenciaPendienteReporte = null;
                this.cargarDatos();
            },
            error: (err) => {
                alert('Error al reportar: ' + (err.error?.error || err.message));
            }
        });
    }

    getMotivoNombre(codigo: string): string {
        const motivos: any = {
            '1': 'No disponibilidad de red de Internet del emisor',
            '2': 'Falla en el Suministro de Energía Eléctrica del emisor',
            '3': 'No disponibilidad de red de Internet de la Admin. Tributaria',
            '4': 'Falla en el Suministro de Energía Eléctrica de la Admin. Tributaria',
            '5': 'Catástrofe Natural u otras causas de fuerza mayor'
        };
        return motivos[codigo] || 'Otro';
    }

    getTipoNombre(tipo: string): string {
        const tipos: any = {
            '01': 'Factura',
            '03': 'Crédito Fiscal',
            '14': 'Factura Sujeto Excluido',
            '11': 'Factura de Exportación'
        };
        return tipos[tipo] || 'Documento';
    }
}
