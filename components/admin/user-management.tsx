"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

type User = {
    id: string;
    username: string | null;
    email: string | null;
    role: string;
    status: "active" | "suspended";
    createdAt: Date | null;
};

export function UserManagement({ initialUsers }: { initialUsers: User[] }) {
    const router = useRouter();
    const [users, setUsers] = useState(initialUsers);
    const [loadingStates, setLoadingStates] = useState<{
        [key: string]: boolean;
    }>({});

    const handleStatusChange = async (userId: string, newStatus: string) => {
        setLoadingStates((prev) => ({ ...prev, [userId]: true }));
        try {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update status.");
            }

            setUsers(currentUsers =>
                currentUsers.map(u => u.id === userId ? { ...u, status: newStatus as any } : u)
            );
            router.refresh();
        } catch (error) {
            Sentry.captureException(error);
            alert((error as Error).message);
        } finally {
            setLoadingStates((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setLoadingStates((prev) => ({ ...prev, [userId]: true }));
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update role.");
            }

            // Update local state to reflect the change immediately
            setUsers((currentUsers) =>
                currentUsers.map((u) =>
                    u.id === userId ? { ...u, role: newRole } : u
                )
            );
            router.refresh(); // Re-fetch server data in the background
        } catch (error) {
            Sentry.captureException(error);
            alert((error as Error).message);
        } finally {
            setLoadingStates((prev) => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={user.role}
                                    onValueChange={(value) =>
                                        handleRoleChange(user.id, value)
                                    }
                                    disabled={loadingStates[user.id]}
                                >
                                    <SelectTrigger className="w-[120px] bg-barely-lilac text-pompaca-purple">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-barely-lilac text-pompaca-purple">
                                        <SelectItem
                                            value="user"
                                            className="bg-barely-lilac text-pompaca-purple"
                                        >
                                            User
                                        </SelectItem>
                                        <SelectItem
                                            value="admin"
                                            className="bg-barely-lilac text-pompaca-purple"
                                        >
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {loadingStates[user.id] && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {user.status}
                            </span>
                        </TableCell>
                        <TableCell>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                                disabled={loadingStates[user.id]}
                            >
                                {user.status === 'active' ? 'Suspend' : 'Reinstate'}
                            </Button>
                        </TableCell>
                        <TableCell>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
