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
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
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
import { PageLoader } from '@/components/ui/page-loader';
import { ImageDropzone } from '@/components/image-dropzone';

import jsQR from 'jsqr';

export default function SettingsPage() {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newQrName, setNewQrName] = useState('');
  const [newQrUrl, setNewQrUrl] = useState('');

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // 1. Size Validation (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB."
      });
      return;
    }

    // 2. Format Validation
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid Format",
        description: "Only PNG, JPG, and WebP formats are allowed."
      });
      return;
    }

    // 3. Read File and Validate QR
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
          // Valid QR Code found
          setNewQrUrl(imageUrl); // Store as Base64 Data URL
          toast({
            title: "QR Code Verified",
            description: "Successfully detected a valid QR code."
          });
        } else {
          // No QR Code found
          setNewQrUrl('');
          toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "Could not detect a valid QR code in this image. Please ensure the image is clear."
          });
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const fetchQrCodes = async () => {
    setIsLoading(true);
    const res = await getQrCodes();
    if (res.success && res.data) {
      setQrCodes(res.data as QrCode[]);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch QR codes' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQrCodes();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await deleteQrCode(id);
    if (res.success) {
      toast({ title: 'QR Code Deleted' });
      fetchQrCodes();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
  };

  const handleAddQrCode = async () => {
    if (!newQrName || !newQrUrl) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both a name and a URL for the QR code."
      });
      return;
    }
    setIsSubmitting(true);

    const res = await addQrCode({ name: newQrName, url: newQrUrl });

    if (res.success) {
      toast({
        title: "QR Code Added",
        description: "Your new QR code has been saved."
      });

      setNewQrName('');
      setNewQrUrl('');
      setOpen(false);
      fetchQrCodes();
    } else {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: "There was an error saving your QR code."
      });
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return <PageLoader message="Loading settings..." />;
  }

  return (
    <div className="grid gap-6">
      <GlassCard>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your personal settings and preferences.
          </CardDescription>
        </CardHeader>
      </GlassCard>

      <GlassCard>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Manage QR Codes</CardTitle>
            <CardDescription>
              Add, view, or remove your payment QR codes.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New QR
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a New QR Code</DialogTitle>
                <DialogDescription>
                  Upload a QR code image. We'll verify it before saving.
                </DialogDescription>
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
                    onClear={() => {
                      setNewQrUrl('');
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddQrCode} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save QR Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading && <p className="col-span-full text-center">Loading QR codes...</p>}
            {qrCodes?.map(qr => (
              <GlassCard key={qr.id} variant="bordered" className="bg-black/20">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
                  <Image
                    src={qr.url}
                    alt={qr.name}
                    width={150}
                    height={150}
                    className="rounded-lg border aspect-square object-contain"
                  />
                  <p className="font-medium text-center">{qr.name}</p>
                </CardContent>
                <CardFooter className="p-2 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-red-500/10"
                    onClick={() => handleDelete(qr.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </GlassCard>
            ))}
            {qrCodes?.length === 0 && !isLoading && (
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                You haven't added any QR codes yet.
              </div>
            )}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}
