"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type RetailerRequest = {
  id: string
  name: string
  email: string
  companyName: string
  phone: string
  businessAddress: string
  taxId?: string
  yearsInBusiness: string
  additionalInfo?: string
  businessDocument?: string
  businessDocumentName?: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
}

export default function RetailerApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = React.useState<RetailerRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedApplication, setSelectedApplication] = React.useState<RetailerRequest | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isActionDialogOpen, setIsActionDialogOpen] = React.useState(false)
  const [actionType, setActionType] = React.useState<"approve" | "reject" | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Fetch retailer applications
  React.useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch("/api/retailer/applications")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch applications")
        }

        setApplications(data)
      } catch (error) {
        console.error("Error fetching applications:", error)
        toast.error("Failed to load retailer applications")
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplications()
  }, [])

  // Filter applications based on status and search query
  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Handle application action (approve/reject)
  async function handleAction(approve: boolean) {
    if (!selectedApplication || !actionType) return

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/retailer/apply/${selectedApplication.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: approve ? "APPROVED" : "REJECTED",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process application")
      }

      // Update the application in the local state
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === selectedApplication.id
            ? { ...app, status: approve ? "APPROVED" : "REJECTED" }
            : app
        )
      )

      toast.success(
        `Application ${approve ? "approved" : "rejected"} successfully`
      )
      setIsActionDialogOpen(false)
    } catch (error) {
      console.error("Error processing application:", error)
      toast.error("Failed to process application")
    } finally {
      setIsProcessing(false)
    }
  }

  // Get badge color based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default"
      case "REJECTED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Format date to local string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Retailer Applications</h1>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">{application.companyName}</TableCell>
                <TableCell>{application.name}</TableCell>
                <TableCell>{application.email}</TableCell>
                <TableCell>{formatDate(application.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(application.status)}>
                    {application.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedApplication(application)
                          setActionType("approve")
                          setIsActionDialogOpen(true)
                        }}
                        disabled={application.status !== "PENDING"}
                      >
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedApplication(application)
                          setActionType("reject")
                          setIsActionDialogOpen(true)
                        }}
                        disabled={application.status !== "PENDING"}
                        className="text-destructive"
                      >
                        Reject
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedApplication(application)}
                      >
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication && !actionType} onOpenChange={() => {
        setSelectedApplication(null)
        setActionType(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the retailer application information
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Company Information</h3>
                <dl className="space-y-2 mt-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Company Name</dt>
                    <dd>{selectedApplication.companyName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Years in Business</dt>
                    <dd>{selectedApplication.yearsInBusiness}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Tax ID</dt>
                    <dd>{selectedApplication.taxId || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Business Address</dt>
                    <dd>{selectedApplication.businessAddress}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold">Contact Information</h3>
                <dl className="space-y-2 mt-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Contact Name</dt>
                    <dd>{selectedApplication.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Email</dt>
                    <dd>{selectedApplication.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Phone</dt>
                    <dd>{selectedApplication.phone}</dd>
                  </div>
                </dl>
              </div>              {selectedApplication.additionalInfo && (
                <div className="col-span-2">
                  <h3 className="font-semibold">Additional Information</h3>
                  <p className="mt-2 text-sm">{selectedApplication.additionalInfo}</p>
                </div>
              )}
              {selectedApplication.businessDocument && (
                <div className="col-span-2">
                  <h3 className="font-semibold">Business Document</h3>
                  <div className="mt-2">
                    <a
                      href={selectedApplication.businessDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      {selectedApplication.businessDocumentName || "View Document"}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will approve the retailer application and create a retailer account."
                : "This will reject the retailer application."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={() => handleAction(actionType === "approve")}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Processing..."
                : actionType === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}