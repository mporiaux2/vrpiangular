// demarrer.component.ts (version allégée côté Google Maps)



import { Component, OnInit, OnDestroy, ChangeDetectorRef ,ElementRef,ViewChild} from '@angular/core';
import { SimulationComponent } from '../simulation/simulation.component';
import { FormsModule } from '@angular/forms';
import { TdbComponent } from '../tdb/tdb.component';
import { ValeursService } from '../../services/valeurs.service';
import { NgIf } from '@angular/common';
import { StreetViewMapsService } from '../../services/StreetViewMapService.service';
import {Carte, Coordonnees, Panos} from './carte';

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

@Component({
  selector: 'app-demarrer',
  standalone: true,
  imports: [SimulationComponent, FormsModule, TdbComponent, NgIf],
  templateUrl: './demarrer.component.html',
  styleUrl: './demarrer.component.css',
})
class DemarrerComponent implements OnInit, OnDestroy {


  @ViewChild('carteDiv', {static: true}) carteDiv!: ElementRef<HTMLElement>;
  @ViewChild('leftCarteSlot', {static: true}) leftCarteSlot!: ElementRef<HTMLElement>;
  @ViewChild('wrapCarteSlot', {static: true}) wrapCarteSlot!: ElementRef<HTMLElement>;

  vitZoom: number;
  FADE_MS: number;
  READY_GRACE_MS: number;
  MAX_WAIT_MS: number;
  vit = 10;
  pente = 0;
  carte: Carte | null = null;
  panos: Panos | null = null;
  wstacx: WebSocket;
  wsarduino: WebSocket;

  distParcours = 0;
  elevation = 0;
  startPos = new Coordonnees(50.456494, 4.238618);

  oldelev = 0;
  deniv = 0;
  premelev = true;

  showChild = true;

  rot: number = 0;

  carteDansWrap = false;


  constructor(
    private cdr: ChangeDetectorRef,
    private valeursService: ValeursService,
    private maps: StreetViewMapsService
  ) {
    this.vitZoom = valeursService.vitZoom;
    this.FADE_MS = valeursService.FADE_MS;
    this.READY_GRACE_MS = valeursService.READY_GRACE_MS;
    this.MAX_WAIT_MS = valeursService.MAX_WAIT_MS;
    this.startPos = valeursService.startPos;


    this.wstacx = new WebSocket("ws://pi5.local/wstacxhtml");
    this.wstacx.onmessage = (e) => {
      const infos = e.data.split(":");
      if (infos[0] === "v") {
        this.vit = parseFloat(infos[1]);
        // @ts-ignore
        this.panos.vit=this.vit;
      }

      if (infos[0] === "p") this.pente = parseFloat(infos[1]);
      this.cdr.detectChanges();
    };

    this.wsarduino = new WebSocket("ws://pi5.local/wsarduinohtml");
    this.wsarduino.onmessage = (e) => {
           if (isNaN(e.data)) {
        console.log("message reçu de arduino non numérique : " + e.data);

      } else {
        this.rot = parseInt(e.data, 10);
        if (!isNaN(this.rot)) {
          // @ts-ignore
          this.panos.active?.setPov({heading: this.rot, pitch: 0});
          // @ts-ignore
          this.panos.next?.setPov({heading: this.rot, pitch: 0});
          this.carte?.setHeading(this.rot);
          }
      }
      ;
    }
  }

  async ngOnInit(): Promise<void> {
    // 1) charge Google Maps via service
    await this.maps.load(this.valeursService.apiKey);
    // 2) crée la carte et les panoramas via service
    this.carte = new Carte(this.startPos, this.rot, this.maps);
    this.panos = new Panos(this.maps, this.startPos, this.rot, this.valeursService);
  }


  toggleCartePosition() {
    const carteEl = this.carteDiv.nativeElement;

    if (!this.carteDansWrap) {
      // Mettre la carte dans le wrap, dans le slot prévu (au-dessus des panos)
      this.wrapCarteSlot.nativeElement.appendChild(carteEl);
    } else {
      // Remettre la carte à gauche
      this.leftCarteSlot.nativeElement.appendChild(carteEl);
      this.panos = new Panos(this.maps, this.startPos, this.rot, this.valeursService);
    }

    this.carteDansWrap = !this.carteDansWrap;

    // IMPORTANT : refresh Google Maps après changement de taille/parent DOM
    setTimeout(() => {
      try {
        // @ts-ignore (si google n'est pas typé)
        google.maps.event.trigger(this.carte, 'resize');

        // @ts-ignore
        const center = this.panos.active?.getPosition?.() || this.startPos;
        this.carte?.setCenter?.(center);
      } catch (e) {
        // pas bloquant si l'API n'est pas encore prête
      }
    }, 400);
  }


  ngOnDestroy(): void {
    this.maps.cleanupGlobalCallback();
  }

  toggleChild() {
    this.showChild = !this.showChild;
  }


  async chargerElevation() {
    try {
      // @ts-ignore
      const elev = await this.maps.getElevationAt(this.carteDansWrap ? this.startPos : this.panos.next.getPosition());
      if (this.premelev) {
        this.oldelev = elev;
        this.premelev = false;
      }

      this.elevation = elev;
      const delta = this.elevation - this.oldelev;
      if (delta > 0) this.deniv += delta;
      this.oldelev = this.elevation;

      this.wstacx.send("h:" + this.elevation + ":" + this.distParcours);
    } catch (e) {
      console.error('Elevation error', e);
    }
  }


  recentrerCarteSurPanoActif() {
    if (!this.carte) return;


    if (this.carteDansWrap) {
      this.carte.moveCenter();
      this.startPos = this.carte.centre;
    } else {
      // @ts-ignore
      this.startPos = this.panos.active.getPosition();
      this.carte.setCenter(this.startPos);
    }

    this.valeursService.startPos = this.startPos;
  }
  async avancer() {
    do {
      this.recentrerCarteSurPanoActif();
      this.chargerElevation();
      this.distParcours = Math.round(this.distParcours);
      this.cdr.detectChanges();
      if (this.carteDansWrap) {
        await sleep(36000 / this.vit);
        this.distParcours += 10;
      } else {
               await this.panos?.avancer();
               // @ts-ignore
        this.distParcours+=this.panos.dist;
      }
    } while (true);
  }
}

export default DemarrerComponent












