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
      // Old API format (v2 legacy)
      track?: {
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
      // New API format
      track_info?: {
        latest_status?: {
          status: string;
          sub_status: string;
          sub_status_descr?: string | null;
        };
        latest_event?: {
          time_iso: string;
          time_utc: string;
          description: string;
          location?: string;
        } | null;
        time_metrics?: {
          days_after_order?: number;
          days_of_transit?: number;
          days_of_transit_done?: number;
          days_after_last_update?: number;
          estimated_delivery_date?: {
            source?: string | null;
            from?: string | null;
            to?: string | null;
          };
        };
        shipping_info?: {
          shipper_address?: {
            country?: string;
            state?: string | null;
            city?: string | null;
          };
          recipient_address?: {
            country?: string;
            state?: string | null;
            city?: string | null;
          };
        };
        tracking?: {
          providers_hash: number;
          providers: Array<{
            provider: {
              key: number;
              name: string;
              alias?: string;
              tel?: string;
              homepage?: string;
              country?: string;
            };
            latest_sync_status?: string;
            latest_sync_time?: string;
            events_hash?: number;
            events: Array<{
              time_iso?: string;
              time_utc?: string;
              time_raw?: string;
              description: string;
              location?: string;
              stage?: string;
            }>;
          }>;
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

function getStatusCodeFromText(status: string): number {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('delivered')) return TRACKING_STATUS.DELIVERED;
  if (statusLower.includes('transit') || statusLower.includes('shipping')) return TRACKING_STATUS.IN_TRANSIT;
  if (statusLower.includes('pickup')) return TRACKING_STATUS.PICKUP;
  if (statusLower.includes('expired')) return TRACKING_STATUS.EXPIRED;
  if (statusLower.includes('undelivered') || statusLower.includes('failed')) return TRACKING_STATUS.UNDELIVERED;
  if (statusLower.includes('alert') || statusLower.includes('exception')) return TRACKING_STATUS.ALERT;
  if (statusLower.includes('notfound') || statusLower === 'not found') return TRACKING_STATUS.NOT_FOUND;
  return TRACKING_STATUS.NOT_FOUND;
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

    // Collect events from all available sources
    const events: TrackingEvent[] = [];

    // Try to use track_info events first (new API format)
    if (trackInfo?.tracking?.providers) {
      for (const provider of trackInfo.tracking.providers) {
        for (const event of provider.events || []) {
          events.push({
            timestamp: event.time_utc || event.time_iso || event.time_raw || '',
            description: event.description,
            location: event.location,
          });
        }
      }
    }

    // Also check latest_event if no events from providers
    if (events.length === 0 && trackInfo?.latest_event) {
      events.push({
        timestamp: trackInfo.latest_event.time_utc || trackInfo.latest_event.time_iso || '',
        description: trackInfo.latest_event.description,
        location: trackInfo.latest_event.location,
      });
    }

    // Fallback to legacy track data if available
    if (events.length === 0 && track) {
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
    events.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      if (isNaN(dateA) || isNaN(dateB)) return 0;
      return dateB - dateA;
    });

    // Get carrier info from either new or old format
    const carrierName = trackInfo?.tracking?.providers?.[0]?.provider?.name ||
                       trackInfo?.tracking?.providers?.[0]?.provider?.alias ||
                       (track?.b ? `Carrier ${track.b}` : `Carrier ${item.carrier}`);
    const carrierCode = track?.b || item.carrier || 0;

    // Get status from either new or old format
    const status = trackInfo?.latest_status?.status ||
                  (track?.e !== undefined ? getStatusText(track.e) : 'Unknown');
    const statusCode = track?.e || getStatusCodeFromText(trackInfo?.latest_status?.status || 'Unknown');

    // Get estimated delivery
    const estimatedDelivery = track?.d ||
                             trackInfo?.time_metrics?.estimated_delivery_date?.from ||
                             trackInfo?.time_metrics?.estimated_delivery_date?.to ||
                             undefined;

    // Get origin/destination
    const origin = track?.w1 || trackInfo?.shipping_info?.shipper_address?.country;
    const destination = track?.w2 || trackInfo?.shipping_info?.recipient_address?.country;

    results.push({
      trackingNumber: item.number,
      carrier: carrierName,
      carrierCode,
      status,
      statusCode,
      estimatedDelivery,
      lastUpdate: events[0]?.timestamp || trackInfo?.tracking?.providers?.[0]?.latest_sync_time,
      origin,
      destination,
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
 * Get tracking info for a package
 * Assumes tracking numbers are already registered via n8n workflow
 */
export async function trackPackage(
  trackingNumber: string,
  apiKey: string
): Promise<TrackingInfo | null> {
  const { results, errors } = await getTrackingInfo([trackingNumber], apiKey);

  if (results.length > 0) {
    return results[0];
  }

  // Log error for debugging
  if (errors.length > 0) {
    console.error('17Track error for', trackingNumber, ':', errors[0].error);
  }

  return null;
}
