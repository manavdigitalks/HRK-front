"use client";
import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

const mockSizes = [
  { id: 1, name: "S", description: "Small" },
  { id: 2, name: "M", description: "Medium" },
  { id: 3, name: "L", description: "Large" },
  { id: 4, name: "XL", description: "Extra Large" },
  { id: 5, name: "XXL", description: "Double XL" },
  { id: 6, name: "Free Size", description: "One Size Fits All" },
];

export function SizeMaster() {
  const [sizes, setSizes] = useState(mockSizes);
  const [isOpen, setIsOpen] = useState(false);
  const [sizeName, setSizeName] = useState("");
  const [sizeDescription, setSizeDescription] = useState("");

  const handleAddSize = () => {
    if (sizeName) {
      setSizes([...sizes, { id: Date.now(), name: sizeName, description: sizeDescription }]);
      setSizeName("");
      setSizeDescription("");
      setIsOpen(false);
      toast.success("Size added!");
    }
  };

  const handleEditSize = (size: any) => {
    setSizeName(size.name);
    setSizeDescription(size.description);
    setIsOpen(true);
  };

  const handleDeleteSize = (id: number) => {
    setSizes(sizes.filter((size) => size.id !== id));
    toast.success("Size deleted!");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Size Master</h1>
          <p className="text-gray-600 mt-1">Manage product sizes</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Size
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Size</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="size-name">Size Name</Label>
                <Input
                  id="size-name"
                  placeholder="e.g., XL, 38, 42"
                  value={sizeName}
                  onChange={(e) => setSizeName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size-description">Description (Optional)</Label>
                <Input
                  id="size-description"
                  placeholder="e.g., Extra Large"
                  value={sizeDescription}
                  onChange={(e) => setSizeDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleAddSize} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Add Size
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sizes.map((size) => (
          <Card key={size.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{size.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{size.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button onClick={() => handleEditSize(size)} variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSize(size.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
