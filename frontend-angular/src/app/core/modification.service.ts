import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Modification, NewModification } from '../models/modification';
import { TokenStorage } from './token-storage';

const BASE_URL = '/api/modifications';

@Injectable({ providedIn: 'root' })
export class ModificationService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorage);

  getModifications(): Observable<Modification[]> {
    if (!this.tokens.get()) return of([]);
    return this.http.get<Modification[]>(BASE_URL);
  }

  saveModification(modification: NewModification): Observable<Modification> {
    return this.http.post<Modification>(BASE_URL, modification);
  }

  deleteModification(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`);
  }
}
