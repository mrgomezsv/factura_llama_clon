/**
 * Modelo para Documento Tributario Electrónico (DTE)
 */
export class DTE {
  constructor(
    public controlNumber: string,
    public tipo: string,
    public receptor: string,
    public total: number,
    public ambiente: 'PRODUCCIÓN' | 'PRUEBAS',
    public fechaCreacion: Date
  ) {}

  /**
   * Formatea el total como moneda
   */
  get formattedTotal(): string {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(this.total);
  }

  /**
   * Formatea la fecha de creación
   */
  get formattedFechaCreacion(): string {
    const day = String(this.fechaCreacion.getDate()).padStart(2, '0');
    const month = String(this.fechaCreacion.getMonth() + 1).padStart(2, '0');
    const year = this.fechaCreacion.getFullYear();
    const hours = String(this.fechaCreacion.getHours()).padStart(2, '0');
    const minutes = String(this.fechaCreacion.getMinutes()).padStart(2, '0');
    const seconds = String(this.fechaCreacion.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Crea una instancia desde un objeto JSON
   */
  static fromJson(json: any): DTE {
    return new DTE(
      json.controlNumber,
      json.tipo,
      json.receptor,
      json.total,
      json.ambiente,
      new Date(json.fechaCreacion)
    );
  }
}

