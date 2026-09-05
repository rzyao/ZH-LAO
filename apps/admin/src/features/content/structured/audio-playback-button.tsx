import * as React from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToastContext } from '@/components/feedback/toast-context'

export type AdminAudio =
  | { status: 'available'; playback: { url: string; expires_at: string; content_type: string } }
  | { status: 'unavailable' }
  | { status: 'no_audio' }

type PlaybackController = { activeRowId: string | null; play: (rowId: string, url: string, onFailure: () => void) => Promise<void>; stop: () => void }
const PlaybackContext = React.createContext<PlaybackController | null>(null)

export function TableAudioPlaybackProvider({ visibleRowIds, children }: { visibleRowIds: readonly string[]; children: React.ReactNode }) {
  const player = React.useRef<HTMLAudioElement | null>(null)
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null)
  const stop = React.useCallback(() => { player.current?.pause(); player.current = null; setActiveRowId(null) }, [])
  React.useEffect(() => () => { player.current?.pause() }, [])
  React.useEffect(() => { if (activeRowId && !visibleRowIds.includes(activeRowId)) stop() }, [activeRowId, stop, visibleRowIds])
  const play = React.useCallback(async (rowId: string, url: string, onFailure: () => void) => {
    if (activeRowId === rowId && player.current && !player.current.paused) { stop(); return }
    player.current?.pause()
    const next = new Audio(url)
    player.current = next
    next.addEventListener('ended', stop, { once: true })
    next.addEventListener('error', () => { stop(); onFailure() }, { once: true })
    try { await next.play(); setActiveRowId(rowId) } catch { stop(); onFailure() }
  }, [activeRowId, stop])
  return <PlaybackContext.Provider value={{ activeRowId, play, stop }}>{children}</PlaybackContext.Provider>
}

export function AudioPlaybackButton({ audio, label, rowId }: { audio?: AdminAudio; label: string; rowId: string }) {
  const playback = React.useContext(PlaybackContext)
  const toastContext = React.useContext(ToastContext)
  const [error, setError] = React.useState<string | null>(null)
  if (!audio || audio.status === 'unavailable') return <span className="text-muted-foreground">暂无音频</span>
  if (audio.status === 'no_audio') return <span className="text-muted-foreground">无音频</span>
  const expired = Date.parse(audio.playback.expires_at) <= Date.now()
  const playing = playback?.activeRowId === rowId
  const toggle = () => {
    if (expired) { const message = '播放链接已过期，请刷新列表后重试。'; setError(message); toastContext?.toast({ title: '播放失败', description: message, variant: 'danger' }); return }
    if (!playback) { const message = '播放控件尚未就绪，请刷新列表后重试。'; setError(message); toastContext?.toast({ title: '播放失败', description: message, variant: 'danger' }); return }
    setError(null)
    void playback.play(rowId, audio.playback.url, () => { const message = '音频无法播放，请重试。'; setError(message); toastContext?.toast({ title: '播放失败', description: message, variant: 'danger' }) })
  }
  return <div className="flex items-center gap-1"><Button aria-label={`${playing ? '暂停' : '播放'} ${label}音频`} size="sm" variant="ghost" onClick={toggle}>
    {playing ? <Pause aria-hidden /> : <Play aria-hidden />}{playing ? '暂停' : '播放'}
  </Button>{error ? <span className="sr-only" role="alert">{error}</span> : null}</div>
}
