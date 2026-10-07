'use client';

import React, { useState } from 'react';
import { Button, ButtonProps } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  confirmTitle?: string;
  confirmMessage: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmButton({
  confirmTitle = 'Confirm Action',
  confirmMessage,
  confirmLabel = 'Confirm',
  onConfirm,
  children,
  variant = 'danger',
  ...props
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    try {
      setLoading(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        {...props}
      >
        {children}
      </Button>

      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        title={confirmTitle}
        width="440px"
      >
        <p style={{ margin: '0 0 var(--sp-5) 0', color: 'var(--ink)' }}>
          {confirmMessage}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)' }}>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            loading={loading}
            onClick={handleExecute}
          >
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
