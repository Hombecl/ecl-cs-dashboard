/**
 * 17Track API Integration
 * Documentation: https://asset.17track.net/api/document/v1_en/index.html
 *
 * Note: Requires a 17Track API key. Get one from https://www.17track.net/en/api
 */

const API_BASE = 'https://api.17track.net/track/v2';

// Common carrier codes for our use case
export const CARRIER_CODES = {
  USPS: 21051,
  UPS: 100002,
  FEDEX: 100003,
  DHL: 100001,
  // Chinese carriers
  YANWEN: 190012,
  CHINA_POST: 3011,
  CAINIAO: 190271,
  YUN_EXPRESS: 190107,
  // Auto detect
  AUTO: -1,
} as const;

// 17Track status codes
export const TRACKING_STATUS = {
  NOT_FOUND: 0,
  IN_TRANSIT: 10,
  EXPIRED: 20,
  PICKUP: 30,
  UNDELIVERED: 35,
  DELIVERED: 40,
  ALERT: 50,
} as const;

export interface TrackingEvent {
  timestamp: string;
  description: string;
  location?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  carrierCode: number;
  status: string;
  statusCode: number;
  estimatedDelivery?: string;
  lastUpdate?: string;
  origin?: string;
  destination?: string;
  events: TrackingEvent[];
  daysInTransit?: number;
}

export interface TrackingError {
  code: number;
  message: string;
}

interface Track17Response {
  code: number;
  data: {
    accepted?: Array<{
      number: string;
      carrier: number;
    }>;
    rejected?: Array<{
      number: string;
      error: { code: number; message: string };
    }>;
  };
}

interface TrackInfoResponse {
  code: number;
  data: {
    accepted?: Array<{
      number: string;
      carrier: number;
      param?: any;
      tag?: string;
      track: {
        b: number; // carrier code
        c: number; // country code
        e: number; // status
        f: number; // substatus
        w1?: string; // origin
        w2?: string; // destination
        d?: string; // estimated delivery
        z0?: Array<{
          a: string; // timestamp
          c?: string; // location
          z: string; // description
        }>;
        z1?: Array<{
          a: string;
          c?: string;
          z: string;
        }>;
        z2?: Array<{
          a: string;
          c?: string;
          z: string;
        }>;
      };
      track_info?: {
        latest_status?: {
          status: string;
          sub_status: string;
        };
        tracking?: {
          providers_hash: number;
          providers: Array<{
            provider: {
              name: string;
              key: string;
            };
            events: Array<{
              time_utc: string;
              time_raw?: string;
              description: string;
              location?: string;
              stage?: string;
            }>;
          }>;
        };
        time_metrics?: {
          days_after_order?: number;
          days_of_transit?: number;
          days_of_transit_done?: number;
        };
        misc_info?: {
          risk_factor?: number;
        };
      };
    }>;
    rejected?: Array<{
      number: string;
      error: { code: number; message: string };
    }>;
  };
}

function getStatusText(statusCode: number): string {
  switch (statusCode) {
    case TRACKING_STATUS.NOT_FOUND:
      return 'Not Found';
    case TRACKING_STATUS.IN_TRANSIT:
      return 'In Transit';
    case TRACKING_STATUS.EXPIRED:
      return 'Expired';
    case TRACKING_STATUS.PICKUP:
      return 'Ready for Pickup';
    case TRACKING_STATUS.UNDELIVERED:
      return 'Undelivered';
    case TRACKING_STATUS.DELIVERED:
      return 'Delivered';
    case TRACKING_STATUS.ALERT:
      return 'Alert';
    default:
      return 'Unknown';
  }
}

/**
 * Register tracking numbers with 17Track
 * Must be called before getting tracking info for new numbers
 */
