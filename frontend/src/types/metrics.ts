/**
 * Metrics Computation Types
 * Derived analytics from device data
 */

import type { Device, DeviceStatus, DeviceType } from './device';

export interface SystemMetrics {
    totalDevices: number;
    working: number;
    notWorking: number;
    failed: number;
    onRepair: number;
    operationalPercent: number;
    housesServed: number;
    mappedDevices: number;
    unmappedDevices: number;
    systemHealthScore: number;
    lastUpdated: Date;
}

export interface StatusDistribution {
    status: DeviceStatus;
    count: number;
    percent: number;
    color: string;
}

export interface ZoneMetrics {
    zone: string;
    totalDevices: number;
    working: number;
    notWorking: number;
    failed: number;
    housesServed: number;
    operationalPercent: number;
    healthColor: 'green' | 'yellow' | 'red';
}

export interface TypeMetrics {
    type: DeviceType;
    total: number;
    working: number;
    notWorking: number;
    failed: number;
    housesServed: number;
    operationalPercent: number;
}

/**
 * Compute system-wide metrics from devices
 */
export function computeSystemMetrics(devices: Device[]): SystemMetrics {
    const total = devices.length;
    const working = devices.filter(d => d.status === 'Working').length;
    const notWorking = devices.filter(d => d.status === 'Not Working').length;
    const failed = devices.filter(d => d.status === 'Failed').length;
    const onRepair = devices.filter(d => d.status === 'On Repair').length;
    const mapped = devices.filter(d => d.lat && d.lng).length;

    const operationalPercent = total > 0 ? (working / total) * 100 : 0;
    const systemHealthScore = total > 0 ? Math.round(operationalPercent) : 0;

    return {
        totalDevices: total,
        working,
        notWorking,
        failed,
        onRepair,
        operationalPercent,
        housesServed: devices.reduce((sum, d) => sum + (d.houses || 0), 0),
        mappedDevices: mapped,
        unmappedDevices: total - mapped,
        systemHealthScore,
        lastUpdated: new Date()
    };
}

/**
 * Compute status distribution
 */
export function computeStatusDistribution(devices: Device[]): StatusDistribution[] {
    const total = devices.length;
    const statusCounts: Record<string, number> = {};

    devices.forEach(d => {
        const status = d.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const colorMap: Record<string, string> = {
        'Working': '#22C55E',
        'Not Working': '#F59E0B',
        'Failed': '#EF4444',
        'On Repair': '#EAB308',
        'Cancelled': '#9CA3AF'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
        status: status as DeviceStatus,
        count,
        percent: total > 0 ? (count / total) * 100 : 0,
        color: colorMap[status] || '#9CA3AF'
    }));
}

/**
 * Group devices by zone
 */
export function computeZoneMetrics(devices: Device[]): ZoneMetrics[] {
    const zoneMap: Record<string, Device[]> = {};

    devices.forEach(d => {
        const zone = d.zone || 'Unknown';
        if (!zoneMap[zone]) zoneMap[zone] = [];
        zoneMap[zone].push(d);
    });

    return Object.entries(zoneMap).map(([zone, zoneDevices]) => {
        const total = zoneDevices.length;
        const working = zoneDevices.filter(d => d.status === 'Working').length;
        const notWorking = zoneDevices.filter(d => d.status === 'Not Working').length;
        const failed = zoneDevices.filter(d => d.status === 'Failed').length;
        const operationalPercent = total > 0 ? (working / total) * 100 : 0;

        let healthColor: 'green' | 'yellow' | 'red' = 'green';
        if (operationalPercent < 70) healthColor = 'red';
        else if (operationalPercent < 90) healthColor = 'yellow';

        return {
            zone,
            totalDevices: total,
            working,
            notWorking,
            failed,
            housesServed: zoneDevices.reduce((sum, d) => sum + (d.houses || 0), 0),
            operationalPercent,
            healthColor
        };
    }).sort((a, b) => a.operationalPercent - b.operationalPercent); // Worst first
}

/**
 * Group devices by type
 */
export function computeTypeMetrics(devices: Device[]): TypeMetrics[] {
    const typeMap: Record<string, Device[]> = {};

    devices.forEach(d => {
        const type = d.device_type || 'Unknown';
        if (!typeMap[type]) typeMap[type] = [];
        typeMap[type].push(d);
    });

    return Object.entries(typeMap).map(([type, typeDevices]) => {
        const total = typeDevices.length;
        const working = typeDevices.filter(d => d.status === 'Working').length;
        const notWorking = typeDevices.filter(d => d.status === 'Not Working').length;
        const failed = typeDevices.filter(d => d.status === 'Failed').length;
        const operationalPercent = total > 0 ? (working / total) * 100 : 0;

        return {
            type: type as DeviceType,
            total,
            working,
            notWorking,
            failed,
            housesServed: typeDevices.reduce((sum, d) => sum + (d.houses || 0), 0),
            operationalPercent
        };
    });
}
