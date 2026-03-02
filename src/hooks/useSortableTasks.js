import { useState, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { reorderTasks } from "../services/taskService";

export const useSortableTasks = (initialTasks, setTasks) => {
  const [activeId, setActiveId] = useState(null);

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id);
  }, []);

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Persist new positions
      reorderTasks(reordered.map((t, i) => ({ id: t.id, position: i })));

      return reordered;
    });
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return { activeId, handleDragStart, handleDragEnd, handleDragCancel };
};
