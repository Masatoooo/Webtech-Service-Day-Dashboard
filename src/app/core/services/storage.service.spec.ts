import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve typed items correctly', () => {
    const data = { id: 'test-1', name: 'Sample' };
    const success = service.setItem('test_key', data);
    expect(success).toBe(true);

    const retrieved = service.getItem<{ id: string; name: string }>('test_key');
    expect(retrieved).toEqual(data);
  });

  it('should return fallback when key does not exist', () => {
    const retrieved = service.getItem<string>('non_existent', 'default_val');
    expect(retrieved).toBe('default_val');
  });

  it('should handle corrupt or malformed JSON gracefully and return fallback', () => {
    localStorage.setItem('corrupt_key', '{ invalid-json ...');
    const result = service.getItem<{ id: string }>('corrupt_key', { id: 'fallback' });
    expect(result).toEqual({ id: 'fallback' });
  });

  it('should remove items correctly', () => {
    service.setItem('removable_key', 'val');
    expect(service.hasItem('removable_key')).toBe(true);

    service.removeItem('removable_key');
    expect(service.hasItem('removable_key')).toBe(false);
  });

  it('should clear all demo keys with clearAllDemoData', () => {
    service.setItem('sdd_ngos', ['ngo1']);
    service.setItem('sdd_activities', ['act1']);
    service.setItem('sdd_users', ['usr1']);

    service.clearAllDemoData();

    expect(service.getItem('sdd_ngos')).toBeNull();
    expect(service.getItem('sdd_activities')).toBeNull();
    expect(service.getItem('sdd_users')).toBeNull();
  });
});
