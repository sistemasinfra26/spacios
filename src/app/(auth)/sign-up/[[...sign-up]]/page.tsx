import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AuthCheck() {
    const { userId } = await auth();
    if (userId) {
        redirect("/dashboard");
    }
    return null;
}

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Suspense fallback={null}>
                <AuthCheck />
            </Suspense>

            <Suspense
                fallback={
                    <div className="text-sm text-muted animate-pulse">
                        Cargando registro...
                    </div>
                }
            >
                <SignUp
                    forceRedirectUrl="/dashboard"
                    fallbackRedirectUrl="/dashboard"
                    signInUrl="/sign-in"
                    appearance={{
                        elements: {
                            card: "bg-card border border-border shadow-lg rounded-2xl",
                        },
                    }}
                />
            </Suspense>
        </div>
    );
}