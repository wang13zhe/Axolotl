import { expect, it } from 'vitest'

import {
    ACTIVE_INSTALL_JOB_STATUSES,
    isActiveInstallJobStatus,
} from './install-job-status.ts'
import type { InstallJobSnapshot } from './install.ts'

function job(overrides: Partial<InstallJobSnapshot> = {}): InstallJobSnapshot {
    return {
        job_id: 'job-1',
        instance_id: 'local:abc',
        instance_deleted: false,
        kind: 'install_content',
        status: 'succeeded',
        execution_mode: 'normal',
        provider: 'modrinth',
        target: { type: 'existing_instance', instance_id: 'local:abc' },
        phase: 'completed',
        details: { type: 'empty' },
        display: { title: 'Install resources', icon: null },
        error: null,
        rollback_error: null,
        pause_reason: null,
        upgrade_result: null,
        content_change: null,
        created: '2026-10-29T00:00:00Z',
        modified: '2026-10-29T00:00:10Z',
        finished: '2026-10-29T00:00:10Z',
        summary: null,
        items: [],
        ...overrides,
    }
}

it('a finished content install belongs to the history tab', () => {
    const finished = job({ status: 'succeeded' })
    expect(isActiveInstallJobStatus(finished.status)).toBe(false)
})

it('the statuses the launcher writes for a finished install are not active', () => {
    for (const status of ['succeeded', 'failed', 'interrupted', 'canceled'] as const) {
        expect(ACTIVE_INSTALL_JOB_STATUSES.has(status)).toBe(false)
    }
})

it('a content install shows a title, so the history row is not blank', () => {
    const finished = job()
    const title =
        finished.display?.title ||
        (finished.details.type === 'instance' ? finished.details.name : null) ||
        (finished.details.type === 'modpack' ? finished.details.title : null)
    expect(title).toBe('Install resources')
})
