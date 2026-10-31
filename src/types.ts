/** 标记类型（对应后端 MarkerModel.kind / iOS MarkerKind） */
export type MarkerKind = 'attraction' | 'food' | 'hotel' | 'other'

export interface GuideMarker {
  id: string
  name: string
  kind: MarkerKind
  /** 评分字符串（来自后端 ranking），可能为空 */
  rating?: string
  /** 所属游玩天数（仅用于徽标展示，1 起） */
  day: number
  /** 简介 */
  desc: string
  /** 头图 URL，可为空 */
  image?: string
  /** 高德坐标 [lng, lat] */
  position: [number, number]
}

/** 攻略详情（对后端 TravalNoteModel 的裁剪） */
export interface GuideDetail {
  title: string
  subTitle: string
  city: string
  markers: GuideMarker[]
}
