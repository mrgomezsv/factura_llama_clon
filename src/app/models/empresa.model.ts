/**
 * Modelo para Empresa
 */
export class Empresa {
  constructor(
    public id: string,
    public nombre: string,
    public nit?: string,
    public direccion?: string
  ) {}
}

