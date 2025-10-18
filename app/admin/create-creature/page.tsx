import { CreateCreatureForm } from '@/components/custom-forms/create-creature-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CreateCreaturePage() {
    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
            <CardHeader>
                <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                    Create Creature
                </CardTitle>
                <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                    Use this form to create a new creature in the database.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CreateCreatureForm />
            </CardContent>
        </Card>
    );
}
