/**
 * App Context Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import * as apiService from '../services/apiService';

// Mock API service
jest.mock('../services/apiService');

describe('AppContext', () => {
  beforeEach(() => {
    apiService.fetchDevicesFromDB.mockResolvedValue({
      success: true,
      devices: [
        {
          survey_code: 'BW001',
          device_type: 'borewell',
          zone: 'SC Colony',
          status: 'Working',
          latitude: 17.558,
          longitude: 78.166,
          location: 'Test Location',
          original_name: 'Test Borewell'
        },
        {
          survey_code: 'SM001',
          device_type: 'sump',
          zone: 'Village',
          status: 'Not Working',
          latitude: 17.559,
          longitude: 78.167,
          location: 'Test Sump',
          original_name: 'Test Sump'
        }
      ],
      count: 2
    });

    apiService.fetchStatsFromDB.mockResolvedValue({
      success: true,
      stats: {
        by_type: { borewell: 1, sump: 1 },
        by_status: { Working: 1, 'Not Working': 1 },
        by_zone: { 'SC Colony': 1, Village: 1 }
      }
    });

    apiService.fetchZonesFromDB.mockResolvedValue({
      success: true,
      zones: ['SC Colony', 'Village']
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('loads initial data on mount', async () => {
    const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.devices).toHaveLength(2);
    expect(result.current.stats).toBeDefined();
  });

  test('transforms device types correctly', async () => {
    const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const borewellDevice = result.current.devices.find(d => d.surveyCode === 'BW001');
    expect(borewellDevice.deviceType).toBe('Borewell');

    const sumpDevice = result.current.devices.find(d => d.surveyCode === 'SM001');
    expect(sumpDevice.deviceType).toBe('Sump');
  });

  test('filters devices correctly', async () => {
    const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Apply zone filter
    result.current.setFilters({ zone: 'SC Colony' });

    await waitFor(() => {
      const filtered = result.current.getFilteredDevices();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].zone).toBe('SC Colony');
    });
  });

  test('returns only mapped devices', async () => {
    const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const mappedDevices = result.current.getMappedDevices();
    expect(mappedDevices).toHaveLength(2); // Both have coordinates
    expect(mappedDevices.every(d => d.lat && d.long)).toBe(true);
  });

  test('handles refresh data action', async () => {
    const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.refreshData();

    await waitFor(() => {
      expect(apiService.fetchDevicesFromDB).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  test('handles API errors gracefully', async () => {
    apiService.fetchDevicesFromDB.mockResolvedValueOnce({
      success: false,
      error: 'Database connection failed',
      devices: []
    });

    const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  test('calculates stats with device types', async () => {
    const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.deviceTypes).toBeDefined();
    expect(result.current.stats.statusBreakdown).toBeDefined();
    expect(result.current.stats.summary.totalBorewells).toBe(1);
    expect(result.current.stats.summary.totalSumps).toBe(1);
  });
});
