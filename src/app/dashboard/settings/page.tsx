'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, Loader2, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import type { QrCode } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getQrCodes, addQrCode, deleteQrCode } from '@/actions/settings';
import { getUsers, createUser, deleteUser, updateUser } from '@/actions/users';
import { PageLoader } from '@/components/ui/page-loader';
import { ImageDropzone } from '@/components/image-dropzone';

import jsQR from 'jsqr';

export default function SettingsPage() {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Code State
  const [openQr, setOpenQr] = useState(false);
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [newQrName, setNewQrName] = useState('');
  const [newQrUrl, setNewQrUrl] = useState('');

  // User Management State
  const [openUser, setOpenUser] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Edit User State
  const [openEdit, setOpenEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editImage, setEditImage] = useState('');

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File Too Large", description: "Please upload an image smaller than 2MB." });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid Format", description: "Only PNG, JPG, and WebP formats are allowed." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const img = document.createElement('img');
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);

        const imageData = context.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setNewQrUrl(imageUrl);
          toast({ title: "QR Code Verified", description: "Successfully detected a valid QR code." });
        } else {
          setNewQrUrl('');
          toast({ variant: "destructive", title: "Invalid QR Code", description: "Could not detect a valid QR code in this image." });
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const [qrRes, usersRes] = await Promise.all([getQrCodes(), getUsers()]);

    if (qrRes.success) setQrCodes(qrRes.data as QrCode[]);
    if (usersRes.success) setUsers(usersRes.data as any[]);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteQr = async (id: string) => {
    const res = await deleteQrCode(id);
    if (res.success) {
      toast({ title: 'QR Code Deleted' });
      fetchData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
  };

  const handleAddQrCode = async () => {
    if (!newQrName || !newQrUrl) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide both a name and a URL." });
      return;
    }
    setIsSubmittingQr(true);
    const res = await addQrCode({ name: newQrName, url: newQrUrl });
    if (res.success) {
      toast({ title: "QR Code Added" });
      setNewQrName('');
      setNewQrUrl('');
      setOpenQr(false);
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Operation Failed", description: "Error saving QR code." });
    }
    setIsSubmittingQr(false);
  };

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all fields." });
      return;
    }
    setIsSubmittingUser(true);
    const res = await createUser({ name: newUserName, email: newUserEmail, password: newUserPassword });
    if (res.success) {
      toast({ title: "Admin Added", description: `${newUserName} has been added to the team.` });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setOpenUser(false);
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Operation Failed", description: res.error });
    }
    setIsSubmittingUser(false);
  };

  const handleProfileImageSelect = (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File Too Large", description: "Limit is 2MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditImage(user.image || '');
    setEditPassword(''); // Don't prefill password
    setOpenEdit(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editName || !editEmail) {
      toast({ variant: "destructive", title: "Missing Information", description: "Name and Email are required." });
      return;
    }

    setIsSubmittingEdit(true);
    const res = await updateUser({
      id: editingUser.id,
      name: editName,
      email: editEmail,
      password: editPassword,
      image: editImage
    });

    if (res.success) {
      toast({ title: "Profile Updated", description: "Admin details have been updated." });
      setOpenEdit(false);
      setEditingUser(null);
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: res.error });
    }
    setIsSubmittingEdit(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to remove this admin?")) {
      const res = await deleteUser(id);
      if (res.success) {
        toast({ title: "Admin Removed" });
        fetchData();
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error });
      }
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading settings..." />;
  }

  return (
    <div className="grid gap-8">
      <GlassCard>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your preferences, payment methods, and team access.</CardDescription>
        </CardHeader>
      </GlassCard>

      <div className="grid gap-6">
        {/* QR CODES SECTION */}
        <GlassCard>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Manage QR Codes</CardTitle>
              <CardDescription>Add, view, or remove your payment QR codes.</CardDescription>
            </div>
            <Dialog open={openQr} onOpenChange={setOpenQr}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New QR
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a New QR Code</DialogTitle>
                  <DialogDescription>Upload a QR code image to be verified.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="qr-name">QR Code Name</Label>
                    <Input id="qr-name" placeholder="e.g., GPay Business" value={newQrName} onChange={(e) => setNewQrName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>QR Code Image</Label>
                    <ImageDropzone
                      onFileSelect={handleFileSelect}
                      previewUrl={newQrUrl}
                      onClear={() => setNewQrUrl('')}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" disabled={isSubmittingQr} onClick={() => setOpenQr(false)}>Cancel</Button>
                  <Button onClick={handleAddQrCode} disabled={isSubmittingQr}>
                    {isSubmittingQr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save QR Code
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {qrCodes?.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg border-white/10">
                  No QR codes found.
                </div>
              )}
              {qrCodes?.map(qr => (
                <GlassCard key={qr.id} variant="bordered" className="bg-black/20">
                  <CardContent className="p-4 flex flex-col items-center gap-4">
                    <Image
                      src={qr.url}
                      alt={qr.name}
                      width={150}
                      height={150}
                      className="rounded-lg border aspect-square object-contain bg-white"
                    />
                    <p className="font-medium">{qr.name}</p>
                  </CardContent>
                  <CardFooter className="p-2 border-t border-white/10">
                    <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10" onClick={() => handleDeleteQr(qr.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </CardFooter>
                </GlassCard>
              ))}
            </div>
          </CardContent>
        </GlassCard>


        {/* TEAM MANAGEMENT SECTION */}
        <GlassCard>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Admin Team</CardTitle>
              <CardDescription>Manage users who have administrative access to this dashboard.</CardDescription>
            </div>
            <Dialog open={openUser} onOpenChange={setOpenUser}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Administrator</DialogTitle>
                  <DialogDescription>Create a new account for an admin user.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input placeholder="John Doe" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="john@example.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Password</Label>
                    <Input type="text" placeholder="Secure password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenUser(false)}>Cancel</Button>
                  <Button onClick={handleAddUser} disabled={isSubmittingUser} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    {isSubmittingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Administrator</DialogTitle>
                  <DialogDescription>Update admin credentials.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative w-24 h-24 group cursor-pointer">
                      <Label htmlFor="edit-image" className="cursor-pointer block w-full h-full">
                        {editImage ? (
                          <Image
                            src={editImage}
                            alt="Profile"
                            fill
                            className="rounded-full object-cover border-2 border-emerald-500/50"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 flex items-center justify-center text-emerald-500">
                            <PlusCircle className="w-8 h-8 opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-white">Change</span>
                        </div>
                      </Label>
                      <Input
                        id="edit-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProfileImageSelect(file);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input placeholder="John Doe" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="john@example.com" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>New Password (Optional)</Label>
                    <Input type="text" placeholder="Leave blank to keep current" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
                  <Button onClick={handleUpdateUser} disabled={isSubmittingEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    {isSubmittingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/10">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 bg-white/5 font-medium text-sm text-stone-400">
                <div className="col-span-1">Name</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              {users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No users found.</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 items-center last:border-0 hover:bg-white/5 transition-colors">
                    <div className="col-span-1 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500 font-bold uppercase">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      {user.name}
                    </div>
                    <div className="col-span-2 text-stone-300 text-sm truncate">{user.email}</div>
                    <div className="col-span-1 text-right flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => startEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-red-400" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
