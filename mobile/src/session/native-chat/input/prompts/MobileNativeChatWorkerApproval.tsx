import { useEffect, useState } from 'react'
import { useMobileTranslation } from '../../../../i18n/use-mobile-translation'
import { MobileNativeChatPermission } from './MobileNativeChatPermission'
import type { MobileWorkerApprovals } from './use-mobile-worker-approvals'

/** The oldest of a coordinator's workers' open prompts, as the chat's own permission card. */
export function MobileNativeChatWorkerApproval({
  approvals
}: {
  approvals: MobileWorkerApprovals
}): React.JSX.Element | null {
  const t = useMobileTranslation()
  const entry = approvals.open[0]
  const expiresAt = entry?.approval.expiresAt
  const now = useSecondClock(expiresAt !== undefined)
  if (!entry) {
    return null
  }
  const { approval } = entry
  const { title, detail, reason } = approval.summary
  const more = approvals.open.length - 1
  const left = expiresAt ? timeLeft(Date.parse(expiresAt) - now) : null
  const worker = t('chat.workerApproval.worker', 'Worker · {{name}}', { name: entry.worker.label })
  return (
    <MobileNativeChatPermission
      key={approval.approvalId}
      permission={{
        title,
        ...(reason ? { decisionReason: reason } : {}),
        ...(detail ? { detail } : {}),
        ...(left
          ? {
              description: t(
                'chat.workerApproval.countdown',
                'Claude denies it on its own in {{time}} if nobody answers.',
                { time: left }
              )
            }
          : {}),
        options: approval.allowedActions.map((decision) => ({
          label:
            decision === 'allow'
              ? t('chat.workerApproval.allow', 'Allow')
              : t('chat.workerApproval.deny', 'Deny'),
          send: decision
        }))
      }}
      subtitle={
        more > 0
          ? t('chat.workerApproval.workerAndMore', '{{worker}} · {{count}} more waiting', {
              worker,
              count: more
            })
          : worker
      }
      onRespond={(send) =>
        send === 'allow' || send === 'deny' ? approvals.answer(entry, send) : Promise.resolve(false)
      }
    />
  )
}

function timeLeft(ms: number): string | null {
  if (!Number.isFinite(ms) || ms <= 0) {
    return null
  }
  const seconds = Math.ceil(ms / 1_000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** A per-second clock, only while a countdown is shown. */
function useSecondClock(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) {
      return
    }
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(interval)
  }, [active])
  return now
}
