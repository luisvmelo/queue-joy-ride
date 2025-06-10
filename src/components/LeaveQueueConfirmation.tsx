
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface LeaveQueueConfirmationProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  restaurantName: string;
}

const LeaveQueueConfirmation = ({
  isOpen,
  onCancel,
  onConfirm,
  restaurantName
}: LeaveQueueConfirmationProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md mx-auto">
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-xl font-bold text-black">
            Sair da Fila?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            Tem certeza que deseja sair da fila do {restaurantName}? 
            Você perderá sua posição atual.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex flex-col space-y-2 sm:flex-col sm:space-x-0 sm:space-y-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="w-full h-12 bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="w-full h-12 bg-red-500 text-white hover:bg-red-600"
          >
            Sim, Sair da Fila
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveQueueConfirmation;
