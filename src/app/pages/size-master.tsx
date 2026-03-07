"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllSizeMasters, createSizeMaster, updateSizeMaster, deleteSizeMaster } from "@/redux/slices/sizeMasterSlice";

export function SizeMaster() {
  const dispatch = useAppDispatch();
  const { sizeMasters, loading } = useAppSelector((state) => state.sizeMaster);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    dispatch(fetchAllSizeMasters());
  }, [dispatch]);

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
    } catch (err: any) {
      toast.error(err.message || "Failed to save size");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteSizeMaster(id)).unwrap();
      toast.success("Size deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete size");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Size Master</h1>
          <p className="text-gray-600 mt-1">Manage product sizes</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Size
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sizeMasters.map((size: any) => (
          <Card key={size._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{size.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{size.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button onClick={() => handleEdit(size)} variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(size._id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSize ? "Edit Size" : "Add New Size"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Size Name</Label>
              <Input placeholder="e.g., XL, 38, 42" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input placeholder="e.g., Extra Large" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
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