export async function registerTrackingNumbers(
  trackingNumbers: string[],
  apiKey: string
): Promise<{ accepted: string[]; rejected: Array<{ number: string; error: string }> }> {
  if (!apiKey) {
    throw new Error('17Track API key is required');
  }

  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      '17token': apiKey,
    },
    body: JSON.stringify(
      trackingNumbers.map((num) => ({
        number: num,
        auto_detection: true,
      }))
    ),
  });

  if (response.status === 401) {
    throw new Error('Invalid 17Track API key');
  }

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const result: Track17Response = await response.json();

  if (result.code !== 0) {
    throw new Error(`17Track API error: ${result.code}`);
  }

  return {
    accepted: result.data.accepted?.map((a) => a.number) || [],
    rejected:
      result.data.rejected?.map((r) => ({
        number: r.number,
        error: r.error.message,
      })) || [],
  };
}

/**
 * Get tracking information for registered tracking numbers
 */
export async function getTrackingInfo(
  trackingNumbers: string[],
  apiKey: string
): Promise<{ results: TrackingInfo[]; errors: Array<{ number: string; error: string }> }> {
  if (!apiKey) {
    throw new Error('17Track API key is required');
  }

  const response = await fetch(`${API_BASE}/gettrackinfo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      '17token': apiKey,
    },
    body: JSON.stringify(
      trackingNumbers.map((num) => ({
        number: num,
      }))
    ),
  });

  if (response.status === 401) {
    throw new Error('Invalid 17Track API key');
  }

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const result: TrackInfoResponse = await response.json();

  if (result.code !== 0) {
    throw new Error(`17Track API error: ${result.code}`);
  }

  const results: TrackingInfo[] = [];
  const errors: Array<{ number: string; error: string }> = [];

  // Process accepted results
  for (const item of result.data.accepted || []) {
    const trackInfo = item.track_info;
    const track = item.track;

    // Combine events from all sources (z0, z1, z2)
    const events: TrackingEvent[] = [];

    // Try to use track_info events first (more detailed)
    if (trackInfo?.tracking?.providers) {
      for (const provider of trackInfo.tracking.providers) {
        for (const event of provider.events || []) {
          events.push({
            timestamp: event.time_utc || event.time_raw || '',
            description: event.description,
            location: event.location,
          });
        }
      }
    } else {
      // Fallback to raw track data
      const allEvents = [...(track.z0 || []), ...(track.z1 || []), ...(track.z2 || [])];
      for (const event of allEvents) {
        events.push({
          timestamp: event.a,
          description: event.z,
          location: event.c,
        });
      }
    }

    // Sort events by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    results.push({
      trackingNumber: item.number,
      carrier: trackInfo?.tracking?.providers?.[0]?.provider?.name || `Carrier ${track.b}`,
      carrierCode: track.b,
      status: trackInfo?.latest_status?.status || getStatusText(track.e),
      statusCode: track.e,
      estimatedDelivery: track.d,
      lastUpdate: events[0]?.timestamp,
      origin: track.w1,
      destination: track.w2,
      events,
      daysInTransit: trackInfo?.time_metrics?.days_of_transit,
    });
  }

  // Process rejected results
  for (const item of result.data.rejected || []) {
    errors.push({
      number: item.number,
      error: item.error.message,
    });
  }

  return { results, errors };
}

/**
 * Convenience function to register and get tracking info in one call
 * Handles the case where tracking number hasn't been registered yet
 */
export async function trackPackage(
  trackingNumber: string,
  apiKey: string
): Promise<TrackingInfo | null> {
  // First try to get tracking info
  const { results, errors } = await getTrackingInfo([trackingNumber], apiKey);

  if (results.length > 0) {
    return results[0];
  }

  // If not found, try to register first
  if (errors.some((e) => e.error.includes('not registered') || e.error.includes('Not found'))) {
    await registerTrackingNumbers([trackingNumber], apiKey);
    // Wait a bit for registration to process
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Try again
    const retry = await getTrackingInfo([trackingNumber], apiKey);
    return retry.results[0] || null;
  }

  return null;
}
