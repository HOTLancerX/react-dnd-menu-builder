"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react"
import type { MenuItem, DragInfo } from "../types/menu"

const initialMenuItems: MenuItem[] = [
  { id: "1", title: "Home" },
  {
    id: "2",
    title: "Collections",
    children: [
      { id: "2-1", title: "Spring" },
      { id: "2-2", title: "Summer" },
      { id: "2-3", title: "Fall" },
      { id: "2-4", title: "Winter" },
    ],
  },
  { id: "3", title: "About Us" },
  {
    id: "4",
    title: "My Account",
    children: [
      { id: "4-1", title: "Addresses" },
      { id: "4-2", title: "Order History" },
    ],
  },
]

const MAX_LEVELS = 10

export function MenuBuilder() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [draggedItem, setDraggedItem] = useState<DragInfo | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: "before" | "after" | "inside" } | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const findMenuItem = (items: MenuItem[], id: string): [MenuItem | null, MenuItem[] | null, number] => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        return [items[i], items, i]
      }
      if (items[i].children) {
        const [found, parent, index] = findMenuItem(items[i].children!, id)
        if (found) {
          return [found, parent, index]
        }
      }
    }
    return [null, null, -1]
  }

  const removeMenuItem = (items: MenuItem[], id: string): MenuItem[] => {
    return items.filter((item) => {
      if (item.id === id) {
        return false
      }
      if (item.children) {
        item.children = removeMenuItem(item.children, id)
      }
      return true
    })
  }

  const handleDragStart = (e: React.DragEvent, id: string, parentId: string | null, index: number) => {
    setDraggedItem({ id, parentId, index })
    e.dataTransfer.setData("text/plain", "") // Required for Firefox
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === id) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    // Determine drop position based on mouse position
    if (y < height * 0.25) {
      setDropTarget({ id, position: "before" })
    } else if (y > height * 0.75) {
      setDropTarget({ id, position: "after" })
    } else {
      setDropTarget({ id, position: "inside" })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (!draggedItem || !dropTarget) {
      setDraggedItem(null)
      setDropTarget(null)
      return
    }

    const [draggedNode] = findMenuItem(menuItems, draggedItem.id)
    if (!draggedNode) return

    let newItems = [...menuItems]

    // Remove the dragged item from its original position
    newItems = removeMenuItem(newItems, draggedItem.id)

    // Insert the dragged item in its new position
    const insertItem = (
      items: MenuItem[],
      targetId: string,
      position: "before" | "after" | "inside",
      currentLevel = 0,
    ): MenuItem[] => {
      return items.flatMap((item) => {
        if (item.id === targetId) {
          if (position === "before") {
            return [draggedNode, item]
          } else if (position === "after") {
            return [item, draggedNode]
          } else if (position === "inside" && currentLevel < MAX_LEVELS) {
            return {
              ...item,
              children: [...(item.children || []), draggedNode],
            }
          }
        }
        if (item.children) {
          const newChildren = insertItem(item.children, targetId, position, currentLevel + 1)
          if (newChildren !== item.children) {
            return { ...item, children: newChildren }
          }
        }
        return item
      })
    }

    newItems = insertItem(newItems, dropTarget.id, dropTarget.position, 1)

    setMenuItems(newItems)
    setDraggedItem(null)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDropTarget(null)
  }

  const renderMenuItem = (item: MenuItem, parentId: string | null = null, index = 0, level = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const isDropTarget = dropTarget?.id === item.id

    return (
      <div key={item.id} className="w-full">
        <div
          draggable="true"
          onDragStart={(e) => handleDragStart(e, item.id, parentId, index)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          className={`
            relative flex items-center gap-2 p-3 border bg-white cursor-move
            ${level > 0 ? `ml-${Math.min(level, 10) * 4}` : ""}
            ${isDropTarget && dropTarget.position === "inside" ? "border-blue-500" : "border-gray-200"}
            ${draggedItem?.id === item.id ? "opacity-50" : ""}
          `}
        >
          {/* Drop indicators */}
          {isDropTarget && dropTarget.position === "before" && (
            <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500" />
          )}
          {isDropTarget && dropTarget.position === "after" && (
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500" />
          )}

          <GripVertical className="h-4 w-4 text-gray-400" />

          {item.children && item.children.length > 0 && (
            <button onClick={() => toggleExpand(item.id)} className="p-1 hover:bg-gray-100 rounded">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          <span className="flex-1">{item.title}</span>

          {level > 0 && <span className="text-sm text-gray-500 italic">Level {level}</span>}
        </div>

        {item.children && item.children.length > 0 && isExpanded && (
          <div className="mt-1">
            {item.children.map((child, idx) => renderMenuItem(child, item.id, idx, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const addNewMenu = () => {
    const newId = `menu-${Date.now()}`
    setMenuItems((prev) => [...prev, { id: newId, title: "New Menu" }])
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <button
        onClick={addNewMenu}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Add Menu
      </button>
      <div className="space-y-1">{menuItems.map((item, index) => renderMenuItem(item, null, index))}</div>
    </div>
  )
}

