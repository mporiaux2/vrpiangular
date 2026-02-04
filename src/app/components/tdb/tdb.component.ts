import {Component, Input} from '@angular/core';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-tdb',
  imports: [],
  templateUrl: './tdb.component.html',
  styleUrl: './tdb.component.css',
})
export class TdbComponent {
  @Input({transform: (value: number)=> Math.round(value), required: true}) vit!: Observable<number>;
  @Input({transform: (value: number)=> Math.round(value), required: true}) distParcours!: Observable<number>;
  @Input({transform: (value: number)=> Math.round(value), required: true}) elevation!: Observable<number>;
}
