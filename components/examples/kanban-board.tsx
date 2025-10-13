import { KanbanBoard } from "../kanban-board";

export default function KanbanBoardExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Service Requests</h2>
      <KanbanBoard />
    </div>
  );
}
