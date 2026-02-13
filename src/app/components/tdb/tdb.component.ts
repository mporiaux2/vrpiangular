import {Component,  Input} from '@angular/core';
import { Observable, map } from 'rxjs';
import {AsyncPipe, NgClass} from '@angular/common';


@Component({
  selector: 'app-tdb',
  imports: [NgClass],
  templateUrl: './tdb.component.html',
  styleUrl: './tdb.component.css',
})
export class TdbComponent {
  @Input({transform: (value: number)=> Math.round(value), required: true}) vit!: Observable<number>;
  @Input({transform: (value: number)=> Math.round(value), required: true}) distParcours!: Observable<number>;
  @Input({transform: (value: number)=> Math.round(value), required: true}) elevation!: Observable<number>;
  @Input({ transform: (v: number) => Math.round(v * 10) / 10, required: true }) pente!: number;
  @Input({transform: (value: number)=> Math.round(value), required: true}) deniv!: Observable<number>;


  get penteClass(): string {
    return this.pente > 0 ? 'pente-positive' : 'pente-negative';
  }






}
