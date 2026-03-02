"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Package, TrendingUp, ShoppingCart, AlertTriangle, DollarSign, Users, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const stats = [
  { title: "Today's Sales", value: "₹45,280", change: "+12.5%", trend: "up", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-100" },
  { title: "Total Products", value: "2,458", change: "+23 new", trend: "up", icon: Package, color: "text-blue-600", bgColor: "bg-blue-100" },
  { title: "Low Stock Alert", value: "18", change: "Needs attention", trend: "down", icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-100", alert: true },
  { title: "Total Customers", value: "1,847", change: "+24 today", trend: "up", icon: Users, color: "text-purple-600", bgColor: "bg-purple-100" },
];

const lowStockItems = [
  { product: "Cotton Shirt", sku: "CS-001", stock: 8, reorderLevel: 20 },
  { product: "Silk Saree", sku: "SS-002", stock: 5, reorderLevel: 15 },
  { product: "Designer Kurti", sku: "DK-003", stock: 12, reorderLevel: 25 },
];

const salesData = [
  { name: "Mon", sales: 4000, returns: 240 },
  { name: "Tue", sales: 3000, returns: 139 },
  { name: "Wed", sales: 5000, returns: 380 },
  { name: "Thu", sales: 2780, returns: 210 },
  { name: "Fri", sales: 4890, returns: 290 },
  { name: "Sat", sales: 6390, returns: 430 },
  { name: "Sun", sales: 5490, returns: 300 },
];

const categoryData = [
  { name: "Shirts", value: 35 },
  { name: "Sarees", value: 28 },
  { name: "Kurtis", value: 22 },
  { name: "Fabrics", value: 15 },
];

const recentSales = [
  { id: "INV-001", customer: "Rajesh Kumar", amount: "₹2,540", time: "1h ago" },
  { id: "INV-002", customer: "Priya Sharma", amount: "₹6,980", time: "23 min ago" },
  { id: "INV-003", customer: "Walking Customer", amount: "₹1,200", time: "45 min ago" },
  { id: "INV-004", customer: "Amit Patel", amount: "₹9,920", time: "1 hr ago" },
  { id: "INV-005", customer: "Neha Gupta", amount: "₹3,450", time: "2 hr ago" },
];

export function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={stat.alert ? "border-orange-300 border-2" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm">
                    {stat.trend === "up" ? (
                      <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-orange-600 mr-1" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-600" : "text-orange-600"}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor} ${stat.alert ? 'animate-pulse' : ''}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">{item.product}</p>
                    <p className="text-sm text-gray-600">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Stock: <span className="font-bold text-red-600">{item.stock}</span></p>
                    <p className="text-xs text-gray-500">Reorder: {item.reorderLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.customer}</p>
                    <p className="text-sm text-gray-500">{sale.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{sale.amount}</p>
                  <p className="text-sm text-gray-500">{sale.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
