"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Save, Upload, Palette, Share2, FileText, Shield } from "lucide-react"

export default function AdminDashboard() {
    // Configuration State
    const [maxSize, setMaxSize] = useState(5)
    const [passwordEnabled, setPasswordEnabled] = useState(false)
    const [captchaEnabled, setCaptchaEnabled] = useState(false)
    const [submitAnother, setSubmitAnother] = useState(true)

    // Design State (Mock)
    const [primaryColor, setPrimaryColor] = useState("#000000")

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Manage your file upload form settings and submissions.</p>
                </div>
                <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="configuration" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="publishing">Publishing</TabsTrigger>
                    <TabsTrigger value="uploads">Uploads</TabsTrigger>
                </TabsList>

                {/* Configuration Tab */}
                <TabsContent value="configuration" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Upload Constraints
                                </CardTitle>
                                <CardDescription>Set limits for file uploads.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="max-size">Max File Size (MB)</Label>
                                    <Input
                                        id="max-size"
                                        type="number"
                                        value={maxSize}
                                        onChange={(e) => setMaxSize(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Allowed File Types</Label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch id="images" defaultChecked />
                                            <Label htmlFor="images">Images (PNG, JPG)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch id="docs" defaultChecked />
                                            <Label htmlFor="docs">Documents (PDF, DOCX)</Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Security
                                </CardTitle>
                                <CardDescription>Protect your upload form.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password-protection">Password Protection</Label>
                                    <Switch
                                        id="password-protection"
                                        checked={passwordEnabled}
                                        onCheckedChange={setPasswordEnabled}
                                    />
                                </div>
                                {passwordEnabled && (
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Form Password</Label>
                                        <Input id="password" type="password" placeholder="Set a password" />
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="captcha">Enable CAPTCHA</Label>
                                    <Switch
                                        id="captcha"
                                        checked={captchaEnabled}
                                        onCheckedChange={setCaptchaEnabled}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Form Behavior
                                </CardTitle>
                                <CardDescription>Customize user interaction.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="submit-another">Allow "Submit Another"</Label>
                                    <Switch
                                        id="submit-another"
                                        checked={submitAnother}
                                        onCheckedChange={setSubmitAnother}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value="design" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Form Appearance
                            </CardTitle>
                            <CardDescription>Customize the look and feel of your upload form.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 border-2 border-dashed rounded-md flex items-center justify-center bg-muted text-muted-foreground">
                                            Logo
                                        </div>
                                        <div className="space-y-1">
                                            <Input type="file" accept="image/*" className="w-full" />
                                            <p className="text-xs text-muted-foreground">Recommended: 200x200px PNG</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Font Family</Label>
                                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="Inter">Inter (Default)</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Open Sans">Open Sans</option>
                                        <option value="Lato">Lato</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border shadow-sm" style={{ backgroundColor: primaryColor }}></div>
                                        <Input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-full h-10 p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Background Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border shadow-sm" style={{ backgroundColor: "#f3f4f6" }}></div>
                                        <Input
                                            type="color"
                                            defaultValue="#f3f4f6"
                                            className="w-full h-10 p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Publishing Tab */}
                <TabsContent value="publishing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="w-5 h-5" />
                                Share Your Form
                            </CardTitle>
                            <CardDescription>Distribute your form to users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Public Link</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value="https://file-uploader.app/upload/ref-123" className="bg-muted" />
                                    <Button variant="outline">Copy</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>QR Code</Label>
                                    <div className="border p-4 rounded-md inline-block bg-white">
                                        <div className="w-32 h-32 bg-black/10 flex items-center justify-center text-xs text-center">
                                            QR Code Generator
                                        </div>
                                    </div>
                                    <div>
                                        <Button variant="secondary" size="sm">Download PNG</Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Access Control</Label>
                                        <div className="space-y-2 border p-3 rounded-md">
                                            <div className="flex items-center space-x-2">
                                                <input type="radio" name="access" id="public" defaultChecked />
                                                <Label htmlFor="public">Anyone with the link</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="radio" name="access" id="invited" />
                                                <Label htmlFor="invited">Invited people only</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Invite People (Email)</Label>
                                        <div className="flex gap-2">
                                            <Input placeholder="user@example.com" />
                                            <Button>Invite</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Uploads Tab */}
                <TabsContent value="uploads">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Uploads</CardTitle>
                            <CardDescription>View and manage received files.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                No uploads yet.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
