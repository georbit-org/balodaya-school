'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { ConfirmButton } from '@/components/ui/ConfirmButton';

interface UserItem {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  designation: string | null;
  role: string;
  active: number;
  must_change_password: number;
  created_at: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    designation: '',
  });

  // Created / Reset Password Modal
  const [tempPassModal, setTempPassModal] = useState<{
    open: boolean;
    email: string;
    pass: string;
  }>({ open: false, email: '', pass: '' });

  const loadUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('q', search);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadUsers(false);
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email) return;

    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok) {
        setCreateModalOpen(false);
        setTempPassModal({
          open: true,
          email: createForm.email,
          pass: data.temporaryPassword,
        });
        setCreateForm({ name: '', email: '', phone: '', role: 'teacher', designation: '' });
        loadUsers();
      } else {
        alert(data.error || 'Failed to create user.');
      }
    } catch {
      alert('Error creating user.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    const newActive = user.active === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      if (res.ok) {
        loadUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Update failed.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const handleResetPassword = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setTempPassModal({
          open: true,
          email: user.email,
          pass: data.temporaryPassword,
        });
      } else {
        alert(data.error || 'Failed to reset password.');
      }
    } catch {
      alert('Error resetting password.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name & Designation',
      render: (u: UserItem) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
            {u.designation || 'Staff'}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email / Phone',
      render: (u: UserItem) => (
        <div>
          <div>{u.email}</div>
          {u.phone && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>{u.phone}</div>}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'System Role',
      render: (u: UserItem) => (
        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{u.role}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: UserItem) => (
        <span style={{ color: u.active === 1 ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
          {u.active === 1 ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u: UserItem) => (
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleToggleActive(u)}
          >
            {u.active === 1 ? 'Deactivate' : 'Activate'}
          </Button>
          <ConfirmButton
            size="sm"
            variant="secondary"
            confirmTitle="Reset Password"
            confirmMessage={`Are you sure you want to reset password for ${u.name}? A new temporary password will be generated.`}
            onConfirm={() => handleResetPassword(u)}
          >
            Reset Pass
          </ConfirmButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Accounts & Access"
        description="Manage portal users, assign administrative and teaching roles, and configure credentials."
        actions={
          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
            + Add New User
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBlock: 'var(--sp-4)', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--line)',
            fontSize: 'var(--text-sm)',
            width: 280,
          }}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--line)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="principal">Principal</option>
          <option value="teacher">Teacher</option>
          <option value="accountant">Accountant</option>
          <option value="parent">Parent</option>
          <option value="student">Student</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        emptyText="No user accounts found."
      />

      {/* Create User Dialog */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New User Account"
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <Field
            label="Full Name"
            required
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="e.g. Ramesh Sharma"
          />

          <Field
            label="Email Address"
            type="email"
            required
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="ramesh@balodaya.edu.np"
          />

          <Field
            label="Phone Number"
            type="tel"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            placeholder="e.g. 98XXXXXXXX (optional)"
          />

          <Field
            label="Role"
            as="select"
            required
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            options={[
              { label: 'Teacher', value: 'teacher' },
              { label: 'Principal', value: 'principal' },
              { label: 'Accountant', value: 'accountant' },
              { label: 'Administrator', value: 'admin' },
              { label: 'Parent', value: 'parent' },
              { label: 'Student', value: 'student' },
            ]}
          />

          <Field
            label="Designation / Title"
            value={createForm.designation}
            onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
            placeholder="e.g. Senior Mathematics Teacher (optional)"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={creating}>
              Create User
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Temporary Password Dialog */}
      <Dialog
        open={tempPassModal.open}
        onClose={() => setTempPassModal({ open: false, email: '', pass: '' })}
        title="Temporary Credentials"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <p style={{ margin: 0, color: 'var(--ink)' }}>
            The account for <strong>{tempPassModal.email}</strong> is ready. Please copy the temporary password below. The user will be required to change it upon first login:
          </p>

          <div
            style={{
              padding: 'var(--sp-4)',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--radius)',
              fontFamily: 'monospace',
              fontSize: 'var(--text-lg)',
              textAlign: 'center',
              userSelect: 'all',
              color: 'var(--ink)',
              fontWeight: 600,
            }}
          >
            {tempPassModal.pass}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => {
                navigator.clipboard?.writeText(tempPassModal.pass);
                setTempPassModal({ open: false, email: '', pass: '' });
              }}
            >
              Copy &amp; Done
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
