'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/components/auth/SessionProvider';
import styles from './Transport.module.css';

interface RouteItem {
  id: number;
  name: string;
  vehicle_no: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  monthly_fee: number;
  stop_count: number;
  passenger_count: number;
}

interface StopItem {
  id: number;
  name: string;
  pickup_time: string | null;
  sort_order: number;
}

interface PassengerItem {
  student_id: number;
  admission_no: string;
  full_name: string;
  gender: string | null;
  class_name: string | null;
  section_name: string | null;
  stop_name: string | null;
  pickup_time: string | null;
  guardian_phone: string | null;
}

interface StudentOption {
  id: number;
  full_name: string;
  admission_no: string;
  class_name?: string;
  section_name?: string;
}

export default function TransportManagementPage() {
  const { showToast } = useToast();

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [passengers, setPassengers] = useState<PassengerItem[]>([]);
  const [stops, setStops] = useState<StopItem[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const { user, can } = useSession();
  const canManage = can('transport.manage');

  // Options
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Dialogs
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [routeForm, setRouteForm] = useState({
    id: null as number | null,
    name: '',
    vehicle_no: '',
    driver_name: '',
    driver_phone: '',
    monthly_fee: '0',
  });

  const [isStopsDialogOpen, setIsStopsDialogOpen] = useState(false);
  const [newStopForm, setNewStopForm] = useState({
    name: '',
    pickup_time: '',
  });

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    student_id: '',
    stop_id: '',
  });

  // Confirmation dialogs
  const [studentToUnassign, setStudentToUnassign] = useState<PassengerItem | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<RouteItem | null>(null);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingStop, setSubmittingStop] = useState(false);
  const [deletingStopId, setDeletingStopId] = useState<number | null>(null);

  // Request counter to avoid race conditions when switching routes quickly
  const rosterReqSeq = useRef(0);

  const selectedRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) ?? null;
  }, [routes, selectedRouteId]);

  // Load students for assignment if manager
  useEffect(() => {
    if (canManage) {
      fetch('/api/students?pageSize=200')
        .then((res) => res.json())
        .then((sd) => setStudents(sd.items || []))
        .catch(() => {});
    }
  }, [canManage]);

  // Stable loadRoutes function that has NO dependency on selectedRoute
  const loadRoutes = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoadingRoutes(true);
    }
    try {
      const res = await fetch('/api/transport/routes');
      if (res.ok) {
        const d = await res.json();
        const rList: RouteItem[] = d.routes || [];
        setRoutes(rList);
        setSelectedRouteId((prev) => {
          if (prev !== null && rList.some((r) => r.id === prev)) {
            return prev;
          }
          return rList[0]?.id ?? null;
        });
      }
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  // Load roster and stops for a route
  const loadRoster = useCallback(async (routeId: number, opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoadingRoster(true);
    }
    const seq = ++rosterReqSeq.current;

    try {
      const [rosterRes, stopsRes] = await Promise.all([
        fetch(`/api/transport/routes/${routeId}/roster`),
        fetch(`/api/transport/routes/${routeId}/stops`),
      ]);

      if (seq !== rosterReqSeq.current) return; // Outdated request

      if (rosterRes.ok) {
        const d = await rosterRes.json();
        setPassengers(d.passengers || []);
      }
      if (stopsRes.ok) {
        const sd = await stopsRes.json();
        setStops(sd.stops || []);
      }
    } finally {
      if (seq === rosterReqSeq.current) {
        setLoadingRoster(false);
      }
    }
  }, []);

  // Load routes on mount
  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Load roster when selectedRouteId changes
  useEffect(() => {
    if (selectedRouteId !== null) {
      loadRoster(selectedRouteId);
    } else {
      setPassengers([]);
      setStops([]);
    }
  }, [selectedRouteId, loadRoster]);

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const isEdit = routeForm.id !== null;
      const url = isEdit ? `/api/transport/routes/${routeForm.id}` : '/api/transport/routes';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save route');

      showToast(isEdit ? 'Route updated successfully.' : 'Route created successfully.', 'success');
      setIsRouteDialogOpen(false);
      await loadRoutes({ silent: true });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving route');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;
    setFormError('');
    setSubmittingStop(true);
    try {
      const res = await fetch(`/api/transport/routes/${selectedRoute.id}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStopForm,
          sort_order: stops.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add stop');

      showToast('Stop added successfully.', 'success');
      setNewStopForm({ name: '', pickup_time: '' });
      await Promise.all([
        loadRoster(selectedRoute.id, { silent: true }),
        loadRoutes({ silent: true }),
      ]);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error adding stop');
    } finally {
      setSubmittingStop(false);
    }
  };

  const handleDeleteStop = async (stopId: number) => {
    if (!selectedRoute) return;
    setDeletingStopId(stopId);
    setFormError('');
    try {
      const res = await fetch(`/api/transport/routes/${selectedRoute.id}/stops/${stopId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete stop', 'error');
        setFormError(data.error || 'Failed to delete stop');
        return;
      }
      showToast('Stop deleted.', 'info');
      await Promise.all([
        loadRoster(selectedRoute.id, { silent: true }),
        loadRoutes({ silent: true }),
      ]);
    } catch (err) {
      showToast('Connection error deleting stop.', 'error');
    } finally {
      setDeletingStopId(null);
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/transport/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: assignForm.student_id,
          route_id: selectedRoute.id,
          stop_id: assignForm.stop_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign student');

      showToast('Student assigned to route.', 'success');
      setIsAssignDialogOpen(false);
      setAssignForm({ student_id: '', stop_id: '' });
      await Promise.all([
        loadRoster(selectedRoute.id, { silent: true }),
        loadRoutes({ silent: true }),
      ]);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error assigning student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmUnassign = async () => {
    if (!studentToUnassign || !selectedRoute) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/transport/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentToUnassign.student_id, route_id: null }),
      });
      if (res.ok) {
        showToast(`Removed ${studentToUnassign.full_name} from route.`, 'info');
        setStudentToUnassign(null);
        await Promise.all([
          loadRoster(selectedRoute.id, { silent: true }),
          loadRoutes({ silent: true }),
        ]);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to remove student.', 'error');
      }
    } catch {
      showToast('Network error removing student.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteRoute = async () => {
    if (!routeToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/transport/routes/${routeToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Cannot delete route.', 'error');
        return;
      }
      showToast('Route deleted successfully.', 'info');
      setRouteToDelete(null);
      await loadRoutes({ silent: true });
    } catch {
      showToast('Error deleting route.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const passengerColumns: Column<PassengerItem>[] = [
    { key: 'admission_no', label: 'Adm No.', render: (p) => <strong>{p.admission_no}</strong> },
    { key: 'full_name', label: 'Student Name' },
    {
      key: 'class_name',
      label: 'Class / Sec',
      render: (p) => (p.class_name ? `${p.class_name} (${p.section_name || 'A'})` : '—'),
    },
    { key: 'stop_name', label: 'Designated Stop', render: (p) => p.stop_name || 'Main Gate' },
    { key: 'pickup_time', label: 'Pickup Time', render: (p) => p.pickup_time || '—' },
    ...(user.role !== 'parent' && user.role !== 'student'
      ? [{ key: 'guardian_phone', label: 'Emergency Contact', render: (p: PassengerItem) => p.guardian_phone || '—' }]
      : []),
    ...(canManage
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (p: PassengerItem) => (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStudentToUnassign(p)}
              >
                Remove
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="School Transport Management"
        description="Bus routes, designated pickup stops, and student passenger rosters."
        actions={
          canManage && (
            <Button
              variant="primary"
              onClick={() => {
                setRouteForm({
                  id: null,
                  name: '',
                  vehicle_no: '',
                  driver_name: '',
                  driver_phone: '',
                  monthly_fee: '1500',
                });
                setFormError('');
                setIsRouteDialogOpen(true);
              }}
            >
              + Add New Route
            </Button>
          )
        }
      />

      <div className={styles.layoutGrid}>
        {/* Left: Routes List */}
        <div className={styles.routePanel}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
            Routes ({routes.length})
          </h2>

          <div className={styles.routeList}>
            {routes.map((r) => (
              <button
                type="button"
                key={r.id}
                className={`${styles.routeCard} ${selectedRouteId === r.id ? styles.activeRouteCard : ''}`}
                onClick={() => setSelectedRouteId(r.id)}
              >
                <div className={styles.routeHeader}>
                  <span className={styles.routeName}>{r.name}</span>
                  <span className={styles.routeBadge}>{r.passenger_count} riders</span>
                </div>
                <div className={styles.routeMeta}>
                  <span>Vehicle: {r.vehicle_no || 'Standard Bus'}</span>
                  <span>Driver: {r.driver_name || '—'} {r.driver_phone ? `(${r.driver_phone})` : ''}</span>
                  <span>Fee: NPR {r.monthly_fee}/mo &bull; {r.stop_count} stops</span>
                </div>
              </button>
            ))}
            {routes.length === 0 && !loadingRoutes && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
                No transport routes registered yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: Selected Route Detail & Passenger Roster */}
        <div className={styles.rosterPanel}>
          {selectedRoute ? (
            <>
              <div className={styles.rosterHeader}>
                <div className={styles.rosterTitleBlock}>
                  <h2>{selectedRoute.name} &bull; Passenger Roster</h2>
                  <div className={styles.rosterMeta}>
                    Vehicle: <strong>{selectedRoute.vehicle_no || 'Standard Bus'}</strong> &bull;
                    Driver: <strong>{selectedRoute.driver_name || 'Unassigned'}</strong> {selectedRoute.driver_phone ? `(${selectedRoute.driver_phone})` : ''} &bull;
                    Fee: NPR {selectedRoute.monthly_fee}
                  </div>
                </div>

                <div className={styles.rosterActions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFormError('');
                      setIsStopsDialogOpen(true);
                    }}
                  >
                    Stops ({stops.length})
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRouteForm({
                            id: selectedRoute.id,
                            name: selectedRoute.name,
                            vehicle_no: selectedRoute.vehicle_no || '',
                            driver_name: selectedRoute.driver_name || '',
                            driver_phone: selectedRoute.driver_phone || '',
                            monthly_fee: String(selectedRoute.monthly_fee),
                          });
                          setFormError('');
                          setIsRouteDialogOpen(true);
                        }}
                      >
                        Edit Route
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRouteToDelete(selectedRoute)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {canManage && (
                    <a
                      href={`/api/transport/routes/${selectedRoute.id}/export`}
                      download
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="secondary" size="sm">
                        Export CSV &darr;
                      </Button>
                    </a>
                  )}
                  {canManage && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setFormError('');
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      + Assign Student
                    </Button>
                  )}
                </div>
              </div>

              <DataTable
                columns={passengerColumns}
                rows={passengers}
                loading={loadingRoster}
                emptyText="No students assigned to this route yet."
              />
            </>
          ) : (
            <p style={{ color: 'var(--ink-soft)', padding: 'var(--sp-4)' }}>
              Select a route to view its passenger roster and designated stops.
            </p>
          )}
        </div>
      </div>

      {/* Add / Edit Route Dialog */}
      <Dialog
        open={isRouteDialogOpen}
        onClose={() => {
          setIsRouteDialogOpen(false);
          setFormError('');
        }}
        title={routeForm.id ? 'Edit Transport Route' : 'Add New Transport Route'}
      >
        <form onSubmit={handleSaveRoute} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}
          <Field label="Route Name *" required>
            <input
              type="text"
              required
              value={routeForm.name}
              onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
              placeholder="e.g. Bayarghari - Bheerkot Line 1"
            />
          </Field>
          <div className={styles.formGrid}>
            <Field label="Vehicle Number">
              <input
                type="text"
                value={routeForm.vehicle_no}
                onChange={(e) => setRouteForm({ ...routeForm, vehicle_no: e.target.value })}
                placeholder="e.g. Ga 1 Kha 4022"
              />
            </Field>
            <Field label="Monthly Fee (NPR) *" required>
              <input
                type="number"
                min="0"
                required
                value={routeForm.monthly_fee}
                onChange={(e) => setRouteForm({ ...routeForm, monthly_fee: e.target.value })}
              />
            </Field>
          </div>
          <div className={styles.formGrid}>
            <Field label="Driver Name">
              <input
                type="text"
                value={routeForm.driver_name}
                onChange={(e) => setRouteForm({ ...routeForm, driver_name: e.target.value })}
                placeholder="e.g. Ram Bahadur Thapa"
              />
            </Field>
            <Field label="Driver Phone">
              <input
                type="tel"
                value={routeForm.driver_phone}
                onChange={(e) => setRouteForm({ ...routeForm, driver_phone: e.target.value })}
                placeholder="e.g. 9846000000"
              />
            </Field>
          </div>
          <div className={styles.dialogActions}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsRouteDialogOpen(false);
                setFormError('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Route'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Manage Stops Dialog */}
      <Dialog
        open={isStopsDialogOpen}
        onClose={() => {
          setIsStopsDialogOpen(false);
          setFormError('');
        }}
        title={`Designated Stops: ${selectedRoute?.name}`}
      >
        <div className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}

          {canManage && (
            <form onSubmit={handleAddStop} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-3)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: '0 0 var(--sp-2) 0' }}>Add Stop</h3>
              <div className={styles.formGrid}>
                <Field label="Stop Name *" required>
                  <input
                    type="text"
                    required
                    value={newStopForm.name}
                    onChange={(e) => setNewStopForm({ ...newStopForm, name: e.target.value })}
                    placeholder="e.g. Dhaubadi Chowk"
                  />
                </Field>
                <Field label="Morning Pickup Time">
                  <input
                    type="text"
                    value={newStopForm.pickup_time}
                    onChange={(e) => setNewStopForm({ ...newStopForm, pickup_time: e.target.value })}
                    placeholder="e.g. 08:45 AM"
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
                <Button variant="primary" size="sm" type="submit" disabled={submittingStop}>
                  {submittingStop ? 'Adding...' : '+ Add Stop'}
                </Button>
              </div>
            </form>
          )}

          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: 'var(--sp-2) 0 0 0' }}>Current Stops</h3>
          <div className={styles.stopList}>
            {stops.map((s, idx) => (
              <div key={s.id} className={styles.stopItem}>
                <div>
                  <strong>{idx + 1}. {s.name}</strong>
                  {s.pickup_time && <span style={{ marginLeft: '8px', color: 'var(--ink-soft)', fontSize: '13px' }}>({s.pickup_time})</span>}
                </div>
                {canManage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={deletingStopId === s.id}
                    onClick={() => handleDeleteStop(s.id)}
                  >
                    {deletingStopId === s.id ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </div>
            ))}
            {stops.length === 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
                No stops added to this route yet.
              </p>
            )}
          </div>

          <div className={styles.dialogActions}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsStopsDialogOpen(false);
                setFormError('');
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Assign Student Dialog */}
      <Dialog
        open={isAssignDialogOpen}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setFormError('');
        }}
        title={`Assign Student to ${selectedRoute?.name}`}
      >
        <form onSubmit={handleAssignStudent} className={styles.dialogForm}>
          {formError && <div className={styles.errorBanner}>{formError}</div>}
          <Field label="Select Student *" required>
            <select
              required
              value={assignForm.student_id}
              onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })}
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.admission_no})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Designated Stop">
            <select
              value={assignForm.stop_id}
              onChange={(e) => setAssignForm({ ...assignForm, stop_id: e.target.value })}
            >
              <option value="">-- Main Route Stop --</option>
              {stops.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.pickup_time ? `(${st.pickup_time})` : ''}
                </option>
              ))}
            </select>
          </Field>

          <div className={styles.dialogActions}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setFormError('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign to Route'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog: Unassign Student */}
      <Dialog
        open={Boolean(studentToUnassign)}
        onClose={() => setStudentToUnassign(null)}
        title="Remove Student from Transport"
      >
        <div className={styles.dialogForm}>
          <p style={{ margin: 0, color: 'var(--ink)' }}>
            Are you sure you want to remove <strong>{studentToUnassign?.full_name}</strong> ({studentToUnassign?.admission_no}) from this transport route?
          </p>
          <div className={styles.dialogActions}>
            <Button
              variant="secondary"
              type="button"
              disabled={submitting}
              onClick={() => setStudentToUnassign(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={submitting}
              onClick={handleConfirmUnassign}
            >
              {submitting ? 'Removing...' : 'Confirm Removal'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog: Delete Route */}
      <Dialog
        open={Boolean(routeToDelete)}
        onClose={() => setRouteToDelete(null)}
        title="Delete Transport Route"
      >
        <div className={styles.dialogForm}>
          <p style={{ margin: 0, color: 'var(--ink)' }}>
            Are you sure you want to delete route <strong>{routeToDelete?.name}</strong>?
          </p>
          {routeToDelete && routeToDelete.passenger_count > 0 && (
            <div className={styles.errorBanner}>
              This route currently has {routeToDelete.passenger_count} assigned passenger(s). You must unassign them before deleting the route.
            </div>
          )}
          <div className={styles.dialogActions}>
            <Button
              variant="secondary"
              type="button"
              disabled={submitting}
              onClick={() => setRouteToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={submitting || Boolean(routeToDelete && routeToDelete.passenger_count > 0)}
              onClick={handleConfirmDeleteRoute}
            >
              {submitting ? 'Deleting...' : 'Delete Route'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
