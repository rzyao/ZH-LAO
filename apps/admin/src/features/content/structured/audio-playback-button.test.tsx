import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioPlaybackButton, TableAudioPlaybackProvider } from './audio-playback-button'

class AudioMock {
  paused = true
  readonly play = vi.fn(async () => { this.paused = false })
  readonly pause = vi.fn(() => { this.paused = true })
  addEventListener = vi.fn()
}

const playable = {
  status: 'available' as const,
  playback: { url: 'https://delivery.example/audio', expires_at: '2099-01-02T00:05:00.000Z', content_type: 'audio/mpeg' },
}

afterEach(() => vi.unstubAllGlobals())

describe('AudioPlaybackButton', () => {
  it('shows text controls and stops the first row before playing another row', async () => {
    const first = new AudioMock()
    const second = new AudioMock()
    const instances = [first, second]
    class AudioFactory {
      constructor() { return instances.shift() as never }
    }
    vi.stubGlobal('Audio', AudioFactory)
    const user = userEvent.setup()
    render(<TableAudioPlaybackProvider visibleRowIds={['a', 'b']}>
      <AudioPlaybackButton audio={playable} label="甲" rowId="a" />
      <AudioPlaybackButton audio={playable} label="乙" rowId="b" />
    </TableAudioPlaybackProvider>)

    await user.click(screen.getByRole('button', { name: '播放 甲音频' }))
    expect(await screen.findByRole('button', { name: '暂停 甲音频' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: '播放 乙音频' }))
    expect(first.pause).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: '暂停 乙音频' })).toBeVisible()
  })

  it('distinguishes unavailable and intentionally no-audio rows', () => {
    render(<TableAudioPlaybackProvider visibleRowIds={['a', 'b']}>
      <AudioPlaybackButton audio={{ status: 'unavailable' }} label="甲" rowId="a" />
      <AudioPlaybackButton audio={{ status: 'no_audio' }} label="乙" rowId="b" />
    </TableAudioPlaybackProvider>)
    expect(screen.getByText('暂无音频')).toBeVisible()
    expect(screen.getByText('无音频')).toBeVisible()
  })
})
