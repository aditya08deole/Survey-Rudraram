/**
 * Dashboard Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AppProvider } from '../context/AppContext';

// Mock API calls
jest.mock('../services/apiService', () => ({
  fetchDevicesFromDB: jest.fn(() => Promise.resolve({
    success: true,
    devices: [
      {
        survey_code: 'BW001',
        device_type: 'borewell',
        zone: 'SC Colony',
        status: 'Working',
        latitude: 17.558,
        longitude: 78.166
      }
    ],
    count: 1
  })),
  fetchStatsFromDB: jest.fn(() => Promise.resolve({
    success: true,
    stats: {
      by_type: { borewell: 60, sump: 4, overhead_tank: 5 },
      by_status: { Working: 50, 'Not Working': 15, Failed: 4 },
      by_zone: { 'SC Colony': 25, Village: 30, Waddera: 14 }
    }
  })),
  fetchZonesFromDB: jest.fn(() => Promise.resolve({
    success: true,
    zones: ['SC Colony', 'Village', 'Waddera']
  }))
}));

describe('Dashboard Component', () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <AppProvider>
          <Dashboard />
        </AppProvider>
      </BrowserRouter>
    );
  };

  test('renders dashboard with loading state', () => {
    renderDashboard();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('displays total devices count after loading', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Total Devices/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows device type breakdown', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Borewell/i)).toBeInTheDocument();
    });
  });

  test('displays zone statistics', async () => {
    renderDashboard();
    
    await waitFor(() => {
      const zones = ['SC Colony', 'Village', 'Waddera'];
      zones.forEach(zone => {
        expect(screen.getByText(new RegExp(zone, 'i'))).toBeInTheDocument();
      });
    });
  });

  test('refresh button triggers data reload', async () => {
    renderDashboard();
    
    await waitFor(() => {
      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      expect(refreshBtn).toBeInTheDocument();
    });
  });
});
