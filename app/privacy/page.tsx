import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
    return (
        <div className="bg-barely-lilac text-pompaca-purple min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Privacy Policy */}
                <Card className="bg-ebena-lavender w-80">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">TFO.creaturetracker Privacy Policy </CardTitle>
                        <CardDescription className="text-xl">Last Updated: 8/15/2025</CardDescription>
                    </CardHeader>
                    <CardContent>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}