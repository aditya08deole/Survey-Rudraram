/**
 * useDeviceFilters Hook (TypeScript)
 * 
 * Single source of truth for device filtering
 * Provides filters state and filtered devices array
 */

import { useState, useMemo, useCallback } from 'react';
import type { Device, Filters, FilterCount } from '../types/device';

interface UseDeviceFiltersReturn {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    updateFilter: (key: keyof Filters, value: Filters[keyof Filters]) => void;
    updateFilters: (updates: Partial<Filters>) => void;
    resetFilters: () => void;
    hasActiveFilters: boolean;
    filteredDevices: Device[];
    filterCount: FilterCount;
}

const initialFilters: Filters = {
    searchText: '',
    zone: null,
    deviceType: null,
    status: null
};

export function useDeviceFilters(allDevices: Device[] = []): UseDeviceFiltersReturn {
    const [filters, setFilters] = useState<Filters>(initialFilters);

    // Memoized filtered devices - recalculates only when allDevices or filters change
    const filteredDevices = useMemo(() => {
        return allDevices.filter(device => {
            // Search filter - searches across multiple fields
            if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase();

                // Build searchable string from all relevant fields
                const searchableFields = [
                    device.survey_id,
                    device.original_name,
                    device.zone,
                    device.street,
                    device.device_type,
                    device.status,
                    device.notes
                ].filter(Boolean).join(' ').toLowerCase();

                // Normalize Waddera/Waddera Colony
                const normalizedSearch = searchLower.includes('waddera') ? 'waddera' : searchLower;

                if (!searchableFields.includes(normalizedSearch)) {
                    return false;
                }
            }

            // Zone filter
            if (filters.zone && device.zone !== filters.zone) {
                return false;
            }

            // Device type filter
            if (filters.deviceType && device.device_type !== filters.deviceType) {
                return false;
            }

            // Status filter
            if (filters.status && device.status !== filters.status) {
                return false;
            }

            return true;
        });
    }, [allDevices, filters]);

    // Helper to update a single filter
    const updateFilter = useCallback((key: keyof Filters, value: Filters[keyof Filters]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Helper to update multiple filters at once
    const updateFilters = useCallback((updates: Partial<Filters>) => {
        setFilters(prev => ({ ...prev, ...updates }));
    }, []);

    // Reset all filters
    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
    }, []);

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return !!(filters.searchText || filters.zone || filters.deviceType || filters.status);
    }, [filters]);

    return {
        filters,
        setFilters,
        updateFilter,
        updateFilters,
        resetFilters,
        hasActiveFilters,
        filteredDevices,
        filterCount: {
            total: allDevices.length,
            filtered: filteredDevices.length
        }
    };
}

export default useDeviceFilters;
