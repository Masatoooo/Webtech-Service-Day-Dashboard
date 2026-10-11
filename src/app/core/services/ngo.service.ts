import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { NGO, NGOApprovalStatus } from '../../models';
import { DataStoreService } from './data-store.service';

@Injectable({
  providedIn: 'root'
})
export class NGOService {
  constructor(private readonly store: DataStoreService) {}

  getNGOs(): Observable<NGO[]> {
    return this.store.ngos$;
  }

  getApprovedNGOs(): Observable<NGO[]> {
    return this.store.ngos$.pipe(
      map((list) => list.filter((ngo) => ngo.approvalStatus === 'APPROVED'))
    );
  }

  getNGOById(id: string): Observable<NGO | undefined> {
    return this.store.ngos$.pipe(
      map((list) => list.find((ngo) => ngo.id === id))
    );
  }

  createNGO(data: Omit<NGO, 'id'>): Observable<NGO> {
    const current = this.store.ngosSnapshot;
    const newNGO: NGO = {
      ...data,
      id: `ngo-${Date.now()}`
    };
    this.store.setNGOs([...current, newNGO]);
    return of(newNGO);
  }

  updateNGO(id: string, updates: Partial<Omit<NGO, 'id'>>): Observable<NGO> {
    const current = this.store.ngosSnapshot;
    const index = current.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`[NGOService] NGO with id "${id}" not found.`);
    }
    const updated: NGO = { ...current[index], ...updates };
    const nextList = [...current];
    nextList[index] = updated;
    this.store.setNGOs(nextList);
    return of(updated);
  }

  deleteNGO(id: string): Observable<boolean> {
    const current = this.store.ngosSnapshot;
    const filtered = current.filter((n) => n.id !== id);
    if (filtered.length === current.length) {
      return of(false);
    }
    this.store.setNGOs(filtered);
    return of(true);
  }
}
