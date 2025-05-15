// This needs to be a client component to handle state
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { FileDown, FileUp, Check, AlertTriangle, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslationEntry } from "@/lib/translations/translation-utils";

// Translation status badge variants
const statusVariants = {
  complete: "success",
  missing: "destructive",
  partial: "warning",
};

export default function TranslationsDashboard() {
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [filteredTranslations, setFilteredTranslations] = useState<TranslationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, missing, partial, complete
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<TranslationEntry | null>(null);
  const [editValues, setEditValues] = useState({ en: "", nl: "" });

  // Import/Export dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLocale, setImportLocale] = useState("en");
  const [importData, setImportData] = useState("");

  // Fetch translations on load
  useEffect(() => {
    fetchTranslations();
  }, []);

  // Apply filters whenever filter or search changes
  useEffect(() => {
    applyFilters();
  }, [translations, filter, searchTerm, activeTab]);

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/translations/missing");
      
      if (!response.ok) {
        throw new Error("Failed to fetch translations");
      }
      
      const data = await response.json();
      setTranslations(data.translations);
    } catch (error) {
      console.error("Error fetching translations:", error);
      toast.error("Failed to load translations");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...translations];
    
    // Apply tab filter
    if (activeTab !== "all") {
      const namespaces = activeTab.split(".");
      filtered = filtered.filter(t => {
        const parts = t.path.split(".");
        return namespaces.every((namespace, i) => parts[i] === namespace);
      });
    }
    
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(t => t.status === filter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t => 
          t.path.toLowerCase().includes(term) || 
          (t.enValue && t.enValue.toLowerCase().includes(term)) ||
          (t.nlValue && t.nlValue.toLowerCase().includes(term))
      );
    }
    
    setFilteredTranslations(filtered);
  };

  const handleEdit = (translation: TranslationEntry) => {
    setEditingTranslation(translation);
    setEditValues({
      en: translation.enValue || "",
      nl: translation.nlValue || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTranslation) return;
    
    try {
      // Update English translation if changed
      if (editValues.en !== editingTranslation.enValue) {
        await updateTranslation("en", editingTranslation.path, editValues.en);
      }
      
      // Update Dutch translation if changed
      if (editValues.nl !== editingTranslation.nlValue) {
        await updateTranslation("nl", editingTranslation.path, editValues.nl);
      }
      
      // Close dialog and refresh translations
      setEditDialogOpen(false);
      toast.success("Translation updated successfully");
      fetchTranslations();
    } catch (error) {
      console.error("Error saving translation:", error);
      toast.error("Failed to update translation");
    }
  };

  const updateTranslation = async (locale: string, path: string, value: string) => {
    const response = await fetch("/api/translations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ locale, path, value }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update translation");
    }
    
    return response.json();
  };

  const handleExport = async (locale: string) => {
    try {
      const response = await fetch(`/api/translations?locale=${locale}`);
      
      if (!response.ok) {
        throw new Error("Failed to export translations");
      }
      
      const data = await response.json();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data.translations, null, 2)], {
        type: "application/json",
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${locale}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${locale} translations`);
    } catch (error) {
      console.error("Error exporting translations:", error);
      toast.error("Failed to export translations");
    }
  };

  const handleImport = async () => {
    try {
      let translationData;
      
      try {
        translationData = JSON.parse(importData);
      } catch (e) {
        toast.error("Invalid JSON format");
        return;
      }
      
      const response = await fetch("/api/translations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale: importLocale,
          translations: translationData,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to import translations");
      }
      
      // Close dialog and refresh translations
      setImportDialogOpen(false);
      setImportData("");
      toast.success(`Imported ${importLocale} translations`);
      fetchTranslations();
    } catch (error) {
      console.error("Error importing translations:", error);
      toast.error("Failed to import translations");
    }
  };

  // Get unique top-level namespaces for tabs
  const getNamespaces = () => {
    const namespaces = new Set<string>();
    translations.forEach(t => {
      const firstPart = t.path.split('.')[0];
      namespaces.add(firstPart);
    });
    return Array.from(namespaces).sort();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Translation Management</h1>
          <p className="text-muted-foreground">
            Manage missing and incomplete translations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("en")}
            className="flex items-center gap-2"
          >
            <FileDown size={16} />
            Export EN
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("nl")}
            className="flex items-center gap-2"
          >
            <FileDown size={16} />
            Export NL
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <FileUp size={16} />
            Import
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="md:flex-1">
          <Input
            placeholder="Search translations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Translations</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Translations</CardTitle>
              <CardDescription>
                {filteredTranslations.length} translations found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{translations.length} Total</Badge>
              <Badge variant="destructive">
                {translations.filter((t) => t.status === "missing").length} Missing
              </Badge>
              <Badge variant="destructive">
                {translations.filter((t) => t.status === "partial").length} Partial
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              {getNamespaces().map(namespace => (
                <TabsTrigger key={namespace} value={namespace}>
                  {namespace}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex justify-center py-8">
                  <p>Loading translations...</p>
                </div>
              ) : filteredTranslations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No translations found matching your criteria.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Path</TableHead>
                        <TableHead>English</TableHead>
                        <TableHead>Dutch</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTranslations.slice(0, 100).map((translation) => (
                        <TableRow key={translation.path}>
                          <TableCell className="font-mono text-xs">
                            {translation.path}
                          </TableCell>
                          <TableCell>
                            {translation.enValue || (
                              <span className="text-muted-foreground italic">
                                Not defined
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {translation.nlValue || (
                              <span className="text-muted-foreground italic">
                                Not defined
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                statusVariants[
                                  translation.status as keyof typeof statusVariants
                                ] as any
                              }
                            >
                              {translation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(translation)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredTranslations.length > 100 && (
                    <div className="py-3 px-4 text-sm text-muted-foreground bg-muted/50">
                      Showing 100 of {filteredTranslations.length} results. Please refine your search.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Translation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Translation</DialogTitle>
            <DialogDescription>
              Path: <code className="text-xs">{editingTranslation?.path}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">English</label>
              <Input
                value={editValues.en}
                onChange={(e) =>
                  setEditValues({ ...editValues, en: e.target.value })
                }
                placeholder="Enter English translation"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dutch</label>
              <Input
                value={editValues.nl}
                onChange={(e) =>
                  setEditValues({ ...editValues, nl: e.target.value })
                }
                placeholder="Enter Dutch translation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Translations</DialogTitle>
            <DialogDescription>
              Import translations for a specific locale. This will overwrite existing translations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Locale</label>
              <Select value={importLocale} onValueChange={setImportLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="nl">Dutch (nl)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">JSON Data</label>
              <div className="min-h-48">
                <textarea
                  className="w-full h-48 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste JSON translation data here..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
