import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class PaginatorEspanol extends MatPaginatorIntl {
  override changes = new Subject<void>();

  override firstPageLabel  = 'Primera página';
  override lastPageLabel   = 'Última página';
  override nextPageLabel   = 'Siguiente página';
  override previousPageLabel = 'Página anterior';
  override itemsPerPageLabel = 'Registros por página:';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return 'Sin resultados';
    const total = Math.ceil(length / pageSize);
    const desde = page * pageSize + 1;
    const hasta = Math.min((page + 1) * pageSize, length);
    return `${desde} – ${hasta} de ${length} (Página ${page + 1} de ${total})`;
  };
}