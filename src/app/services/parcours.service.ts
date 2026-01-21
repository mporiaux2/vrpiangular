import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environment/environment';
import {Observable} from 'rxjs';
import {Parcours} from '../entities/parcours.entities';


@Injectable({providedIn:"root"})  //providedIn:"root" permet de rendre accessible cette classe partout dans l'application
export class ClientsService{
  private host = environment.host;
  constructor(private http: HttpClient) {
  }

  getParcours(idparcours: number): Observable<Parcours>{
    return this.http.get<Parcours>(this.host + '/parcours/' + idparcours);
  }
  searchParcoursUnique(nom: string): Observable<Parcours[]>{
    return this.http.get<Parcours[]>(this.host + '/parcours/'+nom);
  }
  deleteParcours(p: Parcours): Observable<void>{
    return this.http.delete<void>(this.host + '/parcours/' + p.idparcours);
  }
  save(p: Parcours): Observable<Parcours>{
    return this.http.post<Parcours>(this.host + '/parcours/', p);
  }

  updateClient(p: Parcours): Observable<Parcours>{
    return this.http.put<Parcours>(this.host + '/parcours/' + p.idparcours, p);
  }
}
