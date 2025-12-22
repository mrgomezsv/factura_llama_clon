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
    catTipoItemExpor: any[] = [
        { codigo: 1, descripcion: 'Bienes' },
        { codigo: 2, descripcion: 'Servicios' },
        { codigo: 3, descripcion: 'Ambos (Bienes y Servicios)' }
    ];

    // Selecciones
    tipoItemExpor: number = 1;
    incoterm: string = '';
    modoTransporte: string = '';
    recintoFiscal: string = '';
    regimenAduanero: string = '';
    flete: number = 0;
    seguro: number = 0;

    constructor(private dbService: DatabaseService) { }

    ngOnInit() {
        this.cargarCatalogos();
    }

    async cargarCatalogos() {
        try {
            // Cargar Incoterms (CAT-024) - Ajustado nombre tabla si necesario
            try { this.catIncoterms = await this.queryCatalog('cat_031_incoterms'); } catch (e) { console.warn('Usando fallback incoterms'); }

            // Cargar Modo Transporte (CAT-023)
            try { this.catModoTransporte = await this.queryCatalog('cat_030_transporte'); } catch (e) { }

            // Cargar Recinto Fiscal (CAT-025)
            try { this.catRecintoFiscal = await this.queryCatalog('cat_027_recinto_fiscal'); } catch (e) { }

            // Cargar Régimen Aduanero (CAT-026)
            try { this.catRegimenAduanero = await this.queryCatalog('cat_028_regimen'); } catch (e) { }

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
            tipoItemExpor: this.tipoItemExpor,
            incoterms: this.incoterm,
            modoTransporte: this.modoTransporte,
            recintoFiscal: this.recintoFiscal,
            regimenAduanero: this.regimenAduanero,
            flete: this.flete,
            seguro: this.seguro
        });
    }
}
