import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface DeclarationItem {
  id: string;
  hsnCode: string;
  productName: string;
  quantity: string;
  unit: string;
  rmId?: string; // Outbound Batch ID
  skuCode?: string; // SKU Code
}

interface DeclarationItemsTableProps {
  items: DeclarationItem[];
  updateItem: (id: string, field: keyof DeclarationItem, value: string) => void;
}

export default function DeclarationItemsTable({ items, updateItem }: DeclarationItemsTableProps) {
  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-2 text-left text-sm font-medium">HSN Code <span className="text-red-500">*</span></th>
            <th className="px-4 py-2 text-left text-sm font-medium">Outbound Batch ID</th>
            <th className="px-4 py-2 text-left text-sm font-medium">SKU Code</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Product Name <span className="text-red-500">*</span></th>
            <th className="px-4 py-2 text-left text-sm font-medium">Quantity <span className="text-red-500">*</span></th>
            <th className="px-4 py-2 text-left text-sm font-medium">Unit</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td className="px-4 py-2">
                <Input
                  id={`hsn-code-${item.id}`}
                  placeholder="e.g. 1511.10.00"
                  value={item.hsnCode}
                  onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                />
              </td>
              <td className="px-4 py-2">
                <Input
                  id={`rm-id-${item.id}`}
                  placeholder="e.g. OB12345"
                  value={item.rmId || ''}
                  onChange={(e) => updateItem(item.id, 'rmId', e.target.value)}
                />
              </td>
              <td className="px-4 py-2">
                <Input
                  id={`sku-code-${item.id}`}
                  placeholder="e.g. SKU-12345"
                  value={item.skuCode || ''}
                  onChange={(e) => updateItem(item.id, 'skuCode', e.target.value)}
                />
              </td>
              <td className="px-4 py-2">
                <Input
                  id={`product-name-${item.id}`}
                  placeholder="e.g. Palm Oil"
                  value={item.productName}
                  onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                />
              </td>
              <td className="px-4 py-2">
                <Input
                  id={`quantity-${item.id}`}
                  type="text"
                  placeholder="e.g. 5000"
                  value={item.quantity}
                  onChange={(e) => {
                    // Only allow numeric input with decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    updateItem(item.id, 'quantity', value);
                  }}
                />
              </td>
              <td className="px-4 py-2">
                <Select
                  value={item.unit}
                  onValueChange={(value) => updateItem(item.id, 'unit', value)}
                >
                  <SelectTrigger id={`unit-${item.id}`}>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ton">ton</SelectItem>
                    <SelectItem value="liters">liters</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                    <SelectItem value="pieces">pieces</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}