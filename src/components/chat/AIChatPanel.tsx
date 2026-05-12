import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { chatWithAI } from '@/lib/api'
import { useSprintStore } from '@/stores/sprint-store'
import { useNotionStore } from '@/stores/notion-store'
import { useChatStore } from '@/stores/chat-store'
import type { Story } from '@/types/sprint'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function buildContext(
  sprint: ReturnType<typeof useSprintStore.getState>['sprint'],
  testResults: ReturnType<typeof useSprintStore.getState>['testResults'],
  notionStories: ReturnType<typeof useNotionStore.getState>['stories'],
  focusedStory: Story | null,
) {
  const parts: string[] = []

  if (focusedStory) {
    parts.push(`[현재 선택된 스토리]`)
    parts.push(`ID: ${focusedStory.id}`)
    parts.push(`제목: ${focusedStory.title}`)
    parts.push(`설명: ${focusedStory.description}`)
    parts.push(`상태: ${focusedStory.status}`)
    parts.push(`우선순위: ${focusedStory.priority}`)
    parts.push(`유형: ${focusedStory.type}`)
    parts.push(`담당자: ${focusedStory.assignee}`)
    parts.push(`레포지토리: ${focusedStory.repo}`)
    parts.push(`스토리 포인트: ${focusedStory.storyPoints}`)
    parts.push(`라벨: ${focusedStory.labels.join(', ') || '없음'}`)

    const result = testResults[focusedStory.id]
    if (result) {
      parts.push(`테스트 결과: 전체 ${result.totalCases}건 | 성공 ${result.passed} | 실패 ${result.failed} | 스킵 ${result.skipped}`)
    }
    parts.push('')
  }

  if (sprint) {
    parts.push(`[스프린트 전체 현황]`)
    parts.push(`스프린트: ${sprint.name}`)
    parts.push(`기간: ${sprint.startDate} ~ ${sprint.endDate}`)
    parts.push(`목표: ${sprint.goal}`)
    parts.push(`총 스토리: ${sprint.stories.length}개`)

    const statusCounts: Record<string, number> = {}
    const typeCounts: Record<string, number> = {}
    let totalPoints = 0
    let donePoints = 0

    for (const s of sprint.stories) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
      typeCounts[s.type] = (typeCounts[s.type] || 0) + 1
      totalPoints += s.storyPoints
      if (s.status === 'done') donePoints += s.storyPoints
    }

    parts.push(`상태별: ${Object.entries(statusCounts).map(([k, v]) => `${k}=${v}`).join(', ')}`)
    parts.push(`유형별: ${Object.entries(typeCounts).map(([k, v]) => `${k}=${v}`).join(', ')}`)
    parts.push(`스토리 포인트: ${donePoints}/${totalPoints} 완료`)

    parts.push('\n스토리 목록:')
    for (const s of sprint.stories) {
      parts.push(`- [${s.id}] ${s.title} | 상태: ${s.status} | 담당: ${s.assignee} | 우선순위: ${s.priority} | SP: ${s.storyPoints} | 레포: ${s.repo}`)
    }

    // 테스트 결과 요약
    const testEntries = Object.entries(testResults)
    if (testEntries.length > 0) {
      const totalPassed = testEntries.reduce((s, [, r]) => s + r.passed, 0)
      const totalFailed = testEntries.reduce((s, [, r]) => s + r.failed, 0)
      const totalSkipped = testEntries.reduce((s, [, r]) => s + r.skipped, 0)
      parts.push(`\n테스트 결과 요약: ${testEntries.length}개 스토리 테스트 | 성공: ${totalPassed} | 실패: ${totalFailed} | 스킵: ${totalSkipped}`)
    }
  }

  if (notionStories.length > 0) {
    parts.push(`\nNotion 스토리: ${notionStories.length}개`)
    for (const s of notionStories.slice(0, 30)) {
      parts.push(`- ${s.title} | 상태: ${s.status} | 담당: ${s.assignees.join(',')} | 구분: ${s.category}`)
    }
  }

  return parts.join('\n')
}

