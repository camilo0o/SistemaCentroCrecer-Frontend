import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'getPresentes', standalone: true })
export class GetPresentesPipe implements PipeTransform {
  transform(ninios: { presente: boolean }[]): number {
    return ninios?.filter(n => n.presente).length ?? 0;
  }
}