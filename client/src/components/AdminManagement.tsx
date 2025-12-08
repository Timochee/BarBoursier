import { useState } from 'react';
import type { Admin } from 'shared';
import { Modal, ModalHeader, ModalFooter } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminManagementProps {
  admins: Admin[];
  isLoading: boolean;
  currentUserEmail: string;
  onClose: () => void;
  onAdd: (email: string, name: string) => Promise<boolean>;
  onRemove: (id: number) => Promise<boolean>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function AdminManagement({
  admins,
  isLoading,
  currentUserEmail,
  onClose,
  onAdd,
  onRemove,
  onSuccess,
  onError,
}: AdminManagementProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<Admin | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !name.trim()) {
      onError('Email and name are required');
      return;
    }

    setIsSubmitting(true);
    const success = await onAdd(email.trim(), name.trim());
    setIsSubmitting(false);

    if (success) {
      onSuccess(`${name.trim()} has been added as admin`);
      setEmail('');
      setName('');
    }
  };

  const handleRemove = async () => {
    if (!adminToRemove) return;

    setIsSubmitting(true);
    const success = await onRemove(adminToRemove.id);
    setIsSubmitting(false);

    if (success) {
      onSuccess(`${adminToRemove.name} has been removed as admin`);
    }
    setAdminToRemove(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Modal onClose={onClose} maxWidth="lg" ariaLabelledBy="admin-management-title">
        <ModalHeader
          title="Manage Admins"
          subtitle="Add or remove admin access"
          titleId="admin-management-title"
          onClose={onClose}
          icon={
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          }
        />

        <div className="p-6 max-h-[60vh] overflow-auto">
          {/* Add Admin Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Add New Admin
            </h3>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                disabled={isSubmitting}
              />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || !name.trim()}
                className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50"
                style={{ background: '#8b5cf6' }}
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>

          {/* Admin List */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Current Admins ({admins.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No admins added yet
              </div>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{admin.name}</div>
                      <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                        {admin.email}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Added {formatDate(admin.addedAt)} by {admin.addedBy === currentUserEmail ? 'you' : admin.addedBy}
                      </div>
                    </div>
                    <button
                      onClick={() => setAdminToRemove(admin)}
                      disabled={isSubmitting}
                      className="ml-3 p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Remove admin"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={onClose}
            className="w-full btn py-2 rounded-lg font-medium"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            Close
          </button>
        </ModalFooter>
      </Modal>

      {/* Confirm Remove Dialog */}
      {adminToRemove && (
        <ConfirmDialog
          title="Remove Admin"
          message={`Are you sure you want to remove ${adminToRemove.name} (${adminToRemove.email}) from admins?`}
          confirmLabel="Remove"
          onConfirm={handleRemove}
          onCancel={() => setAdminToRemove(null)}
          variant="danger"
        />
      )}
    </>
  );
}
