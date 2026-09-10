"use server";

// This file is the old dashboard action - redirect to manufacturer portal actions
// The new system uses /manufacturer/* routes
export { getManufacturerDashboard as getDashboardData } from './batches';