export function AIChatPanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sprint = useSprintStore((s) => s.sprint)
  const testResults = useSprintStore((s) => s.testResults)
  const notionStories = useNotionStore((s) => s.stories)

  const isOpen = useChatStore((s) => s.isOpen)
  const setOpen = useChatStore((s) => s.setOpen)
  const focusedStory = useChatStore((s) => s.focusedStory)
  const clearFocus = useChatStore((s) => s.clearFocus)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setError(null)

    const displayText = focusedStory
      ? `[${focusedStory.id}] ${text}`
      : text

    setMessages((prev) => [...prev, { role: 'user', content: displayText }])
    setIsLoading(true)

    try {
      const context = buildContext(sprint, testResults, notionStories, focusedStory)
      const prompt = focusedStory
        ? `[${focusedStory.id}] "${focusedStory.title}" 스토리에 대한 질문: ${text}`
        : text

      const { reply } = await chatWithAI(prompt, context)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 응답을 받지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105',
          isOpen
            ? 'bg-surface-tertiary text-text-secondary'
            : 'bg-primary-600 text-white',
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[520px] w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-surface backdrop-blur-3xl shadow-2xl shadow-black/[0.08]">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">AI 어시스턴트</h3>
            <span className="text-[10px] text-text-tertiary">스프린트 데이터 기반 Q&A</span>
          </div>

          {/* Focused story indicator */}
          {focusedStory && (
            <div className="flex items-center gap-2 border-b border-border bg-primary-50 px-4 py-2 dark:bg-primary-900/20">
              <Sparkles className="h-3 w-3 text-primary-500 shrink-0" />
              <span className="flex-1 truncate text-xs text-primary-700 dark:text-primary-300">
                <span className="font-mono font-medium">{focusedStory.id}</span>{' '}
                {focusedStory.title}
              </span>
              <button
                onClick={clearFocus}
                className="shrink-0 rounded p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !focusedStory && (
              <div className="flex h-full flex-col items-center justify-center text-center text-text-tertiary">
                <Sparkles className="mb-3 h-8 w-8 text-primary-500/50" />
                <p className="text-sm font-medium text-text-secondary">무엇이든 물어보세요</p>
                <p className="mt-1 text-xs">스프린트 현황, 스토리 분석, 테스트 결과 등</p>
                <div className="mt-4 space-y-1.5">
                  {['블로킹된 스토리가 있어?', '스프린트 진행률은 어때?', '테스트 실패한 항목 요약해줘'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      className="block w-full rounded-lg bg-surface-tertiary px-3 py-2 text-xs text-text-secondary hover:bg-surface-tertiary/80 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && focusedStory && (
              <div className="flex h-full flex-col items-center justify-center text-center text-text-tertiary">
                <Sparkles className="mb-3 h-8 w-8 text-primary-500/50" />
                <p className="text-sm font-medium text-text-secondary">이 스토리에 대해 물어보세요</p>
                <p className="mt-1 text-xs font-mono">{focusedStory.id}</p>
                <div className="mt-4 space-y-1.5">
                  {[
                    '이 스토리 QA 체크리스트 만들어줘',
                    '이 스토리의 리스크는?',
                    '테스트 결과 분석해줘',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      className="block w-full rounded-lg bg-surface-tertiary px-3 py-2 text-xs text-text-secondary hover:bg-surface-tertiary/80 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary-600 text-white'
                    : 'bg-surface-tertiary text-text-primary',
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-text-tertiary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">답변 생성 중...</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={focusedStory ? `${focusedStory.id}에 대해 질문...` : '질문을 입력하세요...'}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none"
                style={{ maxHeight: 100 }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 100) + 'px'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                  input.trim() && !isLoading
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-surface-tertiary text-text-tertiary',
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
