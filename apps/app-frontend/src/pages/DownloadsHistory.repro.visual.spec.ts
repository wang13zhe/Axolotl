import '@/test/visual-styles.scss'

import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'

import type { InstallJobSnapshot } from '@/helpers/install'

import Downloads from './Downloads.vue'

const fixture = vi.hoisted(() => ({
    manager: {} as unknown,
    instances: [] as { id: string; name: string }[],
    clipboard: vi.fn(),
    route: { query: {} as Record<string, unknown> },
}))

vi.mock('@tanstack/vue-query', async () => {
    const { ref } = await import('vue')
    return {
        queryOptions: (options: unknown) => options,
        useQuery: () => ({ data: ref(fixture.instances) }),
        useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    }
})
vi.mock('@/pages/instance/query-options', () => ({
    instanceKeys: { list: () => ['instances', 'list'] },
    instanceListQueryOptions: () => ({}),
}))
vi.mock('@/composables/use-app-event', () => ({ useAppEvent: () => {} }))

vi.mock('@/providers/download-manager', () => ({
    injectDownloadManager: () => fixture.manager,
}))

vi.mock('@modrinth/ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@modrinth/ui')>()
    const { defineComponent, h, ref } = await import('vue')
    const control = defineComponent({
        setup:
            (_, { slots }) =>
            () =>
                h('div', slots.default?.()),
    })
    return {
        ...actual,
        ...Object.fromEntries(
            [
                'Admonition',
                'BulletDivider',
                'Card',
                'Combobox',
                'ConfirmModal',
                'EmptyState',
                'NavTabs',
                'StyledInput',
                'TagItem',
            ].map((name) => [name, control]),
        ),
        Badge: defineComponent({
            setup:
                (_, { slots }) =>
                () =>
                    h('div', slots.default?.()),
        }),
        Button: defineComponent({
            setup:
                (_, { slots }) =>
                () =>
                    h('button', slots.default?.()),
        }),
        NewModal: defineComponent({
            props: ['visible'],
            setup:
                (props, { slots }) =>
            () => {
                const visible = ref(false)
                expose({
                    show: () => {
                        visible.value = true
                    },
                })
                return () =>
                    visible.value
                        ? h('section', { role: 'dialog' }, [props.header, slots.default?.()])
                        : null
            },
        }),
        Spinner: control,
        commonMessages: { retryButton: { defaultMessage: 'Retry' } },
        defineMessages: (messages: unknown) => messages,
        defineMessage: (message: unknown) => message,
        injectNotificationManager: () => ({ handleError: vi.fn() }),
        useFormatBytes: () => (value: number) => String(value),
        useVIntl: () => ({
            formatMessage: (
                message: { defaultMessage: string },
                values: Record<string, unknown> = {},
            ) =>
                message.defaultMessage.replace(/\{(\w+)\}/g, (_, key) =>
                    String(values[key] ?? `{${key}}`),
                ),
        }),
    }
})

/**
 * A finished content install, shaped like the rows the launcher writes into
 * `install_jobs` for an `install_content` job.
 */
function finishedContentInstall(): InstallJobSnapshot {
    return {
        job_id: '73429f6c-efd1-4857-b5b7-11ec1b97c9db',
        instance_id: 'local:3ec00473-2109-43a9-9e50-3f488cb86ffe',
        instance_deleted: false,
        kind: 'install_content',
        status: 'succeeded',
        execution_mode: 'normal',
        provider: 'modrinth',
        target: { type: 'existing_instance', instance_id: 'local:3ec00473' },
        phase: 'completed',
        progress: null,
        details: { type: 'empty' },
        display: { title: 'Install resources', icon: null },
        error: null,
        rollback_error: null,
        pause_reason: null,
        upgrade_result: null,
        content_change: null,
        created: '2026-10-29T00:00:00Z',
        modified: '2026-10-29T00:01:00Z',
        finished: '2026-10-29T00:01:00Z',
        summary: null,
        items: [],
    }
}

it('the history tab lists a finished content install', async () => {
    fixture.route = reactive({ query: { tab: 'history' } as Record<string, unknown> })
    const finished = finishedContentInstall()
    fixture.manager = {
        activeJobs: ref([]),
        historyJobs: ref([finished]),
        activeCount: ref(0),
        queuedCount: ref(0),
        legacyDownloads: ref([]),
        initializationState: ref('ready'),
        pendingContentChanges: ref([]),
        start: vi.fn(),
        refresh: vi.fn(),
        clearHistory: vi.fn(),
        retryJob: vi.fn(),
        cancelJob: vi.fn(),
        dismissJob: vi.fn(),
        resumeJob: vi.fn(),
        onSyntheticCancel: vi.fn(),
        offSyntheticCancel: vi.fn(),
    }

    const wrapper = mount(Downloads, {
        attachTo: document.body,
        global: { directives: { tooltip: () => {} } },
    })
    await nextTick()
    await nextTick()

    const text = wrapper.text()
    expect(text).not.toContain('No download history')
    expect(text).toContain('Install resources')
})
