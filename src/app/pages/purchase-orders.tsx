"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from "@/redux/slices/purchaseOrderSlice";

export function PurchaseOrders() {
  const dispatch = useAppDispatch();
  const { purchaseOrders, loading } = useAppSelector((state) => state.purchaseOrder);
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formData, setFormData] = useState({ supplier: "", items: [], totalAmount: 0, status: "Pending" });

  useEffect(() => {
    dispatch(fetchAllPurchaseOrders());
  }, [dispatch]);

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({ supplier: "", items: [], totalAmount: 0, status: "Pending" });
    setIsOpen(true);
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData({ supplier: order.supplier, items: order.items, totalAmount: order.totalAmount, status: order.status });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingOrder) {
        await dispatch(updatePurchaseOrder({ id: editingOrder._id, data: formData })).unwrap();
        toast.success("Order updated!");
      } else {
        await dispatch(createPurchaseOrder(formData)).unwrap();
        toast.success("Order created!");
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save order");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deletePurchaseOrder(id)).unwrap();
      toast.success("Order deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete order");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage supplier purchase orders</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders ({purchaseOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Supplier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order: any) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{order.supplier}</td>
                    <td className="py-3 px-4 font-medium">₹{order.totalAmount}</td>
                    <td className="py-3 px-4">
                      <Badge variant={order.status === "Completed" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(order)} variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(order._id)} variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: +e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingOrder ? "Update" : "Create"} Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
