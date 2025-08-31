"use client";

import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

type Step =
    | "details"
    | "provideTab"
    | "challenge"
    | "success"
    | "error"
    | "imageLoading"
    | "imageError";
type Challenge = {
    creatureCode: string;
    verificationToken: string;
};

export default function RegistrationFlow() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("details");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [tfoUsername, setTfoUsername] = useState("");
    const [tabId, setTabId] = useState("0");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [creatureImageUrl, setCreatureImageUrl] = useState<string | null>(
        null
    );
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");

    useEffect(() => {
        if (step === "challenge" && challenge?.creatureCode) {
            setIsImageLoading(true);
            setError("");
            const fetchImage = async () => {
                try {
                    // It now calls OUR OWN backend proxy route
                    const response = await fetch(
                        "/api/verification/creature-details",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                creatureCode: challenge.creatureCode,
                            }),
                        }
                    );
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error);
                    setCreatureImageUrl(data.imageUrl);
                } catch (err: any) {
                    Sentry.captureException(err);
                    setError("Failed to load creature image.");
                } finally {
                    setIsImageLoading(false);
                }
            };

            fetchImage();
        }
    }, [step, challenge]);

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/register/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    tfoUsername,
                    tabId: Number(tabId) || 0,
                }),
            });

            const data = await res.json();

            // validation errors
            if (!res.ok) {
                // special error cases
                if (data.errorCode === "EMPTY_OR_HIDDEN_TAB") {
                    setError(
                        `Your default tab did not contain creatures, please provide a different tab ID. Enter the Tab ID from your TFO tab's URL. For example, if the URL is ".../tab/username/tab_name/12345/1/...", your Tab ID is 12345.`
                    );
                    alert("Your default tab did not contain creatures");
                    setStep("provideTab");
                } else if (data.errorCode === "NO_ACCOUNT_FOUND") {
                    setError("No TFO account was located with that username");
                    alert("No TFO account was located with that username");
                }

                setError(data.error);
            } else {
                setChallenge(data);
                setCreatureImageUrl(null);
                setStep("challenge");
            }
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/register/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setError("");
            setStep("success");
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full text-center max-w-lg bg-ebena-lavender border-pompaca-purple shadow-lg">
            <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                    {step === "details" && "Enter your details"}
                    {step === "provideTab" && "Enter a tab ID"}
                    {(step === "challenge" ||
                        step === "imageLoading" ||
                        step === "imageError") &&
                        "Verify ownership of your TFO account"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <p className="text-red-500 text-center mb-4">{error}</p>
                )}

                {(step === "details" || step === "provideTab") && (
                    <form onSubmit={handleStart} className="space-y-4">
                        {step === "details" ? (
                            <>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-barely-lilac"
                                />
                                <Input
                                    type="text"
                                    placeholder="TFO Username"
                                    value={tfoUsername}
                                    onChange={(e) =>
                                        setTfoUsername(e.target.value)
                                    }
                                    required
                                    className="bg-barely-lilac"
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    className="bg-barely-lilac"
                                />
                                <div className="w-full items-center text-dusk-purple font-light text-sm text-center">
                                    <p>
                                        Note: Your password must be at least 12
                                        characters long and contain at least one
                                        letter, one number, and one special
                                        character (e.g. !@#$%^&*){" "}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="tab-id">TFO Tab ID</Label>
                                <Input
                                    id="tab-id"
                                    type="number"
                                    value={tabId}
                                    onChange={(e) => setTabId(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading
                                ? "Checking..."
                                : "Continue to Verification"}
                        </Button>
                    </form>
                )}

                {(step === "challenge" ||
                    step === "imageLoading" ||
                    step === "imageError") &&
                    challenge && (
                        <div className="text-center space-y-4">
                            {step === "imageLoading" && (
                                <Loader2 className="animate-spin mx-auto" />
                            )}
                            <p>
                                Please go to The Final Outpost and rename this
                                creature:{" "}
                                {creatureImageUrl && (
                                    <a
                                        href={`https://finaloutpost.net/view/${challenge.creatureCode}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="View on The Final Outpost"
                                    >
                                        <img
                                            src={creatureImageUrl}
                                            alt={`Image of ${challenge.creatureCode}`}
                                            className="max-w-xs mx-auto rounded-md shadow-md border-2 border-pompaca-purple"
                                        />
                                    </a>
                                )}
                                {step === "imageError" && (
                                    <p className="text-yellow-500">
                                        Failed to load creature image. You can
                                        still proceed with the text instructions
                                        below.
                                    </p>
                                )}{" "}
                                with the code:
                            </p>
                            <div className="bg-ebena-lavender p-2 rounded font-mono text-lg">
                                {challenge.creatureCode}
                            </div>
                            <p>
                                to the following exact name (you can copy and
                                paste it):
                            </p>
                            <div className="bg-ebena-lavender p-2 rounded font-mono text-lg">
                                {challenge.verificationToken}
                            </div>
                            <p className="text-sm text-dusk-purple">
                                Once you have renamed the creature, click the
                                button below. The token will expire in 15
                                minutes. (After this process, you can change the
                                name back to what it was before or un-name it if
                                you want.)
                            </p>
                            <Button onClick={handleComplete} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="animate-spin mr-2" />
                                ) : null}
                                Verify Creature Name
                            </Button>
                        </div>
                    )}

                {step === "success" && (
                    <div className="text-center text-green-600 font-bold">
                        {feedbackMessage}
                    </div>
                )}

                {(step === "challenge" || step === "error") &&
                    feedbackMessage && (
                        <div className="text-center text-red-500 mt-4">
                            {feedbackMessage}
                        </div>
                    )}
            </CardContent>
        </Card>
    );
}
