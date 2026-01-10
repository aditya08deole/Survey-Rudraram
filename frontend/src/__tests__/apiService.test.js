/**
 * API Service Tests
 */

import {
  fetchDevicesFromDB,
  fetchStatsFromDB,
  fetchDeviceByCodeDB,
  fetchZonesFromDB,
  checkDatabaseHealth
} from '../services/apiService';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service - Database Endpoints', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('fetchDevicesFromDB', () => {
    test('fetches devices successfully', async () => {
      const mockDevices = {
        success: true,
        data: [
          { survey_code: 'BW001', device_type: 'borewell', status: 'Working' }
        ],
        count: 1
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices
      });

      const result = await fetchDevicesFromDB();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/db/devices'),
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.devices).toHaveLength(1);
    });

    test('handles API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await fetchDevicesFromDB();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('applies filters correctly', async () => {
      const mockDevices = { success: true, data: [], count: 0 };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices
      });

      const filters = { device_type: 'borewell', zone: 'SC Colony', status: 'Working' };
      await fetchDevicesFromDB(filters);

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('device_type=borewell');
      expect(calledUrl).toContain('zone=SC+Colony');
      expect(calledUrl).toContain('status=Working');
    });
  });

  describe('fetchStatsFromDB', () => {
    test('fetches statistics successfully', async () => {
      const mockStats = {
        success: true,
        data: {
          by_type: { borewell: 60, sump: 4 },
          by_status: { Working: 50 },
          by_zone: { 'SC Colony': 25 }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      const result = await fetchStatsFromDB();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.by_type).toBeDefined();
    });
  });

  describe('fetchDeviceByCodeDB', () => {
    test('fetches single device by survey code', async () => {
      const mockDevice = {
        success: true,
        data: { survey_code: 'BW001', device_type: 'borewell' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice
      });

      const result = await fetchDeviceByCodeDB('BW001');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/db/devices/BW001'),
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.device.survey_code).toBe('BW001');
    });

    test('handles device not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await fetchDeviceByCodeDB('INVALID');

      expect(result.success).toBe(false);
      expect(result.device).toBeNull();
    });
  });

  describe('fetchZonesFromDB', () => {
    test('fetches zones list successfully', async () => {
      const mockZones = {
        success: true,
        data: ['SC Colony', 'Village', 'Waddera']
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockZones
      });

      const result = await fetchZonesFromDB();

      expect(result.success).toBe(true);
      expect(result.zones).toHaveLength(3);
    });
  });

  describe('checkDatabaseHealth', () => {
    test('returns healthy status', async () => {
      const mockHealth = {
        status: 'healthy',
        database: 'supabase',
        timestamp: new Date().toISOString()
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      });

      const result = await checkDatabaseHealth();

      expect(result.success).toBe(true);
      expect(result.status).toBe('healthy');
    });

    test('handles database connection failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await checkDatabaseHealth();

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
    });
  });
});
