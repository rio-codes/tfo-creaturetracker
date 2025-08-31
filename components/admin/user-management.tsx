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

type User = {
    id: string;
    username: string | null;
    email: string | null;
    role: string;
};

export function UserManagement({ initialUsers }: { initialUsers: User[] }) {
    const router = useRouter();
    const [users, setUsers] = useState(initialUsers);
    const [loadingStates, setLoadingStates] = useState<{
        [key: string]: boolean;
    }>({});

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
            console.error(error);
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
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
