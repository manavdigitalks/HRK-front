"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCustomerDropdown } from "@/redux/slices/customerSlice";
import { fetchProductDropdown } from "@/redux/slices/productSlice";
import { createOrderBooking, updateOrderBooking } from "@/redux/slices/orderBookingSlice";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Combobox } from "./ui/combobox";

export function OrderBookingForm({ id, initialData }: { id?: string; initialData?: any }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { dropdownItems: customers } = useAppSelector((state) => state.customer);
  const { dropdownItems: products } = useAppSelector((state) => state.product);

  const [customer, setCustomer] = useState(initialData?.customer?._id || "");
  const [items, setItems] = useState<{product: string, totalSets: number}[]>(
    id ? [{product: initialData?.product?._id || "", totalSets: initialData?.totalSets || 1}] 
       : [{product: "", totalSets: 1}]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomerDropdown(""));
    dispatch(fetchProductDropdown(""));
  }, [dispatch]);

  const customerOptions = customers.map((c: any) => ({
    label: `${c.name} ${c.number ? `(${c.number})` : ""}`,
    value: c._id,
  }));

  const productOptions = products.map((p: any) => ({
    label: `${p.productCode} (${p.category?.name}) - Sizes: [${p.sizes?.map((s: any) => s.name).join(", ")}]`,
    value: p._id,
  }));

  const handleSave = async () => {
    if (!customer || items.some(i => !i.product || !i.totalSets)) {
      toast.error("Please fill all fields for all products");
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await dispatch(updateOrderBooking({ id, data: { totalSets: items[0].totalSets } })).unwrap();
        toast.success("Order updated!");
      } else {
        await dispatch(createOrderBooking({ customer, items })).unwrap();
        toast.success(`${items.length} Product(s) reserved!`);
      }
      router.push("/order-form");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err.message || "Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto bg-white rounded-xl border shadow-sm mt-10">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/order-form")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{id ? "Edit Order Form" : "New Order Form"}</h1>
      </div>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Select Customer</Label>
          <Combobox
            options={customerOptions}
            value={customer}
            onChange={setCustomer}
            onSearchChange={(val) => dispatch(fetchCustomerDropdown(val))}
            placeholder="Search Customer..."
            disabled={!!id}
          />
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Products</h3>
            {!id && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setItems([...items, { product: "", totalSets: 1 }])}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            )}
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50/50 space-y-4 relative">
              {!id && items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Combobox
                  options={productOptions.filter(opt => 
                    !items.some((otherItem, i) => i !== index && otherItem.product === opt.value)
                  )}
                  value={item.product}
                  onChange={(val) => {
                    const newItems = [...items];
                    newItems[index].product = val;
                    setItems(newItems);
                  }}
                  onSearchChange={(val) => dispatch(fetchProductDropdown(val))}
                  placeholder="Search Product..."
                  disabled={!!id}
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Sets (Hold Quantity)</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.totalSets}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].totalSets = parseInt(e.target.value) || 0;
                    setItems(newItems);
                  }}
                  placeholder="Enter number of sets"
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-500">Note: This will reserve available items for this customer.</p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 px-8">
          {loading ? "Saving..." : (id ? "Update Reservation" : "Confirm Reservation")}
          <Save className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
