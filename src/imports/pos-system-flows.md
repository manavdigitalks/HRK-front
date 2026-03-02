1️⃣ Admin Login

Admin logs into system

Dashboard access

2️⃣ Product Catalogue Setup
Flow:

Admin → Add Product → Map Sizes → Generate Barcode → Save

Steps:

Add Product Details:

Category (Shirt, Saree, Kurti, Fabric etc.)

Brand / Design Number

Color

Fabric Type

Purchase Price

Sale Price

Upload Image

Add Size Mapping:

Select Sizes (S, M, L, XL etc.)

Enter stock quantity per size

System:

Generates unique barcode for each size variant

Saves stock in inventory

👉 Result: Product ready for sale

3️⃣ Size Master Setup
Flow:

Admin → Add Size → Save

Add sizes like:

S

M

L

XL

XXL

Custom Sizes

👉 These sizes will be mapped with products.

4️⃣ User & Role Setup
Flow:

Admin → Create User → Assign Role → Save

Roles:

Admin (Full Access)

Manager

Salesman

Stock Manager

Permissions example:

Salesman → Only Billing

Stock Manager → Only Stock Entry

Manager → Reports + Orders

👉 System logs all activity.

🔹 PHASE 2: STOCK IN FLOW (Inventory Entry)
📦 Stock Purchase Entry Flow
Flow:

Stock Manager → Purchase Order Entry → Add Products → Save

Steps:

Create Purchase Entry

Select Product

Add size-wise quantity

Save

System Action:

Stock quantity increases

Entry saved in purchase history

Low stock alert recalculated

🔹 PHASE 3: SALES FLOW (STOCK OUT)
🧾 A. Billing With Registered Customer
Flow:

Salesman → New Bill → Scan Barcode → Auto Add → Payment → Print Invoice

Steps:

Select Customer (or Add new)

Scan barcode

System auto:

Fetch product

Detect size

Show price

Apply:

GST

Discount (if any)

Select Payment Mode

Generate Invoice (A4 / Thermal)

System Action:

Stock auto decrease

Sales entry recorded

Customer purchase history updated

🚶 B. Walking Customer (Quick Sale)
Flow:

Quick Bill Mode → Scan Barcode → Payment → Print

No customer registration needed.

System:

Auto stock out

Recorded as "Walking Customer"

🔹 PHASE 4: RETURN FLOW
🔁 Return Management (Barcode Based)
Flow:

Return Section → Scan Barcode → Confirm → Save

Steps:

Scan returned product barcode

System verifies:

Bill number

Date

Item match

Confirm return

Optional:

Refund

Adjust in next purchase

System Action:

Stock auto increase

Return entry recorded

Return report updated

🔹 PHASE 5: ORDER MANAGEMENT FLOW
📑 Sales Order

Flow:
Manager → Create Sales Order → Add Items → Save

Used for:

Advance booking

Future delivery

📦 Purchase Order

Flow:
Manager → Create Purchase Order → Send to Vendor

Used when:

Stock low

Restocking required

🔹 PHASE 6: REPORT FLOW

Manager/Admin → Reports Section

Available Reports:

Daily Sales Report

Monthly Report

Yearly Report

Low Stock Report

Return Report

Purchase Report

Stock Report

Customer Purchase History

Export:

PDF

Excel

🔹 DATABASE FLOW (Important for Development)
Product Structure Example:

Product
├── Category
├── Brand
├── Color
├── Fabric
├── Prices
└── Variants
├── Size
├── Barcode
├── Stock Quantity

🔹 COMPLETE USER JOURNEY FLOW (Simple View)

Admin Setup System

Add Products

Add Stock

Salesman sells product

Stock reduces

Customer return (if any)

Reports generated

Low stock → Purchase order

🔥 REAL WORLD WORKING FLOW (Daily Use)

Morning:

Stock Manager checks low stock

Creates purchase order

Day Time:

Salesman scans barcode → Billing

Walking customers → Quick bill

Evening:

Manager checks daily sales report

Admin reviews activity logs

🔐 ROLE BASED FLOW SUMMARY

Admin:

Full access

Manager:

Reports

Orders

View billing

Salesman:

Billing only

Customer add

Stock Manager:

Stock entry

Purchase entry

🎯 Final Simplified Flow Diagram (Text Version)

Setup
→ Product Add
→ Size Mapping
→ Stock Entry
→ Billing (Scan Barcode)
→ Stock Out
→ Return (If Any)
→ Reports
→ Low Stock Alert
→ Purchase Order