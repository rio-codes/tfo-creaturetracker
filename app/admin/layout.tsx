import { NavLink } from "@/components/custom-layout-elements/nav-link";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-6 p-10 pb-16 bg-barely-lilac dark:bg-deep-purple min-h-screen">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight text-pompaca-purple dark:text-purple-300">
                    Admin Dashboard
                </h2>
                <p className="text-dusk-purple dark:text-purple-400">
                    Manage users, content, and application settings.
                </p>
            </div>
            <Separator className="my-6 bg-pompaca-purple/20" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        <NavLink href="/admin">Metrics</NavLink>
                        <NavLink href="/admin/users">Users</NavLink>
                        <NavLink href="/admin/creatures">Creatures</NavLink>
                        <NavLink href="/admin/breeding-pairs">Breeding Pairs</NavLink>
                        <NavLink href="/admin/research-goals">Research Goals</NavLink>
                        <NavLink href="/admin/audit-log">Audit Log</NavLink>
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-4xl">{children}</div>
            </div>
        </div>
    );
}
