import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  FaUserCircle, 
  FaSave, 
  FaUpload, 
  FaTrashAlt, 
  FaSpinner, 
  FaLock, 
  FaCopy, 
  FaPlus, 
  FaEye, 
  FaPencilAlt, 
  FaCalendarAlt, 
  FaUsers, 
  FaFileAlt 
} from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    fullName: user?.fullName || "",
    avatar: user?.avatar || "",
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    mobile: false,
    compliance: true,
    riskAlerts: true,
    documentExpiry: true,
    supplierUpdates: false,
    weeklyReports: true,
  });
  
  // API settings
  const [apiSettings, setApiSettings] = useState({
    apiEnabled: false,
    apiKey: "••••••••••••••••••••••••••••••",
    accessLevel: "read_only",
  });
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: "light",
    sidebarCompact: false,
    showMetrics: true,
    dateFormat: "MM/DD/YYYY",
    language: "en",
  });
  
  // Questionnaire state
  const [questionnaires, setQuestionnaires] = useState([
    {
      id: 1,
      name: "Supplier Assessment Form",
      lastUpdated: "Jan 15, 2023",
      supplierType: "Farmer",
      active: true,
    },
    {
      id: 2,
      name: "Trader Evaluation Form",
      lastUpdated: "Jan 10, 2023",
      supplierType: "Trader",
      active: false,
    }
  ]);
  
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    }, 1000);
  };
  
  const handleGenerateApiKey = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setApiSettings({
        ...apiSettings,
        apiKey: "eu7xk3tpsqm2z8n9v4rj5fblage6hw",
        apiEnabled: true,
      });
      
      toast({
        title: "API Key Generated",
        description: "Your new API key has been generated successfully.",
      });
    }, 1000);
  };
  
  const handleRevokeApiKey = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setApiSettings({
        ...apiSettings,
        apiKey: "••••••••••••••••••••••••••••••",
        apiEnabled: false,
      });
      
      toast({
        title: "API Key Revoked",
        description: "Your API key has been revoked successfully.",
      });
    }, 1000);
  };
  
  const handleSaveSettings = (settingType: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: `${settingType} settings saved`,
        description: `Your ${settingType.toLowerCase()} settings have been updated successfully.`,
      });
    }, 1000);
  };
  
  // Functions for questionnaire management
  const handleAddQuestionnaire = () => {
    setShowQuestionnaireModal(true);
  };
  
  const handleToggleActive = (id: number, newState: boolean) => {
    setQuestionnaires(
      questionnaires.map(q => 
        q.id === id ? { ...q, active: newState } : q
      )
    );
    
    toast({
      title: newState ? "Questionnaire Activated" : "Questionnaire Deactivated",
      description: `The questionnaire has been ${newState ? "activated" : "deactivated"} successfully.`,
    });
  };
  
  const handleChooseTemplate = () => {
    setShowQuestionnaireModal(false);
    setShowTemplateModal(true);
  };
  
  const handleDraftFromScratch = () => {
    setShowQuestionnaireModal(false);
    toast({
      title: "Form Builder Opened",
      description: "You can now create your questionnaire from scratch.",
    });
  };
  
  const handleDeleteQuestionnaire = (id: number) => {
    if (window.confirm("Are you sure you want to delete this questionnaire?")) {
      setQuestionnaires(questionnaires.filter(q => q.id !== id));
      toast({
        title: "Questionnaire Deleted",
        description: "The questionnaire has been deleted successfully.",
      });
    }
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account and application preferences</p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Access</TabsTrigger>
          <TabsTrigger value="display">Display & Language</TabsTrigger>
          <TabsTrigger value="questionnaires">Questionnaire Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information and email address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <FaSpinner className="mr-2 animate-spin" />
                        ) : (
                          <FaSave className="mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    Upload a new profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user?.avatar} alt={user?.fullName || user?.username} />
                    <AvatarFallback className="text-lg">
                      {user?.fullName ? getInitials(user.fullName) : user?.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col w-full space-y-2">
                    <Button variant="outline" className="w-full">
                      <i className="fas fa-upload mr-2"></i>
                      Upload
                    </Button>
                    <Button variant="outline" className="w-full" disabled={!user?.avatar}>
                      <i className="fas fa-trash-alt mr-2"></i>
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    
                    <Button className="w-full">
                      <i className="fas fa-lock mr-2"></i>
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  <p className="text-sm text-gray-500 mb-4">Select your preferred notification channels</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch 
                        checked={notifications.email} 
                        onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Browser Notifications</Label>
                        <p className="text-sm text-gray-500">Show notifications in your browser</p>
                      </div>
                      <Switch 
                        checked={notifications.browser} 
                        onCheckedChange={(checked) => setNotifications({...notifications, browser: checked})}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Mobile Notifications</Label>
                        <p className="text-sm text-gray-500">Receive push notifications on your mobile device</p>
                      </div>
                      <Switch 
                        checked={notifications.mobile} 
                        onCheckedChange={(checked) => setNotifications({...notifications, mobile: checked})}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  <p className="text-sm text-gray-500 mb-4">Select which types of notifications you want to receive</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compliance">Compliance Status Changes</Label>
                      <Switch 
                        id="compliance" 
                        checked={notifications.compliance} 
                        onCheckedChange={(checked) => setNotifications({...notifications, compliance: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="risk">Risk Alerts</Label>
                      <Switch 
                        id="risk" 
                        checked={notifications.riskAlerts} 
                        onCheckedChange={(checked) => setNotifications({...notifications, riskAlerts: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="documents">Document Expiry Warnings</Label>
                      <Switch 
                        id="documents" 
                        checked={notifications.documentExpiry} 
                        onCheckedChange={(checked) => setNotifications({...notifications, documentExpiry: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="suppliers">Supplier Updates</Label>
                      <Switch 
                        id="suppliers" 
                        checked={notifications.supplierUpdates} 
                        onCheckedChange={(checked) => setNotifications({...notifications, supplierUpdates: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reports">Weekly Reports</Label>
                      <Switch 
                        id="reports" 
                        checked={notifications.weeklyReports} 
                        onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings("Notification")} disabled={loading}>
                    {loading ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-save mr-2"></i>
                    )}
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Access Management</CardTitle>
              <CardDescription>
                Generate and manage API keys for third-party integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">API Access</Label>
                    <p className="text-sm text-gray-500">Enable or disable API access for your account</p>
                  </div>
                  <Switch 
                    checked={apiSettings.apiEnabled} 
                    onCheckedChange={(checked) => setApiSettings({...apiSettings, apiEnabled: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex">
                      <Input 
                        id="apiKey" 
                        value={apiSettings.apiKey} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" className="ml-2" onClick={() => {
                        navigator.clipboard.writeText(apiSettings.apiKey);
                        toast({
                          title: "Copied to clipboard",
                          description: "API key has been copied to your clipboard.",
                        });
                      }}>
                        <i className="fas fa-copy"></i>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accessLevel">Access Level</Label>
                    <Select 
                      value={apiSettings.accessLevel} 
                      onValueChange={(value) => setApiSettings({...apiSettings, accessLevel: value})}
                    >
                      <SelectTrigger id="accessLevel">
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read_only">Read Only</SelectItem>
                        <SelectItem value="read_write">Read & Write</SelectItem>
                        <SelectItem value="full_access">Full Access</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Determines what operations can be performed using this API key
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Button onClick={handleGenerateApiKey} disabled={loading}>
                    {loading ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-key mr-2"></i>
                    )}
                    Generate New API Key
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleRevokeApiKey} 
                    disabled={loading || !apiSettings.apiEnabled}
                  >
                    <i className="fas fa-ban mr-2"></i>
                    Revoke API Key
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">API Documentation</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Access our API documentation to learn how to integrate with your systems
                  </p>
                  <Button variant="outline">
                    <i className="fas fa-external-link-alt mr-2"></i>
                    View API Documentation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display & Language Settings</CardTitle>
              <CardDescription>
                Customize your application appearance and localization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Application Theme</Label>
                    <Select 
                      value={displaySettings.theme} 
                      onValueChange={(value) => setDisplaySettings({...displaySettings, theme: value})}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Compact Sidebar</Label>
                      <p className="text-sm text-gray-500">Use a more compact sidebar layout</p>
                    </div>
                    <Switch 
                      checked={displaySettings.sidebarCompact} 
                      onCheckedChange={(checked) => setDisplaySettings({...displaySettings, sidebarCompact: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Show Dashboard Metrics</Label>
                      <p className="text-sm text-gray-500">Display metrics and KPIs on the dashboard</p>
                    </div>
                    <Switch 
                      checked={displaySettings.showMetrics} 
                      onCheckedChange={(checked) => setDisplaySettings({...displaySettings, showMetrics: checked})}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={displaySettings.language} 
                      onValueChange={(value) => setDisplaySettings({...displaySettings, language: value})}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select 
                      value={displaySettings.dateFormat} 
                      onValueChange={(value) => setDisplaySettings({...displaySettings, dateFormat: value})}
                    >
                      <SelectTrigger id="dateFormat">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings("Display")} disabled={loading}>
                    {loading ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-save mr-2"></i>
                    )}
                    Save Display Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questionnaires">
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Questionnaire Configuration</CardTitle>
                    <CardDescription>
                      Create and manage supplier questionnaires with ease.
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddQuestionnaire}>
                    <FaPlus className="mr-2" />
                    Add Questionnaire
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {questionnaires.map((questionnaire) => (
                    <div 
                      key={questionnaire.id} 
                      className="border rounded-lg p-5 shadow-sm relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium">{questionnaire.name}</h3>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <FaEye className="text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <FaPencilAlt className="text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteQuestionnaire(questionnaire.id)}
                          >
                            <FaTrashAlt />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaCalendarAlt className="mr-2" />
                          Last updated: {questionnaire.lastUpdated}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FaUsers className="mr-2" />
                          Supplier Type: {questionnaire.supplierType}
                        </div>
                      </div>
                      
                      <div className="absolute bottom-5 right-5 flex items-center">
                        <span className="text-sm mr-2">
                          {questionnaire.active ? 'Active' : 'Inactive'}
                        </span>
                        <Switch 
                          checked={questionnaire.active} 
                          onCheckedChange={(checked) => handleToggleActive(questionnaire.id, checked)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Add Questionnaire Modal */}
          {showQuestionnaireModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Add New Questionnaire</CardTitle>
                  <CardDescription>
                    Choose how you would like to create your questionnaire
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full py-8 text-lg" 
                    variant="outline"
                    onClick={handleDraftFromScratch}
                  >
                    <FaFileAlt className="mr-2 text-xl" />
                    Draft from Scratch
                  </Button>
                  <Button 
                    className="w-full py-8 text-lg" 
                    variant="outline"
                    onClick={handleChooseTemplate}
                  >
                    <FaCopy className="mr-2 text-xl" />
                    Choose from Template
                  </Button>
                </CardContent>
                <div className="flex justify-end p-4 border-t">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowQuestionnaireModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          )}
          
          {/* Template Selection Modal */}
          {showTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>Choose a Template</CardTitle>
                  <CardDescription>
                    Select a pre-built template to start with
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:shadow-md">
                      <h3 className="font-medium mb-2">EUDR Compliance Basic</h3>
                      <p className="text-sm text-gray-500 mb-3">Basic assessment for EUDR compliance readiness</p>
                      <div className="text-xs text-gray-400">15 questions</div>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:shadow-md">
                      <h3 className="font-medium mb-2">Supplier Due Diligence</h3>
                      <p className="text-sm text-gray-500 mb-3">Comprehensive due diligence assessment</p>
                      <div className="text-xs text-gray-400">32 questions</div>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:shadow-md">
                      <h3 className="font-medium mb-2">Environmental Impact</h3>
                      <p className="text-sm text-gray-500 mb-3">Environmental and sustainability assessment</p>
                      <div className="text-xs text-gray-400">24 questions</div>
                    </div>
                  </div>
                </CardContent>
                <div className="flex justify-end p-4 border-t">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowTemplateModal(false)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button>
                    Use Selected Template
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
