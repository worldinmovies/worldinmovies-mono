import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/config";

interface Status {
    "fetched": string,
    "total": string,
    "percentageDone": number
}

export const useStatus = () => {
    const [status, setStatus] = useState<Status>();

    useEffect(() => {
        fetch(`${getBackendUrl()}/status`)
        .then(response => response.json())
        .then(response => setStatus(response))
        .catch(error => {
            console.error(error);
            toast.error(`Call to ${getBackendUrl()}/status failed due to ${JSON.stringify(error)}`);
        })

    }, [])
    return {
        status
    };
}