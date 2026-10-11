import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User, UserRole } from '../../models';
import { DataStoreService } from './data-store.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private readonly store: DataStoreService) {}

  getUsers(): Observable<User[]> {
    return this.store.users$;
  }

  getUserById(id: string): Observable<User | undefined> {
    return this.store.users$.pipe(
      map((list) => list.find((u) => u.id === id))
    );
  }

  getUsersByRole(role: UserRole): Observable<User[]> {
    return this.store.users$.pipe(
      map((list) => list.filter((u) => u.role === role))
    );
  }

  getEmployees(): Observable<User[]> {
    return this.getUsersByRole('EMPLOYEE');
  }

  getAdmins(): Observable<User[]> {
    return this.getUsersByRole('ADMIN');
  }
}
