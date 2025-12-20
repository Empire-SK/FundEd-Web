'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addStudent } from '@/actions/students';

interface AddStudentDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function AddStudentDialog({ trigger, onSuccess }: AddStudentDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rollNumber: '',
        email: '',
        phone: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.rollNumber) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const result = await addStudent({
                name: formData.name,
                rollNumber: formData.rollNumber,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: `${formData.name} (${formData.rollNumber}) has been added to the system.`,
                });

                setFormData({ name: '', rollNumber: '', email: '', phone: '' });
                setOpen(false);

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'An error occurred while adding the student.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error adding student:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 gradient-primary">
                        <UserPlus className="h-4 w-4" />
                        Add Student
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                        Add a new student to the system. Required fields are marked with *.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Student Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter student name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Roll Number */}
                        <div className="space-y-2">
                            <Label htmlFor="rollNumber">
                                Roll Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="rollNumber"
                                placeholder="Enter roll number"
                                value={formData.rollNumber}
                                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="student@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="gradient-primary"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Student'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
