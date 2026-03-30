"use client";
import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, GripVertical, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchAllSizeMasters,
  fetchSizeMasterList,
  createSizeMaster,
  updateSizeMaster,
  deleteSizeMaster,
  reorderSizeMasters,
} from "@/redux/slices/sizeMasterSlice";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type DragItem = {
  id: string;
  index: number;
};

function SortableSizeRow({
  item,
  index,
  moveRow,
  onEdit,
  onDelete,
}: {
  item: any;
  index: number;
  moveRow: (fromIndex: number, toIndex: number) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem, void, unknown>(
    {
      accept: "SIZE_ROW",
      hover(dragItem, monitor) {
        if (!ref.current) return;
        const dragIndex = dragItem.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;

        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

        moveRow(dragIndex, hoverIndex);
        dragItem.index = hoverIndex;
      },
    },
    [index, moveRow]
  );

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "SIZE_ROW",
      item: { id: item._id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item, index]
  );

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="cursor-grab text-gray-400">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
        <p className="text-xs text-gray-500">{item.description || "No description"}</p>
      </div>
      <div className="text-sm font-medium text-gray-600 w-12 text-right">{item.order ?? "-"}</div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item)}
          className="h-9 w-9 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item._id)}
          className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function SizeMaster() {
  const dispatch = useAppDispatch();
  const { listItems, loading, pagination } = useAppSelector((state) => state.sizeMaster);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [search, setSearch] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    dispatch(fetchAllSizeMasters({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  useEffect(() => {
    dispatch(fetchSizeMasterList());
  }, [dispatch]);

  useEffect(() => {
    setOrderItems(listItems);
  }, [listItems]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllSizeMasters({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingSize(null);
    setFormData({ name: "", description: "" });
    setIsOpen(true);
  };

  const handleEdit = (size: any) => {
    setEditingSize(size);
    setFormData({ name: size.name, description: size.description });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingSize) {
        await dispatch(updateSizeMaster({ id: editingSize._id, data: formData })).unwrap();
        toast.success("Size updated!");
      } else {
        await dispatch(createSizeMaster(formData)).unwrap();
        toast.success("Size added!");
      }
      setIsOpen(false);
      dispatch(fetchAllSizeMasters({ page: pagination.currentPage, limit: 10, search }));
      dispatch(fetchSizeMasterList());
    } catch (err: any) {
      toast.error(err.message || "Failed to save size");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this size?")) {
      try {
        await dispatch(deleteSizeMaster(id)).unwrap();
        toast.success("Size deleted!");
        dispatch(fetchAllSizeMasters({ page: pagination.currentPage, limit: 10, search }));
        dispatch(fetchSizeMasterList());
      } catch (err: any) {
        toast.error(err.message || "Failed to delete size");
      }
    }
  };

  const moveOrderItem = (fromIndex: number, toIndex: number) => {
    setOrderItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);
      await dispatch(reorderSizeMasters(orderItems.map((item) => item._id))).unwrap();
      toast.success("Order saved successfully!");
      dispatch(fetchAllSizeMasters({ page: pagination.currentPage, limit: 10, search }));
      dispatch(fetchSizeMasterList());
    } catch (err: any) {
      toast.error(err.message || "Failed to save order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Size Master</h1>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Size
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Reorder Sizes</h2>
            <p className="text-sm text-gray-500">Drag and drop the size items below to save backend order.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleSaveOrder}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isSavingOrder || orderItems.length === 0}
            >
              {isSavingOrder ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </div>

        <DndProvider backend={HTML5Backend}>
          <div className="space-y-2">
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => (
                <SortableSizeRow
                  key={item._id}
                  item={item}
                  index={index}
                  moveRow={moveOrderItem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No sizes available to reorder.
              </div>
            )}
          </div>
        </DndProvider>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSize ? "Edit Size" : "Add New Size"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Size Name</Label>
              <Input
                placeholder="e.g., XL, 38, 42"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="e.g., Extra Large"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingSize ? "Update" : "Add"} Size
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
