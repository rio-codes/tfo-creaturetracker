import { getAllUsers } from "@/lib/admin-data";
import { UserManagement } from "@/components/admin/user-management";
import { CreateCreatureForm } from "@/components/admin/create-creature-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default async function AdminPage() {
    const users = await getAllUsers();

    return (
        <div className="w-full flex-1 bg-barely-lilac dark:bg-deep-purple">
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-6 text-pompaca-purple dark:text-purple-300">
                    Admin Dashboard
                </h1>
                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="gap-x-2 ">
                        <TabsTrigger
                            value="users"
                            className="bg-ebena-lavender dark:bg-midnight-purple dark:text-purple-300 border-1 border-pompaca-purple px-3 drop-shadow-gray-500 drop-shadow-sm"
                        >
                            User Management
                        </TabsTrigger>
                        <TabsTrigger
                            value="create-creature"
                            className="bg-ebena-lavender dark:bg-midnight-purple dark:text-purple-300 border-1 border-pompaca-purple px-3 drop-shadow-gray-500 drop-shadow-sm"
                        >
                            Create Test Creature
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="users" className="mt-4">
                        <Card className="bg-ebena-lavender dark:bg-pompaca-purple drop-shadow-gray-500 drop-shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-pompaca-purple dark:text-purple-300">
                                    Users
                                </CardTitle>
                                <CardDescription className="text-dusk-purple dark:text-purple-400">
                                    View and manage user roles.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserManagement initialUsers={users} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="create-creature" className="mt-4">
                        <Card className="bg-ebena-lavender dark:bg-pompaca-purple drop-shadow-gray-500 drop-shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-pompaca-purple dark:text-purple-300">
                                    Create Creature for Testing
                                </CardTitle>
                                <CardDescription className="text-dusk-purple dark:text-purple-400">
                                    Create a creature with specific genes and
                                    add it to your collection.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <CreateCreatureForm />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
