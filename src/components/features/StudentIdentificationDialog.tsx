import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, Hash, Upload } from 'lucide-react';

interface StudentIdentificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (studentName: string, studentId: string) => void;
  filename: string;
}

const StudentIdentificationDialog: React.FC<StudentIdentificationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  filename
}) => {
  console.log('StudentIdentificationDialog rendered:', { isOpen, filename });
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleConfirm = () => {
    if (!studentName.trim()) {
      return;
    }
    if (!studentId.trim()) {
      return;
    }
    onConfirm(studentName.trim(), studentId.trim());
    setStudentName('');
    setStudentId('');
  };

  const handleClose = () => {
    setStudentName('');
    setStudentId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Student Identification
          </DialogTitle>
          <DialogDescription>
            Please enter the student details for this OMR sheet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>File:</span>
                <span className="font-medium">{filename}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Label htmlFor="studentName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Name *
              </Label>
              <Input
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student's full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="studentId" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Student ID *
              </Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student's ID number"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!studentName.trim() || !studentId.trim()}
            >
              Confirm & Process
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentIdentificationDialog;
