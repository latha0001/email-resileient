"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, CheckCircle, XCircle, Clock } from "lucide-react"

interface EmailStatus {
  id: string
  status: "pending" | "sent" | "failed" | "retrying"
  provider?: string
  attempts: number
  error?: string
  timestamp: string
}

export default function EmailServiceDemo() {
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailStatuses, setEmailStatuses] = useState<EmailStatus[]>([])

  const sendEmail = async () => {
    if (!email || !subject || !body) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject,
          body,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setEmailStatuses((prev) => [result.status, ...prev])
        setEmail("")
        setSubject("")
        setBody("")
      } else {
        console.error("Failed to send email:", result.error)
      }
    } catch (error) {
      console.error("Error sending email:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "retrying":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "retrying":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resilient Email Service Demo</h1>
          <p className="text-lg text-gray-600">
            Test the email service with retry logic, fallback providers, and status tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Email
              </CardTitle>
              <CardDescription>Send an email using the resilient email service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">To Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Email message"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <Button onClick={sendEmail} disabled={isLoading || !email || !subject || !body} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Email Status Tracking</CardTitle>
              <CardDescription>Real-time status of email sending attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emailStatuses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No emails sent yet</p>
                ) : (
                  emailStatuses.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status.status)}
                        <div>
                          <p className="font-medium text-sm">{status.id}</p>
                          <p className="text-xs text-gray-500">{new Date(status.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(status.status)}>{status.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">Attempts: {status.attempts}</p>
                        {status.provider && <p className="text-xs text-gray-500">Provider: {status.provider}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Service Features</CardTitle>
            <CardDescription>This email service implements the following resilience patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">Retry Logic</h3>
                <p className="text-sm text-blue-700">Exponential backoff with configurable max attempts</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900">Fallback Providers</h3>
                <p className="text-sm text-green-700">Automatic switching between email providers</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900">Idempotency</h3>
                <p className="text-sm text-purple-700">Prevents duplicate email sends</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-900">Rate Limiting</h3>
                <p className="text-sm text-yellow-700">Controls email sending frequency</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibent text-red-900">Circuit Breaker</h3>
                <p className="text-sm text-red-700">Prevents cascading failures</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">Status Tracking</h3>
                <p className="text-sm text-gray-700">Real-time monitoring of email status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
