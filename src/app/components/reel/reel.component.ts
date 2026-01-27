import {Component,ChangeDetectorRef, OnDestroy, OnInit} from '@angular/core';

@Component({
  selector: 'app-reel',
  imports: [],
  templateUrl: './reel.component.html',
  styleUrl: './reel.component.css',
})
export class ReelComponent  implements OnInit, OnDestroy{
// état "métier"
  direction = 0;

  // valeurs affichées
  vitesseRecue = '';
  directionRecue = '';

  // input vitesse à envoyer
  vitesseAEnvoyer = '';

  // websockets
  private wstacx?: WebSocket;
  private wsarduino?: WebSocket;


  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initWsTacx();
    this.initWsArduino();
  }

  ngOnDestroy(): void {
    this.wstacx?.close();
    this.wsarduino?.close();
  }

  private initWsTacx(): void {
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
    this.wstacx.onclose = () => console.log('WebSocket TACX fermé');
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
    this.wsarduino.onclose = () => console.log('WebSocket ARDUINO fermé');
  }

  // ----- actions UI -----

  connectTACX(): void {
    console.log('demande de connexion TACX');
    this.safeSend(this.wstacx, 'connexion');
  }

  connectARDUINO(): void {
    console.log('demande de connexion ARDUINO');
    this.safeSend(this.wsarduino, 'connexion');
  }

  // ----- util -----

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
