/**
 * POST /api/sync_sources — Admin content sync
 */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import type { AdminSyncRequest, AdminSyncResponse } from '@/types';
import { runGuidelineSync } from '@/lib/ingestion/guideline-sync';

export async function POST(request: NextRequest) {
  try {
    const body: AdminSyncRequest = await request.json();
    const { sourceType, sourceUrl, data: _data } = body;

    // TODO: In production, authenticate admin and process sync
    const jobId = uuid();

    console.log(
      JSON.stringify({
        type: 'admin_sync',
        jobId,
        sourceType,
        sourceUrl,
        timestamp: new Date().toISOString(),
      })
    );

    if (sourceType === 'guidelines') {
      const result = await runGuidelineSync();
      const response: AdminSyncResponse = {
        jobId,
        status: 'completed',
        recordsProcessed: result.recordsProcessed,
        errors: result.errors,
      };
      return NextResponse.json(response);
    }

    const response: AdminSyncResponse = {
      jobId,
      status: 'queued',
      recordsProcessed: 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
