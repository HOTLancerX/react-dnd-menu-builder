export interface MenuItem {
  id: string
  title: string
  children?: MenuItem[]
  isExpanded?: boolean
}

export interface DragInfo {
  id: string
  parentId: string | null
  index: number
}

