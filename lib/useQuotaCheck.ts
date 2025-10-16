"use client";

import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase"; // client-side db instance

export type UserPlan = "visitor" | "free" | "pro";
export type QuotaState = {
    loading: boolean;
    remaining: number | null;
    plan: UserPlan;
    refetch: () => Promise<void>;
};

const WEEKLY_LIMIT = 5;

/**
 * React hook to track the user"s current quota status.
 * Uses an onSnapshot listener for real-time updates from Firestore.
 */
export function useQuotaCheck(user: any): QuotaState {
    const [loading, setLoading] = useState(true);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [plan, setPlan] = useState<UserPlan>("visitor");

    // Manually checks the visitor quota state (1 free try)
    const checkVisitorQuota = () => {
        const used = localStorage.getItem("hasUsedFreeTrial");
        const left = used ? 0 : 1;
        setRemaining(left);
        setPlan("visitor");
        setLoading(false);
    }
    
    // The refetch function is a placeholder; the onSnapshot listener handles real-time updates.
    const refetchQuota = useCallback(async () => {
        // Since onSnapshot provides real-time updates, manual refetching is usually unnecessary.
        // We log a warning but return a promise to maintain the expected interface.
        console.warn("Quota refetch called. Waiting for onSnapshot update...");
        return Promise.resolve();
    }, []);


    useEffect(() => {
        setLoading(true);
        
        if (!user) {
            checkVisitorQuota();
            return; // No subscription needed for visitors
        }

        // 1. Get the reference to the user"s usage document
        const userUsageRef = doc(db, "users", user.uid, "meta", "usage");
        
        // 2. Set up the real-time listener (onSnapshot)
        const unsubscribe = onSnapshot(userUsageRef, (snapshot) => {
            let currentCount = 0;
            let currentPlan: UserPlan = "free";

            if (snapshot.exists()) {
                const data = snapshot.data();
                currentCount = data.weeklyCount ?? 0;
                currentPlan = data.plan as UserPlan || "free";
                
                if (currentPlan === "pro") {
                    setRemaining(Infinity);
                    setPlan("pro");
                } else {
                    const left = Math.max(WEEKLY_LIMIT - currentCount, 0);
                    setRemaining(left);
                    setPlan("free");
                }
            } else {
                 // Document doesn"t exist yet, treat as a new user (free plan, full quota)
                setRemaining(WEEKLY_LIMIT);
                setPlan("free");
            }
            
            setLoading(false);

        }, (error) => {
            console.error("[QuotaCheck] Error setting up listener:", error);
            setPlan("free"); 
            setRemaining(WEEKLY_LIMIT);
            setLoading(false);
        });

        // Cleanup the subscription when the component unmounts or user changes
        return () => unsubscribe();
        
    }, [user]); 

    return { loading, remaining, plan, refetch: refetchQuota };
}
