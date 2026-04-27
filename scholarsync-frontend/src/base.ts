export const isLocalhost = window.location.hostname === 'localhost';

// Production: all services behind one gateway
export const baseURL = `${window.location.origin}/api`;

// Localhost: each service on its own port
export const SERVICE_PORTS: Record<string, number> = {
	iam: 6001,
	wfms: 6002,
	notification: 6003,
	report: 6004,
};
