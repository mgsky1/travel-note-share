import type { GuideDetail, GuideMarker, MarkerKind } from './types'

/** 生产环境直连后端；开发环境走 Vite 代理规避 CORS */
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'https://api.travel-note.acmsmu.cn'

// MARK: - 后端响应模型（与 iOS NoteAPI.swift 对齐）

interface APIEnvelope<T> {
  code: number
  message?: string | null
  data?: T | null
}

/** 对应后端 TravalNoteModel / iOS NoteDetail */
interface NoteDetailResponse {
  tripId?: number | null
  title?: string | null
  subTitle?: string | null
  remark?: string | null
  city?: string | null
  province?: string | null
  markers?: MarkerResponse[] | null
}

interface MarkerResponse {
  name?: string | null
  kind?: string | null
  longitude?: string | null
  latitude?: string | null
  day?: number | null
  desc?: string | null
  picUrl?: string | null
  ranking?: string | null
  sortIndex?: number | null
}

// MARK: - 请求

/** GET /get/{darkCode}：按分享暗码拉取攻略详情 */
export async function fetchGuideByDarkCode(darkCode: string): Promise<GuideDetail> {
  const res = await fetch(`${API_BASE}/get/${encodeURIComponent(darkCode)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`请求失败（HTTP ${res.status}）`)
  }

  let envelope: APIEnvelope<NoteDetailResponse>
  try {
    envelope = await res.json()
  } catch {
    throw new Error('响应解析失败')
  }
  if (envelope.code !== 200) {
    throw new Error(envelope.message?.trim() || '攻略不存在或已过期')
  }
  const data = envelope.data
  if (!data) {
    throw new Error('攻略数据为空')
  }

  return {
    title: nonEmpty(data.title) ?? '旅行攻略',
    subTitle: nonEmpty(data.subTitle) ?? '',
    city: nonEmpty(data.city) ?? '',
    markers: (data.markers ?? [])
      .map(toGuideMarker)
      .filter((m): m is GuideMarker => m !== null),
  }
}

// MARK: - 映射

/** 只保留带有效坐标的标记，无坐标无法打点（对齐 iOS located 过滤逻辑） */
function toGuideMarker(raw: MarkerResponse, index: number): GuideMarker | null {
  const lng = Number(raw.longitude)
  const lat = Number(raw.latitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null

  const name = nonEmpty(raw.name)
  if (!name) return null

  return {
    id: `${raw.sortIndex ?? index}-${name}`,
    name,
    kind: toKind(raw.kind),
    rating: nonEmpty(raw.ranking),
    day: Math.min(Math.max(raw.day ?? 1, 1), 10),
    desc: nonEmpty(raw.desc) ?? '暂无简介',
    image: nonEmpty(raw.picUrl),
    position: [lng, lat],
  }
}

function toKind(raw: string | null | undefined): MarkerKind {
  switch (raw) {
    case 'food':
    case 'hotel':
    case 'other':
      return raw
    default:
      return 'attraction'
  }
}

function nonEmpty(raw?: string | null): string | undefined {
  const v = raw?.trim()
  return v ? v : undefined
}

// MARK: - URL 入参

/** 从 URL 中取 darkCode：支持 ?darkCode=xxx 与 /{darkCode} 路径两种形式 */
export function darkCodeFromLocation(loc: Location = window.location): string | null {
  const fromQuery = new URLSearchParams(loc.search).get('darkCode')?.trim()
  if (fromQuery) return fromQuery

  const segment = loc.pathname.replace(/\/+$/, '').split('/').pop()?.trim()
  if (segment && segment !== 'index.html') return decodeURIComponent(segment)

  return null
}
