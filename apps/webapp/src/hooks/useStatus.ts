import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/config";

interface Status {
    "fetched": string,
    "total": string,
    "percentageDone": number
}

export const useStatus = () => {
    const [status, setStatus] = useState<Status>();

    useEffect(() => {
        fetch(`${BACKEND_URL}/status`)
        .then(response => response.json())
        .then(response => setStatus(response))
        .catch(error => {
            console.error(error);
            toast.error(`Call to ${BACKEND_URL}/status failed due to ${JSON.stringify(error)}`);
        })

    }, [])
    return {
        status
    };
}