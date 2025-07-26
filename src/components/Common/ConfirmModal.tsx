import React from "react";
import Modal from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes",
  cancelText = "Cancel",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
