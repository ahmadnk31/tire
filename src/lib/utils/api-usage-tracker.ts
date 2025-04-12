/**
 * API Usage tracking utility
 * Monitors calls to shipping provider APIs
 */

import { prisma } from '@/lib/db';

// Usage event types
export enum ApiEventType {
  RATE_QUOTE = 'RATE_QUOTE',
  CREATE_LABEL = 'CREATE_LABEL',
  TRACK_SHIPMENT = 'TRACK_SHIPMENT',
  VALIDATE_ADDRESS = 'VALIDATE_ADDRESS',
  AUTH = 'AUTH',
  OTHER = 'OTHER'
}

// Interface for usage record
export interface ApiUsageRecord {
  provider: string;
  endpoint: string;
  eventType: ApiEventType;
  success: boolean;
  latencyMs: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Create a singleton for tracking API usage
export class ApiUsageTracker {
  private static instance: ApiUsageTracker;
  private usageBuffer: ApiUsageRecord[] = [];
  private readonly bufferLimit: number = 100;
  private isFlushPending: boolean = false;
  private readonly isBrowser = typeof window !== 'undefined';
  
  private constructor() {
    // Set up periodic flushing (every 5 minutes)
    if (!this.isBrowser) {
      setInterval(() => this.flush(), 5 * 60 * 1000);
    }
  }
  
  public static getInstance(): ApiUsageTracker {
    if (!ApiUsageTracker.instance) {
      ApiUsageTracker.instance = new ApiUsageTracker();
    }
    return ApiUsageTracker.instance;
  }
  
  /**
   * Track API usage
   * @param record Usage record details
   */
  public trackUsage(record: ApiUsageRecord): void {
    // Don't track in browser context
    if (this.isBrowser) return;
    
    this.usageBuffer.push(record);
    
    // Flush if buffer is getting full
    if (this.usageBuffer.length >= this.bufferLimit && !this.isFlushPending) {
      this.flush();
    }
  }
  
  /**
   * Track an API call with timing
   * @param provider Provider name
   * @param endpoint API endpoint
   * @param eventType Event type
   * @param callback Function to execute and time
   * @param metadata Additional metadata
   * @returns Result of callback
   */
  public async trackTiming<T>(
    provider: string,
    endpoint: string,
    eventType: ApiEventType,
    callback: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await callback();
      success = true;
      return result;
    } finally {
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      this.trackUsage({
        provider,
        endpoint,
        eventType,
        success,
        latencyMs,
        timestamp: new Date(),
        metadata
      });
    }
  }
  
  /**
   * Flush usage records to database
   */
  private async flush(): Promise<void> {
    // Don't flush in browser or if already flushing
    if (this.isBrowser || this.isFlushPending || this.usageBuffer.length === 0) {
      return;
    }
    
    this.isFlushPending = true;
    
    try {
      const records = [...this.usageBuffer];
      this.usageBuffer = [];
      
      await prisma.apiUsage.createMany({
        data: records.map(record => ({
          provider: record.provider,
          endpoint: record.endpoint,
          eventType: record.eventType,
          success: record.success,
          latencyMs: record.latencyMs,
          timestamp: record.timestamp,
          metadata: record.metadata ? JSON.stringify(record.metadata) : null
        }))
      });
    } catch (error) {
      console.error('Failed to flush API usage records:', error);
      // Add the records back to the buffer if flush failed
      this.usageBuffer = [...this.usageBuffer, ...this.usageBuffer];
      
      // Trim buffer if it gets too large to prevent memory issues
      if (this.usageBuffer.length > this.bufferLimit * 2) {
        this.usageBuffer = this.usageBuffer.slice(-this.bufferLimit);
      }
    } finally {
      this.isFlushPending = false;
    }
  }
}