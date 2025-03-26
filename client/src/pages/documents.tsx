import { Button } from "@/components/ui/button";

export default function Documents() {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="mt-1 text-sm text-gray-500">Store and organize your compliance documentation</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button>
            <i className="fas fa-upload mr-2"></i>
            Upload Document
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <i className="fas fa-file-alt text-5xl text-gray-300 mb-4"></i>
        <h2 className="text-lg font-medium text-gray-900">Document Repository</h2>
        <p className="text-gray-500 mt-2 mb-6">This page is under construction</p>
        <Button variant="outline">Explore Dashboard</Button>
      </div>
    </div>
  );
}
