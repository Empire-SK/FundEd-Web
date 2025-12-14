'use client';

import { useState, useEffect } from 'react';
import {
  Card,
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

export default function SettingsPage() {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newQrName, setNewQrName] = useState('');
  const [newQrUrl, setNewQrUrl] = useState('');

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
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your personal settings and preferences.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
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
                  Provide a name and a public URL for your QR code image.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="qr-name">QR Code Name</Label>
                  <Input id="qr-name" placeholder="e.g., GPay Business" value={newQrName} onChange={(e) => setNewQrName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qr-code-url">Image URL</Label>
                  <Input id="qr-code-url" type="url" placeholder="https://example.com/qr.png" value={newQrUrl} onChange={(e) => setNewQrUrl(e.target.value)} />
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
              <Card key={qr.id}>
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
                <CardFooter className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => handleDelete(qr.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {qrCodes?.length === 0 && !isLoading && (
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                You haven't added any QR codes yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
