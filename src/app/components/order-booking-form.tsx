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
        toast.success(`${items.length} Product(s) order confirmed!`);
      }
      router.push("/order-form");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err.message || "Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden border-t">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/order-form")}
            className="rounded-full hover:bg-gray-100 transition-colors h-9 w-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {id ? "Edit Order" : "New Order Reservation"}
            </h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Inventory Hold</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="hidden sm:flex text-gray-500 border-gray-200 h-9"
            onClick={() => router.push("/order-form")}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 px-6 font-bold h-9 transition-all active:scale-95"
          >
            {loading ? "Processing..." : (id ? "Update Reservation" : "Confirm Booking")}
            <Save className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Customer Selection (30%) */}
        <div className="w-[30%] min-w-[320px] max-w-[400px] border-r bg-gray-50/30 p-6 flex flex-col gap-6 overflow-y-auto shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-700">Select Customer</Label>
            <div className="relative group">
              <Combobox
                options={customerOptions}
                value={customer}
                onChange={setCustomer}
                onSearchChange={(val) => dispatch(fetchCustomerDropdown(val))}
                placeholder="Search by name or number..."
                disabled={!!id}
              />
              <div className="mt-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-2">Customer Info</h4>
                {customer ? (
                    <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{customerOptions.find(c => c.value === customer)?.label}</p>
                        <p className="text-xs text-indigo-500 font-medium">Active Customer</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No customer selected</p>
                )}
              </div>
            </div>
          </div>

          {/* <div className="mt-auto p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <strong>Order Management:</strong> Items added to this form will be held in reservation for the selected customer until billed or cancelled.
            </p>
          </div> */}
        </div>

        {/* Right Side: Products Grid (70%) */}
        <div className="flex-1 bg-white p-6 flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-bold text-gray-900">Items List</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
              {items.length} Product{items.length !== 1 ? 's' : ''}
            </span>
            {!id && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setItems([...items, { product: "", totalSets: 1 }])}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold h-8"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center gap-2 px-1 mb-1.5">
              <span className="w-5 shrink-0"></span>
              <span className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</span>
              <span className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Sets</span>
              <span className="w-6 shrink-0"></span>
            </div>

            <div className="space-y-1.5">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <span className="text-xs font-bold text-gray-300 w-5 text-center shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
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
                      placeholder="Search product..."
                      disabled={!!id}
                    />
                  </div>

                  <div className="flex-1">
                    <Input
                      type="number"
                      min={1}
                      value={item.totalSets}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].totalSets = parseInt(e.target.value) || 0;
                        setItems(newItems);
                      }}
                      className="w-full h-9 text-center font-bold text-sm border-gray-200"
                      placeholder="0"
                    />
                  </div>

                  {!id && (
                    <button
                      className="w-6 shrink-0 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-20"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {!id && (
                <button 
                    onClick={() => setItems([...items, { product: "", totalSets: 1 }])}
                    className="w-full py-3 border border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-200 font-medium text-[13px] group mt-2"
                >
                    <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    Add Product
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
