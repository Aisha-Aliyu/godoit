import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";
import styles from "./SortableTaskCard.module.css";

export default function SortableTaskCard({ task, onClick, onUpdate, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 99 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.wrapper}>
      {/* Drag handle */}
      <button
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        title="Drag to reorder"
      >
        ⠿
      </button>
      <div className={styles.cardWrapper}>
        <TaskCard task={task} onClick={onClick} onUpdate={onUpdate} onDelete={onDelete} />
      </div>
    </div>
  );
}
