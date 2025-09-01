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

export function UserManagement({ initialUsers }) {
    const router = useRouter();
    const [users, setUsers] = useState(initialUsers);
    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

    const handleRoleChange = async (userId, newRole) => {
        setIsLoading(prev => ({ ...prev, [userId]: true }));
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error("Failed to update role.");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update role.");
        } finally {
            setIsLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        setIsLoading(prev => ({ ...prev, [userId]: true }));
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update status.");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update status.");
        } finally {
            setIsLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow className="border-pompaca-purple/50 dark:border-purple-400/50">
                    <TableHead className="text-pompaca-purple dark:text-purple-300">Username</TableHead>
                    <TableHead className="text-pompaca-purple dark:text-purple-300">Email</TableHead>
                    <TableHead className="text-pompaca-purple dark:text-purple-300">Role</TableHead>
                    <TableHead className="text-pompaca-purple dark:text-purple-300">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id} className="text-pompaca-purple dark:text-purple-300 border-pompaca-purple/50 dark:border-purple-400/50">
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.id, newRole)} disabled={isLoading[user.id]}>
                                <SelectTrigger className="w-[120px] bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Select value={user.status} onValueChange={(newStatus) => handleStatusChange(user.id, newStatus)} disabled={isLoading[user.id]}>
                                <SelectTrigger className="w-[120px] bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                    <SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}