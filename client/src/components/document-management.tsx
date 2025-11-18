import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow, addMonths } from "date-fns";
import { 
  FileText, 
  Upload, 
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  File,
  FileCheck,
  Shield,
  Calendar,
  Search,
  Filter
} from "lucide-react";

interface Document {
  id: string;
  aircraft_id: string;
  type: "registration" | "insurance" | "weight_balance" | "airworthiness" | "logbook" | "manual" | "other";
  name: string;
  file_url?: string;
  expires_at?: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
  aircraft?: {
    tail_number: string;
  };
  uploader?: {
    full_name: string;
  };
}

const DOCUMENT_TYPES = {
  registration: { label: "Registration", icon: Shield, color: "bg-blue-500" },
  insurance: { label: "Insurance", icon: Shield, color: "bg-green-500" },
  weight_balance: { label: "Weight & Balance", icon: FileCheck, color: "bg-purple-500" },
  airworthiness: { label: "Airworthiness", icon: FileCheck, color: "bg-amber-500" },
  logbook: { label: "Logbook", icon: FileText, color: "bg-indigo-500" },
  manual: { label: "Manual", icon: File, color: "bg-gray-500" },
  other: { label: "Other", icon: File, color: "bg-gray-400" },
} as const;

export function DocumentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [selectedAircraftId, setSelectedAircraftId] = useState("");
  const [documentType, setDocumentType] = useState<keyof typeof DOCUMENT_TYPES>("registration");
  const [documentName, setDocumentName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Check if documents table exists
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkTableExists = async () => {
      if (!user) return;
      
      const { error } = await supabase
        .from("aircraft_documents")
        .select("id", { count: "exact", head: true })
        .limit(0);
      
      if (error?.code === "42P01") {
        console.log("⚠️ Aircraft documents table not found - feature disabled");
        setTableExists(false);
      } else {
        setTableExists(true);
      }
    };
    
    checkTableExists();
  }, [user]);

  // Return null if table doesn't exist
  if (tableExists === false) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Document management feature is not yet enabled.</p>
        <p className="text-sm mt-2">Please contact your administrator to enable this feature.</p>
      </div>
    );
  }

  // Fetch aircraft for dropdown
  const { data: aircraft = [] } = useQuery({
    queryKey: ["aircraft-for-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, tail_number")
        .order("tail_number");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && tableExists === true,
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["aircraft-documents", selectedAircraft],
    queryFn: async () => {
      let query = supabase
        .from("aircraft_documents")
        .select(`
          *,
          aircraft:aircraft_id(tail_number),
          uploader:uploaded_by(full_name)
        `)
        .order("uploaded_at", { ascending: false });
      
      if (selectedAircraft) {
        query = query.eq("aircraft_id", selectedAircraft);
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.code === "42P01") {
          // Table doesn't exist yet
          return [];
        }
        console.warn("Error fetching documents:", error);
        return [];
      }
      
      return data as Document[];
    },
    enabled: !!user && tableExists === true,
  });

  // Filter documents based on search and status
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === "" || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.aircraft?.tail_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      DOCUMENT_TYPES[doc.type].label.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Group documents by status
  const expiredDocuments = filteredDocuments.filter(doc => 
    doc.expires_at && new Date(doc.expires_at) < new Date()
  );
  
  const expiringDocuments = filteredDocuments.filter(doc => {
    if (!doc.expires_at) return false;
    const expiryDate = new Date(doc.expires_at);
    const warningDate = addMonths(new Date(), 1); // Warn 1 month before
    return expiryDate >= new Date() && expiryDate <= warningDate;
  });

  const currentDocuments = filteredDocuments.filter(doc => 
    !doc.expires_at || new Date(doc.expires_at) > addMonths(new Date(), 1)
  );

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAircraftId || !documentName || !file) {
        throw new Error("Please fill in all required fields");
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedAircraftId}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('aircraft-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Create document record
      const { data, error } = await supabase
        .from("aircraft_documents")
        .insert({
          aircraft_id: selectedAircraftId,
          type: documentType,
          name: documentName,
          file_url: uploadData?.path || fileName,
          file_size: file.size,
          mime_type: file.type,
          expires_at: expiresAt || null,
          uploaded_by: user?.id,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded",
        description: "The document has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["aircraft-documents"] });
      setIsUploadDialogOpen(false);
      // Reset form
      setSelectedAircraftId("");
      setDocumentType("registration");
      setDocumentName("");
      setExpiresAt("");
      setNotes("");
      setFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error uploading document",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: Document) => {
      // Delete from storage
      if (document.file_url) {
        const { error: storageError } = await supabase.storage
          .from('aircraft-documents')
          .remove([document.file_url]);
        
        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
        }
      }

      // Delete record
      const { error } = await supabase
        .from("aircraft_documents")
        .delete()
        .eq("id", document.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["aircraft-documents"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting document",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (document: Document) => {
    if (!document.file_url) return;

    const { data, error } = await supabase.storage
      .from('aircraft-documents')
      .download(document.file_url);

    if (error) {
      toast({
        title: "Error downloading document",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (document: Document) => {
    if (!document.expires_at) return null;
    
    const expiryDate = new Date(document.expires_at);
    const now = new Date();
    const warningDate = addMonths(now, 1);
    
    if (expiryDate < now) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    } else if (expiryDate <= warningDate) {
      return <Clock className="h-4 w-4 text-amber-600" />;
    } else {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Management
                </CardTitle>
                <CardDescription>
                  Manage aircraft documents, certificates, and compliance records
                </CardDescription>
              </div>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Aircraft" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Aircraft</SelectItem>
                  {aircraft.map((ac) => (
                    <SelectItem key={ac.id} value={ac.id}>
                      {ac.tail_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Expired
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{expiredDocuments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Require immediate attention
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Expiring Soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{expiringDocuments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Within 30 days
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Current
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{currentDocuments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Up to date
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Documents Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All ({filteredDocuments.length})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({expiredDocuments.length})</TabsTrigger>
                <TabsTrigger value="expiring">Expiring ({expiringDocuments.length})</TabsTrigger>
                <TabsTrigger value="current">Current ({currentDocuments.length})</TabsTrigger>
              </TabsList>

              {/* Render document table for each tab */}
              {["all", "expired", "expiring", "current"].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue}>
                  {(() => {
                    const docsToShow = 
                      tabValue === "expired" ? expiredDocuments :
                      tabValue === "expiring" ? expiringDocuments :
                      tabValue === "current" ? currentDocuments :
                      filteredDocuments;
                    
                    return isLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading documents...</p>
                      </div>
                    ) : docsToShow.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No {tabValue !== "all" ? tabValue : ""} documents found.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document</TableHead>
                              <TableHead>Aircraft</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead>Uploaded</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {docsToShow.map((document) => (
                              <TableRow key={document.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(document)}
                                    <span className="font-medium">{document.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono">
                                    {document.aircraft?.tail_number || "N/A"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const TypeIcon = DOCUMENT_TYPES[document.type].icon;
                                      return <TypeIcon className="h-4 w-4" />;
                                    })()}
                                    <span>{DOCUMENT_TYPES[document.type].label}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {document.expires_at ? (
                                    <Badge variant={
                                      new Date(document.expires_at) < new Date() ? "destructive" :
                                      new Date(document.expires_at) <= addMonths(new Date(), 1) ? "secondary" :
                                      "outline"
                                    }>
                                      {format(new Date(document.expires_at), "MMM d, yyyy")}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div>
                                    <p>{document.uploader?.full_name || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDownload(document)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteDocumentMutation.mutate(document)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document for an aircraft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aircraft *</Label>
                <Select value={selectedAircraftId} onValueChange={setSelectedAircraftId}>
                  <SelectTrigger id="aircraft">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraft.map((ac) => (
                      <SelectItem key={ac.id} value={ac.id}>
                        {ac.tail_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Document Type *</Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as keyof typeof DOCUMENT_TYPES)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., 2024 Registration Certificate"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expires">Expiry Date (Optional)</Label>
              <Input
                id="expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={uploadDocumentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => uploadDocumentMutation.mutate()}
              disabled={uploadDocumentMutation.isPending}
            >
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


