import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VarkStartDialogProps {
  children: ReactNode;
  retake?: boolean;
}

export function VarkStartDialog({ children, retake }: VarkStartDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {retake ? "Retake the VARK quiz?" : "Ready to take the VARK quiz?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            The VARK quiz has 8 short questions and takes about 2–3 minutes. Your
            answers help us figure out how you learn best (Visual, Auditory,
            Reading/Writing, or Kinesthetic) so we can tailor tips for you.
            Make sure you can finish without being interrupted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={() => navigate({ to: "/vark-quiz" })}>
            Proceed to quiz
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
