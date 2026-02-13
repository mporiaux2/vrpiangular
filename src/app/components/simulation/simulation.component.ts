import {Component, ChangeDetectorRef, OnDestroy, OnInit, Input} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-simulation',
  standalone:true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.css',
})
export class SimulationComponent implements OnInit, OnDestroy {
  // état "métier"
  direction = 0;
  gaucheSimul = false;
  droiteSimul = false;

  // valeurs affichées
  vitesseRecue = '';
  directionRecue = '';

  // input vitesse à envoyer
  vitesseAEnvoyer = '';

  // ----- actions UI -----
  @Input() wstacx!: WebSocket;
  @Input() wsarduino!: WebSocket;


  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

 /* private initWsTacx(): void {
    this.wstacx = new WebSocket('ws://pi5.local/wstacxhtml');

    this.wstacx.onopen = () => {
      console.log('WebSocket TACX ouvert');
      // this.wstacx?.send("activation de wstacxhtml");
    };

    this.wstacx.onmessage = (e) => {
      console.log('réception vitesse : ' + e.data);
      this.vitesseRecue = String(e.data);
      this.cdr.detectChanges(); // ou this.cdr.markForCheck()
    };

    this.wstacx.onerror = () => console.log('Erreur WebSocket TACX');
    this.wstacx.onclose = () =>{
      console.log('WebSocket TACX fermé');
      this.initWsTacx();
    }
  }

  private initWsArduino(): void {
    this.wsarduino = new WebSocket('ws://pi5.local/wsarduinohtml');

    this.wsarduino.onopen = () => {
      console.log('WebSocket ARDUINO ouvert');
      // this.wsarduino?.send("activation de wsarduinohtml");
    };

    this.wsarduino.onmessage = (e) => {
      console.log('réception direction : ' + e.data);
      this.directionRecue = String(e.data);
      this.cdr.detectChanges(); // ou this.cdr.markForCheck()
    };

    this.wsarduino.onerror = () => console.log('Erreur WebSocket ARDUINO');
    this.wsarduino.onclose = () => {
      console.log('WebSocket ARDUINO fermé');
      this.initWsArduino();
    }
  }*/




  toggleDroite(): void {
    if (!this.droiteSimul) {
      this.direction += 2;
      this.droiteSimul = true;
    } else {
      this.direction -= 2;
      this.droiteSimul = false;
    }
    this.sendDirection();
  }

  toggleGauche(): void {
    if (!this.gaucheSimul) {
      this.direction += 1;
      this.gaucheSimul = true;
    } else {
      this.direction -= 1;
      this.gaucheSimul = false;
    }
    this.sendDirection();
  }

  sendDirection(): void {
    this.safeSend(this.wsarduino, `d:${this.direction}`);
  }

  sendVit(): void {
    this.safeSend(this.wstacx, `v:${this.vitesseAEnvoyer}`);
  }



  private safeSend(ws: WebSocket | undefined, msg: string): void {
    if (!ws) {
      console.warn('WebSocket non initialisé, message ignoré :', msg);
      return;
    }
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket pas ouvert (state=' + ws.readyState + '), message ignoré :', msg);
      return;
    }
    ws.send(msg);
  }


}
