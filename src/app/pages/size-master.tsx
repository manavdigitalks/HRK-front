"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllSizeMasters, createSizeMaster, updateSizeMaster, deleteSizeMaster } from "@/redux/slices/sizeMasterSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function SizeMaster() {
  const dispatch = useAppDispatch();
  const { sizeMasters, loading, pagination } = useAppSelector((state) => state.sizeMaster);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllSizeMasters({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

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
      } catch (err: any) {
        toast.error(err.message || "Failed to delete size");
      }
    }
  };

  const columns = [
    { header: "Size Name", accessorKey: "name" },
    { header: "Description", accessorKey: "description" },
  ];

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
        <CommonDataTable
          columns={columns}
          data={sizeMasters}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
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
