import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import DeclarationItemsTable from "./declaration-items-table";
import { DeclarationItem } from "./declaration-items-table";

interface OutboundItemsSectionProps {
  items: DeclarationItem[];
  updateItem: (id: string, field: keyof DeclarationItem, value: string) => void;
  removeItem: (id: string) => void;
  addItem: () => void;
}

export default function OutboundItemsSection({ 
  items, 
  updateItem, 
  removeItem, 
  addItem 
}: OutboundItemsSectionProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Outbound Declaration Items</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Import functionality would go here
              // For now, we'll just show a toast
              alert("Import functionality not implemented yet");
            }}
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </span>
            Import Items
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={addItem}
          >
            <span className="mr-2">+</span>
            Add Item
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          {items.length > 1 && (
            <div className="flex space-x-2 items-center">
              <span className="text-sm text-gray-500">{items.length} items</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(items[items.length - 1].id)}
              >
                <Trash2 className="h-4 w-4 text-red-500 mr-2" />
                Remove Last
              </Button>
            </div>
          )}
        </div>
        
        <DeclarationItemsTable 
          items={items}
          updateItem={updateItem}
        />
      </div>
    </div>
  );
}