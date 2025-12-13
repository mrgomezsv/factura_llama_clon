import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../../services/database.service';

@Component({
    selector: 'app-factura-exportacion-logistica',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './logistica.component.html',
    styleUrls: ['./logistica.component.scss']
})
export class FacturaExportacionLogisticaComponent implements OnInit {
    @Output() changed = new EventEmitter<any>();

    collapsed = false;

    // Catálogos
    catIncoterms: any[] = [];
    catModoTransporte: any[] = [];
    catRecintoFiscal: any[] = [];
    catRegimenAduanero: any[] = [];

    // Selecciones
    incoterm: string = '';
    modoTransporte: string = '';
    recintoFiscal: string = '';
    regimenAduanero: string = '';

    constructor(private dbService: DatabaseService) { }

    ngOnInit() {
        this.cargarCatalogos();
    }

    async cargarCatalogos() {
        try {
            // Cargar Incoterms (CAT-024)
            this.catIncoterms = await this.queryCatalog('cat_024_incoterms');

            // Cargar Modo Transporte (CAT-023)
            this.catModoTransporte = await this.queryCatalog('cat_023_modo_transporte');

            // Cargar Recinto Fiscal (CAT-025)
            this.catRecintoFiscal = await this.queryCatalog('cat_025_recinto_fiscal');

            // Cargar Régimen Aduanero (CAT-026)
            this.catRegimenAduanero = await this.queryCatalog('cat_026_regimen_aduanero');

        } catch (error) {
            console.error('Error cargando catálogos de logística:', error);
        }
    }

    async queryCatalog(tableName: string) {
        return new Promise<any[]>((resolve, reject) => {
            this.dbService.query(`SELECT * FROM ${tableName} ORDER BY codigo ASC`).subscribe({
                next: (data) => resolve(data),
                error: (err) => reject(err)
            });
        });
    }

    emitirCambios() {
        this.changed.emit({
            incoterms: this.incoterm,
            modoTransporte: this.modoTransporte,
            recintoFiscal: this.recintoFiscal,
            regimenAduanero: this.regimenAduanero
        });
    }
}
