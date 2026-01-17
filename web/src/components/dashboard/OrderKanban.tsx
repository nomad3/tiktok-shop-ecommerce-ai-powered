"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { OrderCard } from "./OrderCard";
import clsx from "clsx";

interface Order {
  id: number;
  product_name: string | null;
  email: string;
  amount_cents: number;
  status: string;
  created_at: string;
  shipping_address?: string;
  stripe_session_id?: string;
}

interface Column {
  id: string;
  title: string;
  statuses: string[];
  color: string;
}

const columns: Column[] = [
  { id: "new", title: "New", statuses: ["paid"], color: "bg-blue-500" },
  { id: "processing", title: "Processing", statuses: ["processing"], color: "bg-yellow-500" },
  { id: "shipped", title: "Shipped", statuses: ["shipped"], color: "bg-purple-500" },
  { id: "delivered", title: "Delivered", statuses: ["delivered", "fulfilled"], color: "bg-green-500" },
];

interface OrderKanbanProps {
  orders: Order[];
  onStatusChange: (orderId: number, newStatus: string) => void;
  onViewDetails: (order: Order) => void;
  loading?: boolean;
}

export function OrderKanban({
  orders,
  onStatusChange,
  onViewDetails,
  loading,
}: OrderKanbanProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getOrdersForColumn = (column: Column) => {
    return orders.filter((order) => column.statuses.includes(order.status));
  };

  const findColumnByStatus = (status: string) => {
    return columns.find((col) => col.statuses.includes(status));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeOrder = orders.find((o) => o.id === active.id);
    if (!activeOrder) {
      setActiveId(null);
      return;
    }

    // Find which column it was dropped on
    const overId = over.id as string;
    let targetColumn: Column | undefined;

    // Check if dropped on a column
    targetColumn = columns.find((col) => col.id === overId);

    // If not, check if dropped on another order and get its column
    if (!targetColumn) {
      const overOrder = orders.find((o) => o.id === over.id);
      if (overOrder) {
        targetColumn = findColumnByStatus(overOrder.status);
      }
    }

    if (targetColumn) {
      const currentColumn = findColumnByStatus(activeOrder.status);
      if (currentColumn?.id !== targetColumn.id) {
        // Map column to status
        const statusMap: Record<string, string> = {
          new: "paid",
          processing: "processing",
          shipped: "shipped",
          delivered: "delivered",
        };
        const newStatus = statusMap[targetColumn.id] || targetColumn.statuses[0];
        onStatusChange(activeOrder.id, newStatus);
      }
    }

    setActiveId(null);
  };

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnOrders = getOrdersForColumn(column);
          return (
            <div
              key={column.id}
              className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-tiktok-gray">
                <div className="flex items-center gap-3">
                  <div className={clsx("w-3 h-3 rounded-full", column.color)} />
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <span className="ml-auto text-sm text-gray-400 bg-tiktok-gray px-2 py-0.5 rounded">
                    {columnOrders.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-3 min-h-[200px] max-h-[600px] overflow-y-auto">
                <SortableContext
                  items={columnOrders.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {columnOrders.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 text-sm">
                        No orders
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onViewDetails={onViewDetails}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeOrder ? (
          <div className="bg-tiktok-gray rounded-lg p-4 shadow-xl opacity-90">
            <span className="text-white font-medium">#{activeOrder.id}</span>
            <p className="text-gray-300 text-sm mt-1">
              {activeOrder.product_name}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
