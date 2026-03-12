"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { FileText, Download, TrendingUp, Users, DollarSign, AlertTriangle, RotateCcw, ShoppingCart } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const reportData = {
  daily: { sales: 45280, orders: 23, returns: 2, profit: 12500 },
  monthly: { sales: 1245000, orders: 687, returns: 34, profit: 345000 },
  yearly: { sales: 14500000, orders: 8234, returns: 412, profit: 4200000 },
  lowStock: [
    { product: "Cotton Shirt", sku: "CS-001", stock: 8, reorderLevel: 20 },
    { product: "Silk Saree", sku: "SS-002", stock: 5, reorderLevel: 15 },
    { product: "Designer Kurti", sku: "DK-003", stock: 12, reorderLevel: 25 },
  ],
  topCustomers: [
    { name: "Rajesh Kumar", purchases: 67000, visits: 15 },
    { name: "Priya Sharma", purchases: 54000, visits: 12 },
    { name: "Amit Patel", purchases: 48000, visits: 10 },
  ],
  recentReturns: [
    { id: "RET-001", product: "Cotton Shirt", amount: 2540, date: "15/01/2024" },
    { id: "RET-002", product: "Silk Saree", amount: 1200, date: "14/01/2024" },
  ],
  purchaseOrders: [
    { id: "PO-001", supplier: "ABC Textiles", amount: 45000, status: "Pending" },
    { id: "PO-002", supplier: "XYZ Fabrics", amount: 68500, status: "Completed" },
  ]
};

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleExportPDF = (reportType: string) => {
    toast.success(`Exporting ${reportType} report as PDF...`);
  };

  const handleExportExcel = (reportType: string) => {
    toast.success(`Exporting ${reportType} report as Excel...`);
  };
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and download business reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Daily Sales</p>
                <p className="text-2xl font-bold mt-1">₹{reportData.daily.sales.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">{reportData.daily.orders} orders</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Sales</p>
                <p className="text-2xl font-bold mt-1">₹{reportData.monthly.sales.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">{reportData.monthly.orders} orders</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yearly Sales</p>
                <p className="text-2xl font-bold mt-1">₹{reportData.yearly.sales.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">{reportData.yearly.orders} orders</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Period</Label>
          <select className="w-full border rounded-md p-2" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>From Date</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>To Date</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Low Stock Alert ({reportData.lowStock.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportPDF('low-stock')}>
                <FileText className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportExcel('low-stock')}>
                <Download className="w-4 h-4 mr-2" /> Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Current Stock</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reorder Level</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.lowStock.map((item, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.product}</td>
                    <td className="py-3 px-4">{item.sku}</td>
                    <td className="py-3 px-4">
                      <Badge variant="destructive">{item.stock}</Badge>
                    </td>
                    <td className="py-3 px-4">{item.reorderLevel}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-orange-600">Reorder Now</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Top Customers
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportPDF('customers')}>
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportExcel('customers')}>
                  <Download className="w-4 h-4 mr-2" /> Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topCustomers.map((customer, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.visits} visits</p>
                  </div>
                  <p className="font-bold text-indigo-600">₹{customer.purchases.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-600" />
                Recent Returns
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportPDF('returns')}>
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportExcel('returns')}>
                  <Download className="w-4 h-4 mr-2" /> Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.recentReturns.map((ret, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ret.id}</p>
                    <p className="text-sm text-gray-600">{ret.product}</p>
                    <p className="text-xs text-gray-500">{ret.date}</p>
                  </div>
                  <p className="font-bold text-red-600">₹{ret.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Purchase Orders
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportPDF('purchase-orders')}>
                <FileText className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportExcel('purchase-orders')}>
                <Download className="w-4 h-4 mr-2" /> Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Supplier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.purchaseOrders.map((order, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{order.id}</td>
                    <td className="py-3 px-4">{order.supplier}</td>
                    <td className="py-3 px-4 font-medium">₹{order.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant={order.status === "Completed" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
