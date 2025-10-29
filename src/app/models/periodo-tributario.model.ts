/**
 * Modelo para Período Tributario
 */
export class PeriodoTributario {
  constructor(
    public mes: number,
    public año: number
  ) {}

  /**
   * Obtiene el nombre del mes en español
   */
  get nombreMes(): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[this.mes - 1];
  }

  /**
   * Formatea el período como "Mes Año" (ej: "Octubre 2025")
   */
  get formatoTexto(): string {
    return `${this.nombreMes} ${this.año}`;
  }

  /**
   * Crea una instancia para el mes y año actual
   */
  static ahora(): PeriodoTributario {
    const ahora = new Date();
    return new PeriodoTributario(ahora.getMonth() + 1, ahora.getFullYear());
  }

  /**
   * Crea una instancia desde un objeto JSON
   */
  static fromJson(json: any): PeriodoTributario {
    return new PeriodoTributario(json.mes, json.año);
  }
}

