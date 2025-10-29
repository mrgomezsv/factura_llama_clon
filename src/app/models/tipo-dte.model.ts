/**
 * Modelo para Tipo de DTE
 */
export class TipoDTE {
  constructor(
    public codigo: string,
    public nombre: string,
    public habilitado: boolean = true
  ) {}
}

